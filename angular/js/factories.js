var shopFactories = angular.module('shopFactories', []);

shopFactories.factory('Cart',function($rootScope){
	
	/* Обьект для работы с корзиной */
	
	var items = [];		// кэш массива товаров в корзине
	
	var pullFromStorage = function(){
		
		/* получаем данные о товарах в корзине из local storage */
		
		// выйдем если в items уже загружены данные о товарах 
		if(items.length !== 0) return;
		
		// получим данные из local storage
		if(localStorage.getItem('cartAngular')) {
		
			items = JSON.parse(localStorage.getItem('cartAngular'));
		}
		else{
			items = [];
		}		
			
	}

	var pushToStorage = function(){
		
		/* сохраним корзину в local storage */
				
		localStorage.setItem('cartAngular', JSON.stringify(items));	
			
	}

	var getUid = function(){
	
		/* генерация уникального id для каждой позиции в корзине */
		
		var uid,
			isUniq = false;
		
		while(isUniq === false){
			
			uid = Math.random() * 10000;
		
			_.findWhere(items, {uid: uid}) === undefined ? isUniq = true : isUniq = false;	
		}	
		
		return parseInt( uid.toFixed(0) );			
	};
	
	var add = function(item){
	
		/* добавление в корзину */	
		
		pullFromStorage();
		
		item.uid = getUid();
		items.push(item);
		
		pushToStorage();
		
		$rootScope.$broadcast('cart:updated');	
	
	};
	
	var getItems = function(){
	
		/* получить товары из корзины */	
		
		pullFromStorage();
		
		return items;
		
	};
	
	var total = function(){

		/* расчет общей суммы товаров в корзине */
		
		var key,
			total = 0;
		
		pullFromStorage();
		
		if(items.length < 1) return 0;
		
		for(key in items){			
			
			total += items[key].quantity * items[key].baseProduct.price;
		}
		
		return total;	
	};
	
	var remove = function(itemUid){
		
		/* удаление товара из корзины */	
		
		var key;
		
		for(key in items){

			if(items[key].uid === itemUid){

				items.splice(key,1);
			}
		}
		
		pushToStorage();
		
		$rootScope.$broadcast('cart:updated');
			
	};

	var getItemsCounter = function(){
		
		/* сколько товаров в корзине? */
		
		pullFromStorage();
		
		return items.length;
			
	};
	
	return {
		add: add,
		getItems: getItems,
		total: total,
		remove: remove,
		getItemsCounter: getItemsCounter	
	};
	
});

shopFactories.factory('shopProfile',function($http, $q, dataProvider){
	
	/* Обьект хранящий настройки магазина */
	
	var optionsCache = {};
	
	var getOptions = function(){
		
		return optionsCache;

	};
	
	var load = function(){
		
		/* ф-я загружает настройки и возвращает promise */
		
		var defer = $q.defer();
		
		if( Object.getOwnPropertyNames(optionsCache).length > 0 )
		{
			defer.resolve();	
			return defer.promise;
		}
		
		dataProvider.getData('profile').then(function(data){
			
			optionsCache = data;
			defer.resolve();	
					
		});
		
		return defer.promise;
	}
	
	return {
		getOptions: getOptions,
		load: load
	};	
	
});

shopFactories.factory('dataProvider', function($http, $q, shopConfig){
	
	/* Получение данных от Api */
	
	var apiLink = shopConfig.apiUrl;
		
	var getData = function(controller, params){
		
		/*
			Получение данных от Api сервера, вернем Promise обьект 
			
			controller - тип данных, которые мы хотим получить, в запросе идет после id магазина, например 
				api/v1/5266003/categories?...
				api/v1/5266003/products?...
				здесь контроллеры это categories и products
			params - параметры в виде обьекта, например {name: 'bob', lastname: 'bobster'} которые добавляются к
					 GET запросу	
		*/
		
		var defer = $q.defer(),
			paramString = '';

		// сформируем строку параметров, если таковые переданы
		if(params){
				
			for(key in params){
					
				if(params[key] !== null){
					paramString += '&' + key + '=' + params[key];
				}
					
			}
		}
		
		// запрос к api
		$http.jsonp(apiLink + controller + '?callback=JSON_CALLBACK' + paramString).success(function(data){
			
			defer.resolve(data);
			
		});
		
		return defer.promise;
		
	}	
	
	return {
		getData: getData
	}
	
});
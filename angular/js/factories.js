var shopFactories = angular.module('shopFactories', []);

shopFactories.factory('Cart',function($rootScope){
	
	var items = [];		// массив товаров в корзине
	
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
		
		/*
		itemUid = parseInt(itemUid); 	// изначально prodId имеет строковой тип, т.к значение берется 
												// из аттрибутов dom элемента
		*/		
		
		var key;
		
		for(key in items){

			if(items[key].uid === itemUid){

				items.splice(key,1);
			}
		}
		
		pushToStorage();
		
		$rootScope.$broadcast('cart:updated');
				
		console.log('removed totally...');		
			
	};

	var getItemsCounter = function(){
		
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

shopFactories.factory('shopProfile',function($http, $q){

	var optionsCache = {};
	
	var getOptions = function(){
		
		if( Object.getOwnPropertyNames(optionsCache).length > 0 ) return optionsCache;

	};
	
	var load = function(){
		
		var defer = $q.defer();
		
		if( Object.getOwnPropertyNames(optionsCache).length > 0 )
		{
			defer.resolve();	
			return defer.promise;
		}
		
		$http.jsonp('http://appdev.ecwid.com/api/v1/5266003/profile?callback=JSON_CALLBACK').
		success(function(data){
			
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
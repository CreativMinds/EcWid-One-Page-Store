var shopControllers = angular.module('shopControllers', []);

shopControllers.controller('mainCtrl', ['$scope', '$http', 'Cart', 'dataProvider', 
			   function($scope, $http, Cart, dataProvider){
	
	/* Контроллер главного окна, в котором находятся все остальные контроллеры */
	
	// узнаем кол-во товара в корзине
	$scope.cartItemsAmount = Cart.getItemsCounter();
	
	// будем обновлять кол-во товара по мере того как он добавляется и удаляется из корзины
	$scope.$on('cart:updated', function(event) {

    	$scope.cartItemsAmount = Cart.getItemsCounter();
   
	});
	
	// ф-я темплейта которая будет определять является ли категория root
	$scope.isRoot = function(item){
		return item.parentId === undefined;
	}
	
	// получим список всех категорий
	dataProvider.getData('categories').then(function(dataCategories){
	
		var categories = {},
			categoriesArray = [],
			key;
		
		// добавим каждому элементу категории свойство subCategories - массив в который положим обьекты дочерних
		// категорий
	
			// создадим свойство
			for(key in dataCategories){
				
				categories[ dataCategories[key].id ] = dataCategories[key];
				categories[ dataCategories[key].id ].subCategories = [];
			}
		
			// поместим в него данные
			for(key in dataCategories){
				
				if(dataCategories[key].parentId){
					
					categories[ dataCategories[key].parentId ].subCategories.push( dataCategories[key] );
				}
				
			}
		
		// обьект, содержащий обьекты категорий, сконвертируем в массив содержащий обьекты категорий,
		// делается это для того, чтобы иметь возможность применить к нему filter в ng-repeat
		for(key in categories){
			
			categoriesArray.push( categories[key] );
		}
		
		// и наконец сделаем категориии видимыми темплейтом
		$scope.categories = categoriesArray;
		
		console.log(categoriesArray);

	});
	

}]);

shopControllers.controller('productsCtrl', ['$scope', '$http', '$routeParams', 'dataProvider', 
			   function($scope, $http, $routeParams, dataProvider){
	
	/* Контроллер страницы с товарами */
	
	var subCategories = [],
		params = {};			// хранит доп параметры передаваемые в dataProvider
		
	// определим категорию, для которой нужно отобразить товары
	if($routeParams.category !== undefined) {
	
		params.category = $routeParams.category;
	
	}
	
	// вычленим суб категории текущей категории из массива хранящего все категории
	// эти суб категории мы будем отображать на странице
	$scope.$watch('categories',function(newValue, oldValue){
			
		$scope.subCategories = _.filter($scope.categories, function(item){
			
			// $routeParams.category может быть undefined для главной категории		
			return $routeParams.category == item.parentId;	
		});			

	});
	
	// загрузим товары
	dataProvider.getData('products', params).then(function(data){
		
		$scope.products = data;
	});
		
	
}]);

shopControllers.controller('productDetailsCtrl', ['$scope', '$routeParams','$http','Cart', 'dataProvider', 
			   function($scope, $routeParams, $http, Cart, dataProvider){
	
	/* Контроллер отвечает за отображение страницы с детальным описанием товара */
		
	var optionList = {},	// хранит опции товара, которые выбрал пользователь (например color: red, size: x)
		params = {};		// хранит доп параметры передаваемые в dataProvider
	
	$scope.productId = $routeParams.productId;
	$scope.quantity = 1;

	$scope.setOption = function(optName, optValue){
		
		// ф-я сохраняет опции товара, которые были выбраны пользователем/покупателем
		
		optionList[optName] = optValue;	
		
	};
	
	$scope.itemInCart = false;	// положен ли товар в корзину?

	$scope.addToCart = function(){
		
		// добавление товара в корзину
		
		var product = {};
		
		product.baseProduct = $scope.product;
		product.quantity = $scope.quantity;
		product.optionList = optionList;
		product.id = $scope.product.id;
		
		Cart.add(product);
		
		$scope.itemInCart = true;
		
	};
	
	// загрузим данные о товаре
	params.id = $routeParams.productId;

	dataProvider.getData('product', params).then(function(data){
		
		$scope.product = data;
	});
	
}]);

shopControllers.controller('cartCtrl', ['$scope', 'Cart', 
				function($scope, Cart){
	
	/* Контроллер отвечает за отображение корзины */
	
	// получим данные о товарах находящихся в корзине	
	$scope.cartItems = Cart.getItems();
	
	// узнаем общую стоимость товаров в корзине
	$scope.total = Cart.total();
	
	$scope.remove = function(itemUid){
	
		// ф-я удаления товара из корзины
		
		Cart.remove(itemUid);
		$scope.total = Cart.total();

	}
	
}]);
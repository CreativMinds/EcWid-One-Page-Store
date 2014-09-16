var shopControllers = angular.module('shopControllers', []);

shopControllers.controller('mainCtrl', ['$scope', '$http', 'Cart', function($scope, $http, Cart){
	
	$scope.cartItemsAmount = Cart.getItemsCounter();
	
	$scope.$on('cart:updated', function(event) {

     $scope.cartItemsAmount = Cart.getItemsCounter();
   
   });
	
	$http.jsonp('http://appdev.ecwid.com/api/v1/5266003/categories?callback=JSON_CALLBACK').success(function(data){
		
		var categories = {},
			categoriesArray = [],
			key;
		
		$scope.isRoot = function(item){
			return item.parentId === undefined;
		}
		
		// добавим каждому элементу категории свойство subCategories - массив в который положим обьекты дочерних
		// категорий
		for(key in data){
			
			categories[ data[key].id ] = data[key];
			categories[ data[key].id ].subCategories = [];
		}
		
		for(key in data){
			
			if(data[key].parentId){
				
				categories[ data[key].parentId ].subCategories.push( data[key] );
			}
			
		}
		
		// обьект, содержащий обьекты категорий сконвертируем в массив содержащий обьекты категорий,
		// чтобы иметь возможность применить к нему filter в ng-repeat
		for(key in categories){
			
			categoriesArray.push( categories[key] );
		}
		
		$scope.categories = categoriesArray;
		console.log('categories...');
		console.log($scope.categories);
		
	});
}]);

shopControllers.controller('productsCtrl', ['$scope', '$http', '$routeParams', function($scope, $http, $routeParams, Cache){
	
	var subCategories = [],
		reqUrl;
	
	// определим текущую категорию
	if(!currentCategory) var currentCategory = null;
	
	if($routeParams.category !== undefined) {
		
		currentCategory = $routeParams.category;
		reqUrl = 'http://appdev.ecwid.com/api/v1/5266003/products?callback=JSON_CALLBACK&category=' + currentCategory;

		// вычленим суб категории из массива хранящего все категории
		$scope.$watch('categories',function(newValue, oldValue){
			
			$scope.subCategories = _.filter($scope.categories, function(item){
							
				return currentCategory == item.parentId;	
			});			
			console.log('categories changed...');	
		});

		
	} else {
		 currentCategory = null;
		 reqUrl = 'http://appdev.ecwid.com/api/v1/5266003/products?callback=JSON_CALLBACK';
		 
		// вычленим суб категории из массива хранящего все категории
		$scope.$watch('categories', function(newValue, oldValue) {
		
			$scope.subCategories = _.filter($scope.categories, function(item){
								
					return undefined == item.parentId;	
			});	
			console.log('categories changed...');
         });		
	}
	
	console.log('cur category: ' + currentCategory);
	
	console.log('sub cats...');
	console.log($scope.subCategories);
	console.log('cats...');
	console.log($scope.categories);
	
	// загрузим товары категории, а также суб категории текущей категории и отобразим их
	
	$http.jsonp(reqUrl).success(function(data){
		
		console.log(data);

		$scope.products = data;
		
	});
	
	
}]);

shopControllers.controller('productDetailsCtrl', ['$scope', '$routeParams','$http','Cart', function($scope, $routeParams, $http, Cart){
	
	var optionList = {};
	
	$scope.productId = $routeParams.productId;
	
	$http.jsonp('http://appdev.ecwid.com/api/v1/5266003/product?callback=JSON_CALLBACK&id=' + $routeParams.productId).
	success(function(data){
		
		$scope.product = data;
	});
	
	$scope.quantity = 1;
	
	$scope.setOption = function(optName, optValue){
		
		optionList[optName] = optValue;	
		
		console.log('setting option: ' + optName + ' = ' + optValue);
		console.log(optionList);
	};
	
	$scope.itemInCart = false;
	
	$scope.addToCart = function(){
		
		var product = {};
		
		product.baseProduct = $scope.product;
		product.quantity = $scope.quantity;
		product.optionList = optionList;
		product.id = $scope.product.id;
		
		Cart.add(product);
		
		$scope.itemInCart = true;
		
		console.log('added to cart...');	
		console.log(product);
	};
	
}]);

shopControllers.controller('cartCtrl', ['$scope', 'Cart', function($scope, Cart){
	
	$scope.cartItems = Cart.getItems();
	$scope.total = Cart.total();

	$scope.remove = function(itemUid){
		Cart.remove(itemUid);
		$scope.total = Cart.total();
		console.log('removed...');
	}
	
}]);
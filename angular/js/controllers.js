var shopControllers = angular.module('shopControllers', []);


shopControllers.controller('mainCtrl', ['$scope', '$http', 'Cart', 'dataProvider', function($scope, $http, Cart, dataProvider){
	
	$scope.cartItemsAmount = Cart.getItemsCounter();
	
	$scope.$on('cart:updated', function(event) {

     $scope.cartItemsAmount = Cart.getItemsCounter();
   
   });
		console.log( typeof dataProvider );
	
		dataProvider.getData('categories').then(function(data){
	
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


shopControllers.controller('productsCtrl', ['$scope', '$http', '$routeParams', 'dataProvider', function($scope, $http, $routeParams, dataProvider){
	
	var subCategories = [],
		params = {};
		
	// определим категорию, для которой нужно отобразить товары
	if($routeParams.category !== undefined) {
	
		params.category = $routeParams.category;
	
	}
	
	// вычленим суб категории текущей категории из массива хранящего все категории
	$scope.$watch('categories',function(newValue, oldValue){
			
		$scope.subCategories = _.filter($scope.categories, function(item){
			
			// $routeParams.category может быть undefined для главной категории		
			return $routeParams.category == item.parentId;	
		});			

	});
	
	// загрузим товары категории, а также суб категории текущей категории и отобразим их
	dataProvider.getData('products', params).then(function(data){
		
		$scope.products = data;
	});
		
	
}]);

shopControllers.controller('productDetailsCtrl', ['$scope', '$routeParams','$http','Cart', 'dataProvider', function($scope, $routeParams, $http, Cart, dataProvider){
		
	var optionList = {},
		params = {};
	
	$scope.productId = $routeParams.productId;
	params.id = $routeParams.productId;

	// загрузим данные о товаре
	dataProvider.getData('product', params).then(function(data){
		
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
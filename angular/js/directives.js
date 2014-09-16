var shopDirectives = angular.module('shopDirectives', []);

shopDirectives.directive('mainMenu',function(){
	
	return {
		templateUrl:"tpl/mainmenu.html",
		restrict: 'E'
	}
	
});

shopDirectives.directive('cartLabel',function(){
	
	return {
		templateUrl:"tpl/cartlabel.html",
		restrict: 'E'
	}
	
});

shopDirectives.directive('categories',function(){
	
	return {
		templateUrl:"tpl/categories.html",
		restrict: 'E'
	}
	
});

shopDirectives.directive('products',function(){
	
	return {
		templateUrl:"tpl/products.html",
		restrict: 'E'
	}
	
});
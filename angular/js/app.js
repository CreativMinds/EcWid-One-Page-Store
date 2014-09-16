var shopApp = angular.module('shopApp',[
	'ngRoute',
	'ngTouch',
	'shopControllers',
	'shopServices',
	'shopFactories',
	'shopFilters',
	'shopDirectives'
]);

shopApp.config(['$routeProvider',

  function($routeProvider) {

    $routeProvider.

      when('/cart', {
        templateUrl: 'tpl/cart.html',
        controller: 'cartCtrl',
		resolve: {
			loadShopProfile: function(shopProfile){
				return shopProfile.load();
			}
		}
      }).

      when('/products', {
        templateUrl: 'tpl/products-list.html',
        controller: 'productsCtrl',
		resolve: {
			loadShopProfile: function(shopProfile){
				return shopProfile.load();
			}
		}		
      }).

      when('/product/:productId', {
        templateUrl: 'tpl/product-details.html',
        controller: 'productDetailsCtrl',
		resolve: {
			loadShopProfile: function(shopProfile){
				return shopProfile.load();
			}
		}		
      }).

      otherwise({
        redirectTo: '/products'
      });

  }
]);
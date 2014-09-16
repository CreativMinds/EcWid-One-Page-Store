var shopFilters = angular.module('shopFilters', []);

shopFilters.filter('htmlTrusted', function($sce) {

	/* Используется в тех случаях, когда нужно встроить html полученный из модели в DOM */

	return function(input) {

		return $sce.trustAsHtml(input);

	};

});

shopFilters.filter('profileCurrency', function($sce, shopProfile) {
	
	/* Приведение цены к формату установленному в настройках магазина */
	
	return function(input) {
    
		var profileOptions = shopProfile.getOptions();
		
		return profileOptions['currencyPrefix'] + input;
	
	};

});
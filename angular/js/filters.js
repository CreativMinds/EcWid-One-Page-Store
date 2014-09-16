var shopFilters = angular.module('shopFilters', []);

shopFilters.filter('htmlTrusted', function($sce) {
  return function(input) {
    return $sce.trustAsHtml(input);
  };
});

shopFilters.filter('profileCurrency', function($sce, shopProfile) {
  return function(input) {
    
	var profileOptions = shopProfile.getOptions();
	
	return profileOptions['currencyPrefix'] + input;
	
  };
});
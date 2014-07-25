$('.dropdown-toggle').on('mouseenter',function(){


	$(this).offsetParent().children('.dropdown-menu').show();
	
});

$('li.dropdown').on('mouseleave',function(event){
	
	
	$(this).children('.dropdown-menu').hide();
	
});
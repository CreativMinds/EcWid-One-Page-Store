/*

	Используемые библиотеки: 
	1. underscore (должна подгружаться на странице клиента/владельца магазина, но можно
	добавить и динамическую загрузку в метод ecwid.init)
	2. mustache (подгрузка аналогичная underscore)
	
	Методы:
	EcWid.init - инициализация магазина
	EcWid.loadData - получение данных от product api, возвращает Promise 
	EcWid.loadTemplate - загрузка темплейтов, возвращает Promise 
	EcWid.traversing - навигация по магазину
	EcWid.showGoods - отображение списка товаров
	EcWid.showProduct - отображение страницы товара
	EcWid.showCart - отображение корзины с товарами
	EcWid.gerenateMainMenu - генерация главого меню
	
	Примечания:
	В карточке товара его параметры могут быть типов: select, radio и т.д, в этой версии обрабатывается только select
	т.к все остальные типы обратаываются схожим образом я не стал их добавлять
	
*/


var EcWid = {

	"categories": [],							// все категории, массив обьектов
	"products": [],								// все товары выбранной категории, массив обьектов
	"product": {},								// информация о текущем выбранном продукте
	"windowSelector": "ecwid-shop",				// селектор элемента где будет размещаться весь интерфейс магазина
	"shopId": 5266003,							// id магазина
	"apiUrl": "http://appdev.ecwid.com/api/v1",	// url ecwid api

	"window": null,								// хранит dom обьект селектора EcWid.windowSelector 
												// инициируется при запуске, в init()
	"goodsWindow": null,						// хранит dom объекта с листингом товаров заданной категории
												// или без категории. В общем просто контейнер списка товаров
	"productWindow": null,						// хранит dom обьекта с описанием товара
	"cartWindow": null,							// по аналогии с productWindow
	"contentContainer": null,					// dom в который выводится контент: товары, страница товара, корзина
	"menuContainer": null,						// хранит dom обекта где должно хранится главное меню
	"cartContainer": null,						// хранит dom обекта коризны на каждой странице 
	"cart": {},									// корзина
	"templateUrl": 'http://ftpbuzz.ru/ecwid/mustache', // url дирректории где хранятся шаблоны
	"templates": {},							// обьект в который мы будем загружать темплейты
	"currentCategory": null						// категория, в который посетитель в данный момент находится
};

	EcWid.loadData = function(controller, jpCallback, callback, params){
	
		/* 
			Получение данных от Product Api используя jsonp 
			params - параметры переадваемые в апи в виде обьекта, например {name: 'bob', lastname: 'bobster'}
			controller - тип данных, которые мы хотим получить, в запросе идет после id магазина, например 
				api/v1/5266003/categories?...
				api/v1/5266003/products?...
			jpCallback - jsonp callback
			callback - запускается по завершению загрузки данных, на onload событии тега script, запускается 
						с передачей главного обьекта: callback.call(EcWid)
			
			Принцип работы:
			Сформируем <script> тег с src вида 
			http://appdev.ecwid.com/api/v1/5266003/categories?callback=EcWid.getCategories
			вставим его в документ, и удалим после выполнения
		*/
		
		return new Promise(function(resolve, reject){
		
			var script,
				body = document.getElementsByTagName('body')[0],
				paramString = '',
				key;
			
			// сформируем строку параметров
			if(params){
				
				for(key in params){
					
					if(params[key] !== null){
						paramString += '&' + key + '=' + params[key];
					}
					
				}
			}
			
			// сгенерируем script тег и вставим его в документ, после чего сделаем так, чтобы он запустил
			// колбэк и удалил себя, когда завершится загрузка данных	
			script = document.createElement('script');
				
			script.src = EcWid.apiUrl + 
							'/' + EcWid.shopId + 
							'/' + controller + 
							'?callback=' + jpCallback + paramString;				
			
			script.onload = function(){
					
					if(callback) callback.call(EcWid);
					this.parentElement.removeChild(this);
					resolve();
				};			
			
			body.appendChild(script);
		});
	};


	EcWid.loadTemplate = function(templateName, templateVar, callback){
		
		
	/* 
		загрузим темплейт templateName и поместим его в указанную переменную templateVar в обьект EcWid.templates 
		Например такой вызов метода: EcWid.loadTemplate('tpl-products','products') 
		загрузит темплейт 'tpl-products' в EcWid.templates.products
	*/

		return new Promise(function(resolve, reject){
			
			var script,
				body = document.getElementsByTagName('body')[0];
			
			// не будем загружать темплейт, если он был загружен ранее
			if(EcWid.templates[templateVar]){

				if(callback) callback();
				resolve();	
				return;			
			}
			
			// сгенерируем script тег и вставим его в документ, после чего сделаем так, чтобы он 
			// удалил себя, когда завершится загрузка данных	
			script = document.createElement('script');
				
			script.src = EcWid.templateUrl + 
							'/' + templateName + '.mst' + '?var=EcWid.templates.' + templateVar;
							
			script.type = 'text/javascript';				
			
			script.onload = function(){
					
					if(callback) callback();
					this.parentElement.removeChild(this);
					resolve();
				};			
			
			body.appendChild(script);		
		});	
		
	};

	
	EcWid.showGoods = function(paramsObj){
	
	
		/* Отображение списка товаров */
		
		var	params = {			// настройки по умолчанию
				limit: null,				// число результатов в выдаче, null - нет ограничения
				category: null				// id категории, null - все товары
			},
			key;
		
		// перезапишем настройки если они были переданы
		if(paramsObj){
			for(key in paramsObj){
				params[key] = paramsObj[key];
			}
		}

		// очистим основное окно от содержимого
		this.contentContainer.innerHTML = '';
				
		// получим товары, а также субкатегории текущей категории, и отобразим их
		this.loadData('products','EcWid.getProducts',function(){
			
			var subCategories = null,
				Promises = [],
				partials = {};			// хранит в свойствах отдельные части общего темплейта (template partials)
			
			// вычленим суб категории из массива хранящего все категории
			subCategories = _.filter(EcWid.categories, function(item){
					
				return EcWid.currentCategory == item.parentId;	
			});
			
			// загрузим темплейт отвечающий за вывод списка товаров
			Promises.push( this.loadTemplate('goods','goods') );
			
			// загрузим темплейт отвечающий за вывод списка категорий
			if(subCategories !== null){
			
				Promises.push( this.loadTemplate('goods-categories','goodsCategories') );
			}
			
			Promise.all(Promises).then(function(){
				
				var rendered;
				
				if(subCategories.length > 0){
		
					partials.categoriesTpl = EcWid.templates.goodsCategories;
				}
				
				rendered = Mustache.render(EcWid.templates.goods, {
								products: EcWid.products, 
								categories: subCategories
				},partials);
				
				// если у товара или категории нет фото, установим общее фото через установку класса 
				rendered = rendered.replace(/img src=""/g,'img src="" class="noimage" ');

				EcWid.contentContainer.innerHTML = rendered;					
			});
						
		},params);
		
	};	


	EcWid.getProducts = function(products){
		// jsonp функция, получение всего списка товаров
		
		this.products = products;
	};	
	
	EcWid.getProduct = function(product){
		// jsonp функция, получение информации о товаре
		
		this.product = product;
	};	
	
	EcWid.getCategories = function(categories){
		// jsonp функция, получение списка категорий
		
		this.categories = categories;
	};	

	
	EcWid.init = function(){
	
		var Promises = [];
		
		
		// загрузим все категории которые есть в магазине в переменную EcWid.getCategories
		// загрузим темплейт каркаса страницы
		Promises.push( this.loadData('categories','EcWid.getCategories') );
		Promises.push( this.loadTemplate('mainframe','mainFrame') );
		
		// когда все загрузится, начнем создавать страницу
		Promise.all(Promises).then(function(){

			// создадим каркас страницы на основе шаблона
			EcWid.createMainFrame();
	
			// закэшируем главное окно магазина, там где будет размещаться весь интерфейс
			EcWid.window = document.getElementById( EcWid.windowSelector );
				
			// создадим главное меню
			EcWid.gerenateMainMenu();

			// отобразим блок корзины 
			EcWid.showCartLabel();	

			// проверим на какую страницу магазина нужно перейти при его инициации
			// в норме, это главная страница, но возможно человек делает свой первый вход сразу на страницу товара?
			// для этого отслеживаем наличие хэша магазина в url ("#!/~/some-page/")
			if( /^(#!\/~\/)/.test(location.hash)){
				
				EcWid.traversing();
				
			}else{
					
				EcWid.showGoods();
			}
	
	});	
		
		// добавим слежение за кликами по ссылкам которые относятся к страницам магазина
		this.eventListenersOn();
	};
	
	EcWid.showCartLabel = function(){
	
		
		/* отображение блока корзины на каждой странице */
		
		var Templates = [];
		
		// загрузим и отобразим темплейт
		Templates.push( this.loadTemplate('cart-every-page','cartLabel') );		
		
		Promise.all(Templates).then(function(){
			
			EcWid.cartContainer.innerHTML = EcWid.templates.cartLabel;
			EcWid.cart.recounter();
		});
	};

	EcWid.createMainFrame = function(){
	
		
		/* 
			создадим основной фрейм окна, где все (меню, товары, категории и т.д) будет размещаться 
			создание происходит на основе темплейта EcWid.templates.mainFrame загруженного ранее в ecwid.init
		*/
		
		var mainHolder = document.getElementById( this.windowSelector );
			
		mainHolder.className = 'centered floatfix',

		mainHolder.innerHTML = EcWid.templates.mainFrame;
			
		// закешируем вышесозданные элементы меню и окно контента	
		EcWid.menuContainer = mainHolder.querySelector('#mainMenu');					
		EcWid.contentContainer = mainHolder.querySelector('#mainContent');
		EcWid.cartContainer = mainHolder.querySelector('#cart');
	};
	
	EcWid.eventListenersOn = function(){
		
		
		// инициируем слежения за событиями
		var traversingBounded = this.traversing.bind(this);
		
		window.addEventListener('hashchange', traversingBounded, false);	
	};
	
	EcWid.traversing = function(){
	
		
		// ф-я отвечает за перемещение пользователя по магазину, отслеживая хэш теги в url
		
		var controller,				// контроллер, это например products в строке url "#!/~/products/..."
			params = {},			// обьект с параметрами вида {id: 123, offset: 1, sortby: "date"}
									// генерируем его динамически путем парсинга строки идущей после
									// контроллера, строка вида /prodicts/id=5&sortby=date где products - контроллер
			key;
		
			
		// отслеживаем только хэш теги начинающиеся с "#!/~/"
		if( /^(#!\/~\/)/.test(location.hash) === false ) return;
		
		// узнаем контроллер
		try{
			controller = /(\/\w+\/)/.exec(location.hash)[0].replace(/\//g,'');
		}catch(e){
			return;
		}
		
		// узнаем параметры, пропарсив то что идет после /products/... например /prodicts/id=5&sortby=date
		paramsRawArr = location.hash.substr(location.hash.lastIndexOf('/')+1).split('&');
		
		if(paramsRawArr[0].indexOf('=') == -1){
		
			params = {};
		
		}else{
			
			for(key in paramsRawArr){
				
				params[ paramsRawArr[key].split('=')[0] ] = paramsRawArr[key].split('=')[1];
			}
		}
		
		// предпримем действие
		this.handleTraversingAction(controller, params);
			
	};
	
	EcWid.handleTraversingAction = function(controller, params){
		
		
		// предпримем действие в заивисимости от того какой запрос отправил пользователь

		
		// пользователь запросил категорию
		if(controller === 'category'){
			
			EcWid.currentCategory = params.category;
			this.showGoods(params);
		}
		
		// пользователь запросил товар
		if(controller === 'product'){
			
			this.showProduct(params);
		}

		// пользователь перешел в корзину
		if(controller === 'cart'){
			
			this.showCart();
		}
	}
	
	EcWid.showProduct = function(paramsObj){
	
	
		/* отображение информации по товару */
		
		var params = {id: null};

		// перезапишем настройки если они были переданы
		if(paramsObj){
			for(key in paramsObj){
				params[key] = paramsObj[key];
			}
		}		
		
		// очистим основное окно от содержимого
		this.contentContainer.innerHTML = '';
			
		// загрузим данные о товаре и сделаем вывод на страницу/окно товара
		this.loadData('product','EcWid.getProduct',function(){
			
			
			var template = '',		// базовый темплейт карточки товара
				el, ul, li,			// dom контейнеры
				key,				// просто индекс
				addToCartbounded = EcWid.cart.add.bind(EcWid.cart),	// привязанная функция для event listener 
				Templates = [];
			
			// загрузим темплейты
			Templates.push( this.loadTemplate('product','product') );
			Templates.push( this.loadTemplate('product-select','productSelect') );
			
			// отобразим темплейты
			Promise.all(Templates).then(function(){
				
				// добавим в обьекты опций функцию которая будет отвечать за их рендеринг
				EcWid.product.options.forEach(function(element, index){
					
					EcWid.product.options[index].render = function(){
					
						return Mustache.render('{{>'+this.type+'}}', this, {SELECT: EcWid.templates.productSelect});
					}
				});
				
				// отобразим темплейт
				var rendered = Mustache.render(EcWid.templates.product, 
						{
							product: EcWid.product,
							categoriesChain: EcWid.getCategoriesChain(EcWid.currentCategory)
						}
				);
				EcWid.contentContainer.innerHTML = rendered;					

				// привяжем события
				// на кнопку Положить в корзину
				document.getElementById('put-in-cart-btn').addEventListener('click', addToCartbounded, false);
						
			});
				
		},params);
		
	};

	EcWid.getCategoriesChain = function(categoryId){
	
		/* вернет массив с обектами категорий родителей categoryId упорядоченными по порядку  */
		
		var categories = [],
			catItem,
			chainEnd = false;
		
		var output = function(){
			
			// функция отвечает за возврат ответа ее родительского метода
			// благодаря ей мы вернем не просто массив categories, а массив categories в котором у каждого
			// обьекта будет свой порядковый номер записанный в свойство order.
			// это поле удобно иметь при работе с категориями внутри темплейтов
			
			var key;
			
			for(key in categories){
				
				categories[key].order = key;
			}
			
			return categories;
			
		};
		
		// если текущая категория не известна, возьмем дефолтную категорию продукта
		if(categoryId === null){
			
			categoryId = _.findWhere(EcWid.product.categories, {defaultCategory: true}).id;
		}
		
		if(categoryId === undefined) return categories;
		
		// занесем обьекты категорий в массив		
		catItem = _.findWhere(EcWid.categories, {id: parseInt(categoryId)});
		categories.push( catItem );
				
		if(!catItem.parentId) return output();
				
		while(chainEnd === false){
					
			catItem = _.findWhere(EcWid.categories, {id: catItem.parentId});
			
			catItem === undefined ? chainEnd = true : categories.unshift( catItem );
			
			if(!catItem.parentId) chainEnd = true;
		}	

		return output();
	};

	EcWid.showCart = function(){
	
	
		/* отображение корзины с товарами */	
		
		var key, n,
			deleteButtons,
			el,
			Templates = [];
			
		// загрузим корзину из local storage
		this.cart.items = JSON.parse(localStorage.getItem('cart'));
		
		// очистим основное окно от содержимого
		this.contentContainer.innerHTML = '';

		// отобразим темплейт
		Templates.push( this.loadTemplate('cart','cart') );		

		Promise.all(Templates).then(function(){

			// добавим в обьекты товаров лежащих в корзине функцию, которая будет отвечать за 
			// отображение конечной стоимости товара
			EcWid.cart.items.forEach(function(element, index){
				
				EcWid.cart.items[index].totalPrice = function(){
				
					return this.quantity * this.baseProduct.price;
				}
			});
							
			// отобразим темплейт
			var rendered = Mustache.render(EcWid.templates.cart, {cart: EcWid.cart.items});
			EcWid.contentContainer.innerHTML = rendered;
			
			// отобразим итоговую стоимость всех товаров
			EcWid.cart.showTotalPrice( document.getElementById('cartTotalPrice') );					

			// повесим события на кнопки "Удалить товар из корзины"
			deleteButtons = document.querySelectorAll('[data-btn-type="delete"]');
			
			for(key=0, n = deleteButtons.length; key < n; key++ ){
				
				deleteButtons[key].addEventListener('click', deleteProdItem(deleteButtons[key]), false);
			}
								
		});
		
		function deleteProdItem(button){
			
			return function(){
				
				// удаляем из коризны
				EcWid.cart.remove( button.getAttribute('data-item-id') );
				
				// удаляем из dom
				el = document.getElementById(button.getAttribute('data-item-id'));
				el.parentNode.removeChild(el);	
				
				// отображаем новую стоимость всех товаров корзины
				EcWid.cart.showTotalPrice( document.getElementById('cartTotalPrice') );			
			};
		}
	
	};
	
	EcWid.cart.showTotalPrice = function(domElement){
		
		/* расчитаем полную стоимость всех товаров в корзине и поместим значение в domElement */

		domElement.innerHTML = this.total();
		
	};
	
	EcWid.cart.remove = function(prodId){
	
	
		/* 
			удаление товара из корзины 
			prodId - id товара который удаляется
		*/	
		
		prodId = parseInt(prodId); 	// изначально prodId имеет строковой тип, т.к значение берется 
									// из аттрибутов dom элемента
		
		var key;
		
		for(key in this.items){

			if(this.items[key].id === prodId){

				this.items.splice(key,1);
			}
		}
		
		localStorage.setItem('cart', JSON.stringify(this.items));
		EcWid.cart.recounter();

	};

	EcWid.cart.add = function(){
	
		
		/* добавление товара в корзину */
				
		var product = {},
			optionContainers,			// div элементы в которых содержатся input / select и прочие элементы
										// со значениями опций.
			l, key, i,
			optionType, optionName, optionValue;							
		
		// запишем базовую информацию о товаре
		product.id = EcWid.product.id;
		product.baseProduct = EcWid.product;
		product.options = [];	
		
		// узнаем какие опции были выбраны
		optionContainers = document.querySelectorAll('.prod-options');
		l = optionContainers.length;
		
		for(i = 0; i < l; i++){
			
			optionType = optionContainers[i].getAttribute('data-option-type');
			optionName = optionContainers[i].getAttribute('data-option-name');
			
			optionValue = EcWid.parseOptionValue(optionContainers[i], optionType, optionName);
			
			if(optionValue !== undefined){
				product.options.push({
							optionName: optionName, 
							optionValue: optionValue
				});
			}
		}
		
		// узнаем заказанное кол-во
		product.quantity = document.querySelector('.prod-details [name="quantity"]').value;
		
		// положим товар в корзину
		if(localStorage.getItem('cart')) {
		
			this.items = JSON.parse(localStorage.getItem('cart'));
		}
		
		this.items.push(product);	
		
		// сохраним в local storage
		localStorage.setItem('cart', JSON.stringify(this.items));
		
		// скорректируем UI
		document.getElementById('go-to-cart-btn').innerHTML = 'Товар добавлен<br><b>Перейти в Корзину</b>';
		document.getElementById('go-to-cart-btn').style.display = 'block';
		document.getElementById('put-in-cart-btn').style.display = 'none';
		
		EcWid.cart.recounter();
	};

	EcWid.cart.total = function(){
		
		/* расчет общей суммы товаров в корзине */
		
		var key,
			total = 0;
		
		if(this.items.length < 1) return 0;
		
		for(key in this.items){
			
			
			total += this.items[key].quantity * this.items[key].baseProduct.price;
		}
		
		return total;
			
	};

	EcWid.cart.recounter = function(){
	
		
		/* обновление информации в лейбле корзины о кол-ве товаров в ней */
		
		this.items = JSON.parse(localStorage.getItem('cart'));	
		
		document.getElementById('cart-goods-counter').innerHTML = this.items.length;
	};
	
	EcWid.parseOptionValue = function(container, optionType, optionName){
	
		
		// пропарсим dom контейнер (типы: select/radio/input) который хранит параметры товара

		if(optionType === 'RADIO'){
		
			try{
				return container.querySelector('[name="'+optionName+'"]:checked').value;
			}catch(e){}	
		}	

		if(optionType === 'SELECT'){

			try{
				return container.querySelector('[name="'+optionName+'"]').value;
			}catch(e){}	
		}
	};
	
	EcWid.gerenateMainMenu = function(){
	
		/*  
			Геренация главного меню
		*/
		
		var liCategories = [],
			ulCategories = [],
			CategoriesWithSubs = [],	// массив с id тех категорий, у которых есть дочерние категории
			rootCategories = [],		// id категорий у которых нет родителей
			mainContainer,				// главный контейнер меню
			li, ul,
			key;
		
		// создадим главное меню, и поместим его в контейнер главного меню
			mainContainer = document.createElement('ul');
			mainContainer.id = 'dropdown-nav';
			mainContainer.className = 'dropdown';
			
			this.menuContainer.appendChild(mainContainer);
			
		// получим из необработанного массива с категориями более структурированные данные,
		// а именно CategoriesWithSubs и rootCategories (описание в разделе var)
		for(key in this.categories){
		
			if(EcWid.categories[key].parentId){
			
				// массив содержащий id категорий, которые содержат подкатегории
					CategoriesWithSubs.push(EcWid.categories[key].parentId);
			}else{
				
				// категории у которых нет родителей
					rootCategories.push(EcWid.categories[key].id);
			}			
		}
			
		// создадим li для каждой категории
		for(key in this.categories){
			
			li = document.createElement('li');
			li.setAttribute('data-categoryId',EcWid.categories[key].id);
			li.innerHTML = '<a href="#!/~/category/category='+EcWid.categories[key].id+'">'+EcWid.categories[key].name+'</a>';
			
			liCategories[EcWid.categories[key].id] = li;
		}
		
		// создадим ul для каждой категории, в которой есть суб категории
		for(key in CategoriesWithSubs){
			
			ul = document.createElement('ul');
			ul.setAttribute('data-parentId',CategoriesWithSubs[key]);
			
			ulCategories[CategoriesWithSubs[key]] = ul;
		}
		
		// поместим все li одной категории в ul, а затем этот ul в li родителя
		for(key in this.categories){
		
			if(EcWid.categories[key].parentId){
				
				ulCategories[EcWid.categories[key].parentId].appendChild(liCategories[EcWid.categories[key].id]);
				liCategories[EcWid.categories[key].parentId].appendChild( ulCategories[EcWid.categories[key].parentId] );
			}
		
		}
		
		// добавим все root li к главному контейнеру меню 
		for(key in rootCategories){
			
			mainContainer.appendChild(liCategories[ rootCategories[key] ]);
		}
		
		
	};

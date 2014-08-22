/*

	

*/

var EcWid = {

	"categories": [],							// все категории, массив обьектов
	"products": [],								// все товары выбранной категории, массив обьектов
	"product": {},								// информация о текущем выбранном продукте
	"windowSelector": "ecwid-shop",				// там, где будет размещаться весь интерфейс магазина, это может быть div
	"shopId": 5266003,							// id магазина
	"apiUrl": "http://appdev.ecwid.com/api/v1",	// url ecwid api

	"window": null,								// хранит dom обьект document.getElementById( windowSelector )
												// инициируется при запуске, в init()
	"goodsWindow": null,						// хранит dom объекта с листингом товаров заданной категории
												// или без категории. В общем просто контейнер списка товаров
	"productWindow": null,						// хранит dom обьекта с описанием товара
	"cartWindow": null,							// по аналогии с productWindow
	"contentContainer": null,					// хранит dom обьекта где должно хранится гланое меню
	"menuContainer": null,						// хранит dom обекта где выводятся товары или страница товара
	"cart": [],									// корзина, хранит обекты с описанием товаров
	"template": null,
	"templateUrl": 'http://ftpbuzz.ru/ecwid/mustache',
	"templates": {}								// обьект в который мы будем загружать темплейты
};

	EcWid.loadData = function(controller, jpCallback, callback, params){
	
		/* 
			загрузка данных с главного сервера используя jsonp 
			params - параметры переадваемые в апи в виде обьекта, например {name: 'bob', lastname: 'bobster'}
			controller - тип данных, которые мы хотим получить, в запросе идет после id магазина, например 
				api/v1/5266003/categories?
				api/v1/5266003/products?
			jpCallback - jsonp callback
			callback - запускается по завершению загрузки данных, на onload событии тега script, запускается 
						с передачей главного обьекта: callback.call(EcWid)
			
			Сформируем <script> тег с src вида 
			http://appdev.ecwid.com/api/v1/5266003/categories?callback=EcWid.getCategories
			вставим его в документ, и удалим после выполнения
		*/
		
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
			
		script.src = this.apiUrl + 
						'/' + this.shopId + 
						'/' + controller + 
						'?callback=' + jpCallback + paramString;				
		
		script.onload = function(){
				
				callback.call(EcWid);
				this.parentElement.removeChild(this);
			};			
		
		body.appendChild(script);
	};


	EcWid.loadTemplate = function(templateName, templateVar, callback){
		
		
	/* загрузим темплейт templateName и поместим его в указанную переменную templateVar */
		
		return new Promise(function(resolve, reject){
			
			var script,
				body = document.getElementsByTagName('body')[0];
			
			// сгенерируем script тег и вставим его в документ, после чего сделаем так, чтобы он 
			// удалил себя, когда завершится загрузка данных	
			script = document.createElement('script');
				
			script.src = EcWid.templateUrl + 
							'/' + templateName + '.mst' + '?var=' + templateVar;
							
			script.type = 'text/javascript';				
			
			script.onload = function(){
				
					resolve();
					if(callback) callback();
					this.parentElement.removeChild(this);
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
			key,
			tplPromise;						// promise обьект для загрузки шаблона
		
		// перезапишем настройки если они были переданы
		if(paramsObj){
			for(key in paramsObj){
				params[key] = paramsObj[key];
			}
		}

		// очистим основное окно от содержимого
		this.contentContainer.innerHTML = '';
				
		// получим товары и отобразим их
		this.loadData('products','EcWid.getProducts',function(){
			
			tplPromise = this.loadTemplate('goods','EcWid.template');
				
			tplPromise.then(function(){
				var rendered = Mustache.render(EcWid.template, {products: EcWid.products});
				EcWid.contentContainer.innerHTML = rendered;					
			});
						
		},params);
		
	};	
	
	EcWid.getCategories = function(categories){
		// jsonp функция,получение всего списка категорий
		
		this.categories = categories;
	};

	EcWid.getProducts = function(products){
		// jsonp функция, получение всего списка товаров
		
		this.products = products;
	};	
	
	EcWid.getProduct = function(product){
		// jsonp функция, получение информации о товаре
		
		this.product = product;
	};	
	
	EcWid.init = function(){
	
		
		// создадим основной фрейм окна, где все будет размещаться, а когда оно будет создано запустим 
		// коллбэк который продолжит с ним работу 
		this.createMainFrame(function(){
		
			// инициируем главное окно магазина, там где будет размещаться весь интерфейс
			EcWid.window = document.getElementById( EcWid.windowSelector );
			
			// загрузим категории и создадим на их основе главное меню
			EcWid.loadData('categories','EcWid.getCategories',EcWid.gerenateMainMenu);
			
			// проверим на какую страницу магазина нужно перейти при его инициации
			// в норме, это главная страница, но возможно человек делает свой первый вход сразу на страницу товара?
			// для этого отслеживаем наличие хэша магазина в url ("#!/~/some-page")
			if( /^(#!\/~\/)/.test(location.hash)){
			
				EcWid.traversing();
			
			}else{
			
				EcWid.showGoods();
			}		
		});
		
		// добавим слежение за кликами по ссылкам которые относятся к страницам магазина
		this.eventListenersOn();
	};
	
	EcWid.createMainFrame = function(callback){
	
		
		/* создадим основной фрейм окна, где все будет размещаться */
		
		var mainHolder = document.getElementById( this.windowSelector ),
			Templates = [];
			
		mainHolder.className = 'centered floatfix',

		// загрузим темплейт
		Templates.push( this.loadTemplate('mainframe','EcWid.templates.mainFrame') );
			
		// отобразим темплейт
		Promise.all(Templates).then(function(){
						
			mainHolder.innerHTML = EcWid.templates.mainFrame;
			
			// закешируем вышесозданные элементы меню и окно контента	
			EcWid.menuContainer = mainHolder.querySelector('#mainMenu');					
			EcWid.contentContainer = mainHolder.querySelector('#mainContent');
			
			if(callback) callback();
				
		});
						
	};
	
	EcWid.eventListenersOn = function(){
		
		
		// инициируем слежения за событиями
		var traversingBounded = this.traversing.bind(this);
		
		window.addEventListener('hashchange', traversingBounded, false);	
	};
	
	EcWid.traversing = function(){
	
		
		// ф-я отвечает за перемещение пользователя по магазину, отслеживая хэш теги в url
		
		var controller,				// контроллер, это например product в строке url "#!/~/products/..."
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
			
			this.showGoods(params);
		}
		
		// пользователь запросил товар
		if(controller === 'product'){
			
			//this.showProduct(params);
			this.showProduct(params);
		}

		// пользователь перешел в корзину
		if(controller === 'cart'){
			
			//this.showCart();
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
				addToCartbounded = this.addToCart.bind(this),	// привязанная функция для event listener 
				Templates = [];
			
			// загрузим темплейты
			Templates.push( this.loadTemplate('product','EcWid.templates.product') );
			Templates.push( this.loadTemplate('product-select','EcWid.templates.productSelect') );
			
			// отобразим темплейты
			Promise.all(Templates).then(function(){
				
				// добавим в обьекты опций функцию которая будет отвечать за их рендеринг
				EcWid.product.options.forEach(function(element, index){
					
					EcWid.product.options[index].render = function(){
					
						return Mustache.render('{{>'+this.type+'}}', this, {SELECT: EcWid.templates.productSelect});
					}
				});
				
				// отобразим темплейт
				var rendered = Mustache.render(EcWid.templates.product, {product: EcWid.product});
				EcWid.contentContainer.innerHTML = rendered;					

				// привяжем события
				// на кнопку Положить в корзину
				document.getElementById('put-in-cart-btn').addEventListener('click', addToCartbounded, false);
						
			});
				
		},params);
		
	};


	EcWid.showCart = function(){
	
	
		/* отображение корзины с товарами */	
		
		var key, n,
			deleteButtons,
			el,
			Templates = [];
			
		// загрузим корзину из local storage
		this.cart = JSON.parse(localStorage.getItem('cart'));
		
		// очистим основное окно от содержимого
		this.contentContainer.innerHTML = '';

		// отобразим темплейт
		Templates.push( this.loadTemplate('cart','EcWid.templates.cart') );		

		Promise.all(Templates).then(function(){

			// добавим в обьекты товаров лежащих в корзине функцию, которая будет отвечать за 
			//отображение конечной стоимости товара
			// формула: кол-во * стоимость
			EcWid.cart.forEach(function(element, index){
				
				EcWid.cart[index].totalPrice = function(){
				
					return this.quantity * this.baseProduct.price;
				}
			});
							
			// отобразим темплейт
			var rendered = Mustache.render(EcWid.templates.cart, {cart: EcWid.cart});
			EcWid.contentContainer.innerHTML = rendered;					

			// повесим события на кнопки "Удалить товар из корзины"
			deleteButtons = document.querySelectorAll('[data-btn-type="delete"]');
			
			for(key=0, n = deleteButtons.length; key < n; key++ ){
				
				deleteButtons[key].addEventListener('click', deleteProdItem(deleteButtons[key]), false);
			}
								
		});
		
		function deleteProdItem(button){
			
			return function(){
				
				// удаляем из коризны
				EcWid.deleteFromCart( button.getAttribute('data-item-id') );
				
				// удаляем из dom
				el = document.getElementById(button.getAttribute('data-item-id'));
				el.parentNode.removeChild(el);				
			};
		}
	
	};
	
	
	EcWid.deleteFromCart = function(prodId){
	
	
		/* 
			удаление товара из корзины 
			prodId - id товара который удаляется
		*/	
		
		prodId = parseInt(prodId); 	// изначально prodId имеет строковой тип, т.к значение берется 
									// из аттрибутов dom элемента
		
		var key;
		
		for(key in this.cart){

			if(this.cart[key].id === prodId){

				this.cart.splice(key,1);
			}
		}
		
		localStorage.setItem('cart', JSON.stringify(this.cart));

	};
	
	EcWid.addToCart = function(){
	
		
		// добавление товара в корзину
		var product = {},
			optionContainers,			// div элементы в которых содержатся input / select и прочие элементы
										// со значениями опций.
			l, key, i,
			optionType, optionName, optionValue;							
		
		// запишем базовую информацию о товаре
		product.id = this.product.id;
		product.baseProduct = this.product;
		product.options = [];	
		
		// узнаем какие опции были выбраны
		optionContainers = document.querySelectorAll('.prod-options');
		l = optionContainers.length;
		
		for(i = 0; i < l; i++){
			
			optionType = optionContainers[i].getAttribute('data-option-type');
			optionName = optionContainers[i].getAttribute('data-option-name');
			
			optionValue = this.parseOptionValue(optionContainers[i], optionType, optionName);
			
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
		
			this.cart = JSON.parse(localStorage.getItem('cart'));
		}
		
		this.cart.push(product);	
		
		// сохраним в local storage
		localStorage.setItem('cart', JSON.stringify(this.cart));
		
		// скорректируем UI
		document.getElementById('go-to-cart-btn').innerHTML = 'Товар добавлен<br><b>Перейти в Корзину</b>';
		document.getElementById('go-to-cart-btn').style.display = 'block';
		document.getElementById('put-in-cart-btn').style.display = 'none';
	};
	
	EcWid.parseOptionValue = function(container, optionType, optionName){
	
		
		// пропарсим dom контейнер который хранит select/input и другие form элементы, в которых пользователь
		// на странице товара указал нужные ему данные, выбрал нужные ему опции

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
			Каждая категория находится внутри li элементов, поэтому для каждой категории нужно создать свой <LI>.
			Для каждой категории имеющей в себе субы, нужно создать свой <UL>, в который мы потом их поместим
			чтобы обьеденить в группу. Когда у нас будут ul и li нужно совместить их, все <li> имеющие родителя 
			поместить в ul родителя, а сам ul в li родителя. После нужно все это поместить в главный контейнер меню.
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
			
		// получим из необработанного массива с категориями более структурированные данные
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

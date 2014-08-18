/*

	Страница корзины

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
	"templateUrl": 'http://ftpbuzz.ru/ecwid/mustache'
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

	EcWid.loadTemplate = function(templateName, callback){
	
		/* 
			загрузка темплейта методом jsonp в EcWid.template
		*/
		
		var script,
			body = document.getElementsByTagName('body')[0];
		
		// сгенерируем script тег и вставим его в документ, после чего сделаем так, чтобы он 
		// удалил себя, когда завершится загрузка данных	
		script = document.createElement('script');
			
		script.src = this.templateUrl + 
						'/' + templateName + '.mst';
						
		script.type = 'text/javascript';				
		
		script.onload = function(){
			
				callback();
				this.parentElement.removeChild(this);
			};			
		
		body.appendChild(script);
	};	
	
	EcWid.showGoodsTemplateEdition = function(paramsObj){
	
	
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
				
		// получим товары и отобразим их
		this.loadData('products','EcWid.getProducts',function(){
			
			this.loadTemplate('goods', function(){
		
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
	
		
		// создадим основной фрейм окна, где все будет размещаться
		this.createMainFrame();
		
		// инициируем главное окно магазина, там где будет размещаться весь интерфейс
		this.window = document.getElementById( this.windowSelector );
		
		// загрузим категории и создадим на их основе главное меню
		this.loadData('categories','EcWid.getCategories',this.gerenateMainMenu);
		
		// отобразим список товаров
		this.showGoodsTemplateEdition();
		
		// добавим слежение за кликами по ссылкам
		this.eventListenersOn();
	};
	
	EcWid.createMainFrame = function(){
	
		
		/* создадим основной фрейм окна, где все будет размещаться */
		
		var mainHolder = document.getElementById( this.windowSelector );
			mainHolder.className = 'centered floatfix';
			
		mainHolder.innerHTML = '<table class="ecwidMainTable">'+
									'<tr>'+
										'<td id="mainMenu"></td>'+
									'</tr>'+
									'<tr>'+
										'<td id="mainContent"></td>'+
									'</tr>'+
								'</table>';
		
		// закешируем вышесозданные элементы меню и окно контента	
		this.menuContainer = mainHolder.querySelector('#mainMenu');					
		this.contentContainer = mainHolder.querySelector('#mainContent');					
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
			
			this.showGoodsTemplateEdition(params);
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
		
		// создаем окно товара, если оно не создано
		if(this.productWindow === null){
			
			this.productWindow = document.createElement('div');
			this.productWindow.className = 'product-window floatfix';
			
		}else{
			this.productWindow.innerHTML = '';
		}
		
		// загрузим данные о товаре и сделаем вывод на страницу/окно товара
		this.loadData('product','EcWid.getProduct',function(){
			
			
			var template = '',		// базовый темплейт карточки товара
				el, ul, li,			// dom контейнеры
				key,				// просто индекс
				addToCartbounded = this.addToCart.bind(this);	// привязанная функция для event listener 
			
			// создадим базовый шаблон и добавим его в документ
			template += '<div class="prod-image"></div>';
			template += '<div class="prod-details"></div>';
			template += '<div class="prod-description"></div>'; 
			
			this.productWindow.innerHTML = template;
			this.contentContainer.appendChild(this.productWindow);
			
			// наполним шаблон
			
			// добавим изображение
			el = document.querySelector('#' + this.windowSelector + ' .prod-image');
			el.innerHTML = '<img src=' + this.product.imageUrl + ' />';
			
			// добавим детали товара
			el = document.querySelector('#' + this.windowSelector + ' .prod-details');
				
				// цена
				el.innerHTML = '<span class="title">Price:</span> <span class="price">$' + 
							this.product.price + '</span>';
			
				// аттрибуты
				if(this.product.attributes.length > 0){

					ul = document.createElement('ul');
					ul.className = 'prod-attributes';

					for(key in this.product.attributes){
						
						li = document.createElement('li');
						
						li.innerHTML = this.product.attributes[key].name + ': ' + this.product.attributes[key].value;
						ul.appendChild(li);
					}
					
					el.appendChild(ul);			
				}
				
				// опции
				if(this.product.options.length > 0){
					
					for(key in this.product.options){
						 	
						el.innerHTML += this.genOptionHtmlView(this.product.options[key]);
					}
				}
				
				// кол-во
				el.innerHTML += '<div><span class="title">Quantity:</span>' +
									'<input class="quantity" type="number" name="quantity" value="1" min="1">'+
								'</div>';
								
				// кнопки: "Положить в корзину", "Перейти в корзину"
 				el.innerHTML += '<div class="cart-btn">' +
								'<button class="btn btn-default" id="put-in-cart-btn">В корзину</button>'+
								'<a href="#!/~/cart/"><button class="btn btn-success" id="go-to-cart-btn">'+
								'Перейти в Коризину</button></a>'+
								'</div>';
				
								
				// привяжем события напрямую на обьекты не создавая лишних переменных reference
				// чтобы при удалении dom событие также было удалено
				document.getElementById('put-in-cart-btn').addEventListener('click', addToCartbounded, false);
			
			// добавим полное описание
			el = document.querySelector('#' + this.windowSelector + ' .prod-description');
			el.innerHTML = this.product.description;
				
		},params);
		
	};
	
	
	
	EcWid.showCart = function(){
	
	
		/* отображение корзины с товарами */	
		
		var mainTable,						// таблица с содержимым корзины
			cartItem,						// обьект в корзине с описанием продукта (id продукта, заказанное кол-во)
											// опции продукта
			product,						// продукт взятый из this.products, содержит все данные о товаре
			template,						// шаблон таблицы mainTable
			key, n,
			optionsHtml,
			deleteButtons,
			cartItemDomId,
			el;
			
		
		// очистим основное окно от содержимого
		this.contentContainer.innerHTML = '';
		
		// создаем окно корзины, если оно не создано
		this.cartWindow = document.createElement('div');
		this.cartWindow.className = 'cart-window floatfix';
			
		// создадим основную таблицу где будет отображаться список товаров
		mainTable = document.createElement('table');
		mainTable.className = 'table table-stripped cart';
		mainTable.innerHTML = '<tr class="header"><th>Товар</th><th>Цена</th><th>Кол-во</th><th>Итого</th><th></th></tr>';
		
		// внесем в таблицу записи о товарах
		for(key in this.cart){
			
			// какой товар добавлен в корзину?
			cartItem = this.cart[key];
			
			// получим подробные данные о товаре
			//product = _.findWhere(EcWid.allProducts, {id: cartItem.id});
			product = cartItem.baseProduct;
			
			// добавим запись в таблицу
			
			// опишем темплейт
			template = '';			
			template += '<tr id="_item_product_id_">'+
							'<td>'+
								'<img src="_item_photo_" class="cartItemPhoto" />'+
								'<b>_item_name_</b>'+
								'<div class="item-options">_item_options_</div>'+
							'</td>'+
							'<td>_item_price_</td>'+
							'<td>_item_quantity_</td>'+
							'<td>_item_total_price_</td>'+
							'<td><button data-btn-type="delete" class="btn btn-default" '+
							'data-item-id="_item_product_id_">Удалить</button></td>'+
						'</tr>';
			
			// наполним темплейт
			
			// сформируем html представление опций товара если они у него есть
			optionsHtml = '';
			if(cartItem.options.length > 0){
				
				_.each(cartItem.options, function(optObj){
					
					if(optObj.optionValue === 'null') return;
					
					optionsHtml += optObj.optionName + ': ' + optObj.optionValue + '<br />';
				});
			}
			
			// сделаем наполнение						
			template = template.replace(/_item_photo_/, product.smallThumbnailUrl)
							   .replace(/_item_product_id_/g, product.id)
							   .replace(/_item_name_/, product.name)
							   .replace(/_item_price_/, product.price)
							   .replace(/_item_quantity_/, cartItem.quantity)
							   .replace(/_item_total_price_/, product.price * cartItem.quantity)
							   .replace(/_item_options_/, optionsHtml);
			
			mainTable.innerHTML += template;		
		}
		
		// вставим полученную таблицу в окно корзины
		this.cartWindow.appendChild(mainTable);
		this.contentContainer.appendChild(this.cartWindow);
		
		// повесим события на кнопки "Удалить товар из корзины"
		deleteButtons = document.querySelectorAll('[data-btn-type="delete"]');
		
		for(key=0, n = deleteButtons.length; key < n; key++ ){
			
			deleteButtons[key].addEventListener('click', deleteProdItem(deleteButtons[key]), false);
		}
		
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
		this.cart.push(product);
		
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
	
	EcWid.genOptionHtmlView = function(optionObj){
	
		
		// генерация html view блоков с опциями товара для вставки в карточку товара	
		var template,
			key, 
			uid,
			checked = '',		// является ли элемент выбранным по умолчанию, только для radio и selected
			choice;				// текущий обьект из массива optionObj.choices
			
		template = '<div class="prod-options" data-option-name="' + optionObj.name + 
											'" data-option-type="' + optionObj.type + 
											'" data-option-required="'+ optionObj.required +'">';
											
		template += '<span class=title>' + optionObj.name + '</span> <br />';
		
		if(optionObj.type === 'RADIO'){
			
			for(key in optionObj.choices){
				
				choice = optionObj.choices[key];
				
				// установим дефолтное значение только если опция обязательна
				if(optionObj.required){
				
					if(optionObj.defaultChoice === key) checked = 'checked'; else checked = '';
				}
				
				// сгенерируем темплейт
				uid = this.generateUniqId();
				template += '<input type="radio" id="'+ uid +'" name="' + 
								optionObj.name + '" value="' + 
								choice.text + '" data-price-modifier-type="' + 
								choice.priceModifierType + '" data-price-modifier="' + 
								choice.priceModifier + '" ' + checked + ' />'+
								' <label for="'+ uid +'">' + choice.text + '</label><br />';
			}
		
			template += '</div>';

			return template;
		}

		if(optionObj.type === 'SELECT'){
			
			template += '<select name="'+ optionObj.name +'">';
			
			if(!optionObj.required){
				
				template += '<option value=null>-----</option>';
			}
			
			for(key in optionObj.choices){
				
				choice = optionObj.choices[key];
				
				// установим дефолтное значение только если опция обязательна
				if(optionObj.required){
				
					if(optionObj.defaultChoice === key) checked = 'selected'; else checked = '';
				}
				
				// сгенерируем темплейт
				template += '<option value="' + choice.text + '" data-price-modifier-type="' + 
								choice.priceModifierType + '" data-price-modifier="' + 
								choice.priceModifier + '" ' + checked + ' > ' + choice.text + '</option>';
			}
			
			template += '</select>';
		
			template += '</div>';

			return template;
		}
	};
	
	EcWid.showGoods = function(paramsObj){
	
	
		/* Отображение списка товаров 
			
			Сгенерируем блок с товарами (UL), после чего сгеренируем каждый товар (LI), добавим товары в блок
			и затем вставим его в главное окно нашего магазина EcWid.window
			
			paramsObj - обьект с настройками, если не переданы, то будут использоваться по умолчанию
		*/
		
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
				
		// получим товары и отобразим их
		this.loadData('products','EcWid.getProducts',function(){
			
			var li, a, img,
				key;
			
			// создадим контейнер для товаров (UL), если он не создан ранее			
			if(this.goodsWindow === null){
				
				this.goodsWindow = document.createElement('ul');
				this.goodsWindow.className = 'goods floatfix';	
						
			}else{
				
				this.goodsWindow.innerHTML = '';
			}
			
			// создадим товары
				for(key in this.products){
					
					li = document.createElement('li');
					a = document.createElement('a');
					img = document.createElement('img');
					
					if(this.products[key].thumbnailUrl){
						img.src = this.products[key].thumbnailUrl;
					}else{
						img.className = 'noimage';
					}
					
					a.href = '#!/~/product/id=' + this.products[key].id;
					
					a.appendChild(img);
					
					a.innerHTML += this.products[key].name;
					
					li.appendChild(a);									
					this.goodsWindow.appendChild(li);	
				}
				
			// поместим в документ
				this.contentContainer.appendChild(this.goodsWindow);			
		},params);
		
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

var EcWid = {

	"categories": [],							// все категории, массив обьектов
	"products": [],								// все товары, массив обьектов
	"windowSelector": "ecwid-shop",				// там, где будет размещаться весь интерфейс магазина, это может быть div
	"shopId": 5266003,							// id магазина
	"apiUrl": "http://appdev.ecwid.com/api/v1" 	// url ecwid api
};

	EcWid.generateUniqId = function(){
		
		
		/* генерация уникального id для html элементов */
		
	    var d = new Date().getTime();
	    var uuid = 'ecwid-xxxx-xxxx-yxxx-xxxxx'.replace(/[xy]/g, function(c) {
	        var r = (d + Math.random()*16)%16 | 0;
	        d = Math.floor(d/16);
	        return (c=='x' ? r : (r&0x7|0x8)).toString(16);
	    });
		
	    return uuid;
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
				
				paramString += '&' + key + '=' + params[key];
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
	
	
	EcWid.getCategories = function(categories){
		// получение всего списка категорий
		
		this.categories = categories;
	};

	EcWid.getProducts = function(products){
		// получение всего списка товаров
		
		this.products = products;
	};	
	
	EcWid.init = function(){
	
		
		// инициируем главное окно магазина, там где будет размещаться весь интерфейс
		this.window = document.getElementById( this.windowSelector );
		
		// загрузим категории и создадим на их основе главное меню
		this.loadData('categories','EcWid.getCategories',this.gerenateMainMenu);
		
		// загрузим и отобразим список товаров
		this.loadData('products','EcWid.getProducts',this.showGoods);
	};
	
	
	EcWid.showGoods = function(){
	
	
		/* Отображение списка товаров 
			
			Сгенерируем блок с товарами (UL), после чего сгеренируем каждый товар (LI), добавим товары в блок
			и затем вставим его в главное окно нашего магазина EcWid.window
		*/
		
		var goodsWindow;		// глвный элемент, который будет отображать список товаров

			
		// генерация элемента, который будет отображать список товаров
		goodsWindow = document.createElement('ul');
		
		// получим данные о товарах
		
		// создадим товары
		
		// поместим в документ
		
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
		
		// создадим главный контейнер меню, и поместим его в главное окно EcWid
			mainContainer = document.createElement('ul');
			mainContainer.id = 'dropdown-nav';
			mainContainer.className = 'dropdown';
			
			this.window.appendChild(mainContainer);
			
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
			li.innerHTML = '<a href="#'+EcWid.categories[key].id+'">'+EcWid.categories[key].name+'</a>';
			
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

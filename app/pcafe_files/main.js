/*
  Author: Егор Danmer Котляров (egor@rio3d.ru)
  Libraries:
    - Modernizr load
	- jQuery with plugins: imagesLoaded, waypoints, mousewheel
	- jQuery UI: only datepicker + timepicker
	- History (jQuery version)
	- Rio3D ImageViewer
*/

(function () {

$(function () {

	'use strict';


	var debug = false,
		$window = $(window),
		$html = $('html'),
		$body = $('body'),
		$container = $('#container'),
		$sitemenu = $('#sitemenu'),
		$content = $('#sitecontent'),
		$footer = $('#sitefooter'),
		$player = $('#player'),
		$jplayer = $('#jplayer'),
		$overlay = $('#overlay'),
		$imagepreview = $('#imagepreview'),
		$dialog = $('#dialog'),
		$section = [0],
		$page = [0],
		$nav = [0],
		$gallery = [0],
		$form = [0],
		$headers = [],
		sections = {},
		state,
		section = '',
		page = '',
		href = '',
		dialog_page = '',
		containerHeight = 0,
		winHeight = $window.height(),
		winWidth = $window.width(),
		winScrolled,
		$this,
		accel = 0.1,
		accel_interval,
		music = false,

		loadingStart = function () {
			$body.addClass('progress');
		},
		loadingStop = function () {
			$body.removeClass('progress');
		},
		scrollToTop = function () {
			winScrolled = true;
			if (nav.$links.length) nav.$links.removeClass('active');
			$html.add($body).stop().animate({scrollTop: 0}, 2000, function () {
				winScrolled = false;
			});
		},
		scrollByLink = function (link) {
			var href = $(link).blur().attr('href'),
				$caption = $(href);
			if ($caption.length) {
				var positionTop = $caption.offset().top - 20;
				winScrolled = true;
				if (nav.$links.length) nav.$links.not($(link).addClass('active')).removeClass('active');
				$html.add($body).stop().animate({'scrollTop': positionTop}, 1000, function () {
					winScrolled = false;
				});
			} else if (href === '#') {
				scrollToTop();
			}
			return false;
		},
		sectionOpen = function (data) { if (debug) console.log('sectionOpen()');
			if (data) {
				document.title = data.title;
				$content.html(data.content);
			}
			section = location.pathname.split('/')[1] || 'home';
			page = location.pathname.split('/')[2] || 'index';
			$sitemenu.find('.active').removeClass('active').blur().end().find('.sitemenu-'+section).addClass('active');
			$section = $('.section').fadeTo(500, 1);
			$page = $section.find('.page');
			$nav = $('#nav');
			$gallery = $page.find('.gallery');
			if ($nav.length) {
				nav.enable();
			}
			if ($gallery.length) { if (debug) console.log('imageViewer()');
				$gallery.children('p').imageViewer();
			}
			if (sections[section] !== undefined) {
				sections[section].open();
			}
			$content.imagesLoaded(function( ) {
				containerHeight = $container.height();
				if (containerHeight < winHeight) {
					$footer.addClass('fixed');
				} else {
					$footer.removeClass('fixed');
				}
				$.waypoints('refresh');
				loadingStop();
			});
		},
		sectionClose = function (data) { if (debug) console.log('sectionClose()');
			$section.fadeTo(500, 0, function () {
				if (sections[section] !== undefined) {
					sections[section].close();
				}
				if ($nav.length) {
					nav.disable();
				}
				sectionOpen(data);
			});
			if (!$player.hasClass('on')) {
				$player.find('.artist').html('Fausto Papetti<br />Medley - Samba Pa Ti');
				$jplayer.jPlayer("setMedia", {
					mp3: '/assets/audio/Fausto Papetti - Medley - Samba Pa Ti - Sax Party.mp3',
					oga: '/assets/audio/Fausto Papetti - Medley - Samba Pa Ti - Sax Party.ogg'
				});
			}
		},
		openImagePreview = function (href, title) {
			$('<img src="'+href+'" alt="Предпросмотр" class="imagepreview-img">').on('load', function () {
				var width = $(this)[0].width,
					height = $(this)[0].height;
				if (title) {
					$imagepreview.find('.imagepreview-title').text(title).show();
				} else {
					$imagepreview.find('.imagepreview-title').hide();
				}


				$imagepreview.css({
					'marginLeft': -width/2,
					'marginTop': -height/2
				});
				$overlay.fadeTo(500, 0.5);
				$imagepreview.fadeIn();

				$body.on('click.closeImagePreview', function () {
					closeImagePreview(href);
					$body.off('click.closeImagePreview');
				});
			}).prependTo($imagepreview);
		},
		closeImagePreview = function () {
			$overlay.fadeOut();
			$imagepreview.fadeOut( function () {
				$(this).find('img').remove();
			});
		},

		// *************************************************
		// Навигационное меню
		// *************************************************
		nav = {
			$links: [],
			$captions: [],
			fullHeight: 0,
			isExpanded: true,
			isFixed: false,
			// активируем навигацию
			enable: function () { if (debug) console.log('nav.enable()');
				nav.$links = $nav.find('.h2, .h3').children('a[href^=#]');
				nav.$captions = $page.find('h2[id], table[id]');
				// ждем загрузки всех картинок в контент зоне
				$page.find('img').imagesLoaded(function () {
					nav.fullHeight = $nav.height();
					// фиксация навигации по меню
					$section.find('h1').waypoint(nav.fixTop, {offset: 11-85});
					// выделение пунктов навигации при движении по меню
					// TODO: добавить проверку, чтобы самая первая ссылка не гасла
					nav.$captions.waypoint(nav.selectLink, {offset: '20%'});
					nav.refresh();
				});
			},
			// фиксируем навигацию при скроллинге вниз
			fixTop: function (event, direction) { if (debug) console.log('nav.fixTop()');
				if (direction === 'down') {
					if (!nav.isFixed) {
						$nav.addClass('fixed');
						nav.isFixed = true;
					}
				} else {
					if (nav.isFixed) {
						$nav.removeClass('fixed');
						nav.isFixed = false;
					}
				}
			},
			// не даём навигации вылезти снизу
			fixBottom: function (event, direction) { if (debug) console.log('nav.fixBottom()');
				if (direction === 'down') {
					if (nav.isFixed) {
						$nav.addClass('bottom');
						nav.isFixed = false;
					}
				} else {
					if (!nav.isFixed) {
						$nav.removeClass('bottom');
						nav.isFixed = true;
					}
				}
			},
			// выделяем ссылку соответсвующую разделу на экране
			selectLink: function (event, direction) { if (debug) console.log('nav.selectLink()');
				var id = $(this).attr('id');
				if (id && nav.$links.filter('a[href="#' + id + '"]').length && !winScrolled) {
					if (direction === 'down') {
						nav.$links.removeClass('active').filter('a[href="#' + id + '"]').addClass('active');
					} else {
						nav.$links.removeClass('active').filter('a[href="#' + id + '"]').parent().prev().children().addClass('active');
					}
				}
			},
			/*
			// скроллимся к выбранному разделу
			scrollToHeader: function () { if (debug) console.log('nav.scrollToHeader()');
				var href = $(this).attr('href'),
					$caption = $(href);
				if ($caption.length) {
					var positionTop = $caption.offset().top - 20;
					winScrolled = true;
					nav.$links.not($(this).addClass('active')).removeClass('active');
					$html.add($body).stop().animate({'scrollTop': positionTop}, 1000, function () {
						winScrolled = false;
					});
				} else if (href === '#') {
					winScrolled = true;
					App.el.$html.add(App.el.$body).stop().animate({'scrollTop': 0}, 2000, function () {
						winScrolled = false;
					});
				}
				return false;
			},
			*/
			// начинаем заного отслеживание навигации из-за изменения размера
			refresh: function () { if (debug) console.log('nav.refresh()');
				var navHeight = $nav.outerHeight(),
					navMaxOffset = navHeight + 40;
				// TODO: как еще сделать, чтобы навигация влазила в высоту маленького экрана
				// сворачиваем и разворачиваем подпункты навигации, если с ними не влазит по высоте
				if (nav.fullHeight + 60 > winHeight) {
					if (nav.isExpanded) {
						$nav.find('.h2 ul').slideUp();
						$page.find('table').waypoint('remove');
						nav.isExpanded = false;
					}
				} else {
					if (!nav.isExpanded) {
						$nav.find('.h2 ul').slideDown();
						$page.find('table').waypoint();
						nav.isExpanded = true;
					}
				}
				// пересчитываем допустимое смещение, чтобы подвал не залез на навигацию
				$footer.waypoint(nav.fixBottom, { offset: navMaxOffset });
				$.waypoints('refresh');
			},
			// отключаем слежение за навигацией
			disable: function () { if (debug) console.log('nav.disable()');
				$section.find('h1').waypoint('destroy');
				nav.$links.waypoint('destroy');
				nav.$captions.waypoint('destroy');
				$footer.waypoint('destroy');
			}
		};





	sections.home = {
		open: function () {
			var $promo = $page.find('.promo');

			/*
			if ($('#new-year').length) {
				var flashvars = {},
					params = {
						quality: "high",
						bgcolor: "#000000",
						allowscriptaccess: "sameDomain",
						allowfullscreen: "true",
						base: ".",
						wmode: "opaque"
					},
					attributes = {
						id: "new-year_swf",
						name: "new-year_swf",
						align: "middle"
					};
				swfobject.embedSWF("/assets/swf/new-year.swf", "new-year", "970", "90", "9.0.0", "expressInstall.swf", flashvars, params, attributes);
			}
			*/

			/*
			setTimeout(function () {
				$promo.find('.promo-li.first').html('<a href="#news" class="promo-a scrolllink" style="background: url(\'/assets/img/promo/promo1.gif\') no-repeat center center;"></a>').imagesLoaded(function () {
					$(this).fadeIn(3000);
				})
			}, 1000);
			*/

			/*
			$promo.find('.features-a').on('click', function () {
				var link = $(this).data('link') || '#';
				if ($(this).hasClass('active')) {
					$(this).removeClass('active').blur();
					$promo.find('.promo-li:last').not('.first').fadeOut(1000, function () {
						$(this).remove();
					});
				} else {
					var feature = $(this).attr('class').replace('features-a ', '');
					var $last = $promo.find('.promo-li:last').not('.first');
					var $new = $('<li class="promo-li" style="display: none"><a href="'+link+'" class="promo-a pagelink" style="background: url(\'/assets/img/promo/'+feature+'.jpg?'+((new Date()).getTime())+'\') no-repeat center center;"></a></li>');
					$promo.find('.promo-ul').append($new).imagesLoaded(function () {
						$new.fadeIn(1000, function () {
							$last.remove();
						});
					});
					$promo.find('.features-a').removeClass('active');
					$(this).addClass('active');
				}
				return false;
			});
			*/
		},
		close: function () {

		}
	}


	sections.menu = {
		open: function () {
			// предпросмотр пирогов и тортов
			if ($('.menu-item').length) {
				$('.menu-item').on('click', function () {
					//href = $(this).find('.menu-item-img').attr('src');
					//window.open(href, '_blank');
					return false;
				});
			}

			// Калькулятор для банкетного меню
			if ($('#calculate').length) {


				// показываем элементы калькулятора и расчитываем суммы сохраненных данных
				$('#calculate').on('click', function () {
					$page.toggleClass('calculate');
					/*
					if ($page.hasClass('calculate')) {
						setTimeout(function () { $page.find('.col5').addClass('highlight'); }, 500)
						setTimeout(function () { $page.find('.col5').removeClass('highlight'); }, 1000)
					}
					*/
					sections.menu.calculate();
					return false;
				});

				// добавить количество блюда
				$page.on('mousedown', '.dish-plus, .dish-minus', function () {
					var $this = $(this),
						action = $this.hasClass('dish-plus') ? 'plus' : 'minus';
					accel = 1;
					sections.menu[action]($this);
					accel_interval = setInterval(function () {
						accel += 0.5;
						sections.menu[action]($this);
					}, 200);
					return false;
				});

				// расчитать стоимость выбранных блюд
				$page.on('mouseup mouseleave', '.c5', function () {
					clearInterval(accel_interval);
					sections.menu.calculate();
				});

				// подготовить выбранное меню к печати
				$('#banket-menu').find('.preview').on('click', sections.menu.print_preview);

				// сохранить выбранные блюда
				$('#banket-menu').find('.save').on('click', sections.menu.save_menu);

				// очистить выбранные блюда
				$('#banket-menu').find('.clear').on('click', sections.menu.clear);
			}



		},

		close: function () {

		},

		plus: function ($button) {
			var $count = $button.parent().children('.dish-count'),
				count = parseInt($count.text());
			count += Math.round(accel);
			$count.text(count).parent().removeClass('zero');

			if ( ! $nav.find('.banket-menu-link').hasClass('enable')) {
				$nav.find('.banket-menu-link').addClass('enable');
			}
		},

		minus: function ($button) {
			var $count = $button.parent().children('.dish-count'),
				count = parseInt($count.text());
			if (count > 0) {
				count -= Math.round(accel);
				$count.text(count);
				if (count === 0) {
					$count.parent().addClass('zero');
				}
			}
		},

		calculate: function () {
			var banket_summ = 0,
				banket_menu = '';
			$page.children('section:not(:last)').each(function(){
				var section_sum = 0,
					$counters = $(this).find('.dish-counter:not(.zero)');
				banket_menu += '<table><caption>' + $(this).children('h2').text() + '</caption><colgroup><col class="col1" /><col class="col2" /><col class="col3" /><col class="col4" /><col class="col5" /></colgroup><tbody>';
				if ($counters.length) {
					$counters.each(function() {
						var count = parseInt($(this).find('.dish-count').text()),
							cost = parseInt($(this).parents('tr').find('.c4').text().replace(' ', ''));
						section_sum += count * cost;
						banket_menu += '<tr>' + $(this).parents('tr').html() + '</tr>';
					});
				} else {
					banket_menu += '<tr><td class="c1" colspan="5">Не выбрано</td></tr><tr><td></td><td></td><td></td><td></td><td></td></tr>';
				}
				banket_menu += '</tbody></table>';
				banket_summ += section_sum;
				$(this).find('.section-sum span').text((section_sum+'').replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1 "));
			});

			$('#banket-menu').children('.banket-menu-list').html(banket_menu);
			$('#banket-menu').children('.banket-menu-summ').children('strong').text((banket_summ+'').replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1 ") + ' руб.');

			nav.refresh();
		},

		print_preview: function () {
			var banket_data = [],
				count = 0,
				id = '';
			$page.children('section:not(:last)').find('.dish-counter:not(.zero)').each(function (i, el) {
				count = $(this).children('.dish-count').text();
				id = $(this).parents('tr').attr('id');
				banket_data[i]= id + '=' + count;
			});

			window.open('/print/menu/?'+banket_data.join('&'),'myconsole','width=800,height=600,menubar=1,toolbar=1,status=0,scrollbars=1,resizable=1');

			/* другой метод вывода контента - напрямую в открываемое окно (не работает в ie)
			var datetime = new Date;
			top.consoleRef = window.open('','myconsole','menubar=1,toolbar=1,status=0,scrollbars=1,resizable=1');
			top.consoleRef.document.writeln('<html><head><title>Банкетное меню в Премиум Кафе</title><link rel="stylesheet" href="/assets/css/banket-print.css" /><style> section {display: none;} #banket-menu { display: block;}</style> </head><body>'+$('#banket-menu').html()+'</div><div class="copyright">Страница распечатана на сайте www.premiumcafe.ru в ' + datetime.getHours() + ':' + datetime.getMinutes() + ' ' + datetime.getDate() + '.' + datetime.getMonth() + '.' + datetime.getFullYear() +'<p><button class="print" onmouseup="window.print()">Распечатать</button></p></body></html>');
			top.consoleRef.document.close();
			*/
			return false;
		},

		save_menu: function () {
			var banket_data = {},
				count = 0,
				id = '';
			$page.children('section:not(:last)').find('.dish-counter:not(.zero)').each(function () {
				count = $(this).children('.dish-count').text();
				id = $(this).parents('tr').attr('id');
				banket_data[id] = count;
			});
			$.ajax('/menu/save/', {type: 'post', data: banket_data});
			return false;
		},

		clear: function () {
			$page.children('section:not(:last)').find('.dish-counter:not(.zero)').each(function () {
				$(this).addClass('zero').find('.dish-count').text('0');
			});
			sections.menu.calculate();
			return false;
		}
	};





	sections.shop = {
		open: function () {

			sections.shop.calculate();

			// добавить количество блюда
			$page.on('mousedown', '.addbutton, .dish-plus, .dish-minus', function () {
				var $this = $(this),
					step = parseFloat($this.parent().data('step')),
					action = $this.hasClass('dish-minus') ? 'minus' : 'plus';
				accel = step;
				sections.shop[action]($this);
				accel_interval = setInterval(function () {
					accel += step;
					sections.shop[action]($this);
				}, 200);

				if ($this.hasClass('addbutton')) {
					var $menuItem = $this.parents('.menu-item');
					var $basketButton = $('#nav .basketlink');
					var menuItemOffset = $menuItem.offset();
					var basketButtonOffset = $basketButton.offset();
					var css1 = {
						display: 'none',
						position: 'absolute',
						backgroundColor: 'rgba(255,255,200,0.2)',
						border: '2px solid #CC6',
						borderRadius: 5,
						top: menuItemOffset.top,
						left: menuItemOffset.left,
						width: $menuItem.outerWidth(),
						height: $menuItem.outerHeight()
					}
					var css2 = {
						top: basketButtonOffset.top,
						left: basketButtonOffset.left,
						width: $basketButton.outerWidth(),
						height: $basketButton.outerHeight()
					}
					var $border = $('<div>').css(css1).fadeIn('fast').animate(css2, 'slow').fadeOut('fast', function(){$(this).remove()});
					$body.append($border);
				}
				return false;
			});

			// расчитать стоимость выбранных блюд
			$page.on('mouseup mouseleave', '.dish-counter', function () {
				clearInterval(accel_interval);
				sections.shop.calculate();
			});

			// сохранить выбранные блюда
			$('#basket-save').on('click', sections.shop.save_menu);

			// очистить выбранные блюда
			$('#basket-clear').on('click', sections.shop.clear);

			$('#nav .basketlink').on('click', function () {

			});


			$('.menu-item-style span').on('click', function () {
				var i = $(this).index();
				$(this).parents('td').find('.menu-item-desc').eq(i).show();
				$(this).parents('td').find('.menu-item-desc').eq(1-i).hide();
			})
		},

		close: function () {

		},

		plus: function ($button) {
			var $count = $button.parent().children('.dish-count'),
				count = parseFloat($count.text());
			count += accel;
			$count.text(Math.round(count*10)/10).parent().removeClass('zero');
		},

		minus: function ($button) {
			var $count = $button.parent().children('.dish-count'),
				count = parseFloat($count.text());
			if (count > 0) {
				count -= accel;;
				if (count <= 0) {
					count = 0;
					$count.parent().addClass('zero');
				}
				$count.text(Math.round(count*10)/10)
			}
		},

		calculate: function () {
			var basket_summ = 0,
				basket_menu = '';
			$page.children('section:not(:last):not(:first)').each(function(){
				var section_sum = 0,
					$counters = $(this).find('.dish-counter:not(.zero)');
				basket_menu += '<table><caption>' + $(this).children('h2').text() + '</caption><colgroup><col class="col1" /><col class="col2" /><col class="col3" /><col class="col4" /><col class="col5" /></colgroup><tbody>';
				if ($counters.length) {
					$counters.each(function() {
						var count = parseFloat($(this).find('.dish-count').text()), $parent, title, desc, weight, unit, cost, item_cost;
						if ($(this).parents('tr').length) {
							$parent = $(this).parents('tr').clone();
							cost = parseFloat($parent.find('.c4').text().replace(' ', ''));
							basket_menu += '<tr>' + $parent.html() + '</tr>';

						} else {
							$parent = $(this).parents('.menu-item');
							cost = parseInt($parent.find('.menu-item-cost').text().replace(' ', '')) || 0;
							title = $parent.find('b').text();
							desc = $parent.find('.menu-item-desc').text();
							weight =  $parent.find('.menu-item-weight').text();
							unit = $parent.find('.dish-unit').text();
							item_cost = cost * count
							basket_menu += '<tr><td class="c1"><strong class="title">'+title+'</strong><div class="desc">'+desc+'</div></td><td class="c2">&nbsp;&nbsp;&nbsp;</td><td class="c3"></td><td class="c3">'+count+' '+unit+'</td><td class="c4"><div class="dish-counter">'+item_cost+' руб.</div></td></tr>';
						}
						section_sum += item_cost;
					});
				} else {
					basket_menu += '<tr><td class="c1" colspan="5">Не выбрано</td></tr><tr><td></td><td></td><td></td><td></td><td></td></tr>';
				}
				basket_menu += '</tbody></table>';
				basket_summ += section_sum;
				$(this).find('.section-sum span').text((section_sum+'').replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1 "));
			});

			$('#basket').children('.basket-list').html(basket_menu);
			$('#basket').children('.basket-summ').children('strong').text((Math.round(basket_summ)+'').replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1 ") + ' руб.');
			$('#nav .basketlink-counter').text(' ' + Math.round(basket_summ) + ' руб.');

			nav.refresh();
		},

		save_menu: function () {
			var basket_data = {},
				count = 0,
				id = '';
			$page.children('section:not(:last)').find('.dish-counter:not(.zero)').each(function () {
				count = $(this).children('.dish-count').text();
				id = $(this).parents('tr').length ? $(this).parents('tr').attr('id') : $(this).parents('.menu-item').attr('id');
				basket_data[id] = count;
			});
			$.ajax('/shop/save/', {type: 'post', data: basket_data});
			return false;
		},

		clear: function () {
			$page.children('section:not(:last)').find('.dish-counter:not(.zero)').each(function () {
				$(this).addClass('zero').find('.dish-count').text('0');
			});
			sections.shop.calculate();
			return false;
		}
	}






	sections.gallery = {
		open: function () {
			if ($('#tour_swf').length) {
				var flashvars = {},
					params = {
						quality: "high",
						bgcolor: "#000000",
						allowscriptaccess: "sameDomain",
						allowfullscreen: "true",
						base: ".",
						wmode: "opaque"
					},
					attributes = {
						id: "pano",
						name: "pano",
						align: "middle"
					};
				swfobject.embedSWF("/assets/swf/main.swf", "tour_swf", "100%", "480", "9.0.0", "expressInstall.swf", flashvars, params, attributes);
			}
		},
		close: function () {}
	};

	sections.info = {

		open: function () {
			$.getScript('http://api-maps.yandex.ru/2.0-stable/?lang=ru-RU&coordorder=longlat&load=package.full&wizard=constructor&onload=fid_1358857264480237052351', sections.info.initYandexMaps);
		},
		close: function () {},

		initYandexMaps: function () {
			window.fid_1358857264480237052351 = function(ymaps) {
				var map = new ymaps.Map("ymaps-map-id_1358857264480237052351", {center: [60.54863012854288, 56.81269333599808], zoom: 16, type: "yandex#map"});
				map.controls.add("zoomControl").add("mapTools").add(new ymaps.control.TypeSelector(["yandex#map", "yandex#satellite", "yandex#hybrid", "yandex#publicMap"]));
				map.geoObjects.add(new ymaps.Placemark([60.5473480326333, 56.8125991824464], {balloonContent: ""}, {preset: "twirl#greenDotIcon"}));
			};
		},

		initGoogleMaps: function () {
			/*
			if ($('#map_canvas').length) {
				window.google = window.google || {};
				google.maps = google.maps || {};
				var modules = google.maps.modules = {};
				google.maps.__gjsload__ = function(name, text) {
					modules[name] = text;
				};
				google.maps.Load = function(apiLoad) {
					delete google.maps.Load;
					apiLoad([null,[[["http://mt0.googleapis.com/vt?lyrs=m@177000000\u0026src=api\u0026hl=ru-RU\u0026","http://mt1.googleapis.com/vt?lyrs=m@177000000\u0026src=api\u0026hl=ru-RU\u0026"],null,null,null,null,"m@177000000"],[["http://khm0.googleapis.com/kh?v=110\u0026hl=ru-RU\u0026","http://khm1.googleapis.com/kh?v=110\u0026hl=ru-RU\u0026"],null,null,null,1,"110"],[["http://mt0.googleapis.com/vt?lyrs=h@177000000\u0026src=api\u0026hl=ru-RU\u0026","http://mt1.googleapis.com/vt?lyrs=h@177000000\u0026src=api\u0026hl=ru-RU\u0026"],null,null,"imgtp=png32\u0026",null,"h@177000000"],[["http://mt0.googleapis.com/vt?lyrs=t@128,r@177000000\u0026src=api\u0026hl=ru-RU\u0026","http://mt1.googleapis.com/vt?lyrs=t@128,r@177000000\u0026src=api\u0026hl=ru-RU\u0026"],null,null,null,null,"t@128,r@177000000"],null,[[null,0,7,7,[[[330000000,1246050000],[386200000,1293600000]],[[366500000,1297000000],[386200000,1320034790]]],["http://mt0.gmaptiles.co.kr/mt?v=kr1.16\u0026hl=ru-RU\u0026","http://mt1.gmaptiles.co.kr/mt?v=kr1.16\u0026hl=ru-RU\u0026"]],[null,0,8,8,[[[330000000,1246050000],[386200000,1279600000]],[[345000000,1279600000],[386200000,1286700000]],[[354690000,1286700000],[386200000,1320035000]]],["http://mt0.gmaptiles.co.kr/mt?v=kr1.16\u0026hl=ru-RU\u0026","http://mt1.gmaptiles.co.kr/mt?v=kr1.16\u0026hl=ru-RU\u0026"]],[null,0,9,9,[[[330000000,1246050000],[386200000,1279600000]],[[340000000,1279600000],[386200000,1286700000]],[[348900000,1286700000],[386200000,1302000000]],[[368300000,1302000000],[386200000,1320035000]]],["http://mt0.gmaptiles.co.kr/mt?v=kr1.16\u0026hl=ru-RU\u0026","http://mt1.gmaptiles.co.kr/mt?v=kr1.16\u0026hl=ru-RU\u0026"]],[null,0,10,19,[[[329890840,1246055600],[386930130,1284960940]],[[344646740,1284960940],[386930130,1288476560]],[[350277470,1288476560],[386930130,1310531620]],[[370277730,1310531620],[386930130,1320034790]]],["http://mt0.gmaptiles.co.kr/mt?v=kr1.16\u0026hl=ru-RU\u0026","http://mt1.gmaptiles.co.kr/mt?v=kr1.16\u0026hl=ru-RU\u0026"]],[null,3,7,7,[[[330000000,1246050000],[386200000,1293600000]],[[366500000,1297000000],[386200000,1320034790]]],["http://mt0.gmaptiles.co.kr/mt?v=kr1p.16\u0026hl=ru-RU\u0026","http://mt1.gmaptiles.co.kr/mt?v=kr1p.16\u0026hl=ru-RU\u0026"]],[null,3,8,8,[[[330000000,1246050000],[386200000,1279600000]],[[345000000,1279600000],[386200000,1286700000]],[[354690000,1286700000],[386200000,1320035000]]],["http://mt0.gmaptiles.co.kr/mt?v=kr1p.16\u0026hl=ru-RU\u0026","http://mt1.gmaptiles.co.kr/mt?v=kr1p.16\u0026hl=ru-RU\u0026"]],[null,3,9,9,[[[330000000,1246050000],[386200000,1279600000]],[[340000000,1279600000],[386200000,1286700000]],[[348900000,1286700000],[386200000,1302000000]],[[368300000,1302000000],[386200000,1320035000]]],["http://mt0.gmaptiles.co.kr/mt?v=kr1p.16\u0026hl=ru-RU\u0026","http://mt1.gmaptiles.co.kr/mt?v=kr1p.16\u0026hl=ru-RU\u0026"]],[null,3,10,null,[[[329890840,1246055600],[386930130,1284960940]],[[344646740,1284960940],[386930130,1288476560]],[[350277470,1288476560],[386930130,1310531620]],[[370277730,1310531620],[386930130,1320034790]]],["http://mt0.gmaptiles.co.kr/mt?v=kr1p.16\u0026hl=ru-RU\u0026","http://mt1.gmaptiles.co.kr/mt?v=kr1p.16\u0026hl=ru-RU\u0026"]]],[["http://cbk0.googleapis.com/cbk?","http://cbk1.googleapis.com/cbk?"]],[["http://khm0.googleapis.com/kh?v=56\u0026hl=ru-RU\u0026","http://khm1.googleapis.com/kh?v=56\u0026hl=ru-RU\u0026"],null,null,null,null,"56"],[["http://mt0.googleapis.com/mapslt?hl=ru-RU\u0026","http://mt1.googleapis.com/mapslt?hl=ru-RU\u0026"]],[["http://mt0.googleapis.com/mapslt/ft?hl=ru-RU\u0026","http://mt1.googleapis.com/mapslt/ft?hl=ru-RU\u0026"]],[["http://mt0.googleapis.com/vt?hl=ru-RU\u0026","http://mt1.googleapis.com/vt?hl=ru-RU\u0026"]]],["ru-RU","US",null,0,null,null,"http://maps.gstatic.com/mapfiles/","http://csi.gstatic.com","https://maps.googleapis.com","http://maps.googleapis.com"],["http://maps.gstatic.com/intl/ru_ru/mapfiles/api-3/9/0","3.9.0"],[2450764878],1.0,null,null,null,null,0,"",null,null,0,"http://khm.googleapis.com/mz?v=110\u0026",null,"https://earthbuilder.google.com","https://earthbuilder.googleapis.com"], loadScriptTime);
				};
				var loadScriptTime = (new Date).getTime();
				Modernizr.load({
					test: google.maps.LatLng,
					nope: 'http://maps.gstatic.com/intl/ru_ru/mapfiles/api-3/9/0/main.js',
					complete: function () {
						//42.272038,3.160028
						var myLatlng = new google.maps.LatLng(56.8127,60.5475);
						var myOptions = {
							zoom: 15,
							center: myLatlng,
							overviewMapControl: true,
							mapTypeId: google.maps.MapTypeId.ROADMAP
						};

						var map = new google.maps.Map(document.getElementById("map_canvas"), myOptions);

						var infowindow = new google.maps.InfoWindow({
							content: '<div class="marker"><span>Премиум Кафе</span></div>'
						});

						var marker = new google.maps.Marker({
							position: myLatlng,
							map: map,
							title: "Премиум Кафе",
							icon: new google.maps.MarkerImage('/assets/img/map_marker2.png', new google.maps.Size(60, 60), new google.maps.Point(0, 0), new google.maps.Point(60, 60)),
							styles: [ { stylers: [ { visibility: "on" }, { invert_lightness: true } ] } ]
						});
					}
				});
			}*/
		}
	};




	/**************************************************************************************************************/





	// Проверяем, работает ли History API (не путать с window.history)
	if (window.History.enabled) {
		// Биндим действие, которое будет происходить при изменении адресной строки
		window.History.Adapter.bind(window, 'statechange', function () {

			// Открываем новую страницу
			state = window.History.getState(); // => State.data, State.title, State.url
			$.ajax({url: state.url, dataType: 'json'}).done(sectionClose);
		});

		// Открывать внутренние страницы с анимацией
		$body.on('click', '.pagelink', function (e) { if (debug) log('ajaxLoad()');
			// BUG: Хром почему-то устанавливает фиксированную высоту к HTML, поэтому приходится заменять на auto
			$html.css('height', '');
			scrollToTop();
			href = $(this).attr('href');
			window.History.pushState({}, 'Загрузка...', href);
			return false;
		});

		// Открывать внутренние страницы с анимацией
		$body.on('mouseup', '.swflink', function (e) { if (debug) log('ajaxLoad()');
			// BUG: Хром почему-то устанавливает фиксированную высоту к HTML, поэтому приходится заменять на auto
			$html.css('height', '');
			scrollToTop();
			href = $(this).attr('href');
			window.History.pushState({}, 'Загрузка...', href);
			return false;
		});

		// Отображать запуск и остановку процесса ajax-загрузки страниц
		$(document).ajaxStart(loadingStart).ajaxStop(loadingStop);
	}

	// Ссылка на верх страницы
	$body.on('click', '.toplink', function () {
		$(this).blur();
		scrollToTop();
		return false;
	});

	$content.on('click', '.toggle', function () {
		$(this).parent().next().slideToggle();
		return false;
	});

	$body.on('click', '.closedlink', function () {
		window.alert('Данная страница находится в разработке');
		return false;
	});




	$window.on('resize', function () {
		winHeight = $window.height();
		winWidth = $window.width();
		if ($nav.length) {
			nav.refresh();
		}
		if (containerHeight < winHeight) {
			$footer.addClass('fixed');
		} else {
			$footer.removeClass('fixed');
		}
	})


	sectionOpen();


	$imagepreview.on('click', function () {
		$overlay.fadeOut();
		$imagepreview.fadeOut();
	});

	$body.on('click', '.dialoglink', function () {
		href = $(this).attr('href');
		$dialog.removeClass('dialog-' + dialog_page);
		dialog_page = href.split('/')[2];
		$overlay.fadeTo(500, 0.5);
		$dialog.addClass('dialog-' + dialog_page).fadeIn();
		if ($dialog.find('#page-' + dialog_page).length === 0) {
			$dialog.children('.loading').show();
			$.ajax({url: href, dataType: 'json'}).done(function (data) {
				$dialog.children('.loading').hide();
				$dialog.append(data.content);
				if ($dialog.find('.datetime').length) {
					$dialog.find('.datetime input').datetimepicker({
						hour: 19,
						hourMin: 18,
						hourMax: 23,
						stepMinute: 10
					});
				}

				if ($dialog.find('.datetime-all').length) {
					$dialog.find('.datetime-all input').datetimepicker({
						hour: 19,
						stepMinute: 10
					});
				}
			});
		}

		// add to selected waitings
		if (dialog_page === 'wait') {
			var active = href.split('?')[1].split('=')[1];
			$dialog.find('[value='+active+']').prop('checked', true).parent().addClass('checked');
		}

		return false;
	});

	$dialog.on('submit', 'form', function () {

		$('#page-status').empty();
		$form = $(this).closest('form');
		var $required = $form.find('.contacts.required');

		if ($required.length && !$required.find('input').val()) {
			$required.find('input').addClass('required').attr('placeholder', 'Введите ваш телефон в это поле').on('focus.required', function() {
				$(this).removeClass('required').off('focus.required');
			});
		} else {
			$form.find('.message').animate({'marginLeft': 300}, 5000, 'linear');

			if ($('#basket').length) {
				$('#basket_data').val($('#basket .basket-list').html() + '<p class="section-sum">' + $('#basket .basket-summ').html() + '</p>');
			}

			$.ajax('/dialog/send/', {type: 'post', data: $form.serializeArray(), dataType: 'json', timeout: 10000, cache: false}).complete(function () {
				$form.find('.message').stop().css('marginLeft', -60);
			}).fail(function (request, status, error) {
				window.alert('Произошла ошибка. Техническая служба проинформирована. Извините за неудобства.');
				$.ajax('/dialog/send/', {type: 'post', data: {sendtype: 'feedback', target: 'tech', text: 'При отправке данных произошла ошибка.<br />Отправленные данные: ' + $form.serialize()+'<br />Ответ сервера: '+request.responseText}, timeout: 10000, cache: false});
			}).done(function (data) {
				if (dialog_page == 'basket') {
					var order_number = parseInt($('#page-basket [name="number"]').val()),
						order_header = $('#page-basket h2').text();
					$('#page-basket [name="number"]').val(order_number+1);
					$('#page-basket h2').text(order_header.replace(order_number, order_number+1));
				}
				$dialog.removeClass('dialog-' + dialog_page).addClass('dialog-status');
				dialog_page = 'status';
				$('#page-status').html(data.content);

			});
		}

		return false;
	});

	$dialog.on('click', '.pagebutton.cancel', function () {
		$dialog.fadeOut();
		$overlay.fadeOut();
		return false;
	});


	$dialog.on('focus', 'fieldset', function () {
		$(this).addClass('focus active').siblings().removeClass('focus');
	});

	$dialog.on('focus', '.target input', function () {
		$(this).parent().addClass('focus').siblings().removeClass('focus').parent().addClass('active');
	});

	$dialog.on('change', '.target input', function () {
		var $page_basket = $('#page-basket');

		$dialog.find('input').each(function () {
			if ($(this).prop('checked')) {
				$(this).parent().addClass('checked');
			} else {
				$(this).parent().removeClass('checked');
			}
		});

		if ($page_basket.length) {
			if ($page_basket.find('.target input:eq(0)').prop('checked')) {
				$dialog.find('.datetime-all, .address').hide();
			} else {
				$dialog.find('.datetime-all, .address').show();
			}
		}
	});

	/* AUDIO PLAYER */

	$body.on('click', '.audiolink', function () {
		href = $(this).attr('href');
		$player.find('.artist').html($(this).attr('title'));
		$jplayer.jPlayer("setMedia", {mp3: href, oga: href.replace('.mp3', '.ogg')}).jPlayer('play');
		$('.audiolink-stop').parent().remove();
		$('<span> | <a href="#" class="audiolink-stop">Остановить</a></span>').insertAfter($(this));
		return false;
	});

	$body.on('click', '.audiolink-stop', function () {
		$(this).parent().remove();
		$jplayer.jPlayer('pause');
		return false;
	});

	$player.on('click', function () {
		if ($player.hasClass('on')) {
			$jplayer.jPlayer('pause');
		} else {
			$jplayer.jPlayer('play');
		}
	})

	$jplayer.jPlayer({
		ready: function () {
			$player.find('.artist').html('Fausto Papetti<br />Medley - Samba Pa Ti');
			$jplayer.jPlayer("setMedia", {
				mp3: "/assets/audio/Fausto Papetti - Medley - Samba Pa Ti - Sax Party.mp3",
				oga: "/assets/audio/Fausto Papetti - Medley - Samba Pa Ti - Sax Party.ogg"
			});
		},
		swfPath: "/assets/swf",
		supplied: "mp3, oga"
	}).on($.jPlayer.event.play, function () {
		$player.addClass('on');
		$player.find('.artist').addClass('fast-show');
		setTimeout(function () {
			$player.find('.artist').removeClass('fast-show');
		}, 2000);
	}).on($.jPlayer.event.pause, function () {
		$player.removeClass('on');
		$('.audiolink-stop').parent().remove();
	});


	$body.on('click', '.imagelink', function () {
		var title = $(this).find('img').attr('title');
		href = $(this).attr('href');
		if (title === 'Посмотреть фотографию') title = false;
		openImagePreview(href, title);
		return false;
	});

	$body.on('click', '.menu-item', function () {
		return false;
	});

	$body.on('click', '.scrolllink', function () {
		scrollByLink(this)
		return false;
	});



	/* TEST */




	/*
	$('.features-ul').find('a').each(function (i) {
		var $that = $(this);
		setTimeout(function () {
			$that.addClass('active');
		},i*100 + 2000);
		setTimeout(function () {
			$that.removeClass('active');
		},i*100 + 2300);
	});
	*/

	/*
	$('.features-ul').find('a').each(function (i) {
		var $self = $(this);
		setTimeout(function () {
			$self[0].classList.add('active');
		},i*100 + 2000);
		setTimeout(function () {
			$self[0].classList.remove('active');
		},i*100 + 2300);
	});
	*/

	/*
	$('.features-ul').find('a').each(function (i) {
		$(this).delay(i*200 + 2000).animate({backgroundColor:'rgba(255, 100, 0, 0.3)'}).delay(i*200).animate({backgroundColor:'transparent'});
	});*/

});

// лечим баг оперы (почему-то не показывает фон-бекграунд)
document.getElementById('wrapper').style.height = 'auto';

// отображаем процесс загрузки
document.body.className = "progress";



$.datepicker.regional.ru = {
	closeText: 'Закрыть',
	prevText: '<Пред',
	nextText: 'След>',
	currentText: 'Сегодня',
	monthNames: ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'],
	monthNamesShort: ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'],
	dayNames: ['воскресенье', 'понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота'],
	dayNamesShort: ['вск', 'пнд', 'втр', 'срд', 'чтв', 'птн', 'сбт'],
	dayNamesMin: ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'],
	weekHeader: 'Не',
	dateFormat: 'dd.mm.yy',
	firstDay: 1,
	isRTL: false,
	showMonthAfterYear: false,
	yearSuffix: ''
};
$.datepicker.setDefaults($.datepicker.regional.ru);

$.timepicker.regional.ru = {
	timeOnlyTitle: 'Выберите время',
	timeText: 'Время',
	hourText: 'Часы',
	minuteText: 'Минуты',
	secondText: 'Секунды',
	millisecText: 'миллисекунды',
	currentText: 'Ближайшее время',
	closeText: 'Закрыть',
	ampm: false
};
$.timepicker.setDefaults($.timepicker.regional.ru);



}());
/*


var el = document.documentElement
		    , rfs = // for newer Webkit and Firefox
		           el.requestFullScreen
		        || el.webkitRequestFullScreen
		        || el.mozRequestFullScreen
		        || el.msRequestFullScreen
		;
		if(typeof rfs!="undefined" && rfs){
		  rfs.call(el);
		} else if(typeof window.ActiveXObject!="undefined"){
		  // for Internet Explorer
		  var wscript = new ActiveXObject("WScript.Shell");
		  if (wscript!=null) {
		     wscript.SendKeys("{F11}");
		  }
		}


var obj = new ActiveXObject("Wscript.shell");
obj.SendKeys("{f11}");

HTML5 Fullscreen API: http://johndyer.name/native-fullscreen-javascript-api-plus-jquery-plugin/

// mozilla proposal
element.requestFullScreen();
document.cancelFullScreen();

// Webkit (works in Safari and Chrome Canary)
element.webkitRequestFullScreen();
document.webkitCancelFullScreen();

// Firefox (works in nightly)
element.mozRequestFullScreen();
document.mozCancelFullScreen();

// W3C Proposal
element.requestFullscreen();
document.exitFullscreen();

Also, check out this for making a presentation with HTML5: http://slides.html5rocks.com/#landing-slide

*/

	/*
	// Full body scroll
	var isResizing = false;
	$window.on('resize', function () {
		if (!isResizing) {
			isResizing = true;
			$scroll = $('#scroll');
			// Temporarily make the container tiny so it doesn't influence the
			// calculation of the size of the document
			$scroll.css({'width': 1, 'height': 1});
			// Now make it the size of the window...
			$scroll.css({'width': $window.width(), 'height': $window.height()});
			isResizing = false;
			$scroll.jScrollPane({'showArrows': true, 'animateScroll': true, 'mouseWheelSpeed': 50, 'verticalDragMinHeight': 100});
		}
	}).trigger('resize');
	*/

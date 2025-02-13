$(document).ready(function() {
    // Переменные, передаваемые из Django шаблона
    var confirmExecutorUrl = window.confirmExecutorUrl;
    var startEventUrl = window.startEventUrl;
    var completeEventUrl = window.completeEventUrl;
    var saveOrderUrl = window.saveOrderUrl;
    var csrfToken = window.csrfToken;
    var getAddressesForEventsUrl = window.getAddressesForEventsUrl;
    var uploadCombinedAddressesPhotosUrl = window.uploadCombinedAddressesPhotosUrl;

    // Функция для переключения вкладок
    function switchTab(status) {
        $('.tab').removeClass('active');
        $('.tab[data-status="' + status + '"]').addClass('active');
        $('.tab-content').removeClass('active');
        $('#content-' + status).addClass('active');
    }

    var savedStatus = localStorage.getItem('selectedTab');
    if (savedStatus) {
        switchTab(savedStatus);
    } else {
        switchTab('assigned');
    }

    $('.tab').click(function() {
        var status = $(this).data('status');
        switchTab(status);
        localStorage.setItem('selectedTab', status);
    });

    $(document).on('click', '.confirm-btn', function() {
        var event_id = $(this).data('event-id');
        var user_id = $(this).data('user-id');

        $.ajax({
            url: confirmExecutorUrl,
            method: "POST",
            data: {
                event_id: event_id,
                user_id: user_id,
                csrfmiddlewaretoken: csrfToken
            },
            success: function(response) {
                if (response.success) {
                    location.reload();
                } else {
                    alert('Ошибка: ' + response.error);
                }
            }
        });
    });

    // Ссылка для открытия деталей события
    $('td.clickable').click(function() {
        var url = $(this).closest('tr').data('url');
        window.location.href = url;
    });

    $(document).on('click', '.start-btn', function() {
        var event_id = $(this).data('event-id');
        var start_date = new Date($(this).data('start-date'));
        var today = new Date();
        var threeDaysBeforeStart = new Date(start_date);
        threeDaysBeforeStart.setDate(start_date.getDate() - 3);

        if (today >= threeDaysBeforeStart) {
            $.ajax({
                url: startEventUrl,
                method: "POST",
                data: {
                    event_id: event_id,
                    csrfmiddlewaretoken: csrfToken
                },
                success: function(response) {
                    if (response.success) {
                        location.reload();
                    } else {
                        alert('Ошибка: ' + response.error);
                    }
                }
            });
        } else {
            alert('Вы сможете начать событие не раньше, чем за день до запланированной даты.');
        }
    });

    $(document).on('click', '.remove-btn', function() {
        var form = $(this).closest('.remove-form');
        var eventName = $(this).data('event-name');
        var eventType = $(this).data('event-type');

        if (confirm("Вы уверены, что хотите отказаться от события - " + eventType + ", " + eventName + "?")) {
            form.submit();
        }
    });

    $("#combined-addresses-list").sortable({
        update: function(event, ui) {
            let orderedIds = $(this).sortable('toArray', { attribute: 'data-id' });

            // AJAX for saving order
            $.ajax({
                url: saveOrderUrl,
                method: "POST",
                data: {
                    order: JSON.stringify(orderedIds),
                    csrfmiddlewaretoken: csrfToken
                },
                success: function(response) {
                    if (response.success) {
                        // Update numbering of list elements
                        $('#combined-addresses-list li').each(function(index) {
                            $(this).find('.address-number').text('=' + (index + 1) + '=');
                        });

                        // Update map markers
                        updateMapMarkers();
                    } else {
                        alert('Ошибка при сохранении порядка адресов: ' + response.error);
                    }
                }
            });
        }
    });

    // Восстановление состояния чекбоксов из localStorage
    $('.event-checkbox').each(function() {
        const storedValue = localStorage.getItem('checkbox_' + this.value);
        this.checked = (storedValue === 'true');
    });

    // Функция обновления адресов в процессе выполнения
    function updateInProgressAddresses() {
        const selectedEvents = $('.event-checkbox:checked').map(function() {
            return this.value;
        }).get();

        $('.event-checkbox').each(function() {
            localStorage.setItem('checkbox_' + this.value, this.checked);
        });

        const activeTabStatus = $('.tab.active').data('status');
        if (selectedEvents.length > 0 && activeTabStatus === 'in_progress') {
            $.ajax({
                url: getAddressesForEventsUrl,
                method: "POST",
                data: {
                    event_ids: JSON.stringify(selectedEvents),
                    csrfmiddlewaretoken: csrfToken
                },
                success: function(response) {
                    if (response.success) {
                        const addressList = response.addresses.map((address, index) => {
                            let eventTypeClass = '';
                            switch (address.eventTypeDisplay) {
                                case 'Монтаж':
                                    eventTypeClass = 'event-type--montage';
                                    break;
                                case 'Аудит':
                                    eventTypeClass = 'event-type--audit';
                                    break;
                                case 'Демонтаж':
                                    eventTypeClass = 'event-type--demontage';
                                    break;
                                default:
                                    eventTypeClass = '';
                            }

                            // Проверка, загружены ли фото для данного адреса
                            const photoCountClass = address.photos_uploaded ? 'photo-count--uploaded' : '';

                            return `
                                <li class="in-progress-addresses__item" data-id="${address.id}">
                                    <div class="accordion-header">
                                        <div class="accordion-header__row">
                                            <span class="address-number">=${index + 1}=</span> 
                                            <span class="project-name">${address.projectName}</span>
                                            <span class="event-type ${eventTypeClass}">${address.eventTypeDisplay}</span>
                                            <span class="organization">${address.organization}</span>
                                            <span class="product">${address.product}</span>
                                            <span class="photo-count ${photoCountClass}">Фото: ${address.photoCount}</span>
                                        </div>
                                        <div class="accordion-header__row">
                                            <span class="address-name">${address.name}</span>
                                        </div>
                                    </div>
                                    <div class="accordion-content" style="display: none;">
                                        ${address.photos_uploaded ? 
                                        `
                                        <div class="photo-upload-status">
                                            <span class="photo-uploaded">Фото загружено</span>
                                            <button type="button" class="reload-btn btn">Перезагрузить</button>
                                        </div>
                                        ` :
                                        `
                                        <form class="photo-upload-form" enctype="multipart/form-data">
                                            <input type="hidden" name="csrfmiddlewaretoken" value="${csrfToken}">
                                            <input type="hidden" name="address_id" value="${address.id}">
                                            <div class="file-input-wrapper">
                                                <button class="file-btn btn" type="button">Выбрать</button>
                                                <input class="file-input" type="file" name="photos" accept="image/*" multiple>
                                                <span class="photo-upload-fileLabel">фото</span>
                                            </div>
                                            <label class="force-majeure-input">
                                                <input type="checkbox" name="force_majeure"> Форс-мажор
                                            </label>
                                            <button class="upload-btn btn" type="submit">Загрузить</button>
                                        </form>
                                        `}
                                    </div>
                                    <span class="hidden-coordinates">
                                        <span class="latitude">${address.latitude}</span>,
                                        <span class="longitude">${address.longitude}</span>
                                    </span>
                                </li>`;
                        }).join('');

                        $('#in-progress-addresses ul').html(addressList);
                        $('#in-progress-addresses').show();
                        updateMapMarkers();
                        initializeAccordionAndUploadHandlers();
                        initializeFileInputHandlers(); // Инициализация обработчиков для input[type="file"]
                    } else {
                        alert(response.error);
                    }
                }
            });
        } else {
            $('#in-progress-addresses').hide();
        }
    }

    // Инициализация обработчиков для input[type="file"]
    function initializeFileInputHandlers() {
        // Обработчик изменения выбранных файлов
        $('.file-input').on('change', function() {
            const fileLabel = $(this).siblings('.photo-upload-fileLabel');
            const files = this.files;
            const uploadBtn = $(this).closest('.photo-upload-form').find('.upload-btn');
            const forceMajeureCheckbox = $(this).closest('.photo-upload-form').find('input[name="force_majeure"]');
            const photoCount = parseInt($(this).closest('.in-progress-addresses__item').find('.photo-count').text().replace('Фото: ', ''), 10);

            if (files.length > 0) {
                fileLabel.text(`${files.length} фото выбрано`);
            } else {
                fileLabel.text('фото');
            }

            // Проверка условий для изменения цвета кнопки
            if (
                (forceMajeureCheckbox.is(':checked') && files.length >= 1 && files.length <= 10) ||
                (!forceMajeureCheckbox.is(':checked') && files.length === photoCount)
            ) {
                uploadBtn.css('background-color', 'rgb(129 172 85)'); // Условие выполнено
            } else {
                uploadBtn.css('background-color', ''); // Сброс цвета, если условие не выполнено
            }
        });

        // Обработчик изменения состояния чекбокса "Форс-мажор"
        $('input[name="force_majeure"]').on('change', function() {
            const fileInput = $(this).closest('.photo-upload-form').find('.file-input');
            fileInput.trigger('change'); // Имитируем изменение input[type="file"]
        });

        // Обработчик клика по кнопке "Выбрать"
        $('.file-btn').on('click', function() {
            $(this).siblings('.file-input').click(); // Программный клик по input[type="file"]
        });
    }

    // Инициализация обработчиков формы и аккордеона
    function initializeAccordionAndUploadHandlers() {
        document.querySelectorAll('.photo-upload-form').forEach(form => {
            handlePhotoUploadForm(form);
        });
    }

    // Обработчик щелчка по элементам аккордеона и кнопкам
    $('#in-progress-addresses').on('click', function(event) {
        const target = event.target;

        if ($(target).hasClass('reload-btn')) {
            const content = $(target).closest('.accordion-content');
            const addressId = $(target).closest('li').data('id');
            content.html(`
                <form class="photo-upload-form" enctype="multipart/form-data">
                    <input type="hidden" name="csrfmiddlewaretoken" value="${csrfToken}">
                    <input type="hidden" name="address_id" value="${addressId}">
                    <div class="file-input-wrapper">
                        <button class="file-btn btn" type="button">Выбрать</button>
                        <input class="file-input" type="file" name="photos" accept="image/*" multiple>
                        <span class="photo-upload-fileLabel">фото</span>
                    </div>
                    <label class="force-majeure-input">
                        <input type="checkbox" name="force_majeure"> Форс-мажор
                    </label>
                    <button class="upload-btn btn" type="submit">Загрузить</button>
                </form>
            `);
            handlePhotoUploadForm(content.find('.photo-upload-form')[0]);
            initializeFileInputHandlers(); // Инициализация обработчиков для input[type="file"]
        }
    });

    $(document).on('click', '.accordion-header', function() {
        const header = $(this);
        const content = header.next('.accordion-content');

        header.toggleClass('active');
        content.slideToggle(); // Анимация открытия/закрытия контента
    });

    // Обработка отправки формы загрузки фотографий
    function handlePhotoUploadForm(form) {
        $(form).submit(function(event) {
            event.preventDefault();

            const formData = new FormData(this);

            $.ajax({
                url: uploadCombinedAddressesPhotosUrl,
                method: "POST",
                data: formData,
                processData: false,
                contentType: false,
                success: function(response) {
                    if (response.success) {
                        alert('Фотографии успешно загружены');
                        const content = $(form).closest('.accordion-content');
                        content.html(`<div class="photo-upload-status">
                            <span class="photo-uploaded">Фото загружено</span>
                            <button type="button" class="reload-btn btn">Перезагрузить</button>
                        </div>`);
                    } else {
                        alert('Ошибка: ' + response.error);
                    }
                },
                error: function() {
                    alert('Произошла ошибка при загрузке фотографий');
                }
            });
        });
    }

    // Обновление карты на основе списка
    function updateMapMarkers() {
        if (!mapInitialized) return;

        const coordinates = [];
        map.geoObjects.removeAll();

        const projectColors = {};
        const availableColors = ['islands#redStretchyIcon', 'islands#blueStretchyIcon', 'islands#greenStretchyIcon', 
                                 'islands#orangeStretchyIcon', 'islands#darkOrangeStretchyIcon', 'islands#pinkStretchyIcon'];
        let colorIndex = 0;

        const coordinateMap = {};

        $('#combined-addresses-list li').each(function() {
            let latitude = parseFloat($(this).find('.latitude').text().trim().replace(',', '.'));
            let longitude = parseFloat($(this).find('.longitude').text().trim().replace(',', '.'));
            const projectName = $(this).find('.project-name').text().trim();
            const addressName = $(this).find('.address-name').text().trim();
            const eventType = $(this).find('.event-type').text().trim();
            const addressNumber = $(this).find('.address-number').text().trim();

            if (!(projectName in projectColors)) {
                projectColors[projectName] = availableColors[colorIndex % availableColors.length];
                colorIndex++;
            }

            const colorPreset = projectColors[projectName];

            const coordKey = `${latitude},${longitude}`;
            if (coordKey in coordinateMap) {
                coordinateMap[coordKey]++;
            } else {
                coordinateMap[coordKey] = 0;
            }

            const offsetCoordinates = addOffsetToCoordinates(latitude, longitude, coordinateMap[coordKey]);

            if (!isNaN(latitude) && !isNaN(longitude)) {
                const placemark = new ymaps.Placemark(
                    offsetCoordinates,
                    {
                        balloonContent: `<strong>=${addressNumber}=</strong> ${projectName} - ${eventType} - ${addressName}`,
                        iconContent: addressNumber
                    },
                    {
                        preset: colorPreset
                    }
                );

                map.geoObjects.add(placemark);
                coordinates.push(offsetCoordinates);
            } else {
                console.warn('Некорректные координаты для адреса:', addressName);
            }
        });

        if (coordinates.length > 1) {
            const polyline = new ymaps.Polyline(coordinates, {}, {
                strokeColor: '#0000FF',
                strokeWidth: 4,
                strokeOpacity: 0.5
            });

            map.geoObjects.add(polyline);
            map.setBounds(map.geoObjects.getBounds(), { checkZoomRange: true, zoomMargin: 9 });
        }
    }

    // Функция для задания смещения
    function addOffsetToCoordinates(latitude, longitude, offsetIndex) {
        const offset = 0.0001;
        return [latitude + offset * offsetIndex, longitude + offset * offsetIndex];
    }

    // Инициализация карты
    var map, mapInitialized = false;

    ymaps.ready(init);

    function init() {
        map = new ymaps.Map("map", {
            center: [55.76, 37.64],
            zoom: 10
        });
        mapInitialized = true;
        updateInProgressAddresses();
    }

    // Обновление адресов на изменение чекбоксов
    $('.event-checkbox').change(updateInProgressAddresses);
    $('.tab').click(function() {
        if ($(this).data('status') !== 'in_progress') {
            $('#in-progress-addresses').hide();
        }
        updateInProgressAddresses();
    });

    updateInProgressAddresses();

    // Клик по кнопке оптимизации маршрута
    $('#optimize-route-btn').click(function() {
        // Берем координаты из списка
        const coords = $('#combined-addresses-list li').map(function() {
            const latitude = parseFloat($(this).find('.latitude').text().trim().replace(',', '.'));
            const longitude = parseFloat($(this).find('.longitude').text().trim().replace(',', '.'));
            const id = $(this).data('id');
            return { 'id': id, 'latitude': latitude, 'longitude': longitude };
        }).get();

        if (coords.length === 0) {
            alert('Нет доступных адресов для оптимизации.');
            return;
        }

        $.ajax({
            url: window.optimizeRouteUrl,
            method: "POST",
            data: {
                coords: JSON.stringify(coords),
                csrfmiddlewaretoken: csrfToken
            },
            success: function(response) {
                if (response.success) {
                    const orderedIds = response.ordered_ids;
                    orderedIds.forEach((id, index) => {
                        $('#combined-addresses-list li[data-id="' + id + '"]').appendTo('#combined-addresses-list');
                    });

                    $('#combined-addresses-list li').each(function(index) {
                        $(this).find('.address-number').text('=' + (index + 1) + '=');
                    });

                    updateMapMarkers();
                    
                    // Сохранение нового порядка на сервер
                    saveOrderToServer(orderedIds);

                } else {
                    alert('Ошибка при оптимизации маршрута: ' + response.error);
                }
            },
            error: function(xhr, status, error) {
                alert('Ошибка сервера при попытке оптимизации маршрута.');
            }
        });
    });

    // Функция для сохранения порядка на сервер
    function saveOrderToServer(orderedIds) {
        $.ajax({
            url: window.saveOrderUrl,
            method: "POST",
            data: {
                order: JSON.stringify(orderedIds),
                csrfmiddlewaretoken: csrfToken
            },
            success: function(response) {
                if (!response.success) {
                    alert('Ошибка при сохранении порядка адресов: ' + response.error);
                }
            },
            error: function(xhr, status, error) {
                alert('Ошибка сервера при попытке сохранить порядок адресов.');
            }
        });
    }

    // Обработчик клика по кнопке "Печать маршрута"
    $('#print-addresses-btn').on('click', function() {
        // Получаем содержимое списка адресов
        const addressesList = $('#combined-addresses-list').html();

        // Создаём HTML для печати
        const printContent = `
            <!DOCTYPE html>
            <html lang="ru_RU">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Печать маршрута</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        padding: 20px;
                    }
                    h1 {
                        font-size: 24px;
                        margin-bottom: 20px;
                    }
                    ul {
                        list-style-type: none;
                        padding: 0;
                    }
                    li {
                        margin-bottom: 10px;
                        font-size: 16px;
                    }
                    .address-number {
                        font-weight: bold;
                        margin-right: 10px;
                    }
                    .project-name {
                        font-weight: bold;
                        margin-right: 10px;
                    }
                    .event-type {
                        margin-right: 10px;
                    }
                    .organization {
                        margin-right: 10px;
                    }
                    .product {
                        margin-right: 10px;
                    }
                    .photo-count {
                        margin-right: 10px;
                    }
                    .address-name {
                        font-style: italic;
                    }
                    .hidden-coordinates {
                        display: none;
                    }
                </style>
            </head>
            <body>
                <h1>Маршрут адресов</h1>
                <ul>${addressesList}</ul>
            </body>
            </html>
        `;

        // Открываем новое окно для печати
        const printWindow = window.open('', '_blank');
        printWindow.document.write(printContent);
        printWindow.document.close();

        // Вызываем печать
        printWindow.print();
    });
});
// edit_event.js

document.addEventListener('DOMContentLoaded', function() {
    const saveButton = document.getElementById('save-event-button');
    const form = document.getElementById('event-form');

    let formInitialData = {};

    // Функция для сбора первоначальных данных формы
    function collectInitialData() {
        formInitialData = Array.from(form.elements).reduce((acc, element) => {
            if (element.name) {
                acc[element.name] = element.value;
            }
            return acc;
        }, {});
    }

    // Проверяем изменение формы
    function isFormChanged() {
        return Array.from(form.elements).some(element => {
            if (element.name && element.type !== 'submit') {
                return element.value !== formInitialData[element.name];
            }
            return false;
        });
    }

    // Обрабатываем событие изменении и проверяем, есть ли изменения в форме
    function handleFormChange() {
        if (isFormChanged()) {
            saveButton.style.backgroundColor = 'rgb(249 145 87)'; // Например, изменяем цвет на красный
        } else {
            saveButton.style.backgroundColor = ''; // Сбрасываем к исходному
        }
    }

    // Собираем данные начальные
    collectInitialData();

    // Регистрируем обработчики событий изменения для полей формы
    Array.from(form.elements).forEach(element => {
        if (element.type !== 'submit') {
            element.addEventListener('input', handleFormChange);
        }
    });

    // Проверка списка адресов
    function checkAddressesList() {
        const $addressesList = $('#event-addresses-list');
        const $addressButtons = $('.event__addresses-btns');

        if ($addressesList.children().length === 0 || $addressesList.find('li:contains("Нет адресов")').length > 0) {
            $addressButtons.hide(); // Скрываем кнопки, если адресов нет
        } else {
            $addressButtons.show(); // Показываем кнопки, если адреса есть
        }
    }

    // Проверяем при загрузке страницы
    checkAddressesList();

    // Обновляем проверку при добавлении адреса
    $('#add-address-btn').click(function() {
        setTimeout(checkAddressesList, 100);
    });

    // Обновляем проверку при удалении адреса
    $('#event-addresses-list').on('click', '.delete-address-btn', function() {
        setTimeout(checkAddressesList, 100);
    });

    // Инициализация аккордеона
    $('.event__content-cell').each(function () {
        const sectionId = $(this).data('section-id');
        let isOpen = localStorage.getItem(`accordion-${sectionId}`) === 'true';
        $(this).find('.event__cell-content').toggle(isOpen);
        $(this).find('.event__cell-header').toggleClass('event__cell-header--active', isOpen);
    });

    $('.event__cell-header').on('click', function () {
        const section = $(this).closest('.event__content-cell');
        const sectionId = section.data('section-id');
        $(this).next('.event__cell-content').slideToggle(function () {
            const isOpen = $(this).is(':visible');
            localStorage.setItem(`accordion-${sectionId}`, isOpen.toString());
        });
        $(this).toggleClass('event__cell-header--active');
    });

    // Обработка фотогалереи
    $(document).ready(function() {
        $('.details-btn').click(function() {
            const userId = $(this).data('id');
            const eventId = eventData.eventId;

            $.ajax({
                url: eventData.urls.fetchExecutorPhotos,
                type: "GET",
                data: {
                    'user_id': userId,
                    'event_id': eventId
                },
                success: function(data) {
                    console.log(data); // Добавьте эту строку для отладки

                    const galleryContent = $('#gallery-content');
                    const problemsGalleryContent = $('#problems-gallery-content');
                    const problemsGalleryTitle = $('.photo-modal__title');

                    galleryContent.empty();
                    problemsGalleryContent.empty();

                    data.photos.forEach(photo => {
                        const img = $('<img class="photo-gallery__img">').attr('src', photo.url).attr('alt', photo.name);
                        img.click(function() {
                            openPhotoModal(photo.url);
                        });
                        galleryContent.append($('<div class="photo-gallery__img-wrap">').append(img).append($('<span class="photo-gallery__img-name">').text(photo.name)));
                    });

                    if (data.problems && data.problems.length > 0) {
                        problemsGalleryContent.show();
                        problemsGalleryTitle.css('display', 'block');
                        data.problems.forEach(photo => {
                            const img = $('<img class="photo-gallery__img">').attr('src', photo.url).attr('alt', photo.name);
                            img.click(function() {
                                openPhotoModal(photo.url);
                            });
                            problemsGalleryContent.append($('<div class="photo-gallery__img-wrap">').append(img).append($('<span class="photo-gallery__img-name">').text(photo.name)));
                        });
                    } else {
                        problemsGalleryContent.hide();
                    }

                    $('#photo-gallery-modal').fadeIn();
                },
                error: function(error) {
                    alert('Не удалось загрузить фотографии');
                }
            });
        });

        // Закрытие галереи при нажатии на кнопку закрытия
        $('#photo-gallery-modal .modal-close-btn').click(function() {
            $('#photo-gallery-modal').fadeOut();
        });

        // Закрытие галереи при нажатии вне его контента
        $('#photo-gallery-modal').click(function(event) {
            if ($(event.target).is('#photo-gallery-modal')) {
                $(this).fadeOut();
            }
        });

        function openPhotoModal(photoUrl) {
            const modalOverlay = $('<div>').addClass('photo-view-modal');

            const img = $('<img>').attr('src', photoUrl);
            const closeBtn = $('<span>').addClass('modal-close-btn').text('').click(function() {
                modalOverlay.fadeOut(() => modalOverlay.remove());
            });

            modalOverlay.append(closeBtn).append(img);

            // Закрытие увеличенного фото при нажатии на фон
            modalOverlay.click(function(event) {
                if ($(event.target).is('.photo-view-modal')) {
                    modalOverlay.fadeOut(() => modalOverlay.remove());
                }
            });

            $('body').append(modalOverlay);
        }

        // Обработчик для кнопки скачивания в списке исполнителей
        $('.download-photos-btn').click(function() {
            const userId = $(this).data('id');
            const eventId = eventData.eventId;
            const downloadUrl = eventData.urls.downloadExecutorPhotos;

            // Отправка запроса на сервер для создания и получения архива
            window.location.href = `${downloadUrl}?user_id=${userId}&event_id=${eventId}`;
        });
    });

    // Обновление счётчика запросов
    function updateRemainingRequests() {
        fetch(eventData.urls.getRemainingRequests, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': eventData.csrfToken,
            },
        })
        .then(response => response.json())
        .then(data => {
            document.getElementById('remaining-requests').innerText = `${data.remaining_requests}`;
        })
        .catch(error => console.error('Ошибка при обновлении оставшихся запросов:', error));
    }

    // Запрашиваем сервер каждый час, чтобы обновить данные
    setInterval(updateRemainingRequests, 60 * 60 * 1000);  // Каждые 60 минут

    // Проверяем время до полуночи и запускаем обновление в полночь
    const timeUntilMidnight = parseInt(eventData.secondsUntilMidnight, 10);
    setTimeout(updateRemainingRequests, timeUntilMidnight * 1000);

    // Сохранение события
    $('#save-event-button').click(function() {
        $('#event-form').submit();
    });

    // Функция для проверки статусов исполнителей
    function checkExecutorsStatus() {
        let allowCopy = true; // По умолчанию разрешаем копирование адресов

        // Проходим по каждому исполнителю
        $('#event-executors-list li').each(function() {
            const statusText = $(this).find('.status').text().trim();
            
            // Проверяем, содержит ли статус запрещенные значения
            if (statusText.includes('Назначено') || 
                statusText.includes('Подтверждено') || 
                statusText.includes('Отказ') || 
                statusText.includes('В работе') || 
                statusText.includes('Завершено')) {
                allowCopy = false;
                return false; // Выходим из цикла, так как копирование уже запрещено
            }
        });

        // Устанавливаем кнопку активной или неактивной в зависимости от условия
        $('#copy-addresses-btn').prop('disabled', !allowCopy);
    }

    // Изначально проверяем статусы при загрузке страницы
    checkExecutorsStatus();

    // Синхронизация адресов с проекта
    $('#copy-addresses-btn').click(function() {
        const eventId = eventData.eventId;  // Получаем ID текущего события
        $.ajax({
            url: eventData.urls.copyAddresses,  // URL, на который будет отправлен POST-запрос
            type: "POST",
            data: {
                csrfmiddlewaretoken: eventData.csrfToken,
            },
            success: function(response) {
                alert('Адреса были успешно добавлены');
                location.reload(); // Перезагружаем страницу
            },
            error: function(response) {
                if (response.responseJSON && response.responseJSON.error) {
                    alert(response.responseJSON.error);
                } else {
                    alert('Произошла ошибка при добавлении адресов');
                }
            }
        });
    });

    // Обработка удаления конкретного адреса
    $(document).ready(function() {
        // Обработчик для кнопки удаления адреса
        $('#event-addresses-list').on('click', '.delete-address-btn', function() {
            const addressId = $(this).data('id');
            const listItem = $(this).closest('li');
            const isUserAssigned = listItem.attr('data-user-assigned') === 'true';

            // Подтверждение удаления, если адрес назначен исполнителю
            if (isUserAssigned) {
                const confirmationMessage = "Вы действительно хотите удалить адрес, который назначен исполнителю? Будут удалены имеющиеся фото к этому адресу!";
                if (!confirm(confirmationMessage)) {
                    return; // Если пользователь отменил подтверждение, ничего не делаем
                }
            }

            // Отправляем запрос на удаление адреса
            $.ajax({
                url: eventData.urls.deleteEventAddress.replace('/0/', '/' + addressId + '/'),
                type: "POST",
                data: {
                    csrfmiddlewaretoken: eventData.csrfToken,
                },
                success: function(response) {
                    // Удаляем адрес из списка
                    listItem.remove();
                    updateAddressNumbers(); // Обновляем нумерацию адресов

                    // Обновляем карту
                    ymaps.ready(function() {
                        if (mapEvent) updateMap(mapEvent); // Обновляем карту в основном интерфейсе
                        if (mapModal) updateMap(mapModal); // Обновляем карту в модальном окне
                    });

                    // Проверяем условия для исполнителей и обновляем список
                    checkExecutorsAfterAddressDeletion();
                },
                error: function(response) {
                    alert('Произошла ошибка при удалении адреса');
                }
            });
        });

        // Функция для проверки условий для исполнителей после удаления адреса
        function checkExecutorsAfterAddressDeletion() {
            $.ajax({
                url: eventData.urls.checkExecutorsAfterAddressDeletion,
                type: "GET",
                success: function(response) {
                    // Обновляем список исполнителей на странице
                    updateExecutorsList(response.executors);
                },
                error: function(response) {
                    console.error('Ошибка при проверке исполнителей:', response);
                }
            });
        }

        // Функция для обновления списка исполнителей на странице
        function updateExecutorsList(executors) {
            const executorsList = $('#event-executors-list');
            executorsList.empty(); // Очищаем текущий список

            // Добавляем обновленный список исполнителей
            executors.forEach(executor => {
                const listItem = `
                    <li class="event__executors-item" data-id="${executor.id}" data-status="${executor.status}">
                        <div class="event__executors-item-row">
                            <span class="user-name">${executor.name}</span>
                            ${executor.district ? `<span class="district">${executor.district}</span>` : ''}
                            ${executor.phone_number ? `<span class="phone-number">${executor.phone_number}</span>` : ''}
                            <span class="status">${executor.status}</span>
                        </div>
                        <div class="event__executors-item-row">
                            ${executor.has_unassigned_addresses ? `
                                <input type="text" id="address-indexes-${executor.id}" placeholder="Пример: 1,3-5,10-20,25">
                                <button class="assign-btn btn" data-id="${executor.id}">Назначить</button>
                            ` : ''}
                        </div>
                        <div class="event__executors-item-row">
                            ${executor.has_photos ? `
                                <button class="details-btn btn" data-id="${executor.id}">Показать фото</button>
                            ` : ''}
                            ${executor.status === 'completed' ? `
                                <button class="download-photos-btn btn" data-id="${executor.id}">Скачать фото</button>
                            ` : ''}
                            ${executor.status !== 'completed' ? `
                                <button class="delete-executor-btn btn" data-id="${executor.id}">Удалить</button>
                            ` : ''}
                        </div>
                    </li>
                `;
                executorsList.append(listItem);
            });
        }
    });

    // Добавление нового адреса
    document.getElementById('add-address-btn').onclick = function() {
        const addressList = document.getElementById('event-addresses-list');
        const updateButton = document.getElementById('update-addresses-btn');

        // Создаем новый элемент списка без данных
        const newListItem = document.createElement('li');
        newListItem.classList.add('event__addresses-item');
        newListItem.innerHTML = `
            <span class="address-number">${addressList.children.length + 1}</span>
            <input type="text" name="new_address_names[]" class="address-name" placeholder="Введите название адреса">
            <span class="hidden-coordinates">
                <span class="latitude"></span>
                <span class="longitude"></span>
            </span>
            <button type="button" class="delete-address-btn btn">Удалить</button>
        `;

        // Добавляем новый элемент в список
        addressList.appendChild(newListItem);

        // Обновляем нумерацию адресов
        updateAddressNumbers();

        // Прокручиваем список вниз, если есть скроллбар
        addressList.scrollTop = addressList.scrollHeight;

        // Обработчик для кнопки удаления адреса
        newListItem.querySelector('.delete-address-btn').onclick = function() {
            addressList.removeChild(newListItem);
            updateAddressNumbers();
            checkInputFields();
        };

        // Обработчик для изменения значения в поле ввода
        const addressInput = newListItem.querySelector('.address-name');
        addressInput.addEventListener('input', checkInputFields);

        // Функция для проверки всех полей ввода и изменения цвета кнопки
        function checkInputFields() {
            const inputs = addressList.querySelectorAll('.address-name');
            
            const anyInputNotEmpty = Array.from(inputs).some(input => {
                if (input && input.value !== undefined) {
                    return input.value.trim() !== '';
                }
                return false;
            });

            if (anyInputNotEmpty) {
                updateButton.style.backgroundColor = 'rgb(249 145 87)'; // Зеленый цвет
                updateButton.disabled = false; // Включаем кнопку
            } else {
                updateButton.style.backgroundColor = ''; // Сброс к исходному состоянию
                updateButton.disabled = true; // Выключаем кнопку
            }
        }

        // Первоначальная проверка на случай, если поле сразу заполнено
        checkInputFields();
    };

    // Функция для обновления нумерации адресов
    function updateAddressNumbers() {
        $('#event-addresses-list .address-number').each(function(index) {
            $(this).text('=' + (index + 1) + '=');
        });
    }

    // Обновление адресов
    document.getElementById('update-addresses-btn').onclick = async function () {
        const apiKey = eventData.apiKey;

        if (!apiKey) {
            alert("Вам нужно заполнить поле API Key в профиле");
            return;
        }

        let isValidApiKey = await checkApiKeyValidity(apiKey);
        if (!isValidApiKey) {
            alert("Ваш API Key недействителен. Пожалуйста, проверьте его корректность.");
            return;
        }

        const addressList = document.getElementById('event-addresses-list');
        const newAddresses = [];
        const listItemsToRemove = [];

        for (let i = 0; i < addressList.children.length; i++) {
            const listItem = addressList.children[i];
            const addressNameElement = listItem.querySelector('.address-name');
            const addressName = addressNameElement instanceof HTMLInputElement ? addressNameElement.value : addressNameElement.textContent.trim();
            
            if (!addressName || listItem.dataset.id) continue;

            try {
                const response = await fetch(`https://geocode-maps.yandex.ru/1.x/?apikey=${apiKey}&format=json&geocode=${encodeURIComponent(addressName)}`);
                const data = await response.json();

                if (data.response.GeoObjectCollection.metaDataProperty.GeocoderResponseMetaData.found > 0) {
                    const geoObject = data.response.GeoObjectCollection.featureMember[0].GeoObject;
                    const point = geoObject.Point.pos.split(' ');
                    const latitude = parseFloat(point[1]);
                    const longitude = parseFloat(point[0]);

                    newAddresses.push({
                        name: addressName,
                        latitude: latitude.toFixed(6),
                        longitude: longitude.toFixed(6)
                    });

                    // Mark the list item for removal after successful addition
                    listItemsToRemove.push(listItem);
                }
            } catch (error) {
                console.error('Ошибка при получении координат:', error);
            }
        }

        if (newAddresses.length > 0) {
            fetch(eventData.urls.addNewAddresses, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': eventData.csrfToken
                },
                body: JSON.stringify({
                    new_addresses: newAddresses
                })
            })
            .then(response => response.json())
            .then(data => {
                if (data.status === 'ok') {
                    alert('Адреса успешно обновлены');
                    location.reload(); // Перезагружаем страницу
            
                    // Обновляем карты после добавления адресов
                    ymaps.ready(function() {
                        if (mapEvent) updateMap(mapEvent);
                        if (mapModal) updateMap(mapModal);
                    });
                } else {
                    alert(data.message || 'Произошла ошибка при обновлении адресов');
                }
            })
            .catch(error => {
                console.error('Ошибка:', error);
                alert('Ошибка сети');
            });
        }
    };

    // Функция для проверки валидности API Key
    async function checkApiKeyValidity(apiKey) {
        try {
            const response = await fetch(`https://geocode-maps.yandex.ru/1.x/?apikey=${apiKey}&format=json&geocode=test`);
            if (!response.ok) {
                return false;
            }
            const data = await response.json();
            return (data && !data.error);
        } catch (error) {
            console.error('Ошибка проверки API Key:', error);
            return false;
        }
    }

    let mapEvent = null; // Для карты в основном интерфейсе
    let mapModal = null; // Для карты в модальном окне

    // Функция для инициализации карты
    function initMap(containerId, mapInstance) {
        const mapContainer = document.getElementById(containerId);
        if (!mapContainer) {
            console.error(`Контейнер с ID "${containerId}" не найден.`);
            return;
        }

        // Если карта уже существует, просто обновляем её
        if (mapInstance) {
            updateMap(mapInstance);
            return;
        }

        // Инициализация новой карты
        mapInstance = new ymaps.Map(containerId, {
            center: [55.76, 37.64], // Центр карты по умолчанию
            zoom: 10 // Масштаб по умолчанию
        });

        updateMap(mapInstance);
        return mapInstance; // Возвращаем экземпляр карты
    }

    // Функция для обновления карты
    function updateMap(mapInstance) {
        if (!mapInstance) return;

        // Очистка карты перед обновлением
        mapInstance.geoObjects.removeAll();

        let coordinates = [];

        // Получаем данные из списка адресов
        $('#modal-event-addresses-list li').each(function() {
            const latitudeText = $(this).find('.latitude').text().trim();
            const longitudeText = $(this).find('.longitude').text().trim();
            const name = $(this).find('.address-name').text().trim();
            const addressNumber = $(this).find('.address-number').text().trim().replace('.', '');

            const latitude = parseFloat(latitudeText.replace(',', '.'));
            const longitude = parseFloat(longitudeText.replace(',', '.'));

            if (!isNaN(latitude) && !isNaN(longitude)) {
                const placemark = new ymaps.Placemark(
                    [latitude, longitude], 
                    {
                        balloonContent: `<strong>=${addressNumber}=</strong> ${name}`,
                        iconContent: addressNumber
                    }, 
                    {
                        preset: 'islands#redStretchyIcon'
                    }
                );

                mapInstance.geoObjects.add(placemark);
                coordinates.push([latitude, longitude]);
            } else {
                console.warn('Некорректные координаты для адреса:', name);
            }
        });

        if (coordinates.length > 1) {
            const polyline = new ymaps.Polyline(coordinates, {}, {
                strokeColor: '#0000FF',
                strokeWidth: 3,
                strokeOpacity: 0.5
            });

            mapInstance.geoObjects.add(polyline);
        }

        // Автоматическое изменение центра и масштаба карты
        if (coordinates.length > 0) {
            mapInstance.setBounds(mapInstance.geoObjects.getBounds(), { checkZoomRange: true });
        }
    }

    // Обработчик переключения табов
    $('.tab-link').click(function(e) {
        e.preventDefault();

        // Удаляем класс 'active' у всех табов и контента
        $('.tab-link').removeClass('active');
        $('.tab-content > div').removeClass('active');

        // Добавляем класс 'active' для текущего таба и его контента
        $(this).addClass('active');
        const targetId = $(this).attr('href').substring(1);
        $(`#${targetId}`).addClass('active');

        // Если активный таб — это таб с картой
        if (targetId === 'event-map') {
            ymaps.ready(function() {
                if (!mapEvent) {
                    // Если карта не инициализирована, создаем её
                    mapEvent = initMap('map-event', mapEvent);
                } else {
                    // Если карта уже существует, обновляем её
                    updateMap(mapEvent);
                }
            });
        }
    });

    let isOrderChanged = false; // Флаг для отслеживания изменений порядка

    function initializeSorting(selector) {
        $(selector).sortable({
            placeholder: 'ui-state-highlight',
            update: function(event, ui) {
                updateAddressNumbersAfterSort(selector);
                saveNewOrder(selector);

                // Обновляем карту и устанавливаем флаг при изменении в модальном списке
                if (selector === '#modal-event-addresses-list') {
                    ymaps.ready(function() {
                        updateMap(mapModal); // Обновляем карту в модальном окне
                    });
                    isOrderChanged = true; // Устанавливаем флаг изменения
                } else if (selector === '#event-addresses-list') {
                    ymaps.ready(function() {
                        updateMap(mapEvent); // Обновляем карту в основном интерфейсе
                        updateMap(mapModal); // Обновляем карту в модальном окне
                    });
                }
            }
        });

        $(selector).disableSelection();
    }

    function updateAddressNumbersAfterSort(selector) {
        $(selector + ' li').each(function(index) {
            $(this).find('.address-number').text('=' + (index + 1) + '=');
        });
    }

    function saveNewOrder(selector) {
        const orderData = [];
        $(selector + ' li').each(function(index) {
            const addressId = $(this).data('id');
            orderData.push({ id: addressId, order: index });
        });
    
        $.ajax({
            url: eventData.urls.updateAddressOrder,
            type: "POST",
            data: {
                order: JSON.stringify(orderData),
                model: 'EventAddress',
                csrfmiddlewaretoken: eventData.csrfToken
            },
            success: function(response) {
                console.log('Порядок адресов события успешно сохранен.');
    
                // Обновляем обе карты после изменения порядка
                ymaps.ready(function() {
                    console.log('Обновление карты в основном интерфейсе');
                    if (mapEvent) updateMap(mapEvent);

                    console.log('Обновление карты в модальном окне');
                    if (mapModal) updateMap(mapModal);
                });
            },
            error: function(response) {
                console.error('Ошибка при сохранении порядка адресов события');
            }
        });
    }

    // Инициализация сортировки
    initializeSorting('#event-addresses-list');
    initializeSorting('#modal-event-addresses-list');

    // Открытие модального окна и обновление меток
    $('#show-map-btn').click(function() {
        // Проверка на наличие адресов
        if ($('#modal-event-addresses-list li').length === 0 || $('#modal-event-addresses-list li:contains("Нет адресов.")').length > 0) {
            alert("Нет доступных адресов для отображения.");
            return;
        }

        // Проверка на наличие API Key
        const apiKey = eventData.apiKey;
        if (!apiKey) {
            alert("Вам нужно заполнить поле API Key в профиле.");
            return;
        }

        // Показ модального окна
        $('#map-modal').show();
        document.body.classList.add('no-scroll');

        // Инициализация карты после отображения модального окна
        ymaps.ready(function() {
            if (mapModal) {
                // Если карта уже существует, обновляем её
                updateMap(mapModal);
            } else {
                // Если карта не существует, создаем новую
                mapModal = initMap('map-modal-content', mapModal);
            }
        });
    });

    // Закрытие модального окна
    $('.modal .modal-close-btn').click(function() {
        $('#map-modal').hide();
        document.body.classList.remove('no-scroll');
        if (isOrderChanged) {
            location.reload(); // Перезагрузка страницы, если изменился порядок
        }
    });

    // Открытие и закрытие модального окна
    $('#select-executors-btn').click(function() {
        // Проверяем, есть ли адреса в списке
        var addressesExist = $('#event-addresses-list li').length > 1 || 
                            ($('#event-addresses-list li').length === 1 && 
                            $('#event-addresses-list li').text().trim() !== "Нет адресов");

        if (!addressesExist) {
            alert("Для добавления исполнителя - необходимо добавить адреса!");
            return;
        }

        // Проверяем, есть ли хотя бы один неназначенный адрес
        var hasUnassignedAddress = false;
        $('#event-addresses-list li').each(function() {
            console.log("Адрес:", $(this).find('.address-name').text().trim(), "data-user-assigned:", $(this).data('user-assigned')); // Отладочное сообщение
            if ($(this).data('user-assigned') === false) {
                hasUnassignedAddress = true;
                return false; // Прерываем each, если найден неназначенный адрес
            }
        });

        if (!hasUnassignedAddress) {
            alert("Нет свободных адресов для добавления исполнителя!");
            return;
        }

        // Собираем ID исполнителей, уже добавленных в список
        var existingExecutorIds = [];
        $('#event-executors-list li').each(function() {
            existingExecutorIds.push($(this).data('id'));
        });

        // Находим чекбоксы, которые соответствуют существующим исполнителям, и блокируем их
        $('#executor-selection-list input[type=checkbox]').each(function() {
            var executorId = $(this).data('id');
            if (existingExecutorIds.includes(executorId)) {
                $(this).prop('disabled', true);    // Отключаем чекбокс
                $(this).prop('checked', true);     // Отмечаем чекбокс
            } else {
                $(this).prop('disabled', false);
                $(this).prop('checked', false);    // Убираем отметку с чекбокса
            }
        });

        $('#executor-modal').show();
    });

    $('.executor-modal .modal-close-btn').click(function() {
        $('#executor-modal').hide();
    });

    // AJAX-запрос для сохранения выбранных исполнителей
    $('#add-executors-btn').click(function() {
        var selectedExecutors = [];
        $('#executor-selection-list input:checked').each(function() {
            selectedExecutors.push($(this).data('id'));
        });

        // Собираем уже существующие элементы из DOM
        $('#event-executors-list li').each(function() {
            var executorId = $(this).data('id');
            if (!selectedExecutors.includes(executorId)) {
                selectedExecutors.push(executorId);
            }
        });

        $.ajax({
            url: eventData.urls.updateEventExecutors,
            type: "POST",
            headers: {'X-CSRFToken': eventData.csrfToken},
            data: {
                'executors': selectedExecutors
            },
            success: function(response) {
                $('#executor-modal').hide();
                location.reload(); // Перезагружаем страницу
            },
            error: function(xhr, status, error) {
                alert('Ошибка при сохранении исполнителей. Попробуйте еще раз.');
            }
        });
    });

    // Удаление исполнителя из списка
    $(document).on('click', '.delete-executor-btn', function() {
        var $executorItem = $(this).closest('li');
        var executorId = $executorItem.data('id');
        var executorStatus = $executorItem.data('status');
        var eventId = eventData.eventId;  // Замените на динамические данные, если требуется

        var confirmationMessage;
        switch (executorStatus) {
            case 'confirmed':
                confirmationMessage = "Вы действительно хотите удалить исполнителя, который подтвердил готовность выполнения назначенных адресов?";
                break;
            case 'in_progress':
                confirmationMessage = "Вы действительно хотите удалить исполнителя, который начал выполнение назначенных адресов? Будут потеряны имеющиеся фотографии от данного исполнителя к данному событию!";
                break;
            case 'completed':
                confirmationMessage = "Вы действительно хотите удалить исполнителя, который завершил выполнение назначенных адресов? Будут потеряны все фотографии от данного исполнителя к данному событию!";
                break;
            default:
                confirmationMessage = null;
        }

        if (confirmationMessage) {
            if (!confirm(confirmationMessage)) {
                return; // Если пользователь отменил подтверждение, ничего не делаем
            }
        }

        // Удаляем элемент из списка на странице
        $executorItem.remove();

        // Отправляем запрос на сервер для удаления
        $.ajax({
            url: eventData.urls.removeExecutor,
            method: "POST",
            data: {
                'executor_id': executorId,
                'event_id': eventId,
                'csrfmiddlewaretoken': eventData.csrfToken
            },
            success: function(response) {
                console.log('Исполнитель удален');
                location.reload();
            },
            error: function(xhr, status, error) {
                console.error('Произошла ошибка при удалении исполнителя: ', error);
            }
        });
    });

    // функция для преобразования ввода в список индексов
    function parseAddressIndexes(input) {
        let indexes = [];
        let parts = input.split(',');

        parts.forEach(part => {
            if (part.includes('-')) {
                let range = part.split('-').map(Number);
                if (range.length === 2 && !isNaN(range[0]) && !isNaN(range[1])) {
                    if (range[0] <= range[1]) {
                        for (let i = range[0]; i <= range[1]; i++) {
                            indexes.push(i);
                        }
                    }
                }
            } else if (!isNaN(part)) {
                indexes.push(Number(part));
            }
        });

        return indexes;
    }
    
    // Это для логики назначения исполнителя к события
    $('.assign-btn').click(function() {
        const userId = $(this).data('id');
        const eventId = eventData.eventId;
        const maxIndex = eventData.addressesCount;

        let addressIndexes = [];
        const inputElement = $('#address-indexes-' + userId);
        
        if (inputElement.length) {
            const input = inputElement.val();
            addressIndexes = parseAddressIndexes(input);
        }

        // Проверка диапазонов на валидность
        const isValid = addressIndexes.every(index => index >= 1 && index <= maxIndex);

        if (!isValid) {
            alert(`Пожалуйста, введите номера в диапазоне от 1 до ${maxIndex}.`);
            return;
        }

        $.ajax({
            url: eventData.urls.assignExecutor,
            type: "POST",
            data: {
                'user_id': userId,
                'event_id': eventId,
                'address_indexes': JSON.stringify(addressIndexes),
                'csrfmiddlewaretoken': eventData.csrfToken
            },
            success: function(data) {
                if (data.success) {
                    location.reload();
                } else if (data.message) {
                    alert(data.message);  // Вывод ошибки
                }
            }
        });
    });
});
// static/js/edit_project.js

document.addEventListener('DOMContentLoaded', function () {
    // Инициализация всех модулей
    Modal.init();
    Map.init();
    Addresses.init();
    Form.init();
    EventHandlers.init();

    const fileInput = document.getElementById('id_excel_file');
    const fileButton = document.querySelector('.file-button');
    const fileNameDisplay = document.querySelector('.file-name');
    const getCoordinatesBtn = document.getElementById('get-coordinates-btn');

    if (fileInput && fileButton && fileNameDisplay && getCoordinatesBtn) {
        // Открытие диалога выбора файла при клике на кнопку
        fileButton.addEventListener('click', function () {
            fileInput.click(); // Программный клик по input[type="file"]
        });

        // Обновление текста и стиля кнопки при выборе файла
        fileInput.addEventListener('change', function (event) {
            const fileName = event.target.files.length ? event.target.files[0].name : 'не выбран';
            fileNameDisplay.textContent = fileName;

            // Изменяем цвет фона кнопки, если файл был выбран
            if (event.target.files.length) {
                getCoordinatesBtn.style.backgroundColor = 'rgb(129, 172, 85)';
            } else {
                // Восстанавливаем цвет фона по умолчанию, если файл не выбран
                getCoordinatesBtn.style.backgroundColor = '';
            }
        });
    }
});

// Модуль для работы с модальными окнами
const Modal = (function () {
    let modal;

    function init() {
        modal = $("#create-event-modal");
        const btn = $("#create-event-btn");
        const span = $(".modal-close-btn");

        // Открытие модального окна
        btn.on("click", function () {
            modal.show();
        });

        // Закрытие модального окна
        span.on("click", function () {
            modal.hide();
        });

        // Закрытие модального окна при клике вне его
        $(window).on("click", function (event) {
            if ($(event.target).is(modal)) {
                modal.hide();
            }
        });

        // Обработка отправки формы
        $("#create-event-form").on("submit", function (event) {
            event.preventDefault();
            const formData = $(this).serialize();
            $.post(DJANGO_DATA.urls.createEvent, formData, function (data) {
                if (data.success) {
                    modal.hide();
                    window.location.href = data.redirect_url;
                } else {
                    // Обработка ошибок валидации формы
                }
            });
        });
    }

    return {
        init: init,
    };
})();

// Модуль для работы с картой
const Map = (function () {
    let map;

    function init() {
        // Проверка наличия API Key
        if (!DJANGO_DATA.apiKey) {
            alert("Вам нужно заполнить поле API Key в профиле.");
            return;
        }

        ymaps.ready(initMap);
    }

    function initMap() {
        if (!map) {
            map = new ymaps.Map('map', {
                center: [55.76, 37.64], // Начальная позиция - Москва
                zoom: 10,
            });
        }

        // Очистка предыдущих меток
        map.geoObjects.removeAll();

        // Добавление меток на карту
        const coordinates = [];
        const placemarks = [];

        $('#addresses-list li').each(function () {
            const latitudeText = $(this).find('.latitude').text().trim();
            const longitudeText = $(this).find('.longitude').text().trim();
            const name = $(this).find('.address-name').val() || '';
            const addressNumber = $(this).find('.address-number').text().trim().replace('.', '');

            const latitude = parseFloat(latitudeText.replace(',', '.'));
            const longitude = parseFloat(longitudeText.replace(',', '.'));

            if (!isNaN(latitude) && !isNaN(longitude)) {
                const placemark = new ymaps.Placemark(
                    [latitude, longitude],
                    {
                        balloonContent: `<strong>${addressNumber}</strong> ${name}`,
                        iconContent: addressNumber,
                    },
                    {
                        preset: 'islands#redStretchyIcon',
                    }
                );

                map.geoObjects.add(placemark);
                coordinates.push([latitude, longitude]);
                placemarks.push(placemark);

                // Обработчик для приближения к метке
                $(this).find('.address-name').on('click', function () {
                    map.setCenter([latitude, longitude], 17);
                    placemark.balloon.open();
                });
            } else {
                console.warn('Некорректные координаты для адреса:', name);
            }
        });

        // Установка границ карты
        if (coordinates.length > 0) {
            const bounds = ymaps.util.bounds.fromPoints(coordinates);
            map.setBounds(bounds, {
                checkZoomRange: true,
                zoomMargin: 20,
            });
        }

        // Добавление линии между точками
        if (coordinates.length > 1) {
            const polyline = new ymaps.Polyline(coordinates, {}, {
                strokeColor: '#0000FF',
                strokeWidth: 3,
                strokeOpacity: 0.5,
            });
            map.geoObjects.add(polyline);
        }
    }

    return {
        init: init,
        initMap: initMap,
    };
})();

// Модуль для работы с адресами
const Addresses = (function () {
    function init() {
        // Инициализация аккордеона
        $('.project__content-cell').each(function () {
            const sectionId = $(this).data('section-id');
            let isOpen = localStorage.getItem(`accordion-${sectionId}`) === 'true';
            $(this).find('.project__cell-content').toggle(isOpen);
            $(this).find('.project__cell-header').toggleClass('project__cell-header--active', isOpen);
        });

        $('.project__cell-header').on('click', function () {
            const section = $(this).closest('.project__content-cell');
            const sectionId = section.data('section-id');
            $(this).next('.project__cell-content').slideToggle(function () {
                const isOpen = $(this).is(':visible');
                localStorage.setItem(`accordion-${sectionId}`, isOpen.toString());
            });
            $(this).toggleClass('project__cell-header--active');
        });

        // Обработка добавления адресов
        $('#add-address-btn').on('click', addAddress);
        $('#update-addresses-btn').on('click', updateAddresses);
        $('#delete-addresses-btn').on('click', deleteAddresses);
        $('#get-coordinates-btn').on('click', getCoordinates);

        // Инициализация сортировки адресов
        $('#addresses-list').sortable({
            placeholder: 'ui-state-highlight',
            update: function () {
                updateAddressNumbersAfterSort();
                saveNewOrder();
            },
        }).disableSelection();

        // Проверка наличия адресов
        checkForNewAddresses();

        Utils.addDeleteEventListeners();
    }

    function addAddress() {
        const addressList = $('#addresses-list');
        const newListItem = $('<li>', { class: 'project__addresses-item' }).html(`
            <span class="address-number">=${addressList.children().length + 1}=</span>
            <input type="text" name="new_address_names[]" class="address-name" placeholder="Введите название адреса">
            <div class="hidden-coordinates">
                <span class="latitude"></span>
                <span class="longitude"></span>
            </div>
            <button type="button" class="delete-address-btn btn">Удалить</button>
        `);

        addressList.append(newListItem);
        newListItem.find('.delete-address-btn').on('click', function () {
            newListItem.remove();
            updateAddressNumbers();
            checkForNewAddresses();
            Map.initMap();
        });

        newListItem.find('.address-name').on('input', checkForNewAddresses);
        checkForNewAddresses();
        Utils.addDeleteEventListeners();
    }

    function updateAddresses() {
        const newAddresses = $('input[name="new_address_names[]"]')
            .map(function () {
                return $(this).val().trim();
            })
            .get()
            .filter((name) => name !== '');

        fetch(DJANGO_DATA.urls.updateAddresses, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': DJANGO_DATA.csrfToken,
            },
            body: JSON.stringify({ new_addresses: newAddresses }),
        })
            .then((response) => response.json())
            .then((data) => {
                if (data.status === 'ok') {
                    updateRemainingRequestsCount(data.remaining_requests);
                    updateAddressList(data.updated_addresses);
                } else {
                    alert(data.message || 'Произошла ошибка при обновлении адресов');
                }
            })
            .catch((error) => {
                console.error('Ошибка:', error);
                alert('Ошибка сети');
            });
    }

    function deleteAddresses() {
        if (!confirm('Вы уверены, что хотите удалить все адреса?')) return;

        fetch(DJANGO_DATA.urls.deleteAddresses, {
            method: 'POST',
            headers: {
                'X-CSRFToken': DJANGO_DATA.csrfToken,
                'Content-Type': 'application/json',
            },
        })
            .then((response) => {
                if (response.ok) {
                    $('#addresses-list').html('<li class="no-addresses">Нет адресов</li>');
                    $('.project__addresses-list-btns').hide();
                } else {
                    alert('Ошибка при удалении адресов');
                }
            })
            .catch((error) => {
                console.error('Error:', error);
                alert('Ошибка сети');
            });
    }

    function getCoordinates() {
        const btn = $('#get-coordinates-btn');
        if (btn.prop('disabled')) return;

        const fileInput = $('input[type="file"]');
        if (!fileInput[0].files || fileInput[0].files.length === 0) {
            alert('Excel файл не выбран!');
            return;
        }

        $('#loading-indicator').show();
        const formData = new FormData();
        formData.append('excel_file', fileInput[0].files[0]);

        fetch(DJANGO_DATA.urls.getCoordinates, {
            method: 'POST',
            body: formData,
            headers: {
                'X-CSRFToken': DJANGO_DATA.csrfToken,
            },
        })
            .then((response) => response.json())
            .then((data) => {
                $('#loading-indicator').hide();

                if (data.status === 'ok') {
                    const addressList = $('#addresses-list');
                    addressList.html('');

                    data.addresses.forEach((html) => {
                        const tempDiv = $('<div>').html(html);
                        addressList.append(tempDiv.children());
                    });

                    $('.project__addresses-list-btns').show();
                    Map.initMap();
                    Utils.addDeleteEventListeners();
                    Utils.updateAddressNumbers();
                } else {
                    alert(data.message || 'Ошибка при получении координат');
                    if (data.message && data.message.includes('Закончились запросы')) {
                        btn.prop('disabled', true);
                    }
                }

                updateRemainingRequestsCount(data.remaining_requests);
            })
            .catch((error) => {
                $('#loading-indicator').hide();
                console.error('Error:', error);
                alert('Ошибка сети');
            });
    }

    function updateAddressNumbersAfterSort() {
        $('#addresses-list li').each(function (index) {
            $(this).find('.address-number').text('=' + (index + 1) + '=');
        });
    }

    function saveNewOrder() {
        const orderData = [];
        $('#addresses-list li').each(function (index) {
            const addressId = $(this).data('id');
            orderData.push({ id: addressId, order: index });
        });

        $.ajax({
            url: DJANGO_DATA.urls.updateAddressOrder,
            type: 'POST',
            data: {
                order: JSON.stringify(orderData),
                model: 'Address',
                csrfmiddlewaretoken: DJANGO_DATA.csrfToken,
            },
            success: function (response) {
                console.log('Порядок адресов проекта успешно сохранен.');
                Map.initMap();
            },
            error: function (response) {
                console.error('Ошибка при сохранении порядка адресов проекта');
            },
        });
    }

    function checkForNewAddresses() {
        const hasNewAddress = $('input[name="new_address_names[]"]')
            .toArray()
            .some((input) => input.value.trim() !== '');
        const updateButton = $('#update-addresses-btn');
        const addressesListBtns = $('.project__addresses-list-btns');

        if (hasNewAddress) {
            updateButton.show();
            addressesListBtns.css('flex-direction', 'column');
        } else {
            updateButton.hide();
            addressesListBtns.css('flex-direction', 'row');
        }
    }

    function updateAddressList(updatedAddresses) {
        const addressList = $('#addresses-list');
        addressList.html('');

        updatedAddresses.forEach((address, index) => {
            const newListItem = $('<li>', {
                class: 'project__addresses-item',
                'data-id': address.id,
            }).html(`
                <span class="address-number">=${index + 1}=</span>
                <input class="address-name" value="${address.name}" data-id="${address.id}">
                <div class="hidden-coordinates">
                    <span class="latitude">${address.latitude}</span> | 
                    <span class="longitude">${address.longitude}</span>
                </div>
                <button class="delete-address-btn btn" data-id="${address.id}">Удалить</button>
            `);

            addressList.append(newListItem);
            newListItem.find('.delete-address-btn').on('click', function () {
                newListItem.remove();
                Utils.updateAddressNumbers();
                checkForNewAddresses();
                Map.initMap();
            });
        });

        Utils.addDeleteEventListeners();
        checkForNewAddresses();
    }

    function updateRemainingRequestsCount(count) {
        $('#remaining-requests').text(`${count}`);
    }

    function updateAddressNumbers() {
        const addressNumbers = document.querySelectorAll('.address-number');
        addressNumbers.forEach((span, index) => {
            span.textContent = `=${index + 1}=`;
        });
    }

    return {
        init: init,
    };
})();

// Модуль для работы с формой
const Form = (function () {
    function init() {
        // Сохранение первоначальных значений формы
        const originalValues = {};
        $('#project-form')
            .find('input, select, textarea')
            .each(function () {
                originalValues[$(this).attr('id')] = $(this).val();
            });

        // Проверка изменений в форме
        $('#project-form').on('change input', 'input, select, textarea', function () {
            let changed = false;

            $('#project-form')
                .find('input, select, textarea')
                .each(function () {
                    const id = $(this).attr('id');
                    if (originalValues[id] !== $(this).val()) {
                        changed = true;
                        return false; // Выход из цикла, если обнаружено изменение
                    }
                });

            // Изменение цвета кнопки
            if (changed) {
                $('#save-project-button').css('background-color', 'rgb(249 145 87)');
            } else {
                $('#save-project-button').css('background-color', '');
            }
        });

        // Сохранение проекта
        $('#save-project-button').on('click', function () {
            $('#project-form').submit();
        });

        // Поле для новой организации
        $('#id_organization').on('change', function () {
            if ($(this).val() == 'add_new') {
                $('#new-organization-field').show();
            } else {
                $('#new-organization-field').hide();
            }
        }).trigger('change');
    }

    return {
        init: init,
    };
})();

// Модуль для обработки событий
const EventHandlers = (function () {
    function init() {
        // Обновление счётчика запросов
        updateRemainingRequests();
        setInterval(updateRemainingRequests, 60 * 60 * 1000); // Каждые 60 минут
        setTimeout(updateRemainingRequests, DJANGO_DATA.secondsUntilMidnight * 1000);
    }

    function updateRemainingRequests() {
        fetch(DJANGO_DATA.urls.getRemainingRequests, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': DJANGO_DATA.csrfToken,
            },
        })
            .then((response) => response.json())
            .then((data) => {
                $('#remaining-requests').text(`${data.remaining_requests}`);
            })
            .catch((error) => console.error('Ошибка при обновлении оставшихся запросов:', error));
    }

    return {
        init: init,
    };
})();

const Utils = (function () {
    function updateAddressNumbers() {
        const addressNumbers = document.querySelectorAll('.address-number');
        addressNumbers.forEach((span, index) => {
            span.textContent = `=${index + 1}=`;
        });
    }

    function addDeleteEventListeners() {
        document.querySelectorAll('.delete-address-btn').forEach(button => {
            button.addEventListener('click', function (event) {
                event.preventDefault();

                const addressId = this.getAttribute('data-id');
                const addressName = this.closest('li').querySelector('.address-name').value;

                const confirmation = window.confirm(`Удалить адрес - ${addressName}?`);
                if (!confirmation) {
                    return;
                }

                fetch(DJANGO_DATA.urls.deleteAddress, {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': DJANGO_DATA.csrfToken,
                    },
                    body: JSON.stringify({ id: addressId }),
                })
                    .then(response => response.json())
                    .then(data => {
                        if (data.status === 'ok') {
                            this.closest('li').remove();
                            updateAddressNumbers();
                            Map.initMap();
                        } else {
                            alert('Ошибка при удалении адреса');
                        }
                    })
                    .catch(error => {
                        console.error('Ошибка:', error);
                        alert('Ошибка сети');
                    });
            });
        });
    }

    return {
        updateAddressNumbers,
        addDeleteEventListeners,
    };
})();
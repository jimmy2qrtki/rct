// static/js/event_detail.js

document.addEventListener('DOMContentLoaded', function() {
    const addressNames = document.querySelectorAll('.address-name');

    addressNames.forEach(addressName => {
        const text = addressName.textContent;
        const parentContainer = addressName.closest('.event-detail__content-col');
        const containerWidth = parentContainer ? parentContainer.offsetWidth : 0;
        const textWidth = getTextWidth(text, addressName);

        if (textWidth > containerWidth - 170) {
            addressName.innerHTML = `<span class="marquee-text">${text}</span>`;
            const marqueeText = addressName.querySelector('.marquee-text');
            const maxScroll = textWidth - containerWidth + 180;

            addressName.addEventListener('mouseenter', () => {
                marqueeText.style.transform = `translateX(-${maxScroll}px)`;
            });

            addressName.addEventListener('mouseleave', () => {
                marqueeText.style.transform = 'translateX(0)';
            });
        }
    });

    function getTextWidth(text, element) {
        const span = document.createElement('span');
        span.style.visibility = 'hidden';
        span.style.whiteSpace = 'nowrap';
        span.style.position = 'absolute';
        span.textContent = text;
        document.body.appendChild(span);
        const width = span.offsetWidth;
        document.body.removeChild(span);
        return width;
    }
});

document.addEventListener('DOMContentLoaded', function() {
    const tabs = document.querySelectorAll('.nav-link');
    const tabPanes = document.querySelectorAll('.tab-pane');

    tabs.forEach(tab => {
        tab.addEventListener('click', function(e) {
            e.preventDefault();

            tabs.forEach(t => t.classList.remove('active'));
            tabPanes.forEach(pane => pane.classList.remove('active'));

            this.classList.add('active');
            const targetPane = document.querySelector(this.getAttribute('data-target'));
            if (targetPane) {
                targetPane.classList.add('active');
            }
        });
    });

    if (tabs.length > 0) {
        tabs[0].click();
    }
});

$(document).ready(function() {
    // Инициализация аккордеона
    $('.event-detail__content-cell').each(function () {
        const sectionId = $(this).data('section-id');
        let isOpen = localStorage.getItem(`accordion-${sectionId}`) === 'true';
        $(this).find('.event-detail__cell-content').toggle(isOpen);
        $(this).find('.event-detail__cell-header').toggleClass('event-detail__cell-header--active', isOpen);
    });

    $('.event-detail__cell-header').on('click', function () {
        const section = $(this).closest('.event-detail__content-cell');
        const sectionId = section.data('section-id');
        $(this).next('.event-detail__cell-content').slideToggle(function () {
            const isOpen = $(this).is(':visible');
            localStorage.setItem(`accordion-${sectionId}`, isOpen.toString());
        });
        $(this).toggleClass('event-detail__cell-header--active');
    });

    $('#executor-event-addresses-list').on('click', '.accordion-header-wrap', function(event) {
        event.stopPropagation();
        const $accordionHeader = $(this).closest('.event-detail__addresses-item.accordion-header');
        const $photoUpload = $accordionHeader.find('.photo-upload');
        const $accordionHeaderWrap = $(this);
        
        if ($photoUpload.is(':hidden')) {
            $accordionHeaderWrap.addClass('active');
            $photoUpload.slideDown();
        } else {
            $accordionHeaderWrap.removeClass('active');
            $photoUpload.slideUp();
        }
    });

    $(document).on('click', '.refresh-upload-form', function() {
        const action = $(this).data('url');
        const csrfToken = window.csrfToken;

        if (!csrfToken) {
            alert('CSRF token not found!');
            return;
        }

        const formHtml = `
            <form class="photo-upload__form" method="post" enctype="multipart/form-data" action="${action}">
                <input type="hidden" name="csrfmiddlewaretoken" value="${csrfToken}">
                <div class="photo-upload__form-wrap">
                    <input type="file" name="photos" id="fileInput" accept="image/*" multiple style="display: none;">
                    <button class="photo-upload__choose-btn btn" type="button" id="customButton">Выбрать</button>
                    <span class="photo-upload__fileLabel" id="fileLabel">фото</span>
                    <label class="photo-upload__form-label">
                        <input type="checkbox" name="force_mjeure"> Форс-мажор
                    </label>
                </div>
                <button class="photo-upload__submit-btn btn" type="submit">Загрузить</button>
            </form>
        `;

        const parentElement = $(this).closest('.photo-upload');
        parentElement.html(formHtml);
        const newForm = parentElement.find('.photo-upload__form');
        bindFormEvents(newForm);
    });

    $(document).ready(function() {
        const photoUploadForms = $('.photo-upload__form');
        photoUploadForms.each(function() {
            bindFormEvents($(this));
        });
    });

    $(document).on('click', '.view-details', function() {
        const addressId = $(this).data('address-id');
        const addressName = $(this).closest('.event-detail__addresses-item').data('address-name');
        let currentPhotoIndex = 0;
        let photos = [];

        $.ajax({
            url: `${window.viewPhotosUrl}?address_id=${addressId}`,
            method: 'GET',
            success: function(data) {
                photos = data.photos;

                if (photos && photos.length > 0) {
                    $('#photoDisplay').show();
                    currentPhotoIndex = 0;
                    displayPhoto(currentPhotoIndex);

                    if (photos.length === 1) {
                        $('.prev-photo, .next-photo').hide();
                    } else {
                        $('.prev-photo, .next-photo').show();
                    }
                } else {
                    $('#photoDisplay').hide();
                    $('.prev-photo, .next-photo').hide();
                }

                $('#photosModal').fadeIn();
            },
            error: function() {
                alert('Ошибка при загрузке фотографий.');
            }
        });

        function displayPhoto(index) {
            if (photos && photos.length > 0) {
                $('#photoDisplay').attr('src', photos[index].url).attr('alt', `Фото ${photos[index].name} для ${photos[index].address_name}`);
            }
        }

        $('.prev-photo').on('click', function() {
            currentPhotoIndex = (currentPhotoIndex - 1 + photos.length) % photos.length;
            displayPhoto(currentPhotoIndex);
        });

        $('.next-photo').on('click', function() {
            currentPhotoIndex = (currentPhotoIndex + 1) % photos.length;
            displayPhoto(currentPhotoIndex);
        });
    });

    $(document).on('click', '.modal-close-btn', function() {
        $('#photosModal').fadeOut();
    });

    $(document).on('submit', 'form', function(event) {
        event.preventDefault();
        const form = $(this);
        const formData = new FormData(this);

        $.ajax({
            url: form.attr('action'),
            type: form.attr('method'),
            data: formData,
            processData: false,
            contentType: false,
            success: function(response) {
                if (response.error) {
                    alert(response.error);
                } else {
                    alert(response.success);
                    window.location.reload();
                }
            },
            error: function() {
                alert('Произошла ошибка. Повторите попытку позже.');
            }
        });
    });

    $('#complete-event').on('click', function() {
        $.ajax({
            url: window.completeEventUrl,
            method: 'POST',
            data: {
                'event_id': window.eventId,
                'csrfmiddlewaretoken': window.csrfToken,
            },
            success: function(response) {
                if (response.success) {
                    $('#assigned-event-addresses-list .photo-upload:has(.refresh-upload-form)').each(function() {
                        $(this).html('<span>Фотографии приняты</span>');
                    });
                    alert('Мероприятие успешно завершено.');
                } else {
                    if (response.error_addresses) {
                        const addressesWithoutPhotos = response.error_addresses.join('\n');
                        alert('Следующие адреса не содержат фотографий:\n' + addressesWithoutPhotos);
                    } else {
                        alert(response.error || 'Ошибка завершения мероприятия.');
                    }
                }
            },
            error: function() {
                alert('Произошла ошибка. Повторите попытку позже.');
            }
        });
    });

    const isManager = window.isManager === "true";
    const isExecutor = window.isExecutor === "true";

    ymaps.ready(init);

    function init() {
        var map = new ymaps.Map("map", {
            center: [55.76, 37.64],
            zoom: 10
        });

        function parseCoordinate(coordinate) {
            return parseFloat(coordinate.replace(',', '.'));
        }

        function updateMapMarkers(addresses) {
            map.geoObjects.removeAll();
            if (addresses.length === 0) {
                return;
            }

            var coordinates = [];
            addresses.forEach(function (item, index) {
                var latitude = parseCoordinate(item.latitude);
                var longitude = parseCoordinate(item.longitude);
                var addressNumber = index + 1;
                var name = item.name;
                var executorColor = item.executorColor || '#808080';

                if (!isNaN(latitude) && !isNaN(longitude)) {
                    var placemark = new ymaps.Placemark(
                        [latitude, longitude],
                        {
                            balloonContent: `<strong>=${addressNumber}=</strong> ${name}`,
                            iconContent: addressNumber
                        },
                        {
                            preset: 'islands#icon',
                            iconColor: executorColor
                        }
                    );
                    map.geoObjects.add(placemark);
                    coordinates.push([latitude, longitude]);
                } else {
                    console.warn('Некорректные координаты для адреса:', name);
                }
            });

            if (coordinates.length > 1) {
                var polyline = new ymaps.Polyline(coordinates, {}, {
                    strokeColor: "#0000FF",
                    strokeWidth: 3
                });
                map.geoObjects.add(polyline);
            }
            map.setBounds(map.geoObjects.getBounds(), { checkZoomRange: true });
        }

        function getAddressesFromList(listSelector) {
            return $(listSelector).find('li').map(function () {
                return {
                    id: $(this).data('id'),
                    name: $(this).find('.address-name').text(),
                    latitude: $(this).find('.latitude').text(),
                    longitude: $(this).find('.longitude').text(),
                    executorColor: $(this).data('executor-color')
                };
            }).get();
        }

        function saveNewOrder(elementSelector) {
            const orderData = [];
            $(elementSelector).find('li').each(function(index) {
                const addressId = $(this).data('id');
                $(this).find('.address-number').text('=' + (index + 1) + '=');
                orderData.push({ id: addressId, order: index });
            });
            $.ajax({
                url: window.updateAddressOrderUrl,
                type: "POST",
                data: {
                    order: JSON.stringify(orderData),
                    model: 'EventAddress',
                    csrfmiddlewaretoken: window.csrfToken
                },
                success: function(response) {
                    console.log('Порядок адресов успешно сохранен.');
                },
                error: function(response) {
                    console.error('Ошибка при сохранении порядка адресов');
                }
            });
        }

        function handleUpdateRoute() {
            let addresses;
            let listSelector;

            if (isManager) {
                listSelector = '#managerTabsContent .tab-pane.active ul';
            } else if (isExecutor) {
                listSelector = '#executor-event-addresses-list';
            }

            addresses = getAddressesFromList(listSelector);

            if (addresses.length > 0) {
                $.ajax({
                    url: window.calculateOptimalRouteUrl,
                    type: "POST",
                    data: {
                        coordinates: JSON.stringify(addresses),
                        csrfmiddlewaretoken: window.csrfToken
                    },
                    success: function(response) {
                        if (response.route) {
                            reorderAddresses(response.route, addresses, listSelector);
                        }
                    },
                    error: function() {
                        alert('Ошибка при расчете оптимального маршрута.');
                    }
                });
            }
        }

        function reorderAddresses(route, addresses, listSelector) {
            const sortedAddresses = route.map(index => addresses[index]);
            const listElement = $(listSelector);

            $.each(sortedAddresses, function(index, address) {
                listElement.find(`li[data-id='${address.id}']`).appendTo(listElement);
            });

            $.each(listElement.find('li'), function(index, element) {
                $(element).find('.address-number').text('=' + (index + 1) + '=');
            });
            
            updateMapMarkers(sortedAddresses);
            saveNewOrder(listElement);
        }

        $('#update-route').on('click', handleUpdateRoute);

        $(document).ready(function() {
            if (isManager) {
                $('#managerTabs a[data-target]').on('click', function (e) {
                    e.preventDefault();

                    $('#managerTabsContent .tab-pane').hide();
                    const targetSelector = $(this).data('target');
                    $(targetSelector).show();

                    $('#managerTabs a').removeClass('active');
                    $(this).addClass('active');

                    const addresses = getAddressesFromList(targetSelector + ' ul');
                    updateMapMarkers(addresses);
                }).first().trigger('click');

                $('#managerTabsContent .tab-pane ul').sortable({
                    update: function() {
                        const addresses = getAddressesFromList(this);
                        updateMapMarkers(addresses);
                        saveNewOrder(this);
                    }
                });
            }
        });

        if (isExecutor) {
            const addresses = getAddressesFromList('#executor-event-addresses-list');
            updateMapMarkers(addresses);

            $('#executor-event-addresses-list').sortable({
                update: function() {
                    const addresses = getAddressesFromList(this);
                    updateMapMarkers(addresses);
                    saveNewOrder(this);
                }
            });
        }
    }

    $(document).ready(function() {
        $('#print-addresses').on('click', function() {
            let addresses = [];

            if (isManager) {
                const activeTab = $('#managerTabsContent .tab-pane.active');
                addresses = activeTab.find('.event-detail__addresses-item').map(function() {
                    return {
                        number: $(this).find('.address-number').text(),
                        name: $(this).find('.address-name').text()
                    };
                }).get();
            } else if (isExecutor) {
                addresses = $('#executor-event-addresses-list .event-detail__addresses-item').map(function() {
                    return {
                        number: $(this).find('.address-number').text(),
                        name: $(this).find('.address-name').text()
                    };
                }).get();
            }

            const printContent = addresses.map(address => `<strong>${address.number}</strong> ${address.name}`).join('<br>');
            
            const printWindow = window.open('', '', 'height=600,width=800');
            printWindow.document.write(`
                <html>
                    <head>
                        <title>Печать маршрута</title>
                        <style>
                            body { font-family: Arial, sans-serif; }
                            .print-header { font-size: 18px; font-weight: bold; margin-bottom: 20px; }
                            .address-item { margin-bottom: 10px; }
                        </style>
                    </head>
                    <body>
                        <div class="print-header">
                            <h3 class="page__title">${window.eventTitle}</h3>
                            Организация: ${window.organization} 
                            <br>Продукт: ${window.product} 
                            <br>Кол-во фото: ${window.photoCount} 
                            <br>Дата начала: ${window.eventDate}
                            <br>Маршрут:
                        </div>
                        <div>${printContent}</div>
                    </body>
                </html>
            `);
            printWindow.document.close();
            printWindow.print();
        });
    });
});

function bindFormEvents(formElement) {
    console.log('Привязка обработчиков к форме:', formElement);

    const fileInput = formElement.find('input[type="file"]');
    const customButton = formElement.find('.photo-upload__choose-btn');
    const fileLabel = formElement.find('.photo-upload__fileLabel');
    const submitButton = formElement.find('.photo-upload__submit-btn');
    const forceMjeureCheckbox = formElement.find('input[name="force_mjeure"]');
    const allowedPhotoCount = parseInt(window.allowedPhotoCount);

    console.log('Найденные элементы:', {
        fileInput,
        customButton,
        fileLabel,
        submitButton,
        forceMjeureCheckbox,
    });

    if (customButton.length && fileInput.length && fileLabel.length && submitButton.length) {
        console.log('Элементы формы найдены');

        customButton.off('click').on('click', function() {
            console.log('Кнопка "Выбрать" нажата');
            fileInput.trigger('click');
        });

        fileInput.off('change').on('change', function() {
            console.log('Событие change сработало');
            const files = this.files;
            if (files.length > 0) {
                fileLabel.text(`Выбрано фото: ${files.length}`);
                console.log('Выбрано файлов:', files.length);
            } else {
                fileLabel.text('фото');
            }
            updateSubmitButtonState();
        });

        forceMjeureCheckbox.off('change').on('change', function() {
            updateSubmitButtonState();
        });

        function updateSubmitButtonState() {
            const selectedFiles = fileInput[0].files;
            const isForceMjeure = forceMjeureCheckbox.is(':checked');

            if (isForceMjeure && selectedFiles.length >= 1 && selectedFiles.length <= 10) {
                submitButton.removeClass('invalid').addClass('valid');
            } else if (selectedFiles.length === allowedPhotoCount) {
                submitButton.removeClass('invalid').addClass('valid');
            } else {
                submitButton.removeClass('valid').addClass('invalid');
            }
        }

        updateSubmitButtonState();
    } else {
        console.error('Один из элементов формы не найден:', {
            customButton: customButton.length,
            fileInput: fileInput.length,
            fileLabel: fileLabel.length,
            submitButton: submitButton.length,
        });
    }
}
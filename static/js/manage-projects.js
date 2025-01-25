document.addEventListener("DOMContentLoaded", function() {
    const tabLinks = document.querySelectorAll(".tab-link");
    const tabPanes = document.querySelectorAll(".tab-content > div");

    tabLinks.forEach(link => {
        link.addEventListener("click", function(e) {
            e.preventDefault();

            // Удаляем класс 'active' у всех ссылок и содержимого
            tabLinks.forEach(item => item.classList.remove('active'));
            tabPanes.forEach(pane => pane.classList.remove('active'));

            // Добавляем класс 'active' для текущей ссылки и её содержимого
            this.classList.add('active');
            const targetId = this.getAttribute('href').substring(1);
            const targetPane = document.getElementById(targetId);
            targetPane.classList.add('active');
        });
    });
});

$(document).ready(function() {
    // Открытие модального окна
    $('.create-project__link').on('click', function(event) {
        event.preventDefault();
        $('.modal').show();
    });

    // Закрытие модального окна
    $('.close').on('click', function() {
        $('#createProjectModal').hide();
    });

    // Клик вне модального окна
    $(window).on('click', function(event) {
        if (event.target.id === 'createProjectModal') {
            $('#createProjectModal').hide();
        }
    });

    $('#id_organization').change(function() {
        if ($(this).val() == 'add_new') {
            $('#new-organization-field').show();
        } else {
            $('#new-organization-field').hide();
        }
    }).change(); // Trigger change to update on load

    // Обработка отправки формы через AJAX
    $('#createProjectForm').on('submit', function(event) {
        event.preventDefault();
        var form = $(this);
        $.ajax({
            url: form.attr('action'),
            type: 'POST',
            data: form.serialize(),
            success: function(response) {
                if (response.success) {
                    // Перенаправление на страницу редактирования нового проекта
                    window.location.href = response.redirect_url;
                } else {
                    form.replaceWith(response.form_html);
                }
            },
            error: function(xhr, status, error) {
                alert('Произошла ошибка. Пожалуйста, попробуйте позже.');
            }
        });
    });
});
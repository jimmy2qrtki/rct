$(document).ready(function() {
    // Функция для переключения вкладок
    function switchTab(status) {
        // Переключение активной вкладки
        $('.tab').removeClass('active');
        $('.tab[data-status="' + status + '"]').addClass('active');
        // Показываем/скрываем контент
        $('.tab-content').removeClass('active');
        $('#content-' + status).addClass('active');
    }

    // Загружаем последнюю выбранную вкладку из localStorage
    var savedStatus = localStorage.getItem('selectedTab');
    if (savedStatus) {
        switchTab(savedStatus);
    } else {
        // Если ничего не сохранено, по умолчанию показываем первую вкладку
        switchTab('assigned');
    }

    $('.tab').click(function() {
        var status = $(this).data('status');
        switchTab(status);

        // Сохраняем выбранную вкладку в localStorage
        localStorage.setItem('selectedTab', status);
    });

    // ссылка для открытия деталей события
    document.querySelectorAll('button.data-button').forEach((button) => {
        button.addEventListener('click', (event) => {
            // Останавливаем распространение события, чтобы не срабатывал другой код
            event.stopPropagation(); 
            
            // Получаем URL из родительского элемента <tr>
            const url = event.currentTarget.closest('tr').dataset.url;
            
            // Перенаправляем на URL
            window.location.href = url;
        });
    });
});
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
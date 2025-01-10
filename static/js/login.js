ymaps.ready(init);
        function init() {
            var map = new ymaps.Map('map', {
                center: [55.7558, 37.6176], // Координаты центра Москвы
                zoom: 9,
                controls: []
            });
        }

        document.addEventListener('DOMContentLoaded', function() {
            const mapElement = document.getElementById('map');

            document.addEventListener('mousemove', function(e) {
                // Вычисляем смещение карты
                const xShift = (e.pageX - window.innerWidth / 2) / 30; // Без смещения центра
                const yShift = (e.pageY - window.innerHeight / 2) / 30;

                // Применяем трансляцию к карте
                mapElement.style.transform = `translate(${-xShift}px, ${-yShift}px)`;
            });
        });
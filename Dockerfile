# Используем официальный образ Python 3.13 для Windows Server Core
FROM python:3.13-slim

# Устанавливаем рабочую директорию в контейнере
WORKDIR /app

# Копируем файл зависимостей (если есть) и устанавливаем зависимости
COPY requirements.txt requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Копируем весь проект в рабочую директорию
COPY . .

# Экспортируем переменную окружения для Django
ENV PYTHONPATH=/app
ENV DJANGO_SETTINGS_MODULE=router.settings

# Создаем директорию для медиафайлов
RUN mkdir -p media

# Устанавливаем права доступа к директориям
RUN chmod -R 755 /app

# Открываем порт 8000 для веб-приложения
EXPOSE 8000

# Команда для запуска приложения
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]
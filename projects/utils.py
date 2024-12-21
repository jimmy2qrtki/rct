from datetime import datetime, timedelta
from django.utils import timezone
from projects.models import RequestCounter
import os
from django.conf import settings

def reset_request_counter(request):
    user = request.user
    counter, created = RequestCounter.objects.get_or_create(user=user)
    now = timezone.now()
    # Проверка времени и сброс в полночь
    if now.date() != counter.last_reset.date():
        counter.reset()

def get_time_until_midnight():
    now = timezone.now()
    midnight = (now + timedelta(days=1)).replace(hour=0, minute=0, second=0, microsecond=0)
    return midnight - now

def has_photos(user, event):
    # Определяем пути к папкам с фото
    try:
        executor_id = user.executorprofile.id
    except AttributeError:
        return False

    base_path = os.path.join(settings.MEDIA_ROOT, str(event.project.user.id), str(event.project.id), event.get_event_type_display(), str(executor_id))
    problems_path = os.path.join(base_path, "problems")

    # Проверяем наличие фото в основной и проблемной директориях
    has_main_photos = os.path.exists(base_path) and any(os.path.isfile(os.path.join(base_path, f)) for f in os.listdir(base_path))
    has_problem_photos = os.path.exists(problems_path) and any(os.path.isfile(os.path.join(problems_path, f)) for f in os.listdir(problems_path))

    return has_main_photos or has_problem_photos
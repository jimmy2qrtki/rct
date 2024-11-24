from datetime import datetime, timedelta
from django.utils import timezone
from projects.models import RequestCounter

def reset_request_counter():
    counter, created = RequestCounter.objects.get_or_create(pk=1)
    now = timezone.now()
    # Проверка времени и сброс в полночь
    if now.date() != counter.last_reset.date():
        counter.reset()

def get_time_until_midnight():
    now = timezone.now()
    midnight = (now + timedelta(days=1)).replace(hour=0, minute=0, second=0, microsecond=0)
    return midnight - now
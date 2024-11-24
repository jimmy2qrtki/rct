from celery import shared_task
import redis
from django.conf import settings

redis_client = redis.StrictRedis.from_url(settings.CELERY_BROKER_URL, decode_responses=True)

@shared_task
def reset_requests_counter():
    redis_client.set('remaining_requests', 1000)
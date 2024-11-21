from django.apps import AppConfig


class RctConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'rct'

    def ready(self):
        import rct.signals

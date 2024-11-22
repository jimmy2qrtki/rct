from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from projects.models import Project

class Command(BaseCommand):
    help = 'Fix projects with invalid user_id references.'

    def handle(self, *args, **kwargs):
        default_user = User.objects.first()  # Предположим, что первый пользователь существует
        if not default_user:
            self.stdout.write(self.style.ERROR('No default user found. Please add users first.'))
            return

        projects_fixed = Project.objects.filter(user=None).update(user=default_user)
        self.stdout.write(self.style.SUCCESS(f'Fixed {projects_fixed} projects.'))
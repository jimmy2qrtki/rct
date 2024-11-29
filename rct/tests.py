from django.test import TestCase, RequestFactory
from django.contrib.auth import get_user_model, authenticate

class AuthenticationTest(TestCase):
    def setUp(self):
        # Создаем тестового пользователя
        self.user = get_user_model().objects.create_user(
            username='arut.shakhverdyan@yandex.ru',
            password='a7911a7911'
         )
        self.factory = RequestFactory()

    def test_authentication_with_request(self):
        request = self.factory.post('/login/')
        user = authenticate(request=request, username='arut.shakhverdyan@yandex.ru', password='a7911a7911')
        self.assertIsNotNone(user)
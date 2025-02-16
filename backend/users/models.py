# users/models.py

from django.contrib.auth.models import AbstractUser, Group, Permission
from django.db import models
from django.utils.translation import gettext_lazy as _
from .managers import CustomUserManager
from .levels import calculate_level, experience_to_next_level


class CustomUser(AbstractUser):
    avatar = models.ImageField(upload_to="avatars/", blank=True, null=True)
    cover_image = models.ImageField(
        upload_to="covers/", blank=True, null=True, verbose_name=_("Обложка")
    )
    first_name = models.CharField(max_length=100, blank=True, verbose_name=_("Имя"))
    last_name = models.CharField(max_length=100, blank=True, verbose_name=_("Фамилия"))
    country = models.CharField(max_length=100, blank=True, verbose_name=_("Страна"))
    city = models.CharField(max_length=100, blank=True, verbose_name=_("Город"))
    about_me = models.TextField(blank=True, verbose_name=_("Обо мне"))
    groups = models.ManyToManyField(Group, related_name="custom_users", blank=True)
    user_permissions = models.ManyToManyField(
        Permission, related_name="custom_users", blank=True
    )
    username = models.CharField(max_length=150, unique=True)
    achievements_received = models.ManyToManyField(
        "achievements.Achievement", related_name="received_by_users", blank=True
    )
    experience = models.IntegerField(default=0, verbose_name=_("Опыт"))

    objects = CustomUserManager()

    @property
    def level(self):
        """
        Возвращает текущий уровень пользователя
        """
        return calculate_level(self.experience)

    @property
    def next_level_experience(self):
        """
        Возвращает количество опыта, необходимое для следующего уровня
        """
        return experience_to_next_level(self.experience)

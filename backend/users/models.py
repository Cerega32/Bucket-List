# users/models.py

from django.contrib.auth.models import AbstractUser, Group, Permission
from django.db import models
from django.utils.translation import gettext_lazy as _
from .managers import CustomUserManager


class CustomUser(AbstractUser):
    avatar = models.ImageField(upload_to="avatars/", blank=True, null=True)
    first_name = models.CharField(max_length=100, blank=True, verbose_name=_("Имя"))
    last_name = models.CharField(max_length=100, blank=True, verbose_name=_("Фамилия"))
    groups = models.ManyToManyField(Group, related_name="custom_users", blank=True)
    user_permissions = models.ManyToManyField(
        Permission, related_name="custom_users", blank=True
    )
    username = models.CharField(max_length=150, unique=True)
    achievements_received = models.ManyToManyField(
        "achievements.Achievement", related_name="received_by_users", blank=True
    )

    objects = CustomUserManager()

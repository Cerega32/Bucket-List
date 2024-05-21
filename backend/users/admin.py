from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser


class CustomUserAdmin(UserAdmin):
    list_display = (
        "username",
        "email",
        "first_name",
        "last_name",
        "id",
        "avatar_display",
    )
    search_fields = ("username", "email", "first_name", "last_name")

    fieldsets = (
        (None, {"fields": ("username", "email", "password")}),
        (
            "Personal Info",
            {
                "fields": (
                    "first_name",
                    "last_name",
                    "avatar",
                    "cover_image",  # Добавляем поле обложки
                    "country",  # Добавляем поле страны
                    "city",  # Добавляем поле города
                    "about_me",  # Добавляем поле обо мне
                    "achievements_received",
                )
            },
        ),
        (
            "Permissions",
            {
                "fields": (
                    "is_active",
                    "is_staff",
                    "is_superuser",
                    "groups",
                    "user_permissions",
                )
            },
        ),
        ("Important dates", {"fields": ("last_login", "date_joined")}),
    )

    add_fieldsets = (
        (
            None,
            {
                "classes": ("wide",),
                "fields": (
                    "username",
                    "email",
                    "password1",
                    "password2",
                    "avatar",
                    "cover_image",  # Добавляем поле обложки
                    "country",  # Добавляем поле страны
                    "city",  # Добавляем поле города
                    "about_me",  # Добавляем поле обо мне
                ),
            },
        ),
    )

    def avatar_display(self, obj):
        return obj.avatar.url if obj.avatar else None

    avatar_display.short_description = "Avatar"


admin.site.register(CustomUser, CustomUserAdmin)

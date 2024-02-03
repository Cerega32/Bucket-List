from django.contrib import admin
from .models import Achievement
from django.forms import ModelForm
from django.contrib.admin import widgets


class AchievementForm(ModelForm):
    class Meta:
        model = Achievement
        fields = ["title", "description", "image", "condition", "achieved_users"]
        widgets = {
            "condition": widgets.AdminTextareaWidget(attrs={"cols": 40, "rows": 10}),
        }


class AchievementAdmin(admin.ModelAdmin):
    form = AchievementForm
    list_display = ("title", "description", "image")
    list_filter = ("condition",)
    search_fields = ("title", "description")


admin.site.register(Achievement, AchievementAdmin)

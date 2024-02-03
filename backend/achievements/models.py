from django.db import models
from users.models import CustomUser
from goals.models import Goal

# achievements/models.py


class Achievement(models.Model):
    title = models.CharField(max_length=200)
    description = models.TextField()
    image = models.ImageField(upload_to="achievement_images/")
    condition = models.JSONField(default=dict, blank=True)
    achieved_users = models.ManyToManyField(
        CustomUser, related_name="achievements", blank=True
    )

    def check_condition(self, user):
        condition = self.condition
        # if "travel_goals" in condition and condition["travel_goals"]:
        #     # Проверяем, есть ли у пользователя две цели из категории "путешествия"
        #     travel_goals_count = Goal.objects.filter(
        #         added_by_users=user, category__name_en="travel"
        #     ).count()

        #     # Если у пользователя есть две цели из категории "путешествия", условие выполнено
        #     if travel_goals_count >= 2:
        #         return True

        return True

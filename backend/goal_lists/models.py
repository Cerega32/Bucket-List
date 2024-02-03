# goal_lists/models.py

from django.db import models
from transliterate import translit
from goals.models import Goal
from categories.models import Category
from users.models import CustomUser  # Import your CustomUser model


class GoalList(models.Model):
    COMPLEXITY_CHOICES = [
        ("easy", "Легко"),
        ("medium", "Средне"),
        ("hard", "Тяжело"),
    ]

    title = models.CharField(max_length=200)
    category = models.ForeignKey(
        Category,
        on_delete=models.CASCADE,
        blank=True,
        null=True,
    )
    subcategory = models.ForeignKey(
        Category,
        on_delete=models.CASCADE,
        related_name="goal_lists_subcategory",
        null=True,
        blank=True,
    )
    complexity = models.CharField(
        max_length=20,
        choices=COMPLEXITY_CHOICES,
        blank=True,
    )
    image = models.ImageField(upload_to="list_images/", blank=True, null=True)
    description = models.TextField()
    short_description = models.CharField(max_length=200, blank=True)
    code = models.SlugField(max_length=255, unique=True, blank=True)
    goals = models.ManyToManyField(Goal)
    added_by_users = models.ManyToManyField(
        CustomUser, related_name="added_goal_lists", blank=True
    )
    completed_by_users = models.ManyToManyField(
        CustomUser, related_name="completed_goal_lists", blank=True
    )
    created_at = models.DateTimeField(
        auto_now_add=True
    )  # Добавленное поле для отметки времени создания цели

    def save(self, *args, **kwargs):
        self.short_description = self.description[:200]
        if not self.code:
            original_code = translit(self.title, reversed=True)
            code = original_code.replace(" ", "-").replace("'", "").lower()
            if self.pk is not None:  # Проверяем, что self.pk не None
                self.code = f"{self.pk}-{code}"
            else:
                super().save(
                    *args, **kwargs
                )  # Сначала сохраняем объект для получения self.pk
                self.code = f"{self.pk}-{code}"
                super().save(*args, **kwargs)  # Сохраняем с обновленным кодом
        else:
            super().save(*args, **kwargs)

    def __str__(self):
        return self.title


class GoalInList(models.Model):
    goal = models.ForeignKey(Goal, on_delete=models.CASCADE)
    goal_list = models.ForeignKey(GoalList, on_delete=models.CASCADE)

    class Meta:
        unique_together = ("goal", "goal_list")

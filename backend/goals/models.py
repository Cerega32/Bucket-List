from django.db import models
from transliterate import translit
from categories.models import Category
from users.models import CustomUser


class Goal(models.Model):
    COMPLEXITY_CHOICES = [
        ("easy", "Легко"),
        ("medium", "Средне"),
        ("hard", "Тяжело"),
    ]

    title = models.CharField(max_length=200)
    category = models.ForeignKey(Category, on_delete=models.CASCADE)
    subcategory = models.ForeignKey(
        Category,
        on_delete=models.CASCADE,
        related_name="subgoals_goal",
        null=True,
        blank=True,
    )
    complexity = models.CharField(max_length=20, choices=COMPLEXITY_CHOICES)
    image = models.ImageField(upload_to="goal_images/", blank=True, null=True)
    description = models.TextField()
    short_description = models.CharField(max_length=200, blank=True)
    code = models.SlugField(max_length=255, unique=True, blank=True)
    added_by_users = models.ManyToManyField(
        CustomUser, related_name="added_goals", blank=True
    )
    added_from_list = models.JSONField(default=dict, blank=True)
    completed_by_users = models.ManyToManyField(
        CustomUser, related_name="completed_goals", blank=True
    )
    comments = models.ManyToManyField(
        "comments.Comment", related_name="goal_comments", blank=True
    )
    subgoals = models.ManyToManyField(
        "Goal", related_name="category_subgoals", blank=True
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        self.short_description = self.description[:200]
        if not self.code:
            original_code = translit(self.title, language_code="ru", reversed=True)
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

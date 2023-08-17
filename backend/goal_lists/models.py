# goal_lists/models.py

from django.db import models
from transliterate import translit
from goals.models import Goal
from categories.models import Category


class GoalList(models.Model):
    COMPLEXITY_CHOICES = [
        ('easy', 'Легко'),
        ('medium', 'Средне'),
        ('hard', 'Тяжело'),
    ]

    title = models.CharField(max_length=200)
    category = models.ForeignKey(Category, on_delete=models.CASCADE)
    subcategory = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='goal_lists_subcategory', null=True, blank=True)
    complexity = models.CharField(max_length=20, choices=COMPLEXITY_CHOICES)
    image = models.ImageField(upload_to='list_images/', blank=True, null=True)
    description = models.TextField()
    short_description = models.CharField(max_length=200, blank=True)
    code = models.SlugField(max_length=255, unique=True, blank=True)
    goals = models.ManyToManyField(Goal, related_name='goal_lists')
    added_by_users = models.ManyToManyField('auth.User', related_name='added_goal_lists', blank=True)
    completed_by_users = models.ManyToManyField('auth.User', related_name='completed_goal_lists', blank=True)

    def save(self, *args, **kwargs):
        # Генерируем короткое описание из описания, обрезаем до 200 символов
        self.short_description = self.description[:200]

        if not self.code:
            # Вызываем метод save() родительского класса, чтобы объект был сохранен и получил id
            super(GoalList, self).save(*args, **kwargs)

            original_code = translit(self.title, reversed=True)
            code = original_code.replace(' ', '-').replace('\'', '').lower()
            self.code = f'{self.id}-{code}'

            # Повторно вызываем метод save(), чтобы сохранить код
            super(GoalList, self).save(*args, **kwargs)

    def __str__(self):
        return self.title

class GoalInList(models.Model):
    goal = models.ForeignKey(Goal, on_delete=models.CASCADE)
    goal_list = models.ForeignKey(GoalList, on_delete=models.CASCADE)

    class Meta:
        unique_together = ('goal', 'goal_list')

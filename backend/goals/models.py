from django.db import models
from transliterate import translit
from categories.models import Category

class Goal(models.Model):
    COMPLEXITY_CHOICES = [
        ('easy', 'Легко'),
        ('medium', 'Средне'),
        ('hard', 'Тяжело'),
    ]

    title = models.CharField(max_length=200)
    category = models.ForeignKey(Category, on_delete=models.CASCADE)
    subcategory = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='subgoals_goal', null=True, blank=True)
    complexity = models.CharField(max_length=20, choices=COMPLEXITY_CHOICES)
    image = models.ImageField(upload_to='goal_images/', blank=True, null=True)
    description = models.TextField()
    short_description = models.CharField(max_length=200, blank=True)
    code = models.SlugField(max_length=255, unique=True, blank=True)
    added_by_users = models.ManyToManyField('auth.User', related_name='added_goals', blank=True)
    completed_by_users = models.ManyToManyField('auth.User', related_name='completed_goals', blank=True)
    comments = models.ManyToManyField('comments.Comment', related_name='goal_comments', blank=True)
    subgoals = models.ManyToManyField('Goal', related_name='category_subgoals', blank=True)

    def save(self, *args, **kwargs):
        self.short_description = self.description[:200]
        if not self.code:  # Добавьте эту строку для того, чтобы code создавался только при создании объекта
            original_code = translit(self.title, reversed=True)
            code = original_code.replace(' ', '-').replace('\'', '').lower()
            self.code = f'{self.id}-{code}'
        super(Goal, self).save(*args, **kwargs)

    def __str__(self):
        return self.title

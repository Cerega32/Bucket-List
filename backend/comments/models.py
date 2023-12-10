from django.db import models
from django.contrib.auth.models import User
from django.contrib.postgres.fields import ArrayField

class Comment(models.Model):
    COMPLEXITY_CHOICES = [
        ('easy', 'Легко'),
        ('medium', 'Средне'),
        ('hard', 'Тяжело'),
    ]

    goal = models.ForeignKey('goals.Goal', on_delete=models.CASCADE)
    user = models.ForeignKey('auth.User', on_delete=models.CASCADE)
    text = models.TextField()
    likes = models.ManyToManyField('auth.User', related_name='liked_comments', blank=True)
    dislikes = models.ManyToManyField('auth.User', related_name='disliked_comments', blank=True)
    date_created = models.DateTimeField(auto_now_add=True)
    complexity = models.CharField(max_length=20, choices=COMPLEXITY_CHOICES)
    photos = models.ManyToManyField('CommentPhoto', related_name='comment_photos', blank=True)

    def __str__(self):
        return f'Comment by {self.user.username} on {self.goal.title}'

class CommentPhoto(models.Model):
    comment = models.ForeignKey(Comment, on_delete=models.CASCADE)
    image = models.ImageField(upload_to='comment_photos/')
    
    class Meta:
        verbose_name = 'Comment Photo'
        verbose_name_plural = 'Comment Photos'

class CommentAction(models.Model):
    LIKE = 'like'
    DISLIKE = 'dislike'
    ACTION_CHOICES = [(LIKE, 'Like'), (DISLIKE, 'Dislike')]

    user = models.ForeignKey(User, on_delete=models.CASCADE)
    comment = models.ForeignKey(Comment, on_delete=models.CASCADE)
    action = models.CharField(max_length=10, choices=ACTION_CHOICES)

    class Meta:
        unique_together = ['user', 'comment']

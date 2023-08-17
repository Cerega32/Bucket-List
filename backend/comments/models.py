from django.db import models

class Comment(models.Model):
    goal = models.ForeignKey('goals.Goal', on_delete=models.CASCADE)
    user = models.ForeignKey('users.CustomUser', on_delete=models.CASCADE)
    text = models.TextField()

    def __str__(self):
        return f'Comment by {self.user.username} on {self.goal.title}'

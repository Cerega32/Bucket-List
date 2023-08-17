from django.db import models

class Category(models.Model):
    name = models.CharField(max_length=100)
    name_en = models.CharField(max_length=100, verbose_name="English Name", blank=True)
    parent_category = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True)

    def __str__(self):
        return self.name

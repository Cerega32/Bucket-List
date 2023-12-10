from django.contrib import admin
from .models import Comment, CommentPhoto

class CommentPhotoInline(admin.StackedInline):
    model = CommentPhoto
    extra = 1  # Количество "пустых" форм для загрузки изображений

class CommentAdmin(admin.ModelAdmin):
    inlines = [CommentPhotoInline]

admin.site.register(Comment, CommentAdmin)
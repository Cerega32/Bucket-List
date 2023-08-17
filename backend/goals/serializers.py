from rest_framework import serializers
from .models import Goal, Category

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = '__all__'

class GoalSerializer(serializers.ModelSerializer):
    category = CategorySerializer()
    subcategory = CategorySerializer()

    class Meta:
        model = Goal
        fields = ('id', 'title', 'category', 'subcategory', 'complexity', 'image', 'description', 'code')

# Можете добавить другие поля по мере необходимости

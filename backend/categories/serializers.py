from rest_framework import serializers
from .models import Category
from goals.models import Goal
from goals.serializers import GoalSerializer

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ('id', 'name', 'name_en', 'parent_category')

class CategoryDetailedSerializer(serializers.ModelSerializer):
    # goals = GoalSerializer(many=True, read_only=True)
    goal_count = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = ('id', 'name', 'name_en', 'parent_category', 'image', 'goal_count')

    def get_goal_count(self, category):
        # Получаем количество целей для данной категории
        return Goal.objects.filter(category=category).count()

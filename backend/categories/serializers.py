from rest_framework import serializers
from .models import Category
from goals.models import Goal
from goals.serializers import GoalSerializer


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ("id", "name", "name_en", "parent_category")


class CategoryDetailedSerializer(serializers.ModelSerializer):
    goal_count = serializers.SerializerMethodField()
    parent_category = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = (
            "id",
            "name",
            "name_en",
            "parent_category",
            "image",
            "goal_count",
            "icon",
        )

    def get_goal_count(self, category):
        return Goal.objects.filter(category=category).count()

    def get_parent_category(self, category):
        # Возвращаем все поля связанной категории, если она есть
        if category.parent_category:
            return CategorySerializer(category.parent_category).data
        return None

from rest_framework import serializers
from .models import Goal, Category


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = "__all__"


class GoalSerializer(serializers.ModelSerializer):
    category = CategorySerializer()
    subcategory = CategorySerializer()
    totalAdded = (
        serializers.SerializerMethodField()
    )  # Новое поле для количества пользователей
    totalCompleted = (
        serializers.SerializerMethodField()
    )  # Новое поле для количества пользователей
    added_by_user = serializers.SerializerMethodField()
    completed_by_user = serializers.SerializerMethodField()

    class Meta:
        model = Goal
        fields = (
            "id",
            "title",
            "category",
            "subcategory",
            "complexity",
            "image",
            "description",
            "short_description",
            "code",
            "totalAdded",
            "totalCompleted",
            "added_by_user",
            "completed_by_user",
            "created_at",
        )

    # Метод для получения количества пользователей, добавивших цель
    def get_totalAdded(self, obj):
        return obj.added_by_users.count()

    def get_totalCompleted(self, obj):
        return obj.completed_by_users.count()

    def get_added_by_user(self, goal):
        user = self.context["request"].user
        if user.is_authenticated:
            return goal.added_by_users.filter(id=user.id).exists()
        return False

    def get_completed_by_user(self, goal):
        user = self.context["request"].user
        if user.is_authenticated:
            return goal.completed_by_users.filter(id=user.id).exists()
        return False


# Можете добавить другие поля по мере необходимости

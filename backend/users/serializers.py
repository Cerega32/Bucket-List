# serializers.py

from rest_framework import serializers
from .models import CustomUser
from django.contrib.auth import authenticate  # Make sure this import is added
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from achievements.models import Achievement


class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True, required=True, style={"input_type": "password"}
    )

    class Meta:
        model = CustomUser
        fields = ("email", "password", "first_name")

    def create(self, validated_data):
        # Ensure a unique username is set, for example, using the email
        validated_data["username"] = validated_data["email"]

        user = CustomUser.objects.create_user(**validated_data)
        return user


class UserLoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField()

    def validate(self, data):
        email = data.get("email")
        password = data.get("password")

        user = authenticate(username=email, password=password)
        if not user:
            raise serializers.ValidationError("Invalid credentials")

        data["user"] = user
        return data


class CustomUserSerializer(serializers.ModelSerializer):
    level = serializers.IntegerField(read_only=True)
    next_level_experience = serializers.IntegerField(read_only=True)

    class Meta:
        model = CustomUser
        fields = (
            "id",
            "username",
            "email",
            "avatar",
            "cover_image",
            "country",
            "first_name",
            "last_name",
            "about_me",
            "totalCompletedGoals",
            "totalAddedGoals",
            "totalCompletedLists",
            "totalAddedLists",
            "totalAchievements",
            "experience",
            "level",
            "next_level_experience",
        )

    totalCompletedGoals = serializers.SerializerMethodField()
    totalAddedGoals = serializers.SerializerMethodField()
    totalCompletedLists = serializers.SerializerMethodField()
    totalAddedLists = serializers.SerializerMethodField()
    totalAchievements = serializers.SerializerMethodField()
    # totalComments = serializers.SerializerMethodField()

    def get_totalCompletedGoals(self, user):
        return user.completed_goals.count()

    def get_totalAddedGoals(self, user):
        return user.added_goals.count()

    def get_totalCompletedLists(self, user):
        return user.completed_goal_lists.count()

    def get_totalAddedLists(self, user):
        return user.added_goal_lists.count()

    def get_totalAchievements(self, user):
        return user.achievements.count()

    # def get_totalComments(self, user):
    #     return user.added_goal_lists.count()

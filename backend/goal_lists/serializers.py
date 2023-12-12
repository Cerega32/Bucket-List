from rest_framework import serializers
from .models import Category, GoalList
from categories.serializers import CategorySerializer

class GoalListSerializer(serializers.ModelSerializer):
    category = CategorySerializer()
    subcategory = CategorySerializer()

    class Meta:
        model = GoalList
        fields = '__all__'


class GoalListShortSerializer(serializers.ModelSerializer):
    category = CategorySerializer()
    total_added = serializers.SerializerMethodField()
    added_by_user = serializers.SerializerMethodField()
    completed_by_user = serializers.SerializerMethodField()
    goals_count = serializers.SerializerMethodField()
    user_completed_goals = serializers.SerializerMethodField()

    class Meta:
        model = GoalList
        fields = ('code', 'title', 'short_description', 'complexity', 'image', 'category', 'total_added', 'added_by_user', 'completed_by_user', 'goals_count', 'user_completed_goals')

    def get_total_added(self, list):
        return list.added_by_users.count()

    def get_goals_count(self, list):
        return list.goals.count()

    def get_added_by_user(self, goal_list):
        user = self.context['request'].user
        if user.is_authenticated:
            return goal_list.added_by_users.filter(id=user.id).exists()
        return False

    def get_completed_by_user(self, goal_list):
        user = self.context['request'].user
        if user.is_authenticated:
            return goal_list.completed_by_users.filter(id=user.id).exists()
        return False

    def get_user_completed_goals(self, goal_list):
        user = self.context['request'].user
        if user.is_authenticated:
            return goal_list.goals.filter(completed_by_users=user).count()
        return 0

    # def get_total_completed(self, goal_list):
    #     return goal_list.completed_by_users.count()

class GoalListSerializer(serializers.ModelSerializer):
    # user = serializers.SerializerMethodField()

    # def get_user(self, comment):
    #     if comment.user and comment.user.is_authenticated:
    #         return comment.user.id
    #     else:
    #         return None
        
    category = CategorySerializer()
    total_added = serializers.SerializerMethodField()
    added_by_user = serializers.SerializerMethodField()
    completed_by_user = serializers.SerializerMethodField()
    goals_count = serializers.SerializerMethodField()
    user_completed_goals = serializers.SerializerMethodField()

    total_completed = serializers.SerializerMethodField()


    # 'subcategory': subcategory_serializer.data if subcategory_serializer else None,

    class Meta:
        model = GoalList
        fields = (
            'code',
            'title', 
            'short_description', 
            'description',
            'complexity', 
            'image', 
            'category', 
            'subcategory',
            'total_added', 
            'added_by_user', 
            'completed_by_user', 
            'goals_count', 
            'user_completed_goals',
            'total_completed',
        )

    def get_total_added(self, list):
        return list.added_by_users.count()

    def get_goals_count(self, list):
        return list.goals.count()

    def get_added_by_user(self, goal_list):
        user = self.context['request'].user
        if user.is_authenticated:
            return goal_list.added_by_users.filter(id=user.id).exists()
        return False

    def get_completed_by_user(self, goal_list):
        user = self.context['request'].user
        if user.is_authenticated:
            return goal_list.completed_by_users.filter(id=user.id).exists()
        return False

    def get_user_completed_goals(self, goal_list):
        user = self.context['request'].user
        if user.is_authenticated:
            return goal_list.goals.filter(completed_by_users=user).count()
        return 0
    
    def get_total_completed(self, list):
        return list.completed_by_users.count()


    
from rest_framework import serializers
from .models import Category, GoalList
from categories.serializers import CategorySerializer

class GoalListSerializer(serializers.ModelSerializer):
    category = CategorySerializer()
    subcategory = CategorySerializer()

    class Meta:
        model = GoalList
        fields = '__all__'

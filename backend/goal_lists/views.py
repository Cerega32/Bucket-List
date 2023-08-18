from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from .models import GoalList
from rest_framework import status
from .serializers import GoalListSerializer, CategorySerializer


@api_view(['GET'])
@permission_classes([AllowAny])
def get_goal_list_details(request, code):
    try:
        goal_list = GoalList.objects.get(code=code)
    except GoalList.DoesNotExist:
        return Response({'error': 'Список целей не найден'}, status=status.HTTP_404_NOT_FOUND)
    
    user = request.user
    
    # Проверяем, добавил ли пользователь данный список к себе
    added_by_user = goal_list.added_by_users.filter(id=user.id).exists()
    
    # Сериализация полей category и subcategory
    category_serializer = CategorySerializer(goal_list.category)
    subcategory_serializer = CategorySerializer(goal_list.subcategory) if goal_list.subcategory else None
    
    # Получаем количество пользователей, которые выполнили этот список целей
    completed_users_count = goal_list.completed_by_users.count()
    
    # Получаем количество пользователей, которые добавили этот список себе
    added_users_count = goal_list.added_by_users.count()
    
    # Формируем данные о списке целей пользователя
    goal_list_data = {
        'title': goal_list.title,
        'category': category_serializer.data,
        'subcategory': subcategory_serializer.data if subcategory_serializer else None,
        'complexity': goal_list.complexity,
        'image': goal_list.image.url if goal_list.image else None,
        'description': goal_list.description,
        'shortDescription': goal_list.short_description,
        'completedUsersCount': completed_users_count,
        'addedUsersCount': added_users_count,
        'addedByUser': added_by_user,  # Проверка, добавил ли пользователь данный список к себе
    }
    
    # Формируем массив со всеми целями в списке
    goals_data = []
    for goal in goal_list.goals.all():
        goal_data = {
            'code': goal.code,
            'title': goal.title,
            'category': category_serializer.data,
            'subcategory': subcategory_serializer.data if subcategory_serializer else None,
            'complexity': goal.complexity,
            'image': goal.image.url if goal.image else None,
            'description': goal.description,
            'shortDescription': goal.short_description,
            'completedByUser': goal.completed_by_users.filter(id=user.id).exists(),
            'totalCompleted': goal.completed_by_users.count(),  # Получаем количество пользователей, выполнивших цель
        }
        goals_data.append(goal_data)
    
    response_data = {
        'list': {
            **goal_list_data,
            'goals': goals_data,
        },
    }
    
    return Response(response_data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def add_goal_list(request, code):
    try:
        goal_list = GoalList.objects.get(code=code)
    except GoalList.DoesNotExist:
        return Response({'error': 'Список целей не найден'}, status=status.HTTP_404_NOT_FOUND)
    
    user = request.user
    
    # Добавляем пользователя к списку "added_by_users"
    goal_list.added_by_users.add(user)
    
    return Response({'message': 'Список целей успешно добавлен'}, status=status.HTTP_200_OK)
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from .models import Goal
from .serializers import GoalSerializer
from rest_framework import status


@api_view(['GET'])
@permission_classes([AllowAny])
def get_goal_by_code(request, code):
    try:
        goal = Goal.objects.get(code=code)
    except Goal.DoesNotExist:
        return Response({'error': 'Goal not found'}, status=status.HTTP_404_NOT_FOUND)
    
    user = request.user
    done = goal.completed_by_users.filter(id=user.id).exists()
    added = goal.added_by_users.filter(id=user.id).exists()
    
    total_added = goal.added_by_users.count()
    total_completed = goal.completed_by_users.count()
    
    serializer = GoalSerializer(goal)
    
    related_lists = goal.lists.all() if hasattr(goal, 'lists') else []  # Получаем связанные списки, если они есть
    
    first_four_lists = related_lists[:4]  # Выбираем первые четыре
    
    related_lists_data = []  # Создаем список для хранения данных о связанных списках
    
    for goal_list in first_four_lists:
        list_data = {
            'title': goal_list.title,
            'image': goal_list.image.url,
            'shortDescription': goal_list.short_description,
            'category': goal_list.category.name,
            'complexity': goal_list.complexity,
            'totalCompleted': goal_list.completed_by_users.count(),
        }
        related_lists_data.append(list_data)
    
    response_data = {
        'goal': {
            **serializer.data,
            'done': done,
            'added': added,
            'totalAdded': total_added,
            'totalCompleted': total_completed,
            'listsCount': len(related_lists),
            'lists': related_lists_data,
            'shortDescription': goal.short_description,
        }
    }
    return Response(response_data)

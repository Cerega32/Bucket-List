from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from .models import GoalList
from rest_framework import status
from .serializers import GoalListShortSerializer, CategorySerializer, GoalListSerializer
from goals.serializers import GoalSerializer

@api_view(['GET'])
def get_goal_list_details(request, code):
    try:
        goal_list = GoalList.objects.get(code=code)
    except GoalList.DoesNotExist:
        return Response({'error': 'Список целей не найден'}, status=status.HTTP_404_NOT_FOUND)
   
    serializer = GoalListSerializer(goal_list, context={'request': request})

    goals_data = []
    for goal in goal_list.goals.all():
        serializer_goal = GoalSerializer(goal, context={'request': request})
        goals_data.append(serializer_goal.data)
    
    response_data = {
        'list': {
            **serializer.data,
            'goals': goals_data,
        },
    }
    
    return Response(response_data)

# @api_view(['GET'])
# # @permission_classes([AllowAny])
# def get_goal_list_details(request, code):
#     try:
#         goal_list = GoalList.objects.get(code=code)
#     except GoalList.DoesNotExist:
#         return Response({'error': 'Список целей не найден'}, status=status.HTTP_404_NOT_FOUND)
    
#     user = request.user
    
#     # Проверяем, добавил ли пользователь данный список к себе
#     # added_by_user = goal_list.added_by_users.filter(id=user.id).exists()
    
#     # # Сериализация полей category и subcategory
#     category_serializer = CategorySerializer(goal_list.category)
#     subcategory_serializer = CategorySerializer(goal_list.subcategory) if goal_list.subcategory else None
    
#     # # Получаем количество пользователей, которые выполнили этот список целей
#     # total_completed = goal_list.completed_by_users.count()
    
#     # # Получаем количество пользователей, которые добавили этот список себе
#     # total_added = goal_list.added_by_users.count()

#     # total_completed_by_user = goal_list.completed_by_users.filter(id=user.id).count()
    
#     # # Формируем данные о списке целей пользователя
#     # goal_list_data = {
#     #     'code': goal_list.code,
#     #     'title': goal_list.title,
#     #     'category': category_serializer.data,
#     #     'subcategory': subcategory_serializer.data if subcategory_serializer else None,
#     #     'complexity': goal_list.complexity,
#     #     'image': goal_list.image.url if goal_list.image else None,
#     #     'description': goal_list.description,
#     #     'short_description': goal_list.short_description,
#     #     'total_completed': total_completed,
#     #     'total_added': total_added,
#     #     'added_by_user': added_by_user,  # Проверка, добавил ли пользователь данный список к себе
#     #     'total_completed_by_user': total_completed_by_user,
#     # }

#     serializer = GoalListSerializer(goal_list, context={'request': request})

#     # Формируем массив со всеми целями в списке
#     goals_data = []
#     for goal in goal_list.goals.all():
#         goal_data = {
#             'code': goal.code,
#             'title': goal.title,
#             'category': category_serializer.data,
#             'subcategory': subcategory_serializer.data if subcategory_serializer else None,
#             'complexity': goal.complexity,
#             'image': goal.image.url if goal.image else None,
#             'description': goal.description,
#             'short_description': goal.short_description,
#             'completed_by_user': goal.completed_by_users.filter(id=user.id).exists(),
#             'added_by_user': goal.added_by_users.filter(id=user.id).exists(),
#             'total_completed': goal.completed_by_users.count(),  # Получаем количество пользователей, выполнивших цель
#             'total_added': goal.added_by_users.count(),  # Получаем количество пользователей, добавивших цель
#         }
#         goals_data.append(goal_data)
    
#     response_data = {
#         'list': {
#             **serializer.data,
#             'goals': goals_data,
#         },
#     }
    
#     return Response(response_data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def add_goal_list(request, code):
    try:
        goal_list = GoalList.objects.get(code=code)
    except GoalList.DoesNotExist:
        return Response({'error': 'Список целей не найден'}, status=status.HTTP_404_NOT_FOUND)

    user = request.user

    # Проверьте, добавлен ли список пользователем.
    if user in goal_list.added_by_users.all():
        return Response({'error': 'Список целей у вас уже добавлен'}, status=status.HTTP_400_BAD_REQUEST)

    # Добавляем пользователя к списку "added_by_users"
    goal_list.added_by_users.add(user)

    # Обновляем все цели в списке для пользователя
    for goal in goal_list.goals.all():
        goal.added_by_users.add(user)
        goal.added_from_list = True  # Устанавливаем флаг added_from_list для цели
        goal.save()

    # Сериализация обновленного списка целей
    serializer = GoalListShortSerializer(goal_list, context={'request': request})

    return Response(serializer.data, status=status.HTTP_200_OK)

@api_view(['POST'])
def remove_goal_list(request, code):
    try:
        # Найдите цель по 'code' в URL.
        goal_list = GoalList.objects.get(code=code)
    except GoalList.DoesNotExist:
        return Response({'error': 'Список целей не найден'}, status=status.HTTP_404_NOT_FOUND)

    user = request.user  # Получите текущего пользователя.

    # Проверьте, добавлена ли цель пользователю.
    if user not in goal_list.added_by_users.all():
        return Response({'error': 'Список целей не добавлен у вас'}, status=status.HTTP_400_BAD_REQUEST)

    # Удалите цель у пользователя.
    goal_list.added_by_users.remove(user)
    if user in goal_list.completed_by_users.all():
        goal_list.completed_by_users.remove(user)

    serializer = GoalListShortSerializer(goal_list, context={'request': request})
    return Response(serializer.data, status=status.HTTP_200_OK)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_goals_as_completed(request, code):
    try:
        goal_list = GoalList.objects.get(code=code)
    except GoalList.DoesNotExist:
        return Response({'error': 'Список целей не найден'}, status=status.HTTP_404_NOT_FOUND)

    user = request.user

    # Проверьте, добавлен ли список пользователем.
    if user not in goal_list.added_by_users.all():
        return Response({'error': 'Список целей не добавлен у вас'}, status=status.HTTP_400_BAD_REQUEST)

    # Пометить все цели в списке как выполненные для пользователя.
    for goal in goal_list.goals.all():
        goal.completed_by_users.add(user)

    # Обновить информацию о пользователях, которые выполнили цели.
    goal_list.refresh_from_db()

    # Проверим, все ли цели в списке выполнены.
    all_goals_completed = all(goal.completed_by_users.filter(id=user.id).exists() for goal in goal_list.goals.all())

    # Если все цели выполнены, отметить список как выполненный.
    if all_goals_completed:
        goal_list.completed_by_users.add(user)
    else:
        # Проверим, были ли все цели в списке выполнены до этого.
        all_goals_previously_completed = goal_list.completed_by_users.filter(id=user.id).exists()

        # Если были выполнены ранее и только что стали не выполненными, удалите отметку.
        if all_goals_previously_completed:
            goal_list.completed_by_users.remove(user)

    # Сериализация обновленного списка целей.
    serializer = GoalListShortSerializer(goal_list, context={'request': request})

    return Response(serializer.data, status=status.HTTP_200_OK)
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from .models import Goal
from .serializers import GoalSerializer
from rest_framework import status
from django.core.paginator import Paginator, EmptyPage, PageNotAnInteger
from goal_lists.serializers import GoalListShortSerializer
from goal_lists.models import GoalList
from comments.models import Comment

@api_view(['GET'])
def get_goal_by_code(request, code):
    try:
        goal = Goal.objects.get(code=code)
    except Goal.DoesNotExist:
        return Response({'error': 'Goal not found'}, status=status.HTTP_404_NOT_FOUND)

    total_comments = Comment.objects.filter(goal=goal).count()
    total_lists = GoalList.objects.filter(goals=goal).count()
    
    serializer = GoalSerializer(goal, context={'request': request})
        
    response_data = {
        'goal': {
            **serializer.data,
            'shortDescription': goal.short_description,
            'total_comments': total_comments,
            'total_lists': total_lists,
        }
    }
    return Response(response_data)


@api_view(['POST'])
def add_goal_to_user(request, code):
    try:
        # Найдите цель по 'code' в URL.
        goal = Goal.objects.get(code=code)
    except Goal.DoesNotExist:
        return Response({'error': 'Цель не найдена'}, status=status.HTTP_404_NOT_FOUND)

    user = request.user  # Получите текущего пользователя.

    # Проверьте, добавлена ли цель пользователю.
    if user in goal.added_by_users.all():
        return Response({'error': 'Цель уже у вас уже добавлена'}, status=status.HTTP_400_BAD_REQUEST)

    # Добавьте цель к пользователю и установите флаг added_from_list.
    goal.added_by_users.add(user)
    goal.added_from_list = True
    goal.save()

    serializer = GoalSerializer(goal, context={'request': request})
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['POST'])
def remove_goal_from_user(request, code):
    try:
        # Найдите цель по 'code' в URL.
        goal = Goal.objects.get(code=code)
    except Goal.DoesNotExist:
        return Response({'error': 'Цель не найдена'}, status=status.HTTP_404_NOT_FOUND)

    user = request.user  # Получите текущего пользователя.

    # Проверьте, добавлена ли цель пользователю.
    if user not in goal.added_by_users.all():
        return Response({'error': 'Цель не добавлена у вас'}, status=status.HTTP_400_BAD_REQUEST)

    # Удалите цель у пользователя.
    goal.added_by_users.remove(user)
    if user in goal.completed_by_users.all():
        goal.completed_by_users.remove(user)

    serializer = GoalSerializer(goal, context={'request': request})
    return Response(serializer.data, status=status.HTTP_200_OK)


# @api_view(['POST'])
# def mark_goal(request, code):
#     try:
#         # Найдите цель по 'code' в URL.
#         goal = Goal.objects.get(code=code)
#     except Goal.DoesNotExist:
#         return Response({'error': 'Цель не найдена'}, status=status.HTTP_404_NOT_FOUND)

#     user = request.user  # Получите текущего пользователя.

#     # Проверьте, добавлена ли цель пользователю.
#     if user not in goal.added_by_users.all():
#         return Response({'error': 'Цель не добавлена у вас'}, status=status.HTTP_400_BAD_REQUEST)

#     if 'done' in request.data:
#         done = request.data['done']

#         if done:
#             # Пометьте цель как выполненную.
#             goal.completed_by_users.add(user)
#         else:
#             # Снимите отметку о выполнении цели.
#             goal.completed_by_users.remove(user)

#         serializer = GoalSerializer(goal)
#         return Response(serializer.data, status=status.HTTP_200_OK)
#     else:
#         return Response({'error': 'Не указан флаг "done" в данных запроса'}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
def mark_goal(request, code):
    try:
        # Найдите цель по 'code' в URL.
        goal = Goal.objects.get(code=code)
    except Goal.DoesNotExist:
        return Response({'error': 'Цель не найдена'}, status=status.HTTP_404_NOT_FOUND)

    user = request.user  # Получите текущего пользователя.

    # Проверьте, добавлена ли цель пользователю.
    if user not in goal.added_by_users.all():
        return Response({'error': 'Цель не добавлена у вас'}, status=status.HTTP_400_BAD_REQUEST)

    if 'done' in request.data:
        done = request.data['done']

        # Проверьте, была ли цель выполнена ранее.
        goal_previously_completed = goal.completed_by_users.filter(id=user.id).exists()

        if done:
            # Пометьте цель как выполненную.
            goal.completed_by_users.add(user)
        else:
            # Снимите отметку о выполнении цели.
            goal.completed_by_users.remove(user)

        # Обновите информацию о пользователях, которые выполнили цель.
        goal.refresh_from_db()

        for goal_list in goal.goal_lists.all():
            # Подсчитайте количество выполненных целей в списке.
            completed_goals_count = goal_list.goals.filter(completed_by_users=user).count()
            
            # Если количество выполненных целей равно общему числу целей в списке, то все цели выполнены.
            if completed_goals_count == goal_list.goals.count():
                # Отметить список как выполненный для пользователя.
                goal_list.completed_by_users.add(user)
            else:
                # Если не все цели выполнены, удалите отметку о выполнении списка.
                goal_list.completed_by_users.remove(user)

        serializer = GoalSerializer(goal, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)
    else:
        return Response({'error': 'Не указан флаг "done" в данных запроса'}, status=status.HTTP_400_BAD_REQUEST)

# @api_view(['POST'])
# def mark_goal(request, code):
#     try:
#         # Найдите цель по 'code' в URL.
#         goal = Goal.objects.get(code=code)
#     except Goal.DoesNotExist:
#         return Response({'error': 'Цель не найдена'}, status=status.HTTP_404_NOT_FOUND)

#     user = request.user  # Получите текущего пользователя.

#     # Проверьте, добавлена ли цель пользователю.
#     if user not in goal.added_by_users.all():
#         return Response({'error': 'Цель не добавлена у вас'}, status=status.HTTP_400_BAD_REQUEST)

#     if 'done' in request.data:
#         done = request.data['done']

#         # Проверьте, была ли цель выполнена ранее.
#         goal_previously_completed = goal.completed_by_users.filter(id=user.id).exists()

#         if done:
#             # Пометьте цель как выполненную.
#             goal.completed_by_users.add(user)
#         else:
#             # Снимите отметку о выполнении цели.
#             goal.completed_by_users.remove(user)

#         # Обновите информацию о пользователях, которые выполнили цель.
#         goal.refresh_from_db()

#         serializer = GoalSerializer(goal)
#         return Response(serializer.data, status=status.HTTP_200_OK)
#     else:
#         return Response({'error': 'Не указан флаг "done" в данных запроса'}, status=status.HTTP_400_BAD_REQUEST)

   
#         # Проверьте, все ли цели в списке выполнены.
#         all_goals_completed = goal.goal_lists.filter(added_by_users=user).count() == goal.goal_lists.count()

#         # Если все цели выполнены, отметить список как выполненный.
#         for goal_list in goal.goal_lists.all():
#             if all_goals_completed:
#                 goal_list.completed_by_users.add(user)
#             else:
#                 # Если не все цели выполнены и цель не была выполнена ранее, удалите отметку о выполнении списка.
#                 goal_list.completed_by_users.remove(user)
 

@api_view(['GET'])
def lists_containing_goal(request, code):
    try:
        goal_lists = GoalList.objects.filter(goals__code=code)
    except GoalList.DoesNotExist:
        return Response({'message': 'Списки не найдены'}, status=status.HTTP_404_NOT_FOUND)

    # Реализация пагинации
    page = request.query_params.get('page', 1)
    paginator = Paginator(goal_lists, 2)  # 12 элементов на странице
    try:
        goal_lists_page = paginator.page(page)
    except PageNotAnInteger:
        goal_lists_page = paginator.page(1)
    except EmptyPage:
        goal_lists_page = paginator.page(paginator.num_pages)

    serializer = GoalListShortSerializer(goal_lists_page, many=True, context={'request': request})
    
    # Дополнительная информация о пагинации
    pagination_info = {
        'page': goal_lists_page.number,
        'items_per_page': goal_lists_page.paginator.per_page,
        'total_pages': goal_lists_page.paginator.num_pages,
        'total_items': paginator.count,
    }

    # Объединение данных и информации о пагинации в ответе
    response_data = {
        'data': serializer.data,
        'pagination': pagination_info,
    }
    
    return Response(response_data)
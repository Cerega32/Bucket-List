from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from .models import GoalList
from users.models import CustomUser
from rest_framework import status
from .serializers import GoalListShortSerializer, CategorySerializer, GoalListSerializer
from goals.serializers import GoalSerializer
from django.utils import timezone
from datetime import timedelta
from django.shortcuts import get_object_or_404
from django.db.models import F, Q, Max, Count
from django.core.paginator import Paginator, EmptyPage, PageNotAnInteger
from functools import reduce
import operator


@api_view(["GET"])
def get_goal_list_details(request, code):
    try:
        goal_list = GoalList.objects.get(code=code)
    except GoalList.DoesNotExist:
        return Response(
            {"error": "Список целей не найден"}, status=status.HTTP_404_NOT_FOUND
        )

    serializer = GoalListSerializer(goal_list, context={"request": request})

    goals_data = []
    for goal in goal_list.goals.all():
        serializer_goal = GoalSerializer(goal, context={"user": request.user})
        goals_data.append(serializer_goal.data)

    response_data = {
        "list": {
            **serializer.data,
            "goals": goals_data,
        },
    }

    return Response(response_data)


@api_view(["GET"])
def get_user_goal_list_details(request):
    try:
        goal_list = GoalList.objects.get(code="100-goals")
    except GoalList.DoesNotExist:
        return Response(
            {"error": "Список целей не найден"}, status=status.HTTP_404_NOT_FOUND
        )

    user_id = request.query_params.get("user_id", None)
    # Проверяем наличие user_id в параметрах запроса
    if user_id:
        user = get_object_or_404(CustomUser, id=user_id)
    elif request.user.is_authenticated:
        # Если user_id не предоставлен в параметрах, проверяем куки
        user = request.user
    else:
        user = None

    # Получаем все цели в списке
    goals_in_list = goal_list.goals.all()

    # Получаем цели легкой, средней и тяжелой сложности
    easy_goals = goals_in_list.filter(complexity="easy")
    medium_goals = goals_in_list.filter(complexity="medium")
    hard_goals = goals_in_list.filter(complexity="hard")

    # Получаем цели, которые пользователь выполнил
    user_completed_easy_goals = easy_goals.filter(completed_by_users=user)
    user_completed_medium_goals = medium_goals.filter(completed_by_users=user)
    user_completed_hard_goals = hard_goals.filter(completed_by_users=user)

    # Получаем количество выполненных целей
    count_user_completed_easy_goals = user_completed_easy_goals.count()
    count_user_completed_medium_goals = user_completed_medium_goals.count()
    count_user_completed_hard_goals = user_completed_hard_goals.count()

    # Сериализуем данные
    easy_goals_data = GoalSerializer(easy_goals, many=True, context={"user": user}).data
    medium_goals_data = GoalSerializer(
        medium_goals, many=True, context={"user": user}
    ).data
    hard_goals_data = GoalSerializer(hard_goals, many=True, context={"user": user}).data

    response_data = {
        "easy_goals": {
            "data": easy_goals_data,
            "count_completed": count_user_completed_easy_goals,
        },
        "medium_goals": {
            "data": medium_goals_data,
            "count_completed": count_user_completed_medium_goals,
        },
        "hard_goals": {
            "data": hard_goals_data,
            "count_completed": count_user_completed_hard_goals,
        },
    }

    return Response(response_data, status=status.HTTP_200_OK)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def add_goal_list(request, code):
    try:
        goal_list = GoalList.objects.get(code=code)
    except GoalList.DoesNotExist:
        return Response(
            {"error": "Список целей не найден"}, status=status.HTTP_404_NOT_FOUND
        )

    user = request.user

    # Проверьте, добавлен ли список пользователем.
    if user in goal_list.added_by_users.all():
        return Response(
            {"error": "Список целей у вас уже добавлен"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Добавляем пользователя к списку "added_by_users"
    goal_list.added_by_users.add(user)

    # Обновляем все цели в списке для пользователя
    for goal in goal_list.goals.all():
        goal.added_by_users.add(user)
        goal.added_from_list = True  # Устанавливаем флаг added_from_list для цели
        goal.save()

    # Сериализация обновленного списка целей
    serializer = GoalListShortSerializer(goal_list, context={"request": request})

    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(["POST"])
def remove_goal_list(request, code):
    try:
        # Найдите цель по 'code' в URL.
        goal_list = GoalList.objects.get(code=code)
    except GoalList.DoesNotExist:
        return Response(
            {"error": "Список целей не найден"}, status=status.HTTP_404_NOT_FOUND
        )

    user = request.user  # Получите текущего пользователя.

    # Проверьте, добавлена ли цель пользователю.
    if user not in goal_list.added_by_users.all():
        return Response(
            {"error": "Список целей не добавлен у вас"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Удалите цель у пользователя.
    goal_list.added_by_users.remove(user)
    if user in goal_list.completed_by_users.all():
        goal_list.completed_by_users.remove(user)

    serializer = GoalListShortSerializer(goal_list, context={"request": request})
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def mark_goals_as_completed(request, code):
    try:
        goal_list = GoalList.objects.get(code=code)
    except GoalList.DoesNotExist:
        return Response(
            {"error": "Список целей не найден"}, status=status.HTTP_404_NOT_FOUND
        )

    user = request.user

    # Проверьте, добавлен ли список пользователем.
    if user not in goal_list.added_by_users.all():
        return Response(
            {"error": "Список целей не добавлен у вас"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Пометить все цели в списке как выполненные для пользователя.
    for goal in goal_list.goals.all():
        goal.completed_by_users.add(user)

    # Обновить информацию о пользователях, которые выполнили цели.
    goal_list.refresh_from_db()

    # Проверим, все ли цели в списке выполнены.
    all_goals_completed = all(
        goal.completed_by_users.filter(id=user.id).exists()
        for goal in goal_list.goals.all()
    )

    # Если все цели выполнены, отметить список как выполненный.
    if all_goals_completed:
        goal_list.completed_by_users.add(user)
    else:
        # Проверим, были ли все цели в списке выполнены до этого.
        all_goals_previously_completed = goal_list.completed_by_users.filter(
            id=user.id
        ).exists()

        # Если были выполнены ранее и только что стали не выполненными, удалите отметку.
        if all_goals_previously_completed:
            goal_list.completed_by_users.remove(user)

    # Сериализация обновленного списка целей.
    serializer = GoalListShortSerializer(goal_list, context={"request": request})

    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(["GET"])
def popular_goal_lists(request, code):
    # Рассчитываем начальную и конечную дату для периода недели
    end_date = timezone.now()
    start_date = end_date - timedelta(days=7)

    # Получаем списки целей, добавленные в течение последней недели
    lists_added_last_week = GoalList.objects.filter(
        added_by_users__date_joined__range=[start_date, end_date], code=code
    )

    # Обновляем поле total_added для каждого списка целей
    for goal_list in lists_added_last_week:
        goal_list.total_added = goal_list.added_by_users.count()
        goal_list.save()

    # Получаем популярные списки целей за неделю
    popular_goal_lists = GoalList.objects.filter(
        Q(added_by_users__date_joined__range=[start_date, end_date])
        | Q(completed_by_users__date_joined__range=[start_date, end_date]),
        category__name_en=code,
    ).order_by("-added_by_users")[:4]

    # Если popular_goal_lists меньше 4, дополним их последними созданными списками целей
    if popular_goal_lists.count() < 4:
        # Получаем списки целей, не входящие в популярные списки целей, отсортированные по дате создания
        latest_goal_lists = (
            GoalList.objects.filter(category__name_en=code)
            .exclude(id__in=popular_goal_lists.values_list("id", flat=True))
            .order_by("-id")
            .distinct()[: 4 - popular_goal_lists.count()]
        )
        popular_goal_lists = list(popular_goal_lists) + list(latest_goal_lists)

    # Используйте ваш сериализатор для сериализации данных
    serializer = GoalListShortSerializer(
        popular_goal_lists, many=True, context={"request": request}
    )

    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(["GET"])
def goal_lists_by_category(request, code):
    if code.lower() == "all":
        # Если code не предоставлен, получаем все цели без фильтрации по категории
        goal_lists = GoalList.objects.all()
    else:
        # Разделяем коды категорий, если передано несколько через запятую
        categories = code.split(",")
        # Фильтруем цели по категориям
        goal_lists = GoalList.objects.filter(
            reduce(
                operator.or_,
                (
                    Q(category__name_en=cat) | Q(subcategory__name_en=cat)
                    for cat in categories
                ),
            )
        )

    user_id = request.query_params.get("user_id", None)
    completed = request.query_params.get("completed", None)

    # Получаем параметры сортировки из параметров запроса
    sort_by = request.query_params.get("sort_by", "-created_at")
    page_number = request.query_params.get("page", 1)
    items_per_page = request.query_params.get("items_per_page", 1)

    # Получаем параметры для поиска
    search_query = request.query_params.get("search", "")

    # Используем агрегацию для подсчета количества пользователей для каждой цели
    goal_lists = goal_lists.annotate(
        added_by_users_count=Count("added_by_users"),
        completed_by_users_count=Count("completed_by_users"),
    )

    # Добавляем фильтр для поиска по полю title
    if search_query:
        goal_lists = goal_lists.filter(Q(title__icontains=search_query))

    # Добавляем фильтр по id пользователя
    if user_id:
        goal_lists = goal_lists.filter(added_by_users__id=user_id)

        # Добавляем фильтр по выполненным/не выполненным целям
    if completed is not None:
        if completed.lower() == "true":
            goal_lists = goal_lists.filter(completed_by_users_count__gt=0)
        elif completed.lower() == "false":
            goal_lists = goal_lists.filter(completed_by_users_count=0)

    # Выбираем поле сортировки в зависимости от параметра sort_by
    if sort_by == "-added_by_users":
        goal_lists = goal_lists.order_by("-added_by_users_count")
    elif sort_by == "-completed_by_users":
        goal_lists = goal_lists.order_by("-completed_by_users_count")
    else:
        goal_lists = goal_lists.order_by(sort_by)
    print(goal_lists, sort_by)

    # Реализация пагинации
    paginator = Paginator(goal_lists, items_per_page)

    try:
        goals_page = paginator.page(page_number)
    except PageNotAnInteger:
        # Если номер страницы не целое число, отдаем первую страницу
        goals_page = paginator.page(1)
    except EmptyPage:
        # Если номер страницы вне диапазона, отдаем последнюю страницу
        goals_page = paginator.page(paginator.num_pages)

    # Используйте ваш сериализатор для сериализации данных
    serializer = GoalListSerializer(goals_page, many=True, context={"request": request})

    # Дополнительная информация о пагинации
    pagination_info = {
        "page": goals_page.number,
        "items_per_page": goals_page.paginator.per_page,
        "total_pages": goals_page.paginator.num_pages,
        "total_items": paginator.count,
    }

    # Объединение данных и информации о пагинации в ответе
    response_data = {
        "data": serializer.data,
        "pagination": pagination_info,
    }

    return Response(response_data, status=status.HTTP_200_OK)

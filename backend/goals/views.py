from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.db.models import F, Q, Max, Count
from .models import Goal
from .serializers import GoalSerializer
from rest_framework import status
from django.core.paginator import Paginator, EmptyPage, PageNotAnInteger
from goal_lists.serializers import GoalListShortSerializer
from goal_lists.models import GoalList
from achievements.utils import check_achievements
from comments.models import Comment
from django.utils import timezone
from datetime import timedelta
from functools import reduce
import operator


@api_view(["GET"])
def get_goal_by_code(request, code):
    try:
        goal = Goal.objects.get(code=code)
    except Goal.DoesNotExist:
        return Response({"error": "Goal not found"}, status=status.HTTP_404_NOT_FOUND)

    total_comments = Comment.objects.filter(goal=goal).count()
    total_lists = GoalList.objects.filter(goals=goal).count()

    serializer = GoalSerializer(goal, context={"request": request})

    response_data = {
        "goal": {
            **serializer.data,
            "shortDescription": goal.short_description,
            "total_comments": total_comments,
            "total_lists": total_lists,
        }
    }
    return Response(response_data)


@api_view(["POST"])
def add_goal_to_user(request, code):
    try:
        # Найдите цель по 'code' в URL.
        goal = Goal.objects.get(code=code)
    except Goal.DoesNotExist:
        return Response({"error": "Цель не найдена"}, status=status.HTTP_404_NOT_FOUND)

    user = request.user  # Получите текущего пользователя.

    # Проверьте, добавлена ли цель пользователю.
    if user in goal.added_by_users.all():
        return Response(
            {"error": "Цель уже у вас уже добавлена"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Добавьте цель к пользователю и установите флаг added_from_list.
    goal.added_by_users.add(user)
    goal.added_from_list = True
    goal.save()

    serializer = GoalSerializer(goal, context={"request": request})
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(["POST"])
def remove_goal_from_user(request, code):
    try:
        # Найдите цель по 'code' в URL.
        goal = Goal.objects.get(code=code)
    except Goal.DoesNotExist:
        return Response({"error": "Цель не найдена"}, status=status.HTTP_404_NOT_FOUND)

    user = request.user  # Получите текущего пользователя.

    # Проверьте, добавлена ли цель пользователю.
    if user not in goal.added_by_users.all():
        return Response(
            {"error": "Цель не добавлена у вас"}, status=status.HTTP_400_BAD_REQUEST
        )

    # Удалите цель у пользователя.
    goal.added_by_users.remove(user)
    if user in goal.completed_by_users.all():
        goal.completed_by_users.remove(user)

    serializer = GoalSerializer(goal, context={"request": request})
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(["POST"])
def mark_goal(request, code):
    try:
        # Найдите цель по 'code' в URL.
        goal = Goal.objects.get(code=code)
    except Goal.DoesNotExist:
        return Response({"error": "Цель не найдена"}, status=status.HTTP_404_NOT_FOUND)

    user = request.user  # Получите текущего пользователя.

    # Проверьте, добавлена ли цель пользователю.
    if user not in goal.added_by_users.all():
        return Response(
            {"error": "Цель не добавлена у вас"}, status=status.HTTP_400_BAD_REQUEST
        )

    if "done" in request.data:
        done = request.data["done"]

        # Проверьте, была ли цель выполнена ранее.
        goal_previously_completed = goal.completed_by_users.filter(id=user.id).exists()

        if done:
            # Пометьте цель как выполненную.
            goal.completed_by_users.add(user)
            check = check_achievements(user)
            print(check)
        else:
            # Снимите отметку о выполнении цели.
            goal.completed_by_users.remove(user)

        # Обновите информацию о пользователях, которые выполнили цель.
        goal.refresh_from_db()

        for goal_list in goal.goallist_set.all():
            # Подсчитайте количество выполненных целей в списке.
            completed_goals_count = goal_list.goals.filter(
                completed_by_users=user
            ).count()

            # Если количество выполненных целей равно общему числу целей в списке, то все цели выполнены.
            if completed_goals_count == goal_list.goals.count():
                # Отметить список как выполненный для пользователя.
                goal_list.completed_by_users.add(user)
            else:
                # Если не все цели выполнены, удалите отметку о выполнении списка.
                goal_list.completed_by_users.remove(user)

        serializer = GoalSerializer(goal, context={"request": request})
        return Response(serializer.data, status=status.HTTP_200_OK)
    else:
        return Response(
            {"error": 'Не указан флаг "done" в данных запроса'},
            status=status.HTTP_400_BAD_REQUEST,
        )


@api_view(["GET"])
def lists_containing_goal(request, code):
    try:
        goal_lists = GoalList.objects.filter(goals__code=code)
    except GoalList.DoesNotExist:
        return Response(
            {"message": "Списки не найдены"}, status=status.HTTP_404_NOT_FOUND
        )

    # Реализация пагинации
    page = request.query_params.get("page", 1)
    paginator = Paginator(goal_lists, 2)  # 12 элементов на странице
    try:
        goal_lists_page = paginator.page(page)
    except PageNotAnInteger:
        goal_lists_page = paginator.page(1)
    except EmptyPage:
        goal_lists_page = paginator.page(paginator.num_pages)

    serializer = GoalListShortSerializer(
        goal_lists_page, many=True, context={"request": request}
    )

    # Дополнительная информация о пагинации
    pagination_info = {
        "page": goal_lists_page.number,
        "items_per_page": goal_lists_page.paginator.per_page,
        "total_pages": goal_lists_page.paginator.num_pages,
        "total_items": paginator.count,
    }

    # Объединение данных и информации о пагинации в ответе
    response_data = {
        "data": serializer.data,
        "pagination": pagination_info,
    }

    return Response(response_data)


@api_view(["GET"])
def popular_goals(request, code):
    # Рассчитываем начальную и конечную дату для периода недели
    end_date = timezone.now()
    start_date = end_date - timedelta(days=7)

    goals_added_last_week = Goal.objects.filter(
        Q(category__name_en=code) | Q(subcategory__name_en=code),
        added_by_users__date_joined__range=[start_date, end_date],
    )

    # Обновляем поле total_added для каждой цели
    for goal in goals_added_last_week:
        goal.total_added = goal.added_by_users.count()
        goal.save()

    # Получаем популярные цели за неделю
    popular_goals = (
        Goal.objects.filter(
            Q(added_by_users__date_joined__range=[start_date, end_date])
            | Q(completed_by_users__date_joined__range=[start_date, end_date]),
            Q(subcategory__name_en=code) | Q(category__name_en=code),
        )
        .order_by("-added_by_users", "category__name_en")
        .distinct()[:4]
    )

    # Если popular_goals меньше 4, дополним их последними созданными целями
    if popular_goals.count() < 4:
        # Получаем цели, не входящие в популярные цели, отсортированные по дате создания
        latest_goals = (
            Goal.objects.filter(
                Q(subcategory__name_en=code) | Q(category__name_en=code),
            )
            .exclude(id__in=popular_goals.values_list("id", flat=True))
            .order_by("-id")
            .distinct()[: 4 - popular_goals.count()]
        )
        popular_goals = list(popular_goals) + list(latest_goals)

    # Используйте ваш сериализатор для сериализации данных
    serializer = GoalSerializer(popular_goals, many=True, context={"request": request})

    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(["GET"])
def goals_by_category(request, code):
    # Проверяем, если code = "all", то получаем все цели без фильтрации по категории
    if code.lower() == "all":
        # Если code не предоставлен, получаем все цели без фильтрации по категории
        goals = Goal.objects.all()
    else:
        # Разделяем коды категорий, если передано несколько через запятую
        categories = code.split(",")
        # Фильтруем цели по категориям
        goals = Goal.objects.filter(
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
    items_per_page = request.query_params.get("items_per_page", 16)

    # Получаем параметры для поиска
    search_query = request.query_params.get("search", "")

    # Используем агрегацию для подсчета количества пользователей для каждой цели
    goals = goals.annotate(
        added_by_users_count=Count("added_by_users"),
        completed_by_users_count=Count("completed_by_users"),
    )

    # Добавляем фильтр для поиска по полю title
    if search_query:
        goals = goals.filter(Q(title__icontains=search_query))

    # Добавляем фильтр по id пользователя
    if user_id:
        goals = goals.filter(added_by_users__id=user_id)

    # Добавляем фильтр по выполненным/не выполненным целям
    if completed is not None:
        if completed.lower() == "true":
            goals = goals.filter(completed_by_users_count__gt=0)
        elif completed.lower() == "false":
            goals = goals.filter(completed_by_users_count=0)

    # Выбираем поле сортировки в зависимости от параметра sort_by
    if sort_by == "-added_by_users":
        goals = goals.order_by("-added_by_users_count")
    elif sort_by == "-completed_by_users":
        goals = goals.order_by("-completed_by_users_count")
    else:
        goals = goals.order_by(sort_by)

    # Реализация пагинации
    paginator = Paginator(goals, items_per_page)

    try:
        goals_page = paginator.page(page_number)
    except PageNotAnInteger:
        # Если номер страницы не целое число, отдаем первую страницу
        goals_page = paginator.page(1)
    except EmptyPage:
        # Если номер страницы вне диапазона, отдаем последнюю страницу
        goals_page = paginator.page(paginator.num_pages)

    # Используйте ваш сериализатор для сериализации данных
    serializer = GoalSerializer(goals_page, many=True, context={"request": request})

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

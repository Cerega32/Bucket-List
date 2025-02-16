# views.py
from .models import CustomUser
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .serializers import (
    UserRegistrationSerializer,
    UserLoginSerializer,
    CustomUserSerializer,
)
from django.http import JsonResponse
from rest_framework.authtoken.models import Token
from django.contrib.auth import authenticate
from django.utils.encoding import smart_text
from goals.models import Goal
from goal_lists.models import GoalList
from categories.serializers import CategorySerializer
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
from django.contrib.auth.hashers import make_password
from django.utils import timezone
from datetime import timedelta
from django.db.models import (
    Sum,
    F,
    Count,
    Q,
    When,
    Value,
    IntegerField,
    Case,
    BooleanField,
)
from users.experience import EXPERIENCE_REWARDS


@api_view(["PUT"])
@permission_classes([IsAuthenticated])
def change_password(request):
    user = request.user
    data = request.data

    # Проверяем, если в запросе присутствуют новый и текущий пароли
    if "old_password" not in data or "new_password" not in data:
        return Response(
            {"error": "Требуется предоставить текущий и новый пароли."}, status=400
        )

    # Проверяем, соответствует ли текущий пароль пользователю
    if not user.check_password(data["old_password"]):
        return Response({"error": "Текущий пароль введен неправильно."}, status=400)

    # Устанавливаем новый пароль и сохраняем его хэш
    user.password = make_password(data["new_password"])
    user.save()

    return Response({"message": "Пароль успешно изменен."})


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def upload_avatar(request):
    if "avatar" in request.FILES:
        avatar = request.FILES["avatar"]
        user = request.user
        user.avatar = avatar
        user.save()
        response_data = {"success": True, "message": "Аватар успешно загружен"}
        response = JsonResponse(response_data)
        response.set_cookie(key="avatar", value=user.avatar.url)
        return response
    else:
        return JsonResponse(
            {"success": False, "error": "Файл аватара не был предоставлен"}, status=400
        )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def upload_cover(request):
    if "cover" in request.FILES:
        cover = request.FILES["cover"]
        user = request.user
        user.cover_image = cover
        user.save()
        response_data = {"success": True, "message": "Обложка успешно загружена"}
        response = JsonResponse(response_data)
        response.set_cookie(key="cover", value=user.cover_image.url)
        return response
    else:
        return JsonResponse(
            {"success": False, "error": "Файл обложки не был предоставлен"}, status=400
        )


@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def delete_avatar(request):
    user = request.user
    # Удаляем текущий аватар пользователя
    if user.avatar:
        # Удаляем файл из хранилища
        default_storage.delete(user.avatar.name)
        # Удаляем ссылку на аватар из модели пользователя
        user.avatar = None
        user.save()
        response_data = {"message": "Аватар успешно удален"}
        response = JsonResponse(response_data)
        response.delete_cookie("avatar")
        return response
    else:
        return Response(
            {"error": "У пользователя нет текущего аватара"},
            status=status.HTTP_400_BAD_REQUEST,
        )


@api_view(["PUT"])
@permission_classes([IsAuthenticated])
def update_user_profile(request):
    user = request.user
    data = request.data

    # Обновление данных пользователя, если они предоставлены в запросе
    if "first_name" in data:
        user.first_name = data["first_name"]
    if "last_name" in data:
        user.last_name = data["last_name"]
    if "country" in data:
        user.country = data["country"]
    if "about_me" in data:
        user.about_me = data["about_me"]

    # Сохранение изменений
    user.save()

    # Сериализация обновленного пользователя
    serializer = CustomUserSerializer(user)

    return Response(serializer.data)


@api_view(["POST"])
def login_user(request):
    serializer = UserLoginSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.validated_data["user"]
        token, created = Token.objects.get_or_create(user=user)

        response_data = {
            "name": smart_text(user.first_name.encode()),
        }

        response = JsonResponse(response_data)

        response.set_cookie(key="token", value=token.key)
        response.set_cookie(key="user-id", value=user.id)

        return response

    response_data = {"error": serializer.errors}
    return Response(response_data, status=status.HTTP_400_BAD_REQUEST)


@api_view(["POST"])
def register_user(request):
    serializer = UserRegistrationSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()

        token, created = Token.objects.get_or_create(user=user)

        response_data = {
            "name": user.first_name,
        }

        response = JsonResponse(response_data)
        response.set_cookie(key="token", value=token.key)
        response.set_cookie(key="user-id", value=user.id)

        return response

    response_data = {"error": serializer.errors}
    return JsonResponse(response_data, status=400)


# @api_view(["POST"])
# def login_user(request):
#     serializer = UserLoginSerializer(data=request.data)
#     if serializer.is_valid():
#         user = serializer.validated_data["user"]
#         token, created = Token.objects.get_or_create(user=user)

#         response_data = {
#             "name": smart_text(user.first_name.encode()),
#             # 'avatar': user.avatar if user.avatar else None,  # If you have the avatar_url field in your CustomUser model
#         }

#         response = JsonResponse(response_data)

#         response.set_cookie(key="token", value=token.key)
#         # if user.avatar_url:
#         #     response.set_cookie(key='avatar', value=user.avatar_url)

#         return response


# @api_view(["POST"])
# def register_user(request):
#     serializer = UserRegistrationSerializer(data=request.data)
#     if serializer.is_valid():
#         user = serializer.save()

#         # Создаем токен для зарегистрированного пользователя
#         token, created = Token.objects.get_or_create(user=user)

#         response_data = {
#             "name": user.first_name,
#         }

#         response = JsonResponse(response_data)
#         response.set_cookie(key="token", value=token.key)
#         # Кодируем значение 'name' с использованием UTF-8
#         # response.set_cookie(key='name', value=smart_text(user.first_name).encode('utf-8').decode('utf-8'), httponly=True)
#         if isinstance(user.first_name, bytes):
#             first_name_str = user.first_name
#         else:
#             first_name_str = user.first_name

#         response.set_cookie(
#             key="name", value=user.first_name.encode("utf-8"), httponly=True
#         )

#         return response

#     response_data = {"error": serializer.errors}
#     return JsonResponse(response_data, status=400)


@api_view(["GET"])
def get_user_info(request, code=None):
    if code:
        user = CustomUser.objects.get(id=code)
        serializer = CustomUserSerializer(user)
    else:
        user = request.user
        serializer = CustomUserSerializer(user)

    response_data = {
        **serializer.data,
        "name": user.first_name,
    }

    return Response(response_data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_user_added_goals(request):
    user = request.user
    page_number = int(request.GET.get("page", 1))
    page_size = 10

    # Базовый запрос для целей пользователя
    base_query = Goal.objects.filter(added_by_users=user).annotate(
        is_completed=Case(
            When(completed_by_users=user, then=True),
            default=False,
            output_field=BooleanField(),
        ),
        total_completed=Count("completed_by_users"),
    )

    # Фильтрация по статусу выполнения
    completed_filter = request.GET.get("completed")
    if completed_filter == "true":
        base_query = base_query.filter(completed_by_users=user)
    elif completed_filter == "false":
        base_query = base_query.exclude(completed_by_users=user)

    # Подсчет общего количества
    total_added = base_query.count()

    # Пагинация
    start_index = (page_number - 1) * page_size
    end_index = page_number * page_size
    paginated_goals = base_query[start_index:end_index]

    # Сериализация результатов
    goals_data = [
        {
            "category": CategorySerializer(goal.category).data,
            "code": goal.code,
            "complexity": goal.complexity,
            "description": goal.description,
            "image": goal.image.url if goal.image else None,
            "shortDescription": goal.short_description,
            "subcategory": (
                CategorySerializer(goal.subcategory).data if goal.subcategory else None
            ),
            "title": goal.title,
            "completedByUser": goal.is_completed,
            "totalCompleted": goal.total_completed,
        }
        for goal in paginated_goals
    ]

    return Response(
        {
            "goals": goals_data,
            "totalAdded": total_added,
        }
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_user_added_lists(request):
    user = request.user

    # Получаем все списки, которые были добавлены пользователем
    user_added_lists = GoalList.objects.filter(added_by_users=user)

    # Получение параметра фильтрации по выполненным целям (completed=true) или невыполненным (completed=false)
    completed_filter = request.GET.get("completed", None)

    # Если параметр фильтрации указан и равен 'true', фильтруем выполненные цели
    if completed_filter == "true":
        user_added_lists = user_added_lists.filter(completed_by_users=user)

    # Если параметр фильтрации указан и равен 'false', фильтруем невыполненные цели
    elif completed_filter == "false":
        user_added_lists = user_added_lists.exclude(completed_by_users=user)

    # Получение номера страницы из параметра запроса
    page_number = request.GET.get("page", 1)

    # Определите, сколько элементов на странице
    page_size = 10

    # Расчет начальной и конечной позиции элементов на странице
    start_index = (page_number - 1) * page_size
    end_index = page_number * page_size

    # Получаем списки для текущей страницы
    paginated_user_added_lists = user_added_lists[start_index:end_index]

    # Инициализируем массив списков и общее количество добавленных списков
    lists_data = []
    total_added = user_added_lists.count()

    # Сериализация результатов
    for goal_list in paginated_user_added_lists:
        list_data = {
            "title": goal_list.title,
            "category": CategorySerializer(goal_list.category).data,
            "subcategory": (
                CategorySerializer(goal_list.subcategory).data
                if goal_list.subcategory
                else None
            ),
            "complexity": goal_list.complexity,
            "image": goal_list.image.url if goal_list.image else None,
            "description": goal_list.description,
            "shortDescription": goal_list.short_description,
            "completedUsersCount": goal_list.completed_by_users.count(),
        }
        lists_data.append(list_data)

    response_data = {
        "lists": lists_data,
        "totalAdded": total_added,
    }

    return Response(response_data)


@api_view(["GET"])
def get_weekly_leaders(request):
    """
    Получает список лидеров за последнюю неделю
    """
    try:
        # Получаем количество лидеров из параметров запроса или используем значение по умолчанию
        leaders_count = int(request.GET.get("limit", 10))

        # Определяем временной период (последняя неделя)
        end_date = timezone.now()
        start_date = end_date - timedelta(days=7)

        # Получаем пользователей с их статистикой за неделю
        leaders = (
            CustomUser.objects.annotate(
                goals_completed_week=Count(
                    "completed_goals",
                    filter=Q(
                        completed_goals__completed_by_users__date_joined__range=[
                            start_date,
                            end_date,
                        ]
                    ),
                ),
                reviews_added_week=Count(
                    "comment",
                    filter=Q(comment__date_created__range=[start_date, end_date]),
                ),
                experience_earned_week=Sum(
                    Case(
                        # Опыт за выполненные цели
                        When(
                            completed_goals__completed_by_users__date_joined__range=[
                                start_date,
                                end_date,
                            ],
                            then=Value(EXPERIENCE_REWARDS["COMPLETE_GOAL"]),
                        ),
                        # Опыт за комментарии
                        When(
                            comment__date_created__range=[start_date, end_date],
                            then=Value(EXPERIENCE_REWARDS["ADD_COMMENT"]),
                        ),
                        default=Value(0),
                        output_field=IntegerField(),
                    )
                ),
            )
            .filter(
                Q(goals_completed_week__gt=0)
                | Q(reviews_added_week__gt=0)
                | Q(experience_earned_week__gt=0)
            )
            .order_by("-experience_earned_week")[:leaders_count]
        )

        # Подготавливаем данные для ответа
        leaders_data = []
        for index, user in enumerate(leaders, 1):
            leaders_data.append(
                {
                    "id": user.id,
                    "name": f"{user.first_name} {user.last_name}".strip()
                    or user.username,
                    "avatar": user.avatar.url if user.avatar else None,
                    "level": user.level,
                    "place": index,
                    "week_completed_goals": user.goals_completed_week,
                    "total_completed_goals": user.completed_goals.count(),
                    "reviews_added_week": user.reviews_added_week,
                    "experience_earned_week": user.experience_earned_week or 0,
                }
            )

        return Response(
            {"leaders": leaders_data, "period": {"start": start_date, "end": end_date}}
        )

    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

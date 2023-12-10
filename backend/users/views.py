# views.py

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .serializers import UserRegistrationSerializer, UserLoginSerializer, CustomUserSerializer
from django.http import JsonResponse
from rest_framework.authtoken.models import Token
from django.contrib.auth import authenticate
from django.utils.encoding import smart_text
from goals.models import Goal
from goal_lists.models import GoalList
from categories.serializers import CategorySerializer

@api_view(['POST'])
def login_user(request):
    serializer = UserLoginSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.validated_data['user']
        token, created = Token.objects.get_or_create(user=user)
        
        response_data = {
            'name': smart_text(user.first_name.encode()),
            # 'avatar': user.avatar if user.avatar else None,  # If you have the avatar_url field in your CustomUser model
        }
        
        response = JsonResponse(response_data)
        
        response.set_cookie(key='token', value=token.key)
        # if user.avatar_url:
        #     response.set_cookie(key='avatar', value=user.avatar_url)
        
        return response
    
    response_data = {'error': serializer.errors}
    return Response(response_data, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
def register_user(request):
    serializer = UserRegistrationSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()

        # Создаем токен для зарегистрированного пользователя
        token, created = Token.objects.get_or_create(user=user)

        response_data = {
            'name': user.first_name,
        }

        response = JsonResponse(response_data)
        response.set_cookie(key='token', value=token.key)
        # Кодируем значение 'name' с использованием UTF-8
        # response.set_cookie(key='name', value=smart_text(user.first_name).encode('utf-8').decode('utf-8'), httponly=True)
        if isinstance(user.first_name, bytes):
            first_name_str = user.first_name.decode('utf-8')
        else:
            first_name_str = user.first_name
        
        response.set_cookie(key='name', value=user.first_name.encode().decode(), httponly=True)
        
        return response

    response_data = {'error': serializer.errors}
    return JsonResponse(response_data, status=400)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_info(request):
    user = request.user
    serializer = CustomUserSerializer(user)

    response_data = {
        **serializer.data,
        'name': user.first_name,
    }

    return Response(response_data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_added_goals(request):
    user = request.user

    # Получаем все цели, которые были добавлены пользователем
    user_added_goals = Goal.objects.filter(added_by_users=user)

    # Получение параметра фильтрации по выполненным целям (completed=true) или невыполненным (completed=false)
    completed_filter = request.GET.get('completed', None)

    # Если параметр фильтрации указан и равен 'true', фильтруем выполненные цели
    if completed_filter == 'true':
        user_added_goals = user_added_goals.filter(completed_by_users=user)

    # Если параметр фильтрации указан и равен 'false', фильтруем невыполненные цели
    elif completed_filter == 'false':
        user_added_goals = user_added_goals.exclude(completed_by_users=user)


    # Получение номера страницы из параметра запроса
    page_number = request.GET.get('page', 1)

    # Определите, сколько элементов на странице
    page_size = 10

    # Расчет начальной и конечной позиции элементов на странице
    start_index = (page_number - 1) * page_size
    end_index = page_number * page_size

    # Получаем цели для текущей страницы
    paginated_user_added_goals = user_added_goals[start_index:end_index]

    # Инициализируем массив целей и общее количество добавленных целей
    goals_data = []
    total_added = user_added_goals.count()

    # Сериализация результатов
    for goal in paginated_user_added_goals:
        goal_data = {
            'category': CategorySerializer(goal.category).data,
            'code': goal.code,
            'complexity': goal.complexity,
            'description': goal.description,
            'image': goal.image.url if goal.image else None,
            'shortDescription': goal.short_description,
            'subcategory': CategorySerializer(goal.subcategory).data if goal.subcategory else None,
            'title': goal.title,
            'completedByUser': goal.completed_by_users.filter(id=user.id).exists(),
            'totalCompleted': goal.completed_by_users.count(),
        }
        goals_data.append(goal_data)

    response_data = {
        'goals': goals_data,
        'totalAdded': total_added,
    }

    return Response(response_data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_added_lists(request):
    user = request.user

    # Получаем все списки, которые были добавлены пользователем
    user_added_lists = GoalList.objects.filter(added_by_users=user)

    # Получение параметра фильтрации по выполненным целям (completed=true) или невыполненным (completed=false)
    completed_filter = request.GET.get('completed', None)

    # Если параметр фильтрации указан и равен 'true', фильтруем выполненные цели
    if completed_filter == 'true':
        user_added_lists = user_added_lists.filter(completed_by_users=user)

    # Если параметр фильтрации указан и равен 'false', фильтруем невыполненные цели
    elif completed_filter == 'false':
        user_added_lists = user_added_lists.exclude(completed_by_users=user)

    # Получение номера страницы из параметра запроса
    page_number = request.GET.get('page', 1)

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
            'title': goal_list.title,
            'category': CategorySerializer(goal_list.category).data,
            'subcategory': CategorySerializer(goal_list.subcategory).data if goal_list.subcategory else None,
            'complexity': goal_list.complexity,
            'image': goal_list.image.url if goal_list.image else None,
            'description': goal_list.description,
            'shortDescription': goal_list.short_description,
            'completedUsersCount': goal_list.completed_by_users.count(),
        }
        lists_data.append(list_data)

    response_data = {
        'lists': lists_data,
        'totalAdded': total_added,
    }

    return Response(response_data)


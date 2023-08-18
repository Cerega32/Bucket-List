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
from goals.serializers import GoalSerializer

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
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_added_goals(request):
    user = request.user

    # Получаем все цели, которые были добавлены пользователем
    user_added_goals = Goal.objects.filter(added_by_users=user)

    # Получение номера страницы из параметра запроса
    page_number = request.GET.get('page', 1)

    # Определите, сколько элементов на странице
    page_size = 10

    # Расчет начальной и конечной позиции элементов на странице
    start_index = (page_number - 1) * page_size
    end_index = page_number * page_size

    # Получаем цели для текущей страницы
    paginated_user_added_goals = user_added_goals[start_index:end_index]

    # Сериализация результатов
    serializer = GoalSerializer(paginated_user_added_goals, many=True)

    return Response(serializer.data)

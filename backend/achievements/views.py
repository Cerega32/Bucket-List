from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from .models import Achievement
from .serializers import AchievementSerializer
from users.models import CustomUser


@api_view(["GET"])
def get_achievements(request):
    user_id = request.query_params.get("user_id", None)

    if user_id:
        user = get_object_or_404(CustomUser, id=user_id)
    else:
        user = request.user  # Получите текущего пользователя.

    achievements = Achievement.objects.filter(achieved_users=user)
    serializer = AchievementSerializer(achievements, many=True)

    response_data = {
        "data": serializer.data,
    }

    return Response(response_data, status=status.HTTP_200_OK)

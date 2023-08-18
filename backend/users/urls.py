# your_app_name/urls.py

from django.urls import path
from .views import login_user, register_user, get_user_info, get_user_added_goals

urlpatterns = [
    path('api/register/', register_user, name='register'),
    path('api/login/', login_user, name='login'),
    path('api/self/', get_user_info, name='get_user_info'),
    path('api/self/added-goals/', get_user_added_goals, name='user-added-goals'),
]

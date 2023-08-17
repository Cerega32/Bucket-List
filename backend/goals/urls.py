# your_app_name/urls.py

from django.urls import path
from .views import get_goal_by_code

urlpatterns = [
    path('api/goals/<slug:code>/', get_goal_by_code, name='get-goal-by-code'),
]

# your_app_name/urls.py

from django.urls import path
from .views import get_goal_by_code, add_goal_to_user, remove_goal_from_user, mark_goal, lists_containing_goal

urlpatterns = [
    path('api/goals/<slug:code>/', get_goal_by_code, name='get-goal-by-code'),
    path('api/goals/<slug:code>/add/', add_goal_to_user, name='add-goal-to-user'),
    path('api/goals/<slug:code>/remove/', remove_goal_from_user, name='remove-goal-from-user'),
    path('api/goals/<slug:code>/mark/', mark_goal, name='mark-goal'),
    path('api/goals/<slug:code>/lists/', lists_containing_goal, name='lists_containing_goal'),
]


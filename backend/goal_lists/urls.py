from django.urls import path
from goal_lists.views import get_goal_list_details, add_goal_list

urlpatterns = [
    # Другие URL-пути
    path('api/goal-lists/<slug:code>/', get_goal_list_details, name='get-goal-list-details'),
    path('api/goal-lists/<str:code>/add/', add_goal_list, name='add_goal_list'),
]

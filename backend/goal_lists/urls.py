from django.urls import path
from goal_lists.views import get_goal_list_details

urlpatterns = [
    # Другие URL-пути
    path('api/goal-lists/<slug:code>/', get_goal_list_details, name='get-goal-list-details'),
]

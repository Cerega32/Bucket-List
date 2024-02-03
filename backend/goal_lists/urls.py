from django.urls import path
from goal_lists.views import (
    get_goal_list_details,
    add_goal_list,
    remove_goal_list,
    mark_goals_as_completed,
    popular_goal_lists,
    goal_lists_by_category,
    get_user_goal_list_details,
)

urlpatterns = [
    # Другие URL-пути
    path(
        "api/goal-lists/<slug:code>/",
        get_goal_list_details,
        name="get-goal-list-details",
    ),
    path("api/goal-lists/<str:code>/add/", add_goal_list, name="add_goal_list"),
    # path('api/goals/<slug:code>/add/', add_goal_to_user, name='add-goal-to-user'),
    path(
        "api/goal-lists/<slug:code>/remove/", remove_goal_list, name="remove_goal_list"
    ),
    path(
        "api/goal-lists/<slug:code>/mark-all/",
        mark_goals_as_completed,
        name="mark-goal",
    ),
    path(
        "api/goal-lists/<slug:code>/popular/",
        popular_goal_lists,
        name="popular_goal_lists",
    ),
    path(
        "api/goal-lists/<slug:code>/all/",
        goal_lists_by_category,
        name="goal_lists_by_category",
    ),
    path(
        "api/100-goals/",
        get_user_goal_list_details,
        name="goal_lists_by_category",
    ),
]

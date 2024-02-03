from django.urls import path
from .views import get_comments_for_goal, like_or_dislike_comment, get_comments_by_user

urlpatterns = [
    path(
        "api/goals/<slug:code>/comments/",
        get_comments_for_goal,
        name="get-comments-for-goal",
    ),
    path(
        "api/comments/<int:comment_id>/like-or-dislike/",
        like_or_dislike_comment,
        name="like-or-dislike-comment",
    ),
    path(
        "api/comments/<int:user_id>/",
        get_comments_by_user,
        name="get-comments-by-user",
    ),
]

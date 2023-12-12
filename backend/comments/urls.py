from django.urls import path
from .views import get_comments_for_goal, like_or_dislike_comment

urlpatterns = [
    path('api/goals/<slug:code>/comments/', get_comments_for_goal, name='get-comments-for-goal'),
    path('api/comments/<int:comment_id>/like-or-dislike/', like_or_dislike_comment, name='like-or-dislike-comment'),
]

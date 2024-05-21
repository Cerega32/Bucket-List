# your_app_name/urls.py

from django.urls import path
from .views import (
    login_user,
    register_user,
    get_user_info,
    get_user_added_goals,
    get_user_added_lists,
    upload_avatar,
    delete_avatar,
    update_user_profile,
    upload_cover,
    change_password,
)

urlpatterns = [
    path("api/register/", register_user, name="register"),
    path("api/login/", login_user, name="login"),
    path("api/user/", get_user_info, name="get_user_info"),
    path("api/user/<slug:code>/", get_user_info, name="get_user_info"),
    path("api/self/added-goals/", get_user_added_goals, name="user-added-goals"),
    path("api/self/added-lists/", get_user_added_lists, name="user-added-lists"),
    path("api/users/avatar/upload/", upload_avatar, name="upload_avatar"),
    path("api/users/cover/upload/", upload_cover, name="upload_cover"),
    path("api/users/avatar/delete/", delete_avatar, name="delete_avatar"),
    path("api/users/update-profile/", update_user_profile, name="update_user_profile"),
    path("api/users/change-password/", change_password, name="change_password"),
]

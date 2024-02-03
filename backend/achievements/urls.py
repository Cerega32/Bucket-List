from django.urls import path
from .views import get_achievements

urlpatterns = [
    path("api/achievements/", get_achievements, name="get_achievements"),
]

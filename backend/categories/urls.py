from django.urls import path
from .views import category_list

urlpatterns = [
    path('api/categories/', category_list),
]

from django.urls import path
from .views import category_list, category_detail

urlpatterns = [
    path("api/categories/", category_list),
    path("api/categories/<slug:code>/", category_detail),
]

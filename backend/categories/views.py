from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import Category
from .serializers import CategoryDetailedSerializer
from django.shortcuts import get_object_or_404


@api_view(["GET", "POST"])
def category_list(request):
    if request.method == "GET":
        categories = Category.objects.all().filter(parent_category=None)
        serializer = CategoryDetailedSerializer(categories, many=True)
        return Response(serializer.data)

    elif request.method == "POST":
        serializer = CategoryDetailedSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)


@api_view(["GET"])
def category_detail(request, code):
    category = get_object_or_404(Category, name_en=code)
    serializer = CategoryDetailedSerializer(category)

    # Include subcategories in the response
    subcategories = Category.objects.filter(parent_category=category)
    subcategories_serializer = CategoryDetailedSerializer(subcategories, many=True)

    response_data = {
        "category": serializer.data,
        "subcategories": subcategories_serializer.data,
    }

    return Response(response_data)

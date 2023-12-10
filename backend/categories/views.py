from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import Category
from .serializers import CategoryDetailedSerializer

@api_view(['GET', 'POST'])
def category_list(request):
    if request.method == 'GET':
        categories = Category.objects.all()
        serializer = CategoryDetailedSerializer(categories, many=True)
        return Response(serializer.data)

    elif request.method == 'POST':

        serializer = CategoryDetailedSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)
    
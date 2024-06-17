from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.db import transaction
from goals.models import Goal  # Предполагаем, что у вас есть модель Goal


from .models import Comment, CommentAction, CommentPhoto
from .serializers import (
    CommentSerializer,
    CommentScoreSerializer,
)  # Убедитесь, что импортируете CommentSerializer из правильного места.
from rest_framework import serializers

from django.db.models import Count


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def like_or_dislike_comment(request, comment_id):
    user = request.user
    try:
        comment = Comment.objects.get(id=comment_id)
    except Comment.DoesNotExist:
        return Response(
            {"message": "Комментарий не найден"}, status=status.HTTP_404_NOT_FOUND
        )

    is_like = request.data.get("is_like")

    if is_like is not None:
        if is_like:
            if user in comment.likes.all():
                # Уберем лайк, если пользователь уже поставил его
                comment.likes.remove(user)
            else:
                comment.likes.add(user)
                # Уберем дизлайк, если пользователь ранее поставил его
                comment.dislikes.remove(user)
        else:
            if user in comment.dislikes.all():
                # Уберем дизлайк, если пользователь уже поставил его
                comment.dislikes.remove(user)
            else:
                comment.dislikes.add(user)
                # Уберем лайк, если пользователь ранее поставил его
                comment.likes.remove(user)

        serializer = CommentScoreSerializer(comment, context={"request": request})

        return Response(serializer.data, status=status.HTTP_200_OK)
    else:
        return Response(
            {
                "message": "Пожалуйста, укажите, хотите ли вы поставить лайк (True) или дизлайк (False)."
            },
            status=status.HTTP_400_BAD_REQUEST,
        )


@api_view(["GET"])
def get_comments_for_goal(request, code):
    user = request.user
    user_id = None  # По умолчанию нет пользователя

    # Проверка, аутентифицирован ли пользователь
    if user.is_authenticated:
        user_id = user.id  # Получение ID пользователя

    try:
        comments = Comment.objects.filter(goal__code=code)
    except Comment.DoesNotExist:
        return Response(
            {"message": "Комментарии не найдены"}, status=status.HTTP_404_NOT_FOUND
        )

    for comment in comments:
        # Подсчет количества лайков и дизлайков для каждого комментария
        likes_count = CommentAction.objects.filter(
            comment=comment, action=CommentAction.LIKE
        ).count()
        dislikes_count = CommentAction.objects.filter(
            comment=comment, action=CommentAction.DISLIKE
        ).count()

        # Добавление количества лайков и дизлайков к экземпляру комментария
        comment.likes_count = likes_count
        comment.dislikes_count = dislikes_count

    # # Определите пользовательский сериализатор для комментариев
    # class CustomCommentSerializer(serializers.ModelSerializer):
    #     class Meta:
    #         model = Comment
    #         fields = ('id', 'user', 'avatar', 'user_name', 'user_goals_completed', 'text', 'likes_count', 'dislikes_count', 'date_created', 'photos')

    # serializer = CustomCommentSerializer(comments, many=True, context={'request': request, 'user_id': user_id})

    # Примените сортировку по количеству лайков и по дате
    sort_by_likes = request.query_params.get("sort_by_likes")
    if sort_by_likes:
        comments = comments.annotate(likes_count=Count("likes")).order_by(
            "-likes_count", "-date_created"
        )
    else:
        comments = comments.order_by("-date_created")

    # Примените пагинацию (по умолчанию 10 комментариев на страницу)
    page = request.query_params.get("page")
    if page:
        from rest_framework.pagination import PageNumberPagination

        paginator = PageNumberPagination()
        result_page = paginator.paginate_queryset(comments, request)
        serializer = CommentSerializer(
            result_page, many=True, context={"request": request}
        )

        # Дополнительная информация о пагинации
        pagination_info = {
            "page": result_page.number,
            "items_per_page": result_page.paginator.per_page,
            "total_pages": result_page.paginator.num_pages,
            "total_items": paginator.count,
        }

        # Объединение данных и информации о пагинации в ответе
        response_data = {
            "data": serializer.data,
            "pagination": pagination_info,
        }

        return paginator.get_paginated_response(response_data)

    serializer = CommentSerializer(comments, many=True, context={"request": request})

    # Проверьте флаг для включения изображений
    include_images = request.query_params.get("include_images")
    if include_images:
        # Если флаг установлен, включите изображения из комментариев с наибольшим количеством лайков
        popular_comments = comments.order_by("-likes_count")[:20]
        images = [comment.images for comment in popular_comments if comment.images]

        # Дополнительная информация о пагинации
        pagination_info = {
            "page": 1,
            "items_per_page": len(comments),
            "total_pages": 1,
            "total_items": len(comments),
        }

        # Объединение данных и информации о пагинации в ответе
        response_data = {
            "data": serializer.data,
            "popular_images": images,
            "pagination": pagination_info,
        }

        return Response(response_data)
    else:
        # Дополнительная информация о пагинации
        pagination_info = {
            "page": 1,
            "items_per_page": len(comments),
            "total_pages": 1,
            "total_items": len(comments),
        }

        # Объединение данных и информации о пагинации в ответе
        response_data = {
            "data": serializer.data,
            "pagination": pagination_info,
        }

        return Response(response_data)


@api_view(["GET"])
def get_comments_by_user(request, user_id):
    try:
        comments = Comment.objects.filter(user_id=user_id)
    except Comment.DoesNotExist:
        return Response(
            {"message": "Comments not found"}, status=status.HTTP_404_NOT_FOUND
        )

    # Count likes and dislikes for each comment
    for comment in comments:
        likes_count = CommentAction.objects.filter(
            comment=comment, action=CommentAction.LIKE
        ).count()
        dislikes_count = CommentAction.objects.filter(
            comment=comment, action=CommentAction.DISLIKE
        ).count()
        comment.likes_count = likes_count
        comment.dislikes_count = dislikes_count

    # Apply sorting by likes or date
    sort_by_likes = request.query_params.get("sort_by_likes")
    if sort_by_likes:
        comments = comments.annotate(likes_count=Count("likes")).order_by(
            "-likes_count", "-date_created"
        )
    else:
        comments = comments.order_by("-date_created")

    # Apply pagination (default is 10 comments per page)
    page = request.query_params.get("page")
    if page:
        from rest_framework.pagination import PageNumberPagination

        paginator = PageNumberPagination()
        result_page = paginator.paginate_queryset(comments, request)
        serializer = CommentSerializer(
            result_page, many=True, context={"request": request}
        )

        pagination_info = {
            "page": result_page.number,
            "items_per_page": result_page.paginator.per_page,
            "total_pages": result_page.paginator.num_pages,
            "total_items": paginator.count,
        }

        response_data = {
            "data": serializer.data,
            "pagination": pagination_info,
        }

        return paginator.get_paginated_response(response_data)

    serializer = CommentSerializer(comments, many=True, context={"request": request})

    # Check the flag to include images
    include_images = request.query_params.get("include_images")
    if include_images:
        popular_comments = comments.order_by("-likes_count")[:20]
        images = [comment.images for comment in popular_comments if comment.images]

        pagination_info = {
            "page": 1,
            "items_per_page": len(comments),
            "total_pages": 1,
            "total_items": len(comments),
        }

        response_data = {
            "data": serializer.data,
            "popular_images": images,
            "pagination": pagination_info,
        }

        return Response(response_data)
    else:
        pagination_info = {
            "page": 1,
            "items_per_page": len(comments),
            "total_pages": 1,
            "total_items": len(comments),
        }

        response_data = {
            "data": serializer.data,
            "pagination": pagination_info,
        }

        return Response(response_data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def add_comment(request):
    user = request.user
    text = request.data.get("text")
    complexity = request.data.get("complexity")
    goal_id = request.data.get("goal_id")

    if not text or not complexity or not goal_id:
        return Response(
            {"message": "Все поля (text, complexity, goal_id) обязательны."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        goal = Goal.objects.get(id=goal_id)
        with transaction.atomic():
            comment = Comment.objects.create(
                user=user, text=text, complexity=complexity, goal=goal
            )

            photos = request.FILES.getlist("photo")
            if photos:
                photo_instances = [
                    CommentPhoto(comment=comment, image=photo) for photo in photos[:10]
                ]
                CommentPhoto.objects.bulk_create(photo_instances)

            serializer = CommentSerializer(comment, context={"request": request})
            return Response(serializer.data, status=status.HTTP_201_CREATED)
    except Goal.DoesNotExist:
        return Response({"message": "Goal not found"}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response(
            {"message": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

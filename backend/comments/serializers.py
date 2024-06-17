from rest_framework import serializers
from .models import Comment, CommentAction, CommentPhoto
from users.models import CustomUser  # Импортируйте вашу кастомную модель пользователя
from categories.serializers import CategorySerializer


class CommentPhotoSerializer(serializers.ModelSerializer):
    class Meta:
        model = CommentPhoto
        fields = ("id", "image")  # Include other fields if needed


class CommentSerializer(serializers.ModelSerializer):
    user = serializers.SerializerMethodField()
    user_avatar = serializers.ImageField(source="user.avatar", read_only=True)
    user_name = serializers.CharField(source="user.first_name", read_only=True)
    user_nickname = serializers.CharField(source="user.username", read_only=True)
    user_total_completed_goals = serializers.SerializerMethodField()
    likes_count = serializers.SerializerMethodField()
    dislikes_count = serializers.SerializerMethodField()
    has_liked = serializers.SerializerMethodField()
    has_disliked = serializers.SerializerMethodField()
    photos = CommentPhotoSerializer(many=True, read_only=True)
    goal_category = CategorySerializer(source="goal.category", read_only=True)

    class Meta:
        model = Comment
        fields = (
            "id",
            "complexity",
            "user",
            "user_avatar",
            "user_name",
            "user_nickname",
            "text",
            "date_created",
            "photos",
            "user_total_completed_goals",
            "likes_count",
            "dislikes_count",
            "has_liked",
            "has_disliked",
            "goal_category",
        )

    def get_user(self, comment):
        return (
            comment.user.id if comment.user and comment.user.is_authenticated else None
        )

    def get_user_total_completed_goals(self, comment):
        # Получаем количество выполненных целей пользователя
        return comment.user.completed_goals.count() if comment.user else 0

    def get_likes_count(self, comment):
        return comment.likes.count()

    def get_dislikes_count(self, comment):
        return comment.dislikes.count()

    def get_has_liked(self, comment):
        user = self.context["request"].user
        return comment.likes.filter(id=user.id).exists()

    def get_has_disliked(self, comment):
        user = self.context["request"].user
        return comment.dislikes.filter(id=user.id).exists()

    def create(self, validated_data):
        photos_data = self.context["request"].FILES.getlist("photo")
        comment = Comment.objects.create(**validated_data)
        for photo_data in photos_data:
            CommentPhoto.objects.create(comment=comment, image=photo_data)
        return comment


class CommentScoreSerializer(serializers.ModelSerializer):
    likes_count = serializers.SerializerMethodField()
    dislikes_count = serializers.SerializerMethodField()
    has_liked = serializers.SerializerMethodField()
    has_disliked = serializers.SerializerMethodField()

    class Meta:
        model = Comment
        fields = ("likes_count", "dislikes_count", "has_liked", "has_disliked")

    def get_likes_count(self, comment):
        return comment.likes.count()

    def get_dislikes_count(self, comment):
        return comment.dislikes.count()

    def get_has_liked(self, comment):
        user = self.context["request"].user
        return comment.likes.filter(id=user.id).exists()

    def get_has_disliked(self, comment):
        user = self.context["request"].user
        return comment.dislikes.filter(id=user.id).exists()

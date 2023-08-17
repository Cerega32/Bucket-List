# serializers.py

from rest_framework import serializers
from .models import CustomUser
from django.contrib.auth import authenticate  # Make sure this import is added
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password


User = get_user_model()

class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])
    name = serializers.CharField(write_only=True)  # Поле для передачи name с фронтенда

    class Meta:
        model = User
        fields = ('name', 'email', 'password')

    def create(self, validated_data):
        name = validated_data.pop('name')  # Извлекаем name из validated_data
        validated_data['first_name'] = name  # Присваиваем first_name значение name

        # Use the email as the username
        validated_data['username'] = validated_data['email']
        user = User.objects.create_user(**validated_data)
        return user


class UserLoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField()

    def validate(self, data):
        email = data.get('email')
        password = data.get('password')

        user = authenticate(username=email, password=password)
        if not user:
            raise serializers.ValidationError('Неверные учетные данные')

        data['user'] = user
        return data
    

class CustomUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ('id', 'username', 'email', 'first_name', 'last_name', 'avatar')
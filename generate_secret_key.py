import secrets
import string

# Генерация случайного секретного ключа длиной 50 символов
chars = string.ascii_letters + string.digits + string.punctuation
secret_key = "".join(secrets.choice(chars) for _ in range(50))

print(f"SECRET_KEY={secret_key}")

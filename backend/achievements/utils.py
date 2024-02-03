# achievements/utils.py

from achievements.models import Achievement


def check_achievements(user):
    # Получаем все невыполненные достижения пользователя
    incomplete_achievements = Achievement.objects.exclude(achieved_users=user)

    # Перебираем все невыполненные достижения и проверяем условия
    for achievement in incomplete_achievements:
        if achievement.check_condition(user):
            # Если условие выполнено, выдаем достижение пользователю
            achievement.achieved_users.add(user)

    return None  # Или можно возвращать список новых достижений для более детальной обработки

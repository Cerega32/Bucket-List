# Константы для начисления опыта
EXPERIENCE_REWARDS = {
    "COMPLETE_GOAL": 50,  # За выполнение цели
    "COMPLETE_LIST": 100,  # За выполнение списка целей
    "ADD_COMMENT": 5,  # За написание комментария
    "RECEIVE_ACHIEVEMENT": 75,  # За получение достижения
}

from .levels import calculate_level
from achievements.utils import check_achievements


def add_experience(user, action_type):
    """
    Начисляет опыт пользователю за определенное действие и проверяет повышение уровня
    """
    if action_type in EXPERIENCE_REWARDS:
        old_level = calculate_level(user.experience)
        old_exp = user.experience

        # Начисляем опыт
        user.experience += EXPERIENCE_REWARDS[action_type]

        # Проверяем новый уровень
        new_level = calculate_level(user.experience)

        # Если уровень повысился, можно добавить достижение или уведомление
        if new_level > old_level:
            # Проверяем достижения связанные с уровнем
            check_achievements(user)

            # Здесь можно добавить создание уведомления о новом уровне
            # Notification.objects.create(
            #     user=user,
            #     type="level_up",
            #     message=f"Поздравляем! Вы достигли {new_level} уровня!"
            # )

        user.save()


def delete_experience(user, action_type):
    """
    Удаляет опыт пользователю за определенное действие
    """
    if action_type in EXPERIENCE_REWARDS:
        user.experience -= EXPERIENCE_REWARDS[action_type]
        user.save()

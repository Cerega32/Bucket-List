# Константы для начисления опыта
EXPERIENCE_REWARDS = {
    "COMPLETE_GOAL": 50,  # За выполнение цели
    "COMPLETE_LIST": 100,  # За выполнение списка целей
    "ADD_COMMENT": 5,  # За написание комментария
    "RECEIVE_ACHIEVEMENT": 75,  # За получение достижения
}


def add_experience(user, action_type):
    """
    Начисляет опыт пользователю за определенное действие
    """
    if action_type in EXPERIENCE_REWARDS:
        user.experience += EXPERIENCE_REWARDS[action_type]
        user.save()


def delete_experience(user, action_type):
    """
    Удаляет опыт пользователю за определенное действие
    """
    if action_type in EXPERIENCE_REWARDS:
        user.experience -= EXPERIENCE_REWARDS[action_type]
        user.save()

# Константы для уровней
LEVEL_THRESHOLDS = {
    1: 0,  # Начальный уровень
    2: 100,  # 100 опыта для 2 уровня
    3: 250,  # 250 опыта для 3 уровня
    4: 500,  # 500 опыта для 4 уровня
    5: 1000,  # 1000 опыта для 5 уровня
    6: 2000,  # 2000 опыта для 6 уровня
    7: 3500,  # 3500 опыта для 7 уровня
    8: 5500,  # 5500 опыта для 8 уровня
    9: 8000,  # 8000 опыта для 9 уровня
    10: 11000,  # 11000 опыта для 10 уровня
}


def calculate_level(experience):
    """
    Вычисляет текущий уровень на основе опыта
    """
    current_level = 1
    for level, threshold in LEVEL_THRESHOLDS.items():
        if experience >= threshold:
            current_level = level
        else:
            break
    return current_level


def experience_to_next_level(experience):
    """
    Вычисляет количество опыта, необходимое для следующего уровня
    """
    current_level = calculate_level(experience)
    if current_level < max(LEVEL_THRESHOLDS.keys()):
        next_level_exp = LEVEL_THRESHOLDS[current_level + 1]
        return next_level_exp - experience
    return 0

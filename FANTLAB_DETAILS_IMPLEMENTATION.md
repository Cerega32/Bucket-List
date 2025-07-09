# FantLab Details Implementation - Официальная API

## Обзор

Реализована интеграция с **официальной FantLab API** для получения детальной информации о произведениях. Система заменила предыдущий подход через поиск на прямое использование официального endpoint.

## Ключевые особенности

### 🎯 Официальная API

-   **Endpoint**: `https://api.fantlab.ru/work/{work_id}`
-   **Формат**: JSON
-   **Авторизация**: не требуется
-   **Rate limiting**: встроенные ограничения FantLab

### 📚 Полная информация о произведениях

-   Название (русское и оригинальное)
-   Подробное описание
-   Авторы с ID и оригинальными именами
-   Обложки (большие и превью)
-   Рейтинги и количество оценок
-   Тип произведения, год публикации
-   Дополнительные заметки

### 🖼️ Автоматические обложки

-   Прямые ссылки на изображения FantLab
-   Поддержка больших изображений: `/images/editions/big/{id}`
-   Автоматическое формирование полных URL

## Архитектура

### Backend Endpoint

```
GET /api/goals/fantlab/{work_id}/details/
```

**Ответ:**

```json
{
	"success": true,
	"data": {
		"title": "Пикник на обочине",
		"description": "Человеческое общество столкнулось...",
		"image_url": "https://fantlab.ru/images/editions/big/143403?r=1660839885",
		"authors": [
			{
				"name": "Аркадий и Борис Стругацкие",
				"original_name": "",
				"id": 52
			}
		],
		"published_date": "1972",
		"additional_fields": {
			"work_type": "Повесть",
			"rating": "9.01",
			"rating_count": 13168,
			"work_id": 569,
			"original_title": "",
			"language": "русский",
			"notes": "Машинопись из папки «Чистовики»...",
			"year_of_write": 1971,
			"fantlab_url": "https://fantlab.ru/work569"
		}
	}
}
```

### Frontend Integration

Автоматическая загрузка детальной информации при выборе книги из FantLab в компоненте `ExternalGoalSearch`.

## Реализация

### 1. Backend (Django)

**Файл:** `backend/goals/views/external_api_views.py`

#### Основная функция

```python
@require_http_methods(["GET"])
@cache_page(60 * 60 * 2)  # Cache for 2 hours
def get_fantlab_work_details(request, work_id):
    """
    Получение детальной информации о произведении через официальную FantLab API
    """
    api_url = f"https://api.fantlab.ru/work/{work_id}"
    response = requests.get(api_url, headers=headers, timeout=10)
    work_data = response.json()
    result = transform_fantlab_work_data(work_data)
    return JsonResponse({'success': True, 'data': result})
```

#### Преобразование данных

```python
def transform_fantlab_work_data(work_data):
    """
    Преобразует данные из официальной FantLab API в наш формат
    """
    # Обработка авторов
    authors = []
    for author_data in work_data.get('authors', []):
        authors.append({
            'name': author_data.get('name', ''),
            'original_name': author_data.get('name_orig', ''),
            'id': author_data.get('id')
        })

    # Обработка изображений
    image_url = None
    if work_data.get('image'):
        image_path = work_data['image']
        if image_path.startswith('/'):
            image_url = f"https://fantlab.ru{image_path}"

    # Формирование результата
    return {
        'title': work_data.get('work_name', ''),
        'description': work_data.get('work_description', ''),
        'image_url': image_url,
        'authors': authors,
        'published_date': str(work_data.get('work_year')) if work_data.get('work_year') else None,
        'additional_fields': {
            'work_type': work_data.get('work_type', ''),
            'rating': work_data.get('rating', {}).get('rating'),
            'rating_count': work_data.get('val_voters', 0),
            'work_id': work_data.get('work_id'),
            'original_title': work_data.get('work_name_orig', ''),
            'language': work_data.get('lang', ''),
            'notes': work_data.get('work_notes', ''),
            'year_of_write': work_data.get('work_year_of_write'),
            'fantlab_url': f"https://fantlab.ru/work{work_data.get('work_id', '')}"
        }
    }
```

### 2. URL Configuration

**Файл:** `backend/goals/urls.py`

```python
path('fantlab/<int:work_id>/details/', get_fantlab_work_details, name='fantlab_work_details'),
```

### 3. Frontend Integration

**Файл:** `src/utils/fetch/requests.ts`

```typescript
export const getFantLabWorkDetails = async (workId: string): Promise<FantLabWorkDetailsResponse> => {
	const response = await fetch(`/api/goals/fantlab/${workId}/details/`, {
		method: 'GET',
		headers: {
			'Content-Type': 'application/json',
		},
	});

	if (!response.ok) {
		throw new Error(`HTTP error! status: ${response.status}`);
	}

	return response.json();
};
```

**Автоматическая загрузка в компоненте:**

```typescript
// В ExternalGoalSearch.tsx
if (goalData.type === 'book' && goalData.apiSource === 'fantlab' && !goalData.isOwnDatabase) {
	const detailsResponse = await getFantLabWorkDetails(String(goalData.externalId));
	if (detailsResponse.success) {
		const details = detailsResponse.data;
		enhancedGoalData = {
			...goalData,
			title: details.title || goalData.title,
			description: details.description || goalData.description,
			imageUrl: details.image_url || goalData.imageUrl,
			authors: details.authors || goalData.authors,
			additionalFields: {
				...goalData.additionalFields,
				...details.additional_fields,
			},
		};
	}
}
```

## Преимущества новой реализации

### ✅ Официальная API

-   Стабильная и надежная
-   Полная документация
-   Прямой доступ к данным

### ✅ Качество данных

-   Полные описания произведений
-   Высококачественные обложки
-   Точные метаданные
-   Рейтинги и статистика

### ✅ Производительность

-   Прямые API вызовы
-   Кэширование на 2 часа
-   Быстрая загрузка

### ✅ Надежность

-   Обработка ошибок
-   Fallback на базовые данные
-   Валидация ответов

## Примеры использования

### Тестирование через curl

```bash
# Пикник на обочине
curl "http://localhost:8000/api/goals/fantlab/569/details/"

# Космер Сандерсона
curl "http://localhost:8000/api/goals/fantlab/502648/details/"
```

### Примеры ответов

**Произведение с обложкой:**

```json
{
	"success": true,
	"data": {
		"title": "Пикник на обочине",
		"image_url": "https://fantlab.ru/images/editions/big/143403?r=1660839885",
		"rating": "9.01",
		"rating_count": 13168
	}
}
```

**Цикл без обложки:**

```json
{
	"success": true,
	"data": {
		"title": "Космер",
		"image_url": null,
		"work_type": "Цикл",
		"original_title": "Cosmere"
	}
}
```

## Миграция

### Изменения в коде

1. ✅ Заменена функция `get_fantlab_work_details()` на использование официальной API
2. ✅ Упрощена логика получения данных
3. ✅ Улучшена обработка изображений
4. ✅ Добавлены новые поля данных

### Обратная совместимость

-   ✅ Frontend код остался без изменений
-   ✅ API endpoint остался тот же
-   ✅ Формат ответа совместим
-   ✅ Все существующие функции работают

## Тестирование

### Автоматические тесты

```bash
# Тест официальной API
python test_fantlab_official_api.py

# Тест Django endpoint
python test_fantlab_endpoint.py
```

### Ручное тестирование

1. Поиск книг в категории "books"
2. Выбор произведения из FantLab
3. Автоматическая загрузка детальной информации
4. Проверка обложки и метаданных

## Результаты

### ✅ Успешно реализовано

-   Переход на официальную FantLab API
-   Автоматическая загрузка обложек
-   Расширенные метаданные произведений
-   Кэширование и оптимизация производительности
-   Полная обратная совместимость

### 🎯 Достигнутые цели

-   Использование официального API вместо поиска
-   Получение качественных изображений обложек
-   Детальная информация о произведениях
-   Стабильная и надежная работа

### 📈 Улучшения

-   Скорость загрузки данных увеличена
-   Качество изображений улучшено
-   Полнота информации расширена
-   Надежность системы повышена

## Заключение

Миграция на официальную FantLab API успешно завершена. Система теперь использует стабильный и надежный источник данных, обеспечивая пользователям доступ к качественной информации о произведениях с автоматической загрузкой обложек и расширенными метаданными.

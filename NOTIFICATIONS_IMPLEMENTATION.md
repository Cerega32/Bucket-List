# Система уведомлений - Документация

## Обзор

Реализована полноценная система уведомлений для приложения Bucket List, включающая:

-   Автоматическую отправку уведомлений при различных событиях
-   Отображение уведомлений в Header с badge непрочитанных
-   Управление состоянием прочтения уведомлений
-   Интеграцию страницы друзей в UserSelf с использованием Switch

## Бэкенд (Django)

### Модели

#### Notification (`backend/notifications/models.py`)

```python
class Notification(models.Model):
    NOTIFICATION_TYPES = [
        ('friend_request', 'Заявка в друзья'),
        ('friend_accepted', 'Заявка принята'),
        ('friend_rejected', 'Заявка отклонена'),
        ('achievement', 'Достижение'),
        ('goal_completed', 'Цель выполнена'),
    ]

    recipient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_notifications', null=True, blank=True)
    type = models.CharField(max_length=20, choices=NOTIFICATION_TYPES)
    title = models.CharField(max_length=255)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    # Дополнительные поля для связи с объектами
    related_object_id = models.PositiveIntegerField(null=True, blank=True)
    related_object_type = models.CharField(max_length=50, null=True, blank=True)
```

### API Endpoints

-   `GET /api/notifications/` - Получение списка уведомлений с пагинацией
-   `PUT /api/notifications/{id}/read/` - Отметить уведомление как прочитанное
-   `PUT /api/notifications/read-all/` - Отметить все уведомления как прочитанные
-   `GET /api/notifications/unread-count/` - Получить количество непрочитанных

### Сигналы

#### Автоматические уведомления (`backend/notifications/signals.py`)

-   При создании заявки в друзья → уведомление получателю
-   При принятии заявки → уведомление отправителю
-   При отклонении заявки → уведомление отправителю

### Админка

Полноценная админка для управления уведомлениями с фильтрацией и поиском.

## Фронтенд (React + TypeScript + MobX)

### Компоненты

#### NotificationDropdown (`src/components/NotificationDropdown/`)

-   Выпадающий список уведомлений в Header
-   Отображение аватаров пользователей и иконок типов уведомлений
-   Кнопка "Отметить все как прочитанные"
-   Responsive дизайн

#### UserSelfFriends (`src/containers/UserSelfFriends/`)

-   Интегрированная страница друзей в UserSelf
-   Switch для переключения между разделами:
    -   Мои друзья
    -   Заявки
    -   Поиск
-   Стилизация в соответствии с общим дизайном

### Stores

#### HeaderNotificationsStore (`src/store/HeaderNotificationsStore.ts`)

-   MobX store для управления состоянием уведомлений
-   Методы для отметки как прочитанных (с API вызовами)
-   Автоматическое обновление счетчика непрочитанных

### API

#### notifications.ts (`src/utils/api/notifications.ts`)

-   Функции для работы с API уведомлений
-   Обработка ошибок
-   TypeScript типизация

### Типы

#### notification.ts (`src/typings/notification.ts`)

```typescript
export interface IHeaderNotification {
	id: number;
	type: 'friend_request' | 'friend_accepted' | 'friend_rejected' | 'achievement' | 'goal_completed';
	title: string;
	message: string;
	isRead: boolean;
	createdAt: string;
	userId?: number;
	userName?: string;
	userAvatar?: string;
	sender?: {
		id: number;
		username: string;
		firstName: string;
		lastName: string;
		avatar?: string;
	};
}
```

## Интеграция страницы друзей

### Изменения в маршрутизации

-   Удалены отдельные маршруты `/friends/*`
-   Добавлены маршруты через UserSelf: `/user/self/friends/*`
-   Редиректы со старых маршрутов на новые

### Структура UserSelf

-   Добавлена вкладка "Друзья" в боковое меню
-   UserSelfFriends интегрирован в getUserContent()
-   Switch для переключения между подразделами

### Обновленные ссылки

-   Header навигация обновлена на новые маршруты
-   Профильное меню обновлено

## Использование

### Создание уведомлений

Уведомления создаются автоматически через Django сигналы при:

-   Отправке заявки в друзья
-   Принятии/отклонении заявки
-   Получении достижений (можно расширить)

### Отображение в Header

-   Badge с количеством непрочитанных
-   Выпадающий список при клике на иконку колокольчика
-   Автоматическое обновление при загрузке страницы

### Управление состоянием

-   Клик по уведомлению отмечает его как прочитанное
-   Кнопка "Отметить все" для массовой отметки
-   Синхронизация с бэкендом

## Тестирование

### Создание тестовых данных

Используйте скрипт `backend/create_test_notifications.py`:

```bash
cd backend
python create_test_notifications.py
```

### Проверка функциональности

1. Запустите бэкенд: `python manage.py runserver`
2. Запустите фронтенд: `npm start`
3. Авторизуйтесь в системе
4. Проверьте отображение уведомлений в Header
5. Протестируйте отметку как прочитанных

## Расширение системы

### Добавление новых типов уведомлений

1. Добавьте тип в `NOTIFICATION_TYPES` модели
2. Создайте сигнал для автоматической отправки
3. Добавьте иконку в `getNotificationIcon()` фронтенда
4. Обновите TypeScript типы

### Добавление push-уведомлений

Система готова к расширению для поддержки:

-   WebSocket уведомлений в реальном времени
-   Push-уведомлений браузера
-   Email уведомлений

## Файлы

### Бэкенд

-   `backend/notifications/` - Приложение уведомлений
-   `backend/notifications/models.py` - Модель уведомлений
-   `backend/notifications/views.py` - API представления
-   `backend/notifications/serializers.py` - Сериализаторы
-   `backend/notifications/signals.py` - Автоматические уведомления
-   `backend/notifications/admin.py` - Админка
-   `backend/create_test_notifications.py` - Скрипт тестовых данных

### Фронтенд

-   `src/components/NotificationDropdown/` - Компонент уведомлений
-   `src/containers/UserSelfFriends/` - Интегрированная страница друзей
-   `src/store/HeaderNotificationsStore.ts` - MobX store
-   `src/utils/api/notifications.ts` - API функции
-   `src/typings/notification.ts` - TypeScript типы
-   `src/utils/date/formatDistanceToNow.ts` - Утилита форматирования времени

import {FC, useEffect, useState} from 'react';

import {useBem} from '@/hooks/useBem';
import useScreenSize from '@/hooks/useScreenSize';
import {TodoStore} from '@/store/TodoStore';
import {CreateTodoTaskData, RecurringPattern} from '@/typings/todo';

import {Button} from '../Button/Button';

import './create-todo-task-form.scss';

interface CreateTodoTaskFormProps {
	className?: string;
	defaultListId?: string | null;
	onSuccess: () => void;
	onCancel: () => void;
}

export const CreateTodoTaskForm: FC<CreateTodoTaskFormProps> = ({className, defaultListId, onSuccess, onCancel}) => {
	const [block, element] = useBem('create-todo-task-form', className);
	const {isScreenMobile} = useScreenSize();

	const [formData, setFormData] = useState<CreateTodoTaskData>({
		title: '',
		description: '',
		todoList: defaultListId || '',
		relatedGoalId: '',
		priority: 'medium',
		context: '',
		estimatedDuration: '',
		deadline: '',
		scheduledDate: '',
		scheduledTime: '',
		isRecurring: false,
		recurringPattern: {
			type: 'daily',
			interval: 1,
		},
		tags: [],
		notes: '',
	});

	const [tagInput, setTagInput] = useState('');
	const [isSubmitting, setIsSubmitting] = useState(false);

	// Загружаем цели пользователя при монтировании компонента
	useEffect(() => {
		if (TodoStore.userGoals.length === 0) {
			TodoStore.loadUserGoals();
		}
	}, []);

	useEffect(() => {
		if (defaultListId && defaultListId !== formData.todoList) {
			setFormData((prev) => ({...prev, todoList: defaultListId}));
		}
	}, [defaultListId, formData.todoList]);

	const handleInputChange = (field: keyof CreateTodoTaskData, value: string | boolean | CreateTodoTaskData['recurringPattern']) => {
		setFormData((prev) => ({...prev, [field]: value}));
	};

	const handleAddTag = () => {
		const tag = tagInput.trim();
		if (tag && !formData.tags?.includes(tag)) {
			setFormData((prev) => ({
				...prev,
				tags: [...(prev.tags || []), tag],
			}));
			setTagInput('');
		}
	};

	const handleRemoveTag = (tagToRemove: string) => {
		setFormData((prev) => ({
			...prev,
			tags: prev.tags?.filter((tag) => tag !== tagToRemove) || [],
		}));
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!formData.title.trim()) {
			return;
		}

		if (!formData.todoList) {
			return;
		}

		setIsSubmitting(true);
		try {
			await TodoStore.createTodoTask(formData);
			onSuccess();
		} catch (error) {
			// Ошибка уже обработана в TodoStore
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<form className={block()} onSubmit={handleSubmit}>
			<div className={element('field')}>
				<label htmlFor="task" className={element('label')}>
					Название задачи <span className={element('required')}>*</span>
					<input
						id="task"
						type="text"
						className={element('input')}
						value={formData.title}
						onChange={(e) => handleInputChange('title', e.target.value)}
						placeholder="Введите название задачи"
						required
					/>
				</label>
			</div>

			<div className={element('field')}>
				<label htmlFor="task-description" className={element('label')}>
					Описание
					<textarea
						id="task-description"
						className={element('textarea')}
						value={formData.description}
						onChange={(e) => handleInputChange('description', e.target.value)}
						placeholder="Краткое описание задачи"
						rows={3}
					/>
				</label>
			</div>

			<div className={element('field')}>
				<label htmlFor="task-list" className={element('label')}>
					Список задач <span className={element('required')}>*</span>
					<select
						id="task-list"
						className={element('select')}
						value={formData.todoList}
						onChange={(e) => handleInputChange('todoList', e.target.value)}
						required
					>
						<option value="">Выберите список</option>
						{TodoStore.todoLists.map((list) => (
							<option key={list.id} value={list.id}>
								{list.icon} {list.title}
							</option>
						))}
					</select>
				</label>
			</div>

			<div className={element('field')}>
				<label htmlFor="task-goal" className={element('label')}>
					Связанная цель
					<select
						id="task-goal"
						className={element('select')}
						value={formData.relatedGoalId || ''}
						onChange={(e) => handleInputChange('relatedGoalId', e.target.value)}
					>
						<option value="">Не связана с целью</option>
						{TodoStore.userGoals.map((goal) => (
							<option key={goal.id} value={goal.id}>
								{goal.title}
							</option>
						))}
					</select>
				</label>
			</div>

			<div className={element('row')}>
				<div className={element('field', {half: true})}>
					<label htmlFor="task-priority" className={element('label')}>
						Приоритет
						<select
							id="task-priority"
							className={element('select')}
							value={formData.priority}
							onChange={(e) => handleInputChange('priority', e.target.value as 'urgent' | 'high' | 'medium' | 'low')}
						>
							<option value="low">Низкий</option>
							<option value="medium">Средний</option>
							<option value="high">Высокий</option>
							<option value="urgent">Срочный</option>
						</select>
					</label>
				</div>

				<div className={element('field', {half: true})}>
					<label htmlFor="task-context" className={element('label')}>
						Контекст
						<select
							id="task-context"
							className={element('select')}
							value={formData.context}
							onChange={(e) => handleInputChange('context', e.target.value)}
						>
							<option value="">Не указан</option>
							<option value="home">Дом</option>
							<option value="work">Работа</option>
							<option value="call">Звонки</option>
							<option value="email">Почта</option>
							<option value="errands">Поручения</option>
							<option value="computer">Компьютер</option>
							<option value="online">Онлайн</option>
							<option value="waiting">Ожидание</option>
							<option value="other">Другое</option>
						</select>
					</label>
				</div>
			</div>

			<div className={element('field')}>
				<label htmlFor="task-duration" className={element('label')}>
					Расчетная длительность
					<input
						id="task-duration"
						type="text"
						className={element('input')}
						value={formData.estimatedDuration}
						onChange={(e) => handleInputChange('estimatedDuration', e.target.value)}
						placeholder="Например: 2 часа"
					/>
				</label>
			</div>

			<div className={element('field')}>
				<label htmlFor="task-deadline" className={element('label')}>
					Крайний срок
					<input
						id="task-deadline"
						type="date"
						className={element('input')}
						value={formData.deadline}
						onChange={(e) => handleInputChange('deadline', e.target.value)}
					/>
				</label>
			</div>

			<div className={element('row')}>
				<div className={element('field', {half: true})}>
					<label htmlFor="task-scheduled-date" className={element('label')}>
						Запланированная дата
						<input
							id="task-scheduled-date"
							type="date"
							className={element('input')}
							value={formData.scheduledDate}
							onChange={(e) => handleInputChange('scheduledDate', e.target.value)}
						/>
					</label>
				</div>

				<div className={element('field', {half: true})}>
					<label htmlFor="task-scheduled-time" className={element('label')}>
						Запланированное время
						<input
							id="task-scheduled-time"
							type="time"
							className={element('input')}
							value={formData.scheduledTime}
							onChange={(e) => handleInputChange('scheduledTime', e.target.value)}
						/>
					</label>
				</div>
			</div>

			<div className={element('field')}>
				<div className={element('checkbox-group')}>
					<label htmlFor="task-recurring" className={element('checkbox-label')}>
						<input
							id="task-recurring"
							type="checkbox"
							className={element('checkbox')}
							checked={formData.isRecurring}
							onChange={(e) => handleInputChange('isRecurring', e.target.checked)}
						/>
						Повторяющаяся задача
					</label>
				</div>
			</div>

			{formData.isRecurring && (
				<div className={element('recurring-settings')}>
					<div className={element('field')}>
						<label htmlFor="task-recurring-type" className={element('label')}>
							Тип повторения
							<select
								id="task-recurring-type"
								className={element('select')}
								value={formData.recurringPattern?.type || 'daily'}
								onChange={(e) => {
									const newPattern: RecurringPattern = {
										type: e.target.value as RecurringPattern['type'],
										interval: formData.recurringPattern?.interval || 1,
										...formData.recurringPattern,
									};
									handleInputChange('recurringPattern', newPattern);
								}}
							>
								<option value="daily">Ежедневно</option>
								<option value="weekly">Еженедельно</option>
								<option value="monthly">Ежемесячно</option>
							</select>
						</label>
					</div>

					<div className={element('field')}>
						<label htmlFor="task-recurring-interval" className={element('label')}>
							Интервал
							<input
								id="task-recurring-interval"
								type="number"
								min="1"
								className={element('input')}
								value={formData.recurringPattern?.interval || 1}
								onChange={(e) => {
									const newPattern: RecurringPattern = {
										type: formData.recurringPattern?.type || 'daily',
										interval: parseInt(e.target.value, 10) || 1,
										...formData.recurringPattern,
									};
									handleInputChange('recurringPattern', newPattern);
								}}
							/>
						</label>
					</div>
				</div>
			)}

			<div className={element('field')}>
				<label htmlFor="task-tags" className={element('label')}>
					Теги
					<div className={element('tags-input')}>
						<input
							id="task-tags"
							type="text"
							className={element('input')}
							value={tagInput}
							onChange={(e) => setTagInput(e.target.value)}
							onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
							placeholder="Добавить тег"
						/>
						<Button type="button" onClick={handleAddTag} theme="blue-light" size="small">
							Добавить
						</Button>
					</div>
				</label>

				{formData.tags && formData.tags.length > 0 && (
					<div className={element('tags-list')}>
						{formData.tags.map((tag) => (
							<span key={tag} className={element('tag')}>
								{tag}
								<button
									type="button"
									className={element('tag-remove')}
									onClick={() => handleRemoveTag(tag)}
									aria-label={`Удалить тег ${tag}`}
								>
									×
								</button>
							</span>
						))}
					</div>
				)}
			</div>

			<div className={element('field')}>
				<label htmlFor="task-notes" className={element('label')}>
					Заметки
					<textarea
						id="task-notes"
						className={element('textarea')}
						value={formData.notes}
						onChange={(e) => handleInputChange('notes', e.target.value)}
						placeholder="Дополнительные заметки"
						rows={3}
					/>
				</label>
			</div>

			<div className={element('actions')}>
				<Button
					type="button"
					onClick={onCancel}
					theme="blue-light"
					size={isScreenMobile ? 'medium' : undefined}
					active={isSubmitting}
				>
					Отмена
				</Button>
				<Button
					typeBtn="submit"
					theme="blue"
					size={isScreenMobile ? 'medium' : undefined}
					active={isSubmitting || !formData.title.trim() || !formData.todoList}
				>
					{isSubmitting ? 'Создание...' : 'Создать задачу'}
				</Button>
			</div>
		</form>
	);
};

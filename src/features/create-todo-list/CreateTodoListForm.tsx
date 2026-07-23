import {FC, useState} from 'react';

import {TodoStore} from '@/entities/todo/model/TodoStore';
import {CreateTodoListData} from '@/entities/todo/model/types';
import {useBem} from '@/shared/lib/hooks/useBem';
import useScreenSize from '@/shared/lib/hooks/useScreenSize';
import {ModalStore} from '@/shared/model/ModalStore';
import {Button} from '@/shared/ui/Button/Button';

import '@/features/create-todo-list/create-todo-list-form.scss';

interface CreateTodoListFormProps {
	className?: string;
	onSuccess: () => void;
	onCancel: () => void;
}

export const CreateTodoListForm: FC<CreateTodoListFormProps> = ({className, onSuccess, onCancel}) => {
	const [block, element] = useBem('create-todo-list-form', className);
	const {isScreenMobile} = useScreenSize();

	const [formData, setFormData] = useState<CreateTodoListData>({
		title: '',
		description: '',
		color: '#3a89d8',
		icon: '📋',
		templateCategory: '',
	});

	const [isSubmitting, setIsSubmitting] = useState(false);

	const handleInputChange = (field: keyof CreateTodoListData, value: string) => {
		setFormData((prev) => ({...prev, [field]: value}));
	};

	const closeModal = () => {
		ModalStore.setIsOpen(false);
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsSubmitting(true);

		try {
			await TodoStore.createTodoList(formData);
			onSuccess?.();
			closeModal();
		} catch (error) {
			// Ошибка уже обработана в TodoStore
		} finally {
			setIsSubmitting(false);
		}
	};

	const colorOptions = [
		{value: '#3a89d8', label: 'Синий'},
		{value: '#10b981', label: 'Зеленый'},
		{value: '#f59e0b', label: 'Желтый'},
		{value: '#ef4444', label: 'Красный'},
		{value: '#8b5cf6', label: 'Фиолетовый'},
		{value: '#06b6d4', label: 'Голубой'},
		{value: '#f97316', label: 'Оранжевый'},
		{value: '#84cc16', label: 'Лайм'},
	];

	const iconOptions = ['📋', '📝', '✅', '📌', '🎯', '🚀', '💼', '🏠', '🛒', '✈️', '💪', '📚', '🎵', '🎨', '🔧', '⭐'];

	return (
		<form onSubmit={handleSubmit} className={block()}>
			<div className={element('field')}>
				<label htmlFor="list-title" className={element('label')}>
					Название списка <span className={element('required')}>*</span>
					<input
						id="list-title"
						type="text"
						className={element('input')}
						value={formData.title}
						onChange={(e) => handleInputChange('title', e.target.value)}
						placeholder="Введите название списка"
						required
					/>
				</label>
			</div>

			<div className={element('field')}>
				<label htmlFor="list-description" className={element('label')}>
					Описание
					<textarea
						id="list-description"
						className={element('textarea')}
						value={formData.description}
						onChange={(e) => handleInputChange('description', e.target.value)}
						placeholder="Краткое описание списка задач"
						rows={3}
					/>
				</label>
			</div>

			<div className={element('row')}>
				<div className={element('field', {half: true})}>
					<fieldset>
						<legend className={element('label')} id="color-legend">
							Цвет
						</legend>
						<div className={element('color-grid')} role="radiogroup" aria-labelledby="color-legend">
							{colorOptions.map((color) => (
								<button
									key={color.value}
									type="button"
									className={element('color-option', {
										active: formData.color === color.value,
									})}
									style={{backgroundColor: color.value}}
									onClick={() => handleInputChange('color', color.value)}
									aria-label={`Выбрать цвет ${color.label}`}
									role="radio"
									aria-checked={formData.color === color.value}
								/>
							))}
						</div>
					</fieldset>
				</div>

				<div className={element('field', {half: true})}>
					<fieldset>
						<legend className={element('label')} id="icon-legend">
							Иконка
						</legend>
						<div className={element('icon-grid')} role="radiogroup" aria-labelledby="icon-legend">
							{iconOptions.map((icon) => (
								<button
									key={icon}
									type="button"
									className={element('icon-option', {
										active: formData.icon === icon,
									})}
									onClick={() => handleInputChange('icon', icon)}
									aria-label={`Выбрать иконку ${icon}`}
									role="radio"
									aria-checked={formData.icon === icon}
								>
									{icon}
								</button>
							))}
						</div>
					</fieldset>
				</div>
			</div>

			<div className={element('field')}>
				<label htmlFor="list-template-category" className={element('label')}>
					Категория шаблона
					<select
						id="list-template-category"
						className={element('select')}
						value={formData.templateCategory}
						onChange={(e) => handleInputChange('templateCategory', e.target.value)}
					>
						<option value="">Не использовать как шаблон</option>
						<option value="work">Работа</option>
						<option value="personal">Личное</option>
						<option value="shopping">Покупки</option>
						<option value="travel">Путешествия</option>
						<option value="health">Здоровье</option>
						<option value="learning">Обучение</option>
						<option value="other">Другое</option>
					</select>
				</label>
			</div>

			<div className={element('actions')}>
				<Button
					type="button"
					onClick={onCancel}
					theme="blue-light"
					size={isScreenMobile ? 'medium' : undefined}
					disabled={isSubmitting}
				>
					Отмена
				</Button>
				<Button
					typeBtn="submit"
					theme="blue"
					size={isScreenMobile ? 'medium' : undefined}
					disabled={isSubmitting || !formData.title.trim()}
				>
					{isSubmitting ? 'Создание...' : 'Создать список'}
				</Button>
			</div>
		</form>
	);
};

import React, {useEffect, useState} from 'react';

import {Button} from '@/components/Button/Button';
import {FieldInput} from '@/components/FieldInput/FieldInput';
import {Loader} from '@/components/Loader/Loader';
import {Svg} from '@/components/Svg/Svg';
import {useBem} from '@/hooks/useBem';
import {NotificationStore} from '@/store/NotificationStore';
import {ICategory} from '@/typings/goal';
import {getCategories} from '@/utils/api/get/getCategories';
import {POST} from '@/utils/fetch/requests';
import {selectComplexity} from '@/utils/values/complexity';

import {GoalPreviewCard} from './GoalPreviewCard';
import Select from '../Select/Select';

import './auto-list-creator.scss';

interface ParsedGoal {
	status: 'existing' | 'external' | 'created' | 'error';
	title: string;
	description: string;
	imageUrl?: string;
	confidence: number;
	goalCode?: string;
	externalId?: string;
	apiSource?: string;
	additionalFields?: any;
	existingGoal?: boolean;
	error?: string;
	complexity?: string;
}

interface AutoListCreatorProps {
	onListCreated: (listCode: string) => void;
	categoryId?: number;
	onClose?: () => void;
	className?: string;
	initialCategory?: ICategory;
	preloadedCategories?: ICategory[];
	preloadedSubcategories?: ICategory[];
}

export const AutoListCreator: React.FC<AutoListCreatorProps> = ({
	onListCreated,
	categoryId,
	onClose,
	className,
	initialCategory,
	preloadedCategories,
	preloadedSubcategories,
}) => {
	const [block, element] = useBem('auto-list-creator', className);

	const [text, setText] = useState('');
	const [listTitle, setListTitle] = useState('');
	const [description, setDescription] = useState('');
	const [activeComplexity, setActiveComplexity] = useState(1); // medium по умолчанию
	const [isLoading, setIsLoading] = useState(false);
	const [isCreating, setIsCreating] = useState(false);
	const [parsedGoals, setParsedGoals] = useState<ParsedGoal[]>([]);
	const [showPreview, setShowPreview] = useState(false);
	const [categories, setCategories] = useState<ICategory[]>([]);

	const complexity = selectComplexity[activeComplexity]?.value || 'medium';

	// Загружаем категории при монтировании
	useEffect(() => {
		const loadCategories = async () => {
			try {
				const response = await getCategories();
				if (response.success) {
					setCategories(response.data);
				}
			} catch (error) {
				console.error('Failed to load categories:', error);
			}
		};

		loadCategories();
	}, []);

	const handleParseText = async () => {
		if (!text.trim()) {
			NotificationStore.addNotification({
				type: 'warning',
				title: 'Внимание',
				message: 'Введите текст для анализа',
			});
			return;
		}

		if (!categoryId) {
			NotificationStore.addNotification({
				type: 'error',
				title: 'Ошибка',
				message: 'Выберите категорию',
			});
			return;
		}

		setIsLoading(true);
		try {
			const response = await POST('goal-lists/parse-text', {
				body: {
					text,
					category_id: categoryId,
				},
				showSuccessNotification: false,
				showErrorNotification: false,
				auth: true,
			});

			if (response.success && response.data.goals) {
				setParsedGoals(response.data.goals);
				setShowPreview(true);

				// Автоматически генерируем название если не задано
				if (!listTitle.trim() && response.data.goals.length > 0) {
					const firstGoal = response.data.goals[0];
					const suggestedTitle = `Список: ${firstGoal.title}${
						response.data.goals.length > 1 ? ` и еще ${response.data.goals.length - 1}` : ''
					}`;
					setListTitle(suggestedTitle);
				}

				NotificationStore.addNotification({
					type: 'success',
					title: 'Готово',
					message: `Найдено ${response.data.goals.length} целей. Проверьте результаты.`,
				});
			} else {
				NotificationStore.addNotification({
					type: 'error',
					title: 'Ошибка',
					message: response.data?.error || 'Не удалось проанализировать текст',
				});
			}
		} catch (error) {
			console.error('Error parsing text:', error);
			NotificationStore.addNotification({
				type: 'error',
				title: 'Ошибка',
				message: 'Произошла ошибка при анализе текста',
			});
		} finally {
			setIsLoading(false);
		}
	};

	const handleCreateList = async () => {
		if (!listTitle.trim()) {
			NotificationStore.addNotification({
				type: 'warning',
				title: 'Внимание',
				message: 'Введите название списка',
			});
			return;
		}

		if (parsedGoals.length === 0) {
			NotificationStore.addNotification({
				type: 'warning',
				title: 'Внимание',
				message: 'Нет целей для создания списка',
			});
			return;
		}

		setIsCreating(true);
		try {
			const formData = new FormData();
			formData.append('text', text);
			formData.append('list_title', listTitle);
			formData.append('description', description);
			formData.append('category_id', categoryId?.toString() || '');
			formData.append('complexity', complexity);
			formData.append('goals_data', JSON.stringify(parsedGoals));

			const response = await POST('goal-lists/create-from-text', {
				body: formData,
				file: true,
				auth: true,
				showSuccessNotification: false,
				showErrorNotification: false,
			});

			if (response.success) {
				NotificationStore.addNotification({
					type: 'success',
					title: 'Успешно!',
					message: response.data.message || 'Список создан',
				});

				onListCreated(response.data.listCode);

				if (onClose) {
					onClose();
				}
			} else {
				NotificationStore.addNotification({
					type: 'error',
					title: 'Ошибка',
					message: response.data?.error || 'Не удалось создать список',
				});
			}
		} catch (error) {
			console.error('Error creating list:', error);
			NotificationStore.addNotification({
				type: 'error',
				title: 'Ошибка',
				message: 'Произошла ошибка при создании списка',
			});
		} finally {
			setIsCreating(false);
		}
	};

	const handleEditGoal = (index: number, editedGoal: ParsedGoal) => {
		const updated = [...parsedGoals];
		updated[index] = editedGoal;
		setParsedGoals(updated);
	};

	const handleRemoveGoal = (index: number) => {
		const updated = parsedGoals.filter((_, i) => i !== index);
		setParsedGoals(updated);
	};

	return (
		<div className={block()}>
			<div className={element('header')}>
				<div className={element('title-section')}>
					{/* <Svg icon="" className={element('title-icon')} /> */}
					<h3 className={element('title')}>Автоматическое создание списка</h3>
				</div>
				{onClose && (
					<Button theme="blue-light" size="small" onClick={onClose} className={element('close-button')}>
						×
					</Button>
				)}
			</div>

			<div className={element('info-block')}>
				<Svg icon="info" className={element('info-icon')} />
				<p className={element('info-text')}>
					Вставьте список целей (книги, фильмы, игры) — система автоматически найдет соответствия в базе и внешних источниках.
				</p>
			</div>

			<div className={element('form')}>
				<FieldInput
					id="list-title"
					text="Название списка"
					value={listTitle}
					setValue={setListTitle}
					placeholder="Например: Мои любимые книги"
					className={element('field')}
				/>

				<FieldInput
					id="goals-text"
					type="textarea"
					text="Список целей"
					value={text}
					setValue={setText}
					placeholder={
						'Пример:\n1. Властелин колец\n2. Гарри Поттер\n3. 1984\n\nИли просто:\nВластелин колец, Гарри Поттер, 1984'
					}
					className={element('field')}
				/>

				<FieldInput
					id="list-description"
					type="textarea"
					text="Описание списка (необязательно)"
					value={description}
					setValue={setDescription}
					placeholder="Краткое описание списка"
					className={element('field')}
				/>

				<Select
					className={element('complexity-select')}
					placeholder="Выберите сложность"
					options={selectComplexity}
					activeOption={activeComplexity}
					onSelect={setActiveComplexity}
					text="Сложность целей"
				/>

				<div className={element('actions')}>
					<Button theme="blue-light" onClick={handleParseText} size="medium" className={element('preview-button')}>
						{isLoading ? 'Анализ...' : 'Предпросмотр'}
					</Button>

					{showPreview && (
						<Button theme="blue" onClick={handleCreateList} size="medium" className={element('create-button')}>
							{isCreating ? 'Создание...' : `Создать список (${parsedGoals.length})`}
						</Button>
					)}
				</div>
			</div>

			{showPreview && (
				<div className={element('preview')}>
					<div className={element('preview-header')}>
						<h4 className={element('preview-title')}>Найденные цели ({parsedGoals.length})</h4>
						<div className={element('preview-stats')}>
							<span className={element('stat', {existing: true})}>
								Существующие: {parsedGoals.filter((g) => g.status === 'existing').length}
							</span>
							<span className={element('stat', {external: true})}>
								Из API: {parsedGoals.filter((g) => g.status === 'external').length}
							</span>
							<span className={element('stat', {created: true})}>
								Новые: {parsedGoals.filter((g) => g.status === 'created').length}
							</span>
						</div>
					</div>

					<div className={element('goals-grid')}>
						{parsedGoals.map((goal, index) => (
							<GoalPreviewCard
								key={`${goal.title}-${goal.status}-${goal.externalId || index}`}
								goal={goal}
								onEdit={(editedGoal: ParsedGoal) => handleEditGoal(index, editedGoal)}
								onRemove={() => handleRemoveGoal(index)}
								initialCategory={initialCategory}
								preloadedCategories={preloadedCategories || categories}
								preloadedSubcategories={preloadedSubcategories}
							/>
						))}
					</div>
				</div>
			)}

			<Loader isLoading={isLoading || isCreating} />
		</div>
	);
};

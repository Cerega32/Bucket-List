import {FC, FormEvent, useCallback, useEffect, useRef, useState} from 'react';
import {FileDrop} from 'react-file-drop';
import {useNavigate} from 'react-router-dom';

import {AddGoal} from '@/components/AddGoal/AddGoal';
import {Button} from '@/components/Button/Button';
import {FieldInput} from '@/components/FieldInput/FieldInput';
import {Svg} from '@/components/Svg/Svg';
import {Title} from '@/components/Title/Title';
import {useBem} from '@/hooks/useBem';
import {NotificationStore} from '@/store/NotificationStore';
import {ICategory, IGoal, IShortGoal} from '@/typings/goal';
import {IList} from '@/typings/list';
import {getCategories} from '@/utils/api/get/getCategories';
import {getCategory} from '@/utils/api/get/getCategory';
import {getSimilarGoals} from '@/utils/api/get/getSimilarGoals';
import {updateGoalList} from '@/utils/api/put/updateGoalList';
import {debounce} from '@/utils/time/debounce';
import {getComplexity, selectComplexity} from '@/utils/values/complexity';

import {GoalSearchItem} from '../GoalSearchItem/GoalSearchItem';
import Select from '../Select/Select';

import './edit-goal-list.scss';

interface EditGoalListProps {
	className?: string;
	listData: IList;
	canEditAll: boolean; // Полное редактирование (в течение 24 часов)
}

export const EditGoalList: FC<EditGoalListProps> = (props) => {
	const {className, listData, canEditAll} = props;
	const navigate = useNavigate();

	const [block, element] = useBem('edit-goal-list', className);
	const [title, setTitle] = useState(listData.title || '');
	const [description, setDescription] = useState(listData.description || '');
	const [activeComplexity, setActiveComplexity] = useState<number | null>(null);
	const [activeCategory, setActiveCategory] = useState<number | null>(null);
	const [activeSubcategory, setActiveSubcategory] = useState<number | null>(null);
	const [image, setImage] = useState<File | null>(null);
	const [imagePreview, setImagePreview] = useState<string>(listData.image || '');
	const [categories, setCategories] = useState<ICategory[]>([]);
	const [subcategories, setSubcategories] = useState<ICategory[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [showAddGoalForm, setShowAddGoalForm] = useState(false);
	const fileInputRef = useRef<HTMLInputElement | null>(null);

	// Состояния для работы с целями
	const [selectedGoals, setSelectedGoals] = useState<IShortGoal[]>(listData?.goals || []);
	const [searchQuery, setSearchQuery] = useState('');
	const [searchResults, setSearchResults] = useState<IGoal[]>([]);
	const [, setIsSearching] = useState(false);

	// Добавляем состояние для перехода к созданию цели
	const [canCreateGoal, setCanCreateGoal] = useState(false);

	// Инициализация данных списка при загрузке компонента
	useEffect(() => {
		// Загрузка комплексности из списка
		const complexityIndex = selectComplexity.findIndex((c) => c.value === listData.complexity);
		if (complexityIndex !== -1) {
			setActiveComplexity(complexityIndex);
		}
	}, [listData]);

	const handleTitleChange = (value: string) => {
		setTitle(value);
	};

	// Загрузка категорий при монтировании компонента
	useEffect(() => {
		const loadCategories = async () => {
			try {
				const data = await getCategories();
				if (data.success) {
					setCategories(data.data);

					// Находим индекс категории списка в загруженных категориях
					const categoryIndex = data.data.findIndex((cat: ICategory) => cat.id === listData.category.id);
					if (categoryIndex !== -1) {
						setActiveCategory(categoryIndex);
					}
				}
			} catch (error) {
				NotificationStore.addNotification({
					type: 'error',
					title: 'Ошибка',
					message: 'Не удалось загрузить категории',
				});
			}
		};

		loadCategories();
	}, [listData.category.id]);

	// Фильтрация подкатегорий при изменении категории
	useEffect(() => {
		if (activeCategory !== null) {
			const loadSubcategories = async () => {
				const data = await getCategory(categories[activeCategory].nameEn);
				if (data.success) {
					setSubcategories(data.data.subcategories);

					// Проверяем, является ли категория списка подкатегорией
					if (listData.category.parentCategory) {
						const subcategoryIndex = data.data.subcategories.findIndex(
							(subcat: ICategory) => subcat.id === listData.category.id
						);
						if (subcategoryIndex !== -1) {
							setActiveSubcategory(subcategoryIndex);
						}
					}
				}
			};
			loadSubcategories();
		}
	}, [activeCategory, categories, listData.category.id, listData.category?.parentCategory]);

	// Обновляем эффект для проверки возможности создания цели
	useEffect(() => {
		setCanCreateGoal(activeCategory !== null);
	}, [activeCategory]);

	// Функция для поиска целей с дебаунсом
	const debouncedSearch = useCallback(
		debounce(async (query: string) => {
			if (query.length < 3) {
				setSearchResults([]);
				setIsSearching(false);
				return;
			}

			try {
				const response = await getSimilarGoals(query);

				if (response.success && response.data?.results) {
					// Фильтруем результаты, исключая уже выбранные цели
					const filteredResults = response.data.results.filter(
						(goal: IGoal) => !selectedGoals.some((selected: IShortGoal) => selected.id === goal.id)
					);
					setSearchResults(filteredResults);
				}
			} catch (error) {
				console.error('Ошибка при поиске целей:', error);
			} finally {
				setIsSearching(false);
			}
		}, 500),
		[selectedGoals]
	);

	// Вызов поиска при изменении запроса
	useEffect(() => {
		if (searchQuery) {
			setIsSearching(true);
			debouncedSearch(searchQuery);
		} else {
			setSearchResults([]);
		}
	}, [searchQuery, debouncedSearch]);

	const onDrop = useCallback((acceptedFiles: FileList) => {
		if (acceptedFiles && acceptedFiles.length > 0) {
			setImage(acceptedFiles[0]);
			setImagePreview(URL.createObjectURL(acceptedFiles[0]));
		}
	}, []);

	const handleFileInputClick = () => {
		if (fileInputRef.current && canEditAll) {
			fileInputRef.current.click();
		}
	};

	const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		if (event.target.files) {
			onDrop(event.target.files);
		}
	};

	const removeImage = () => {
		if (canEditAll) {
			setImage(null);
			setImagePreview(listData.image); // Возвращаем оригинальное изображение
		}
	};

	// Добавление цели из результатов поиска
	const addGoalFromSearch = (goal: IGoal) => {
		setSelectedGoals((prev) => [...prev, goal]);
		setSearchResults((prev) => prev.filter((item) => item.id !== goal.id));
		setSearchQuery('');
	};

	// Удаление выбранной цели
	const removeSelectedGoal = (goalId: number) => {
		setSelectedGoals((prev) => prev.filter((goal) => goal.id !== goalId));
	};

	// Обработчик успешного создания цели
	const handleGoalCreated = (newGoal: IGoal) => {
		setSelectedGoals((prev) => [...prev, newGoal]);
		setShowAddGoalForm(false);

		NotificationStore.addNotification({
			type: 'success',
			title: 'Успех',
			message: 'Цель успешно добавлена в список',
		});
	};

	// Предотвращаем отправку формы списка целей при создании новой цели
	const handleAddGoalSubmit = (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		e.stopPropagation();
		// Обработка будет происходить внутри компонента AddGoal
	};

	// Отправка формы обновления списка целей
	const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();

		// Проверка полей только если редактирование полное
		if (canEditAll) {
			if (!title || !description || activeComplexity === null || activeCategory === null) {
				NotificationStore.addNotification({
					type: 'error',
					title: 'Ошибка',
					message: 'Заполните все обязательные поля',
				});
				return;
			}
		}

		if (selectedGoals.length === 0) {
			NotificationStore.addNotification({
				type: 'error',
				title: 'Ошибка',
				message: 'Список целей не может быть пустым',
			});
			return;
		}

		setIsLoading(true);

		try {
			const formData = new FormData();

			// Добавляем поля только если разрешено полное редактирование
			if (canEditAll) {
				formData.append('title', title);
				formData.append('description', description);

				if (activeComplexity !== null) {
					formData.append('complexity', selectComplexity[activeComplexity].value);
				}

				if (activeSubcategory !== null) {
					formData.append('category', subcategories[activeSubcategory].id.toString());
				} else if (activeCategory !== null) {
					formData.append('category', categories[activeCategory].id.toString());
				}

				// Добавляем изображение только если оно было изменено
				if (image) {
					formData.append('image', image as Blob);
				}
			}

			// Добавляем ID выбранных целей
			selectedGoals.forEach((goal) => {
				formData.append('goals[]', goal.id.toString());
			});

			const response = await updateGoalList(listData.code, formData);

			if (response.success) {
				NotificationStore.addNotification({
					type: 'success',
					title: 'Успех',
					message: 'Список целей успешно обновлен',
				});
				navigate(`/list/${response?.data?.code}`);
			} else {
				throw new Error(response.error || 'Неизвестная ошибка');
			}
		} catch (error: unknown) {
			NotificationStore.addNotification({
				type: 'error',
				title: 'Ошибка',
				message: error instanceof Error ? error.message : 'Не удалось обновить список целей',
			});
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<form className={block()} onSubmit={onSubmit}>
			<Title tag="h1" className={element('title')}>
				{canEditAll ? 'Редактирование списка целей' : 'Добавление целей в список'}
			</Title>

			<div className={element('content')}>
				<div className={element('image-section')}>
					<p className={element('field-title')}>Изображение списка</p>
					{!imagePreview ? (
						<div className={element('dropzone', {disabled: !canEditAll})}>
							<FileDrop onDrop={(files) => files && canEditAll && onDrop(files)}>
								<div
									className={element('upload-placeholder')}
									onClick={handleFileInputClick}
									role="button"
									tabIndex={canEditAll ? 0 : -1}
									aria-label="Добавить изображение"
									aria-disabled={!canEditAll}
									onKeyPress={(e) => {
										if (canEditAll && (e.key === 'Enter' || e.key === ' ')) {
											handleFileInputClick();
										}
									}}
								>
									<input
										type="file"
										ref={fileInputRef}
										style={{display: 'none'}}
										onChange={handleFileChange}
										accept="image/*"
										disabled={!canEditAll}
									/>
									<Svg icon="mount" className={element('upload-icon')} />
									<p>
										{canEditAll
											? 'Перетащите изображение сюда или кликните для выбора'
											: 'Изображение нельзя изменить (прошло более 24 часов после создания)'}
									</p>
								</div>
							</FileDrop>
						</div>
					) : (
						<div className={element('image-preview')}>
							<img src={imagePreview} alt="Предпросмотр" className={element('preview')} />
							{canEditAll && (
								<button
									type="button"
									className={element('remove-image')}
									onClick={removeImage}
									aria-label="Удалить изображение"
									onKeyDown={(e) => {
										if (e.key === 'Enter' || e.key === ' ') {
											removeImage();
										}
									}}
								>
									<Svg icon="cross" />
								</button>
							)}
						</div>
					)}
				</div>

				<div className={element('form')}>
					{canEditAll && (
						<>
							<div className={element('field-wrapper')}>
								<FieldInput
									placeholder="Введите название списка целей"
									id="goal-list-title"
									text="Название списка *"
									value={title}
									setValue={handleTitleChange}
									className={element('field')}
									required
								/>
							</div>

							<Select
								className={element('field')}
								placeholder="Выберите категорию"
								options={categories.map((cat) => ({name: cat.name, value: cat.nameEn}))}
								activeOption={activeCategory}
								onSelect={setActiveCategory}
								text="Категория *"
							/>

							{activeCategory !== null && subcategories.length > 0 && (
								<Select
									className={element('field')}
									placeholder="Выберите подкатегорию (необязательно)"
									options={subcategories.map((sub) => ({name: sub.name, value: sub.nameEn}))}
									activeOption={activeSubcategory}
									onSelect={setActiveSubcategory}
									text="Подкатегория"
								/>
							)}

							<Select
								className={element('field')}
								placeholder="Выберите сложность"
								options={selectComplexity}
								activeOption={activeComplexity}
								onSelect={setActiveComplexity}
								text="Сложность *"
							/>

							<FieldInput
								placeholder="Опишите список целей подробно"
								id="goal-list-description"
								text="Описание *"
								value={description}
								setValue={setDescription}
								className={element('field')}
								type="textarea"
								required
							/>
						</>
					)}

					<div className={element('goals-section')}>
						<Title tag="h2" className={element('subtitle')}>
							{canEditAll ? 'Редактирование целей списка' : 'Добавление целей в список'}
						</Title>

						<div className={element('search-container')}>
							<FieldInput
								placeholder="Поиск существующих целей"
								id="goal-search"
								text="Поиск целей"
								value={searchQuery}
								setValue={setSearchQuery}
								className={element('search-field')}
								iconBegin="search"
							/>

							{searchResults.length > 0 && (
								<div className={element('search-results')}>
									{searchResults.map((goal) => (
										<GoalSearchItem key={goal.id} goal={goal} onAdd={addGoalFromSearch} />
									))}
								</div>
							)}
						</div>

						<div className={element('selected-goals')}>
							<h3 className={element('section-title')}>Выбранные цели {selectedGoals.length}</h3>

							{selectedGoals.length > 0 ? (
								<div className={element('goals-list')}>
									{selectedGoals.map((goal) => (
										<div key={goal.id} className={element('goal-item')}>
											<div className={element('goal-content')}>
												<div className={element('goal-image-container')}>
													{goal.image ? (
														<img src={goal.image} alt={goal.title} className={element('goal-image')} />
													) : (
														<div className={element('goal-no-image')}>
															<Svg icon="mount" />
														</div>
													)}
												</div>
												<div className={element('goal-info')}>
													<h4 className={element('goal-title')}>{goal.title}</h4>
													<p className={element('goal-complexity')}>{getComplexity[goal.complexity]}</p>
													<p className={element('goal-description')}>{goal.shortDescription}</p>
												</div>
											</div>
											<button
												type="button"
												className={element('goal-remove-btn')}
												onClick={() => removeSelectedGoal(goal.id)}
												aria-label="Удалить цель"
												onKeyDown={(e) => {
													if (e.key === 'Enter' || e.key === ' ') {
														removeSelectedGoal(goal.id);
													}
												}}
											>
												<Svg icon="cross" />
											</button>
										</div>
									))}
								</div>
							) : (
								<div className={element('empty-message')}>
									Вы еще не добавили ни одной цели. Воспользуйтесь поиском или создайте новую цель.
								</div>
							)}
						</div>

						<div className={element('add-new-goal')}>
							{!showAddGoalForm ? (
								<Button
									theme="blue-light"
									className={element('add-goal-btn')}
									onClick={() => {
										if (canCreateGoal) {
											setShowAddGoalForm(true);
										} else {
											NotificationStore.addNotification({
												type: 'warning',
												title: 'Внимание',
												message: 'Для создания цели необходимо сначала выбрать категорию списка',
											});
										}
									}}
									type="button"
									icon="plus"
								>
									Создать новую цель
								</Button>
							) : (
								<div className={element('new-goal-form')}>
									<Title tag="h3" className={element('form-title')}>
										Создание новой цели
									</Title>

									<div className={element('embedded-add-goal-wrapper')}>
										<AddGoal
											className={element('embedded-add-goal')}
											onGoalCreated={handleGoalCreated}
											hideNavigation
											noForm
											onSubmitForm={handleAddGoalSubmit}
											initialCategory={
												activeSubcategory !== null ? subcategories[activeSubcategory] : categories[activeCategory!]
											}
											lockCategory // Блокируем выбор категории
										/>
									</div>

									<div className={element('form-buttons')}>
										<Button
											theme="blue-light"
											className={element('cancel-btn')}
											onClick={() => setShowAddGoalForm(false)}
											type="button"
										>
											Отмена
										</Button>
									</div>
								</div>
							)}
						</div>
					</div>

					<div className={element('btns-wrapper')}>
						<Button theme="blue-light" className={element('btn')} onClick={() => navigate(-1)} type="button">
							Отмена
						</Button>
						<Button theme="blue" className={element('btn')} typeBtn="submit">
							{isLoading ? 'Сохранение...' : 'Сохранить изменения'}
						</Button>
					</div>
				</div>
			</div>
		</form>
	);
};

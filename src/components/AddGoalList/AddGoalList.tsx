import {FC, FormEvent, useCallback, useEffect, useState} from 'react';
import {useDropzone} from 'react-dropzone';
import {useNavigate} from 'react-router-dom';

import {Button} from '@/components/Button/Button';
import {FieldInput} from '@/components/FieldInput/FieldInput';
import {Svg} from '@/components/Svg/Svg';
import {useBem} from '@/hooks/useBem';
import {NotificationStore} from '@/store/NotificationStore';
import {ICategory, IGoal} from '@/typings/goal';
import {getCategories} from '@/utils/api/get/getCategories';
import {getCategory} from '@/utils/api/get/getCategory';
import {getSimilarGoals} from '@/utils/api/get/getSimilarGoals';
import {postCreateGoal} from '@/utils/api/post/postCreateGoal';
import {postCreateGoalList} from '@/utils/api/post/postCreateGoalList';
import {debounce} from '@/utils/time/debounce';
import {selectComplexity} from '@/utils/values/complexity';

import {AddGoalItem} from './AddGoalItem';
import {GoalSearchItem} from './GoalSearchItem';
import Select from '../Select/Select';
import {Title} from '../Title/Title';

import './add-goal-list.scss';

interface AddGoalListProps {
	className?: string;
}

export const AddGoalList: FC<AddGoalListProps> = (props) => {
	const {className} = props;
	const navigate = useNavigate();

	const [block, element] = useBem('add-goal-list', className);
	const [title, setTitle] = useState('');
	const [description, setDescription] = useState('');
	const [activeComplexity, setActiveComplexity] = useState<number | null>(null);
	const [activeCategory, setActiveCategory] = useState<number | null>(null);
	const [activeSubcategory, setActiveSubcategory] = useState<number | null>(null);
	const [image, setImage] = useState<File | null>(null);
	const [categories, setCategories] = useState<ICategory[]>([]);
	const [subcategories, setSubcategories] = useState<ICategory[]>([]);
	const [isLoading, setIsLoading] = useState(false);

	// Состояния для работы с целями
	const [selectedGoals, setSelectedGoals] = useState<IGoal[]>([]);
	const [searchQuery, setSearchQuery] = useState('');
	const [searchResults, setSearchResults] = useState<IGoal[]>([]);
	const [isSearching, setIsSearching] = useState(false);
	const [showAddGoalForm, setShowAddGoalForm] = useState(false);
	const [newGoalTitle, setNewGoalTitle] = useState('');
	const [newGoalDescription, setNewGoalDescription] = useState('');
	const [newGoalComplexity, setNewGoalComplexity] = useState<number | null>(null);
	const [similarGoals, setSimilarGoals] = useState<IGoal[]>([]);
	const [isCheckingSimilar, setIsCheckingSimilar] = useState(false);

	// Загрузка категорий при монтировании компонента
	useEffect(() => {
		const loadCategories = async () => {
			try {
				const data = await getCategories();
				if (data.success) {
					setCategories(data.data);
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
	}, []);

	// Фильтрация подкатегорий при изменении категории
	useEffect(() => {
		if (activeCategory !== null) {
			const loadSubcategories = async () => {
				const data = await getCategory(categories[activeCategory].nameEn);
				if (data.success) {
					setSubcategories(data.data.subcategories);
				}
				setActiveSubcategory(null);
			};
			loadSubcategories();
		}
	}, [activeCategory, categories]);

	// Функция для поиска целей с дебаунсом
	const debouncedSearch = useCallback(
		debounce(async (query: string) => {
			if (query.length < 3) {
				setSearchResults([]);
				setIsSearching(false);
				return;
			}

			try {
				const response = await fetch(`/api/goals/search/?query=${encodeURIComponent(query)}`);
				const data = await response.json();

				if (data.results) {
					// Фильтруем результаты, исключая уже выбранные цели
					const filteredResults = data.results.filter(
						(goal: IGoal) => !selectedGoals.some((selected) => selected.id === goal.id)
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

	// Функция для проверки похожих целей с дебаунсом
	const debouncedCheckSimilar = useCallback(
		debounce(async (goalTitle: string) => {
			if (goalTitle.length < 3) {
				setSimilarGoals([]);
				setIsCheckingSimilar(false);
				return;
			}

			try {
				const response = await getSimilarGoals(goalTitle);
				if (response.success && response.data?.results) {
					setSimilarGoals(response.data.results);
				}
			} catch (error) {
				console.error('Ошибка при поиске похожих целей:', error);
			} finally {
				setIsCheckingSimilar(false);
			}
		}, 500),
		[]
	);

	// Вызов проверки похожих целей при изменении названия новой цели
	useEffect(() => {
		if (newGoalTitle) {
			setIsCheckingSimilar(true);
			debouncedCheckSimilar(newGoalTitle);
		} else {
			setSimilarGoals([]);
		}
	}, [newGoalTitle, debouncedCheckSimilar]);

	const onDrop = useCallback((acceptedFiles: File[]) => {
		if (acceptedFiles.length > 0) {
			setImage(acceptedFiles[0]);
		}
	}, []);

	const {getRootProps, getInputProps} = useDropzone({
		onDrop,
		accept: {
			'image/*': ['.jpeg', '.jpg', '.png', '.gif'],
		},
		maxFiles: 1,
	});

	const removeImage = () => {
		setImage(null);
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

	// Добавление похожей цели вместо создания новой
	const addSimilarGoal = (goal: IGoal) => {
		if (!selectedGoals.some((selected) => selected.id === goal.id)) {
			setSelectedGoals((prev) => [...prev, goal]);
		}
		setNewGoalTitle('');
		setNewGoalDescription('');
		setNewGoalComplexity(null);
		setShowAddGoalForm(false);
		setSimilarGoals([]);
	};

	// Создание новой цели
	const createNewGoal = async () => {
		if (!newGoalTitle || !newGoalDescription || newGoalComplexity === null || activeCategory === null) {
			NotificationStore.addNotification({
				type: 'error',
				title: 'Ошибка',
				message: 'Заполните все обязательные поля для новой цели',
			});
			return;
		}

		try {
			const formData = new FormData();
			formData.append('title', newGoalTitle);
			formData.append('description', newGoalDescription);
			formData.append('complexity', selectComplexity[newGoalComplexity].value);
			formData.append('category', categories[activeCategory].id.toString());

			if (activeSubcategory !== null) {
				formData.append('subcategory', subcategories[activeSubcategory].id.toString());
			}

			const response = await postCreateGoal(formData);

			if (response.success) {
				NotificationStore.addNotification({
					type: 'success',
					title: 'Успех',
					message: 'Цель успешно создана',
				});

				// Добавляем созданную цель в список выбранных
				setSelectedGoals((prev) => [...prev, response.data]);

				// Сбрасываем форму создания цели
				setNewGoalTitle('');
				setNewGoalDescription('');
				setNewGoalComplexity(null);
				setShowAddGoalForm(false);
				setSimilarGoals([]);
			} else {
				throw new Error(response.error || 'Неизвестная ошибка');
			}
		} catch (error) {
			NotificationStore.addNotification({
				type: 'error',
				title: 'Ошибка',
				message: error instanceof Error ? error.message : 'Не удалось создать цель',
			});
		}
	};

	// Отправка формы создания списка целей
	const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();

		if (!title || !description || activeComplexity === null || activeCategory === null) {
			NotificationStore.addNotification({
				type: 'error',
				title: 'Ошибка',
				message: 'Заполните все обязательные поля',
			});
			return;
		}

		if (selectedGoals.length === 0) {
			NotificationStore.addNotification({
				type: 'error',
				title: 'Ошибка',
				message: 'Добавьте хотя бы одну цель в список',
			});
			return;
		}

		setIsLoading(true);

		try {
			const formData = new FormData();
			formData.append('title', title);
			formData.append('description', description);
			formData.append('complexity', selectComplexity[activeComplexity].value);
			formData.append('category', categories[activeCategory].id.toString());

			if (activeSubcategory !== null) {
				formData.append('subcategory', subcategories[activeSubcategory].id.toString());
			}

			if (image) {
				formData.append('image', image);
			}

			// Добавляем ID выбранных целей
			selectedGoals.forEach((goal) => {
				formData.append('goals[]', goal.id.toString());
			});

			const response = await postCreateGoalList(formData);

			if (response.success) {
				NotificationStore.addNotification({
					type: 'success',
					title: 'Успех',
					message: 'Список целей успешно создан',
				});
				navigate(`/list/${response.data.code}`);
			} else {
				throw new Error(response.error || 'Неизвестная ошибка');
			}
		} catch (error) {
			NotificationStore.addNotification({
				type: 'error',
				title: 'Ошибка',
				message: error instanceof Error ? error.message : 'Не удалось создать список целей',
			});
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<form className={block()} onSubmit={onSubmit}>
			<Title tag="h1" className={element('title')}>
				Создание нового списка целей
			</Title>

			<div className={element('content')}>
				<div className={element('image-section')}>
					<p className={element('field-title')}>Изображение списка</p>
					{!image ? (
						<div {...getRootProps({className: element('dropzone')})}>
							<input {...getInputProps()} />
							<div className={element('upload-placeholder')}>
								<Svg icon="mount" className={element('upload-icon')} />
								<p>Перетащите изображение сюда или кликните для выбора</p>
							</div>
						</div>
					) : (
						<div className={element('image-preview')}>
							<img src={URL.createObjectURL(image)} alt="Предпросмотр" className={element('preview')} />
							<button
								type="button"
								className={element('remove-image')}
								onClick={removeImage}
								aria-label="Удалить изображение"
							>
								<Svg icon="cross" />
							</button>
						</div>
					)}
				</div>

				<div className={element('form')}>
					<FieldInput
						placeholder="Введите название списка целей"
						id="goal-list-title"
						text="Название списка *"
						value={title}
						setValue={setTitle}
						className={element('field')}
						required
					/>

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

					<div className={element('goals-section')}>
						<Title tag="h2" className={element('subtitle')}>
							Добавление целей в список
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

							{isSearching && <div className={element('loading')}>Поиск...</div>}

							{searchResults.length > 0 && (
								<div className={element('search-results')}>
									{searchResults.map((goal) => (
										<GoalSearchItem key={goal.id} goal={goal} onAdd={addGoalFromSearch} />
									))}
								</div>
							)}
						</div>

						<div className={element('selected-goals')}>
							<h3 className={element('section-title')}>Выбранные цели ({selectedGoals.length})</h3>

							{selectedGoals.length > 0 ? (
								<div className={element('goals-list')}>
									{selectedGoals.map((goal) => (
										<AddGoalItem key={goal.id} goal={goal} onRemove={removeSelectedGoal} />
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
									onClick={() => setShowAddGoalForm(true)}
									type="button"
								>
									{/* <Svg icon="plus" /> */}
									Создать новую цель
								</Button>
							) : (
								<div className={element('new-goal-form')}>
									<Title tag="h3" className={element('form-title')}>
										Создание новой цели
									</Title>

									<FieldInput
										placeholder="Введите название цели"
										id="new-goal-title"
										text="Название цели *"
										value={newGoalTitle}
										setValue={setNewGoalTitle}
										className={element('field')}
									/>

									{isCheckingSimilar && <div className={element('loading')}>Проверка похожих целей...</div>}

									{similarGoals.length > 0 && (
										<div className={element('similar-goals')}>
											<h4 className={element('similar-title')}>Похожие цели</h4>
											<p className={element('similar-desc')}>
												Найдены похожие цели. Возможно, вы хотите добавить одну из них вместо создания новой:
											</p>
											<div className={element('similar-list')}>
												{similarGoals.map((goal) => (
													<GoalSearchItem key={goal.id} goal={goal} onAdd={addSimilarGoal} />
												))}
											</div>
										</div>
									)}

									<FieldInput
										placeholder="Опишите цель подробно"
										id="new-goal-description"
										text="Описание цели *"
										value={newGoalDescription}
										setValue={setNewGoalDescription}
										className={element('field')}
										type="textarea"
									/>

									<Select
										className={element('field')}
										placeholder="Выберите сложность"
										options={selectComplexity}
										activeOption={newGoalComplexity}
										onSelect={setNewGoalComplexity}
										text="Сложность *"
									/>

									<div className={element('form-buttons')}>
										<Button
											theme="blue-light"
											className={element('cancel-btn')}
											onClick={() => {
												setShowAddGoalForm(false);
												setNewGoalTitle('');
												setNewGoalDescription('');
												setNewGoalComplexity(null);
												setSimilarGoals([]);
											}}
											type="button"
										>
											Отмена
										</Button>
										<Button theme="blue" className={element('create-btn')} onClick={createNewGoal} type="button">
											Создать цель
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
						<Button theme="blue" className={element('btn')} typeBtn="submit" active={isLoading || selectedGoals.length === 0}>
							{isLoading ? 'Создание...' : 'Создать список целей (+20 опыта)'}
						</Button>
					</div>
				</div>
			</div>
		</form>
	);
};

import {FC, FormEvent, useCallback, useEffect, useState} from 'react';
import {useDropzone} from 'react-dropzone';
import {useNavigate} from 'react-router-dom';

import {Button} from '@/components/Button/Button';
import {ExternalGoalSearch} from '@/components/ExternalGoalSearch/ExternalGoalSearch';
import {FieldInput} from '@/components/FieldInput/FieldInput';
import {Svg} from '@/components/Svg/Svg';
import {useBem} from '@/hooks/useBem';
import {NotificationStore} from '@/store/NotificationStore';
import {ICategory, IGoal} from '@/typings/goal';
import {getCategories} from '@/utils/api/get/getCategories';
import {getCategory} from '@/utils/api/get/getCategory';
import {getSimilarGoals} from '@/utils/api/get/getSimilarGoals';
import {postCreateGoal} from '@/utils/api/post/postCreateGoal';
import {debounce} from '@/utils/time/debounce';
import {selectComplexity} from '@/utils/values/complexity';

import {Loader} from '../Loader/Loader';
import Select from '../Select/Select';
import {SimilarGoalItem} from '../SimilarGoalItem/SimilarGoalItem';
import {Title} from '../Title/Title';

import './add-goal.scss';

interface AddGoalProps {
	className?: string;
	onGoalCreated?: (goal: IGoal) => void;
	hideNavigation?: boolean;
	noForm?: boolean;
	onSubmitForm?: (e: FormEvent<HTMLFormElement>) => void;
}

export const AddGoal: FC<AddGoalProps> = (props) => {
	const {className, onGoalCreated, hideNavigation = false, noForm = false, onSubmitForm} = props;
	const navigate = useNavigate();

	const [block, element] = useBem('add-goal', className);
	const [title, setTitle] = useState('');
	const [description, setDescription] = useState('');
	const [activeComplexity, setActiveComplexity] = useState<number | null>(null);
	const [activeCategory, setActiveCategory] = useState<number | null>(null);
	const [activeSubcategory, setActiveSubcategory] = useState<number | null>(null);
	// const [deadline, setDeadline] = useState('');
	const [image, setImage] = useState<File | null>(null);
	const [imageUrl, setImageUrl] = useState<string | null>(null);
	const [categories, setCategories] = useState<ICategory[]>([]);
	const [subcategories, setSubcategories] = useState<ICategory[]>([]);
	const [isLoading, setIsLoading] = useState(false);

	// Новые состояния для поиска похожих целей
	const [similarGoals, setSimilarGoals] = useState<IGoal[]>([]);
	const [, setIsSearching] = useState(false);
	const [showSimilarGoals, setShowSimilarGoals] = useState(false);
	const [isTitleFocused, setIsTitleFocused] = useState(false);

	// Обработчик изменения названия цели
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

	// Функция для поиска похожих целей с дебаунсом
	const debouncedSearch = useCallback(
		debounce(async (query: string) => {
			if (query.length < 3) {
				setSimilarGoals([]);
				setIsSearching(false);
				setShowSimilarGoals(false);
				return;
			}

			try {
				const response = await getSimilarGoals(query);
				if (response.success && response?.data?.results) {
					setSimilarGoals(response.data.results);
					setShowSimilarGoals(response.data.results.length > 0 && isTitleFocused);
				}
			} catch (error) {
				console.error('Ошибка при поиске похожих целей:', error);
			} finally {
				setIsSearching(false);
			}
		}, 500),
		[isTitleFocused]
	);

	// Вызов поиска при изменении названия цели
	useEffect(() => {
		if (title) {
			setIsSearching(true);
			debouncedSearch(title);
		} else {
			setSimilarGoals([]);
			setShowSimilarGoals(false);
		}
	}, [title, debouncedSearch]);

	// Обработчики фокуса для поля ввода названия
	const handleTitleFocus = () => {
		setIsTitleFocused(true);
		if (similarGoals.length > 0) {
			setShowSimilarGoals(true);
		}
	};

	const handleTitleBlur = () => {
		// Используем setTimeout, чтобы дать время для клика по элементу списка
		setTimeout(() => {
			setIsTitleFocused(false);
			setShowSimilarGoals(false);
		}, 200);
	};

	// Функция для заполнения полей формы данными из выбранной цели
	const fillFormWithGoalData = (goal: IGoal) => {
		setTitle(goal.title);
		setDescription(goal.description);

		// Находим индекс сложности в массиве selectComplexity
		const complexityIndex = selectComplexity.findIndex((item) => item.value === goal.complexity);
		if (complexityIndex !== -1) {
			setActiveComplexity(complexityIndex);
		}

		// Находим индекс категории в массиве categories
		const categoryIndex = categories.findIndex((cat) => cat.id === goal.category.id);
		if (categoryIndex !== -1) {
			setActiveCategory(categoryIndex);

			// Загружаем подкатегории для выбранной категории
			const loadSubcategoriesAndSetSubcategory = async () => {
				const data = await getCategory(categories[categoryIndex].nameEn);
				if (data.success) {
					setSubcategories(data.data.subcategories);

					// Если у цели есть подкатегория, находим ее индекс
					if (goal.subcategory) {
						const subcategoryIndex = data.data.subcategories.findIndex((sub: ICategory) => sub.id === goal.subcategory?.id);
						if (subcategoryIndex !== -1) {
							setActiveSubcategory(subcategoryIndex);
						}
					}
				}
			};

			loadSubcategoriesAndSetSubcategory();
		}

		// Скрываем список похожих целей после выбора
		setShowSimilarGoals(false);
		setIsTitleFocused(false);

		// Показываем уведомление
		NotificationStore.addNotification({
			type: 'warning',
			title: 'Данные заполнены',
			message: 'Поля формы заполнены данными выбранной цели. Вы можете изменить их перед созданием.',
		});
	};

	const onDrop = useCallback((acceptedFiles: File[]) => {
		if (acceptedFiles.length > 0) {
			setImage(acceptedFiles[0]);
			setImageUrl(null); // Сбрасываем URL изображения при загрузке локального файла
		}
	}, []);

	const {getRootProps, getInputProps} = useDropzone({
		onDrop,
		accept: {
			'image/*': ['.jpeg', '.jpg', '.png', '.gif'],
		},
		maxFiles: 1,
	});

	const resetForm = () => {
		setTitle('');
		setDescription('');
		setActiveComplexity(null);
		setActiveCategory(null);
		setActiveSubcategory(null);
		setImage(null);
		setImageUrl(null);
		setSimilarGoals([]);
	};

	const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();

		// Если передан внешний обработчик, используем его
		if (onSubmitForm) {
			onSubmitForm(e);
			return;
		}

		if (!title || !description || activeComplexity === null || activeCategory === null || (!image && !imageUrl)) {
			NotificationStore.addNotification({
				type: 'error',
				title: 'Ошибка',
				message: 'Заполните все обязательные поля',
			});
			return;
		}

		setIsLoading(true);

		try {
			const formData = new FormData();
			formData.append('title', title);
			formData.append('description', description);

			if (activeComplexity !== null) {
				formData.append('complexity', selectComplexity[activeComplexity].value);
			}

			if (activeCategory !== null) {
				formData.append('category', categories[activeCategory].id.toString());
			}

			if (activeSubcategory !== null) {
				formData.append('subcategory', subcategories[activeSubcategory].id.toString());
			}

			// if (deadline) {
			// 	formData.append('deadline', new Date(deadline).toISOString());
			// }

			// Если есть локальное изображение, добавляем его в formData
			if (image) {
				formData.append('image', image as Blob);
			}
			// Если есть URL изображения, добавляем его в formData
			else if (imageUrl) {
				formData.append('image_url', imageUrl);
			}

			const response = await postCreateGoal(formData);

			if (response.success) {
				NotificationStore.addNotification({
					type: 'success',
					title: 'Успех',
					message: 'Цель успешно создана',
				});

				// Если передан обработчик создания цели, вызываем его
				if (onGoalCreated && response.data) {
					onGoalCreated(response.data);
					resetForm();
				} else if (!hideNavigation) {
					// Если не нужно скрывать навигацию, переходим на страницу цели
					navigate(`/goals/${response.data.code}`);
				}
			} else {
				// Упрощаем обработку ошибок, так как теперь бэкенд должен корректно обрабатывать любые названия
				throw new Error(response.error || 'Неизвестная ошибка');
			}
		} catch (error: unknown) {
			NotificationStore.addNotification({
				type: 'error',
				title: 'Ошибка',
				message: error instanceof Error ? error.message : 'Не удалось создать цель',
			});
		} finally {
			setIsLoading(false);
		}
	};

	// Метод для программного создания цели
	const createGoal = async () => {
		if (!title || !description || activeComplexity === null || activeCategory === null || (!image && !imageUrl)) {
			NotificationStore.addNotification({
				type: 'error',
				title: 'Ошибка',
				message: 'Заполните все обязательные поля',
			});
			return;
		}

		setIsLoading(true);

		try {
			const formData = new FormData();
			formData.append('title', title);
			formData.append('description', description);

			if (activeComplexity !== null) {
				formData.append('complexity', selectComplexity[activeComplexity].value);
			}

			if (activeCategory !== null) {
				formData.append('category', categories[activeCategory].id.toString());
			}

			if (activeSubcategory !== null) {
				formData.append('subcategory', subcategories[activeSubcategory].id.toString());
			}

			// Если есть локальное изображение, добавляем его в formData
			if (image) {
				formData.append('image', image as Blob);
			}
			// Если есть URL изображения, добавляем его в formData
			else if (imageUrl) {
				formData.append('image_url', imageUrl);
			}

			const response = await postCreateGoal(formData);

			if (response.success) {
				NotificationStore.addNotification({
					type: 'success',
					title: 'Успех',
					message: 'Цель успешно создана',
				});

				// Если передан обработчик создания цели, вызываем его
				if (onGoalCreated && response.data) {
					onGoalCreated(response.data);
					resetForm();
				} else if (!hideNavigation) {
					// Если не нужно скрывать навигацию, переходим на страницу цели
					navigate(`/goals/${response.data.code}`);
				}
			} else {
				// Упрощаем обработку ошибок, так как теперь бэкенд должен корректно обрабатывать любые названия
				throw new Error(response.error || 'Неизвестная ошибка');
			}
		} catch (error: unknown) {
			NotificationStore.addNotification({
				type: 'error',
				title: 'Ошибка',
				message: error instanceof Error ? error.message : 'Не удалось создать цель',
			});
		} finally {
			setIsLoading(false);
		}
	};

	// Обработчик для добавления цели из внешнего источника
	const handleExternalGoalSelected = (
		goalData: Partial<IGoal> & {imageUrl?: string; external_id?: string | number; externalType?: string}
	) => {
		// Заполняем форму данными из внешней цели
		setTitle(goalData.title || '');
		setDescription(goalData.description || '');

		// Находим индекс сложности в массиве selectComplexity
		if (goalData.complexity) {
			const complexityIndex = selectComplexity.findIndex((item) => item.value === goalData.complexity);
			if (complexityIndex !== -1) {
				setActiveComplexity(complexityIndex);
			}
		}

		// Если у цели есть категория, находим ее индекс
		if (goalData.category) {
			const categoryIndex = categories.findIndex((cat) => cat.id === goalData.category?.id);
			if (categoryIndex !== -1) {
				setActiveCategory(categoryIndex);

				// Загружаем подкатегории для выбранной категории
				const loadSubcategoriesAndSetSubcategory = async () => {
					const data = await getCategory(categories[categoryIndex].nameEn);
					if (data.success) {
						setSubcategories(data.data.subcategories);

						// Если у цели есть подкатегория, находим ее индекс
						if (goalData.subcategory) {
							const subcategoryIndex = data.data.subcategories.findIndex(
								(sub: ICategory) => sub.id === goalData.subcategory?.id
							);
							if (subcategoryIndex !== -1) {
								setActiveSubcategory(subcategoryIndex);
							}
						}
					}
				};

				loadSubcategoriesAndSetSubcategory();
			}
		}

		// Сохраняем URL изображения, если он есть
		if (goalData.imageUrl) {
			setImageUrl(goalData.imageUrl);
			setImage(null); // Сбрасываем локально загруженное изображение
		} else if (goalData.image) {
			setImageUrl(goalData.image);
			setImage(null); // Сбрасываем локально загруженное изображение
		}

		// Показываем уведомление
		NotificationStore.addNotification({
			type: 'success',
			title: 'Готово',
			message: 'Данные цели загружены! Проверьте и дополните при необходимости.',
		});
	};

	// Содержимое компонента
	const content = (
		<>
			{!hideNavigation && (
				<Title tag="h1" className={element('title')}>
					Создание новой цели
				</Title>
			)}
			<Loader isLoading={isLoading}>
				<div className={element('content')}>
					{/* Добавляем компонент поиска внешних целей */}
					<div className={element('external-search-section')}>
						<ExternalGoalSearch onGoalSelected={handleExternalGoalSelected} className={element('external-search')} />
					</div>

					<div className={element('image-section')}>
						<p className={element('field-title')}>Изображение цели *</p>
						{!image && !imageUrl ? (
							<div {...getRootProps({className: element('dropzone')})}>
								<input {...getInputProps()} />
								<div className={element('upload-placeholder')}>
									<Svg icon="mount" className={element('upload-icon')} />
									<p>Перетащите изображение сюда или кликните для выбора (обязательно)</p>
								</div>
							</div>
						) : (
							<div className={element('image-preview')}>
								{image && <img src={URL.createObjectURL(image)} alt="Предпросмотр" className={element('preview')} />}
								{imageUrl && !image && (
									<img src={imageUrl} alt="Предпросмотр из источника" className={element('preview')} />
								)}
								<Button
									className={element('remove-image')}
									type="button-close"
									onClick={() => {
										setImage(null);
										setImageUrl(null);
									}}
								/>
							</div>
						)}
					</div>
					<div className={element('form')}>
						<div className={element('field-container')}>
							<FieldInput
								placeholder="Введите название цели"
								id="goal-title"
								text="Название цели *"
								value={title}
								setValue={handleTitleChange}
								className={element('field')}
								required
								onFocus={handleTitleFocus}
								onBlur={handleTitleBlur}
							/>

							{/* {isSearching && (
								<div className={element('searching')}>
									<Svg icon="loading" className={element('loading-icon')} />
									Поиск похожих целей...
								</div>
							)} */}

							{showSimilarGoals && (
								<div className={element('similar-goals')}>
									<div className={element('similar-header')}>
										<h3 className={element('similar-title')}>Похожие цели</h3>
										<button
											type="button"
											className={element('close-similar')}
											onClick={() => setShowSimilarGoals(false)}
											aria-label="Закрыть"
										>
											<Svg icon="cross" />
										</button>
									</div>
									<p className={element('similar-desc')}>
										Найдены похожие цели. Нажмите на цель, чтобы заполнить форму её данными:
									</p>
									<div className={element('similar-list')}>
										{similarGoals.map((goal) => (
											<SimilarGoalItem key={goal.id} goal={goal} onSelect={fillFormWithGoalData} />
										))}
									</div>
								</div>
							)}
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
							placeholder="Опишите цель подробно"
							id="goal-description"
							text="Описание *"
							value={description}
							setValue={setDescription}
							className={element('field')}
							type="textarea"
							required
						/>

						{/* <FieldInput
						placeholder="Выберите дату (необязательно)"
						id="goal-deadline"
						text="Дедлайн"
						value={deadline}
						setValue={setDeadline}
						className={element('field')}
						type="date"
					/> */}

						<div className={element('btns-wrapper')}>
							{!hideNavigation && (
								<Button theme="blue-light" className={element('btn')} onClick={() => navigate(-1)} type="button">
									Отмена
								</Button>
							)}
							<Button
								theme="blue"
								className={element('btn')}
								typeBtn="submit"
								onClick={
									noForm
										? (e) => {
												e.preventDefault();
												createGoal();
										  }
										: undefined
								}
							>
								Создать цель (+15 опыта)
							</Button>
						</div>
					</div>
				</div>
			</Loader>
		</>
	);

	// Возвращаем содержимое с оберткой form или без нее
	return noForm ? (
		<div className={block()}>{content}</div>
	) : (
		<form className={block()} onSubmit={onSubmit}>
			{content}
		</form>
	);
};

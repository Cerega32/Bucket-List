import {FC, FormEvent, useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {FileDrop} from 'react-file-drop';
import {useNavigate} from 'react-router-dom';

import {Button} from '@/components/Button/Button';
import {FieldInput} from '@/components/FieldInput/FieldInput';
import {Svg} from '@/components/Svg/Svg';
import {useBem} from '@/hooks/useBem';
import {NotificationStore} from '@/store/NotificationStore';
import {ThemeStore} from '@/store/ThemeStore';
import {ICategory, IGoal} from '@/typings/goal';
import {deleteGoal} from '@/utils/api/delete/deleteGoal';
import {getAllCategories} from '@/utils/api/get/getCategories';
import {updateGoal} from '@/utils/api/put/updateGoal';
import {validateTimeInput} from '@/utils/time/formatEstimatedTime';
import {selectComplexity} from '@/utils/values/complexity';

import {Loader} from '../Loader/Loader';
import {ModalConfirm} from '../ModalConfirm/ModalConfirm';
import Select from '../Select/Select';
import {Title} from '../Title/Title';

import '../AddGoal/add-goal.scss';

interface EditGoalProps {
	goal: IGoal;
	className?: string;
	onGoalUpdated?: (goal: IGoal) => void;
	cancelEdit?: () => void;
}

export const EditGoal: FC<EditGoalProps> = (props) => {
	const {goal, className, onGoalUpdated, cancelEdit} = props;
	const navigate = useNavigate();

	const [block, element] = useBem('add-goal', className); // Используем те же стили, что и для добавления
	const [title, setTitle] = useState(goal.title || '');
	const [description, setDescription] = useState(goal.description || '');
	const [estimatedTime, setEstimatedTime] = useState(goal.estimatedTime || '');
	const [activeComplexity, setActiveComplexity] = useState<number | null>(null);
	const [activeCategory, setActiveCategory] = useState<number | null>(null);
	const [activeSubcategory, setActiveSubcategory] = useState<number | null>(null);
	const [image, setImage] = useState<File | null>(null);
	const [imageUrl, setImageUrl] = useState<string | null>(goal.image || null);
	const [categories, setCategories] = useState<ICategory[]>([]);
	const [subcategories, setSubcategories] = useState<ICategory[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [canEdit, setCanEdit] = useState(false);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
	const {setHeader} = ThemeStore;
	const fileInputRef = useRef<HTMLInputElement | null>(null);

	// Получаем только родительские категории для основного dropdown используя useMemo для оптимизации
	const parentCategories = useMemo(() => categories.filter((cat) => !cat.parentCategory), [categories]);

	// Загрузка категорий и проверка возможности редактирования при монтировании компонента
	useEffect(() => {
		setHeader('white');
		const init = async () => {
			try {
				setIsLoading(true);

				// Используем свойство canEdit из объекта цели вместо отдельного запроса
				if (goal.isCanEdit) {
					setCanEdit(true);
				} else {
					setErrorMessage('Отредактировать цель невозможно. Возможно, прошло более 24 часов с момента создания.');
					setCanEdit(false);
				}

				// Загружаем категории
				const categoriesResponse = await getAllCategories();
				if (categoriesResponse.success) {
					setCategories(categoriesResponse.data);

					// Устанавливаем активную категорию
					if (goal.category) {
						// Определяем, является ли категория цели подкатегорией
						const goalCategory = categoriesResponse.data.find((cat: ICategory) => cat.id === goal.category.id);

						if (goalCategory) {
							if (goalCategory.parentCategory) {
								// Если это подкатегория, находим её родительскую категорию
								const parentCategoryIndex = categoriesResponse.data
									.filter((cat: ICategory) => !cat.parentCategory)
									.findIndex((cat: ICategory) => cat.id === goalCategory.parentCategory?.id);
								if (parentCategoryIndex !== -1) {
									setActiveCategory(parentCategoryIndex);
								}
							} else {
								// Если это родительская категория
								const categoryIndex = categoriesResponse.data
									.filter((cat: ICategory) => !cat.parentCategory)
									.findIndex((cat: ICategory) => cat.id === goal.category.id);
								if (categoryIndex !== -1) {
									setActiveCategory(categoryIndex);
								}
							}
						}
					}

					// Устанавливаем активную сложность
					if (goal.complexity) {
						const complexityIndex = selectComplexity.findIndex((item) => item.value === goal.complexity);
						if (complexityIndex !== -1) {
							setActiveComplexity(complexityIndex);
						}
					}
				}
			} catch (error) {
				NotificationStore.addNotification({
					type: 'error',
					title: 'Ошибка',
					message: 'Не удалось загрузить данные для редактирования',
				});
				setCanEdit(false);
			} finally {
				setIsLoading(false);
			}
		};

		init();
	}, [goal]);

	// Загрузка подкатегорий при изменении категории
	useEffect(() => {
		if (activeCategory !== null && parentCategories.length > 0 && parentCategories[activeCategory]) {
			const selectedCategory = parentCategories[activeCategory];

			// Фильтруем подкатегории из общего списка категорий
			const filteredSubcategories = categories.filter(
				(cat: ICategory) => cat.parentCategory && cat.parentCategory.id === selectedCategory.id
			);

			setSubcategories(filteredSubcategories);

			// Сбрасываем подкатегорию по умолчанию
			setActiveSubcategory(null);

			// Если у цели есть подкатегория или сама категория является подкатегорией, находим её индекс
			const goalCategory = categories.find((cat: ICategory) => cat.id === goal.category.id);

			if (goalCategory && goalCategory.parentCategory && goalCategory.parentCategory.id === selectedCategory.id) {
				// Цель имеет подкатегорию, которая принадлежит выбранной родительской категории
				const subcategoryIndex = filteredSubcategories.findIndex((sub: ICategory) => sub.id === goalCategory.id);
				if (subcategoryIndex !== -1) {
					setActiveSubcategory(subcategoryIndex);
				}
			} else if (goal.subcategory && filteredSubcategories.length > 0) {
				// У цели есть отдельная подкатегория и в новой категории есть подкатегории
				const subcategoryIndex = filteredSubcategories.findIndex((sub: ICategory) => sub.id === goal.subcategory?.id);
				if (subcategoryIndex !== -1) {
					setActiveSubcategory(subcategoryIndex);
				}
			}
		} else {
			// Если категория не выбрана или у неё нет подкатегорий
			setSubcategories([]);
			setActiveSubcategory(null);
		}
	}, [activeCategory, parentCategories.length, goal.category.id]);

	const onDrop = useCallback((acceptedFiles: FileList) => {
		if (acceptedFiles && acceptedFiles.length > 0) {
			setImage(acceptedFiles[0]);
			setImageUrl(null); // Сбрасываем URL изображения при загрузке локального файла
		}
	}, []);

	const handleFileInputClick = () => {
		if (fileInputRef.current) {
			fileInputRef.current.click();
		}
	};

	const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		if (event.target.files) {
			onDrop(event.target.files);
		}
	};

	// Функция для преобразования времени в стандартный формат HH:MM
	const convertTimeToStandardFormat = (timeString: string): string => {
		if (!timeString) return '';

		// Если уже в формате HH:MM, возвращаем как есть
		const timePattern = /^(\d{1,2}):(\d{1,2})$/;
		if (timePattern.test(timeString)) {
			const match = timeString.match(timePattern);
			if (match) {
				const hours = match[1].padStart(2, '0');
				const minutes = match[2].padStart(2, '0');
				return `${hours}:${minutes}`;
			}
		}

		// Преобразуем дни в часы (1 день = 24 часа)
		const daysPattern = /^(\d+)\s*(д|дн|дня|дней)$/i;
		const daysMatch = timeString.match(daysPattern);
		if (daysMatch) {
			const days = parseInt(daysMatch[1], 10);
			const totalHours = days * 24;
			return `${totalHours.toString().padStart(2, '0')}:00`;
		}

		// Преобразуем часы
		const hoursPattern = /^(\d+)\s*(ч|час|часа|часов)$/i;
		const hoursMatch = timeString.match(hoursPattern);
		if (hoursMatch) {
			const hours = parseInt(hoursMatch[1], 10);
			return `${hours.toString().padStart(2, '0')}:00`;
		}

		// Преобразуем минуты
		const minutesPattern = /^(\d+)\s*(м|мин|минут|минуты)$/i;
		const minutesMatch = timeString.match(minutesPattern);
		if (minutesMatch) {
			const minutes = parseInt(minutesMatch[1], 10);
			const hours = Math.floor(minutes / 60);
			const remainingMinutes = minutes % 60;
			return `${hours.toString().padStart(2, '0')}:${remainingMinutes.toString().padStart(2, '0')}`;
		}

		return timeString; // Возвращаем исходную строку, если не удалось распознать формат
	};

	const handleUpdateGoal = async (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();

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

			// Если выбрана подкатегория, используем её ID
			if (activeSubcategory !== null && subcategories[activeSubcategory]) {
				formData.append('category', subcategories[activeSubcategory].id.toString());
			}
			// Иначе используем ID основной категории
			else if (activeCategory !== null) {
				formData.append('category', parentCategories[activeCategory].id.toString());
			}

			// Если есть локальное изображение, добавляем его в formData
			if (image) {
				formData.append('image', image as Blob);
			}
			// Если есть URL изображения, добавляем его в formData
			else if (imageUrl) {
				formData.append('image_url', imageUrl);
			}

			// Если задано предполагаемое время, добавляем его в formData
			if (estimatedTime) {
				const standardTime = convertTimeToStandardFormat(estimatedTime);
				formData.append('estimated_time', standardTime);
			}

			const response = await updateGoal(goal.code, formData);

			if (response.success) {
				NotificationStore.addNotification({
					type: 'success',
					title: 'Успех',
					message: 'Цель успешно обновлена',
				});

				// Если передан обработчик обновления цели, вызываем его
				if (onGoalUpdated && response.data) {
					onGoalUpdated(response.data);
				} else {
					// Возвращаемся к просмотру цели
					navigate(`/goals/${response.data?.code}`);
				}
			} else {
				throw new Error(response.error || 'Неизвестная ошибка');
			}
		} catch (error: unknown) {
			NotificationStore.addNotification({
				type: 'error',
				title: 'Ошибка',
				message: error instanceof Error ? error.message : 'Не удалось обновить цель',
			});
		} finally {
			setIsLoading(false);
		}
	};

	const handleDeleteGoal = async () => {
		setIsLoading(true);

		try {
			const response = await deleteGoal(goal.code);

			if (response.success) {
				NotificationStore.addNotification({
					type: 'success',
					title: 'Успех',
					message: 'Цель успешно удалена',
				});

				// Возвращаемся на предыдущую страницу или на домашнюю страницу
				navigate('/');
			} else {
				throw new Error(response.error || 'Неизвестная ошибка');
			}
		} catch (error: unknown) {
			NotificationStore.addNotification({
				type: 'error',
				title: 'Ошибка',
				message: error instanceof Error ? error.message : 'Не удалось удалить цель',
			});
		} finally {
			setIsLoading(false);
		}
	};

	// Обработчик изменения предполагаемого времени
	const handleEstimatedTimeChange = (value: string) => {
		// Используем универсальную функцию валидации времени
		if (validateTimeInput(value)) {
			setEstimatedTime(value);
		}
	};

	return (
		<form className={block()} onSubmit={handleUpdateGoal}>
			<div className={element('wrapper-title')}>
				<Title tag="h1" className={element('title')}>
					Редактирование цели
				</Title>
			</div>
			<Loader isLoading={isLoading}>
				{!canEdit ? (
					<div className={element('error-message')}>
						<Svg icon="error" className={element('error-icon')} />
						<p>{errorMessage || 'Редактирование недоступно'}</p>
						<Button theme="blue" onClick={() => navigate(-1)} type="button">
							Вернуться назад
						</Button>
					</div>
				) : (
					<div className={element('content')}>
						<div className={element('image-section')}>
							<p className={element('field-title')}>Изображение цели *</p>
							{!image && !imageUrl ? (
								<div className={element('dropzone')}>
									<FileDrop onDrop={(files) => files && onDrop(files)}>
										<div
											className={element('upload-placeholder')}
											onClick={handleFileInputClick}
											role="button"
											tabIndex={0}
											aria-label="Добавить изображение"
											onKeyPress={(e) => {
												if (e.key === 'Enter' || e.key === ' ') {
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
											/>
											<Svg icon="mount" className={element('upload-icon')} />
											<p>Перетащите изображение сюда или кликните для выбора (обязательно)</p>
										</div>
									</FileDrop>
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
										withBorder
										onClick={() => {
											setImage(null);
											setImageUrl(null);
										}}
									/>
								</div>
							)}
						</div>
						<div className={element('form')}>
							<FieldInput
								placeholder="Введите название цели"
								id="goal-title"
								text="Название цели *"
								value={title}
								setValue={setTitle}
								className={element('field')}
								required
							/>

							<Select
								className={element('field')}
								placeholder="Выберите категорию"
								options={parentCategories.map((cat) => ({name: cat.name, value: cat.nameEn}))}
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
								rows={4}
							/>

							<div className={element('time-field-container')}>
								<FieldInput
									placeholder="Например: 5, 2:30, 3д5ч, 3д 5 ч, 3 дня, 5 часов"
									id="goal-estimated-time"
									text="Предполагаемое время выполнения"
									value={estimatedTime}
									setValue={handleEstimatedTimeChange}
									className={element('field')}
									type="text"
								/>
								<small className={element('format-hint')}>
									Укажите время: просто число (часы), ЧЧ:ММ (02:30), комбинации (3д5ч, 3д 5ч), или словами (3 дня, 5
									часов, 30 минут)
								</small>
							</div>

							<div className={element('btns-wrapper')}>
								<Button theme="red" className={element('btn')} onClick={() => setIsDeleteModalOpen(true)} type="button">
									Удалить цель
								</Button>
								<Button theme="blue-light" className={element('btn')} onClick={cancelEdit} type="button">
									Отмена
								</Button>
								<Button theme="blue" className={element('btn')} typeBtn="submit">
									Сохранить изменения
								</Button>
							</div>
						</div>
					</div>
				)}
			</Loader>
			<ModalConfirm
				title="Удалить цель?"
				isOpen={isDeleteModalOpen}
				onClose={() => setIsDeleteModalOpen(false)}
				themeBtn="red"
				handleBtn={handleDeleteGoal}
				textBtn="Удалить цель"
				text="Вы уверены, что хотите удалить эту цель?"
			/>
		</form>
	);
};

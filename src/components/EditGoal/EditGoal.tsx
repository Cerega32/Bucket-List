import {FC, FormEvent, useCallback, useEffect, useState} from 'react';
import {useDropzone} from 'react-dropzone';
import {useNavigate} from 'react-router-dom';

import {Button} from '@/components/Button/Button';
import {FieldInput} from '@/components/FieldInput/FieldInput';
import {Svg} from '@/components/Svg/Svg';
import {useBem} from '@/hooks/useBem';
import {NotificationStore} from '@/store/NotificationStore';
import {ThemeStore} from '@/store/ThemeStore';
import {ICategory, IGoal} from '@/typings/goal';
import {deleteGoal} from '@/utils/api/delete/deleteGoal';
import {getCategories} from '@/utils/api/get/getCategories';
import {getCategory} from '@/utils/api/get/getCategory';
import {updateGoal} from '@/utils/api/put/updateGoal';
import {selectComplexity} from '@/utils/values/complexity';

import {Loader} from '../Loader/Loader';
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
	const [activeComplexity, setActiveComplexity] = useState<number | null>(null);
	const [activeCategory, setActiveCategory] = useState<number | null>(null);
	const [activeSubcategory, setActiveSubcategory] = useState<number | null>(null);
	const [image, setImage] = useState<File | null>(null);
	const [imageUrl, setImageUrl] = useState<string | null>(goal.image || null);
	const [categories, setCategories] = useState<ICategory[]>([]);
	const [subcategories, setSubcategories] = useState<ICategory[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [canEdit, setCanEdit] = useState(false);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const {setHeader} = ThemeStore;

	// Загрузка категорий и проверка возможности редактирования при монтировании компонента
	useEffect(() => {
		setHeader('white');
		const init = async () => {
			try {
				setIsLoading(true);

				// Используем свойство canEdit из объекта цели вместо отдельного запроса
				if (goal.canEdit) {
					setCanEdit(true);
				} else {
					setErrorMessage('Отредактировать цель невозможно. Возможно, прошло более 24 часов с момента создания.');
					setCanEdit(false);
				}

				// Загружаем категории
				const categoriesResponse = await getCategories();
				if (categoriesResponse.success) {
					setCategories(categoriesResponse.data);

					// Устанавливаем активную категорию
					if (goal.category) {
						const categoryIndex = categoriesResponse.data.findIndex((cat: ICategory) => cat.id === goal.category.id);
						if (categoryIndex !== -1) {
							setActiveCategory(categoryIndex);
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
		if (activeCategory !== null) {
			const loadSubcategories = async () => {
				const data = await getCategory(categories[activeCategory].nameEn);
				if (data.success) {
					setSubcategories(data.data.subcategories);

					// Если у цели есть подкатегория, находим её индекс
					if (goal.subcategory) {
						const subcategoryIndex = data.data.subcategories.findIndex((sub: ICategory) => sub.id === goal.subcategory?.id);
						if (subcategoryIndex !== -1) {
							setActiveSubcategory(subcategoryIndex);
						}
					}
				}
			};
			loadSubcategories();
		}
	}, [activeCategory, categories, goal.subcategory]);

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
		if (!window.confirm('Вы уверены, что хотите удалить эту цель?')) {
			return;
		}

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

							<div className={element('btns-wrapper')}>
								<Button theme="red" className={element('btn')} onClick={handleDeleteGoal} type="button">
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
		</form>
	);
};

/* eslint-disable react/no-array-index-key */
import {FC, FormEvent, useCallback, useRef, useState} from 'react';
import {FileDrop} from 'react-file-drop';

import {Button} from '@/components/Button/Button';
import {FieldInput} from '@/components/FieldInput/FieldInput';
import {Svg} from '@/components/Svg/Svg';
import {useBem} from '@/hooks/useBem';
import {GoalStore} from '@/store/GoalStore';
import {ModalStore} from '@/store/ModalStore';
import {NotificationStore} from '@/store/NotificationStore';
import {deleteReview} from '@/utils/api/delete/deleteReview';
import {postAddReview} from '@/utils/api/post/postAddReview';
import {putEditReview} from '@/utils/api/put/putEditReview';
import {selectComplexity} from '@/utils/values/complexity';

import Select from '../Select/Select';
import {Title} from '../Title/Title';
import './add-review.scss';

interface AddReviewProps {
	className?: string;
	closeModal: () => void;
}

export const AddReview: FC<AddReviewProps> = (props) => {
	const {className, closeModal} = props;

	const [block, element] = useBem('add-review', className);
	const {modalProps, setFuncModal, setWindow, setIsOpen} = ModalStore;

	const editingComment = modalProps?.editComment;

	const initialComplexityIndex =
		editingComment != null ? selectComplexity.findIndex((opt) => opt.value === editingComment.complexity) : -1;

	const [activeComplexity, setActiveComplexity] = useState<number | null>(initialComplexityIndex >= 0 ? initialComplexityIndex : null);
	const [newComment, setNewComment] = useState(editingComment?.text || '');
	const [existingPhotos, setExistingPhotos] = useState(editingComment?.photos ?? []);
	const [photosToDelete, setPhotosToDelete] = useState<number[]>([]);
	const [photos, setPhotos] = useState<File[]>([]);
	const [showErrors, setShowErrors] = useState(false);
	const {setComments, comments, id} = GoalStore;
	const fileInputRef = useRef<HTMLInputElement | null>(null);

	const onDrop = useCallback(
		(acceptedFiles: FileList) => {
			const filesArray = Array.from(acceptedFiles);
			if (filesArray.length + photos.length > 10) {
				NotificationStore.addNotification({
					type: 'error',
					title: 'Слишком много фотографий',
					message: 'Можно загрузить не более 10 фотографий.',
				});
				return;
			}
			setPhotos((prevPhotos) => [...prevPhotos, ...filesArray]);
		},
		[photos]
	);

	const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();

		const isEditing = !!editingComment;

		const hasError = typeof activeComplexity !== 'number' || !newComment.trim() || (!isEditing && photos.length === 0);

		if (hasError) {
			setShowErrors(true);
			NotificationStore.addNotification({
				type: 'error',
				title: 'Ошибка',
				message: 'Заполните все обязательные поля',
			});
			return;
		}

		setShowErrors(false);

		if (isEditing && editingComment) {
			const res = await putEditReview(editingComment.id, {
				text: newComment,
				complexity: selectComplexity[activeComplexity].value,
				photosToDelete,
				newPhotos: photos,
			});

			if (res.success && res.data) {
				const updatedComment = res.data;
				NotificationStore.addNotification({
					type: 'success',
					title: 'Успешно',
					message: 'Отзыв успешно отредактирован',
				});

				setComments(comments.map((c) => (c.id === updatedComment.id ? updatedComment : c)));
				closeModal();
			} else {
				NotificationStore.addNotification({
					type: 'error',
					title: 'Ошибка',
					message: res.error || 'Не удалось отредактировать отзыв',
				});
			}
		} else {
			const formData = new FormData();
			formData.append('complexity', selectComplexity[activeComplexity].value);
			formData.append('text', newComment);
			formData.append('goal_id', id.toString());
			photos.forEach((photo) => {
				formData.append('photo', photo);
			});

			const res = await postAddReview(formData);

			if (res.success) {
				NotificationStore.addNotification({
					type: 'success',
					title: 'Успешно',
					message: 'Отзыв успешно опубликован',
				});
				closeModal();
				setComments([res.data, ...comments]);
			} else {
				NotificationStore.addNotification({
					type: 'error',
					title: 'Ошибка',
					message: (res as {error?: string}).error || 'Не удалось опубликовать отзыв',
				});
			}
		}
	};

	const deleteNewPhoto = (i: number): void => {
		setPhotos([...photos.slice(0, i), ...photos.slice(i + 1)]);
	};

	const deleteExistingPhoto = (photoId: number): void => {
		setExistingPhotos(existingPhotos.filter((p: {id: number}) => p.id !== photoId));
		setPhotosToDelete((prev) => [...prev, photoId]);
	};

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

	const handleDeleteReview = () => {
		if (!editingComment) return;

		setFuncModal(async () => {
			const res = await deleteReview(editingComment.id);
			if (res.success) {
				setComments(comments.filter((c) => c.id !== editingComment.id));
				return true;
			}
			return false;
		});

		setWindow('delete-review');
		setIsOpen(true);
	};

	return (
		<form className={block()} onSubmit={onSubmit}>
			<Title tag="h2" className={element('title')}>
				{editingComment ? 'Редактирование впечатления к цели' : 'Оставить впечатление о цели'}
			</Title>
			<Select
				className={element('field')}
				placeholder="Насколько вам было тяжело выполнить цель?"
				options={selectComplexity}
				activeOption={activeComplexity}
				onSelect={setActiveComplexity}
				text="Сложность *"
				error={showErrors && typeof activeComplexity !== 'number'}
			/>
			<FieldInput
				placeholder="Опишите свои впечатления о выполнении"
				id="new-comment"
				text="Комментарий *"
				value={newComment}
				setValue={setNewComment}
				className={element('field')}
				type="textarea"
				rows={1}
				error={showErrors && !newComment.trim()}
			/>
			<p className={element('field-title')}>Фотографии</p>
			<div className={element('dropzone')}>
				<FileDrop onDrop={(files) => files && onDrop(files)}>
					<div
						className={element('photos')}
						onClick={handleFileInputClick}
						role="button"
						tabIndex={0}
						aria-label="Добавить фотографии"
						onKeyPress={(e) => {
							if (e.key === 'Enter' || e.key === ' ') {
								handleFileInputClick();
							}
						}}
					>
						<input
							type="file"
							multiple
							ref={fileInputRef}
							style={{display: 'none'}}
							onChange={handleFileChange}
							accept="image/*"
						/>
						{existingPhotos.map((photo: {id: number; image: string}) => (
							<div key={photo.id} className={element('photo-wrapper')}>
								<img className={element('photo')} src={photo.image} alt="Фотография из отзыва" />
								<button
									className={element('delete-photo')}
									type="button"
									onClick={(e) => {
										e.stopPropagation();
										deleteExistingPhoto(photo.id);
									}}
									aria-label="Удалить фотографию"
								>
									<Svg icon="cross" />
								</button>
							</div>
						))}
						{photos.map((photo, index) => (
							<div key={`${photo.name}-${index}`} className={element('photo-wrapper')}>
								<img className={element('photo')} src={URL.createObjectURL(photo)} alt={`Фотография ${index + 1}`} />
								<button
									className={element('delete-photo')}
									type="button"
									onClick={(e) => {
										e.stopPropagation();
										deleteNewPhoto(index);
									}}
									aria-label="Удалить фотографию"
								>
									<Svg icon="cross" />
								</button>
							</div>
						))}
						<div className={element('btn-add')}>
							<Svg icon="plus" />
						</div>
					</div>
				</FileDrop>
			</div>
			<div className={element('btns-wrapper')}>
				{editingComment && (
					<Button
						theme="blue-light"
						className={element('btn')}
						icon="trash"
						width="auto"
						typeBtn="button"
						onClick={handleDeleteReview}
						size="medium"
					>
						Удалить отзыв
					</Button>
				)}
				<div className={element('btns-right', {full: !editingComment})}>
					<Button theme="blue-light" className={element('btn')} typeBtn="button" width="full" onClick={closeModal} size="medium">
						Отмена
					</Button>
					<Button theme="blue" className={element('btn')} typeBtn="submit" size="medium" width="full">
						{editingComment ? 'Обновить' : 'Опубликовать'}
					</Button>
				</div>
			</div>
		</form>
	);
};

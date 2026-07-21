/* eslint-disable react/no-array-index-key */
import {FC, FormEvent, useCallback, useRef, useState} from 'react';
import {FileDrop} from 'react-file-drop';

import {Button} from '@/components/Button/Button';
import {FieldInput} from '@/components/FieldInput/FieldInput';
import {Svg} from '@/components/Svg/Svg';
import {useBem} from '@/hooks/useBem';
import useScreenSize from '@/hooks/useScreenSize';
import {GoalStore} from '@/store/GoalStore';
import {ModalStore} from '@/store/ModalStore';
import {NotificationStore} from '@/store/NotificationStore';
import {deleteReview} from '@/utils/api/delete/deleteReview';
import {postAddReview} from '@/utils/api/post/postAddReview';
import {putEditReview} from '@/utils/api/put/putEditReview';
import {selectComplexity} from '@/utils/values/complexity';
import {COMMENT_TEXT_MAX_LENGTH} from '@/utils/values/goalConstants';

import Select from '../Select/Select';
import {Title} from '../Title/Title';
import './add-review.scss';

const MAX_REVIEW_PHOTOS = 20;

interface AddReviewProps {
	className?: string;
	closeModal: () => void;
}

export const AddReview: FC<AddReviewProps> = (props) => {
	const {className, closeModal} = props;

	const [block, element] = useBem('add-review', className);
	const {modalProps, setFuncModal, setWindow, setIsOpen} = ModalStore;

	const editingComment = modalProps?.editComment;
	const goalListId = (modalProps?.goalListId as number | undefined) || GoalStore.goalListId || undefined;
	const onReviewAdded = modalProps?.onReviewAdded as (() => void) | undefined;
	const onReviewRemoved = modalProps?.onReviewRemoved as (() => void) | undefined;
	const isListReview = !!goalListId || !!editingComment?.goalInfo?.isList;
	const {isScreenSmallMobile} = useScreenSize();
	const initialComplexityIndex =
		editingComment != null ? selectComplexity.findIndex((opt) => opt.value === editingComment.complexity) : -1;

	const [activeComplexity, setActiveComplexity] = useState<number | null>(initialComplexityIndex >= 0 ? initialComplexityIndex : null);
	const [newComment, setNewComment] = useState(editingComment?.text || '');
	const [existingPhotos, setExistingPhotos] = useState(editingComment?.photos ?? []);
	const [photosToDelete, setPhotosToDelete] = useState<number[]>([]);
	const [photos, setPhotos] = useState<File[]>([]);
	const [showErrors, setShowErrors] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const {setComments, comments, id, setMyComment} = GoalStore;
	const fileInputRef = useRef<HTMLInputElement | null>(null);
	const totalPhotoCount = existingPhotos.length + photos.length;
	const canAddPhotos = totalPhotoCount < MAX_REVIEW_PHOTOS;

	const onDrop = useCallback(
		(acceptedFiles: FileList) => {
			const filesArray = Array.from(acceptedFiles);
			if (filesArray.length + totalPhotoCount > MAX_REVIEW_PHOTOS) {
				NotificationStore.addNotification({
					type: 'error',
					title: 'Слишком много фотографий',
					message: `Можно загрузить не более ${MAX_REVIEW_PHOTOS} фотографий.`,
				});
				return;
			}
			setPhotos((prevPhotos) => [...prevPhotos, ...filesArray]);
		},
		[totalPhotoCount]
	);

	const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();

		const isEditing = !!editingComment;

		const hasError = typeof activeComplexity !== 'number' || !newComment.trim();

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
		setIsSubmitting(true);

		try {
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

					setMyComment(updatedComment);
					setComments(comments.map((c) => (c.id === updatedComment.id ? updatedComment : c)));
					onReviewAdded?.();
					closeModal();
				}
				// Ошибка уже показана в fetchData
			} else {
				const formData = new FormData();
				formData.append('complexity', selectComplexity[activeComplexity].value);
				formData.append('text', newComment);
				if (goalListId) {
					formData.append('goal_list_id', goalListId.toString());
				} else {
					formData.append('goal_id', id.toString());
				}
				photos.forEach((photo) => {
					formData.append('photo', photo);
				});

				const res = await postAddReview(formData);

				if (res.success && res.data) {
					NotificationStore.addNotification({
						type: 'success',
						title: 'Успешно',
						message: 'Отзыв успешно опубликован',
					});
					setMyComment(res.data);
					onReviewAdded?.();
					closeModal();
				}
				// Ошибка уже показана в fetchData
			}
		} finally {
			setIsSubmitting(false);
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
		if (!canAddPhotos || !fileInputRef.current) {
			return;
		}
		fileInputRef.current.click();
	};

	const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const {files} = event.target;
		if (files) {
			onDrop(files);
		}
		if (fileInputRef.current) {
			fileInputRef.current.value = '';
		}
	};

	const handleDeleteReview = () => {
		if (!editingComment) return;

		setFuncModal(async () => {
			const res = await deleteReview(editingComment.id);
			if (res.success) {
				setMyComment(null);
				setComments(comments.filter((c) => c.id !== editingComment.id));
				onReviewRemoved?.();
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
				{editingComment
					? isListReview
						? 'Редактирование впечатления к списку'
						: 'Редактирование впечатления к цели'
					: isListReview
					? 'Оставить впечатление о списке'
					: 'Оставить впечатление о цели'}
			</Title>
			<Select
				className={element('field')}
				placeholder={isListReview ? 'Насколько вам было тяжело выполнить список?' : 'Насколько вам было тяжело выполнить цель?'}
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
				rows={isScreenSmallMobile ? 2 : 1}
				maxLength={COMMENT_TEXT_MAX_LENGTH}
				showCharCount
				error={showErrors && !newComment.trim()}
			/>
			<p className={element('field-title')}>Фотографии</p>
			<div className={element('dropzone')}>
				<FileDrop onDrop={(files) => files && canAddPhotos && onDrop(files)}>
					<div className={element('photos')}>
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
						{canAddPhotos && (
							<button
								type="button"
								className={element('btn-add')}
								onClick={handleFileInputClick}
								aria-label="Добавить фотографии"
							>
								<Svg icon="plus" />
							</button>
						)}
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
					<Button
						theme="blue-light"
						className={element('btn')}
						typeBtn="button"
						width="full"
						onClick={closeModal}
						size="medium"
						disabled={isSubmitting}
					>
						Отмена
					</Button>
					<Button
						theme="blue"
						className={element('btn')}
						typeBtn="submit"
						size="medium"
						width="full"
						loading={isSubmitting}
						loadingText={editingComment ? 'Обновление...' : 'Публикация...'}
						disabled={isSubmitting}
					>
						{editingComment ? 'Обновить' : 'Опубликовать'}
					</Button>
				</div>
			</div>
		</form>
	);
};

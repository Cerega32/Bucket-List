import {FC, FormEvent, useCallback, useState} from 'react';
import {useDropzone} from 'react-dropzone';

import {Button} from '@/components/Button/Button';
import {FieldInput} from '@/components/FieldInput/FieldInput';
import {Svg} from '@/components/Svg/Svg';
import {useBem} from '@/hooks/useBem';
import {GoalStore} from '@/store/GoalStore';
import {NotificationStore} from '@/store/NotificationStore';
import {postAddReview} from '@/utils/api/post/postAddReview';
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
	const [activeComplexity, setActiveComplexity] = useState<number | null>(null);
	const [newComment, setNewComment] = useState('');
	const [photos, setPhotos] = useState<File[]>([]);
	const {setComments, comments, id} = GoalStore;

	const onDrop = useCallback(
		(acceptedFiles: File[]) => {
			if (acceptedFiles.length + photos.length > 10) {
				NotificationStore.addNotification({
					type: 'error',
					title: 'Слишком много фотографий',
					message: 'Можно загрузить не более 10 фотографий.',
				});
				return;
			}
			setPhotos((prevPhotos) => [...prevPhotos, ...acceptedFiles]);
		},
		[photos]
	);

	const {getRootProps, getInputProps} = useDropzone({onDrop});

	const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		if (typeof activeComplexity !== 'number') {
			return;
		}

		const formData = new FormData();
		formData.append('complexity', selectComplexity[activeComplexity].value);
		formData.append('text', newComment);
		formData.append('goal_id', id.toString());
		photos.forEach((photo) => {
			formData.append('photo', photo);
		});

		const res = await postAddReview(formData);

		if (res.success) {
			closeModal();
			setComments([res.data, ...comments]);
		}
	};

	const deletePhoto = (e: React.MouseEvent<HTMLButtonElement>, i: number): void => {
		e.stopPropagation();
		setPhotos([...photos.slice(0, i), ...photos.slice(i + 1)]);
	};

	return (
		<form className={block()} onSubmit={onSubmit}>
			<Title tag="h2" className={element('title')}>
				Написать отзыв к цели
			</Title>
			<Select
				className={element('field')}
				placeholder="Насколько вам было тяжело выполнить цель?"
				options={selectComplexity}
				activeOption={activeComplexity}
				onSelect={setActiveComplexity}
				text="Сложность"
			/>
			<FieldInput
				placeholder="Опишите свои впечатления о выполнении"
				id="new-comment"
				text="Комментарий"
				value={newComment}
				setValue={setNewComment}
				className={element('field')}
				type="textarea"
			/>
			<p className={element('field-title')}>Фотографии</p>
			<div {...getRootProps({className: element('dropzone')})}>
				<input {...getInputProps()} />
				<div className={element('photos')}>
					<div className={element('btn-add')}>
						<Svg icon="plus" />
					</div>
					{photos.map((photo, index) => (
						<div key={`${photo.name}-${photo.lastModified}`} className={element('photo-wrapper')}>
							<img className={element('photo')} src={URL.createObjectURL(photo)} alt={`Фотография ${index + 1}`} />
							<button
								className={element('delete-photo')}
								type="button"
								onClick={(e) => deletePhoto(e, index)}
								aria-label="Удалить фотографию"
							>
								<Svg icon="cross" />
							</button>
						</div>
					))}
				</div>
			</div>
			<div className={element('btns-wrapper')}>
				<Button theme="blue-light" className={element('btn')} onClick={closeModal}>
					Отмена
				</Button>
				<Button theme="blue" className={element('btn')} typeBtn="submit">
					Опубликовать (+10 опыта)
				</Button>
			</div>
		</form>
	);
};

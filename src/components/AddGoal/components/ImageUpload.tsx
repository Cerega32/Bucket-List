import {FC, useCallback, useRef} from 'react';
import {FileDrop} from 'react-file-drop';

import {Button} from '@/components/Button/Button';
import {Svg} from '@/components/Svg/Svg';
import {useBem} from '@/hooks/useBem';

interface ImageUploadProps {
	className?: string;
	image: File | null;
	setImage: (value: File | null) => void;
	imageUrl: string | null;
	setImageUrl: (value: string | null) => void;
}

export const ImageUpload: FC<ImageUploadProps> = (props) => {
	const {className, image, setImage, imageUrl, setImageUrl} = props;

	const [, element] = useBem('add-goal', className);
	const fileInputRef = useRef<HTMLInputElement | null>(null);

	const onDrop = useCallback(
		(acceptedFiles: FileList) => {
			if (acceptedFiles && acceptedFiles.length > 0) {
				setImage(acceptedFiles[0]);
				setImageUrl(null); // Сбрасываем URL изображения при загрузке локального файла
			}
		},
		[setImage, setImageUrl]
	);

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

	return (
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
							<input type="file" ref={fileInputRef} style={{display: 'none'}} onChange={handleFileChange} accept="image/*" />
							<Svg icon="mount" className={element('upload-icon')} />
							<p>Перетащите изображение сюда или кликните для выбора (обязательно)</p>
						</div>
					</FileDrop>
				</div>
			) : (
				<div className={element('image-preview')}>
					{image && <img src={URL.createObjectURL(image)} alt="Предпросмотр" className={element('preview')} />}
					{imageUrl && !image && <img src={imageUrl} alt="Предпросмотр из источника" className={element('preview')} />}
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
	);
};

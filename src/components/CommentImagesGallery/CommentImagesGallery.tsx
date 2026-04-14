import {FC, useState} from 'react';
import {Navigation} from 'swiper/modules';
import {Swiper, SwiperSlide} from 'swiper/react';

import {LightboxWithScrollLock} from '@/components/LightboxWithScrollLock/LightboxWithScrollLock';
import {useBem} from '@/hooks/useBem';
import {useSwiperNavigation} from '@/hooks/useSwiperNavigation';

import {Button} from '../Button/Button';

import '../CommentGoal/comment-goal.scss';

import './comment-images-gallery.scss';

export interface CommentImagesGallerySlide {
	src: string;
	id?: number;
}

interface CommentImagesGalleryProps {
	images: CommentImagesGallerySlide[] | string[];
	navSuffix: string;
	imageBig?: boolean;
	imageShowcase?: boolean;
}

export const CommentImagesGallery: FC<CommentImagesGalleryProps> = ({images, navSuffix, imageBig, imageShowcase}) => {
	const [, element] = useBem('comment-goal');
	const [isOpen, setIsOpen] = useState(false);
	const [photoIndex, setPhotoIndex] = useState(0);
	const {updateSwiperState, isPrevDisabled, isNextDisabled, isPrevHardDisabled, isNextHardDisabled, canScroll} = useSwiperNavigation();

	const slides = images.map((img) => (typeof img === 'string' ? {src: img} : {src: img.src, id: img.id}));
	const prevSelector = `comment-goal__prev-${navSuffix}`;
	const nextSelector = `comment-goal__next-${navSuffix}`;

	const openLightbox = (index: number) => {
		setPhotoIndex(index);
		setIsOpen(true);
	};

	return (
		<div className={element('comment-images-container')}>
			<Button
				theme="blue-light"
				icon="arrow--bottom"
				width="auto"
				className={`${element('prev', {
					disabled: !canScroll || isPrevDisabled,
					'hard-disabled': !canScroll || isPrevHardDisabled,
				})} ${prevSelector}`}
			/>
			<Button
				theme="blue-light"
				icon="arrow"
				width="auto"
				className={`${element('next', {
					disabled: !canScroll || isNextDisabled,
					'hard-disabled': !canScroll || isNextHardDisabled,
				})} ${nextSelector}`}
			/>
			<Swiper
				modules={[Navigation]}
				spaceBetween={8}
				slidesPerView="auto"
				watchSlidesProgress
				navigation={{prevEl: `.${prevSelector}`, nextEl: `.${nextSelector}`}}
				onSwiper={updateSwiperState}
				onSlideChange={updateSwiperState}
				onResize={updateSwiperState}
				onReachEnd={updateSwiperState}
				onReachBeginning={updateSwiperState}
				onFromEdge={updateSwiperState}
				className={element('comment-images')}
			>
				{slides.map((slide, index) => (
					<SwiperSlide key={slide.id ?? `${slide.src}-${index}`}>
						<button type="button" className={element('comment-img-btn')} onClick={() => openLightbox(index)}>
							<img
								src={slide.src}
								alt="Фото впечатления"
								className={element('comment-img', {big: imageBig, showcase: imageShowcase})}
							/>
						</button>
					</SwiperSlide>
				))}
			</Swiper>
			<LightboxWithScrollLock
				open={isOpen}
				close={() => setIsOpen(false)}
				slides={slides}
				index={photoIndex}
				className="comment-images-gallery__lightbox"
				carousel={{finite: true, padding: '16px'}}
				controller={{closeOnBackdropClick: true}}
				animation={{fade: 300}}
				render={{buttonPrev: () => null, buttonNext: () => null}}
			/>
		</div>
	);
};

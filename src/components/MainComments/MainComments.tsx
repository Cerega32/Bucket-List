import {FC} from 'react';
import 'swiper/css';
import 'swiper/css/navigation';
import {Navigation} from 'swiper/modules';
import {Swiper, SwiperSlide} from 'swiper/react';

import {useBem} from '@/hooks/useBem';
import {IComment} from '@/typings/comments';

import {Button} from '../Button/Button';
import {CommentGoal} from '../CommentGoal/CommentGoal';
import {Title} from '../Title/Title';
import './main-comments.scss';
import useScreenSize from '@/hooks/useScreenSize';

interface MainCommentsProps {
	className?: string;
	comments: IComment[];
}

export const MainComments: FC<MainCommentsProps> = (props) => {
	const {className, comments} = props;
	const [block, element] = useBem('main-comments', className);
	const {isScreenMobile} = useScreenSize();

	if (!comments.length) {
		return null;
	}

	return (
		<section className={block()}>
			<Title tag="h2" className={element('title')}>
				Реальные истории. Реальные победы
			</Title>
			<div className={element('slider-container')}>
				<Swiper
					modules={[Navigation]}
					spaceBetween={isScreenMobile ? 12 : 24}
					slidesPerView="auto"
					navigation={{
						nextEl: '.main-comments__next',
						prevEl: '.main-comments__prev',
					}}
					centeredSlides
					loop
					// breakpoints={{
					// 	768: {
					// 		slidesPerView: 2,
					// 	},
					// 	1200: {
					// 		slidesPerView: 3,
					// 	},
					// }}
					className={element('slider')}
				>
					{comments.map((comment, index) => (
						// eslint-disable-next-line react/no-array-index-key
						<SwiperSlide key={`${comment.id}-${index}`} className={element('slide')}>
							<CommentGoal comment={comment} className={element('comment')} isMain />
						</SwiperSlide>
					))}
				</Swiper>

				<div className={element('navigation')}>
					<Button theme="blue-light" icon="arrow--bottom" className={element('prev')} />
					<Button theme="blue-light" icon="arrow" className={element('next')} />
				</div>
			</div>
		</section>
	);
};

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

interface MainCommentsProps {
	className?: string;
	comments: IComment[];
}

export const MainComments: FC<MainCommentsProps> = (props) => {
	const {className, comments} = props;
	const [block, element] = useBem('main-comments', className);

	const handleClickScore = async (id: number, like: boolean) => {
		// Здесь должна быть логика для лайков/дизлайков комментария
		console.log('Score clicked', id, like);
	};

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
					spaceBetween={24}
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
					<div className={element('gradient-left')} />
					{comments.map((comment) => (
						<SwiperSlide key={comment.id} className={element('slide')}>
							<CommentGoal comment={comment} onClickScore={handleClickScore} className={element('comment')} isMain />
						</SwiperSlide>
					))}
					<div className={element('gradient-right')} />
				</Swiper>

				<div className={element('navigation')}>
					<Button theme="blue-light" icon="arrow--bottom" className={element('prev')} />
					<Button theme="blue-light" icon="arrow" className={element('next')} />
				</div>
			</div>
		</section>
	);
};

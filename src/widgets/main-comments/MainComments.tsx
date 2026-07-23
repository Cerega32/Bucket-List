import {FC} from 'react';
import 'swiper/css';
import 'swiper/css/navigation';
import {Navigation} from 'swiper/modules';
import {Swiper, SwiperSlide} from 'swiper/react';

import {IComment} from '@/entities/comment/model/types';
import {CommentGoal} from '@/entities/comment/ui/CommentGoal/CommentGoal';
import {useBem} from '@/shared/lib/hooks/useBem';
import useScreenSize from '@/shared/lib/hooks/useScreenSize';
import {Button} from '@/shared/ui/Button/Button';
import {Title} from '@/shared/ui/Title/Title';
import '@/widgets/main-comments/main-comments.scss';

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

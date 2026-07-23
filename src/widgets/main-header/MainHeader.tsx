import {observer} from 'mobx-react-lite';
import {FC} from 'react';

import {UserStore} from '@/entities/user/model/UserStore';
import {trackProductEvent} from '@/shared/lib/analytics/trackProductEvent';
import {METRIKA_GOALS, reachGoal} from '@/shared/lib/analytics/yandexMetrika';
import {useBem} from '@/shared/lib/hooks/useBem';
import {pluralize} from '@/shared/lib/text/pluralize';
import {ModalStore} from '@/shared/model/ModalStore';
import {Button} from '@/shared/ui/Button/Button';
import {Title} from '@/shared/ui/Title/Title';
import {VerticalSlider} from '@/shared/ui/VerticalSlider/VerticalSlider';
import {LaunchPromoBanner} from '@/widgets/launch-promo-banner/LaunchPromoBanner';
import {MainHeaderSlidersSkeleton} from '@/widgets/main-header/MainHeaderSlidersSkeleton';

import '@/widgets/main-header/main-header.scss';

const MAIN_HEADER_LEFT_SLIDER_PX_PER_SEC = 24;
const MAIN_HEADER_RIGHT_SLIDER_PX_PER_SEC = 48;

interface MainHeaderProps {
	className?: string;
	leftPhotos: any[];
	rightPhotos: any[];
	totalCompleted: number;
	isPhotosLoading?: boolean;
	isCounterLoading?: boolean;
}

export const MainHeader: FC<MainHeaderProps> = observer((props) => {
	const {className, leftPhotos, rightPhotos, totalCompleted, isPhotosLoading, isCounterLoading} = props;

	const [block, element] = useBem('main-header', className);
	const {setWindow, setIsOpen} = ModalStore;
	const {isAuth} = UserStore;

	const handleButtonClick = () => {
		if (!isAuth) {
			reachGoal(METRIKA_GOALS.startPathClick);
			trackProductEvent('reg_open', 'start_path');
			setWindow('registration');
			setIsOpen(true);
		}
	};

	return (
		<section className={block()}>
			<div className={element('slider slider-left')}>
				{isPhotosLoading ? (
					<MainHeaderSlidersSkeleton />
				) : (
					leftPhotos.length > 0 && (
						<VerticalSlider
							slides={leftPhotos.map((photo) => (
								<img className={element('slider-image')} src={photo.imageUrl} alt="Фотография из комментария" />
							))}
							direction="up"
							pixelsPerSecond={MAIN_HEADER_LEFT_SLIDER_PX_PER_SEC}
						/>
					)
				)}
			</div>
			<div className={element('info')}>
				<LaunchPromoBanner />
				<Title tag="h1" className={element('title')}>
					<>
						Превратите свои мечты в цели и начните своё путешествие в <p className={element('gradient')}>лучшую жизнь</p>
					</>
				</Title>
				<p className={element('description')}>
					В вашем профиле уже есть 100 вдохновляющих целей, а полный каталог открывает доступ к более чем 1000 целям и готовым
					спискам.
				</p>
				<Button
					className={element('button')}
					type={isAuth ? 'Link' : 'button'}
					theme="gradient"
					size="medium"
					icon="rocket"
					width="auto"
					onClick={!isAuth ? handleButtonClick : undefined}
					href="/categories/all"
				>
					Начать путь
				</Button>
				<p className={element('completed')}>
					🔥 Уже выполнено:{' '}
					<span className={element('completed-number', {blurred: isCounterLoading})}>
						{pluralize(totalCompleted, ['цель', 'цели', 'целей'])}
					</span>
				</p>
			</div>
			<div className={element('slider slider-right')}>
				{isPhotosLoading ? (
					<MainHeaderSlidersSkeleton />
				) : (
					rightPhotos.length > 0 && (
						<VerticalSlider
							slides={rightPhotos.map((photo) => (
								<img className={element('slider-image')} src={photo.imageUrl} alt="Фотография из комментария" />
							))}
							direction="down"
							pixelsPerSecond={MAIN_HEADER_RIGHT_SLIDER_PX_PER_SEC}
						/>
					)
				)}
			</div>
		</section>
	);
});

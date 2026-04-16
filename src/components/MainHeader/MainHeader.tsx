import {observer} from 'mobx-react-lite';
import {FC} from 'react';

import {useBem} from '@/hooks/useBem';
import {ModalStore} from '@/store/ModalStore';
import {UserStore} from '@/store/UserStore';
import {pluralize} from '@/utils/text/pluralize';

import {MainHeaderSlidersSkeleton} from './MainHeaderSlidersSkeleton';
import {Button} from '../Button/Button';
import {Title} from '../Title/Title';
import {VerticalSlider} from '../VerticalSlider/VerticalSlider';

import './main-header.scss';

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
							speed={60}
						/>
					)
				)}
			</div>
			<div className={element('info')}>
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
							speed={60}
						/>
					)
				)}
			</div>
		</section>
	);
});

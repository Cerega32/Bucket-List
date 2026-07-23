import {FC, useEffect, useState} from 'react';

import {useBem} from '@/shared/lib/hooks/useBem';
import {Svg} from '@/shared/ui/Svg/Svg';
import '@/shared/ui/ScrollToTop/scroll-to-top.scss';

interface IScrollToTopProps {
	className?: string;
}

export const ScrollToTop: FC<IScrollToTopProps> = ({className}) => {
	const [block] = useBem('scroll-to-top', className);
	const [isVisible, setIsVisible] = useState(false);

	useEffect(() => {
		const handleScroll = () => {
			// Показываем кнопку когда прокрутили больше двух экранов (2 * window.innerHeight)
			const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
			const showButton = scrollTop > window.innerHeight * 2;
			setIsVisible(showButton);
		};

		// Вызываем сразу для инициализации состояния
		handleScroll();

		window.addEventListener('scroll', handleScroll, {passive: true});
		return () => window.removeEventListener('scroll', handleScroll);
	}, []);

	const scrollToTop = () => {
		window.scrollTo({
			top: 0,
			behavior: 'smooth',
		});
	};

	return (
		<button className={block({'fade-out': !isVisible})} onClick={scrollToTop} type="button" aria-label="Прокрутить наверх">
			<Svg icon="arrow--left" />
		</button>
	);
};

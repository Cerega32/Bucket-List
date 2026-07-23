import {FC, useCallback, useEffect, useRef, useState} from 'react';
import {Link, useNavigate} from 'react-router-dom';

import {useBem} from '@/shared/lib/hooks/useBem';
import {Svg} from '@/shared/ui/Svg/Svg';
import {Tag} from '@/shared/ui/Tag/Tag';

import '@/shared/ui/Tabs/tabs.scss';

export interface ITabs {
	url: string;
	name: string;
	page: string;
	count?: number;
	icon?: string;
	premiumTag?: boolean;
}

interface TabsProps {
	className?: string;
	tabs: Array<ITabs>;
	active: string;
	base?: string;
	vertical?: boolean;
	preventScrollReset?: boolean;
}

export const Tabs: FC<TabsProps> = (props) => {
	const {className, tabs, active, base = '', vertical, preventScrollReset} = props;

	const [block, element] = useBem('tabs', className);
	const scrollContainerRef = useRef<HTMLDivElement>(null);
	const [isAtStart, setIsAtStart] = useState(true);
	const [isAtEnd, setIsAtEnd] = useState(false);
	const navigate = useNavigate();

	const checkScrollPosition = useCallback(() => {
		if (!scrollContainerRef.current || vertical) return;

		const container = scrollContainerRef.current;
		const {scrollLeft} = container;
		const {scrollWidth} = container;
		const {clientWidth} = container;

		// Если контент не требует прокрутки, скрываем оба градиента
		if (scrollWidth <= clientWidth) {
			setIsAtStart(true);
			setIsAtEnd(true);
			return;
		}

		const atStart = scrollLeft <= 1;
		const atEnd = scrollLeft + clientWidth >= scrollWidth - 1;

		setIsAtStart(atStart);
		setIsAtEnd(atEnd);
	}, [vertical]);

	useEffect(() => {
		const container = scrollContainerRef.current;
		if (!container || vertical) return;

		// Небольшая задержка для корректного определения размеров после рендера
		const timeoutId = setTimeout(() => {
			checkScrollPosition();
		}, 0);

		// Проверяем позицию при изменении размера
		const resizeObserver = new ResizeObserver(() => {
			setTimeout(checkScrollPosition, 0);
		});
		resizeObserver.observe(container);

		// Обработчик прокрутки
		container.addEventListener('scroll', checkScrollPosition, {passive: true});

		return () => {
			clearTimeout(timeoutId);
			container.removeEventListener('scroll', checkScrollPosition);
			resizeObserver.disconnect();
		};
	}, [tabs, vertical, checkScrollPosition]);

	return (
		<section className={block({vertical, 'at-start': isAtStart, 'at-end': isAtEnd})}>
			<div ref={scrollContainerRef} className={element('scroll-container')}>
				<div className={element('wrapper')}>
					{tabs.map((tab) => {
						const to = `${base}${tab.url}`;

						const handleClick: React.MouseEventHandler<HTMLAnchorElement> | undefined = preventScrollReset
							? (e) => {
									e.preventDefault();
									const currentY = window.scrollY;
									navigate(to);
									// Восстанавливаем позицию после смены роутера
									requestAnimationFrame(() => {
										window.scrollTo({top: currentY});
									});
							  }
							: undefined;

						return (
							<Link key={tab.name} to={to} className={element('link', {active: active === tab.page})} onClick={handleClick}>
								<span className={element('link-start')}>
									{tab.name}
									{tab.icon && <Svg icon={tab.icon} className={element('link-icon')} width="16px" height="16px" />}
									{tab.premiumTag && <Tag text="Premium" theme="gold" className={element('premium-tag')} />}
								</span>
								{!!tab.count && <span className={element('count')}>{tab.count}</span>}
							</Link>
						);
					})}
				</div>
			</div>
		</section>
	);
};

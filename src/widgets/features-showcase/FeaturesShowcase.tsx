import {AnimatePresence, motion} from 'framer-motion';
import {FC, useEffect, useState} from 'react';

import {useBem} from '@/shared/lib/hooks/useBem';
import useScreenSize from '@/shared/lib/hooks/useScreenSize';
import {Svg} from '@/shared/ui/Svg/Svg';
import {Title} from '@/shared/ui/Title/Title';
import {FeaturePreviews} from '@/widgets/features-showcase/FeaturePreviews';
import {ROADMAP_SCENARIO, SHOWCASE_SCENARIOS, ShowcaseScenarioId} from '@/widgets/features-showcase/features-showcase-data';

import '@/widgets/features-showcase/features-showcase.scss';

interface FeaturesShowcaseProps {
	className?: string;
}

export const FeaturesShowcase: FC<FeaturesShowcaseProps> = (props) => {
	const {className} = props;
	const [block, element] = useBem('features-showcase', className);
	const [active, setActive] = useState<ShowcaseScenarioId | null>('organize');
	const {isScreenMobile, isScreenSmallTablet} = useScreenSize();
	// < 1200px: preview под выбранной вкладкой; иначе — колонка справа
	const isCompactLayout = isScreenMobile || isScreenSmallTablet;

	const isRoadmap = active === 'roadmap';
	const scenario = isRoadmap ? ROADMAP_SCENARIO : active ? SHOWCASE_SCENARIOS.find((s) => s.id === active) : null;

	useEffect(() => {
		if (!isCompactLayout && active === null) {
			setActive('organize');
		}
	}, [isCompactLayout, active]);

	const handleSelect = (id: ShowcaseScenarioId) => {
		if (isCompactLayout && active === id) {
			setActive(null);
			return;
		}
		setActive(id);
	};

	const toggleRoadmap = () => {
		if (isCompactLayout && active === 'roadmap') {
			setActive(null);
			return;
		}
		setActive('roadmap');
	};

	const preview =
		active !== null ? (
			<section className={element('preview', {inline: isCompactLayout, aside: !isCompactLayout})}>
				<AnimatePresence mode="wait">
					<motion.article
						key={active}
						className={element('preview-inner')}
						initial={{opacity: 0, y: 12}}
						animate={{opacity: 1, y: 0}}
						exit={{opacity: 0, y: -8}}
						transition={{duration: 0.3, ease: 'easeOut'}}
					>
						{scenario?.problem && <p className={element('problem')}>{scenario.problem}</p>}
						{scenario?.solution && <p className={element('solution')}>{scenario.solution}</p>}
						<div className={element('preview-box', {demo: true, [active]: true})}>
							<FeaturePreviews scenarioId={active} />
						</div>
					</motion.article>
				</AnimatePresence>
			</section>
		) : null;

	return (
		<section className={block()}>
			<header className={element('header')}>
				<Title tag="h2" className={element('title')}>
					Зачем тебе это нужно?
				</Title>
				<p className={element('subtitle')}>
					Узнаёшь себя в ситуации — видишь, как платформа решает её на живом интерфейсе. Без абстракций: конкретные цели, не
					«что-то когда-нибудь».
				</p>
			</header>

			<div className={element('layout')}>
				<nav className={element('list')} aria-label="Сценарии использования">
					{SHOWCASE_SCENARIOS.map((item) => (
						<div key={item.id} className={element('item-wrap')}>
							<motion.button
								type="button"
								className={element('item', {active: active === item.id})}
								onClick={() => handleSelect(item.id)}
								aria-expanded={isCompactLayout ? active === item.id : undefined}
								whileTap={{scale: 0.98}}
								transition={{duration: 0.2}}
							>
								<span className={element('item-icon', {[item.id]: true})}>
									<Svg icon={item.icon} width="20px" height="20px" />
								</span>
								<span className={element('item-label')}>{item.navLabel}</span>
							</motion.button>
							{isCompactLayout && active === item.id && preview}
						</div>
					))}

					<div className={element('item-wrap')}>
						<button
							type="button"
							className={element('item', {active: isRoadmap, roadmap: true})}
							onClick={toggleRoadmap}
							aria-expanded={isRoadmap}
						>
							<span className={element('item-icon')}>
								<Svg icon="rocket" width="20px" height="20px" />
							</span>
							<span className={element('item-label')}>
								<span>Скоро в платформе</span>
								<span className={element('item-hint')}>6 в разработке</span>
							</span>
							<Svg icon="arrow--down" className={element('item-arrow', {open: isRoadmap})} width="16px" height="16px" />
						</button>
						{isCompactLayout && isRoadmap && preview}
					</div>
				</nav>

				{!isCompactLayout && preview}
			</div>
		</section>
	);
};

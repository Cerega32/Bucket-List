import {AnimatePresence, motion} from 'framer-motion';
import {FC, useState} from 'react';

import {Svg} from '@/components/Svg/Svg';
import {Title} from '@/components/Title/Title';
import {useBem} from '@/hooks/useBem';

import {FeaturePreviews} from './FeaturePreviews';
import {ROADMAP_SCENARIO, SHOWCASE_SCENARIOS, ShowcaseScenarioId} from './features-showcase-data';

import './features-showcase.scss';

interface FeaturesShowcaseProps {
	className?: string;
}

export const FeaturesShowcase: FC<FeaturesShowcaseProps> = (props) => {
	const {className} = props;
	const [block, element] = useBem('features-showcase', className);
	const [active, setActive] = useState<ShowcaseScenarioId>('organize');

	const isRoadmap = active === 'roadmap';
	const scenario = isRoadmap ? ROADMAP_SCENARIO : SHOWCASE_SCENARIOS.find((s) => s.id === active);

	const toggleRoadmap = () => {
		setActive((current) => (current === 'roadmap' ? 'organize' : 'roadmap'));
	};

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
						<motion.button
							key={item.id}
							type="button"
							className={element('item', {active: active === item.id})}
							onClick={() => setActive(item.id)}
							whileTap={{scale: 0.98}}
							transition={{duration: 0.2}}
						>
							<span className={element('item-icon', {[item.id]: true})}>
								<Svg icon={item.icon} width="20px" height="20px" />
							</span>
							<span className={element('item-label')}>{item.navLabel}</span>
						</motion.button>
					))}

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
				</nav>

				<section className={element('preview')}>
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
			</div>
		</section>
	);
};

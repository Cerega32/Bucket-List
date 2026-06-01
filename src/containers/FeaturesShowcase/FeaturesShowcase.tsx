import {motion, AnimatePresence} from 'framer-motion';
import {FC, useMemo, useState} from 'react';

import {Svg} from '@/components/Svg/Svg';
import {Title} from '@/components/Title/Title';
import {useBem} from '@/hooks/useBem';

import './features-showcase.scss';

interface Feature {
	id: string;
	title: string;
	description: string;
	icon: string;
	preview: React.ReactNode;
}

interface FeaturesShowcaseProps {
	className?: string;
}

export const FeaturesShowcase: FC<FeaturesShowcaseProps> = ({className}) => {
	const [block, element] = useBem('features-showcase', className);
	const [active, setActive] = useState('goals');

	const features: Feature[] = useMemo(
		() => [
			{
				id: 'goals',
				title: '100 целей',
				description: 'Собери систему целей и отслеживай реальный прогресс как личную стратегию развития.',
				icon: 'star',
				preview: (
					<div className={element('preview-card')}>
						<div>🏁 Прогресс целей</div>
						<div>• Бег — 70%</div>
						<div>• Книги — 40%</div>
						<div>• Путешествия — 20%</div>
					</div>
				),
			},
			{
				id: 'travel',
				title: 'Путешествия',
				description: 'Фиксируй страны и создавай карту своих открытий.',
				icon: 'map',
				preview: (
					<div className={element('preview-card')}>
						<div>🌍 Карта стран</div>
						<div>🇫🇷 🇮🇹 🇯🇵 🇹🇷</div>
						<div>Visited: 4</div>
					</div>
				),
			},
			{
				id: 'books',
				title: 'Активности',
				description: 'Отслеживай любые сферы жизни: чтение, обучение, проекты и личные достижения.',
				icon: 'apps',
				preview: (
					<div className={element('preview-card')}>
						<div>📦 Мои активности</div>
						<div>Atomic Habits — книга ✔</div>
						<div>Deep Work — обучение 60%</div>
						<div>Workout — завершено</div>
						<div>Side project — в работе</div>
					</div>
				),
			},
			{
				id: 'friends',
				title: 'Друзья',
				description: 'Сравнивай прогресс и находи мотивацию в других.',
				icon: 'people',
				preview: (
					<div className={element('preview-card')}>
						<div>👥 Активность</div>
						<div>Alex — 32</div>
						<div>Maria — 28</div>
						<div>You — 34 🔥</div>
					</div>
				),
			},
			{
				id: 'progress',
				title: 'Прогресс',
				description: 'Вся активность превращается в понятную систему роста.',
				icon: 'trophy',
				preview: (
					<div className={element('preview-card')}>
						<div>📊 Уровень 7 → 8</div>

						<div className={element('bar')}>
							<div className={element('bar-fill')} />
						</div>

						<div>78% завершено</div>
					</div>
				),
			},
			{
				id: 'regular',
				title: 'Привычки',
				description: 'Формируй стабильные действия через регулярные задачи.',
				icon: 'level',
				preview: (
					<div className={element('preview-card')}>
						<div>🔥 Streak: 12 дней</div>
					</div>
				),
			},
		],
		[element]
	);

	const activeFeature = features.find((f) => f.id === active);

	const comingSoon = [
		{
			icon: 'trophy',
			text: 'Соревнования с друзьями',
		},
		{
			icon: 'map',
			text: 'Расширенная карта стран',
		},
		{
			icon: 'star',
			text: 'Новые игровые механики',
		},
	];

	return (
		<section className={block()}>
			<div className={element('header')}>
				<Title tag="h2" className={element('title')}>
					Используй систему как хочешь
				</Title>

				<p className={element('subtitle')}>
					Цели, привычки, путешествия, книги и социальная мотивация — всё в одной системе развития.
				</p>
			</div>

			<div className={element('layout')}>
				<div className={element('list')}>
					{features.map((feature) => (
						<motion.button
							key={feature.id}
							className={element('item', {
								active: active === feature.id,
							})}
							onClick={() => setActive(feature.id)}
							whileHover={{x: 6}}
							whileTap={{scale: 0.98}}
							transition={{duration: 0.2}}
						>
							<Svg icon={feature.icon} width="20px" height="20px" />
							<span>{feature.title}</span>
						</motion.button>
					))}

					<div className={element('coming')}>
						<div className={element('coming-title')}>Дальше больше возможностей</div>

						<div className={element('coming-grid')}>
							{comingSoon.map((item) => (
								<div key={item.text} className={element('coming-card')}>
									<div className={element('coming-icon')}>
										<Svg icon={item.icon} width="16px" height="16px" />
									</div>
									<div className={element('coming-text')}>{item.text}</div>
								</div>
							))}
						</div>

						<div className={element('coming-hint')}>И ещё больше функций в разработке…</div>
					</div>
				</div>

				<div className={element('preview')}>
					<AnimatePresence mode="wait">
						<motion.div
							key={activeFeature?.id}
							className={element('preview-inner')}
							initial={{opacity: 0, y: 20, scale: 0.98}}
							animate={{opacity: 1, y: 0, scale: 1}}
							exit={{opacity: 0, y: -10}}
							transition={{duration: 0.35, ease: 'easeOut'}}
						>
							<div className={element('preview-title')}>{activeFeature?.title}</div>

							<p className={element('preview-desc')}>{activeFeature?.description}</p>

							<div className={element('preview-box')}>{activeFeature?.preview}</div>
						</motion.div>
					</AnimatePresence>
				</div>
			</div>
		</section>
	);
};

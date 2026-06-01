import {motion} from 'framer-motion';
import {FC} from 'react';

import {useBem} from '@/hooks/useBem';

import {Achievement} from '../Achievement/Achievement';
import {Info100Goals} from '../Info100Goals/Info100Goals';
import {Svg} from '../Svg/Svg';
import {Title} from '../Title/Title';

import './main-info.scss';

interface MainInfoProps {
	className?: string;
}

export const MainInfo: FC<MainInfoProps> = (props) => {
	const {className} = props;

	const [block, element] = useBem('main-info', className);

	return (
		<section className={block()}>
			<motion.div
				className={element('item')}
				initial={{opacity: 0, y: 10}}
				whileInView={{opacity: 1, y: 0}}
				transition={{duration: 0.5}}
				viewport={{once: true}}
			>
				<div className={element('head')}>
					<div className={element('head-row')}>
						<Svg className={element('icon')} icon="question-circle" width="24px" height="24px" />
						{/* Кнопка с тарифами */}
						{/* <Button
							className={element('tariffs-btn')}
							type="Link"
							theme="blue"
							size="small"
							icon="award"
							href="/tariffs"
						>
							Что внутри?
						</Button> */}
					</div>
					<Title tag="h2" className={element('title')}>
						Твоя жизнь становится понятной системой
					</Title>
				</div>
				<p>
					Ты перестаёшь держать всё в голове. Цели превращаются в действия, действия — в привычки, а привычки — в стабильный
					прогресс, который видно каждый день.
				</p>
				<div className={element('example')}>
					<h3 className={element('info-title')}>Невыполненные цели в «100 целей»</h3>
					<span className={element('info-count')}>
						<Svg icon="star" />
						72
						<span style={{marginLeft: 6}}>ожидают тебя</span>
					</span>
				</div>
				<Achievement
					className={element('achievement')}
					achievement={{
						id: 1,
						title: 'Путешественник 1-го уровня',
						description: 'Закрой хотя бы одну цель из категории «Путешествия»',
						image: '/svg/map.svg',
						isAchieved: true,
						category: 'progress',
					}}
				/>
				<Info100Goals
					totalAddedEasy={34}
					totalAddedHard={33}
					totalAddedMedium={33}
					totalCompletedEasy={16}
					totalCompletedHard={2}
					totalCompletedMedium={10}
					column
					className={element('info-100-goals')}
				/>
			</motion.div>
			<motion.div
				className={element('item')}
				initial={{opacity: 0, y: 20}}
				whileInView={{opacity: 1, y: 0}}
				transition={{duration: 0.5}}
				viewport={{once: true}}
			>
				<Svg className={element('icon')} icon="star" width="24px" height="24px" />
				<Title tag="h3" className={element('title')}>
					Мотивация, которая уже работает
				</Title>
				<p>Тысячи целей уже выполнены пользователями платформы — каждый день здесь кто-то делает шаг вперёд.</p>
			</motion.div>
			<motion.div
				className={element('item')}
				initial={{opacity: 0, y: 20}}
				whileInView={{opacity: 1, y: 0}}
				transition={{duration: 0.5}}
				viewport={{once: true}}
			>
				<Svg className={element('icon', {bullseye: true})} icon="bullseye" width="24px" height="24px" />
				<Title tag="h3">Цели, которые реально доходят до результата</Title>
				<p>
					Ты не просто сохраняешь желания — ты двигаешь их к завершению. Каждое действие фиксируется и становится частью твоего
					прогресса.
				</p>
			</motion.div>
			<motion.div
				className={element('item')}
				initial={{opacity: 0, y: 20}}
				whileInView={{opacity: 1, y: 0}}
				transition={{duration: 0.5}}
				viewport={{once: true}}
			>
				<Svg className={element('icon')} icon="apps" width="24px" height="24px" />
				<Title tag="h3">Каталог идей для развития</Title>
				<p>
					Если не знаешь, с чего начать — бери готовые сценарии и адаптируй их под себя. Это быстрый вход в систему целей без
					лишних раздумий.
				</p>
			</motion.div>
			<motion.div
				className={element('item-half')}
				initial={{opacity: 0, y: 20}}
				whileInView={{opacity: 1, y: 0}}
				transition={{duration: 0.5}}
				viewport={{once: true}}
			>
				<Svg className={element('icon')} icon="trophy" width="24px" height="24px" />
				<Title tag="h3">Развитие вместе с другими людьми</Title>
				<p>
					Рейтинги, достижения и активность создают ощущение живого процесса. Ты видишь не только свой рост, но и движение других.
				</p>
			</motion.div>
			<motion.div
				className={element('item')}
				initial={{opacity: 0, y: 20}}
				whileInView={{opacity: 1, y: 0}}
				transition={{duration: 0.5}}
				viewport={{once: true}}
			>
				<Svg className={element('icon', {level: true})} icon="level" width="24px" height="24px" />
				<Title tag="h3">Ты видишь свой реальный рост</Title>
				<p>Прогресс не теряется. Он превращается в уровни, достижения и понятную историю твоего развития.</p>
			</motion.div>
		</section>
	);
};

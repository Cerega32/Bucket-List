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
			<div className={element('item')}>
				<Svg className={element('icon')} icon="question-circle" width="24px" height="24px" />
				<Title tag="h2" className={element('title')}>
					Почему это меняет жизнь?
				</Title>
				<p>
					Ты уже знаешь, куда двигаться — благодаря чёткой структуре. С помощью отслеживания прогресса и визуализации формируешь
					новые привычки, которые меняют мышление и поведение. А самое главное — ты не один: наше сообщество всегда поддержит
					тебя.
				</p>
				<div className={element('example')}>
					<h3 className={element('info-title')}>Невыполненных целей в “100 целей”</h3>
					<span className={element('info-count')}>
						<Svg icon="star" />
						76
					</span>
				</div>
				<Achievement
					className={element('achievement')}
					achievement={{
						id: 1,
						title: 'Путешественник 1го уровня',
						description: 'Выполнить хотя бы 1 цель из категории «Путешествия»',
						image: '/svg/map.svg',
						isAchieved: false,
						category: 'first_steps',
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
			</div>
			<div className={element('item')}>
				<Svg className={element('icon')} icon="rocket" width="24px" height="24px" />
				<Title tag="h3" className={element('title')}>
					100 целей на жизнь
				</Title>
				<p>
					Список 100 целей на жизнь стимулирует всестороннее развитие и помогает охватить все аспекты жизни, от карьерных и личных
					до духовных и развлекательных.
				</p>
			</div>
			<div className={element('item')}>
				<Svg className={element('icon', {apps: true})} icon="apps" width="24px" height="24px" />
				<Title tag="h3" className={element('title')}>
					Каталог целей
				</Title>
				<p>
					Хотите отслеживать прогресс и ставить перед собой другие цели? Вы обязательно сможете найти что-нибудь подходящее для
					вас в нашем каталоге.
				</p>
			</div>
			<div className={element('item')}>
				<Svg className={element('icon')} icon="trophy" width="24px" height="24px" />
				<Title tag="h3" className={element('title')}>
					Список лидеров
				</Title>
				<p>
					Зарабатывайте достижения и соревнуйтесь с друзьями. Обойдите всех в недельном рейтинге и похвастайтесь своей новой яркой
					жизнью.
				</p>
			</div>
		</section>
	);
};

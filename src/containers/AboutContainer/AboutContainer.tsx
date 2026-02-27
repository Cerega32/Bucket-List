import {motion} from 'framer-motion';
import {FC, useEffect, useState} from 'react';
import {Link} from 'react-router-dom';

import {Button} from '@/components/Button/Button';
import {Svg} from '@/components/Svg/Svg';
import {Title} from '@/components/Title/Title';
import {useBem} from '@/hooks/useBem';
import {ModalStore} from '@/store/ModalStore';
import {UserStore} from '@/store/UserStore';
import {getTotalCompleted} from '@/utils/api/get/getTotalCompleted';
import {pluralize} from '@/utils/text/pluralize';

import './about-container.scss';

export const AboutContainer: FC = () => {
	const [block, element] = useBem('about-container');
	const [totalCompleted, setTotalCompleted] = useState<number>(0);
	const {setWindow, setIsOpen} = ModalStore;
	const {isAuth} = UserStore;

	const openLogin = () => {
		setIsOpen(true);
		setWindow('login');
	};

	useEffect(() => {
		const getTotal = async () => {
			const response = await getTotalCompleted();
			if (response.success) {
				setTotalCompleted(response.data.totalCompletedGoals);
			}
		};

		getTotal();
	}, []);

	const features = [
		{
			icon: 'rocket',
			title: 'Ставьте цели',
			description:
				'Выбирайте из тысяч готовых целей или создавайте свои собственные. Организуйте их по категориям и отслеживайте прогресс.',
		},
		{
			icon: 'level',
			title: 'Отслеживайте прогресс',
			description: 'Ведите дневник достижений, отмечайте выполнение целей и смотрите на свой рост в реальном времени.',
		},
		{
			icon: 'star',
			title: 'Вдохновляйтесь',
			description: 'Смотрите, какие цели ставят другие пользователи, делитесь своими достижениями и находите единомышленников.',
		},
		{
			icon: 'map',
			title: 'Путешествуйте',
			description: 'Отмечайте места, где вы побывали, и создавайте карту своих приключений и открытий.',
		},
		{
			icon: 'apps',
			title: 'Организуйте',
			description: 'Создавайте папки целей, составляйте списки желаний и упорядочивайте свои мечты по темам.',
		},
		{
			icon: 'trophy',
			title: 'Достигайте',
			description: 'Получайте достижения за свои успехи, участвуйте в рейтингах и становитесь лидером по выполненным целям.',
		},
	];

	const stats = [
		{value: '20+', label: 'Категорий и направлений целей'},
		{value: '1000+', label: 'Готовых целей и списков'},
		{value: '∞', label: 'Возможностей'},
	];

	return (
		<main className={block()}>
			<div className={element('hero')}>
				<motion.div
					className={element('hero-content')}
					initial={{opacity: 0, y: 20}}
					animate={{opacity: 1, y: 0}}
					transition={{duration: 0.5}}
				>
					<h1 className={element('hero-title')}>
						Добро пожаловать в <span className={element('hero-title-accent')}>Delting</span>!
					</h1>
					<p className={element('hero-description')}>
						Мы создали платформу, которая поможет вам превратить мечты в реальность. Ставьте цели, отслеживайте прогресс и
						вдохновляйтесь успехами других людей.
					</p>
				</motion.div>
			</div>

			<div className={element('content')}>
				<section className={element('section')}>
					<Title tag="h2" className={element('section-title')}>
						Что такое Delting?
					</Title>
					<div className={element('section-content')}>
						<p>
							<strong>Delting</strong> — это современная платформа для постановки и достижения целей. Мы верим, что каждый
							человек способен на многое, если правильно организовать свой путь к мечтам.
						</p>
						<p>
							Наша миссия — помочь вам структурировать свои желания, превратить их в конкретные цели и поддерживать мотивацию
							на протяжении всего пути. Мы создали удобные инструменты для отслеживания прогресса, организации целей и обмена
							опытом с единомышленниками.
						</p>
					</div>
				</section>

				<section className={element('section')}>
					<Title tag="h2" className={element('section-title')}>
						Что мы предлагаем
					</Title>
					<div className={element('features')}>
						{features.map((feature, index) => (
							<motion.div
								key={feature.title}
								className={element('feature-card')}
								initial={{opacity: 0, y: 20}}
								whileInView={{opacity: 1, y: 0}}
								transition={{duration: 0.5, delay: index * 0.1}}
								viewport={{once: true}}
							>
								<div className={element('feature-icon')}>
									<Svg icon={feature.icon} width="24px" height="24px" />
								</div>
								<h3 className={element('feature-title')}>{feature.title}</h3>
								<p className={element('feature-description')}>{feature.description}</p>
							</motion.div>
						))}
					</div>
				</section>

				<section className={element('section', {stats: true})}>
					<Title tag="h2" className={element('section-title')}>
						Начни прямо сейчас
					</Title>
					<div className={element('stats')}>
						{stats.map((stat, index) => (
							<motion.div
								key={stat.label}
								className={element('stat-card')}
								initial={{opacity: 0, scale: 0.8}}
								whileInView={{opacity: 1, scale: 1}}
								transition={{duration: 0.5, delay: index * 0.1}}
								viewport={{once: true}}
							>
								<div className={element('stat-value')}>{stat.value}</div>
								<div className={element('stat-label')}>{stat.label}</div>
							</motion.div>
						))}
					</div>
				</section>

				<section className={element('section')}>
					<Title tag="h2" className={element('section-title')}>
						Наша команда
					</Title>
					<div className={element('team-content')}>
						<p>
							Мы — команда энтузиастов, которые сами используют Delting для достижения своих целей. Мы постоянно работаем над
							улучшением платформы, добавляя новые функции и делая её ещё удобнее для вас.
						</p>
						<p>
							Если у вас есть идеи или предложения, мы всегда рады их услышать! Свяжитесь с нами через раздел{' '}
							<Link to="/contacts" className={element('link')}>
								Контакты
							</Link>
							.
						</p>
					</div>
				</section>

				<motion.section
					className={element('section', {cta: true})}
					initial={{opacity: 0}}
					whileInView={{opacity: 1}}
					transition={{duration: 0.5}}
					viewport={{once: true}}
				>
					<h2 className={element('cta-title')}>Готовы начать?</h2>
					<p className={element('cta-description')}>
						Присоединяйтесь к сообществу пользователей, которые уже идут к своим целям вместе с Delting!
					</p>
					<Button
						className={element('cta-button')}
						type={isAuth ? 'Link' : 'button'}
						theme="gradient"
						size="medium"
						icon="rocket"
						onClick={openLogin}
						href="/categories/all"
					>
						Идти вперед!
					</Button>
					<p className={element('cta-completed')}>
						🔥 Уже выполнено:{' '}
						<span className={element('cta-completed-number')}>{pluralize(totalCompleted, ['цель', 'цели', 'целей'])}</span>
					</p>
				</motion.section>
			</div>
		</main>
	);
};

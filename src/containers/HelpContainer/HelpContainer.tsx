import {motion} from 'framer-motion';
import {FC, useState} from 'react';
import {Link} from 'react-router-dom';

import {Svg} from '@/components/Svg/Svg';
import {Title} from '@/components/Title/Title';
import {useBem} from '@/hooks/useBem';

import './help-container.scss';

export const HelpContainer: FC = () => {
	const [block, element] = useBem('help-container');
	const [openSection, setOpenSection] = useState<number | null>(0);

	const faq = [
		{
			question: 'Как создать цель?',
			answer: `Вы можете создать цель несколькими способами:
			1. Перейдите в раздел "Каталог целей" и выберите готовую цель из тысяч вариантов
			2. Нажмите кнопку "Добавить цель" и создайте свою уникальную цель
			3. Добавьте цель в список "100 целей", который поможет структурировать ваши мечты`,
		},
		{
			question: 'Как отслеживать прогресс цели?',
			answer: `Для отслеживания прогресса:
			1. Откройте цель в своем профиле
			2. Используйте кнопку изменения прогресса, отмечая ключевые моменты
			Ваш прогресс автоматически сохраняется`,
		},
		{
			question: 'Что такое папки целей?',
			answer: `Папки целей — это удобный способ организовать ваши цели по темам или проектам. Вы можете:
			• Создавать собственные папки с названиями и цветами
			• Группировать связанные цели вместе
			• Делать папки приватными — не будут видны другим пользователям
			• Быстро находить нужные цели через удобную навигацию`,
		},
		{
			question: 'Как работают достижения?',
			answer: `Достижения автоматически начисляются за различные действия на платформе:
			• Выполнение целей
			• Добавление новых целей
			• Регулярная активность
			Проверяйте свой профиль, чтобы увидеть все полученные достижения!`,
		},
		{
			question: 'Можно ли делиться целями с друзьями?',
			answer: `Да! Вы можете:
			• Добавлять друзей через раздел "Друзья"
			• Просматривать профили друзей и их достижения
			• Сравнивать прогресс по общим целям
			• Вдохновляться успехами других пользователей
			Система друзей помогает поддерживать мотивацию и делиться опытом.`,
		},
		{
			question: 'Что такое регулярные цели?',
			answer: `Регулярные цели — это цели, которые вы выполняете периодически (например, тренировки, чтение книг, практика навыков). При добавлении такой цели вы можете настроить:
			• Периодичность выполнения
			• Напоминания
			• Трекинг прогресса
			Это поможет вам поддерживать полезные привычки!`,
		},
		{
			question: 'Как использовать карты?',
			answer: `Функция карт позволяет:
			• Отмечать места, где вы были
			• Создавать визуальную карту своих путешествий
			• Отслеживать географические цели
			• Делиться своими маршрутами с друзьями
			Просто добавьте локацию к цели, и она появится на вашей карте!`,
		},
		{
			question: 'Можно ли изменить настройки профиля?',
			answer: `Конечно! В разделе "Настройки" вы можете:
			• Изменить аватар и обложку профиля
			• Обновить информацию о себе
			• Настроить уведомления
			• Изменить пароль
			• Управлять приватностью аккаунта
			Все изменения сохраняются автоматически.`,
		},
	];

	const quickLinks = [
		{
			icon: 'rocket',
			title: 'Начать работу',
			description: 'Узнайте, как сделать первые шаги на платформе',
			href: '/categories/all',
		},
		{
			icon: 'level',
			title: 'Отслеживание прогресса',
			description: 'Инструкции по работе с прогрессом целей',
			href: '/user/self/progress',
		},
		{
			icon: 'apps',
			title: 'Организация целей',
			description: 'Как создавать папки и структурировать цели',
			href: '/user/self/folders',
		},
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
						Нужна <span className={element('hero-title-accent')}>помощь</span>?
					</h1>
					<p className={element('hero-description')}>
						Мы собрали ответы на самые частые вопросы и полезные инструкции, которые помогут вам максимально эффективно
						использовать все возможности платформы.
					</p>
				</motion.div>
			</div>

			<div className={element('content')}>
				<section className={element('section')}>
					<Title tag="h2" className={element('section-title')}>
						Быстрые ссылки
					</Title>
					<div className={element('quick-links')}>
						{quickLinks.map((link, index) => (
							<motion.div
								key={link.title}
								className={element('quick-link-card')}
								initial={{opacity: 0, y: 20}}
								whileInView={{opacity: 1, y: 0}}
								transition={{duration: 0.5, delay: index * 0.1}}
								viewport={{once: true}}
							>
								<Link to={link.href} className={element('quick-link-link')}>
									<div className={element('quick-link-icon')}>
										<Svg icon={link.icon} width="24px" height="24px" />
									</div>
									<h3 className={element('quick-link-title')}>{link.title}</h3>
									<p className={element('quick-link-description')}>{link.description}</p>
								</Link>
							</motion.div>
						))}
					</div>
				</section>

				<section className={element('section')}>
					<Title tag="h2" className={element('section-title')}>
						Часто задаваемые вопросы
					</Title>
					<div className={element('faq')}>
						{faq.map((item, index) => (
							<motion.div
								key={index}
								className={element('faq-item', {open: openSection === index})}
								initial={{opacity: 0, y: 10}}
								whileInView={{opacity: 1, y: 0}}
								transition={{duration: 0.3, delay: index * 0.05}}
								viewport={{once: true}}
							>
								<button
									className={element('faq-question')}
									onClick={() => setOpenSection(openSection === index ? null : index)}
									type="button"
									aria-expanded={openSection === index}
								>
									<span>{item.question}</span>
									<Svg icon="arrow--down" className={element('faq-icon', {open: openSection === index})} />
								</button>
								{openSection === index && (
									<div className={element('faq-answer')}>
										{item.answer.split('\n\n').map((paragraph, pIndex) => (
											<p key={pIndex}>{paragraph}</p>
										))}
									</div>
								)}
							</motion.div>
						))}
					</div>
				</section>

				<motion.section
					className={element('section', {cta: true})}
					initial={{opacity: 0}}
					whileInView={{opacity: 1}}
					transition={{duration: 0.5}}
					viewport={{once: true}}
				>
					<h2 className={element('cta-title')}>Не нашли ответ?</h2>
					<p className={element('cta-description')}>
						Если у вас остались вопросы, свяжитесь с нами через раздел{' '}
						<Link to="/contacts" className={element('link')}>
							Контакты
						</Link>
						. Мы всегда рады помочь!
					</p>
				</motion.section>
			</div>
		</main>
	);
};

import {motion} from 'framer-motion';
import {FC} from 'react';

import {Svg} from '@/components/Svg/Svg';
import {Title} from '@/components/Title/Title';
import {useBem} from '@/hooks/useBem';

import './contacts-container.scss';

export const ContactsContainer: FC = () => {
	const [block, element] = useBem('contacts-container');

	const supportMethods = [
		{
			icon: 'telegram',
			title: 'Telegram поддержка',
			description: 'Напишите нам для получения помощи',
			href: 'https://t.me/delting_help_bot',
			label: '@delting_help_bot',
		},
		{
			icon: 'email',
			title: 'Email',
			description: 'Напишите нам на почту',
			href: 'mailto:delting-help@yandex.com',
			label: 'delting-help@yandex.com',
		},
	];

	const socialLinks = [
		{
			icon: 'telegram',
			title: 'Telegram канал',
			description: 'Новости, советы и истории пользователей',
			href: 'https://t.me/delting_go',
			label: '@delting_go',
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
						Давайте <span className={element('hero-title-accent')}>общаться</span>!
					</h1>
					<p className={element('hero-description')}>
						Мы всегда рады вашим вопросам, предложениям и отзывам. Выберите удобный способ связи, и мы обязательно ответим.
					</p>
				</motion.div>
			</div>

			<div className={element('content')}>
				<section className={element('section')}>
					<Title tag="h2" className={element('section-title')}>
						Свяжитесь с нами
					</Title>
					<p className={element('section-description')}>
						Нужна помощь или есть вопросы? Выберите удобный способ связи, и мы обязательно ответим.
					</p>
					<div className={element('contacts')}>
						{supportMethods.map((contact, index) => (
							<motion.a
								key={contact.title}
								href={contact.href}
								target={contact.href.startsWith('http') ? '_blank' : undefined}
								rel={contact.href.startsWith('http') ? 'noopener noreferrer' : undefined}
								className={element('contact-card')}
								initial={{opacity: 0, y: 20}}
								whileInView={{opacity: 1, y: 0}}
								transition={{duration: 0.5, delay: index * 0.1}}
								viewport={{once: true}}
							>
								<div className={element('contact-icon')}>
									<Svg icon={contact.icon} />
								</div>
								<h3 className={element('contact-title')}>{contact.title}</h3>
								<p className={element('contact-label')}>{contact.label}</p>
								<p className={element('contact-description')}>{contact.description}</p>
							</motion.a>
						))}
					</div>
				</section>

				<section className={element('section')}>
					<Title tag="h2" className={element('section-title')}>
						Мы в социальных сетях
					</Title>
					<p className={element('section-description')}>
						Присоединяйтесь к нашему сообществу! В канале мы публикуем новости, полезные советы, истории пользователей и многое
						другое.
					</p>
					<div className={element('contacts')}>
						{socialLinks.map((contact, index) => (
							<motion.a
								key={contact.title}
								href={contact.href}
								target={contact.href.startsWith('http') ? '_blank' : undefined}
								rel={contact.href.startsWith('http') ? 'noopener noreferrer' : undefined}
								className={element('contact-card')}
								initial={{opacity: 0, y: 20}}
								whileInView={{opacity: 1, y: 0}}
								transition={{duration: 0.5, delay: index * 0.1}}
								viewport={{once: true}}
							>
								<div className={element('contact-icon')}>
									<Svg icon={contact.icon} />
								</div>
								<h3 className={element('contact-title')}>{contact.title}</h3>
								<p className={element('contact-label')}>{contact.label}</p>
								<p className={element('contact-description')}>{contact.description}</p>
							</motion.a>
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
					<h2 className={element('cta-title')}>Есть идеи для улучшения?</h2>
					<p className={element('cta-description')}>
						Мы постоянно развиваемся и ценим ваше мнение. Если у вас есть предложения по улучшению платформы или вы нашли ошибку
						— напишите нам! Ваш вклад помогает делать Delting лучше каждый день.
					</p>
				</motion.section>
			</div>
		</main>
	);
};

import {motion} from 'framer-motion';
import {FC} from 'react';

import {useBem} from '@/shared/lib/hooks/useBem';
import {Svg} from '@/shared/ui/Svg/Svg';
import {Title} from '@/shared/ui/Title/Title';

import '@/widgets/main-info/main-info.scss';

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
				initial={{opacity: 0, y: 15}}
				whileInView={{opacity: 1, y: 0}}
				transition={{duration: 0.5, delay: 0.05}}
				viewport={{once: true}}
			>
				<Svg className={element('icon', {bullseye: true})} icon="bullseye" width="24px" height="24px" />
				<Title tag="h3" className={element('title')}>
					Вступай в клуб готовых целей
				</Title>
				<p>
					Мы и другие пользователи уже собрали цели и списки — от путешествий до привычек. Не начинай с пустого листа: бери
					готовое, адаптируй под себя и добавляй своё.
				</p>
			</motion.div>
			<motion.div
				className={element('item')}
				initial={{opacity: 0, y: 10}}
				whileInView={{opacity: 1, y: 0}}
				transition={{duration: 0.5}}
				viewport={{once: true}}
			>
				<Svg className={element('icon')} icon="star" width="24px" height="24px" />
				<Title tag="h3" className={element('title')}>
					Кто-то уже двигается вперёд
				</Title>
				<p>
					Каждый день на платформе закрывают цель — от «прыгнуть с парашютом» до «прочитать книгу за месяц». Ты не один в этом
					процессе.
				</p>
			</motion.div>
			<motion.div
				className={element('item')}
				initial={{opacity: 0, y: 20}}
				whileInView={{opacity: 1, y: 0}}
				transition={{duration: 0.5, delay: 0.1}}
				viewport={{once: true}}
			>
				<Svg className={element('icon')} icon="level" width="24px" height="24px" />
				<Title tag="h3" className={element('title')}>
					Прогресс, который видно
				</Title>
				<p>
					Уровень, серии привычек, карта поездок и впечатления к целям — не одна галочка в блокноте, а история того, как ты
					движешься вперёд. Ниже — как это выглядит в интерфейсе.
				</p>
			</motion.div>
		</section>
	);
};

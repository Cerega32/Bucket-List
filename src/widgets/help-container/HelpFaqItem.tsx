import {motion} from 'framer-motion';
import {FC} from 'react';
import {Link} from 'react-router-dom';

import {useBem} from '@/shared/lib/hooks/useBem';
import {Svg} from '@/shared/ui/Svg/Svg';
import {FAQ_DEMOS} from '@/widgets/help-container/faq-demos';
import {FaqItem} from '@/widgets/help-container/help-data';

type Props = {
	item: FaqItem;
	isOpen: boolean;
	onToggle: () => void;
};

export const HelpFaqItem: FC<Props> = ({item, isOpen, onToggle}) => {
	const [, element] = useBem('help-container');
	const DemoComponent = item.demo ? FAQ_DEMOS[item.demo] : null;

	return (
		<motion.div
			className={element('faq-item', {open: isOpen})}
			initial={{opacity: 0, y: 10}}
			whileInView={{opacity: 1, y: 0}}
			transition={{duration: 0.3}}
			viewport={{once: true}}
		>
			<button className={element('faq-question')} onClick={onToggle} type="button">
				<span>{item.question}</span>
				<Svg icon="arrow--right" className={element('faq-icon', {open: isOpen})} />
			</button>

			{isOpen && (
				<div className={element('faq-answer')}>
					{item.answer.map((paragraph, index) => (
						<p key={index}>{paragraph}</p>
					))}

					{DemoComponent && (
						<div className={element('faq-demo')}>
							<DemoComponent />
						</div>
					)}

					{item.link && (
						<Link to={item.link} className={element('faq-link')}>
							{item.linkText}
						</Link>
					)}
				</div>
			)}
		</motion.div>
	);
};

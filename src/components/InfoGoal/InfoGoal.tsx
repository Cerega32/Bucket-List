import {FC, Fragment} from 'react';

import {useBem} from '@/hooks/useBem';

import {Line} from '../Line/Line';
import {Progress} from '../Progress/Progress';
import './info-goal.scss';

interface InfoItem {
	title: string;
	value: string | number;
}

interface InfoGoalProps {
	className?: string;
	items: InfoItem[];
	progress?: boolean;
	horizontal?: boolean;
	progressData?: {
		completed: number;
		total: number;
	};
	backgroundOff?: boolean;
}

export const InfoGoal: FC<InfoGoalProps> = (props) => {
	const {className, items, progressData, progress, horizontal, backgroundOff} = props;

	const [block, element] = useBem('info-goal', className);

	return (
		<section className={block({horizontal, backgroundOff})}>
			<div className={element('wrapper')}>
				{items.map((item, index) => (
					// eslint-disable-next-line react/no-array-index-key
					<Fragment key={index}>
						<div className={element('item')}>
							<span className={element('title')}>{item.title}</span>
							<span className={element('text')}>{item.value}</span>
						</div>
						{index !== items.length - 1 && <div className={element('vertical-line')} />}
					</Fragment>
				))}
				{!!items.length && horizontal && progressData && <div className={element('vertical-line')} />}
				{horizontal && progressData && (
					<div className={element('wrapper-horizontal')}>
						<span className={element('title')}>Мой прогресс выполнения</span>
						<span className={element('text')}>{`${progressData.completed}/${progressData.total}`}</span>
					</div>
				)}
			</div>
			{progress && progressData && progressData.total > 0 && (
				<>
					<Line vertical={horizontal} margin="5px 24px" height={-10} />
					<Progress done={progressData.completed} all={progressData.total} goal />
				</>
			)}
		</section>
	);
};

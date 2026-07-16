import {FC} from 'react';

import {IComplexity} from '@/typings/goal';

import './complexity-display.scss';

interface ComplexityDisplayProps {
	complexity: IComplexity;
	className?: string;
}

const LABELS: Record<IComplexity, string> = {
	easy: 'Легко',
	medium: 'Средне',
	hard: 'Тяжело',
};

export const ComplexityDisplay: FC<ComplexityDisplayProps> = ({complexity, className}) => {
	const icon = complexity === 'easy' ? 'easy' : complexity === 'medium' ? 'medium' : 'hard';

	return (
		<span className={`complexity-display ${className || ''}`.trim()}>
			<img src={`/svg/${icon}.svg`} alt={LABELS[complexity]} className="complexity-display__icon" />
			{LABELS[complexity]}
		</span>
	);
};

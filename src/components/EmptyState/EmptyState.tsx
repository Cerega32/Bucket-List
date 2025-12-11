import {FC, ReactNode} from 'react';

import {useBem} from '@/hooks/useBem';

import './empty-state.scss';

interface EmptyStateProps {
	className?: string;
	title?: string;
	description?: string | string[];
	children?: ReactNode;
	size?: 'default' | 'small';
}

export const EmptyState: FC<EmptyStateProps> = ({className, title, description, children, size = 'default'}) => {
	const [block, element] = useBem('empty-state', className);

	const renderDescription = () => {
		if (!description) return null;

		if (typeof description === 'string') {
			return <p className={element('description')}>{description}</p>;
		}

		return (
			<>
				{description.map((text, index) => (
					<p key={index} className={element('description')}>
						{text}
					</p>
				))}
			</>
		);
	};

	return (
		<div className={block({small: size === 'small'})}>
			<div className={element('logo-background')}>
				<img src="/svg/logo.svg" alt="" aria-hidden="true" />
			</div>
			<div className={element('content')}>
				{title && <h3 className={element('title')}>{title}</h3>}
				{renderDescription()}
				{children && <div className={element('actions')}>{children}</div>}
			</div>
		</div>
	);
};

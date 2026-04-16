import {FC, ReactNode} from 'react';

import {Title} from '@/components/Title/Title';
import {useBem} from '@/hooks/useBem';

import './legal-document.scss';

interface LegalDocumentProps {
	title: string;
	children: ReactNode;
	className?: string;
}

const UPDATE_DATE = '7 февраля 2026 г.';

export const LegalDocument: FC<LegalDocumentProps> = ({title, children, className}) => {
	const [block, element] = useBem('legal-document', className);

	return (
		<main className={block()}>
			<div className={element('content')}>
				<div className={element('header')}>
					<Title tag="h1" className={element('title')}>
						{title}
					</Title>
					<p className={element('date')}>Дата последнего обновления: {UPDATE_DATE}</p>
				</div>

				<div className={element('document')}>{children}</div>
			</div>
		</main>
	);
};

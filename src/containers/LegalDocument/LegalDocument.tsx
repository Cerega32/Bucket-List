import {FC, ReactNode} from 'react';

import {Title} from '@/components/Title/Title';
import {useBem} from '@/hooks/useBem';

import './legal-document.scss';

interface LegalDocumentProps {
	title: string;
	children: ReactNode;
	className?: string;
}

export const LegalDocument: FC<LegalDocumentProps> = ({title, children, className}) => {
	const [block, element] = useBem('legal-document', className);

	const currentDate = new Date().toLocaleDateString('ru-RU', {
		year: 'numeric',
		month: 'long',
		day: 'numeric',
	});

	return (
		<main className={block()}>
			<div className={element('content')}>
				<div className={element('header')}>
					<Title tag="h1" className={element('title')}>
						{title}
					</Title>
					<p className={element('date')}>Дата последнего обновления: {currentDate}</p>
				</div>

				<div className={element('document')}>{children}</div>
			</div>
		</main>
	);
};

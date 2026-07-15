import {FC, ReactNode} from 'react';
import {Link, useLocation} from 'react-router-dom';

import {Title} from '@/components/Title/Title';
import {useBem} from '@/hooks/useBem';
import {LEGAL_DOCUMENT_LINKS} from '@/utils/legal/legalDocuments';

import './legal-document.scss';

interface LegalDocumentProps {
	title: string;
	children: ReactNode;
	className?: string;
	showRelatedLinks?: boolean;
}

const UPDATE_DATE = '29 июня 2026 г.';

export const LegalDocument: FC<LegalDocumentProps> = (props) => {
	const {title, children, className, showRelatedLinks = false} = props;
	const [block, element] = useBem('legal-document', className);
	const {pathname} = useLocation();

	const relatedLinks = LEGAL_DOCUMENT_LINKS.filter((link) => link.to !== pathname);

	return (
		<main className={block()}>
			<div className={element('content')}>
				<div className={element('header')}>
					<Title tag="h1" className={element('title')}>
						{title}
					</Title>
					<p className={element('date')}>Дата последнего обновления: {UPDATE_DATE}</p>
				</div>

				<div className={element('document')}>
					{children}
					{showRelatedLinks && relatedLinks.length > 0 && (
						<section className={element('related')}>
							<h2>См. также</h2>
							<ul>
								{relatedLinks.map((link) => (
									<li key={link.to}>
										<Link to={link.to}>{link.label}</Link>
									</li>
								))}
							</ul>
						</section>
					)}
				</div>
			</div>
		</main>
	);
};

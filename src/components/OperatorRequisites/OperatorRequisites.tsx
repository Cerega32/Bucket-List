import {FC} from 'react';
import {Link} from 'react-router-dom';

import {useBem} from '@/hooks/useBem';
import {
	CONTACTS_REQUISITES_URL,
	OPERATOR_EMAIL,
	OPERATOR_FULL_NAME,
	OPERATOR_INN,
	OPERATOR_LOCATION,
	OPERATOR_STATUS,
} from '@/utils/legal/operatorInfo';

import './operator-requisites.scss';

interface OperatorRequisitesProps {
	className?: string;
	variant?: 'compact' | 'full';
}

export const OperatorRequisites: FC<OperatorRequisitesProps> = (props) => {
	const {className, variant = 'full'} = props;
	const [block, element] = useBem('operator-requisites', className);

	if (variant === 'compact') {
		return (
			<span className={block({compact: true})}>
				<span className={element('inline-part')}>{OPERATOR_FULL_NAME}</span>
				{OPERATOR_INN ? (
					<>
						<span className={element('sep')}>|</span>
						<span className={element('inline-part')}>ИНН {OPERATOR_INN}</span>
					</>
				) : null}
				<span className={element('sep')}>|</span>
				<Link to={`mailto:${OPERATOR_EMAIL}`} className={element('link')}>
					{OPERATOR_EMAIL}
				</Link>
				<span className={element('sep')}>|</span>
				<Link to={CONTACTS_REQUISITES_URL} className={element('link')}>
					Реквизиты
				</Link>
			</span>
		);
	}

	return (
		<div className={block()}>
			<p className={element('title')}>Сведения об администрации</p>
			<p className={element('text')}>
				{OPERATOR_FULL_NAME}
				{OPERATOR_INN ? (
					<>
						<br />
						ИНН: {OPERATOR_INN}
					</>
				) : null}
				<br />
				{OPERATOR_STATUS}
				<br />
				{OPERATOR_LOCATION}
				<br />
				Email:{' '}
				<Link to={`mailto:${OPERATOR_EMAIL}`} className={element('link')}>
					{OPERATOR_EMAIL}
				</Link>
			</p>
		</div>
	);
};

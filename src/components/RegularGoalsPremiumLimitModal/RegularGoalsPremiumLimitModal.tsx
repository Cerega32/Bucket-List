import {FC} from 'react';

import {Button} from '@/components/Button/Button';
import {Modal} from '@/components/Modal/Modal';
import {useBem} from '@/hooks/useBem';
import {OPERATOR_EMAIL} from '@/utils/legal/operatorInfo';
import {
	getRegularGoalsPremiumLimitMailtoHref,
	REGULAR_GOALS_PREMIUM_LIMIT_MODAL_TEXT,
} from '@/utils/regularGoal/regularGoalsPremiumLimitContent';

import './regular-goals-premium-limit-modal.scss';

interface RegularGoalsPremiumLimitModalProps {
	isOpen: boolean;
	onClose: () => void;
}

export const RegularGoalsPremiumLimitModal: FC<RegularGoalsPremiumLimitModalProps> = (props) => {
	const {isOpen, onClose} = props;
	const [block, element] = useBem('regular-goals-premium-limit-modal');

	return (
		<Modal isOpen={isOpen} onClose={onClose} className={block()} size="small" title="Нужно больше слотов?">
			<p className={element('text')}>{REGULAR_GOALS_PREMIUM_LIMIT_MODAL_TEXT}</p>
			<p className={element('email-line')}>
				Напишите нам на почту:{' '}
				<a className={element('email')} href={getRegularGoalsPremiumLimitMailtoHref()}>
					{OPERATOR_EMAIL}
				</a>
			</p>
			<Button className={element('close-btn')} theme="blue" type="button" onClick={onClose}>
				Понятно
			</Button>
		</Modal>
	);
};

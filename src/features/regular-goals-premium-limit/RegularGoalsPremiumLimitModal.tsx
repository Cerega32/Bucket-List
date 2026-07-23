import {FC} from 'react';

import {
	getRegularGoalsPremiumLimitMailtoHref,
	REGULAR_GOALS_PREMIUM_LIMIT_MODAL_TEXT,
} from '@/entities/regular-goal/lib/regularGoalsPremiumLimitContent';
import {OPERATOR_EMAIL} from '@/shared/config/legal/operatorInfo';
import {useBem} from '@/shared/lib/hooks/useBem';
import {Button} from '@/shared/ui/Button/Button';
import {Modal} from '@/shared/ui/Modal/Modal';

import '@/features/regular-goals-premium-limit/regular-goals-premium-limit-modal.scss';

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

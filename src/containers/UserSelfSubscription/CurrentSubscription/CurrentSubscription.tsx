import {observer} from 'mobx-react-lite';
import {FC, useState} from 'react';

import {Button} from '@/components/Button/Button';
import {ModalConfirm} from '@/components/ModalConfirm/ModalConfirm';
import {Svg} from '@/components/Svg/Svg';
import {useBem} from '@/hooks/useBem';

import './current-subscription.scss';

interface CurrentSubscriptionProps {
	type: 'free' | 'premium';
	expiresAt: string | null;
	isAutoRenew: boolean;
	onToggleAutoRenew?: (value: boolean) => void;
}

export const CurrentSubscription: FC<CurrentSubscriptionProps> = observer(({type, expiresAt, isAutoRenew, onToggleAutoRenew}) => {
	const [block, element] = useBem('current-subscription');
	const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

	const formatExpiryDate = (dateString: string) => {
		const date = new Date(dateString);
		return date.toLocaleDateString('ru-RU', {
			day: 'numeric',
			month: 'long',
			year: 'numeric',
		});
	};

	const handleDisableAutoRenew = () => {
		if (onToggleAutoRenew) {
			onToggleAutoRenew(false);
		}
	};

	return (
		<>
			<div className={block()}>
				<Svg icon={type === 'premium' ? 'award' : 'rocket'} className={element('icon', {premium: type === 'premium'})} />
				<div className={element('content')}>
					<div className={element('text')}>
						<strong>Текущая подписка:</strong> {type === 'premium' ? 'Премиум' : 'Базовый'}
						{type === 'premium' && expiresAt && ` • Действует до ${formatExpiryDate(expiresAt)}`}
						{isAutoRenew && type === 'premium' && ' • Автопродление включено'}
					</div>
					{type === 'premium' && isAutoRenew && (
						<div className={element('auto-renew-control')}>
							<Button
								theme="blue"
								size="small"
								className={element('disable-button')}
								onClick={() => setIsConfirmModalOpen(true)}
							>
								Отключить автопродление
							</Button>
						</div>
					)}
				</div>
			</div>
			<ModalConfirm
				isOpen={isConfirmModalOpen}
				onClose={() => setIsConfirmModalOpen(false)}
				title="Отключить автопродление?"
				text={`Вы уверены, что хотите отключить автоматическое продление подписки? 
          После окончания текущего периода подписка не будет продлена автоматически.`}
				textBtn="Отключить"
				themeBtn="red"
				handleBtn={handleDisableAutoRenew}
			/>
		</>
	);
});

import {observer} from 'mobx-react-lite';
import {FC, useState} from 'react';

import {useBem} from '@/shared/lib/hooks/useBem';
import {Button} from '@/shared/ui/Button/Button';
import {ModalConfirm} from '@/shared/ui/ModalConfirm/ModalConfirm';
import {Svg} from '@/shared/ui/Svg/Svg';

import '@/widgets/user-self-subscription/ui/CurrentSubscription/current-subscription.scss';

interface CurrentSubscriptionProps {
	type: 'free' | 'premium';
	expiresAt: string | null;
	isAutoRenew: boolean;
	hasSavedPaymentMethod: boolean;
	onUnlinkCard?: () => void;
	isUnlinkLoading?: boolean;
}

const formatExpiryDate = (dateString: string) => {
	const date = new Date(dateString);
	return date.toLocaleDateString('ru-RU', {
		day: 'numeric',
		month: 'long',
		year: 'numeric',
	});
};

export const CurrentSubscription: FC<CurrentSubscriptionProps> = observer(
	({type, expiresAt, isAutoRenew, hasSavedPaymentMethod, onUnlinkCard, isUnlinkLoading = false}) => {
		const [block, element] = useBem('current-subscription');
		const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

		const showControl = type === 'premium' && (isAutoRenew || hasSavedPaymentMethod);
		const expirySuffix = expiresAt ? ` до ${formatExpiryDate(expiresAt)}` : '';
		const modalText =
			'Повторные списания прекратятся. Сохранённый способ оплаты (карта или другой метод, ' +
			'выбранный при оплате через ЮKassa) будет удалён из нашей системы. ' +
			`Подписка Premium останется активной${expirySuffix}`;

		const handleConfirm = () => {
			if (onUnlinkCard) {
				onUnlinkCard();
			}
			setIsConfirmModalOpen(false);
		};

		return (
			<>
				<div className={block()}>
					<Svg icon={type === 'premium' ? 'award' : 'rocket'} className={element('icon', {premium: type === 'premium'})} />
					<div className={element('content')}>
						<div className={element('text')}>
							<strong>Текущая подписка:</strong> {type === 'premium' ? 'Премиум' : 'Базовый'}
							{type === 'premium' && expiresAt && ` • Действует до ${formatExpiryDate(expiresAt)}`}
							{isAutoRenew && type === 'premium' && ' • Автосписание включено'}
						</div>
						{showControl && (
							<div className={element('auto-renew-control')}>
								<Button
									theme="blue"
									size="small"
									className={element('disable-button')}
									onClick={() => setIsConfirmModalOpen(true)}
									disabled={isUnlinkLoading}
								>
									{isUnlinkLoading ? 'Отключение...' : 'Отключить автосписание'}
								</Button>
							</div>
						)}
					</div>
				</div>
				<ModalConfirm
					isOpen={isConfirmModalOpen}
					onClose={() => setIsConfirmModalOpen(false)}
					title="Отключить автосписание?"
					text={modalText}
					textBtn="Отключить"
					themeBtn="red"
					handleBtn={handleConfirm}
				/>
			</>
		);
	}
);

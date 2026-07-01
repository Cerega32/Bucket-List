import {observer} from 'mobx-react-lite';
import {FC, useCallback, useEffect, useRef, useState} from 'react';

import {Button} from '@/components/Button/Button';
import {Modal} from '@/components/Modal/Modal';
import {Svg} from '@/components/Svg/Svg';
import {Title} from '@/components/Title/Title';
import {useBem} from '@/hooks/useBem';
import {checkPaymentStatus, confirmPayment} from '@/utils/api/subscription';

import './payment-return-modal.scss';

interface PaymentReturnModalProps {
	isOpen: boolean;
	onClose: () => void;
	paymentId: string | null;
	onPaymentSuccess?: () => void;
}

const POLL_INTERVAL_MS = 3000;
const MAX_POLL_ATTEMPTS = 40;

export const PaymentReturnModal: FC<PaymentReturnModalProps> = observer(({isOpen, onClose, paymentId, onPaymentSuccess}) => {
	const [block, element] = useBem('payment-return-modal');
	const [paymentStatus, setPaymentStatus] = useState<'pending' | 'paid' | 'failed' | 'cancelled'>('pending');
	const paymentIdRef = useRef<string | null>(null);
	const pollAttemptsRef = useRef(0);

	useEffect(() => {
		if (paymentId) {
			paymentIdRef.current = paymentId;
			setPaymentStatus('pending');
			pollAttemptsRef.current = 0;
		}
	}, [paymentId]);

	const handlePaymentSuccess = useCallback(() => {
		if (onPaymentSuccess) {
			onPaymentSuccess();
		}
	}, [onPaymentSuccess]);

	const handleClose = useCallback(() => {
		onClose();
	}, [onClose]);

	useEffect(() => {
		if (!isOpen || !paymentId || paymentStatus === 'paid') {
			return undefined;
		}

		let cancelled = false;

		const pollStatus = async () => {
			if (cancelled || !paymentIdRef.current) {
				return;
			}

			const response = await checkPaymentStatus(paymentIdRef.current);
			if (cancelled || !response.success || !response.data) {
				return;
			}

			setPaymentStatus(response.data.status);

			if (response.data.status === 'paid') {
				const confirmResponse = await confirmPayment(paymentIdRef.current);
				if (confirmResponse.success) {
					handlePaymentSuccess();
					setTimeout(() => {
						handleClose();
					}, 2000);
				}
				return;
			}

			if (response.data.status === 'failed' || response.data.status === 'cancelled') {
				return;
			}

			pollAttemptsRef.current += 1;
			if (pollAttemptsRef.current < MAX_POLL_ATTEMPTS) {
				setTimeout(pollStatus, POLL_INTERVAL_MS);
			}
		};

		pollStatus();

		return () => {
			cancelled = true;
		};
	}, [isOpen, paymentId, paymentStatus, handlePaymentSuccess, handleClose]);

	if (!isOpen || !paymentId) return null;

	return (
		<Modal isOpen={isOpen} onClose={onClose} className={block()} size="small">
			<div className={element('header')}>
				<Title tag="h2" className={element('title')}>
					Оплата подписки
				</Title>
			</div>

			<div className={element('content')}>
				{paymentStatus === 'paid' ? (
					<div className={element('success')}>
						<Svg icon="done" className={element('success-icon')} />
						<p className={element('success-text')}>Оплата успешно подтверждена!</p>
						<p className={element('success-subtext')}>Ваша подписка Premium активирована</p>
					</div>
				) : paymentStatus === 'failed' || paymentStatus === 'cancelled' ? (
					<div className={element('placeholder')}>
						<Svg icon="crying" className={element('placeholder-icon')} />
						<p className={element('placeholder-title')}>Оплата не завершена</p>
						<p className={element('placeholder-text')}>Платёж отменён или не прошёл. Попробуйте оформить подписку снова.</p>
					</div>
				) : (
					<div className={element('status')}>
						<div className={element('status-wrapper')}>
							<div className={element('status-loader')} />
							<p className={element('status-text')}>Проверяем статус оплаты...</p>
							<p className={element('placeholder-text')}>Обычно это занимает несколько секунд. Не закрывайте окно.</p>
						</div>
					</div>
				)}
			</div>

			{paymentStatus !== 'paid' && (
				<div className={element('footer')}>
					<Button theme="blue-light" className={element('btn')} onClick={onClose} type="button">
						{paymentStatus === 'pending' ? 'Закрыть' : 'Понятно'}
					</Button>
				</div>
			)}
		</Modal>
	);
});

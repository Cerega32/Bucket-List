import {observer} from 'mobx-react-lite';
import {FC, useEffect, useRef, useState} from 'react';

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

const POLL_INTERVAL_MS = 2000;
const MAX_POLL_ATTEMPTS = 10;

type PaymentStatus = 'pending' | 'paid' | 'failed' | 'cancelled';

const isTerminalStatus = (status: PaymentStatus) => status === 'paid' || status === 'failed' || status === 'cancelled';

export const PaymentReturnModal: FC<PaymentReturnModalProps> = observer(({isOpen, onClose, paymentId, onPaymentSuccess}) => {
	const [block, element] = useBem('payment-return-modal');
	const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('pending');
	const onPaymentSuccessRef = useRef(onPaymentSuccess);
	const onCloseRef = useRef(onClose);

	onPaymentSuccessRef.current = onPaymentSuccess;
	onCloseRef.current = onClose;

	useEffect(() => {
		if (!isOpen || !paymentId) {
			return undefined;
		}

		let cancelled = false;
		let timeoutId: ReturnType<typeof setTimeout> | undefined;
		let attempts = 0;

		const finishAsCancelled = () => {
			if (!cancelled) {
				setPaymentStatus('cancelled');
			}
		};

		const scheduleNextPoll = (poll: () => void) => {
			attempts += 1;
			if (attempts >= MAX_POLL_ATTEMPTS) {
				finishAsCancelled();
				return;
			}
			timeoutId = setTimeout(poll, POLL_INTERVAL_MS);
		};

		const pollStatus = async () => {
			if (cancelled) {
				return;
			}

			const response = await checkPaymentStatus(paymentId);
			if (cancelled) {
				return;
			}

			if (!response.success || !response.data) {
				scheduleNextPoll(pollStatus);
				return;
			}

			const {status} = response.data;
			setPaymentStatus(status);

			if (status === 'paid') {
				const confirmResponse = await confirmPayment(paymentId);
				if (cancelled) {
					return;
				}
				if (confirmResponse.success) {
					onPaymentSuccessRef.current?.();
					timeoutId = setTimeout(() => {
						onCloseRef.current();
					}, 2000);
				}
				return;
			}

			if (isTerminalStatus(status)) {
				return;
			}

			scheduleNextPoll(pollStatus);
		};

		setPaymentStatus('pending');
		pollStatus();

		return () => {
			cancelled = true;
			if (timeoutId !== undefined) {
				clearTimeout(timeoutId);
			}
		};
	}, [isOpen, paymentId]);

	if (!isOpen || !paymentId) return null;

	const isPolling = paymentStatus === 'pending';

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
						<div className={element('status-row')}>
							<div className={element('status-loader')} aria-hidden="true" />
							<p className={element('status-text')}>Проверяем статус оплаты...</p>
						</div>
						<p className={element('status-hint')}>Обычно это занимает несколько секунд. Не закрывайте окно.</p>
					</div>
				)}
			</div>

			{paymentStatus !== 'paid' && (
				<div className={element('footer')}>
					<Button theme="blue-light" className={element('btn')} onClick={onClose} type="button">
						{isPolling ? 'Закрыть' : 'Понятно'}
					</Button>
				</div>
			)}
		</Modal>
	);
});

import {observer} from 'mobx-react-lite';
import {FC, useCallback, useEffect, useRef, useState} from 'react';

import {Button} from '@/components/Button/Button';
import {Modal} from '@/components/Modal/Modal';
import {Svg} from '@/components/Svg/Svg';
import {Title} from '@/components/Title/Title';
import {useBem} from '@/hooks/useBem';
import {checkPaymentStatus, confirmPayment, IPayment} from '@/utils/api/subscription';

import './qr-payment-modal.scss';

interface QRPaymentModalProps {
	isOpen: boolean;
	onClose: () => void;
	payment: IPayment | null;
	onPaymentSuccess?: () => void;
}

export const QRPaymentModal: FC<QRPaymentModalProps> = observer(({isOpen, onClose, payment, onPaymentSuccess}) => {
	const [block, element] = useBem('qr-payment-modal');
	const [isChecking, setIsChecking] = useState(false);
	const [paymentStatus, setPaymentStatus] = useState<'pending' | 'paid' | 'failed' | 'cancelled'>('pending');
	const [hasCheckedOnce, setHasCheckedOnce] = useState(false);
	const paymentIdRef = useRef<string | null>(null);

	// Сохраняем paymentId в ref для стабильной ссылки и сбрасываем состояние при новом платеже
	useEffect(() => {
		if (payment) {
			paymentIdRef.current = payment.paymentId;
			setPaymentStatus('pending');
			setHasCheckedOnce(false);
		}
	}, [payment?.paymentId]);

	const handlePaymentSuccess = useCallback(() => {
		if (onPaymentSuccess) {
			onPaymentSuccess();
		}
	}, [onPaymentSuccess]);

	const handleClose = useCallback(() => {
		onClose();
	}, [onClose]);

	// Проверка статуса платежа при открытии модалки
	useEffect(() => {
		if (!isOpen || !payment || paymentStatus === 'paid') {
			return;
		}

		const checkStatus = async () => {
			if (isChecking || !paymentIdRef.current) return;

			setIsChecking(true);
			try {
				const response = await checkPaymentStatus(paymentIdRef.current);

				if (response.success && response.data) {
					setHasCheckedOnce(true);
					// Обновляем статус только если он изменился
					if (response.data.status !== paymentStatus) {
						setPaymentStatus(response.data.status);

						if (response.data.status === 'paid') {
							// Платеж оплачен, активируем подписку
							const confirmResponse = await confirmPayment(paymentIdRef.current);
							if (confirmResponse.success) {
								handlePaymentSuccess();
								setTimeout(() => {
									handleClose();
								}, 2000);
							}
						}
					}
				}
			} catch (error) {
				console.error('Ошибка при проверке статуса платежа:', error);
			} finally {
				setIsChecking(false);
			}
		};

		checkStatus();
	}, [isOpen, payment?.paymentId, handlePaymentSuccess, handleClose]);

	if (!isOpen || !payment) return null;

	return (
		<Modal isOpen={isOpen} onClose={onClose} className={block()} size="small">
			<div className={element('header')}>
				<Title tag="h2" className={element('title')}>
					Оплата по QR-коду
				</Title>
			</div>

			<div className={element('content')}>
				{paymentStatus === 'paid' ? (
					<div className={element('success')}>
						<Svg icon="check" className={element('success-icon')} />
						<p className={element('success-text')}>Оплата успешно подтверждена!</p>
						<p className={element('success-subtext')}>Ваша подписка активирована</p>
					</div>
				) : (
					<>
						{/* Заглушка QR */}
						<div className={element('placeholder')}>
							<Svg icon="crying" className={element('placeholder-icon')} />
							<p className={element('placeholder-title')}>Подключение Premium временно недоступно</p>
							<p className={element('placeholder-text')}>
								Используйте бесплатный режим. Приносим извинения и уже работаем над решением.
							</p>
						</div>

						{/* <div className={element('qr-wrapper')}>
								<img
									src={`/qr-codes/qr-${payment.amount}.png`}
									alt="QR-код для оплаты"
									className={element('qr-code')}
								/>
							</div> */}

						<div className={element('info')}>
							<div className={element('info-item')}>
								<span className={element('info-label')}>Сумма:</span>
								<span className={element('info-value')}>{payment.amount}₽</span>
							</div>
							<div className={element('info-item')}>
								<span className={element('info-label')}>Период:</span>
								<span className={element('info-value')}>
									{payment.periodMonths}{' '}
									{payment.periodMonths === 1 ? 'месяц' : payment.periodMonths < 5 ? 'месяца' : 'месяцев'}
								</span>
							</div>
							<div className={element('info-item')}>
								<span className={element('info-label')}>Автоподписка:</span>
								<span className={element('info-value')}>{payment.autoRenew ? 'Включено' : 'Отключено'}</span>
							</div>
						</div>

						<div className={element('instructions')}>
							<Svg icon="info" className={element('instructions-icon')} />
							<div>
								<p className={element('instructions-title')}>Инструкция по оплате:</p>
								<ol className={element('instructions-list')}>
									<li>Откройте приложение вашего банка</li>
									<li>Найдите функцию &quot;Оплата по QR-коду&quot; или &quot;Сканировать QR&quot;</li>
									<li>Отсканируйте QR-код выше</li>
									<li>Проверьте данные и подтвердите оплату</li>
									<li>Статус оплаты обновится автоматически</li>
								</ol>
							</div>
						</div>

						<div className={element('status')}>
							{paymentStatus === 'pending' && (
								<div className={element('status-wrapper')}>
									<div className={element('status-loader')} />
									<p className={element('status-text')}>
										{hasCheckedOnce ? 'Ожидание оплаты...' : 'Проверка статуса оплаты...'}
									</p>
								</div>
							)}
						</div>
					</>
				)}
			</div>

			{paymentStatus !== 'paid' && (
				<div className={element('footer')}>
					<Button theme="blue-light" className={element('btn')} onClick={onClose} type="button">
						Отмена
					</Button>
				</div>
			)}
		</Modal>
	);
});

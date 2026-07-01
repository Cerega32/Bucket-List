import {observer} from 'mobx-react-lite';
import {FC, useEffect, useState} from 'react';
import {Link} from 'react-router-dom';

import {Button} from '@/components/Button/Button';
import {FieldCheckbox} from '@/components/FieldCheckbox/FieldCheckbox';
import {Svg} from '@/components/Svg/Svg';
import {Title} from '@/components/Title/Title';
import {useBem} from '@/hooks/useBem';

import './subscription-payment.scss';

interface SubscriptionPeriod {
	value: number;
	label: string;
	price: number;
	pricePerMonth: number;
	discount?: number;
}

interface SubscriptionPaymentProps {
	periods: readonly SubscriptionPeriod[];
	onPayment?: (period: number, autoRenew: boolean) => void;
	variant?: 'full' | 'preview';
	mode?: 'purchase' | 'renew';
	isPaymentLoading?: boolean;
}

export const SubscriptionPayment: FC<SubscriptionPaymentProps> = observer(
	({periods, onPayment, variant = 'full', mode = 'purchase', isPaymentLoading = false}) => {
		const [block, element] = useBem('subscription-payment');
		const [selectedPeriod, setSelectedPeriod] = useState<number>(12);
		const [isAutoRenew, setIsAutoRenew] = useState(false);
		const [agreedToTerms, setAgreedToTerms] = useState(false);
		const [agreedToAutoRenew, setAgreedToAutoRenew] = useState(false);
		const [errorMessage, setErrorMessage] = useState<string>('');

		const selectedPeriodData = periods.find((p) => p.value === selectedPeriod) || periods[0];
		const isPreview = variant === 'preview';

		useEffect(() => {
			if (!isAutoRenew) {
				setAgreedToAutoRenew(false);
			}
		}, [isAutoRenew]);

		const handlePayment = (e: React.MouseEvent<HTMLButtonElement>) => {
			e.preventDefault();
			if (!agreedToTerms) {
				setErrorMessage('Необходимо согласиться с условиями оформления подписки');
				return;
			}
			if (isAutoRenew && !agreedToAutoRenew) {
				setErrorMessage('Необходимо согласиться на автоматическое продление подписки');
				return;
			}
			setErrorMessage('');
			if (onPayment) {
				onPayment(selectedPeriod, isAutoRenew);
			}
		};

		const isPaymentDisabled = !agreedToTerms || (isAutoRenew && !agreedToAutoRenew);

		return (
			<div className={block()}>
				<Title tag="h3" className={element('title')}>
					{isPreview ? 'Стоимость Premium' : mode === 'purchase' ? 'Оформить Premium' : 'Продлить или сменить период'}
				</Title>

				{!isPreview && mode === 'renew' && (
					<p className={element('hint')}>
						Выбранный период добавится к текущей дате окончания. Можно продлить на тот же срок или выбрать другой — например,
						перейти с месяца на год.
					</p>
				)}

				<div className={element('periods')}>
					{periods.map((period) =>
						isPreview ? (
							<div key={period.value} className={element('period')}>
								{period.value === 12 && (
									<div className={element('period-badge')}>
										<Svg icon="star" />
									</div>
								)}
								<div className={element('period-name')}>{period.label}</div>
								<div className={element('period-price')}>
									{period.price}₽
									{period.discount && <span className={element('period-discount')}>-{period.discount}%</span>}
								</div>
								<div className={element('period-per-month')}>{period.pricePerMonth}₽/мес</div>
							</div>
						) : (
							<button
								key={period.value}
								type="button"
								className={element('period', {
									active: selectedPeriod === period.value,
								})}
								onClick={() => setSelectedPeriod(period.value)}
							>
								{period.value === 12 && (
									<div className={element('period-badge')}>
										<Svg icon="star" />
									</div>
								)}
								<div className={element('period-name')}>{period.label}</div>
								<div className={element('period-price')}>
									{period.price}₽
									{period.discount && <span className={element('period-discount')}>-{period.discount}%</span>}
								</div>
								<div className={element('period-per-month')}>{period.pricePerMonth}₽/мес</div>
							</button>
						)
					)}
				</div>

				{!isPreview && (
					<>
						<div className={element('total')}>
							<span className={element('total-label')}>К оплате:</span>
							<span className={element('total-price')}>{selectedPeriodData.price}₽</span>
						</div>

						<div className={element('checkboxes')}>
							<FieldCheckbox
								id="auto-renew"
								text="Автоматически продлевать подписку"
								checked={isAutoRenew}
								setChecked={setIsAutoRenew}
							/>
							{isAutoRenew && (
								<div className={element('terms')}>
									<FieldCheckbox
										id="auto-renew-consent"
										text=""
										checked={agreedToAutoRenew}
										setChecked={(value) => {
											setAgreedToAutoRenew(value);
											if (value) {
												setErrorMessage('');
											}
										}}
									/>
									<label htmlFor="auto-renew-consent" className={element('terms-label')}>
										Согласен на автоматическое списание средств при продлении подписки на условиях{' '}
										<Link to="/subscription-offer#auto-renewal" target="_blank" className={element('link')}>
											раздела об автопродлении
										</Link>{' '}
										<Link to="/subscription-offer" target="_blank" className={element('link')}>
											оферты Premium
										</Link>
									</label>
								</div>
							)}
							<div className={element('terms')}>
								<FieldCheckbox
									id="terms"
									text=""
									checked={agreedToTerms}
									setChecked={(value) => {
										setAgreedToTerms(value);
										if (value) {
											setErrorMessage('');
										}
									}}
								/>
								<label htmlFor="terms" className={element('terms-label')}>
									Я согласен с{' '}
									<Link to="/subscription-offer" target="_blank" className={element('link')}>
										офертой на подписку Premium
									</Link>
									,{' '}
									<Link to="/consent" target="_blank" className={element('link')}>
										Согласием на обработку персональных данных
									</Link>
									,{' '}
									<Link to="/terms" target="_blank" className={element('link')}>
										условиями использования
									</Link>{' '}
									и{' '}
									<Link to="/privacy" target="_blank" className={element('link')}>
										политикой конфиденциальности
									</Link>
								</label>
							</div>
						</div>

						{errorMessage && (
							<div className={element('error-message')}>
								<Svg icon="cross" className={element('error-icon')} />
								<span>{errorMessage}</span>
							</div>
						)}

						<Button
							theme="blue"
							className={element('button')}
							onClick={handlePayment}
							disabled={isPaymentDisabled || isPaymentLoading}
						>
							{isPaymentLoading
								? 'Переход к оплате...'
								: mode === 'purchase'
								? `Оплатить ${String(selectedPeriodData.price)}₽`
								: `Продлить за ${String(selectedPeriodData.price)}₽`}
						</Button>
					</>
				)}
			</div>
		);
	}
);

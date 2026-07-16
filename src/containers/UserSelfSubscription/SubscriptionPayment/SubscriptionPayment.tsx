import {observer} from 'mobx-react-lite';
import {FC, useState} from 'react';
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
		const [errorMessage, setErrorMessage] = useState<string>('');

		const selectedPeriodData = periods.find((p) => p.value === selectedPeriod) || periods[0];
		const isPreview = variant === 'preview';

		const handlePayment = (e: React.MouseEvent<HTMLButtonElement>) => {
			e.preventDefault();
			if (!agreedToTerms) {
				setErrorMessage('Необходимо согласиться с условиями оформления подписки');
				return;
			}
			setErrorMessage('');
			if (onPayment) {
				onPayment(selectedPeriod, isAutoRenew);
			}
		};

		const isPaymentDisabled = !agreedToTerms;

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
							<div className={element('terms')}>
								<FieldCheckbox
									id="auto-renew"
									text=""
									checked={isAutoRenew}
									setChecked={(value) => {
										setIsAutoRenew(value);
										if (value) {
											setErrorMessage('');
										}
									}}
								/>
								<label htmlFor="auto-renew" className={element('terms-label')}>
									Автоматически продлевать подписку и согласен на списание средств при продлении на условиях{' '}
									<Link to="/subscription-offer#auto-renewal" target="_blank" className={element('link')}>
										раздела об автопродлении
									</Link>{' '}
									<Link to="/subscription-offer" target="_blank" className={element('link')}>
										оферты Premium
									</Link>
								</label>
							</div>
							{isAutoRenew && (
								<p className={element('auto-renew-hint')}>
									Списание в день продления пройдёт с тем же способом оплаты, который вы выберете на странице ЮKassa
									(карта, T-Pay, СБП и др.). Надёжнее всего для автопродления — банковская карта.
								</p>
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

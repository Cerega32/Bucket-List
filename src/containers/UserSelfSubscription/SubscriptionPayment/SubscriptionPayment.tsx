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
}

export const SubscriptionPayment: FC<SubscriptionPaymentProps> = observer(({periods, onPayment}) => {
	const [block, element] = useBem('subscription-payment');
	const [selectedPeriod, setSelectedPeriod] = useState<number>(12);
	const [isAutoRenew, setIsAutoRenew] = useState(false);
	const [agreedToTerms, setAgreedToTerms] = useState(false);
	const [errorMessage, setErrorMessage] = useState<string>('');

	const selectedPeriodData = periods.find((p) => p.value === selectedPeriod) || periods[0];

	const handlePayment = (e: React.MouseEvent<HTMLButtonElement>) => {
		e.preventDefault();
		if (!agreedToTerms) {
			setErrorMessage('Необходимо согласиться с условиями использования');
			return;
		}
		setErrorMessage('');
		if (onPayment) {
			onPayment(selectedPeriod, isAutoRenew);
		}
	};

	return (
		<div className={block()}>
			<Title tag="h3" className={element('title')}>
				Оформить Premium
			</Title>

			<div className={element('periods')}>
				{periods.map((period) => (
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
							{period.price}₽{period.discount && <span className={element('period-discount')}>-{period.discount}%</span>}
						</div>
						<div className={element('period-per-month')}>{period.pricePerMonth}₽/мес</div>
					</button>
				))}
			</div>

			<div className={element('total')}>
				<span className={element('total-label')}>К оплате:</span>
				<span className={element('total-price')}>{selectedPeriodData.price}₽</span>
			</div>

			<div className={element('checkboxes')}>
				<FieldCheckbox id="auto-renew" text="Автоматически продлевать подписку" checked={isAutoRenew} setChecked={setIsAutoRenew} />
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
					{/* TODO: добавить ссылки на страницы термов и политики конфиденциальности */}
					<label htmlFor="terms" className={element('terms-label')}>
						Я согласен с{' '}
						<Link to="/terms" className={element('link')}>
							условиями использования
						</Link>{' '}
						и{' '}
						<Link to="/privacy" className={element('link')}>
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

			<Button theme="blue" className={element('button')} onClick={handlePayment} active={!agreedToTerms}>
				{`Оплатить ${String(selectedPeriodData.price)}₽`}
			</Button>
		</div>
	);
});

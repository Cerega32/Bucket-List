import {FC, FormEvent, useEffect, useState} from 'react';

import {postRequestPasswordReset} from '@/entities/user/api/postRequestPasswordReset';
import {useBem} from '@/shared/lib/hooks/useBem';
import {normalizeEmail} from '@/shared/lib/text/normalizeEmail';
import {Button} from '@/shared/ui/Button/Button';
import {FieldInput} from '@/shared/ui/FieldInput/FieldInput';
import {Svg} from '@/shared/ui/Svg/Svg';
import {Title} from '@/shared/ui/Title/Title';

import '@/features/forgot-password/forgot-password.scss';

interface ForgotPasswordProps {
	className?: string;
	onBack?: () => void;
	initialEmail?: string;
}

export const ForgotPassword: FC<ForgotPasswordProps> = (props) => {
	const {className, onBack, initialEmail = ''} = props;

	const [block, element] = useBem('forgot-password', className);
	const [email, setEmail] = useState(initialEmail);
	const [error, setError] = useState('');

	useEffect(() => {
		setEmail(initialEmail);
	}, [initialEmail]);
	const [isLoading, setIsLoading] = useState(false);
	const [isSent, setIsSent] = useState(false);

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault();
		const normalizedEmail = normalizeEmail(email);
		setError('');
		setIsLoading(true);

		if (!normalizedEmail) {
			setError('Введите email адрес');
			setIsLoading(false);
			return;
		}

		const res = await postRequestPasswordReset(normalizedEmail);
		if (res.success) {
			setIsSent(true);
		} else {
			setError(res.error || 'Произошла ошибка при отправке письма');
		}
		setIsLoading(false);
	};

	if (isSent) {
		return (
			<div className={block()}>
				<Svg icon="icon-logo" className={element('logo')} />
				<Title tag="h3" className={element('title')}>
					Письмо отправлено
				</Title>
				<div className={element('message')}>
					<p>
						Мы отправили письмо для восстановления пароля на адрес <strong>{email}</strong>
					</p>
					<p>Проверьте почту и следуйте инструкциям в письме.</p>
					<p className={element('note')}>
						Если письмо не пришло, проверьте папку &quot;Спам&quot; или попробуйте отправить запрос повторно.
					</p>
				</div>
				<div className={element('actions')}>
					{onBack && (
						<Button theme="blue-light" className={element('btn')} onClick={onBack} typeBtn="button">
							Вернуться к входу
						</Button>
					)}
				</div>
			</div>
		);
	}

	return (
		<form className={block()} onSubmit={handleSubmit}>
			<Svg icon="icon-logo" className={element('logo')} />
			<Title tag="h3" className={element('title')}>
				Восстановление пароля
			</Title>
			<div className={element('form')}>
				<p className={element('description')}>
					Введите email адрес, который вы использовали при регистрации. Мы отправим вам письмо с инструкциями для восстановления
					пароля.
				</p>
				<FieldInput
					placeholder="E-mail"
					id="email"
					text="E-mail"
					type="email"
					value={email}
					setValue={setEmail}
					className={element('field')}
					required
					autoComplete="email"
				/>
				{error && <p className={element('error')}>{error}</p>}
				<Button typeBtn="submit" icon="email" theme="blue" className={element('btn')} disabled={isLoading} loading={isLoading}>
					{isLoading ? 'Отправка...' : 'Отправить письмо'}
				</Button>
				{onBack && (
					<Button theme="no-border" className={element('btn-back')} onClick={onBack} typeBtn="button">
						Вернуться к входу
					</Button>
				)}
			</div>
		</form>
	);
};

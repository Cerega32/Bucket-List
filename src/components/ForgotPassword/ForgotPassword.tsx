import {FC, FormEvent, useEffect, useState} from 'react';

import {Button} from '@/components/Button/Button';
import {FieldInput} from '@/components/FieldInput/FieldInput';
import {Svg} from '@/components/Svg/Svg';
import {Title} from '@/components/Title/Title';
import {useBem} from '@/hooks/useBem';
import {postRequestPasswordReset} from '@/utils/api/post/postRequestPasswordReset';

import './forgot-password.scss';

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
		setError('');
		setIsLoading(true);

		if (!email) {
			setError('Введите email адрес');
			setIsLoading(false);
			return;
		}

		const res = await postRequestPasswordReset(email);
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

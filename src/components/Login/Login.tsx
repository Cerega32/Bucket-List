import {FC, FormEvent, useState} from 'react';

import {Button} from '@/components/Button/Button';
import {FieldInput} from '@/components/FieldInput/FieldInput';
import {Svg} from '@/components/Svg/Svg';
import {useBem} from '@/hooks/useBem';
import {postLogin} from '@/utils/api/post/postLogin';
import './login.scss';

import {FieldCheckbox} from '../FieldCheckbox/FieldCheckbox';
import {Title} from '../Title/Title';

interface LoginProps {
	className?: string;
	openRegistration: () => void;
	openForgotPassword?: () => void;
	successLogin: (data: any) => void;
	isPage?: boolean;
}

export const Login: FC<LoginProps> = (props) => {
	const {className, openRegistration, openForgotPassword, successLogin, isPage} = props;

	const [block, element] = useBem('login', className);
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [error, setError] = useState('');
	const [emailError, setEmailError] = useState<Array<string> | undefined>(undefined);
	const [passwordError, setPasswordError] = useState<Array<string> | undefined>(undefined);
	const [rememberMe, setRememberMe] = useState(false);

	const signIn = async (e: FormEvent) => {
		setError('');
		setEmailError(undefined);
		setPasswordError(undefined);
		e.preventDefault();

		const res = await postLogin(email, password, rememberMe);
		if (res.success) {
			// Прогресс заданий обновляется автоматически на бэкенде

			successLogin(res.data);
			return;
		}
		// Обрабатываем ошибки из API
		if (res.errors) {
			// Если ошибка в формате {email: [...], password: [...], non_field_errors: [...]}
			if (typeof res.errors === 'object' && !Array.isArray(res.errors)) {
				if (res.errors.email) {
					setEmailError(Array.isArray(res.errors.email) ? res.errors.email : [res.errors.email]);
				}
				if (res.errors.password) {
					setPasswordError(Array.isArray(res.errors.password) ? res.errors.password : [res.errors.password]);
				}
				if (res.errors.non_field_errors) {
					const nonFieldErrors = Array.isArray(res.errors.non_field_errors)
						? res.errors.non_field_errors
						: [res.errors.non_field_errors];
					setError(nonFieldErrors[0] || 'Неверный email или пароль');
				} else if (!res.errors.email && !res.errors.password) {
					// Если нет специфичных ошибок полей, показываем общую
					setError('Неверный email или пароль');
				}
			} else if (typeof res.errors === 'string') {
				// Если ошибка - строка
				setError(res.errors);
			} else if (Array.isArray(res.errors)) {
				// Если ошибка - массив
				setError(res.errors[0] || 'Неверный email или пароль');
			} else {
				setError('Неверный email или пароль');
			}
		} else if (res.error) {
			// Если ошибка в формате {error: "..."}
			setError(res.error);
		} else {
			setError('Неверный email или пароль');
		}
	};

	return (
		<form className={block({page: isPage})} onSubmit={(e) => signIn(e)}>
			<Svg icon="icon-logo" className={element('logo')} />
			<Title tag="h3" className={element('title')}>
				Вход в лучшую жизнь
			</Title>
			<div className={element('form')}>
				<FieldInput
					placeholder="E-mail"
					id="email"
					text="E-mail"
					value={email}
					setValue={setEmail}
					className={element('field')}
					required
					error={emailError}
				/>
				<FieldInput
					placeholder="Пароль для входа"
					id="password"
					text="Пароль"
					value={password}
					setValue={setPassword}
					className={element('field')}
					type="password"
					required
					error={passwordError}
				/>
				{error && <p className={element('error')}>{error}</p>}
				<div className={element('move')}>
					<FieldCheckbox id="remember" text="Запомнить меня" checked={rememberMe} setChecked={setRememberMe} />
					{openForgotPassword && (
						<Button theme="no-border" className={element('forgot-password')} onClick={openForgotPassword} typeBtn="button">
							Забыли пароль?
						</Button>
					)}
				</div>
				<Button typeBtn="submit" icon="sign-in" theme="blue" className={element('btn')} onClick={signIn}>
					Войти
				</Button>
				<p className={element('registration')}>
					У вас нет аккаунта?{' '}
					<Button theme="no-border" className={element('btn-registration')} onClick={openRegistration}>
						Регистрация
					</Button>
				</p>
			</div>
		</form>
	);
};

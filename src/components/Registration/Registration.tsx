import { FC, FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';

import { Button } from '@/components/Button/Button';
import { FieldCheckbox } from '@/components/FieldCheckbox/FieldCheckbox';
import { FieldInput } from '@/components/FieldInput/FieldInput';
import { Svg } from '@/components/Svg/Svg';
import { useBem } from '@/hooks/useBem';
import { postRegistration } from '@/utils/api/post/postRegistration';

import { Title } from '../Title/Title';
import './registration.scss';

interface RegistrationProps {
	className?: string;
	openLogin: () => void;
	successRegistration: (data: {name: string; email_confirmed?: boolean; email?: string}) => void;
	isPage?: boolean;
}

export const Registration: FC<RegistrationProps> = (props) => {
	const {className, openLogin, successRegistration, isPage} = props;

	const [block, element] = useBem('registration', className);
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [repeatPassword, setRepeatPassword] = useState('');
	const [privacyConsent, setPrivacyConsent] = useState(false);
	const [error, setError] = useState<{email?: Array<string>; password?: Array<string>; non_field_errors?: Array<string>}>({});
	const [generalError, setGeneralError] = useState<string>('');

	const signUp = async (e: FormEvent) => {
		setError({});
		setGeneralError('');
		e.preventDefault();
		if (password !== repeatPassword) {
			setError({password: ['Пароли не совпадают']});
			return;
		}
		const res = await postRegistration(email, password);
		if (res.success) {
			successRegistration(res.data ?? res);
		} else {
			// Обрабатываем ошибки из API
			if (res.errors) {
				// Если ошибка в формате {email: [...], password: [...]}
				if (typeof res.errors === 'object' && !Array.isArray(res.errors)) {
					setError(res.errors);
					// Если есть общие ошибки (non_field_errors), показываем их отдельно
					if (res.errors.non_field_errors && Array.isArray(res.errors.non_field_errors)) {
						setGeneralError(res.errors.non_field_errors[0]);
					}
				} else if (typeof res.errors === 'string') {
					// Если ошибка - строка
					setGeneralError(res.errors);
				} else if (Array.isArray(res.errors)) {
					// Если ошибка - массив
					setGeneralError(res.errors[0] || 'Произошла ошибка при регистрации');
				} else {
					setGeneralError('Произошла ошибка при регистрации');
				}
			} else if (res.error) {
				// Если ошибка в формате {error: "..."}
				setGeneralError(res.error);
			} else {
				setGeneralError('Произошла ошибка при регистрации');
			}
		}
	};

	return (
		<form className={block({page: isPage})} onSubmit={signUp}>
			<Svg icon="icon-logo" className={element('logo')} />
			<Title tag="h3" className={element('title')}>
				Вступить в лучшую жизнь
			</Title>
			<div className={element('form')}>
				{generalError && <p className={element('error')}>{generalError}</p>}
				<FieldInput
					placeholder="E-mail"
					type="email"
					id="password"
					text="E-mail"
					value={email}
					setValue={setEmail}
					className={element('field')}
					autoComplete="email"
					error={error?.email}
					required
				/>
				<FieldInput
					placeholder="Пароль для входа"
					id="new-password"
					text="Пароль"
					value={password}
					setValue={setPassword}
					className={element('field')}
					type="password"
					autoComplete="new-password"
					required
					error={error.password}
				/>
				<FieldInput
					placeholder="Повтор ввода пароля"
					id="repeatPassword"
					text="Повторите пароль"
					value={repeatPassword}
					setValue={setRepeatPassword}
					className={element('field')}
					type="password"
					autoComplete="new-password"
					required
				/>
				<div className={element('consent')}>
					<FieldCheckbox
						id="privacy-consent"
						text={
							<div>
								Даю согласие на обработку моих персональных данных в соответствии с{' '}
								<Link to="/privacy" className={element('consent-link')} target="_blank" rel="noopener noreferrer">
									Политикой конфиденциальности
								</Link>
							</div>
						}
						checked={privacyConsent}
						setChecked={setPrivacyConsent}
						className={element('consent-checkbox')}
					/>
				</div>
				<Button icon="rocket" theme="blue" className={element('btn')} typeBtn="submit" disabled={!privacyConsent}>
					Зарегистрироваться
				</Button>
				<p className={element('sign-in')}>
					У вас уже есть аккаунт?
					<Button theme="no-border" className={element('btn-sign-in')} onClick={openLogin}>
						Вход
					</Button>
				</p>
			</div>
		</form>
	);
};

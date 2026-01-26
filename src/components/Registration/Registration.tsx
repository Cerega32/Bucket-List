import {FC, FormEvent, useState} from 'react';
import {Link} from 'react-router-dom';

import {Button} from '@/components/Button/Button';
import {FieldCheckbox} from '@/components/FieldCheckbox/FieldCheckbox';
import {FieldInput} from '@/components/FieldInput/FieldInput';
import {Svg} from '@/components/Svg/Svg';
import {useBem} from '@/hooks/useBem';
import {postRegistration} from '@/utils/api/post/postRegistration';

import {Title} from '../Title/Title';
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
	const [error, setError] = useState<{email?: Array<string>; password?: Array<string>}>({});

	const signUp = async (e: FormEvent) => {
		setError({});
		e.preventDefault();
		if (password !== repeatPassword) {
			setError({password: ['Пароли не совпадают']});
			return;
		}
		const res = await postRegistration(email, password);
		if (res.success) {
			successRegistration(res.data ?? res);
		} else {
			setError(res.errors);
		}
	};

	return (
		<form className={block({page: isPage})} onSubmit={signUp}>
			<Svg icon="icon-logo" className={element('logo')} />
			<Title tag="h3" className={element('title')}>
				Вступить в лучшую жизнь
			</Title>
			<div className={element('form')}>
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

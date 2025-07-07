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
	successLogin: (data: any) => void;
	isPage?: boolean;
}

export const Login: FC<LoginProps> = (props) => {
	const {className, openRegistration, successLogin, isPage} = props;

	const [block, element] = useBem('login', className);
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [error, setError] = useState('');
	const [rememberMe, setRememberMe] = useState(false);

	const signIn = async (e: FormEvent) => {
		setError('');
		e.preventDefault();

		const res = await postLogin(email, password, rememberMe);
		if (res.success) {
			// Прогресс заданий обновляется автоматически на бэкенде

			successLogin(res.data);
		} else {
			setError('Неправильные данные');
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
				/>
				{error && <p className={element('error')}>{error}</p>}
				<div className={element('move')}>
					<FieldCheckbox id="remember" text="Запомнить меня" checked={rememberMe} setChecked={setRememberMe} />
					{/* <Button theme="no-border">Забыли пароль</Button> */}
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

import {FC, useState} from 'react';
import {useBem} from '@/hooks/useBem';
import {FieldInput} from '@/components/FieldInput/FieldInput';
import {Button} from '@/components/Button/Button';
import './login.scss';
import {Svg} from '@/components/Svg/Svg';
import {FieldCheckbox} from '@/components/FieldCheckbox/FieldCheckbox';
import {postLogin} from '@/utils/api/post/postLogin';
import {Title} from '../Title/Title';

interface LoginProps {
	className?: string;
	openRegistration: () => void;
	successLogin: (data) => void;
}

export const Login: FC<LoginProps> = (props) => {
	const {className, openRegistration, successLogin} = props;

	const [block, element] = useBem('login', className);
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');

	const signIn = async () => {
		const res = await postLogin(email, password);
		if (res.success) {
			console.log(res);
			successLogin(res.data);
		}
	};

	return (
		<form className={block()} onSubmit={(e) => signIn(e)}>
			<Svg icon="icon-logo" className={element('logo')} />
			<Title tag="h3" className={element('title')}>
				Вход в лучшую жизнь
			</Title>
			<FieldInput placeholder="E-mail" id="email" text="E-mail" value={email} setValue={setEmail} className={element('field')} />
			<FieldInput
				placeholder="Пароль для входа"
				id="password"
				text="Пароль"
				value={password}
				setValue={setPassword}
				className={element('field')}
				type="password"
			/>
			<div className={element('move')}>
				<FieldCheckbox id="remember" text="Запомнить меня" />
				<Button theme="no-border">Забыли пароль</Button>
			</div>
			<Button type="submit" icon="sign-in" theme="blue" className={element('btn')} onClick={signIn}>
				Войти
			</Button>
			<p className={element('registration')}>
				У вас нет аккаунта?{' '}
				<Button theme="no-border" className={element('btn-registration')} onClick={openRegistration}>
					Регистрация
				</Button>
			</p>
		</form>
	);
};

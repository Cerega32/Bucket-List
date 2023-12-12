import {FC, useState} from 'react';
import {useBem} from '@/hooks/useBem';
import {FieldInput} from '@/components/FieldInput/FieldInput';
import {Button} from '@/components/Button/Button';
import './registration.scss';
import {Svg} from '@/components/Svg/Svg';
import {postRegistration} from '@/utils/api/post/postRegistration';
import {Title} from '../Title/Title';

interface RegistrationProps {
	className?: string;
	openLogin: () => void;
	successRegistration: () => void;
}

export const Registration: FC<RegistrationProps> = (props) => {
	const {className, openLogin, successRegistration} = props;

	const [block, element] = useBem('registration', className);
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [repeatPassword, setRepeatPassword] = useState('');
	const [name, setName] = useState('');

	const signUp = async () => {
		const res = await postRegistration(email, password);
		if (res.success) {
			successRegistration();
		}
		console.log(res);
	};

	return (
		<form className={block()}>
			<Svg icon="icon-logo" className={element('logo')} />
			<Title tag="h3" className={element('title')}>
				Вступить в лучшую жизнь
			</Title>
			<FieldInput
				placeholder="E-mail"
				id="email"
				text="E-mail"
				value={email}
				setValue={setEmail}
				className={element('field')}
			/>
			<FieldInput
				placeholder="Пароль для входа"
				id="password"
				text="Пароль"
				value={password}
				setValue={setPassword}
				className={element('field')}
				type="password"
			/>
			<FieldInput
				placeholder="Повтор ввода пароля"
				id="repeatPassword"
				text="Повторите пароль"
				value={repeatPassword}
				setValue={setRepeatPassword}
				className={element('field')}
				type="password"
			/>
			<FieldInput
				placeholder="Имя пользователя"
				id="name"
				text="Имя"
				value={name}
				setValue={setName}
				className={element('field')}
			/>
			<Button
				icon="rocket"
				theme="blue"
				className={element('btn')}
				onClick={signUp}
				type="submit"
			>
				Зарегистрироваться
			</Button>
			<p className={element('sign-in')}>
				У вас уже есть аккаунт?
				<Button
					theme="no-border"
					className={element('btn-sign-in')}
					onClick={openLogin}
				>
					Вход
				</Button>
			</p>
		</form>
	);
};

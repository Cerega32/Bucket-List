import {FC, FormEvent, useState} from 'react';

import {Title} from '../Title/Title';

import {Button} from '@/components/Button/Button';
import {FieldInput} from '@/components/FieldInput/FieldInput';
import {Svg} from '@/components/Svg/Svg';
import {useBem} from '@/hooks/useBem';
import './registration.scss';
import {postRegistration} from '@/utils/api/post/postRegistration';

interface RegistrationProps {
	className?: string;
	openLogin: () => void;
	successRegistration: (data: {name: string}) => void;
}

export const Registration: FC<RegistrationProps> = (props) => {
	const {className, openLogin, successRegistration} = props;

	const [block, element] = useBem('registration', className);
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [repeatPassword, setRepeatPassword] = useState('');
	const [name, setName] = useState('');

	const signUp = async (e: FormEvent) => {
		e.preventDefault();
		const res = await postRegistration(email, password);
		if (res.success) {
			successRegistration(res);
		}
	};

	return (
		<form className={block()} onSubmit={signUp}>
			<Svg icon="icon-logo" className={element('logo')} />
			<Title tag="h3" className={element('title')}>
				Вступить в лучшую жизнь
			</Title>
			<FieldInput
				placeholder="E-mail"
				id="password"
				text="E-mail"
				value={email}
				setValue={setEmail}
				className={element('field')}
				autoComplete="email"
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
			/>
			<Button icon="rocket" theme="blue" className={element('btn')} typeBtn="submit">
				Зарегистрироваться
			</Button>
			<p className={element('sign-in')}>
				У вас уже есть аккаунт?
				<Button theme="no-border" className={element('btn-sign-in')} onClick={openLogin}>
					Вход
				</Button>
			</p>
		</form>
	);
};

import {FC, FormEvent, useState} from 'react';

import {Button} from '@/components/Button/Button';
import {FieldInput} from '@/components/FieldInput/FieldInput';
import {useBem} from '@/hooks/useBem';
import {putChangePassword} from '@/utils/api/put/putChangePassword';

import {Title} from '../Title/Title';
import './change-password.scss';

interface ChangePasswordProps {
	className?: string;
	closeModal: () => void;
}

export const ChangePassword: FC<ChangePasswordProps> = (props) => {
	const {className, closeModal} = props;

	const [block, element] = useBem('change-password', className);
	const [password, setPassword] = useState('');
	const [newPassword, setNewPassword] = useState('');
	const [repeatPassword, setRepeatPassword] = useState('');

	const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		if (newPassword !== repeatPassword) {
			return;
		}

		const res = await putChangePassword({oldPassword: password, newPassword});
		if (res.success) {
			closeModal();
		}
	};

	return (
		<form className={block()} onSubmit={onSubmit}>
			<Title tag="h2" className={element('title')}>
				Изменить пароль
			</Title>
			<FieldInput
				placeholder="Введите ваш пароль"
				id="password"
				text="Текущий пароль"
				value={password}
				setValue={setPassword}
				className={element('field')}
				type="password"
				iconBegin="lock"
				autoComplete="current-password"
			/>
			<FieldInput
				placeholder="Введите ваш новый пароль"
				id="new-password"
				text="Новый пароль"
				value={newPassword}
				setValue={setNewPassword}
				className={element('field')}
				type="password"
				iconBegin="lock"
				autoComplete="new-password"
			/>
			<FieldInput
				placeholder="Повтор ввода нового пароля"
				id="repeat-new-password"
				text="Повторите новый пароль"
				value={repeatPassword}
				setValue={setRepeatPassword}
				className={element('field')}
				type="password"
				iconBegin="lock"
				autoComplete="new-password"
			/>
			<div className={element('btns-wrapper')}>
				<Button theme="blue-light" className={element('btn')} onClick={closeModal}>
					Отмена
				</Button>
				<Button theme="blue" className={element('btn')} typeBtn="submit">
					Изменить пароль
				</Button>
			</div>
		</form>
	);
};

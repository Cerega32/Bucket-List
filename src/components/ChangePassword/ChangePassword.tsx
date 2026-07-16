import {FC, FormEvent, useState} from 'react';

import {Button} from '@/components/Button/Button';
import {FieldInput} from '@/components/FieldInput/FieldInput';
import {useBem} from '@/hooks/useBem';
import {NotificationStore} from '@/store/NotificationStore';
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
	const [error, setError] = useState<{
		newPassword?: Array<string>;
		repeatPassword?: Array<string>;
	}>({});

	const validatePassword = (pwd: string): Array<string> => {
		const trimmed = pwd;
		const errors: Array<string> = [];

		if (!trimmed) {
			errors.push('Введите пароль');
		} else if (trimmed.length < 8) {
			errors.push('Минимальная длина пароля - 8 символов');
		}

		return errors;
	};

	const validateRepeatPassword = (pwd: string, repeat: string): Array<string> => {
		const errors: Array<string> = [];

		if (!repeat) {
			errors.push('Повторите пароль');
		} else if (pwd !== repeat) {
			errors.push('Пароли не совпадают');
		}

		return errors;
	};

	const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();

		const newPasswordErrors = validatePassword(newPassword);
		const repeatPasswordErrors = validateRepeatPassword(newPassword, repeatPassword);

		if (newPasswordErrors.length || repeatPasswordErrors.length) {
			setError({
				newPassword: newPasswordErrors.length ? newPasswordErrors : undefined,
				repeatPassword: repeatPasswordErrors.length ? repeatPasswordErrors : undefined,
			});
			return;
		}

		const res = await putChangePassword({oldPassword: password, newPassword});
		if (res.success) {
			NotificationStore.addNotification({
				type: 'success',
				title: 'Успешно',
				message: 'Ваш пароль успешно изменён',
			});
			closeModal();
		} else {
			NotificationStore.addNotification({
				type: 'error',
				title: 'Ошибка',
				message: (res as {error?: string}).error || 'Не удалось изменить пароль',
			});
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
				setValue={(val) => {
					setNewPassword(val);
					setError((prev) => ({
						...prev,
						newPassword: validatePassword(val),
						repeatPassword: validateRepeatPassword(val, repeatPassword),
					}));
				}}
				className={element('field')}
				type="password"
				iconBegin="lock"
				autoComplete="new-password"
				error={error.newPassword}
			/>
			<FieldInput
				placeholder="Повтор ввода нового пароля"
				id="repeat-new-password"
				text="Повторите новый пароль"
				value={repeatPassword}
				setValue={(val) => {
					setRepeatPassword(val);
					setError((prev) => ({
						...prev,
						repeatPassword: validateRepeatPassword(newPassword, val),
					}));
				}}
				className={element('field')}
				type="password"
				iconBegin="lock"
				autoComplete="new-password"
				error={error.repeatPassword}
			/>
			<div className={element('btns-wrapper')}>
				<Button theme="blue-light" className={element('btn')} onClick={closeModal} size="medium">
					Отмена
				</Button>
				<Button theme="blue" className={element('btn')} typeBtn="submit" size="medium">
					Изменить пароль
				</Button>
			</div>
		</form>
	);
};

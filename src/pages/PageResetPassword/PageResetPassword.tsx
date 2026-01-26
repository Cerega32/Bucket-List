import {FC, FormEvent, useEffect, useState} from 'react';
import {useNavigate, useSearchParams} from 'react-router-dom';

import {Button} from '@/components/Button/Button';
import {FieldInput} from '@/components/FieldInput/FieldInput';
import {Svg} from '@/components/Svg/Svg';
import {Title} from '@/components/Title/Title';
import {useBem} from '@/hooks/useBem';
import {ThemeStore} from '@/store/ThemeStore';
import {IPage} from '@/typings/page';
import {postResetPasswordConfirm} from '@/utils/api/post/postResetPasswordConfirm';

import './PageResetPassword.scss';

export const PageResetPassword: FC<IPage> = ({page}) => {
	const {setHeader, setPage, setFull} = ThemeStore;
	const [searchParams] = useSearchParams();
	const navigate = useNavigate();

	const uid = searchParams.get('uid') ?? '';
	const token = searchParams.get('token') ?? '';
	const hasValidLink = Boolean(uid && token);

	const [block, element] = useBem('page-reset-password');
	const [newPassword, setNewPassword] = useState('');
	const [repeatPassword, setRepeatPassword] = useState('');
	const [error, setError] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	const [isSuccess, setIsSuccess] = useState(false);

	useEffect(() => {
		setHeader('white');
		setPage(page);
		setFull(true);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault();
		setError('');

		if (newPassword !== repeatPassword) {
			setError('Пароли не совпадают');
			return;
		}

		if (newPassword.length < 8) {
			setError('Пароль должен быть не менее 8 символов');
			return;
		}

		setIsLoading(true);
		const res = await postResetPasswordConfirm({uid, token, new_password: newPassword});
		setIsLoading(false);

		if (res.success) {
			setIsSuccess(true);
			navigate('/sign-in', {replace: true});
		}
	};

	if (!hasValidLink) {
		return (
			<div className={block()}>
				<Svg icon="icon-logo" className={element('logo')} />
				<Title tag="h3" className={element('title')}>
					Ссылка недействительна
				</Title>
				<p className={element('message')}>
					Ссылка для сброса пароля недействительна или устарела. Запросите новое письмо на странице входа.
				</p>
				<div className={element('actions')}>
					<Button theme="blue" className={element('btn')} type="Link" href="/sign-in">
						Перейти к входу
					</Button>
				</div>
			</div>
		);
	}

	if (isSuccess) {
		return (
			<div className={block()}>
				<Title tag="h3" className={element('title')}>
					Пароль изменён
				</Title>
				<p className={element('message')}>Перенаправление на страницу входа…</p>
			</div>
		);
	}

	return (
		<form className={block()} onSubmit={handleSubmit}>
			<Svg icon="icon-logo" className={element('logo')} />
			<Title tag="h3" className={element('title')}>
				Установить новый пароль
			</Title>
			<p className={element('description')}>Введите новый пароль и повторите его для подтверждения.</p>
			<div className={element('form')}>
				<FieldInput
					placeholder="Новый пароль"
					id="new-password"
					text="Новый пароль"
					value={newPassword}
					setValue={setNewPassword}
					className={element('field')}
					type="password"
					iconBegin="lock"
					autoComplete="new-password"
					required
					disabled={isLoading}
				/>
				<FieldInput
					placeholder="Повторите новый пароль"
					id="repeat-password"
					text="Повторите пароль"
					value={repeatPassword}
					setValue={setRepeatPassword}
					className={element('field')}
					type="password"
					iconBegin="lock"
					autoComplete="new-password"
					required
					disabled={isLoading}
				/>
				{error && <p className={element('error')}>{error}</p>}
				<Button typeBtn="submit" theme="blue" className={element('btn')} disabled={isLoading}>
					{isLoading ? 'Сохранение…' : 'Установить пароль'}
				</Button>
				<Button theme="no-border" className={element('btn-back')} type="Link" href="/sign-in">
					Вернуться к входу
				</Button>
			</div>
		</form>
	);
};

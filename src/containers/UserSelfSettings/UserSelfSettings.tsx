import Cookies from 'js-cookie';
import {observer} from 'mobx-react-lite';
import React, {FC, useEffect, useMemo, useRef, useState} from 'react';
import {FileDrop} from 'react-file-drop';

import {Avatar} from '@/components/Avatar/Avatar';
import {Button} from '@/components/Button/Button';
import {FieldInput} from '@/components/FieldInput/FieldInput';
import {Line} from '@/components/Line/Line';
import Select from '@/components/Select/Select';
import {Title} from '@/components/Title/Title';
import {useBem} from '@/hooks/useBem';
import {ModalStore} from '@/store/ModalStore';
import {NotificationStore} from '@/store/NotificationStore';
import {UserStore} from '@/store/UserStore';
import {IUserInfo} from '@/typings/user';
import {deleteAvatar} from '@/utils/api/delete/deleteAvatar';
import {checkEmail} from '@/utils/api/get/checkEmail';
import {checkUsername} from '@/utils/api/get/checkUsername';
import {postAvatar} from '@/utils/api/post/postAvatar';
import {postCover} from '@/utils/api/post/postCover';
import {postResendConfirmationEmail} from '@/utils/api/post/postResendConfirmationEmail';
import {putUserInfo} from '@/utils/api/put/putUserInfo';
import {countriesArr} from '@/utils/data/countries';
import {normalizeEmail} from '@/utils/text/normalizeEmail';
import './user-self-settings.scss';

const USERNAME_MAX_LENGTH = 30;
const FIRST_NAME_MAX_LENGTH = 50;
const LAST_NAME_MAX_LENGTH = 50;
const ABOUT_MAX_LENGTH = 200;

export const UserSelfSettings: FC = observer(() => {
	const {userSelf: user, setUserSelf, setAvatar, setName, email: storeEmail} = UserStore;
	const {setWindow, setIsOpen} = ModalStore;

	// Делаем "Россия" первой опцией и отправляем на сервер полное название страны.
	const countryOptions = useMemo(() => {
		const ruIndex = countriesArr.findIndex((c) => c.value === 'RU');
		if (ruIndex < 0) return countriesArr;

		const ru = countriesArr[ruIndex];
		return [ru, ...countriesArr.filter((_, i) => i !== ruIndex)];
	}, []);

	const [firstName, setFirstName] = useState(user.firstName);
	const [surname, setSurname] = useState(user.lastName);
	const [username, setUsername] = useState(user.username ?? '');
	const [about, setAbout] = useState(user.aboutMe);
	const [usernameErrors, setUsernameErrors] = useState<Array<string>>([]);
	const [, setIsCheckingUsername] = useState(false);
	const [activeCountry, setActiveCountry] = useState<number | null>(null);
	const [email, setEmail] = useState(user.email || storeEmail || '');
	const [emailErrors, setEmailErrors] = useState<Array<string>>([]);
	const [, setIsCheckingEmail] = useState(false);
	const avatarInputRef = useRef<HTMLInputElement | null>(null);
	const coverInputRef = useRef<HTMLInputElement | null>(null);
	const usernameValidationRequestId = useRef(0);
	const emailValidationRequestId = useRef(0);
	const emailSentTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	const [block, element] = useBem('user-self-settings');

	const validateUsername = (name: string): Array<string> => {
		const trimmed = name.trim();
		const errors: Array<string> = [];

		if (!trimmed) {
			errors.push('Введите имя пользователя');
		}

		if (trimmed.length > 0 && trimmed.length < 3) {
			errors.push('Минимальная длина имени пользователя - 3 символа');
		}

		if (trimmed.length > 0 && !/^[A-Za-z0-9_]+$/.test(trimmed)) {
			errors.push('Используйте только латинские буквы, цифры и знак подчёркивания');
		}

		return errors;
	};

	const checkUsernameAsync = async (name: string): Promise<Array<string>> => {
		const localErrors = validateUsername(name);
		if (localErrors.length > 0) {
			setUsernameErrors(localErrors);
			return localErrors;
		}

		const trimmed = name.trim();
		if (!trimmed) return [];

		// Если имя не изменилось относительно текущего пользователя — не проверяем уникальность
		if ((user.username ?? '').trim().toLowerCase() === trimmed.toLowerCase()) {
			setUsernameErrors([]);
			return [];
		}

		setIsCheckingUsername(true);
		const requestId = ++usernameValidationRequestId.current;
		const res = await checkUsername(trimmed);
		// Игнорируем устаревшие ответы (race condition)
		if (requestId !== usernameValidationRequestId.current) return [];
		setIsCheckingUsername(false);

		if (!res.success) {
			const serverErrors =
				(Array.isArray(res.errors) && res.errors) ||
				(Array.isArray(res.data?.errors) && res.data.errors) ||
				(typeof res.errors === 'string' ? [res.errors] : undefined);

			if (serverErrors && serverErrors.length) {
				setUsernameErrors(serverErrors);
				return serverErrors;
			}
		}

		setUsernameErrors([]);
		return [];
	};

	useEffect(() => {
		setFirstName(user.firstName);
		setSurname(user.lastName);
		setUsername(user.username ?? '');
		setAbout(user.aboutMe);
		setEmail(user.email || storeEmail || '');
		setEmailErrors([]);
		if (user.country) {
			const idx = countryOptions.findIndex((country) => country.name === user.country || country.value === user.country);
			setActiveCountry(idx >= 0 ? idx : null);
		}
	}, [user, storeEmail]);

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
		const {id, value} = e.target;
		switch (id) {
			case 'name':
				setFirstName(value);
				break;
			case 'surname':
				setSurname(value);
				break;
			case 'username':
				setUsername(value);
				setUsernameErrors(validateUsername(value));
				break;
			case 'about':
				setAbout(value);
				break;
			case 'email':
				setEmail(value);
				setEmailErrors([]);
				break;
			default:
				break;
		}
	};

	const checkEmailAsync = async (mail: string): Promise<Array<string>> => {
		const trimmed = normalizeEmail(mail);
		if (!trimmed) {
			setEmailErrors([]);
			return [];
		}

		const currentEmail = normalizeEmail(user.email || storeEmail || '');
		if (trimmed === currentEmail) {
			setEmailErrors([]);
			return [];
		}

		setIsCheckingEmail(true);
		const requestId = ++emailValidationRequestId.current;
		const res = await checkEmail(trimmed);
		// Игнорируем устаревшие ответы (race condition)
		if (requestId !== emailValidationRequestId.current) return [];
		setIsCheckingEmail(false);

		if (!res.success) {
			const serverErrors =
				(Array.isArray(res.errors) && res.errors) ||
				(Array.isArray(res.data?.errors) && res.data.errors) ||
				(typeof res.errors === 'string' ? [res.errors] : undefined);

			if (serverErrors && serverErrors.length) {
				setEmailErrors(serverErrors);
				return serverErrors;
			}
		}

		setEmailErrors([]);
		return [];
	};

	const handleAvatarDrop = (files: FileList) => {
		if (files && files.length > 0) {
			const formData = new FormData();
			formData.append('avatar', files[0], files[0].name);
			(async () => {
				const res = await postAvatar(formData);
				if (res.success) {
					setUserSelf({...user, avatar: Cookies.get('avatar') || ''});
					setAvatar(Cookies.get('avatar') || '');
				}
			})();
		}
	};

	const handleCoverDrop = (files: FileList) => {
		if (files && files.length > 0) {
			const formData = new FormData();
			formData.append('cover', files[0], files[0].name);
			(async () => {
				const res = await postCover(formData);
				if (res.success) {
					setUserSelf({...user, coverImage: Cookies.get('cover') || null});
				}
			})();
		}
	};

	const handleAvatarClick = () => {
		if (avatarInputRef.current) {
			avatarInputRef.current.click();
		}
	};

	const handleCoverClick = () => {
		if (coverInputRef.current) {
			coverInputRef.current.click();
		}
	};

	const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		if (event.target.files) {
			handleAvatarDrop(event.target.files);
		}
	};

	const handleCoverChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		if (event.target.files) {
			handleCoverDrop(event.target.files);
		}
	};

	const handleDeleteAvatar = async () => {
		const res = await deleteAvatar();
		if (res.success) {
			const nextAvatar = Cookies.get('avatar') || '';
			setUserSelf({...user, avatar: nextAvatar});
			setAvatar(nextAvatar);
		}
	};

	const handleSaveChanges = async () => {
		// Снимаем фокус с активного поля, чтобы отработал onBlur-валидатор перед сохранением.
		if (document.activeElement instanceof HTMLElement) {
			document.activeElement.blur();
		}

		// Валидация имени пользователя перед сохранением
		const currentUsernameErrors = validateUsername(username);
		if (currentUsernameErrors.length > 0) {
			setUsernameErrors(currentUsernameErrors);
			NotificationStore.addNotification({
				type: 'error',
				title: 'Некорректное имя пользователя',
				message: currentUsernameErrors[0],
			});
			return;
		}
		const trimmedUsername = username.trim();
		const currentUsername = (user.username ?? '').trim();
		if (trimmedUsername && trimmedUsername.toLowerCase() !== currentUsername.toLowerCase()) {
			const asyncUsernameErrors = await checkUsernameAsync(username);
			if (asyncUsernameErrors.length > 0) {
				NotificationStore.addNotification({
					type: 'error',
					title: 'Ошибка',
					message: 'Исправьте ошибки в имени пользователя перед сохранением',
				});
				return;
			}
		}
		const normalizedEmail = normalizeEmail(email);
		const currentEmail = normalizeEmail(user.email || storeEmail || '');
		if (normalizedEmail && normalizedEmail !== currentEmail) {
			const currentEmailErrors = await checkEmailAsync(email);
			if (currentEmailErrors.length > 0) {
				NotificationStore.addNotification({
					type: 'error',
					title: 'Ошибка',
					message: 'Исправьте ошибки в email перед сохранением',
				});
				return;
			}
		}
		// Создаем объект для хранения измененных данных
		const updatedData: Partial<IUserInfo> = {};

		// Проверяем каждое поле на изменение и добавляем его в объект updatedData при необходимости
		if (firstName !== user.firstName) {
			updatedData.firstName = firstName;
		}
		if (surname !== user.lastName) {
			updatedData.lastName = surname;
		}
		if (username !== (user.username ?? '')) {
			updatedData.username = username.trim() || undefined;
		}
		if (activeCountry !== null) {
			const selectedCountryName = countryOptions[activeCountry].name;
			if (selectedCountryName !== user.country) {
				updatedData.country = selectedCountryName;
			}
		}
		if (about !== user.aboutMe) {
			updatedData.aboutMe = about;
		}
		if (normalizedEmail && normalizedEmail !== currentEmail) {
			updatedData.email = normalizedEmail;
		}

		// Проверяем, были ли какие-либо изменения
		if (Object.keys(updatedData).length > 0) {
			const res = await putUserInfo(updatedData);

			if (res.success && res.data) {
				// Объединяем с текущим userSelf, чтобы не потерять counts и другие данные,
				// которые API update-profile не возвращает
				setUserSelf({
					...user,
					...res.data,
					counts: res.data.counts ?? user.counts,
				});
				const displayName = res.data.name ?? res.data.username;
				if (displayName) {
					setName(displayName);
					Cookies.set('name', displayName);
				}
				NotificationStore.addNotification({
					type: 'success',
					title: 'Успешно',
					message: 'Ваши настройки профиля успешно изменены',
				});
			} else {
				NotificationStore.addNotification({
					type: 'error',
					title: 'Ошибка',
					message: (res as {error?: string}).error || 'Не удалось сохранить настройки',
				});
			}
		} else {
			NotificationStore.addNotification({
				type: 'warning',
				title: 'Нет изменений',
				message: 'Ни один параметр не был изменён',
			});
		}
	};

	const openChangePassword = () => {
		setWindow('change-password');
		setIsOpen(true);
	};

	const [isResendingEmail, setIsResendingEmail] = useState(false);
	const [emailSent, setEmailSent] = useState(false);
	const [resendCooldown, setResendCooldown] = useState(0);

	useEffect(() => {
		return () => {
			if (emailSentTimerRef.current) {
				clearTimeout(emailSentTimerRef.current);
			}
		};
	}, []);

	// Обратный отсчёт задержки повторной отправки (2 мин)
	useEffect(() => {
		if (resendCooldown <= 0) return;
		const t = setInterval(() => setResendCooldown((c) => Math.max(0, c - 1)), 1000);
		return () => clearInterval(t);
	}, [resendCooldown]);

	const handleResendConfirmationEmail = async () => {
		setIsResendingEmail(true);
		const res = await postResendConfirmationEmail();
		setIsResendingEmail(false);
		if (res.success && res.data) {
			if (res.data.is_email_confirmed === true) {
				setUserSelf({...user, isEmailConfirmed: true});
				return;
			}
			setEmailSent(true);
			if (emailSentTimerRef.current) {
				clearTimeout(emailSentTimerRef.current);
			}
			emailSentTimerRef.current = setTimeout(() => setEmailSent(false), 3000);
			setResendCooldown(res.data.retry_after_seconds ?? 120);
		}
	};

	const currentNormalizedEmail = normalizeEmail(user.email || storeEmail || '');
	const editedNormalizedEmail = normalizeEmail(email);
	const isEditedEmailChanged = !!editedNormalizedEmail && editedNormalizedEmail !== currentNormalizedEmail;
	const isEmailConfirmed = user.isEmailConfirmed && !isEditedEmailChanged;

	return (
		<section className={block()}>
			<Title tag="h2" className={element('title')}>
				Настройки
			</Title>
			<section className={element('edit-fields')}>
				<div style={{backgroundImage: `url('${user.coverImage}')`}} className={element('bg')}>
					<div
						className={element('btn-cover')}
						onClick={handleCoverClick}
						role="button"
						tabIndex={0}
						aria-label="Изменить обложку"
						onKeyPress={(e) => {
							if (e.key === 'Enter' || e.key === ' ') {
								handleCoverClick();
							}
						}}
					>
						<FileDrop onDrop={(files) => files && handleCoverDrop(files)}>
							<input
								type="file"
								style={{display: 'none'}}
								ref={coverInputRef}
								onChange={handleCoverChange}
								accept="image/*"
							/>
							<Button theme="blue-light" icon="image-edit" size="small">
								Изменить обложку
							</Button>
						</FileDrop>
					</div>
				</div>
				<section className={element('avatar-wrapper')}>
					<Avatar
						avatar={user.avatar}
						className={element('avatar')}
						size="large"
						isPremium={user.subscriptionType === 'premium'}
					/>
					<div className={element('avatar-buttons')}>
						<div
							onClick={handleAvatarClick}
							role="button"
							tabIndex={0}
							aria-label="Изменить фотографию"
							onKeyPress={(e) => {
								if (e.key === 'Enter' || e.key === ' ') {
									handleAvatarClick();
								}
							}}
						>
							<FileDrop onDrop={(files) => files && handleAvatarDrop(files)}>
								<input
									type="file"
									style={{display: 'none'}}
									ref={avatarInputRef}
									onChange={handleAvatarChange}
									accept="image/*"
								/>
								<Button icon="image-edit" theme="blue" size="small">
									Изменить фото
								</Button>
							</FileDrop>
						</div>
						<Button
							className={element('delete-avatar')}
							icon="trash"
							theme="blue-light"
							onClick={handleDeleteAvatar}
							size="small"
						>
							Удалить фото
						</Button>
					</div>
				</section>
				<Line margin="24px 0" />
				<section className={element('info')}>
					<Title tag="h3" className={element('title')}>
						Информация пользователя
					</Title>
					<div className={element('input-group')}>
						<FieldInput
							text="Имя пользователя"
							placeholder="Имя, которое увидят другие пользователи"
							id="username"
							value={username}
							setValueTarget={handleInputChange}
							error={usernameErrors}
							onBlur={() => checkUsernameAsync(username)}
							maxLength={USERNAME_MAX_LENGTH}
							minLength={3}
							hint={
								!usernameErrors || usernameErrors.length === 0
									? 'Используйте только латинские буквы, цифры и знак подчёркивания'
									: undefined
							}
						/>
						<FieldInput
							text="Имя"
							placeholder="Имя"
							id="name"
							value={firstName}
							setValueTarget={handleInputChange}
							maxLength={FIRST_NAME_MAX_LENGTH}
						/>
						<FieldInput
							text="Фамилия"
							placeholder="Фамилия"
							id="surname"
							value={surname}
							setValueTarget={handleInputChange}
							maxLength={LAST_NAME_MAX_LENGTH}
						/>
						<div>
							<Select
								text="Страна"
								activeOption={activeCountry}
								onSelect={setActiveCountry}
								className={element('country')}
								searchInControl
								options={countryOptions}
							/>
						</div>
						<FieldInput
							text="Обо мне"
							type="textarea"
							placeholder="Напишите пару слов о себе..."
							id="about"
							value={about}
							setValueTarget={handleInputChange}
							className={element('about')}
							maxLength={ABOUT_MAX_LENGTH}
							showCharCount
						/>
					</div>
					<Line margin="24px 0" />
					<Title tag="h3" className={element('title')}>
						Безопасность и вход
					</Title>
					<div className={element('safety-wrapper')}>
						<div className={element('email-field')}>
							<FieldInput
								text="Email"
								placeholder="Email"
								id="email"
								type="email"
								value={email}
								setValueTarget={handleInputChange}
								onBlur={() => checkEmailAsync(email)}
								error={emailErrors}
								className={element('email-input')}
							/>
							<div className={element('email-status')}>
								{isEmailConfirmed ? (
									<span className={element('email-confirmed')}>✓ Email подтвержден</span>
								) : (
									<div className={element('email-not-confirmed')}>
										<div className={element('email-not-confirmed-row')}>
											<span className={element('email-warning')}>
												{isEditedEmailChanged
													? '⚠ Новый email нужно подтвердить повторно после сохранения настроек'
													: '⚠ Email не подтвержден - отправьте письмо для подтверждения'}
											</span>
											<Button
												theme="blue-light"
												size="small"
												onClick={handleResendConfirmationEmail}
												disabled={isEditedEmailChanged || isResendingEmail || resendCooldown > 0}
												className={element('resend-btn')}
											>
												{isResendingEmail
													? 'Отправка...'
													: emailSent
													? 'Отправлено!'
													: resendCooldown > 0
													? `Повтор через ${resendCooldown} с`
													: 'Отправить письмо'}
											</Button>
										</div>
									</div>
								)}
							</div>
						</div>
						<Button className={element('btn-change')} theme="no-border" icon="lock" onClick={openChangePassword}>
							Изменить пароль
						</Button>
					</div>
					<Line margin="24px 0" />
					<Button className={element('btn-save')} theme="blue" onClick={handleSaveChanges}>
						Сохранить изменения
					</Button>
				</section>
			</section>
		</section>
	);
});

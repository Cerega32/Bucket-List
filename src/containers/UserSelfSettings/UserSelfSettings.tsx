import Cookies from 'js-cookie';
import {observer} from 'mobx-react-lite';
import React, {FC, useEffect, useRef, useState} from 'react';
import {FileDrop} from 'react-file-drop';

import {Avatar} from '@/components/Avatar/Avatar';
import {Button} from '@/components/Button/Button';
import {FieldInput} from '@/components/FieldInput/FieldInput';
import {Line} from '@/components/Line/Line';
import Select from '@/components/Select/Select';
import {Title} from '@/components/Title/Title';
import {useBem} from '@/hooks/useBem';
import {ModalStore} from '@/store/ModalStore';
import {UserStore} from '@/store/UserStore';
import {IUserInfo} from '@/typings/user';
import {deleteAvatar} from '@/utils/api/delete/deleteAvatar';
import {postAvatar} from '@/utils/api/post/postAvatar';
import {postCover} from '@/utils/api/post/postCover';
import {putUserInfo} from '@/utils/api/put/putUserInfo';
import {countriesArr} from '@/utils/data/countries';
import './user-self-settings.scss';

export const UserSelfSettings: FC = observer(() => {
	const {userInfo: user, setUserInfo, setAvatar} = UserStore;
	const {setWindow, setIsOpen} = ModalStore;

	const [name, setName] = useState(user.name);
	const [surname, setSurname] = useState(user.lastName);
	const [about, setAbout] = useState(user.aboutMe);
	const [activeCountry, setActiveCountry] = useState<number | null>(null);
	const avatarInputRef = useRef<HTMLInputElement | null>(null);
	const coverInputRef = useRef<HTMLInputElement | null>(null);

	const [block, element] = useBem('user-self-settings');

	useEffect(() => {
		setName(user.firstName);
		setSurname(user.lastName);
		setAbout(user.aboutMe);
		if (user.country) {
			setActiveCountry(countriesArr.findIndex((country) => country.value === user.country));
		}
	}, [user]);

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
		const {id, value} = e.target;
		switch (id) {
			case 'name':
				setName(value);
				break;
			case 'surname':
				setSurname(value);
				break;
			case 'about':
				setAbout(value);
				break;
			default:
				break;
		}
	};

	const handleAvatarDrop = (files: FileList) => {
		if (files && files.length > 0) {
			const formData = new FormData();
			formData.append('avatar', files[0], files[0].name);
			(async () => {
				const res = await postAvatar(formData);
				if (res.success) {
					setUserInfo({...user, avatar: Cookies.get('avatar')});
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
					setUserInfo({...user, coverImage: Cookies.get('cover')});
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
			setUserInfo({...user, avatar: Cookies.get('avatar')});
		}
	};

	const handleSaveChanges = async () => {
		// Создаем объект для хранения измененных данных
		const updatedData: Partial<IUserInfo> = {};

		// Проверяем каждое поле на изменение и добавляем его в объект updatedData при необходимости
		if (name !== user.firstName) {
			updatedData.firstName = name;
		}
		if (surname !== user.lastName) {
			updatedData.lastName = surname;
		}
		if (activeCountry !== null && countriesArr[activeCountry].value !== user.country) {
			updatedData.country = countriesArr[activeCountry].value;
		}
		if (about !== user.aboutMe) {
			updatedData.aboutMe = about;
		}

		// Проверяем, были ли какие-либо изменения
		if (Object.keys(updatedData).length > 0) {
			// Если есть изменения, вызываем функцию для обновления информации пользователя
			const res = await putUserInfo(updatedData);

			if (res.success) {
				setUserInfo(res.data);
			}
		}
	};

	const openChangePassword = () => {
		setWindow('change-password');
		setIsOpen(true);
	};

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
						<FileDrop onDrop={(files) => handleCoverDrop(files)}>
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
					<Avatar avatar={user.avatar} className={element('avatar')} size="large" />
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
						<FileDrop onDrop={(files) => handleAvatarDrop(files)}>
							<input
								type="file"
								style={{display: 'none'}}
								ref={avatarInputRef}
								onChange={handleAvatarChange}
								accept="image/*"
							/>
							<Button icon="image-edit" theme="blue" size="small">
								Изменить фотографию
							</Button>
						</FileDrop>
					</div>
					<Button className={element('delete-avatar')} icon="trash" theme="blue-light" onClick={handleDeleteAvatar} size="small">
						Удалить фото
					</Button>
				</section>
				<Line margin="24px 0" />
				<section className={element('info')}>
					<Title tag="h3" className={element('title')}>
						Информация пользователя
					</Title>
					<div className={element('input-group')}>
						<FieldInput text="Имя" placeholder="Имя" id="name" value={name} setValueTarget={handleInputChange} />
						<FieldInput text="Фамилия" placeholder="Фамилия" id="surname" value={surname} setValueTarget={handleInputChange} />
						<div>
							<Select
								text="Страна"
								options={countriesArr}
								activeOption={activeCountry}
								onSelect={setActiveCountry}
								className={element('country')}
							/>
						</div>
						<FieldInput
							text="Обо мне"
							type="textarea"
							placeholder="Обо мне"
							id="about"
							value={about}
							setValueTarget={handleInputChange}
						/>
					</div>
					<Button className={element('btn-save')} theme="blue" onClick={handleSaveChanges}>
						Сохранить изменения
					</Button>
					<Line margin="24px 0" />
					<Title tag="h3" className={element('title')}>
						Безопасность и вход
					</Title>
					<Button theme="no-border" icon="lock" onClick={openChangePassword}>
						Изменить пароль
					</Button>
				</section>
			</section>
		</section>
	);
});

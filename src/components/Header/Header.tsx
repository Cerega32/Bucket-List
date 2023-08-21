import {FC} from 'react';
import {observer} from 'mobx-react';
import {ReactSVG} from 'react-svg';
import {useBem} from '@/hooks/useBem';
import {ThemeStore} from '../../store/ThemeStore';
import {Button} from '@/components/Button/Button';
import './header.scss';
import {UserStore} from '@/store/UserStore';
import {ModalStore} from '@/store/ModalStore';

interface HeaderProps {
	className?: string;
}

export const Header: FC<HeaderProps> = observer((props) => {
	const {className} = props;

	const {header} = ThemeStore;
	const {setIsOpen, setWindow} = ModalStore;
	const {isAuth, name} = UserStore;

	const [block, element] = useBem('header', className);

	const openLogin = () => {
		setIsOpen(true);
		setWindow('login');
	};

	const openRegistration = () => {
		setIsOpen(true);
		setWindow('registration');
	};

	console.log(header);

	return (
		<header className={block({theme: header})}>
			<div className={element('wrapper')}>
				<a className={element('logo')} href="/">
					<ReactSVG src="src/assets/svg/delting.svg" />
				</a>
				<nav className={element('nav')}>
					<ul className={element('list')}>
						<li className={element('item')}>
							<a className={element('item-link')} href="/">
								Моя доска
							</a>
						</li>
						<li className={element('item')}>
							<a className={element('item-link')} href="/">
								100 целей
							</a>
						</li>
						<li className={element('item')}>
							<a className={element('item-link')} href="/">
								Категории
							</a>
						</li>
						<li className={element('item')}>
							<span
								className={element('item-link', {active: true})}
							>
								Цели
							</span>
						</li>
						<li className={element('item')}>
							<a className={element('item-link')} href="/">
								Списки
							</a>
						</li>
						<li className={element('item')}>
							<a className={element('item-link')} href="/">
								Лента
							</a>
						</li>
					</ul>
				</nav>
				{isAuth ? (
					<a className={element('profile')} href="/">
						<img
							className={element('avatar')}
							src="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/4gHYSUNDX1BST0ZJTEUAAQEAAAHIAAAAAAQwAABtbnRyUkdCIFhZWiAH4AABAAEAAAAAAABhY3NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAA9tYAAQAAAADTLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlkZXNjAAAA8AAAACRyWFlaAAABFAAAABRnWFlaAAABKAAAABRiWFlaAAABPAAAABR3dHB0AAABUAAAABRyVFJDAAABZAAAAChnVFJDAAABZAAAAChiVFJDAAABZAAAAChjcHJ0AAABjAAAADxtbHVjAAAAAAAAAAEAAAAMZW5VUwAAAAgAAAAcAHMAUgBHAEJYWVogAAAAAAAAb6IAADj1AAADkFhZWiAAAAAAAABimQAAt4UAABjaWFlaIAAAAAAAACSgAAAPhAAAts9YWVogAAAAAAAA9tYAAQAAAADTLXBhcmEAAAAAAAQAAAACZmYAAPKnAAANWQAAE9AAAApbAAAAAAAAAABtbHVjAAAAAAAAAAEAAAAMZW5VUwAAACAAAAAcAEcAbwBvAGcAbABlACAASQBuAGMALgAgADIAMAAxADb/2wBDAAICAgICAQICAgIDAgIDAwYEAwMDAwcFBQQGCAcJCAgHCAgJCg0LCQoMCggICw8LDA0ODg8OCQsQERAOEQ0ODg7/2wBDAQIDAwMDAwcEBAcOCQgJDg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg7/wAARCAAYABgDASIAAhEBAxEB/8QAGQABAAIDAAAAAAAAAAAAAAAAAAYIBQkK/8QALhAAAAQFAgQFBAMAAAAAAAAAAQIFEQMEBgcSABMIFSEiFBcxM0EZQlJhQ2KS/8QAGAEAAgMAAAAAAAAAAAAAAAAABggEBQf/xAAnEQABAwMDBAEFAAAAAAAAAAABAgQRAwUhABIxBiJBURMUI0Jhkf/aAAwDAQACEQMRAD8An3CRT1i7h1tPW8unSMObqKcAYqCrArzcuMUQL3QBJDilJkABkUcerGAfQHx5uEusB4/D2hIWYBD3PG882+0E3L3X9M/sb8/htVdp6ItQq7RolNmmC1CE7C5aMr7u/mG3h/bJm10KxfMCJwwxAhijQb1npb46wgmsP9Ybj/rLTzdaXi69JXX6hpX3IdpKdi1EiksQBVSDMJz3AYnnxC+2FkzvLP4q1ODRM7kgArSfwJEScYPMa1L8WKBYu31ZyNu7V0pDgVDIAB19YMrTcwaGbHtgAQ8U0PIXyOIF6OAA3VmqnLZVYlZq5F/f56E7F5j4oRGLv5juZv1yyd/3pra7KwXbbZSb1KyqygMrUoqKickyScehwBoCfuEuna6qaYpgnCQAAB6x59n3q73B0iWopabUbxXMrmnE6eSyRCoSHNq8uWbAxQ75jYE+YmZywys4uIg/bqEBxaVb9QHzeE0xyHc8EKIEQMeWv7Temf8AI/5/LaaaBmdlY3e83By+Bqk/ZAVEJp5kJEYnknmeCNENd+4ZMW1JudgHfjkqxk+48DjU54x0O1FTz6feC2ld02pTymSGRdRJNXlzTZjGDsmNgDZgZmLEAQcGARZjaaaauejkLoWUNisrFJRQkqgnaIgEgCYmB+o1Avik1HxqhISVgKMcSef7r//Z"
							alt="Аватар"
						/>
						<span className={element('nickname')}>{name}</span>
					</a>
				) : (
					<div className={element('profile')}>
						<Button
							className={element('sign-in')}
							theme="blue-light"
							size="small"
							onClick={openLogin}
						>
							Войти
						</Button>
						<Button
							className={element('registration')}
							theme="blue"
							size="small"
							icon="rocket"
							onClick={openRegistration}
						>
							Регистрация
						</Button>
					</div>
				)}
			</div>
		</header>
	);
});

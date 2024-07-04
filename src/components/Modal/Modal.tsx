import Cookies from 'js-cookie';
import {observer} from 'mobx-react';
import {FC, useEffect} from 'react';

import {AddReview} from '../AddReview/AddReview';
import {ChangePassword} from '../ChangePassword/ChangePassword';
import {ConfirmExecutionAllGoal} from '../ConfirmExecutionAllGoal/ConfirmExecutionAllGoal';
import {DeleteGoal} from '../DeleteGoal/DeleteGoal';
import {Svg} from '../Svg/Svg';

import {Button} from '@/components/Button/Button';
import {Login} from '@/components/Login/Login';
import {Registration} from '@/components/Registration/Registration';
import {useBem} from '@/hooks/useBem';
import {ModalStore} from '@/store/ModalStore';
import {UserStore} from '@/store/UserStore';
import './modal.scss';

interface ModalProps {
	className?: string;
}

export const Modal: FC<ModalProps> = observer((props) => {
	const {className} = props;

	const [block, element] = useBem('modal', className);

	const {isOpen, setIsOpen, window, setWindow, funcModal} = ModalStore;
	const {setIsAuth, setName} = UserStore;

	const closeWindow = () => {
		setIsOpen(false);
	};

	const openRegistration = () => {
		setWindow('registration');
	};

	const openLogin = () => {
		setWindow('login');
	};

	const successAuth = (data: {name: string}) => {
		Cookies.set('name', data.name);
		closeWindow();
		setName(data.name);
		setIsAuth(true);
	};

	const handleKeyUp = (e) => {
		if (e.key === 'Escape') {
			closeWindow();
		}
	};

	useEffect(() => {
		if (isOpen) {
			document.addEventListener('keyup', handleKeyUp);
		} else {
			document.removeEventListener('keyup', handleKeyUp);
		}
		return () => {
			document.removeEventListener('keyup', handleKeyUp);
		}; // eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isOpen, setIsOpen]);
	if (!isOpen) return null;

	return (
		<section className={block({isOpen})}>
			<div className={element('window', {type: window})}>
				{window === 'login' && <Login openRegistration={openRegistration} successLogin={successAuth} />}
				{window === 'registration' && <Registration openLogin={openLogin} successRegistration={successAuth} />}
				{window === 'change-password' && <ChangePassword closeModal={closeWindow} />}
				{window === 'add-review' && <AddReview closeModal={closeWindow} />}
				{window === 'delete-goal' && <DeleteGoal closeModal={closeWindow} funcModal={funcModal} />}
				{window === 'confirm-execution-all-goal' && <ConfirmExecutionAllGoal closeModal={closeWindow} funcModal={funcModal} />}
				<Button theme="blue-light" className={element('close')} onClick={closeWindow}>
					<Svg icon="cross" />
				</Button>
			</div>
			<button aria-label="Закрыть окно" type="button" className={element('base')} onClick={closeWindow} />
		</section>
	);
});

import {FC, useCallback, useEffect, useRef, useState} from 'react';

import {useBem} from '@/shared/lib/hooks/useBem';
import {NotificationStore} from '@/shared/model/NotificationStore';
import {Button} from '@/shared/ui/Button/Button';
import {Modal} from '@/shared/ui/Modal/Modal';
import {Svg} from '@/shared/ui/Svg/Svg';

import '@/features/share-goal/share-goal-modal.scss';

interface ShareGoalModalProps {
	isOpen: boolean;
	onClose: () => void;
}

export const ShareGoalModal: FC<ShareGoalModalProps> = (props) => {
	const {isOpen, onClose} = props;
	const [block, element] = useBem('share-goal-modal');
	const inputRef = useRef<HTMLInputElement>(null);
	const [shareUrl, setShareUrl] = useState('');

	useEffect(() => {
		if (!isOpen) return;
		setShareUrl(window.location.href);
	}, [isOpen]);

	const handleCopyLink = useCallback(async () => {
		if (!shareUrl) return;

		try {
			await navigator.clipboard.writeText(shareUrl);
			NotificationStore.addNotification({
				type: 'success',
				title: 'Скопировано',
				message: 'Ссылка скопирована в буфер обмена',
			});
		} catch {
			inputRef.current?.focus();
			inputRef.current?.select();
			NotificationStore.addNotification({
				type: 'error',
				title: 'Ошибка',
				message: 'Не удалось скопировать ссылку. Выделите текст и скопируйте вручную.',
			});
		}
	}, [shareUrl]);

	const handleTelegramShare = () => {
		if (!shareUrl) return;

		window.open(
			`https://telegram.me/share/url?url=${encodeURIComponent(shareUrl)}`,
			'sharer',
			'status=0,toolbar=0,width=650,height=500'
		);
	};

	const handleInputFocus = () => {
		inputRef.current?.select();
	};

	return (
		<Modal isOpen={isOpen} onClose={onClose} title="Поделиться" size="small" className={block()}>
			<div className={element('content')}>
				<label className={element('label')} htmlFor="share-goal-link">
					Ссылка на цель
				</label>
				<div className={element('link-row')}>
					<input
						ref={inputRef}
						id="share-goal-link"
						type="text"
						readOnly
						value={shareUrl}
						className={element('link-input')}
						onFocus={handleInputFocus}
					/>
					<button
						type="button"
						className={element('copy-btn')}
						onClick={() => {
							handleCopyLink().catch(() => undefined);
						}}
						aria-label="Скопировать ссылку"
						title="Скопировать ссылку"
					>
						<Svg icon="copy" width="20px" height="20px" />
					</button>
				</div>
				<Button theme="blue" icon="telegram" onClick={handleTelegramShare} className={element('telegram-btn')}>
					Поделиться в Telegram
				</Button>
			</div>
		</Modal>
	);
};

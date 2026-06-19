import {FC, useCallback, useRef} from 'react';

import {useBem} from '@/hooks/useBem';
import {NotificationStore} from '@/store/NotificationStore';
import {ICategory, IComplexity, IGoalFolderTag} from '@/typings/goal';
import './title-with-tags.scss';

import {Tags} from '../Tags/Tags';
import {Title} from '../Title/Title';

interface TitleWithTagsProps {
	className?: string;
	title: string;
	theme?: 'light' | 'integrate';
	category: ICategory;
	complexity: IComplexity;
	totalCompleted: number;
	isList?: boolean;
	short?: boolean;
	categoryRank?: number;
	userFolders?: IGoalFolderTag[];
	estimatedTime?: string;
	listTotal?: number;
}

export const TitleWithTags: FC<TitleWithTagsProps> = (props) => {
	const {
		className,
		title,
		theme,
		category,
		complexity,
		totalCompleted,
		isList,
		short,
		categoryRank,
		userFolders,
		estimatedTime,
		listTotal,
	} = props;

	const [block, element] = useBem('title-with-tags', className);
	const containerRef = useRef<HTMLDivElement>(null);

	const handleCopyTitle = useCallback(async () => {
		try {
			await navigator.clipboard.writeText(title);
			NotificationStore.addNotification({
				type: 'success',
				title: 'Скопировано',
				message: 'Название скопировано в буфер обмена',
			});
		} catch {
			NotificationStore.addNotification({
				type: 'error',
				title: 'Ошибка',
				message: 'Не удалось скопировать название',
			});
		}
	}, [title]);

	/** Клик по названию копирует целиком; если пользователь выделяет текст — не перехватываем буфер */
	const handleTitleButtonClick = useCallback(() => {
		const sel = typeof window !== 'undefined' ? window.getSelection()?.toString() ?? '' : '';
		if (sel.length > 0) {
			return;
		}
		handleCopyTitle().catch(() => {});
	}, [handleCopyTitle]);

	return (
		<div ref={containerRef} className={block({theme, list: isList})}>
			<div className={element('header')}>
				<button
					type="button"
					className={element('title-copyable')}
					title="Нажмите на название без выделения, чтобы скопировать целиком; иначе выделите текст мышью"
					onClick={handleTitleButtonClick}
					aria-label="Нажмите на название без выделения, чтобы скопировать целиком; иначе выделите текст мышью"
				>
					<Title className={element('title', {short})} tag="h1" theme={isList ? 'black' : 'white'}>
						{title}
					</Title>
				</button>
				<button type="button" className={element('copy-button')} onClick={handleCopyTitle} aria-label="Скопировать название">
					<span className={element('copy-icon')} aria-hidden="true" />
				</button>
			</div>
			{!short && (
				<Tags
					category={category}
					listTotal={listTotal}
					medal={categoryRank ? `Топ ${categoryRank} в категории` : undefined}
					complexity={complexity}
					done={totalCompleted}
					theme={theme}
					userFolders={userFolders}
					estimatedTime={estimatedTime}
				/>
			)}
		</div>
	);
};

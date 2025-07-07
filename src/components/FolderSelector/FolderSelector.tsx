import {observer} from 'mobx-react-lite';
import {FC, useEffect, useState} from 'react';

import {useBem} from '@/hooks/useBem';
import {addGoalToFolder, getGoalFoldersLight, IGoalFolder} from '@/utils/api/goals';

import {Button} from '../Button/Button';
import {Loader} from '../Loader/Loader';

import './folder-selector.scss';

interface FolderSelectorProps {
	goalId: number;
	goalTitle: string;
	goalFolders?: Array<{id: number; name: string; color: string; icon: string}>;
	onFolderSelected?: (folderId: number, folderName: string) => void;
	showCreateButton?: boolean;
}

export const FolderSelector: FC<FolderSelectorProps> = observer(
	({goalId, goalTitle, goalFolders = [], onFolderSelected, showCreateButton = false}) => {
		const [block, element] = useBem('folder-selector');

		const [folders, setFolders] = useState<IGoalFolder[]>([]);
		const [isLoading, setIsLoading] = useState(true);
		const [selectedFolderId, setSelectedFolderId] = useState<number | null>(null);
		const [isAdding, setIsAdding] = useState(false);

		const loadFolders = async () => {
			setIsLoading(true);
			try {
				const response = await getGoalFoldersLight();
				if (response.success && response.data) {
					setFolders(response.data || []);
				}
			} catch (error) {
				console.error('Ошибка загрузки папок:', error);
			}
			setIsLoading(false);
		};

		useEffect(() => {
			loadFolders();
		}, []);

		const handleAddToFolder = async () => {
			if (!selectedFolderId) return;

			setIsAdding(true);
			try {
				const response = await addGoalToFolder(selectedFolderId, goalId);
				if (response.success) {
					const selectedFolder = folders.find((f) => f.id === selectedFolderId);
					onFolderSelected?.(selectedFolderId, selectedFolder?.name || '');
				}
			} catch (error) {
				console.error('Ошибка добавления цели в папку:', error);
			}
			setIsAdding(false);
		};

		const handleFolderKeyDown = (e: React.KeyboardEvent, folderId: number) => {
			if (e.key === 'Enter' || e.key === ' ') {
				e.preventDefault();
				const isAlreadyInFolder = goalFolders.some((folder) => folder.id === folderId);
				if (!isAlreadyInFolder) {
					setSelectedFolderId(folderId);
				}
			}
		};

		const handleFolderClick = (folderId: number) => {
			const isAlreadyInFolder = goalFolders.some((folder) => folder.id === folderId);
			if (!isAlreadyInFolder) {
				setSelectedFolderId(folderId);
			}
		};

		if (isLoading) {
			return <Loader isLoading />;
		}

		return (
			<div className={block()}>
				<div className={element('header')}>
					<h3 className={element('title')}>Добавить цель &quot;{goalTitle}&quot; в папку</h3>
					<p className={element('description')}>Выберите папку, в которую хотите добавить эту цель</p>
				</div>

				{folders.length === 0 ? (
					<div className={element('empty')}>
						<p>У вас пока нет папок для целей</p>
						{showCreateButton && <p>Создайте первую папку в разделе &quot;Папки целей&quot;</p>}
					</div>
				) : (
					<div className={element('folders')}>
						{folders.map((folder) => {
							const isAlreadyInFolder = goalFolders.some((goalFolder) => goalFolder.id === folder.id);
							const isSelected = selectedFolderId === folder.id;

							return (
								<div
									key={folder.id}
									className={element('folder', {
										selected: isSelected,
										disabled: isAlreadyInFolder,
									})}
									onClick={() => handleFolderClick(folder.id)}
									onKeyDown={(e) => handleFolderKeyDown(e, folder.id)}
									role="button"
									tabIndex={isAlreadyInFolder ? -1 : 0}
									aria-label={
										isAlreadyInFolder ? `Цель уже находится в папке ${folder.name}` : `Выбрать папку ${folder.name}`
									}
									aria-disabled={isAlreadyInFolder}
								>
									<div className={element('folder-info')}>
										<h4 className={element('folder-name')}>
											{folder.name}
											{folder.isPrivate && <span className={element('private-badge')}>Приватная</span>}
											{isAlreadyInFolder && <span className={element('added-badge')}>Уже добавлена</span>}
										</h4>
										{folder.description && <p className={element('folder-description')}>{folder.description}</p>}
										<p className={element('folder-meta')}>Целей: {folder.goalsCount}</p>
									</div>
									<div className={element('folder-radio')}>
										<input
											type="radio"
											name="folder"
											value={folder.id}
											checked={isSelected}
											disabled={isAlreadyInFolder}
											onChange={() => handleFolderClick(folder.id)}
										/>
									</div>
								</div>
							);
						})}
					</div>
				)}

				{folders.length > 0 && (
					<div className={element('actions')}>
						<Button theme="blue" onClick={handleAddToFolder} active={!selectedFolderId || isAdding} loading={isAdding}>
							Добавить в папку
						</Button>
					</div>
				)}
			</div>
		);
	}
);

import {observer} from 'mobx-react-lite';
import {FC, useCallback, useEffect, useState} from 'react';
import {Link, useNavigate, useParams} from 'react-router-dom';

import {useBem} from '@/hooks/useBem';
import {ICreateFolderData} from '@/typings/goal';
import {
	createGoalFolder,
	deleteGoalFolder,
	getFolderGoals,
	getGoalFolders,
	IGoalFolder,
	IGoalFolderItem,
	removeGoalFromFolder,
	updateGoalFolder,
} from '@/utils/api/goals';

import {Button} from '../Button/Button';
import {EmptyState} from '../EmptyState/EmptyState';
import {FieldCheckbox} from '../FieldCheckbox/FieldCheckbox';
import {FieldInput} from '../FieldInput/FieldInput';
import {FolderRulesManager} from '../FolderRulesManager/FolderRulesManager';
import {ItemGoal} from '../ItemGoal/ItemGoal';
import {Loader} from '../Loader/Loader';
import {Modal} from '../Modal/Modal';
import {ModalConfirm} from '../ModalConfirm/ModalConfirm';

import './goal-folder-manager.scss';

interface GoalFolderManagerProps {
	className?: string;
}

// const FOLDER_ICONS = ['folder', 'bookmark', 'star', 'heart', 'fire', 'music', 'game', 'video', 'book', 'plane', 'map', 'camera'];

// const FOLDER_COLORS = ['#3A89D8', '#7C3AED', '#10B981', '#F59E0B', '#EF4444', '#0EA5E9', '#8B5CF6', '#14B8A6', '#F97316'];

export const GoalFolderManager: FC<GoalFolderManagerProps> = observer(({className}) => {
	const [block, element] = useBem('goal-folder-manager', className);
	const navigate = useNavigate();
	const {folderId} = useParams<{folderId: string}>();

	const [folders, setFolders] = useState<IGoalFolder[]>([]);
	const [selectedFolder, setSelectedFolder] = useState<IGoalFolder | null>(null);
	const [folderGoals, setFolderGoals] = useState<IGoalFolderItem[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [isCreating, setIsCreating] = useState(false);
	const [isEditing, setIsEditing] = useState(false);
	const [activeTab, setActiveTab] = useState<'goals' | 'rules'>('goals');
	const [formData, setFormData] = useState<ICreateFolderData>({
		name: '',
		description: '',
		color: '#3A89D8',
		icon: 'folder',
		is_private: false,
	});
	const [deletingFolder, setDeletingFolder] = useState<IGoalFolder | null>(null);

	const loadFolders = useCallback(async () => {
		setIsLoading(true);
		try {
			const response = await getGoalFolders();
			if (response.success && response.data) {
				setFolders(response.data || []);
			}
		} catch (error) {
			console.error('Ошибка загрузки папок:', error);
		}
		setIsLoading(false);
	}, []);

	const loadFolderGoals = useCallback(async (folderIdNumber: number) => {
		try {
			const response = await getFolderGoals(folderIdNumber);
			if (response.success && response.data) {
				setFolderGoals(response.data.items || []);
			}
		} catch (error) {
			console.error('Ошибка загрузки целей папки:', error);
		}
	}, []);

	useEffect(() => {
		loadFolders();
	}, [loadFolders]);

	useEffect(() => {
		if (!folders.length) return;
		if (folderId) {
			const id = Number(folderId);
			const found = folders.find((f) => f.id === id);
			if (found) {
				setSelectedFolder(found);
				loadFolderGoals(found.id);
			}
		}
	}, [folders, folderId, loadFolderGoals]);

	const handleCreateFolder = async () => {
		if (!formData.name.trim()) return;

		try {
			const response = await createGoalFolder(formData);
			if (response.success) {
				await loadFolders();
				setIsCreating(false);
				setFormData({name: '', description: '', color: '#3A89D8', icon: 'folder', is_private: false});
				// Прогресс заданий обновляется автоматически на бэкенде
			}
		} catch (error) {
			console.error('Ошибка создания папки:', error);
		}
	};

	const handleUpdateFolder = async () => {
		if (!selectedFolder || !formData.name.trim()) return;

		try {
			const response = await updateGoalFolder(selectedFolder.id, formData);
			if (response.success) {
				await loadFolders();
				setIsEditing(false);
				setSelectedFolder(null);
				setFormData({name: '', description: '', color: '#3A89D8', icon: 'folder', is_private: false});
			}
		} catch (error) {
			console.error('Ошибка обновления папки:', error);
		}
	};

	const handleDeleteFolder = async (folderIdNumber: number) => {
		try {
			const response = await deleteGoalFolder(folderIdNumber);
			if (response.success) {
				await loadFolders();
				if (selectedFolder?.id === folderIdNumber) {
					setSelectedFolder(null);
					setFolderGoals([]);
					navigate('/user/self/folders', {replace: true});
				}
			}
		} catch (error) {
			console.error('Ошибка удаления папки:', error);
		}
	};

	const handleSelectFolder = async (folder: IGoalFolder) => {
		setSelectedFolder(folder);
		navigate(`/user/self/folders/${folder.id}`);
		await loadFolderGoals(folder.id);
	};

	const handleEditFolder = (folder: IGoalFolder) => {
		setSelectedFolder(folder);
		setFormData({
			name: folder.name,
			description: folder.description || '',
			color: folder.color || '#3A89D8',
			icon: folder.icon || 'folder',
			is_private: folder.isPrivate,
		});
		setIsEditing(true);
	};

	const handleRemoveGoalFromFolder = async (goalId: number) => {
		if (!selectedFolder) return;

		try {
			const response = await removeGoalFromFolder(selectedFolder.id, goalId);
			if (response.success) {
				await loadFolderGoals(selectedFolder.id);
				await loadFolders();
			}
		} catch (error) {
			console.error('Ошибка удаления цели из папки:', error);
		}
	};

	const handleFolderKeyDown = (e: React.KeyboardEvent, folder: IGoalFolder) => {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			handleSelectFolder(folder);
		}
	};

	if (isLoading) {
		return <Loader isLoading />;
	}

	return (
		<div className={block()}>
			<div className={element('header')}>
				<h2 className={element('title')}>Папки целей</h2>
				<Button theme="blue" icon="plus" onClick={() => setIsCreating(true)} size="medium">
					Создать папку
				</Button>
			</div>

			<div className={element('content')}>
				<div className={element('folders-list')}>
					<h3>Мои папки ({folders.length})</h3>
					{folders.length === 0 ? (
						<EmptyState
							title="У вас пока нет папок для целей"
							description="Создайте первую папку, чтобы организовать свои цели"
						/>
					) : (
						<div className={element('folders')}>
							{folders.map((folder) => (
								<div
									key={folder.id}
									className={element('folder', {
										active: selectedFolder?.id === folder.id,
									})}
									onClick={() => handleSelectFolder(folder)}
									onKeyDown={(e) => handleFolderKeyDown(e, folder)}
									role="button"
									tabIndex={0}
									aria-label={`Выбрать папку ${folder.name}`}
								>
									<div className={element('folder-badge')} style={{backgroundColor: folder.color}}>
										{/* <span className={element('icon', {[folder.icon || 'folder']: true})} /> */}
									</div>
									<div className={element('folder-info')}>
										<h4 className={element('folder-name')}>
											{folder.name}
											{folder.isPrivate && <span className={element('private-badge')}>Приватная</span>}
										</h4>
										{folder.description && <p className={element('folder-description')}>{folder.description}</p>}
										<p className={element('folder-meta')}>Целей: {folder.goalsCount}</p>
									</div>
									<div className={element('folder-actions')}>
										<Button
											theme="blue-light"
											icon="edit"
											size="small"
											onClick={(e) => {
												e.stopPropagation();
												handleEditFolder(folder);
											}}
										/>
										<Button
											theme="red"
											icon="trash"
											size="small"
											onClick={(e) => {
												e.stopPropagation();
												setDeletingFolder(folder);
											}}
										/>
									</div>
								</div>
							))}
						</div>
					)}
				</div>

				{selectedFolder && (
					<div className={element('folder-content')}>
						<div className={element('folder-header')}>
							<h3>
								<span className={element('folder-badge', {inline: true})} style={{backgroundColor: selectedFolder.color}}>
									{/* <span className={element('icon', {[selectedFolder.icon || 'folder']: true})} /> */}
								</span>
								Папка &quot;{selectedFolder.name}&quot;
							</h3>
							<div className={element('folder-tabs')}>
								<button
									type="button"
									className={element('tab', {active: activeTab === 'goals'})}
									onClick={() => setActiveTab('goals')}
								>
									Цели ({folderGoals.length})
								</button>
								<button
									type="button"
									className={element('tab', {active: activeTab === 'rules'})}
									onClick={() => setActiveTab('rules')}
								>
									Правила ({selectedFolder.rules?.length || 0})
								</button>
							</div>
						</div>

						{activeTab === 'goals' && (
							<div className={element('tab-content')}>
								{folderGoals.length === 0 ? (
									<EmptyState title="В этой папке пока нет целей" description="Добавьте цели в папку из страницы цели" />
								) : (
									<div className={element('goals')}>
										{folderGoals.map((folderGoal) => (
											<div key={folderGoal.id} className={element('goal-item')}>
												<Link to={`/goals/${folderGoal.code}`} className={element('goal-link')}>
													<ItemGoal
														img={folderGoal.image || '/public/svg/goal-default.svg'}
														title={folderGoal.title}
														className={element('goal-card')}
													/>
												</Link>
												<Button
													theme="red"
													icon="trash"
													size="small"
													onClick={() => handleRemoveGoalFromFolder(folderGoal.goal)}
												>
													Удалить из папки
												</Button>
											</div>
										))}
									</div>
								)}
							</div>
						)}

						{activeTab === 'rules' && (
							<div className={element('tab-content')}>
								<FolderRulesManager
									folder={selectedFolder}
									rules={selectedFolder.rules || []}
									onRulesUpdate={loadFolders}
									className={element('rules-manager')}
								/>
							</div>
						)}
					</div>
				)}
			</div>

			{/* Модальное окно создания папки */}
			<Modal
				isOpen={isCreating}
				onClose={() => {
					setIsCreating(false);
					setFormData({name: '', description: '', color: '#3A89D8', icon: 'folder', is_private: false});
				}}
				title="Создать новую папку"
			>
				<div className={element('form')}>
					<FieldInput
						id="folder-name"
						text="Название папки"
						value={formData.name}
						setValue={(value: string) => setFormData({...formData, name: value})}
						placeholder="Введите название папки"
						required
					/>
					<FieldInput
						id="folder-description"
						text="Описание (необязательно)"
						value={formData.description || ''}
						setValue={(value: string) => setFormData({...formData, description: value})}
						placeholder="Краткое описание папки"
						type="textarea"
					/>
					{/* <div className={element('icon-picker')}>
						{['folder', 'bookmark', 'star', 'heart', 'fire', 'music', 'game', 'video', 'book', 'plane', 'map', 'camera'].map(
							(ico) => (
								<button
									key={ico}
									type="button"
									className={element('icon-option', {active: formData.icon === ico})}
									onClick={() => setFormData({...formData, icon: ico})}
									aria-label={`Выбрать иконку ${ico}`}
								>
									<span className={element('icon', {[ico]: true})} />
								</button>
							)
						)}
					</div> */}
					<div className={element('color-picker')}>
						{['#3A89D8', '#7C3AED', '#10B981', '#F59E0B', '#EF4444', '#0EA5E9', '#8B5CF6', '#14B8A6', '#F97316'].map((clr) => (
							<button
								key={clr}
								type="button"
								style={{backgroundColor: clr}}
								className={element('color-option', {active: formData.color === clr})}
								onClick={() => setFormData({...formData, color: clr})}
								aria-label={`Выбрать цвет ${clr}`}
							/>
						))}
					</div>
					<FieldCheckbox
						id="folder-private"
						text="Приватная папка (видна только вам)"
						checked={formData.is_private || false}
						setChecked={(checked: boolean) => setFormData({...formData, is_private: checked})}
					/>
					<div className={element('form-actions')}>
						<Button theme="blue" onClick={handleCreateFolder} active={!formData.name.trim()}>
							Создать папку
						</Button>
						<Button
							theme="blue-light"
							onClick={() => {
								setIsCreating(false);
								setFormData({name: '', description: '', color: '#3A89D8', icon: 'folder', is_private: false});
							}}
						>
							Отмена
						</Button>
					</div>
				</div>
			</Modal>

			{/* Модальное окно редактирования папки */}
			<Modal
				isOpen={isEditing}
				onClose={() => {
					setIsEditing(false);
					setSelectedFolder(null);
					setFormData({name: '', description: '', color: '#3A89D8', icon: 'folder', is_private: false});
				}}
				title="Редактировать папку"
			>
				<div className={element('form')}>
					<FieldInput
						id="edit-folder-name"
						text="Название папки"
						value={formData.name}
						setValue={(value: string) => setFormData({...formData, name: value})}
						placeholder="Введите название папки"
						required
					/>
					<FieldInput
						id="edit-folder-description"
						text="Описание (необязательно)"
						value={formData.description || ''}
						setValue={(value: string) => setFormData({...formData, description: value})}
						placeholder="Краткое описание папки"
						type="textarea"
					/>
					{/* <div className={element('icon-picker')}>
						{['folder', 'bookmark', 'star', 'heart', 'fire', 'music', 'game', 'video', 'book', 'plane', 'map', 'camera'].map(
							(ico) => (
								<button
									key={ico}
									type="button"
									className={element('icon-option', {active: formData.icon === ico})}
									onClick={() => setFormData({...formData, icon: ico})}
									aria-label={`Выбрать иконку ${ico}`}
								>
									<span className={element('icon', {[ico]: true})} />
								</button>
							)
						)}
					</div> */}
					<div className={element('color-picker')}>
						{['#3A89D8', '#7C3AED', '#10B981', '#F59E0B', '#EF4444', '#0EA5E9', '#8B5CF6', '#14B8A6', '#F97316'].map((clr) => (
							<button
								key={clr}
								type="button"
								style={{backgroundColor: clr}}
								className={element('color-option', {active: formData.color === clr})}
								onClick={() => setFormData({...formData, color: clr})}
								aria-label={`Выбрать цвет ${clr}`}
							/>
						))}
					</div>
					<FieldCheckbox
						id="edit-folder-private"
						text="Приватная папка (видна только вам)"
						checked={formData.is_private || false}
						setChecked={(checked: boolean) => setFormData({...formData, is_private: checked})}
					/>
					<div className={element('form-actions')}>
						<Button theme="blue" onClick={handleUpdateFolder} active={!formData.name.trim()}>
							Сохранить изменения
						</Button>
						<Button
							theme="blue-light"
							onClick={() => {
								setIsEditing(false);
								setSelectedFolder(null);
								setFormData({name: '', description: '', color: '#3A89D8', icon: 'folder', is_private: false});
							}}
						>
							Отмена
						</Button>
					</div>
				</div>
			</Modal>
			<ModalConfirm
				title="Удалить папку?"
				isOpen={deletingFolder !== null}
				onClose={() => setDeletingFolder(null)}
				handleBtn={() => {
					if (deletingFolder) {
						handleDeleteFolder(deletingFolder.id);
						setDeletingFolder(null);
					}
				}}
				textBtn="Удалить папку"
				text={`Вы уверены, что хотите удалить папку "${deletingFolder?.name}"? Цели не будут удалены.`}
				themeBtn="red"
			/>
		</div>
	);
});

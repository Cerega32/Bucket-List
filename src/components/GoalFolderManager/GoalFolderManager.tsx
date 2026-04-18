import {observer} from 'mobx-react-lite';
import {FC, useCallback, useEffect, useRef, useState} from 'react';
import {useLocation, useNavigate, useParams} from 'react-router-dom';

import {useBem} from '@/hooks/useBem';
import useScreenSize from '@/hooks/useScreenSize';
import {ModalStore} from '@/store/ModalStore';
import {UserStore} from '@/store/UserStore';
import {ICreateFolderData, IShortGoal} from '@/typings/goal';
import {IGoalsPagination} from '@/typings/list';
import {
	createGoalFolder,
	deleteGoalFolder,
	getFolderGoals,
	getGoalFolders,
	IGoalFolder,
	removeGoalFromFolder,
	updateGoalFolder,
} from '@/utils/api/goals';
import {addGoal} from '@/utils/api/post/addGoal';
import {markGoal} from '@/utils/api/post/markGoal';

import {GoalFolderManagerSkeleton} from './GoalFolderManagerSkeleton';
import {Banner} from '../Banner/Banner';
import {Button} from '../Button/Button';
import {Card} from '../Card/Card';
import {CatalogItemsSkeleton} from '../CatalogItems/CatalogItemsSkeleton';
import {CharCount} from '../CharCount/CharCount';
import {EmptyState} from '../EmptyState/EmptyState';
import {FieldInput} from '../FieldInput/FieldInput';
import {FolderRulesManager} from '../FolderRulesManager/FolderRulesManager';
import {Line} from '../Line/Line';
import {Loader} from '../Loader/Loader';
import {Modal} from '../Modal/Modal';
import {ModalConfirm} from '../ModalConfirm/ModalConfirm';
import Select, {OptionSelect} from '../Select/Select';
import {Switch} from '../Switch/Switch';
import {ITabs, Tabs} from '../Tabs/Tabs';
import {Title} from '../Title/Title';

import './goal-folder-manager.scss';

const FOLDER_GOALS_PAGE_SIZE = 30;

interface GoalFolderManagerProps {
	className?: string;
}

// const FOLDER_ICONS = ['folder', 'bookmark', 'star', 'heart', 'fire', 'music', 'game', 'video', 'book', 'plane', 'map', 'camera'];

// const FOLDER_COLORS = ['#3A89D8', '#7C3AED', '#10B981', '#F59E0B', '#EF4444', '#0EA5E9', '#8B5CF6', '#14B8A6', '#F97316'];

// Пока не используется
// const filterItems = [
// 	{
// 		name: 'Публичные',
// 		code: 'public',
// 	},
// 	{
// 		name: 'Приватные',
// 		code: 'private',
// 	},
// ];

export const GoalFolderManager: FC<GoalFolderManagerProps> = observer(({className}) => {
	const [block, element] = useBem('goal-folder-manager', className);
	const navigate = useNavigate();
	const location = useLocation();
	const {folderId} = useParams<{folderId: string}>();
	const {isScreenXs} = useScreenSize();
	const {isAuth, userSelf} = UserStore;
	const {setIsOpen, setWindow} = ModalStore;

	const activeTab: 'goals' | 'rules' = location.hash === '#rules' ? 'rules' : 'goals';

	const [folders, setFolders] = useState<IGoalFolder[]>([]);
	const [selectedFolder, setSelectedFolder] = useState<IGoalFolder | null>(null);
	const [folderGoals, setFolderGoals] = useState<IShortGoal[]>([]);
	const [folderGoalsPagination, setFolderGoalsPagination] = useState<IGoalsPagination | null>(null);
	const [isLoadingFolderGoals, setIsLoadingFolderGoals] = useState(false);
	const [isLoadingMore, setIsLoadingMore] = useState(false);
	const [isLoading, setIsLoading] = useState(true);
	const [isCreating, setIsCreating] = useState(false);
	const [isEditing, setIsEditing] = useState(false);
	const [formData, setFormData] = useState<ICreateFolderData>({
		name: '',
		description: '',
		color: '#3A89D8',
		icon: 'folder-open',
		is_private: false,
	});
	const [deletingFolder, setDeletingFolder] = useState<IGoalFolder | null>(null);
	const [search, setSearch] = useState('');
	const [selectedFilters] = useState<string[]>([]);
	const [activeSort, setActiveSort] = useState(0);

	const loadMoreRef = useRef<HTMLDivElement>(null);
	const loaderTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const isLoadingMoreRef = useRef(false);
	const lastRequestedPageRef = useRef(0);
	const folderGoalsPaginationRef = useRef<IGoalsPagination | null>(null);
	folderGoalsPaginationRef.current = folderGoalsPagination;
	const selectedFolderIdRef = useRef<number | null>(null);
	selectedFolderIdRef.current = selectedFolder?.id ?? null;
	const loadedFolderGoalsIdRef = useRef<number | null>(null);
	const hasLoadedFoldersOnceRef = useRef(false);

	const isSearchMode = search.trim().length > 0;

	const sortOptions: OptionSelect[] = [
		{
			name: 'Новые',
			value: 'created_at_desc',
		},
		{
			name: 'Старые',
			value: 'created_at_asc',
		},
		{
			name: 'Больше целей',
			value: 'goals_count_desc',
		},
	];

	const loadFolders = useCallback(async () => {
		const isFirstLoad = !hasLoadedFoldersOnceRef.current;
		if (isFirstLoad) setIsLoading(true);
		try {
			const response = await getGoalFolders();
			if (response.success && response.data) {
				setFolders(response.data || []);
			}
		} catch (error) {
			console.error('Ошибка загрузки папок:', error);
		}
		hasLoadedFoldersOnceRef.current = true;
		if (isFirstLoad) setIsLoading(false);
	}, []);

	const filteredFolders = folders
		.filter((folder) => {
			const query = search.trim().toLowerCase();
			if (!query) return true;
			return folder.name.toLowerCase().includes(query) || (folder.description || '').toLowerCase().includes(query);
		})
		.filter((folder) => {
			if (selectedFilters.length === 0) return true;
			const isPrivateFilter = selectedFilters.includes('private');
			const isPublicFilter = selectedFilters.includes('public');

			if (isPrivateFilter && !isPublicFilter) {
				return folder.isPrivate;
			}
			if (isPublicFilter && !isPrivateFilter) {
				return !folder.isPrivate;
			}

			return true;
		})
		.sort((a, b) => {
			const sortKey = sortOptions[activeSort]?.value;

			if (sortKey === 'created_at_desc') {
				return (b.createdAt || '').localeCompare(a.createdAt || '');
			}
			if (sortKey === 'created_at_asc') {
				return (a.createdAt || '').localeCompare(b.createdAt || '');
			}
			if (sortKey === 'goals_count_desc') {
				return (b.goalsCount || 0) - (a.goalsCount || 0);
			}

			return 0;
		});

	const handleSearchChange = (value: string) => {
		setSearch(value);
	};

	// Пока не используется
	// const handleFilterChange = async (selected: string[]) => {
	// 	setSelectedFilters(selected);
	// };

	const handleSortSelect = async (active: number): Promise<void> => {
		setActiveSort(active);
	};

	const buttonsSwitch = [
		{
			url: '#all',
			name: 'Все папки',
			page: 'all',
			count: folders.length,
		},
	];

	const loadFolderGoals = useCallback(async (folderIdNumber: number) => {
		lastRequestedPageRef.current = 1;
		loadedFolderGoalsIdRef.current = folderIdNumber;
		setFolderGoals([]);
		setFolderGoalsPagination(null);
		setIsLoadingFolderGoals(true);
		try {
			const response = await getFolderGoals(folderIdNumber, 1, FOLDER_GOALS_PAGE_SIZE);
			if (response.success && response.data) {
				setFolderGoals(response.data.goals || []);
				setFolderGoalsPagination(response.data.goalsPagination || null);
			}
		} catch (error) {
			console.error('Ошибка загрузки целей папки:', error);
		}
		setIsLoadingFolderGoals(false);
	}, []);

	const loadMoreFolderGoals = useCallback(async () => {
		const pagination = folderGoalsPaginationRef.current;
		const folderIdNumber = selectedFolderIdRef.current;
		if (isLoadingMoreRef.current || !pagination?.hasMore || !folderIdNumber) return;

		const nextPage = pagination.page + 1;
		if (lastRequestedPageRef.current >= nextPage) return;
		lastRequestedPageRef.current = nextPage;

		isLoadingMoreRef.current = true;
		loaderTimerRef.current = setTimeout(() => setIsLoadingMore(true), 300);

		try {
			const response = await getFolderGoals(folderIdNumber, nextPage, FOLDER_GOALS_PAGE_SIZE);
			if (response.success && response.data) {
				setFolderGoals((prev) => [...prev, ...(response.data.goals || [])]);
				setFolderGoalsPagination(response.data.goalsPagination || null);
			} else {
				lastRequestedPageRef.current = nextPage - 1;
			}
		} catch (error) {
			console.error('Ошибка подгрузки целей папки:', error);
			lastRequestedPageRef.current = nextPage - 1;
		}

		if (loaderTimerRef.current) clearTimeout(loaderTimerRef.current);
		isLoadingMoreRef.current = false;
		setIsLoadingMore(false);
	}, []);

	useEffect(() => {
		loadFolders();
	}, []);

	useEffect(() => {
		if (!folders.length) return;
		if (folderId) {
			const id = Number(folderId);
			const found = folders.find((f) => f.id === id);
			if (found) {
				setSelectedFolder((prev) => (prev?.id === found.id ? prev : found));
				if (loadedFolderGoalsIdRef.current !== found.id) {
					loadFolderGoals(found.id);
				}
			}
		}
	}, [folders, folderId]);

	useEffect(() => {
		if (!folderGoalsPagination?.hasMore) return undefined;

		const intersectionObserver = new IntersectionObserver(
			(entries) => {
				if (entries[0].isIntersecting) {
					loadMoreFolderGoals();
				}
			},
			{rootMargin: '400px'}
		);

		const ref = loadMoreRef.current;
		if (ref) {
			intersectionObserver.observe(ref);
		}

		return () => {
			if (ref) {
				intersectionObserver.unobserve(ref);
			}
		};
	}, [folderGoalsPagination?.hasMore, folderGoalsPagination?.page, loadMoreFolderGoals]);

	useEffect(
		() => () => {
			if (loaderTimerRef.current) clearTimeout(loaderTimerRef.current);
		},
		[]
	);

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

	const handleRemoveGoalFromFolder = async (goal: IShortGoal) => {
		if (!selectedFolder) return;

		try {
			const response = await removeGoalFromFolder(selectedFolder.id, goal.id);
			if (response.success) {
				setFolderGoals((prev) => prev.filter((g) => g.id !== goal.id));
				setFolderGoalsPagination((prev) => (prev ? {...prev, totalGoals: Math.max(prev.totalGoals - 1, 0)} : prev));
				setFolders((prev) =>
					prev.map((f) => (f.id === selectedFolder.id ? {...f, goalsCount: Math.max((f.goalsCount ?? 0) - 1, 0)} : f))
				);
				setSelectedFolder((prev) => (prev ? {...prev, goalsCount: Math.max((prev.goalsCount ?? 0) - 1, 0)} : prev));
			}
		} catch (error) {
			console.error('Ошибка удаления цели из папки:', error);
		}
	};

	const requireAuth = () => {
		if (!isAuth) {
			setWindow('login');
			setIsOpen(true);
			return false;
		}
		return true;
	};

	const updateGoalInList = (code: string, patch: Partial<IShortGoal>, data?: {usersAddedCount?: number}) => {
		setFolderGoals((prev) =>
			prev.map((goal) =>
				goal.code === code
					? {
							...goal,
							...patch,
							...(data?.usersAddedCount !== undefined ? {totalAdded: data.usersAddedCount} : {}),
					  }
					: goal
			)
		);
	};

	const handleGoalAdd = async (goal: IShortGoal) => {
		if (!requireAuth()) return;
		const res = await addGoal(goal.code);
		if (res.success) {
			updateGoalInList(goal.code, {addedByUser: true}, {usersAddedCount: res.data?.totalAdded});
		}
	};

	const handleGoalMark = async (goal: IShortGoal) => {
		if (!requireAuth()) return;
		const done = !goal.completedByUser;
		const res = await markGoal(goal.code, done);
		if (res.success) {
			updateGoalInList(goal.code, {completedByUser: done});
		}
	};

	const handleFolderKeyDown = (e: React.KeyboardEvent, folder: IGoalFolder) => {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			handleSelectFolder(folder);
		}
	};

	const maxFolders = userSelf.limits?.maxFolders ?? null;
	const foldersLimitReached = maxFolders !== null && folders.length >= maxFolders;

	const handleCreateButtonClick = () => {
		if (foldersLimitReached) {
			navigate('/user/self/subs');
			return;
		}
		setIsCreating(true);
	};

	return (
		<div className={block()}>
			<div className={element('header')}>
				<Title tag="h2" className={element('title')}>
					Папки целей
				</Title>
				<Button
					theme="blue"
					icon={foldersLimitReached ? 'lock' : 'plus'}
					onClick={handleCreateButtonClick}
					size="small"
					width={isScreenXs ? 'full' : 'auto'}
				>
					{foldersLimitReached ? 'Безлимит с Premium' : 'Создать папку'}
				</Button>
			</div>

			<div className={element('content')}>
				<div className={element('folders-list')}>
					<div className="catalog-items__filters">
						<Switch className="catalog-items__switch" buttons={buttonsSwitch} active="all" />
						<Line className="catalog-items__line" />
						<div className="catalog-items__search-wrapper catalog-items__search-wrapper--wrap-on-lg">
							<FieldInput
								className="catalog-items__search"
								placeholder="Поиск по названию или описанию папки"
								id="goal-folders-search"
								value={search}
								setValue={handleSearchChange}
								iconBegin="search"
							/>
							<div className="catalog-items__categories-wrapper">
								{/* <FiltersCheckbox
									head={{name: 'Все папки', code: 'all'}}
									items={filterItems}
									onFinish={handleFilterChange}
									multipleSelectedText={['тип', 'типа', 'типов']}
									multipleThreshold={1}
								/> */}
								<Select options={sortOptions} activeOption={activeSort} onSelect={handleSortSelect} filter />
							</div>
						</div>
					</div>
					{isLoading ? (
						<GoalFolderManagerSkeleton />
					) : filteredFolders.length === 0 ? (
						<EmptyState
							title={isSearchMode ? 'По запросу ничего не найдено' : 'У вас пока нет папок для целей'}
							description={
								isSearchMode
									? 'Попробуйте изменить параметры поиска'
									: 'Создайте первую папку, чтобы организовать свои цели'
							}
						/>
					) : (
						<div className={element('folders')}>
							{filteredFolders.map((folder) => (
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
										{/* Пока не используется */}
										{/* {folder.isPrivate && (
											<img
												src="/svg/eye-closed.svg"
												alt="Приватная папка"
												className={element('folder-badge-private-icon')}
												title="Приватная"
											/>
										)} */}
									</div>
									<div className={element('folder-info')}>
										<h4 className={element('folder-name')}>
											{folder.name}
											{/* Пока не используется */}
											{/* {folder.isPrivate && <span className={element('private-badge')}>Приватная</span>} */}
										</h4>
										{folder.description && <p className={element('folder-description')}>{folder.description}</p>}
										<p className={element('folder-meta')}>Целей: {folder.goalsCount}</p>
									</div>
									<div className={element('folder-actions')}>
										<div className={element('folder-action')}>
											<Button
												theme="blue-light"
												icon="edit"
												size="small"
												onClick={(e) => {
													e.stopPropagation();
													handleEditFolder(folder);
												}}
											/>
										</div>
										<div className={element('folder-action')}>
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
								</div>
							))}
						</div>
					)}
				</div>

				{selectedFolder && (
					<div className={element('folder-content')}>
						<div className={element('folder-header')}>
							<Title tag="h3" className={element('folder-header-title')}>
								<span
									className={element('folder-badge', {inline: true})}
									style={{backgroundColor: selectedFolder.color}}
									aria-hidden="true"
								>
									{/* Пока не используется */}
									{/* {selectedFolder.isPrivate && (
										<img
											src="/svg/eye-closed.svg"
											alt="Приватная папка"
											className={element('folder-badge-private-icon')}
											aria-hidden="true"
										/>
									)} */}
								</span>
								<span>
									Папка &quot;{selectedFolder.name}&quot;
									{/* {selectedFolder.isPrivate && <span className={element('folder-private-label')}> (Приватная)</span>} */}
								</span>
							</Title>
							<Tabs
								className={element('folder-tabs')}
								tabs={
									[
										{
											url: '#goals',
											name: 'Цели',
											page: 'goals',
											count: folderGoalsPagination?.totalGoals ?? folderGoals.length,
										},
										{
											url: '#rules',
											name: 'Правила',
											page: 'rules',
											count: selectedFolder.rules?.length || 0,
										},
									] as ITabs[]
								}
								active={activeTab}
								preventScrollReset
							/>
						</div>

						{activeTab === 'goals' && (
							<div className={element('tab-content')}>
								{isLoadingFolderGoals ? (
									<CatalogItemsSkeleton count={6} columns="3" />
								) : folderGoals.length === 0 ? (
									<EmptyState title="В этой папке пока нет целей" description="Добавьте цели в папку из страницы цели" />
								) : (
									<>
										<Banner
											type="info"
											className={element('banner')}
											message="Кнопка удаления в карточке уберёт цель только из этой папки — сама цель останется у вас в списке."
										/>
										<div className={element('goals')}>
											{folderGoals.map((folderGoal) => (
												<Card
													key={folderGoal.id}
													goal={folderGoal}
													className={element('goal-card')}
													skipDeleteConfirm
													onClickAdd={() => handleGoalAdd(folderGoal)}
													onClickDelete={() => handleRemoveGoalFromFolder(folderGoal)}
													onClickMark={() => handleGoalMark(folderGoal)}
												/>
											))}
										</div>
										{folderGoalsPagination?.hasMore && (
											<div ref={loadMoreRef} className={element('load-more')}>
												<Loader isLoading={isLoadingMore} />
											</div>
										)}
									</>
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
					<div>
						<FieldInput
							id="folder-name"
							text="Название папки"
							value={formData.name}
							setValue={(value: string) => setFormData({...formData, name: value.slice(0, 50)})}
							placeholder="Введите название папки"
							required
						/>
						<CharCount current={formData.name.length} max={50} />
					</div>
					<div>
						<FieldInput
							id="folder-description"
							text="Описание (необязательно)"
							value={formData.description || ''}
							setValue={(value: string) => setFormData({...formData, description: value.slice(0, 100)})}
							placeholder="Краткое описание папки"
							type="textarea"
						/>
						<CharCount current={(formData.description || '').length} max={100} />
					</div>
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
					{/* Пока не используется */}
					{/* <FieldCheckbox
						id="folder-private"
						text="Приватная папка (видна только вам)"
						checked={formData.is_private || false}
						setChecked={(checked: boolean) => setFormData({...formData, is_private: checked})}
					/> */}
					<div className={element('form-actions')}>
						<Button theme="blue" onClick={handleCreateFolder} disabled={!formData.name.trim()} width="auto">
							Создать папку
						</Button>
						<Button
							theme="blue-light"
							onClick={() => {
								setIsCreating(false);
								setFormData({name: '', description: '', color: '#3A89D8', icon: 'folder', is_private: false});
							}}
							width="auto"
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
					<div>
						<FieldInput
							id="edit-folder-name"
							text="Название папки"
							value={formData.name}
							setValue={(value: string) => setFormData({...formData, name: value.slice(0, 50)})}
							placeholder="Введите название папки"
							required
						/>
						<CharCount current={formData.name.length} max={50} />
					</div>
					<div>
						<FieldInput
							id="edit-folder-description"
							text="Описание (необязательно)"
							value={formData.description || ''}
							setValue={(value: string) => setFormData({...formData, description: value.slice(0, 100)})}
							placeholder="Краткое описание папки"
							type="textarea"
						/>
						<CharCount current={(formData.description || '').length} max={100} />
					</div>
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
					{/* Пока не используется */}
					{/* <FieldCheckbox
						id="edit-folder-private"
						text="Приватная папка (видна только вам)"
						checked={formData.is_private || false}
						setChecked={(checked: boolean) => setFormData({...formData, is_private: checked})}
					/> */}
					<div className={element('form-actions')}>
						<Button theme="blue" onClick={handleUpdateFolder} disabled={!formData.name.trim()} width="auto">
							Сохранить изменения
						</Button>
						<Button
							theme="blue-light"
							onClick={() => {
								setIsEditing(false);
								setSelectedFolder(null);
								setFormData({name: '', description: '', color: '#3A89D8', icon: 'folder', is_private: false});
							}}
							width="auto"
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

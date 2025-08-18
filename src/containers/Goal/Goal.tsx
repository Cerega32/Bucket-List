import {observer} from 'mobx-react-lite';
import {FC, useEffect, useRef, useState} from 'react';
import {useParams} from 'react-router-dom';

import {AsideGoal} from '@/components/AsideGoal/AsideGoal';
import {ContentGoal} from '@/components/ContentGoal/ContentGoal';
import {EditGoal} from '@/components/EditGoal/EditGoal';
import {HeaderGoal} from '@/components/HeaderGoal/HeaderGoal';
import {Loader} from '@/components/Loader/Loader';
import {RegularGoalSettingsModal} from '@/components/RegularGoalSettingsModal/RegularGoalSettingsModal';
import {ScrollToTop} from '@/components/ScrollToTop/ScrollToTop';
import {useBem} from '@/hooks/useBem';
import useScreenSize from '@/hooks/useScreenSize';
import {GoalStore} from '@/store/GoalStore';
import {ModalStore} from '@/store/ModalStore';
import {NotificationStore} from '@/store/NotificationStore';
import {ThemeStore} from '@/store/ThemeStore';
import {IGoal} from '@/typings/goal';
import {IPage} from '@/typings/page';
import {canEditGoal} from '@/utils/api/get/canEditGoal';
import {getGoal} from '@/utils/api/get/getGoal';
import {getRegularGoalSettings} from '@/utils/api/get/getRegularGoalSettings';
import {addGoal} from '@/utils/api/post/addGoal';
import {addRegularGoalToUser} from '@/utils/api/post/addRegularGoalToUser';
import {markGoal} from '@/utils/api/post/markGoal';
import {removeGoal} from '@/utils/api/post/removeGoal';

import './goal.scss';

export const Goal: FC<IPage> = observer(({page}) => {
	const [block, element] = useBem('goal');
	const {isScreenMobile, isScreenSmallTablet} = useScreenSize();
	const headerRef = useRef<HTMLElement | null>(null);

	const {setId} = GoalStore;
	const params = useParams();
	const listId = params?.['id'];
	const [goal, setGoal] = useState<IGoal | null>(null);
	const [isEditing, setIsEditing] = useState(false);
	const [isLoading, setIsLoading] = useState(true);
	const [canEditCheck, setCanEditCheck] = useState<{can_edit: boolean; checked: boolean}>({
		can_edit: false,
		checked: false,
	});

	// Состояния для модалки регулярных целей
	const [showRegularModal, setShowRegularModal] = useState(false);
	const [regularGoalData, setRegularGoalData] = useState<any>(null);
	const [isRegularLoading, setIsRegularLoading] = useState(false);

	// Отладка состояний модалки
	console.log('🔄 Состояния модалки:', {showRegularModal, regularGoalData, isRegularLoading});

	const {setIsOpen, setWindow} = ModalStore;
	const {setHeader} = ThemeStore;

	useEffect(() => {
		(async () => {
			if (listId) {
				setIsLoading(true);
				const res = await getGoal(listId);
				if (res.success) {
					setGoal(res.data.goal);
					setId(res.data.goal.id);
				}
				setIsLoading(false);
			}
		})();
	}, [listId]);

	useEffect(() => {
		const checkEditPermission = async () => {
			if (goal && goal.createdBy && !canEditCheck.checked) {
				try {
					const response = await canEditGoal(listId || '');
					if (response.success && response.data) {
						setCanEditCheck({
							can_edit: response.data.can_edit,
							checked: true,
						});
					}
				} catch (error) {
					console.error('Ошибка при проверке возможности редактирования:', error);
				}
			}
		};

		checkEditPermission();
	}, [goal, listId, canEditCheck.checked]);

	const openAddReview = () => {
		setWindow('add-review');
		setIsOpen(true);
	};

	const updateGoal = async (code: string, operation: 'add' | 'delete' | 'mark' | 'partial' | 'start', done?: boolean): Promise<void> => {
		if (!goal) {
			return;
		}

		// Специальная обработка для начала выполнения
		if (operation === 'start') {
			// Логика начала выполнения обрабатывается в AsideGoal
			// Здесь можем добавить дополнительную логику если нужно
			return;
		}

		// Специальная обработка для частичного выполнения
		if (operation === 'partial') {
			// Логика частичного выполнения обрабатывается в AsideGoal
			// Здесь можем добавить дополнительную логику если нужно
			return;
		}

		// Специальная обработка для добавления цели - проверяем на регулярность
		if (operation === 'add') {
			console.log('🔍 Проверяем регулярность цели:', code);
			try {
				// Проверяем, является ли цель регулярной
				const regularSettings = await getRegularGoalSettings(code);
				console.log('📡 Ответ API регулярности:', regularSettings);

				if (regularSettings.success && regularSettings.data) {
					console.log('✅ Цель регулярная, показываем модалку', regularSettings.data);
					// Цель регулярная - показываем модалку настройки
					setRegularGoalData(regularSettings.data);
					setShowRegularModal(true);
					console.log('🎯 Состояния установлены, должна открыться модалка');
					return; // Выходим из функции, добавление будет происходить в модалке
				}
				console.log('❌ Цель не регулярная или нет данных:', regularSettings);
			} catch (error) {
				// Если API регулярности не отвечает или цель не регулярная, продолжаем обычное добавление
				console.log('❌ Цель не является регулярной или ошибка API:', error);
			}
		}

		const res = await (operation === 'add'
			? addGoal(code)
			: operation === 'delete'
			? removeGoal(code)
			: markGoal(
					code,
					!done,
					!done
						? {
								title: 'Цель успешно выполнена!',
								type: 'success',
								id: Math.random().toString(36).substring(2, 15),
								message: 'Добавьте отзыв чтобы заработать больше очков',
								actionText: 'Добавить отзыв',
								action: openAddReview,
						  }
						: undefined
			  ));

		if (res.success) {
			const updatedGoal = {
				addedByUser: operation !== 'delete',
				completedByUser: operation === 'mark' ? !done : false,
				totalAdded: res.data.totalAdded,
				totalCompleted: res.data.totalCompleted,
			};

			setGoal({...goal, ...updatedGoal});

			// Прогресс заданий обновляется автоматически на бэкенде
		}
	};

	const handleGoalUpdated = (updatedGoal: IGoal) => {
		setGoal({...goal, ...updatedGoal});
		setHeader('transparent');
		setIsEditing(false);
	};

	const handleCancelEdit = () => {
		setHeader('transparent');
		setIsEditing(false);
	};

	const handleGoalCompleted = () => {
		// Обновляем состояние цели как выполненной
		if (goal) {
			setGoal({
				...goal,
				completedByUser: true,
			});
		}
	};

	// Обработчики для модалки регулярных целей
	const handleRegularModalClose = () => {
		setShowRegularModal(false);
		setRegularGoalData(null);
	};

	const handleRegularGoalSave = async (settings: any) => {
		if (!goal) return;

		setIsRegularLoading(true);
		try {
			const response = await addRegularGoalToUser(goal.code, {
				goal_code: goal.code,
				...settings,
			});

			if (response.success) {
				// Обновляем состояние цели как добавленной
				const updatedGoal = {
					...goal,
					addedByUser: true,
					totalAdded: (goal.totalAdded || 0) + 1,
				};
				setGoal(updatedGoal);

				NotificationStore.addNotification({
					type: 'success',
					title: 'Успех',
					message: 'Регулярная цель успешно добавлена с вашими настройками!',
				});

				setShowRegularModal(false);
				setRegularGoalData(null);
			} else {
				throw new Error(response.error || 'Ошибка при добавлении регулярной цели');
			}
		} catch (error) {
			NotificationStore.addNotification({
				type: 'error',
				title: 'Ошибка',
				message: error instanceof Error ? error.message : 'Не удалось добавить регулярную цель',
			});
		} finally {
			setIsRegularLoading(false);
		}
	};

	const [shrink, setShrink] = useState(false);
	const [headerHeight, setHeaderHeight] = useState<number>(340);

	const updateHeaderHeight = () => {
		if (headerRef.current) {
			setHeaderHeight(headerRef.current.offsetHeight);
		} else {
			setHeaderHeight(isScreenMobile || isScreenSmallTablet ? 340 : 340);
		}
	};

	useEffect(() => {
		if ((headerRef?.current?.offsetHeight || 0) > headerHeight) {
			updateHeaderHeight();
		}
	}, [shrink, isScreenMobile, isScreenSmallTablet]);

	useEffect(() => {
		const handleScroll = () => {
			const isMobile = isScreenMobile;
			const headerH = headerRef.current?.offsetHeight || (isMobile ? 480 : 340);
			const threshold = isMobile ? headerH * 0.8 : 160;

			if (isMobile) {
				if (shrink) {
					if (window.scrollY < headerHeight - (headerRef.current?.offsetHeight || 0)) {
						setShrink(false);
					}
				} else if (window.scrollY > headerHeight - 128) {
					setShrink(true);
				}
			} else if (window.scrollY > threshold) {
				setShrink(true);
			} else {
				setShrink(false);
			}
		};

		setTimeout(() => {
			handleScroll();
		}, 100);

		window.addEventListener('scroll', handleScroll);
		return () => window.removeEventListener('scroll', handleScroll);
	}, [isScreenMobile, shrink]);

	if (isEditing && goal) {
		return (
			<main className={block({editing: true})}>
				<EditGoal goal={goal} onGoalUpdated={handleGoalUpdated} cancelEdit={handleCancelEdit} />
			</main>
		);
	}

	if (!goal) {
		return <Loader isLoading={isLoading} />;
	}

	return (
		<main className={block()}>
			<HeaderGoal
				ref={headerRef}
				title={goal.title}
				category={goal.category}
				image={goal.image}
				background={goal.image}
				goal={goal}
				shrink={shrink}
				onImageLoad={updateHeaderHeight}
			/>
			<section
				className={element('wrapper')}
				style={{
					paddingTop: isScreenMobile ? headerHeight : 0,
				}}
			>
				<AsideGoal
					className={element('aside', {shrink})}
					title={goal.title}
					image={goal.image || ''}
					added={goal.addedByUser}
					updateGoal={updateGoal}
					code={goal.code}
					goalId={goal.id}
					done={goal.completedByUser}
					openAddReview={openAddReview}
					editGoal={goal.createdByUser && goal.isCanEdit ? () => setIsEditing(true) : undefined}
					canEdit={goal?.isCanEdit}
					location={goal?.location}
					onGoalCompleted={handleGoalCompleted}
					userFolders={goal.userFolders}
					regularConfig={goal.regularConfig}
				/>
				<div className={element('content-wrapper')}>
					<ContentGoal page={page} goal={goal} className={element('content')} />
				</div>
			</section>
			<ScrollToTop />

			{/* Модалка настройки регулярности */}
			{(() => {
				const shouldShow = showRegularModal && regularGoalData?.regular_settings;
				console.log('🎭 Проверка рендера модалки:', {
					showRegularModal,
					hasRegularSettings: !!regularGoalData?.regular_settings,
					regularGoalData,
					shouldShow,
				});
				return shouldShow;
			})() && (
				<RegularGoalSettingsModal
					isOpen={showRegularModal}
					onClose={handleRegularModalClose}
					goalData={regularGoalData.goal}
					originalSettings={regularGoalData.regular_settings}
					onSave={handleRegularGoalSave}
					isLoading={isRegularLoading}
				/>
			)}
		</main>
	);
});

import {observer} from 'mobx-react-lite';
import {FC, useEffect, useRef, useState} from 'react';
import {useParams} from 'react-router-dom';

import {AsideGoal} from '@/components/AsideGoal/AsideGoal';
import {ContentGoal} from '@/components/ContentGoal/ContentGoal';
import {EditGoal} from '@/components/EditGoal/EditGoal';
import {HeaderGoal} from '@/components/HeaderGoal/HeaderGoal';
import {Loader} from '@/components/Loader/Loader';
import {ScrollToTop} from '@/components/ScrollToTop/ScrollToTop';
import {useBem} from '@/hooks/useBem';
import useScreenSize from '@/hooks/useScreenSize';
import {GoalStore} from '@/store/GoalStore';
import {ModalStore} from '@/store/ModalStore';
import {ThemeStore} from '@/store/ThemeStore';
import {IGoal} from '@/typings/goal';
import {IPage} from '@/typings/page';
import {canEditGoal} from '@/utils/api/get/canEditGoal';
import {getGoal} from '@/utils/api/get/getGoal';
import {addGoal} from '@/utils/api/post/addGoal';
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

	const updateGoal = async (code: string, operation: 'add' | 'delete' | 'mark', done?: boolean): Promise<void> => {
		if (!goal) {
			return;
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
					done={goal.completedByUser}
					openAddReview={openAddReview}
					editGoal={goal.createdByUser && goal.isCanEdit ? () => setIsEditing(true) : undefined}
					canEdit={goal?.isCanEdit}
					location={goal?.location}
				/>
				<ContentGoal page={page} goal={goal} className={element('content')} />
			</section>
			<ScrollToTop />
		</main>
	);
});

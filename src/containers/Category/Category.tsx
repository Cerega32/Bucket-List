import {FC, useEffect, useRef, useState} from 'react';
import {useParams, useSearchParams} from 'react-router-dom';
import {scroller} from 'react-scroll';

import {AllCategories} from '@/components/AllCategories/AllCategories';
import {Button} from '@/components/Button/Button';
import {Card} from '@/components/Card/Card';
import {CatalogItems} from '@/components/CatalogItems/CatalogItems';
import {HeaderCategory} from '@/components/HeaderCategory/HeaderCategory';
import {Loader} from '@/components/Loader/Loader';
import {RegularGoalSettingsModal} from '@/components/RegularGoalSettingsModal/RegularGoalSettingsModal';
import {Title} from '@/components/Title/Title';
import {useBem} from '@/hooks/useBem';
import {NotificationStore} from '@/store/NotificationStore';
import {ICategoryDetailed, ICategoryWithSubcategories, IGoal} from '@/typings/goal';
import {IList} from '@/typings/list';
import {IPage} from '@/typings/page';
import {getCategories} from '@/utils/api/get/getCategories';
import {getCategory} from '@/utils/api/get/getCategory';
import {getPopularGoals} from '@/utils/api/get/getPopularGoals';
import {getPopularLists} from '@/utils/api/get/getPopularLists';
import {getRegularGoalSettings} from '@/utils/api/get/getRegularGoalSettings';
import {addGoal} from '@/utils/api/post/addGoal';
import {addListGoal} from '@/utils/api/post/addListGoal';
import {addRegularGoalToUser, RegularGoalSettings} from '@/utils/api/post/addRegularGoalToUser';
import {markGoal} from '@/utils/api/post/markGoal';
import {removeGoal} from '@/utils/api/post/removeGoal';
import {removeListGoal} from '@/utils/api/post/removeListGoal';

import './category.scss';

export const Category: FC<IPage> = ({subPage, page}) => {
	const [block, element] = useBem('category');

	const [category, setCategory] = useState<ICategoryWithSubcategories | null>(null);
	const [popularGoals, setPopularGoals] = useState<Array<IGoal>>([]);
	const [popularLists, setPopularLists] = useState<Array<IList>>([]);
	const [categories, setCategories] = useState<Array<ICategoryDetailed>>([]);
	const [isLoading, setIsLoading] = useState(true);
	const refTitle = useRef<HTMLElement>(null);

	// Состояния для модалки регулярных целей
	const [showRegularModal, setShowRegularModal] = useState(false);
	const [regularGoalData, setRegularGoalData] = useState<any>(null);
	const [pendingGoalIndex, setPendingGoalIndex] = useState<number | null>(null);
	const [isRegularLoading, setIsRegularLoading] = useState(false);

	const {id} = useParams();
	const [searchParams] = useSearchParams();
	const searchQuery = searchParams.get('search') || '';

	useEffect(() => {
		// Скроллим к каталогу при наличии поискового запроса
		if (searchQuery && !id) {
			// Добавляем небольшую задержку для загрузки страницы
			setTimeout(() => {
				scroller.scrollTo('catalog-items-goals', {
					duration: 800,
					delay: 100,
					smooth: 'easeInOutQuart',
					offset: -150,
				});
			}, 500);
		}
	}, [searchQuery, id]);

	useEffect(() => {
		(async () => {
			setIsLoading(true);

			const promises = [];

			if (!id) {
				promises.push(getCategories());
			} else {
				promises.push(getCategory(id));
			}

			promises.push(getPopularGoals(id || 'all'));
			promises.push(getPopularLists(id || 'all'));

			const [categoriesRes, goalsRes, listsRes] = await Promise.all(promises);

			if (!id && categoriesRes.success) {
				setCategories(categoriesRes.data);
			} else if (id && categoriesRes.success) {
				setCategory(categoriesRes.data);
			}

			if (goalsRes.success) {
				setPopularGoals(goalsRes.data);
			}

			if (listsRes.success) {
				setPopularLists(listsRes.data);
			}

			setIsLoading(false);
		})();
	}, [id]);

	const updateGoal = async (code: string, i: number, operation: 'add' | 'delete' | 'mark', done?: boolean): Promise<void> => {
		// Специальная обработка для добавления цели - проверяем на регулярность
		if (operation === 'add') {
			try {
				// Проверяем, является ли цель регулярной
				const regularSettings = await getRegularGoalSettings(code);

				if (regularSettings.success && regularSettings.data) {
					// Если настройки можно изменить, показываем модалку
					if (regularSettings.data.regular_settings?.allowCustomSettings) {
						setRegularGoalData(regularSettings.data);
						setPendingGoalIndex(i); // Запоминаем индекс цели для последующего обновления
						setShowRegularModal(true);
						return; // Выходим из функции, добавление будет происходить в модалке
					}
					// Если настройки нельзя изменить, добавляем с базовыми настройками
					const response = await addRegularGoalToUser(code, {
						frequency: regularSettings.data.regular_settings.frequency,
						weeklyFrequency: regularSettings.data.regular_settings.weeklyFrequency,
						durationType: regularSettings.data.regular_settings.durationType,
						durationValue: regularSettings.data.regular_settings.durationValue,
						endDate: regularSettings.data.regular_settings.endDate || undefined,
						resetOnSkip: regularSettings.data.regular_settings.resetOnSkip,
						allowSkipDays: regularSettings.data.regular_settings.allowSkipDays,
					});

					if (response.success) {
						const updatedGoal = {
							...popularGoals[i],
							addedByUser: true,
							totalAdded: (popularGoals[i].totalAdded || 0) + 1,
						};
						const newGoals = [...popularGoals];
						newGoals[i] = updatedGoal;
						setPopularGoals(newGoals);
						NotificationStore.addNotification({
							type: 'success',
							title: 'Успех',
							message: 'Регулярная цель успешно добавлена!',
						});
						return;
					}
				}
			} catch (error) {
				// Если API регулярности не отвечает или цель не регулярная, продолжаем обычное добавление
				console.log('Цель не является регулярной или ошибка API');
			}
		}

		const res = await (operation === 'add' ? addGoal(code) : operation === 'delete' ? removeGoal(code) : markGoal(code, !done));

		if (res.success && popularGoals) {
			const updatedGoal = {
				...popularGoals[i],
				addedByUser: operation !== 'delete',
				completedByUser: operation === 'mark' ? !done : popularGoals[i].completedByUser,
				totalAdded: res.data.users_added_count,
			};

			const newGoals = [...popularGoals];
			newGoals[i] = updatedGoal;

			setPopularGoals(newGoals);
		}
	};

	const updateList = async (code: string, i: number, operation: 'add' | 'delete'): Promise<void> => {
		const res = await (operation === 'add' ? addListGoal(code) : removeListGoal(code));

		if (res.success) {
			const updatedList = {
				...popularLists[i],
				addedByUser: operation === 'add',
				totalAdded: res.data.users_added_count,
			};

			const newLists = [...popularLists];
			newLists[i] = updatedList;

			setPopularLists(newLists);
		}
	};

	// Обработчики для модалки регулярных целей
	const handleRegularModalClose = () => {
		setShowRegularModal(false);
		setRegularGoalData(null);
		setPendingGoalIndex(null);
	};

	const handleRegularGoalSave = async (settings: RegularGoalSettings) => {
		if (!regularGoalData?.goal || pendingGoalIndex === null) return;

		setIsRegularLoading(true);
		try {
			// Явно передаем все поля, включая customSchedule
			const requestData: RegularGoalSettings = {
				frequency: settings.frequency,
				durationType: settings.durationType,
				allowSkipDays: settings.allowSkipDays,
				resetOnSkip: settings.resetOnSkip,
				...(settings.frequency === 'weekly' && settings.weeklyFrequency !== undefined
					? {weeklyFrequency: settings.weeklyFrequency}
					: {}),
				...(settings.frequency === 'custom' && settings.customSchedule !== undefined
					? {customSchedule: settings.customSchedule}
					: {}),
				...(settings.durationType === 'days' || settings.durationType === 'weeks'
					? settings.durationValue !== undefined
						? {durationValue: settings.durationValue}
						: {}
					: {}),
				...(settings.durationType === 'until_date' && settings.endDate !== undefined ? {endDate: settings.endDate} : {}),
			};

			const response = await addRegularGoalToUser(regularGoalData.goal.code, requestData);

			if (response.success) {
				// Обновляем состояние цели как добавленной
				const updatedGoal = {
					...popularGoals[pendingGoalIndex],
					addedByUser: true,
					totalAdded: (popularGoals[pendingGoalIndex].totalAdded || 0) + 1,
				};

				const newGoals = [...popularGoals];
				newGoals[pendingGoalIndex] = updatedGoal;
				setPopularGoals(newGoals);

				NotificationStore.addNotification({
					type: 'success',
					title: 'Успех',
					message: 'Регулярная цель успешно добавлена с вашими настройками!',
				});

				setShowRegularModal(false);
				setRegularGoalData(null);
				setPendingGoalIndex(null);
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

	return (
		<main className={block({sub: page === 'isSubCategories', empty: !category?.subcategories.length, all: !id})}>
			{id && id !== 'all' && category && (
				<HeaderCategory category={category} className={element('header')} isSub={page === 'isSubCategories'} refHeader={refTitle} />
			)}
			<Loader isLoading={isLoading}>
				{!!popularGoals.length && (
					<>
						<div className={element('wrapper-title')}>
							<Title tag="h2">Популярные цели этой недели</Title>
							<Button
								type="Link"
								theme="blue"
								icon="plus"
								href={`/goals/create${id && id !== 'all' ? `?category=${id}` : ''}`}
								size="small"
							>
								Добавить цель
							</Button>
						</div>

						<section className={element('popular-goals')}>
							{popularGoals.map((goal, i) => (
								<Card
									goal={goal}
									className={element('popular-goal')}
									key={goal.code}
									onClickAdd={() => updateGoal(goal.code, i, 'add')}
									onClickDelete={() => updateGoal(goal.code, i, 'delete')}
									onClickMark={() => updateGoal(goal.code, i, 'mark', goal.completedByUser)}
								/>
							))}
						</section>
					</>
				)}
				{!!popularLists.length && (
					<>
						<div className={element('wrapper-title')}>
							<Title tag="h2">Популярные списки этой недели</Title>
							<Button
								type="Link"
								theme="blue"
								icon="plus"
								href={`/list/create${id && id !== 'all' ? `?category=${id}` : ''}`}
								size="small"
							>
								Добавить список целей
							</Button>
						</div>
						<section className={element('popular-lists')}>
							{popularLists.map((list, i) => (
								<Card
									horizontal
									isList
									goal={list}
									className={element('popular-list')}
									key={list.code}
									onClickAdd={() => updateList(list.code, i, 'add')}
									onClickDelete={() => updateList(list.code, i, 'delete')}
								/>
							))}
						</section>
					</>
				)}

				<Title className={element('title')} tag="h2">
					Все цели и списки
				</Title>
				<CatalogItems
					code={id || 'all'}
					className={element('all-goals')}
					subPage={subPage}
					category={category}
					beginUrl={id ? '/categories/' : '/categories/all'}
					categories={categories}
					initialSearch={searchQuery}
				/>
				{!id && <AllCategories categories={categories} tag="h2" title="Категории" />}
			</Loader>

			{/* Модалка настройки регулярности */}
			{showRegularModal && regularGoalData?.regular_settings && (
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
};

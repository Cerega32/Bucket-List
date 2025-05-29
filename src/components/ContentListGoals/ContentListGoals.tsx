import {FC} from 'react';

import {useBem} from '@/hooks/useBem';
import {IList} from '@/typings/list';
import './content-list-goals.scss';

import {DescriptionWithLinks} from '../DescriptionWithLinks/DescriptionWithLinks';
import {InfoGoal} from '../InfoGoal/InfoGoal';
import {ListGoals} from '../ListGoals/ListGoals';
import {TitleWithTags} from '../TitleWithTags/TitleWithTags';

interface ContentListGoalsProps {
	className?: string;
	list: IList;
	updateGoal: (code: string, i: number, operation: 'add' | 'delete' | 'mark', done?: boolean) => Promise<void>;
}

export const ContentListGoals: FC<ContentListGoalsProps> = (props) => {
	const {className, list, updateGoal} = props;

	const [block, element] = useBem('content-list-goals', className);
	// const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
	// const [mapData, setMapData] = useState<MapData | null>(null);
	// const [isLoadingMap, setIsLoadingMap] = useState(false);

	// // Функция загрузки данных карты
	// const loadMapData = async () => {
	// 	try {
	// 		setIsLoadingMap(true);
	// 		const data = await mapApi.getGoalListMapData(list.code);
	// 		setMapData(data);
	// 	} catch (error) {
	// 		console.error('Error loading map data:', error);
	// 	} finally {
	// 		setIsLoadingMap(false);
	// 	}
	// };

	// // Загружаем данные карты при переключении на карту
	// useEffect(() => {
	// 	if (viewMode === 'map' && !mapData) {
	// 		loadMapData();
	// 	}
	// }, [viewMode]);

	// const handleLocationVisit = async (locationId: number, goalId?: number) => {
	// 	try {
	// 		await mapApi.markLocationVisited(locationId, goalId);
	// 		// Перезагружаем данные карты
	// 		await loadMapData();
	// 	} catch (error) {
	// 		console.error('Error marking location as visited:', error);
	// 	}
	// };

	// const handleLocationUnvisit = async (locationId: number) => {
	// 	try {
	// 		await mapApi.unmarkLocationVisited(locationId);
	// 		// Перезагружаем данные карты
	// 		await loadMapData();
	// 	} catch (error) {
	// 		console.error('Error unmarking location as visited:', error);
	// 	}
	// };

	// // Проверяем, есть ли цели с местами
	// const hasGoalsWithLocations = list.goals.some((goal) => goal.location);

	return (
		<article className={block()}>
			<TitleWithTags
				title={list.title}
				category={list.category}
				complexity={list.complexity}
				className={element('title')}
				totalCompleted={list.totalCompleted}
				isList
				theme="light"
			/>
			<DescriptionWithLinks isList goal={list} className={element('description')} />
			{list.addedByUser && (
				<InfoGoal
					className={element('info')}
					items={[
						{title: 'Всего целей', value: list.goalsCount},
						{title: 'Выполнено', value: list.userCompletedGoals},
					]}
					progress
					horizontal
					progressData={{
						completed: list.userCompletedGoals,
						total: list.goalsCount,
					}}
				/>
			)}

			{/* Переключатель между списком и картой */}
			{/* {hasGoalsWithLocations && (
				<div className={element('view-toggle')}>
					<button
						type="button"
						className={element('toggle-btn', {active: viewMode === 'list'})}
						onClick={() => setViewMode('list')}
					>
						Список целей
					</button>
					<button
						type="button"
						className={element('toggle-btn', {active: viewMode === 'map'})}
						onClick={() => setViewMode('map')}
					>
						Карта мест
					</button>
				</div>
			)} */}

			{/* Отображение списка или карты */}
			{/* {viewMode === 'list' ? ( */}
			<ListGoals list={list.goals} updateGoal={updateGoal} columns="three" />
			{/* ) : (
				<div className={element('map-container')}>
					{isLoadingMap ? (
						<div className={element('map-loading')}>Загрузка карты...</div>
					) : mapData && mapData.goals.length > 0 ? (
						<Map
							goals={mapData.goals}
							visitedLocations={mapData.visited_locations}
							onLocationVisit={handleLocationVisit}
							onLocationUnvisit={handleLocationUnvisit}
							height="500px"
						/>
					) : (
						<div className={element('map-empty')}>
							<p>В этом списке нет целей с географическими местами</p>
						</div>
					)}
				</div>
			)} */}
		</article>
	);
};

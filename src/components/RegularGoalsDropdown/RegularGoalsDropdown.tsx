import {observer} from 'mobx-react-lite';
import {FC, useEffect, useRef, useState} from 'react';
import {Link} from 'react-router-dom';

import {useBem} from '@/hooks/useBem';
import {HeaderRegularGoalsStore} from '@/store/HeaderRegularGoalsStore';
import {IRegularGoalStatistics} from '@/typings/goal';
import {getRegularGoalStatistics, markRegularProgress} from '@/utils/api/goals';

import {RegularGoalCompactCard} from './RegularGoalCompactCard';
import {Button} from '../Button/Button';
import {EmptyState} from '../EmptyState/EmptyState';
import {BlurLoader} from '../Loader/BlurLoader';
import './regular-goals-dropdown.scss';

interface RegularGoalsDropdownProps {
	isOpen: boolean;
	onClose: () => void;
}

export const RegularGoalsDropdown: FC<RegularGoalsDropdownProps> = observer(({isOpen, onClose}) => {
	const [block, element] = useBem('regular-goals-dropdown');
	const dropdownRef = useRef<HTMLDivElement>(null);
	const [regularGoals, setRegularGoals] = useState<IRegularGoalStatistics[]>([]);
	const [loading, setLoading] = useState(true);

	// Загрузка регулярных целей
	useEffect(() => {
		const loadRegularGoals = async () => {
			if (!isOpen) return;

			setLoading(true);
			try {
				const response = await getRegularGoalStatistics();
				if (response.success && response.data) {
					const statistics = Array.isArray(response.data) ? response.data : response.data.data;
					const forToday = statistics
						.filter((stat) => stat.isActive && (stat.canCompleteToday || stat.currentPeriodProgress?.completedToday === true))
						.sort((a, b) => {
							const aDone = a.currentPeriodProgress?.completedToday === true;
							const bDone = b.currentPeriodProgress?.completedToday === true;
							if (aDone === bDone) return 0;
							return aDone ? 1 : -1; // сначала невыполненные, затем выполненные
						});
					setRegularGoals(forToday);
					const completedCount = forToday.filter((s) => s.currentPeriodProgress?.completedToday === true).length;
					HeaderRegularGoalsStore.setTodayStats(forToday.length, completedCount);
				}
			} catch (error) {
				console.error('Ошибка загрузки регулярных целей:', error);
			} finally {
				setLoading(false);
			}
		};

		loadRegularGoals();
	}, [isOpen]);

	// Закрываем при клике вне компонента
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
				onClose();
			}
		};

		if (isOpen) {
			document.addEventListener('mousedown', handleClickOutside);
		}

		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, [isOpen, onClose]);

	const handleQuickComplete = async (regularGoalId: number) => {
		setLoading(true);
		try {
			const response = await markRegularProgress({
				regular_goal_id: regularGoalId,
			});

			if (response.success) {
				const updatedResponse = await getRegularGoalStatistics();
				if (updatedResponse.success && updatedResponse.data) {
					const statistics = Array.isArray(updatedResponse.data) ? updatedResponse.data : updatedResponse.data.data;
					const forToday = statistics
						.filter((stat) => stat.isActive && (stat.canCompleteToday || stat.currentPeriodProgress?.completedToday === true))
						.sort((a, b) => {
							const aDone = a.currentPeriodProgress?.completedToday === true;
							const bDone = b.currentPeriodProgress?.completedToday === true;
							if (aDone === bDone) return 0;
							return aDone ? 1 : -1;
						});
					setRegularGoals(forToday);
					const completedCount = forToday.filter((s) => s.currentPeriodProgress?.completedToday === true).length;
					HeaderRegularGoalsStore.setTodayStats(forToday.length, completedCount);
				}
			}
		} catch (error) {
			console.error('Ошибка отметки регулярной цели:', error);
		} finally {
			setLoading(false);
		}
	};

	if (!isOpen) return null;

	return (
		<div ref={dropdownRef} className={block()}>
			<div className={element('content')}>
				<BlurLoader active={loading} className={element('loader')}>
					{regularGoals.length === 0 ? (
						<EmptyState title="Нет регулярных целей на сегодня" size="small" className={element('empty')} />
					) : (
						<div className={element('list')}>
							{regularGoals.map((statistics) => (
								<RegularGoalCompactCard
									key={statistics.id}
									statistics={statistics}
									onQuickComplete={() => handleQuickComplete(statistics.regularGoal)}
								/>
							))}
						</div>
					)}
				</BlurLoader>
			</div>

			<div className={element('footer')}>
				<Link to="/user/self/regular" onClick={onClose}>
					<Button theme="blue-light" className={element('view-all')}>
						Перейти в регулярные цели
					</Button>
				</Link>
			</div>
		</div>
	);
});

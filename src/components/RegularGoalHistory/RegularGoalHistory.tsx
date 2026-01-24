import {observer} from 'mobx-react-lite';
import {FC, useEffect, useState} from 'react';

import {EmptyState} from '@/components/EmptyState/EmptyState';
import {Loader} from '@/components/Loader/Loader';
import {RegularHistoryItem} from '@/components/RegularHistoryItem/RegularHistoryItem';
import {useBem} from '@/hooks/useBem';
import {IRegularGoalHistory} from '@/typings/goal';
import {getRegularGoalHistory} from '@/utils/api/goals';

import './regular-goal-history.scss';

interface RegularGoalHistoryProps {
	className?: string;
	regularGoalId: number;
	refreshTrigger?: number; // Триггер для принудительного обновления истории
	allowCustomSettings?: boolean; // Разрешены ли пользовательские настройки
}

export const RegularGoalHistory: FC<RegularGoalHistoryProps> = observer(
	({className, regularGoalId, refreshTrigger, allowCustomSettings}) => {
		const [block, element] = useBem('regular-goal-history', className);
		const [history, setHistory] = useState<IRegularGoalHistory[]>([]);
		const [isLoading, setIsLoading] = useState(true);

		useEffect(() => {
			const loadHistory = async () => {
				setIsLoading(true);
				try {
					const response = await getRegularGoalHistory(regularGoalId);
					// GET возвращает: { success: true, data: <ответ сервера> }
					// Сервер возвращает: { success: true, data: { history: [...], count: ... } }
					// После GET: response.data = { success: true, data: { history: [...], count: ... } }
					// Итого: response.data.data.history
					if (response.success && response.data) {
						// Проверяем структуру ответа
						let historyArray: IRegularGoalHistory[] = [];

						// Если response.data содержит data.history (вложенная структура от сервера)
						if (
							(response.data as any).data &&
							(response.data as any).data.history &&
							Array.isArray((response.data as any).data.history)
						) {
							historyArray = (response.data as any).data.history;
						}
						// Если response.data уже содержит history напрямую (fallback)
						else if (Array.isArray((response.data as any).history)) {
							historyArray = (response.data as any).history;
						}
						// Если response.data сам по себе массив (fallback)
						else if (Array.isArray(response.data)) {
							historyArray = response.data;
						}
						setHistory(historyArray); // Устанавливаем массив, даже если он пустой (для правильного отображения EmptyState)
					}
				} catch (error) {
					console.error('Ошибка загрузки истории:', error);
				} finally {
					setIsLoading(false);
				}
			};

			if (regularGoalId) {
				loadHistory();
			}
		}, [regularGoalId, refreshTrigger]); // Добавляем refreshTrigger в зависимости

		if (isLoading) {
			return (
				<div className={block()}>
					<Loader isLoading={isLoading} />
				</div>
			);
		}

		if (history.length === 0) {
			return (
				<div className={block()}>
					<EmptyState
						title="История выполнения пуста"
						description="История завершенных и прерванных серий выполнения появится здесь после первой прерванной или завершенной серии."
					/>
				</div>
			);
		}

		return (
			<div className={block()}>
				<div className={element('grid')}>
					{history.map((item) => (
						<RegularHistoryItem key={item.id} history={item} allowCustomSettings={allowCustomSettings} />
					))}
				</div>
			</div>
		);
	}
);

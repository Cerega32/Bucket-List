import {useEffect, useState} from 'react';

import {getGoalTimer, TimerInfo} from '@/entities/goal/api/getGoalTimer';

interface UseGoalTimerParams {
	code: string;
	isAdded: boolean;
	isList: boolean;
}

interface UseGoalTimerReturn {
	timer: TimerInfo | null;
	handleTimerUpdate: (updatedTimer: TimerInfo | null) => void;
}

/** Загрузка и локальное состояние таймера цели (не применимо к спискам) */
export const useGoalTimer = (params: UseGoalTimerParams): UseGoalTimerReturn => {
	const {code, isAdded, isList} = params;
	const [timer, setTimer] = useState<TimerInfo | null>(null);

	useEffect(() => {
		const loadTimer = async () => {
			if (isAdded && !isList) {
				const response = await getGoalTimer(code);
				if (response.success && response.data?.timer) {
					setTimer(response.data.timer);
				} else {
					setTimer(null);
				}
			}
		};

		loadTimer();
	}, [code, isAdded, isList]);

	const handleTimerUpdate = (updatedTimer: TimerInfo | null) => {
		setTimer(updatedTimer);
	};

	return {timer, handleTimerUpdate};
};

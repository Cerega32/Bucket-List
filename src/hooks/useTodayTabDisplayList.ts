import {useCallback, useEffect, useRef, useState} from 'react';

export const TODAY_TAB_HIDE_DELAY_MS = 10000;

type ActiveTab = 'today' | 'all';

interface UseTodayTabDisplayListParams<T> {
	activeTab: ActiveTab;
	isSourceReady: boolean;
	buildPendingItems: () => T[];
	getItemId: (item: T) => number;
	hideDelayMs?: number;
}

export const useTodayTabDisplayList = <T>({
	activeTab,
	isSourceReady,
	buildPendingItems,
	getItemId,
	hideDelayMs = TODAY_TAB_HIDE_DELAY_MS,
}: UseTodayTabDisplayListParams<T>) => {
	const [displayItems, setDisplayItems] = useState<T[]>([]);
	const hideTimeoutsRef = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

	const upsertItem = useCallback(
		(item: T) => {
			setDisplayItems((prev) => {
				const id = getItemId(item);
				const index = prev.findIndex((entry) => getItemId(entry) === id);
				if (index === -1) {
					return [...prev, item];
				}

				const next = [...prev];
				next[index] = item;
				return next;
			});
		},
		[getItemId]
	);

	const scheduleRemoveItem = useCallback(
		(id: number) => {
			const existingTimeout = hideTimeoutsRef.current.get(id);
			if (existingTimeout) {
				clearTimeout(existingTimeout);
			}

			const timeoutId = setTimeout(() => {
				hideTimeoutsRef.current.delete(id);
				setDisplayItems((prev) => prev.filter((entry) => getItemId(entry) !== id));
			}, hideDelayMs);

			hideTimeoutsRef.current.set(id, timeoutId);
		},
		[getItemId, hideDelayMs]
	);

	const cancelRemoveItem = useCallback((id: number) => {
		const existingTimeout = hideTimeoutsRef.current.get(id);
		if (existingTimeout) {
			clearTimeout(existingTimeout);
			hideTimeoutsRef.current.delete(id);
		}
	}, []);

	const applyMarkedItem = useCallback(
		(originalItem: T, markedItem: T) => {
			if (activeTab !== 'today') {
				return;
			}

			upsertItem(markedItem);
			scheduleRemoveItem(getItemId(originalItem));
		},
		[activeTab, upsertItem, scheduleRemoveItem, getItemId]
	);

	const applyUnmarkedItem = useCallback(
		(item: T) => {
			if (activeTab !== 'today') {
				return;
			}

			cancelRemoveItem(getItemId(item));
			upsertItem(item);
		},
		[activeTab, cancelRemoveItem, upsertItem, getItemId]
	);

	const revertMarkedItem = useCallback(
		(item: T) => {
			if (activeTab !== 'today') {
				return;
			}

			cancelRemoveItem(getItemId(item));
			upsertItem(item);
		},
		[activeTab, cancelRemoveItem, upsertItem, getItemId]
	);

	const markAllItems = useCallback(
		(items: T[], toMarked: (item: T) => T) => {
			if (activeTab !== 'today') {
				return;
			}

			setDisplayItems((prev) =>
				prev.map((entry) => {
					const source = items.find((item) => getItemId(item) === getItemId(entry));
					return source ? toMarked(source) : entry;
				})
			);
			items.forEach((item) => scheduleRemoveItem(getItemId(item)));
		},
		[activeTab, getItemId, scheduleRemoveItem]
	);

	const unmarkAllItems = useCallback(
		(items: T[]) => {
			if (activeTab !== 'today') {
				return;
			}

			items.forEach((item) => cancelRemoveItem(getItemId(item)));
		},
		[activeTab, cancelRemoveItem, getItemId]
	);

	useEffect(() => {
		return () => {
			hideTimeoutsRef.current.forEach((timeoutId) => clearTimeout(timeoutId));
			hideTimeoutsRef.current.clear();
		};
	}, []);

	useEffect(() => {
		if (activeTab !== 'today') {
			return;
		}

		setDisplayItems(buildPendingItems());
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [activeTab]);

	useEffect(() => {
		if (activeTab === 'today' && isSourceReady) {
			setDisplayItems((prev) => (prev.length === 0 ? buildPendingItems() : prev));
		}
	}, [activeTab, isSourceReady, buildPendingItems]);

	const pendingCount = buildPendingItems().length;
	const todayTabCount = activeTab === 'today' ? displayItems.length : pendingCount;

	return {
		displayItems,
		pendingCount,
		todayTabCount,
		upsertItem,
		applyMarkedItem,
		applyUnmarkedItem,
		revertMarkedItem,
		markAllItems,
		unmarkAllItems,
	};
};

import {FC, useCallback, useEffect, useState} from 'react';

import {getSimilarGoals} from '@/entities/goal/api/getSimilarGoals';
import {createMergeRequest} from '@/entities/goal/api/goals';
import {IGoal} from '@/entities/goal/model/types';
import {SimilarGoalItem} from '@/entities/goal/ui/SimilarGoalItem/SimilarGoalItem';
import {useBem} from '@/shared/lib/hooks/useBem';
import {debounce} from '@/shared/lib/time/debounce';
import {Button} from '@/shared/ui/Button/Button';
import {FieldInput} from '@/shared/ui/FieldInput/FieldInput';
import {Modal} from '@/shared/ui/Modal/Modal';
import {Svg} from '@/shared/ui/Svg/Svg';
import {Title} from '@/shared/ui/Title/Title';

import '@/features/goal-merge-request/goal-merge-request-modal.scss';

interface GoalMergeRequestModalProps {
	isOpen: boolean;
	onClose: () => void;
	sourceGoalCode: string;
	sourceGoalTitle: string;
	sourceGoalImage?: string | null;
	sourceGoalIsRegular?: boolean;
}

export const GoalMergeRequestModal: FC<GoalMergeRequestModalProps> = (props) => {
	const {isOpen, onClose, sourceGoalCode, sourceGoalTitle, sourceGoalImage, sourceGoalIsRegular} = props;
	const [block, element] = useBem('goal-merge-request-modal');

	const [query, setQuery] = useState('');
	const [searchResults, setSearchResults] = useState<IGoal[]>([]);
	const [isSearching, setIsSearching] = useState(false);
	const [selectedGoal, setSelectedGoal] = useState<IGoal | null>(null);
	const [reason, setReason] = useState('');
	const [isSubmitting, setIsSubmitting] = useState(false);

	useEffect(() => {
		if (!isOpen) {
			setQuery('');
			setSearchResults([]);
			setSelectedGoal(null);
			setReason('');
			setIsSubmitting(false);
		}
	}, [isOpen]);

	// eslint-disable-next-line react-hooks/exhaustive-deps
	const debouncedSearch = useCallback(
		debounce(async (value: string) => {
			if (value.length < 3) {
				setSearchResults([]);
				setIsSearching(false);
				return;
			}
			try {
				const response = await getSimilarGoals(value);
				if (response.success && response.data?.results) {
					setSearchResults(response.data.results.filter((goal) => goal.code !== sourceGoalCode).slice(0, 8));
				}
			} finally {
				setIsSearching(false);
			}
		}, 500),
		[sourceGoalCode]
	);

	const handleQueryChange = (value: string) => {
		setQuery(value);
		setIsSearching(value.length >= 3);
		debouncedSearch(value);
	};

	const handleSubmit = async () => {
		if (!selectedGoal || isSubmitting) return;
		setIsSubmitting(true);
		const response = await createMergeRequest({
			source_goal_code: sourceGoalCode,
			target_goal_code: selectedGoal.code,
			reason,
		});
		setIsSubmitting(false);
		if (response.success) {
			onClose();
		}
	};

	if (!isOpen) return null;

	// Предупреждаем только если одна цель регулярная, а другая обычная
	const regularityMismatch = selectedGoal ? !!sourceGoalIsRegular !== !!selectedGoal.regularConfig : false;
	const regularGoalTitle = sourceGoalIsRegular ? sourceGoalTitle : selectedGoal?.title;
	const usualGoalTitle = sourceGoalIsRegular ? selectedGoal?.title : sourceGoalTitle;

	return (
		<Modal isOpen={isOpen} onClose={onClose} className="goal-merge-request-modal-wrapper" size="medium">
			<div className={block()}>
				<Title tag="h2" className={element('title')}>
					Объединение похожих целей
				</Title>

				{!selectedGoal ? (
					<>
						<p className={element('description')}>
							Нашли цель, которая дублирует «{sourceGoalTitle}»? Найдите её и отправьте запрос на объединение — модераторы
							проверят и объединят цели, сохранив прогресс всех участников.
						</p>
						<FieldInput
							className={element('search')}
							id="merge-goal-search"
							placeholder="Введите не менее 3 символов"
							text="Название похожей цели"
							value={query}
							setValue={handleQueryChange}
							iconBegin="search"
						/>
						{isSearching && <p className={element('hint')}>Ищем похожие цели...</p>}
						{!isSearching && query.length >= 3 && searchResults.length === 0 && (
							<p className={element('hint')}>Похожие цели не найдены</p>
						)}
						{searchResults.length > 0 && (
							<div className={element('results')}>
								{searchResults.map((goal) => (
									<SimilarGoalItem key={goal.id} goal={goal} onSelect={setSelectedGoal} />
								))}
							</div>
						)}
					</>
				) : (
					<>
						<div className={element('compare')}>
							<div className={element('compare-item')}>
								{sourceGoalImage ? (
									<img src={sourceGoalImage} alt={sourceGoalTitle} className={element('compare-image')} />
								) : (
									<div className={element('compare-no-image')}>
										<Svg icon="mount" />
									</div>
								)}
								<span className={element('compare-title')}>{sourceGoalTitle}</span>
							</div>
							<p className={element('compare-separator')}>=</p>
							<div className={element('compare-item')}>
								{selectedGoal.image ? (
									<img src={selectedGoal.image} alt={selectedGoal.title} className={element('compare-image')} />
								) : (
									<div className={element('compare-no-image')}>
										<Svg icon="mount" />
									</div>
								)}
								<span className={element('compare-title')}>{selectedGoal.title}</span>
							</div>
						</div>
						{regularityMismatch && (
							<p className={element('warning')}>
								Обратите внимание: «{regularGoalTitle}» — регулярная цель, а «{usualGoalTitle}» — обычная. При объединении
								модератор решит, какой будет итоговая цель.
							</p>
						)}
						<p className={element('description')}>
							После проверки модератором цели будут объединены в одну: участники, впечатления и прогресс обеих целей
							сохранятся. За одобренный запрос вы получите опыт.
						</p>
						<FieldInput
							className={element('reason')}
							id="merge-reason"
							type="textarea"
							placeholder="Почему эти цели стоит объединить? (необязательно)"
							value={reason}
							setValue={setReason}
							maxLength={1000}
							rows={3}
						/>
						<div className={element('actions')}>
							<Button theme="blue-light" onClick={() => setSelectedGoal(null)} className={element('action-btn')}>
								Назад
							</Button>
							<Button theme="blue" onClick={handleSubmit} className={element('action-btn')} disabled={isSubmitting}>
								{isSubmitting ? 'Отправка...' : 'Отправить запрос'}
							</Button>
						</div>
					</>
				)}
			</div>
		</Modal>
	);
};

import React, {useEffect, useState} from 'react';

import {Svg} from '@/components/Svg/Svg';
import {useBem} from '@/hooks/useBem';
import {ICategory, IGoal} from '@/typings/goal';
import {getComplexity, selectComplexity} from '@/utils/values/complexity';

import {EditGoalFromList} from '../AddGoal/EditGoalFromList';

interface IGoalExtended {
	id: number | string;
	title: string;
	description: string;
	image?: string;
	shortDescription: string;
	complexity: string;
	category: ICategory;
	deadline?: string;
	estimatedTime?: string;
	isFromAutoParser?: boolean;
	originalSearchText?: string;
	autoParserData?: any;
	imageFile?: File;
}

interface GoalListItemProps {
	goal: IGoalExtended;
	onRemove: (goalId: number | string) => void;
	onEdit?: (goalId: number | string, editedGoal: any) => void;
	onStartEdit?: (goalId: number | string) => void;
	onCancelEdit?: () => void;
	isEditing?: boolean;
	isOtherEditing?: boolean;
	className?: string;
	preloadedCategories?: ICategory[];
	preloadedSubcategories?: ICategory[];
	initialCategory?: ICategory;
}

export const GoalListItem: React.FC<GoalListItemProps> = ({
	goal,
	onRemove,
	onEdit,
	onStartEdit,
	onCancelEdit,
	isEditing = false,
	isOtherEditing = false,
	className,
	preloadedCategories,
	preloadedSubcategories,
	initialCategory,
}) => {
	const [block, element] = useBem('goal-list-item', className);

	// Состояние для хранения текущих данных цели в режиме редактирования
	const [editingGoalData, setEditingGoalData] = useState<any>(null);

	// Инициализируем данные цели при входе в режим редактирования
	useEffect(() => {
		if (isEditing && goal.isFromAutoParser) {
			// Определяем индекс сложности
			const complexityIndex = selectComplexity.findIndex((item) => item.value === goal.complexity);

			setEditingGoalData({
				title: goal.title,
				description: goal.description,
				imageUrl: goal.image,
				estimatedTime: goal.estimatedTime,
				deadline: goal.deadline,
				complexity: complexityIndex !== -1 ? complexityIndex : 1,
				category: goal.category,
				// Сохраняем все дополнительные поля из autoParserData
				external_id: goal.autoParserData?.external_id || goal.autoParserData?.externalId,
				type: goal.autoParserData?.type || goal.autoParserData?.externalType,
				...Object.fromEntries(
					Object.entries(goal.autoParserData || {}).filter(
						([key]) =>
							!['title', 'description', 'imageUrl', 'estimatedTime', 'deadline', 'complexity', 'category'].includes(key)
					)
				),
			});
		}
	}, [isEditing, goal]);

	const getStatusInfo = () => {
		if (!goal.isFromAutoParser || !goal.autoParserData) {
			return null;
		}

		const {status} = goal.autoParserData;
		switch (status) {
			case 'existing':
				return {
					color: 'green',
					text: 'Существующая цель',
					icon: 'check',
				};
			case 'external':
				return {
					color: 'blue',
					text: `Найдена через ${goal.autoParserData.apiSource?.toUpperCase()}`,
					// icon: 'globe',
					icon: 'edit',
				};
			case 'created':
				return {
					color: 'orange',
					text: 'Новая цель',
					icon: 'plus',
				};
			case 'error':
				return {
					color: 'red',
					text: 'Ошибка',
					icon: 'exclamation',
				};
			default:
				return {
					color: 'gray',
					text: 'Неизвестный статус',
					icon: 'question',
				};
		}
	};

	const getConfidenceInfo = () => {
		if (!goal.isFromAutoParser || !goal.autoParserData?.confidence) {
			return null;
		}

		const confidence = goal.autoParserData.confidence * 100;
		if (confidence >= 90) return {color: 'green', text: 'Высокая'};
		if (confidence >= 70) return {color: 'orange', text: 'Средняя'};
		return {color: 'red', text: 'Низкая'};
	};

	// Обработчик успешного "создания" цели (на самом деле редактирования)
	const handleGoalCreated = (newGoal: IGoal & any) => {
		if (onEdit) {
			// Объединяем новые данные с дополнительными полями из editingGoalData
			const updatedGoal = {
				title: newGoal.title,
				description: newGoal.description,
				image: newGoal.image || newGoal.imageUrl || newGoal.imageFile,
				estimatedTime: newGoal.estimatedTime,
				deadline: newGoal.deadline,
				complexity: newGoal.complexity,
				category: newGoal.category,
				shortDescription: newGoal.description ? `${newGoal.description.substring(0, 100)}...` : goal.shortDescription,
				// Обновляем autoParserData с новыми данными
				autoParserData: {
					...newGoal.autoParserData,
					title: newGoal.title,
					description: newGoal.description,
					imageUrl: newGoal.image || newGoal.imageUrl,
					estimatedTime: newGoal.estimatedTime,
					deadline: newGoal.deadline,
					complexity: newGoal.complexity,
				},
			};

			onEdit(goal.id, updatedGoal);
		}
	};

	const statusInfo = getStatusInfo();
	const confidenceInfo = getConfidenceInfo();

	// Если цель редактируется
	if (isEditing && goal.isFromAutoParser && editingGoalData) {
		return (
			<div className={block({editing: true})}>
				{/* Отображаем auto-header при редактировании */}
				{(statusInfo || confidenceInfo) && (
					<div className={element('auto-header')}>
						{statusInfo && (
							<div className={element('status')} style={{color: statusInfo.color}}>
								<Svg icon={statusInfo.icon} className={element('status-icon')} />
								<span>{statusInfo.text}</span>
							</div>
						)}
						{confidenceInfo && (
							<div className={element('confidence')} style={{color: confidenceInfo.color}}>
								{Math.round((goal.autoParserData?.confidence || 0) * 100)}% ({confidenceInfo.text})
							</div>
						)}
						{goal.originalSearchText && (
							<div className={element('search-text')}>
								Поиск: <em>{goal.originalSearchText}</em>
							</div>
						)}
					</div>
				)}

				{/* Форма редактирования с EditGoal */}
				<div className={element('edit-form')}>
					<EditGoalFromList
						className={element('add-goal')}
						goal={goal}
						onGoalEdited={handleGoalCreated}
						onCancel={onCancelEdit || (() => {})}
						initialCategory={initialCategory}
						preloadedCategories={preloadedCategories}
						preloadedSubcategories={preloadedSubcategories}
						autoParserData={editingGoalData}
					/>
				</div>
			</div>
		);
	}

	// Обычное отображение цели
	return (
		<div className={block({auto: goal.isFromAutoParser, disabled: isOtherEditing})}>
			{goal.isFromAutoParser && (statusInfo || confidenceInfo) && (
				<div className={element('auto-header')}>
					{statusInfo && (
						<div className={element('status')} style={{color: statusInfo.color}}>
							<Svg icon={statusInfo.icon} className={element('status-icon')} />
							<span>{statusInfo.text}</span>
						</div>
					)}
					{confidenceInfo && (
						<div className={element('confidence')} style={{color: confidenceInfo.color}}>
							{Math.round((goal.autoParserData?.confidence || 0) * 100)}% ({confidenceInfo.text})
						</div>
					)}
					{goal.originalSearchText && (
						<div className={element('search-text')}>
							Поиск: <em>{goal.originalSearchText}</em>
						</div>
					)}
				</div>
			)}

			<div className={element('content')}>
				<div className={element('image-container')}>
					{goal.image instanceof File ? (
						<img src={URL.createObjectURL(goal.image)} alt={goal.title} className={element('image')} />
					) : goal.image ? (
						<img src={goal.image} alt={goal.title} className={element('image')} />
					) : (
						<div className={element('no-image')}>
							<Svg icon="mount" />
						</div>
					)}
				</div>
				<div className={element('info')}>
					<h4 className={element('title')}>{goal.title}</h4>
					<p className={element('complexity')}>
						{getComplexity[goal.complexity as keyof typeof getComplexity] || goal.complexity}
					</p>
					<p className={element('description')}>{goal.shortDescription}</p>
				</div>
			</div>

			<div className={element('actions')}>
				{goal.isFromAutoParser && onStartEdit && !isOtherEditing && (
					<button
						type="button"
						className={element('edit-btn')}
						onClick={() => onStartEdit(goal.id)}
						aria-label="Редактировать цель"
						title="Редактировать цель"
					>
						<Svg icon="edit" />
					</button>
				)}
				<button
					type="button"
					className={element('remove-btn')}
					onClick={() => onRemove(goal.id)}
					aria-label="Удалить цель"
					title="Удалить цель"
					disabled={isOtherEditing}
					onKeyDown={(e) => {
						if (e.key === 'Enter' || e.key === ' ') {
							onRemove(goal.id);
						}
					}}
				>
					<Svg icon="cross" />
				</button>
			</div>
		</div>
	);
};

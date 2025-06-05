import React, {useState} from 'react';

import {Button} from '@/components/Button/Button';
import {Svg} from '@/components/Svg/Svg';
import {useBem} from '@/hooks/useBem';
import {ICategory} from '@/typings/goal';

import {GoalEditForm} from './GoalEditForm';

interface ParsedGoal {
	status: 'existing' | 'external' | 'created' | 'error';
	title: string;
	description: string;
	imageUrl?: string;
	confidence: number;
	goalCode?: string;
	externalId?: string;
	apiSource?: string;
	additionalFields?: any;
	existingGoal?: boolean;
	error?: string;
	complexity?: string;
	sourceType?: string;
	searchText?: string;
}

interface GoalPreviewCardProps {
	goal: ParsedGoal;
	onEdit: (editedGoal: ParsedGoal) => void;
	onRemove: () => void;
	className?: string;
	initialCategory?: ICategory;
	preloadedCategories?: ICategory[];
	preloadedSubcategories?: ICategory[];
}

export const GoalPreviewCard: React.FC<GoalPreviewCardProps> = ({
	goal,
	onEdit,
	onRemove,
	className,
	initialCategory,
	preloadedCategories,
	preloadedSubcategories,
}) => {
	const [block, element] = useBem('goal-preview-card', className);

	const [isEditing, setIsEditing] = useState(false);

	const getStatusInfo = () => {
		switch (goal.status) {
			case 'existing':
				return {
					color: 'green',
					text: 'Существующая цель',
					icon: 'check',
				};
			case 'external':
				return {
					color: 'blue',
					text: `Найдена через ${goal.apiSource?.toUpperCase()}`,
					icon: 'globe',
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
		const confidence = goal.confidence * 100;
		if (confidence >= 90) return {color: 'green', text: 'Высокая'};
		if (confidence >= 70) return {color: 'orange', text: 'Средняя'};
		return {color: 'red', text: 'Низкая'};
	};

	const handleSaveEdit = (editedGoal: any) => {
		onEdit({
			...goal,
			...editedGoal,
			status: goal.status, // сохраняем статус
		});
		setIsEditing(false);
	};

	const handleCancelEdit = () => {
		setIsEditing(false);
	};

	const statusInfo = getStatusInfo();
	const confidenceInfo = getConfidenceInfo();

	return (
		<div className={block()}>
			<div className={element('header')}>
				<div className={element('status')} style={{color: statusInfo.color}}>
					<Svg icon={statusInfo.icon} />
					<span>{statusInfo.text}</span>
					{goal.searchText && <p className={element('source-info')}>(поиск: {goal.searchText})</p>}
				</div>
				<div className={element('confidence')} style={{color: confidenceInfo.color}}>
					{Math.round(goal.confidence * 100)}% ({confidenceInfo.text})
				</div>
			</div>

			{isEditing ? (
				<GoalEditForm
					initialGoal={goal}
					onSave={handleSaveEdit}
					onCancel={handleCancelEdit}
					mode="edit"
					lockCategory
					noForm
					initialCategory={initialCategory}
					preloadedCategories={preloadedCategories}
					preloadedSubcategories={preloadedSubcategories}
				/>
			) : (
				<div className={element('content')}>
					{goal.imageUrl && (
						<div className={element('image')}>
							<img src={goal.imageUrl} alt={goal.title} />
						</div>
					)}

					<div className={element('info')}>
						<h3 className={element('title')}>{goal.title}</h3>
						<p className={element('description')}>{goal.description}</p>

						{goal.additionalFields && (
							<div className={element('additional-info')}>
								{goal.additionalFields.genres && (
									<div className={element('genres')}>
										<strong>Жанры:</strong> {goal.additionalFields.genres.join(', ')}
									</div>
								)}
								{goal.additionalFields.platforms && (
									<div className={element('platforms')}>
										<strong>Платформы:</strong> {goal.additionalFields.platforms.join(', ')}
									</div>
								)}
								{goal.additionalFields.rating && (
									<div className={element('rating')}>
										<strong>Рейтинг:</strong> {Math.round(goal.additionalFields.rating * 10) / 10}/10
									</div>
								)}
							</div>
						)}
					</div>

					<div className={element('actions')}>
						<Button onClick={onRemove} theme="red" size="small">
							Удалить
						</Button>
						<Button onClick={() => setIsEditing(true)} theme="blue-light" size="small">
							Редактировать
						</Button>
					</div>
				</div>
			)}
		</div>
	);
};

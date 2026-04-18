import {observer} from 'mobx-react-lite';
import {FC, useCallback, useEffect, useState} from 'react';

import {useBem} from '@/hooks/useBem';
import {
	createFolderRule,
	deleteFolderRule,
	getFolderRuleOptions,
	IGoalFolder,
	IGoalFolderRule,
	IRuleOptions,
	updateFolderRule,
} from '@/utils/api/goals';

import {FolderRulesManagerSkeleton} from './FolderRulesManagerSkeleton';
import {Button} from '../Button/Button';
import {EmptyState} from '../EmptyState/EmptyState';
import {FieldCheckbox} from '../FieldCheckbox/FieldCheckbox';
import {FieldInput} from '../FieldInput/FieldInput';
import {Modal} from '../Modal/Modal';
import {ModalConfirm} from '../ModalConfirm/ModalConfirm';
import './folder-rules-manager.scss';
import Select from '../Select/Select';
import {Title} from '../Title/Title';

interface FolderRulesManagerProps {
	className?: string;
	folder: IGoalFolder;
	rules: IGoalFolderRule[];
	onRulesUpdate: () => void;
}

const RULE_FIELD_MAPPING = {
	AUTO_ADD_CATEGORY: ['category'],
	AUTO_ADD_COMPLEXITY: ['complexity'],
	AUTO_ADD_KEYWORD: ['keywords'],
	AUTO_ADD_COMPLETED_CATEGORY: ['category'],
	AUTO_ADD_COMPLETED_COMPLEXITY: ['complexity'],
	AUTO_ADD_COMPLETED_KEYWORD: ['keywords'],
	ON_COMPLETE_ADD: [],
	ON_COMPLETE_REMOVE: [],
	ON_PROGRESS_START_ADD: [],
	ON_PROGRESS_START_REMOVE: [],
	ON_DEADLINE_APPROACHING_ADD: ['daysBeforeDeadline'],
	ON_HIGH_PROGRESS_ADD: ['progressThreshold'],
	ON_STALLED_PROGRESS_ADD: ['daysWithoutProgress'],
};

// Функция для получения релевантных полей для отображения детали правила
const getRelevantDisplayFields = (rule: IGoalFolderRule) => {
	const fields = [];

	if (rule.categoryName) fields.push(`Категория: ${rule.categoryName}`);
	if (rule.complexity) fields.push(`Сложность: ${rule.complexity}`);
	if (rule.keywords) fields.push(`Ключевые слова: ${rule.keywords}`);

	// Показываем числовые параметры только для соответствующих типов правил
	if (rule.ruleType === 'ON_DEADLINE_APPROACHING_ADD' && rule.daysBeforeDeadline) {
		fields.push(`Дней до дедлайна: ${rule.daysBeforeDeadline}`);
	}
	if (rule.ruleType === 'ON_HIGH_PROGRESS_ADD' && rule.progressThreshold) {
		fields.push(`Порог прогресса: ${rule.progressThreshold}%`);
	}
	if (rule.ruleType === 'ON_STALLED_PROGRESS_ADD' && rule.daysWithoutProgress) {
		fields.push(`Дней без прогресса: ${rule.daysWithoutProgress}`);
	}

	return fields;
};

export const FolderRulesManager: FC<FolderRulesManagerProps> = observer(({className, folder, rules, onRulesUpdate}) => {
	const [block, element] = useBem('folder-rules-manager', className);

	const [ruleOptions, setRuleOptions] = useState<IRuleOptions | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [isSaving, setIsSaving] = useState(false);
	const [isCreating, setIsCreating] = useState(false);
	const [isEditing, setIsEditing] = useState(false);
	const [editingRule, setEditingRule] = useState<IGoalFolderRule | null>(null);
	const [deleteRuleId, setDeleteRuleId] = useState<number | null>(null);

	const [formData, setFormData] = useState<Partial<IGoalFolderRule>>({
		folder: folder.id,
		ruleType: '',
		isActive: true,
		daysBeforeDeadline: 7,
		progressThreshold: 80,
		daysWithoutProgress: 7,
	});
	const [formErrors, setFormErrors] = useState<Record<string, string>>({});

	const getRequiredFields = () => {
		if (!formData.ruleType) return [];
		return RULE_FIELD_MAPPING[formData.ruleType as keyof typeof RULE_FIELD_MAPPING] || [];
	};

	const loadRuleOptions = useCallback(async () => {
		setIsLoading(true);
		try {
			const response = await getFolderRuleOptions();
			if (response.success && response.data) {
				setRuleOptions(response.data);
			}
		} catch (error) {
			console.error('Ошибка загрузки параметров правил:', error);
		}
		setIsLoading(false);
	}, []);

	useEffect(() => {
		loadRuleOptions();
	}, []);

	const resetForm = () => {
		setFormData({
			folder: folder.id,
			ruleType: '',
			isActive: true,
			daysBeforeDeadline: 7,
			progressThreshold: 80,
			daysWithoutProgress: 7,
		});
		setFormErrors({});
	};

	const validateForm = (): boolean => {
		const errors: Record<string, string> = {};
		const requiredFields = getRequiredFields();

		if (requiredFields.includes('category') && !formData.category) {
			errors['category'] = 'Выберите категорию';
		}
		if (requiredFields.includes('complexity') && !formData.complexity) {
			errors['complexity'] = 'Выберите сложность';
		}
		if (requiredFields.includes('keywords') && !formData.keywords?.trim()) {
			errors['keywords'] = 'Введите ключевые слова';
		}

		setFormErrors(errors);
		return Object.keys(errors).length === 0;
	};

	const handleCreateRule = async () => {
		if (!formData.ruleType) return;
		if (!validateForm()) return;
		setIsSaving(true);

		try {
			const response = await createFolderRule(folder.id, formData);
			if (response.success) {
				setIsCreating(false);
				resetForm();
				onRulesUpdate();
			}
		} catch (error) {
			console.error('Ошибка создания правила:', error);
		}
		setIsSaving(false);
	};

	const handleUpdateRule = async () => {
		if (!editingRule?.id || !formData.ruleType) return;
		if (!validateForm()) return;
		setIsSaving(true);

		try {
			const response = await updateFolderRule(folder.id, editingRule.id, formData);
			if (response.success) {
				setIsEditing(false);
				setEditingRule(null);
				resetForm();
				onRulesUpdate();
			}
		} catch (error) {
			console.error('Ошибка обновления правила:', error);
		}
		setIsSaving(false);
	};

	const handleDeleteRule = async (ruleId: number) => {
		try {
			const response = await deleteFolderRule(folder.id, ruleId);
			if (response.success) {
				setDeleteRuleId(null);
				onRulesUpdate();
			}
		} catch (error) {
			console.error('Ошибка удаления правила:', error);
		}
	};

	const handleEditRule = (rule: IGoalFolderRule) => {
		setEditingRule(rule);
		setFormData({
			folder: rule.folder,
			ruleType: rule.ruleType,
			category: rule.category,
			complexity: rule.complexity,
			keywords: rule.keywords,
			removeFromFolder: rule.removeFromFolder,
			daysBeforeDeadline: rule.daysBeforeDeadline || 7,
			progressThreshold: rule.progressThreshold || 80,
			daysWithoutProgress: rule.daysWithoutProgress || 7,
			isActive: rule.isActive,
		});
		setIsEditing(true);
	};

	const renderRuleForm = () => {
		const requiredFields = getRequiredFields();

		return (
			<div className={element('form')}>
				<Select
					text="Тип правила"
					options={ruleOptions?.ruleTypes.map((type) => ({name: type.label, value: type.value})) || []}
					activeOption={formData.ruleType ? ruleOptions?.ruleTypes.findIndex((t) => t.value === formData.ruleType) ?? null : null}
					onSelect={(active) => {
						const value = ruleOptions?.ruleTypes[active]?.value;
						if (value) {
							setFormData({...formData, ruleType: value});
							setFormErrors({});
						}
					}}
					placeholder="Выберите тип правила"
				/>

				{formData.ruleType && (
					<div className={element('rule-description')}>
						{ruleOptions?.ruleTypes.find((t) => t.value === formData.ruleType)?.description}
					</div>
				)}

				{requiredFields.includes('category') && (
					<Select
						text="Категория"
						options={ruleOptions?.categories.map((cat) => ({name: cat.name, value: cat.id.toString()})) || []}
						activeOption={
							formData.category ? ruleOptions?.categories.findIndex((cat) => cat.id === formData.category) ?? null : null
						}
						onSelect={(active) => {
							const cat = ruleOptions?.categories[active];
							if (cat) {
								setFormData({...formData, category: cat.id});
								setFormErrors((prev) => ({...prev, category: ''}));
							}
						}}
						placeholder="Выберите категорию"
						searchInControl
						error={!!formErrors['category']}
						errorText={formErrors['category']}
					/>
				)}

				{requiredFields.includes('complexity') && (
					<Select
						text="Сложность"
						options={ruleOptions?.complexities.map((comp) => ({name: comp.label, value: comp.value})) || []}
						activeOption={
							formData.complexity
								? ruleOptions?.complexities.findIndex((comp) => comp.value === formData.complexity) ?? null
								: null
						}
						onSelect={(active) => {
							const comp = ruleOptions?.complexities[active];
							if (comp) {
								setFormData({...formData, complexity: comp.value});
								setFormErrors((prev) => ({...prev, complexity: ''}));
							}
						}}
						placeholder="Выберите сложность"
						error={!!formErrors['complexity']}
						errorText={formErrors['complexity']}
					/>
				)}

				{requiredFields.includes('keywords') && (
					<FieldInput
						id="rule-keywords"
						text="Ключевые слова"
						value={formData.keywords || ''}
						setValue={(value: string) => {
							setFormData({...formData, keywords: value});
							if (value.trim()) setFormErrors((prev) => ({...prev, keywords: ''}));
						}}
						placeholder="Введите слова через запятую"
						required
						error={formErrors['keywords'] ? [formErrors['keywords']] : undefined}
					/>
				)}

				{requiredFields.includes('daysBeforeDeadline') && (
					<FieldInput
						id="rule-days-deadline"
						text="Дней до дедлайна"
						value={formData.daysBeforeDeadline?.toString() || '7'}
						setValue={(value: string) => setFormData({...formData, daysBeforeDeadline: Number(value)})}
						type="number"
						required
						placeholder="Введите количество дней"
					/>
				)}

				{requiredFields.includes('progressThreshold') && (
					<FieldInput
						id="rule-progress-threshold"
						text="Порог прогресса (%)"
						value={formData.progressThreshold?.toString() || '80'}
						setValue={(value: string) => setFormData({...formData, progressThreshold: Number(value)})}
						type="number"
						required
						placeholder="Введите порог прогресса"
					/>
				)}

				{requiredFields.includes('daysWithoutProgress') && (
					<FieldInput
						id="rule-days-stalled"
						text="Дней без прогресса"
						value={formData.daysWithoutProgress?.toString() || '7'}
						setValue={(value: string) => setFormData({...formData, daysWithoutProgress: Number(value)})}
						type="number"
						required
						placeholder="Введите количество дней"
					/>
				)}

				<FieldCheckbox
					id="rule-active"
					text="Активное правило"
					checked={formData.isActive || false}
					setChecked={(checked: boolean) => setFormData({...formData, isActive: checked})}
				/>

				<div className={element('form-actions')}>
					{isEditing ? (
						<>
							<Button
								theme="blue"
								onClick={handleUpdateRule}
								disabled={!formData.ruleType || isSaving}
								loading={isSaving}
								loadingText="Сохранение..."
							>
								Сохранить изменения
							</Button>
							<Button
								theme="blue-light"
								onClick={() => {
									setIsEditing(false);
									setEditingRule(null);
									resetForm();
								}}
							>
								Отмена
							</Button>
						</>
					) : (
						<>
							<Button
								theme="blue"
								onClick={handleCreateRule}
								disabled={!formData.ruleType || isSaving}
								loading={isSaving}
								loadingText="Создание..."
							>
								Создать правило
							</Button>
							<Button
								theme="blue-light"
								onClick={() => {
									setIsCreating(false);
									resetForm();
								}}
							>
								Отмена
							</Button>
						</>
					)}
				</div>
			</div>
		);
	};

	if (isLoading) {
		return <FolderRulesManagerSkeleton className={className} />;
	}

	return (
		<div className={block()}>
			<div className={element('header')}>
				<Title tag="h3">Правила папки &quot;{folder.name}&quot;</Title>
				<Button className={element('btn')} theme="blue" icon="plus" width="auto" onClick={() => setIsCreating(true)} size="small">
					Добавить правило
				</Button>
			</div>

			<div className={element('rules-list')}>
				{rules.length === 0 ? (
					<EmptyState
						title="У этой папки пока нет автоматических правил"
						description="Создайте правило, чтобы автоматизировать управление целями"
					/>
				) : (
					<div className={element('rules')}>
						{rules.map((rule) => (
							<div key={rule.id} className={element('rule', {inactive: !rule.isActive})}>
								<div className={element('rule-info')}>
									<Title tag="h4" className={element('rule-title')}>
										{rule.ruleTypeDisplay}
									</Title>
									<div className={element('rule-details')}>
										{getRelevantDisplayFields(rule).map((field, index) => (
											<span className={element('rule-item')} key={index}>
												{field}
											</span>
										))}
									</div>
									{!rule.isActive && <span className={element('inactive-badge')}>Неактивно</span>}
								</div>
								<div className={element('rule-actions')}>
									<Button theme="blue-light" icon="edit" size="small" onClick={() => handleEditRule(rule)}>
										Редактировать
									</Button>
									<Button theme="red" icon="trash" size="small" onClick={() => setDeleteRuleId(rule.id!)}>
										Удалить
									</Button>
								</div>
							</div>
						))}
					</div>
				)}
			</div>

			{/* Модальное окно создания правила */}
			<Modal
				className="folder-rules-modal"
				size="medium"
				isOpen={isCreating}
				onClose={() => {
					setIsCreating(false);
					resetForm();
				}}
				title="Создать новое правило"
			>
				{renderRuleForm()}
			</Modal>

			{/* Модальное окно редактирования правила */}
			<Modal
				className="folder-rules-modal"
				size="medium"
				isOpen={isEditing}
				onClose={() => {
					setIsEditing(false);
					setEditingRule(null);
					resetForm();
				}}
				title="Редактировать правило"
			>
				{renderRuleForm()}
			</Modal>

			{/* Подтверждение удаления правила */}
			<ModalConfirm
				title="Удалить правило?"
				isOpen={deleteRuleId !== null}
				onClose={() => setDeleteRuleId(null)}
				handleBtn={() => handleDeleteRule(deleteRuleId!)}
				textBtn="Удалить"
				text="Вы уверены, что хотите удалить это правило? Действие нельзя отменить."
				themeBtn="red"
			/>
		</div>
	);
});

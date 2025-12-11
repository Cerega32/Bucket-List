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

import {Button} from '../Button/Button';
import {EmptyState} from '../EmptyState/EmptyState';
import {FieldCheckbox} from '../FieldCheckbox/FieldCheckbox';
import {FieldInput} from '../FieldInput/FieldInput';
import {FieldSelect} from '../FieldSelect/FieldSelect';
import {Loader} from '../Loader/Loader';
import {Modal} from '../Modal/Modal';
import {ModalConfirm} from '../ModalConfirm/ModalConfirm';

import './folder-rules-manager.scss';

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
	}, [loadRuleOptions]);

	const resetForm = () => {
		setFormData({
			folder: folder.id,
			ruleType: '',
			isActive: true,
			daysBeforeDeadline: 7,
			progressThreshold: 80,
			daysWithoutProgress: 7,
		});
	};

	const handleCreateRule = async () => {
		if (!formData.ruleType) return;

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
	};

	const handleUpdateRule = async () => {
		if (!editingRule?.id || !formData.ruleType) return;

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

	const getRequiredFields = () => {
		if (!formData.ruleType) return [];
		return RULE_FIELD_MAPPING[formData.ruleType as keyof typeof RULE_FIELD_MAPPING] || [];
	};

	const renderRuleForm = () => {
		const requiredFields = getRequiredFields();

		return (
			<div className={element('form')}>
				<FieldSelect
					id="rule-type"
					text="Тип правила"
					value={formData.ruleType || ''}
					setValue={(value: string) => setFormData({...formData, ruleType: value})}
					options={ruleOptions?.ruleTypes.map((type) => ({value: type.value, text: type.label})) || []}
					placeholder="Выберите тип правила"
					required
				/>

				{formData.ruleType && (
					<div className={element('rule-description')}>
						{ruleOptions?.ruleTypes.find((t) => t.value === formData.ruleType)?.description}
					</div>
				)}

				{requiredFields.includes('category') && (
					<FieldSelect
						id="rule-category"
						text="Категория"
						value={formData.category?.toString() || ''}
						setValue={(value: string) => setFormData({...formData, category: Number(value)})}
						options={ruleOptions?.categories.map((cat) => ({value: cat.id.toString(), text: cat.name})) || []}
						placeholder="Выберите категорию"
						required
					/>
				)}

				{requiredFields.includes('complexity') && (
					<FieldSelect
						id="rule-complexity"
						text="Сложность"
						value={formData.complexity || ''}
						setValue={(value: string) => setFormData({...formData, complexity: value})}
						options={ruleOptions?.complexities.map((comp) => ({value: comp.value, text: comp.label})) || []}
						placeholder="Выберите сложность"
						required
					/>
				)}

				{requiredFields.includes('keywords') && (
					<FieldInput
						id="rule-keywords"
						text="Ключевые слова"
						value={formData.keywords || ''}
						setValue={(value: string) => setFormData({...formData, keywords: value})}
						placeholder="Введите слова через запятую"
						required
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
							<Button theme="blue" onClick={handleUpdateRule} active={!formData.ruleType}>
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
							<Button theme="blue" onClick={handleCreateRule} active={!formData.ruleType}>
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
		return <Loader isLoading />;
	}

	return (
		<div className={block()}>
			<div className={element('header')}>
				<h3>Правила папки &quot;{folder.name}&quot;</h3>
				<Button theme="blue" icon="plus" onClick={() => setIsCreating(true)} size="medium">
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
									<h4 className={element('rule-title')}>{rule.ruleTypeDisplay}</h4>
									<div className={element('rule-details')}>
										{getRelevantDisplayFields(rule).map((field, index) => (
											<span key={index}>{field}</span>
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

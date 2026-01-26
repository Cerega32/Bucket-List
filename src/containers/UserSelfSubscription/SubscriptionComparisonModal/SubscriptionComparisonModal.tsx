import React, {FC} from 'react';

import {Modal} from '@/components/Modal/Modal';
import {Svg} from '@/components/Svg/Svg';
import {useBem} from '@/hooks/useBem';

import './subscription-comparison-modal.scss';

interface SubscriptionComparisonModalProps {
	isOpen: boolean;
	onClose: () => void;
}

// Данные для таблицы сравнения
const COMPARISON_DATA = [
	{
		category: 'Цели и списки целей',
		items: [
			{feature: 'Собственные цели', free: true, premium: true},
			{feature: '100 Целей', free: true, premium: true},
			{feature: 'Создание списков целей', free: true, premium: true},
			{feature: 'Добавление готовых списков', free: true, premium: true},
			{feature: 'Посещенные места и страны', free: true, premium: true},
		],
	},
	{
		category: 'Папки целей',
		items: [
			{feature: 'Цвета и иконки папок', free: true, premium: true},
			{feature: 'Количество папок', free: 'До 3', premium: 'Без ограничений'},
			{feature: 'Приватные папки', free: true, premium: true},
			{feature: 'Публичные папки', free: false, premium: true},
			{feature: 'Шаблоны папок', free: false, premium: true},
			{feature: 'Автоматические правила для папок', free: false, premium: true},
			{feature: 'Совместные папки', free: false, premium: true},
		],
	},
	{
		category: 'Регулярные цели',
		items: [
			{feature: 'Базовые настройки', free: true, premium: true},
			{feature: 'Количество активных', free: 'До 3', premium: 'До 20'},
			{feature: 'Кастомные расписания', free: false, premium: true},
		],
	},
	{
		category: 'Социальные функции',
		items: [
			{feature: 'Лайки, дизлайки, комментарии', free: true, premium: true},
			{feature: 'Фото в комментариях', free: 'До 3 на 1 комментарий', premium: 'Без ограничений'},
			{feature: 'Друзья', free: 'До 20', premium: 'Без ограничений'},
			{feature: 'Сравнение с друзьями', free: false, premium: true},
		],
	},
	{
		category: 'Достижения и геймификация',
		items: [
			{feature: 'Уровни, опыт, достижения', free: true, premium: true},
			{feature: 'Premium достижения', free: false, premium: true},
			{feature: 'Задания для получения опыта', free: '1 задание', premium: '3 задания'},
		],
	},
	{
		category: 'Аналитика и уведомления',
		items: [
			{feature: 'Базовая статистика', free: true, premium: true},
			{feature: 'Активность выполнения целей и списков', free: '1 год', premium: 'Без ограничений'},
			{feature: 'Уведомления в мессенджерах', free: false, premium: true},
			{feature: 'Отсутствие рекламы', free: false, premium: true},
		],
	},
];

export const SubscriptionComparisonModal: FC<SubscriptionComparisonModalProps> = ({isOpen, onClose}) => {
	const [block, element] = useBem('subscription-comparison-modal');

	const renderValue = (value: boolean | string) => {
		if (typeof value === 'boolean') {
			return value ? (
				<Svg icon="done" className={element('check-icon', {enabled: true})} />
			) : (
				<Svg icon="cross" className={element('check-icon', {enabled: false})} />
			);
		}
		return <span className={element('text-value')}>{value}</span>;
	};

	return (
		<Modal isOpen={isOpen} onClose={onClose} title="Сравнение тарифов">
			<div className={block()}>
				<div className={element('table-wrapper')}>
					<table className={element('table')}>
						<thead>
							<tr>
								<th className={element('th-feature')}>Функция</th>
								<th className={element('th-plan')}>Free</th>
								<th className={element('th-plan', {premium: true})}>Premium</th>
							</tr>
						</thead>
						<tbody>
							{COMPARISON_DATA.map((category, categoryIndex) => (
								<React.Fragment key={categoryIndex}>
									<tr className={element('category-row')}>
										<td colSpan={3} className={element('category-cell')}>
											{category.category}
										</td>
									</tr>
									{category.items.map((item, itemIndex) => (
										<tr key={itemIndex} className={element('feature-row')}>
											<td className={element('td-feature')}>{item.feature}</td>
											<td className={element('td-plan')}>{renderValue(item.free)}</td>
											<td className={element('td-plan', {premium: true})}>{renderValue(item.premium)}</td>
										</tr>
									))}
								</React.Fragment>
							))}
						</tbody>
					</table>
				</div>
			</div>
		</Modal>
	);
};

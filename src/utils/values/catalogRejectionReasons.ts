import {ICatalogRejectionReason} from '@/typings/goal';
import {formatDateString} from '@/utils/time/formatDate';

/**
 * Подсказки для автора по причинам отказа модератора.
 * Коды синхронизированы с backend/utils/catalog_rejection_reasons.py
 */
export const catalogRejectionReasonLabels: Record<ICatalogRejectionReason, string> = {
	duplicate: 'Похожая запись уже есть в каталоге. Найдите её через поиск или измените формулировку.',
	unclear_text: 'Уточните название и описание: что именно нужно сделать.',
	off_topic: 'Не подходит для общего каталога. Измените тему или формулировку.',
	inappropriate_text: 'Текст нарушает правила. Уберите оскорбления и недопустимые формулировки.',
	inappropriate_image: 'Фото не подходит для каталога. Замените или удалите изображение.',
	low_quality_image: 'Замените фото: размытое, не по теме или низкого качества.',
	spam: 'Похоже на спам или рекламу. Уберите ссылки и рекламные формулировки.',
	other: 'Модератор оставил отдельный комментарий — см. ниже.',
};

export const getCatalogRejectionHints = (reasons?: ICatalogRejectionReason[] | null): string[] => {
	if (!reasons || reasons.length === 0) return [];
	return reasons.map((reason) => catalogRejectionReasonLabels[reason]).filter(Boolean);
};

/** Текст про автоудаление окончательно отклонённой записи (дата, без «через N дней») */
export const getCatalogDeleteHint = (deleteAt?: string | null): string => {
	if (!deleteAt) {
		return 'Запись будет удалена автоматически.';
	}
	return `Запись будет удалена автоматически ${formatDateString(deleteAt)}.`;
};

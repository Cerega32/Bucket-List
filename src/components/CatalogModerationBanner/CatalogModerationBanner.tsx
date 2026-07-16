import {FC} from 'react';

import {Banner} from '@/components/Banner/Banner';
import {ICatalogRejectionInfo} from '@/typings/goal';
import {getCatalogDeleteHint, getCatalogRejectionHints} from '@/utils/values/catalogRejectionReasons';

interface CatalogModerationBannerProps
	extends Pick<
		ICatalogRejectionInfo,
		| 'catalogReviewStatus'
		| 'catalogPermanentlyRejected'
		| 'catalogRejectionCount'
		| 'catalogRejectionLimit'
		| 'catalogRejectionReasons'
		| 'catalogRejectionComment'
		| 'catalogDeleteAt'
	> {
	className?: string;
	actionText?: string;
	onAction?: () => void;
}

/** Статус модерации цели/списка — используется и в форме редактирования, и на странице просмотра */
export const CatalogModerationBanner: FC<CatalogModerationBannerProps> = (props) => {
	const {
		className,
		catalogReviewStatus: status,
		catalogPermanentlyRejected,
		catalogRejectionCount,
		catalogRejectionLimit = 3,
		catalogRejectionReasons,
		catalogRejectionComment,
		catalogDeleteAt,
		actionText,
		onAction,
	} = props;

	if (status === 'pending') {
		return (
			<Banner
				type="info"
				className={className}
				title="На проверке модератора"
				message="Пока не отображается в общем каталоге — обычно проверка занимает немного времени."
			/>
		);
	}

	if (status === 'rejected' && catalogPermanentlyRejected) {
		return (
			<Banner
				type="danger"
				className={className}
				title="Отклонено окончательно"
				message={
					`Лимит попыток (${catalogRejectionLimit}) исчерпан. ${getCatalogDeleteHint(catalogDeleteAt)} ` +
					'Создайте новую версию с другой формулировкой.'
				}
			/>
		);
	}

	if (status === 'rejected') {
		const attempt = Math.max(1, catalogRejectionCount ?? 1);
		const hints = getCatalogRejectionHints(catalogRejectionReasons);
		return (
			<Banner
				type="warning"
				className={className}
				title={`Попытка ${attempt} из ${catalogRejectionLimit} отклонена`}
				message={
					<>
						{hints.map((hint) => (
							<p key={hint}>{hint}</p>
						))}
						{catalogRejectionComment && <p>Комментарий модератора: {catalogRejectionComment}</p>}
						<p>Исправьте замечания и отправьте на повторную проверку.</p>
					</>
				}
				actionText={actionText}
				onAction={onAction}
			/>
		);
	}

	return null;
};

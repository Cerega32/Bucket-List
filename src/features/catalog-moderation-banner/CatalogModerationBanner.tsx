import {FC} from 'react';
import {Link} from 'react-router-dom';

import {getCatalogDeleteHint, getCatalogRejectionHints} from '@/entities/goal/lib/catalogRejectionReasons';
import {formatCatalogResubmitAvailableAt, isCatalogResubmitOnCooldown} from '@/entities/goal/lib/resubmitCooldown';
import {ICatalogRejectionInfo} from '@/entities/goal/model/types';
import {Banner} from '@/shared/ui/Banner/Banner';

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
		| 'catalogResubmitAvailableAt'
		| 'catalogDuplicateGoalCode'
		| 'catalogDuplicateGoalTitle'
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
		catalogResubmitAvailableAt,
		catalogDuplicateGoalCode,
		catalogDuplicateGoalTitle,
		actionText,
		onAction,
	} = props;

	const hasLinkedDuplicate = Boolean(catalogDuplicateGoalCode && catalogDuplicateGoalTitle);
	const hints = getCatalogRejectionHints(
		hasLinkedDuplicate ? catalogRejectionReasons?.filter((reason) => reason !== 'duplicate') : catalogRejectionReasons
	);
	const onCooldown = isCatalogResubmitOnCooldown(catalogResubmitAvailableAt);

	const duplicateBlock = hasLinkedDuplicate ? (
		<p>
			Похожая запись уже есть в каталоге. Вот она: <Link to={`/goals/${catalogDuplicateGoalCode}`}>{catalogDuplicateGoalTitle}</Link>.
		</p>
	) : null;

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
					<>
						<p>
							{`Лимит попыток (${catalogRejectionLimit}) исчерпан. ${getCatalogDeleteHint(catalogDeleteAt)} ` +
								'Создайте новую версию с другой формулировкой.'}
						</p>
						{duplicateBlock}
						{hints.map((hint) => (
							<p key={hint}>{hint}</p>
						))}
						{catalogRejectionComment && <p>Комментарий модератора: {catalogRejectionComment}</p>}
					</>
				}
			/>
		);
	}

	if (status === 'rejected') {
		const attempt = Math.max(1, catalogRejectionCount ?? 1);
		return (
			<Banner
				type="warning"
				className={className}
				title={`Попытка ${attempt} из ${catalogRejectionLimit} отклонена`}
				message={
					<>
						{duplicateBlock}
						{hints.map((hint) => (
							<p key={hint}>{hint}</p>
						))}
						{catalogRejectionComment && <p>Комментарий модератора: {catalogRejectionComment}</p>}
						{onCooldown && catalogResubmitAvailableAt ? (
							<p>
								{`Сейчас можно править текст — изменения сохранятся. Повторная отправка на проверку будет доступна ${formatCatalogResubmitAvailableAt(
									catalogResubmitAvailableAt
								)}.`}
							</p>
						) : (
							<p>Исправьте замечания и отправьте на повторную проверку.</p>
						)}
					</>
				}
				actionText={actionText}
				onAction={onAction}
			/>
		);
	}

	return null;
};

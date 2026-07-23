import {FC} from 'react';

import {useBem} from '@/shared/lib/hooks/useBem';
import {Banner} from '@/shared/ui/Banner/Banner';
import {FieldCheckbox} from '@/shared/ui/FieldCheckbox/FieldCheckbox';
import {InfoTooltip} from '@/shared/ui/InfoTooltip/InfoTooltip';

interface AllowCustomSettingsFieldProps {
	className?: string;
	checked: boolean;
	setChecked: (value: boolean) => void;
	disabled?: boolean;
	/** Пояснение, почему галочку нельзя снять (показывается под полем) */
	lockNotice?: string;
}

export const AllowCustomSettingsField: FC<AllowCustomSettingsFieldProps> = ({
	className,
	checked,
	setChecked,
	disabled = false,
	lockNotice,
}) => {
	const [, element] = useBem('add-goal', className);

	return (
		<div className={element('regular-field-group')}>
			<div className={element('field-with-tooltip')}>
				<FieldCheckbox
					id="allow-custom-settings"
					text="Разрешить пользователям изменять настройки регулярности, при добавлении цели к себе"
					checked={checked}
					setChecked={setChecked}
					disabled={disabled}
					className={element('field')}
				/>
				<InfoTooltip
					paragraphs={[
						'Если включено, пользователи смогут изменять настройки регулярности при добавлении цели к себе.',
						'Если отключено, пользователи смогут использовать только те настройки, которые будут указаны в цели при ее создании.',
					]}
				/>
			</div>
			{disabled && lockNotice ? <Banner type="info" message={lockNotice} className={element('allow-custom-lock-banner')} /> : null}
		</div>
	);
};

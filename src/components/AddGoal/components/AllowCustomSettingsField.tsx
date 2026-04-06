import {FC} from 'react';

import {Banner} from '@/components/Banner/Banner';
import {FieldCheckbox} from '@/components/FieldCheckbox/FieldCheckbox';
import {Svg} from '@/components/Svg/Svg';
import {useBem} from '@/hooks/useBem';

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
				<div className={element('tooltip-wrapper')}>
					<Svg icon="info" className={element('tooltip-icon')} width="13" height="13" />
					<div className={element('tooltip-content')}>
						<p className={element('tooltip-text')}>
							Если включено, пользователи смогут изменять настройки регулярности при добавлении цели к себе.
						</p>
						<p className={element('tooltip-text')}>
							Если отключено, пользователи смогут использовать только те настройки, которые будут указаны в цели при ее
							создании.
						</p>
					</div>
				</div>
			</div>
			{disabled && lockNotice ? <Banner type="info" message={lockNotice} className={element('allow-custom-lock-banner')} /> : null}
		</div>
	);
};

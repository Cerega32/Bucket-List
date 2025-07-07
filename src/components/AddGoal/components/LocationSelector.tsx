import {FC} from 'react';

import {Button} from '@/components/Button/Button';
import {Svg} from '@/components/Svg/Svg';
import {useBem} from '@/hooks/useBem';
import {ModalStore} from '@/store/ModalStore';
import {ILocation} from '@/typings/goal';

interface LocationSelectorProps {
	className?: string;
	selectedGoalLocation: Partial<ILocation> | null;
	setSelectedGoalLocation: (value: Partial<ILocation> | null) => void;
	isVisible: boolean;
}

export const LocationSelector: FC<LocationSelectorProps> = (props) => {
	const {className, selectedGoalLocation, setSelectedGoalLocation, isVisible} = props;

	const [, element] = useBem('add-goal', className);
	const {setIsOpen, setWindow, setModalProps} = ModalStore;

	// Обработчик выбора места с карты
	const handleLocationFromPicker = (selectedLocation: Partial<ILocation>) => {
		// Создаем полный объект ILocation (частичный, id будет создан на сервере)
		const fullLocation: Partial<ILocation> = {
			name: selectedLocation.name || '',
			longitude: selectedLocation.longitude || 0,
			latitude: selectedLocation.latitude || 0,
			country: selectedLocation.country || '',
			city: selectedLocation.city || undefined,
			description: selectedLocation.description || undefined,
			place_type: 'other',
			address: undefined,
			created_at: new Date().toISOString(),
		};
		setSelectedGoalLocation(fullLocation);
		setIsOpen(false);
	};

	// Функция для сброса выбранного места
	const clearSelectedLocation = () => {
		setSelectedGoalLocation(null);
	};

	const openLocationPicker = () => {
		setIsOpen(true);
		setWindow('goal-map-add');
		setModalProps({
			onLocationSelect: handleLocationFromPicker,
			initialLocation: selectedGoalLocation || undefined,
		});
	};

	if (!isVisible) {
		return null;
	}

	return (
		<div className={element('location-field-container')}>
			<p className={element('field-title')}>Место на карте</p>

			{selectedGoalLocation ? (
				<div className={element('selected-location')}>
					<div className={element('selected-location-info')}>
						<Svg icon="map" className={element('location-icon')} />
						<div>
							<div className={element('selected-location-name')}>{selectedGoalLocation?.name}</div>
							<div className={element('selected-location-details')}>
								{selectedGoalLocation?.city && `${selectedGoalLocation.city}, `}
								{selectedGoalLocation?.country}
							</div>
							{selectedGoalLocation?.description && (
								<div className={element('selected-location-description')}>{selectedGoalLocation.description}</div>
							)}
						</div>
					</div>
					<div className={element('location-actions')}>
						<Button theme="blue-light" size="small" onClick={openLocationPicker}>
							Изменить место
						</Button>
						<Button theme="red" size="small" onClick={clearSelectedLocation}>
							Удалить место
						</Button>
					</div>
				</div>
			) : (
				<div className={element('location-empty')}>
					<p>Выберите географическое место на карте</p>
					<Button theme="blue" onClick={openLocationPicker}>
						Выбрать место на карте
					</Button>
				</div>
			)}

			<small className={element('format-hint')}>
				Выберите географическое место на карте. Это поможет отслеживать ваши путешествия на карте.
			</small>
		</div>
	);
};

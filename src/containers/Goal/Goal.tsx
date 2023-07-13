import {FC} from 'react';
import {AsideGoal} from '@/components/AsideGoal/AsideGoal';
import {HeaderGoal} from '@/components/HeaderGoal/HeaderGoal';
import {ContentGoal} from '@/components/ContentGoal/ContentGoal';
import {useBem} from '@/hooks/useBem';
import './goal.scss';

export const Goal: FC = () => {
	const [block, element] = useBem('goal');

	return (
		<>
			<HeaderGoal
				title="Тегеран и его горы с водопадами"
				category="travel"
				image="src/assets/jpg/Background.jpg"
			/>
			<section className={block()}>
				<AsideGoal
					className={element('aside')}
					title="Тегеран"
					image="src/assets/jpg/Background.jpg"
					text="Тегеран - столица Ирана, расположенная на склонах горы Эльбрус, с населением более 8,5 миллионов человек."
				/>
				<ContentGoal className={element('content')} />
			</section>
		</>
	);
};

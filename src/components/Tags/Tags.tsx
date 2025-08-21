import {FC, Fragment} from 'react';

import {useBem} from '@/hooks/useBem';
import {ICategory, IComplexity, IGoalFolderTag} from '@/typings/goal';
import {formatDjangoDurationShort} from '@/utils/time/formatEstimatedTime';
import {getComplexity} from '@/utils/values/complexity';

import {Line} from '../Line/Line';
import {Tag} from '../Tag/Tag';
import './tags.scss';

interface TagsProps {
	className?: string;
	theme?: 'light' | 'integrate';
	category?: ICategory;
	complexity: IComplexity;
	done?: number;
	added?: number;
	medal?: string;
	time?: string;
	estimatedTime?: string;
	showSeparator?: boolean;
	userFolders?: IGoalFolderTag[];
}

export const Tags: FC<TagsProps> = (props) => {
	const {className, theme, category, complexity, done, added, medal, time, estimatedTime, showSeparator, userFolders} = props;

	const [block] = useBem('tags', className);

	// Определяем какое время показывать - либо переданное время, либо форматированное estimatedTime
	const displayTime = time || (estimatedTime ? formatDjangoDurationShort(estimatedTime) : null);

	// Создаем массив элементов для правильного отображения линий
	const elements: Array<JSX.Element> = [];

	// Добавляем элементы в массив
	if (category) {
		elements.push(<Tag category={category.nameEn} text={category.name} theme={theme} />);
	}

	if (medal) {
		elements.push(<Tag text={medal} theme={theme} icon="medal" />);
	}

	elements.push(<Tag text={getComplexity[complexity]} theme={theme} icon={complexity} />);

	if (added) {
		elements.push(<Tag text={added} theme={theme} icon="people" />);
	}

	if (done) {
		elements.push(<Tag text={done} theme={theme} icon="done" />);
	}

	if (displayTime) {
		elements.push(<Tag text={displayTime} theme={theme} icon="watch" />);
	}

	// Добавляем папки пользователя
	if (userFolders && userFolders.length > 0) {
		userFolders.forEach((folder) => {
			elements.push(<Tag text={folder.name} theme={theme} icon={folder.icon} style={{backgroundColor: folder.color}} />);
		});
	}

	return (
		<section className={block()}>
			{elements.map((item, index) => (
				<Fragment key={index}>
					{item}
					{showSeparator && index < elements.length - 1 && <Line vertical />}
				</Fragment>
			))}
		</section>
	);
};

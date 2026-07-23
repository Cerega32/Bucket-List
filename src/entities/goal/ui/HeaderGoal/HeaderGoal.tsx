import {useState, forwardRef} from 'react';

import '@/entities/comment/ui/CommentImagesGallery/comment-images-gallery.scss';
import {ICategory, IGoal} from '@/entities/goal/model/types';
import {TitleWithTags} from '@/entities/goal/ui/TitleWithTags/TitleWithTags';
import {useBem} from '@/shared/lib/hooks/useBem';
import useScreenSize from '@/shared/lib/hooks/useScreenSize';
import {LightboxWithScrollLock} from '@/shared/ui/LightboxWithScrollLock/LightboxWithScrollLock';

import '@/entities/goal/ui/HeaderGoal/header-goal.scss';

interface HeaderGoalProps {
	className?: string;
	title: string;
	category: ICategory;
	image: string;
	goal: IGoal;
	background: string;
	compact: boolean;
	onImageLoad?: () => void;
}

export const HeaderGoal = forwardRef<HTMLElement, HeaderGoalProps>((props, ref) => {
	const {className, title, category, image, goal, background, compact, onImageLoad} = props;
	const [block, element] = useBem('header-goal', className);
	const {isScreenMobile, isScreenSmallTablet} = useScreenSize();
	const isMobile = isScreenMobile || isScreenSmallTablet;

	const [isGoalImageLightboxOpen, setIsGoalImageLightboxOpen] = useState(false);

	return (
		<header
			ref={ref}
			className={block({
				category: category.nameEn,
				compact,
				mobile: isMobile,
			})}
			style={{backgroundImage: `url(${background})`}}
		>
			{isMobile && (
				<>
					<button
						type="button"
						className={element('image', {clickable: true})}
						aria-label={`Открыть изображение цели «${title}»`}
						onClick={() => setIsGoalImageLightboxOpen(true)}
					>
						<img src={image} alt="" onLoad={onImageLoad} />
					</button>
					<LightboxWithScrollLock
						open={isGoalImageLightboxOpen}
						close={() => setIsGoalImageLightboxOpen(false)}
						slides={[{src: image}]}
						index={0}
						className="comment-images-gallery__lightbox"
						carousel={{finite: true, padding: '16px'}}
						controller={{closeOnBackdropClick: true}}
						animation={{fade: 300}}
						render={{buttonPrev: () => null, buttonNext: () => null}}
					/>
				</>
			)}
			<TitleWithTags
				category={category}
				complexity={goal.complexity}
				totalCompleted={goal.totalCompleted}
				title={title}
				className={element('wrapper')}
				short={compact}
				categoryRank={goal.categoryRank}
				userFolders={goal.userFolders}
				estimatedTime={goal?.estimatedTime}
			/>
		</header>
	);
});

HeaderGoal.displayName = 'HeaderGoal';

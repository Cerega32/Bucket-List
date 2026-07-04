import {FC, useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {Link} from 'react-router-dom';

import {Button} from '@/components/Button/Button';
import {GRADIENT_DEFAULT_IMAGE} from '@/components/Gradient/Gradient';
import {Tag} from '@/components/Tag/Tag';
import {Title} from '@/components/Title/Title';
import {useBem} from '@/hooks/useBem';
import {IShortGoal} from '@/typings/goal';
import {revealGoalWithParticles} from '@/utils/animation/goalParticleAnimation';
import {getRandomActiveGoal} from '@/utils/api/get/getRandomActiveGoal';
import {markGoal} from '@/utils/api/post/markGoal';

import './daily-random-goal.scss';

interface DailyRandomGoalProps {
	className?: string;
}

const VISUAL_SIZE = 120;

const getGoalImageSrc = (image: string | null | undefined): string => {
	return image != null && String(image).trim() !== '' ? String(image).trim() : GRADIENT_DEFAULT_IMAGE;
};

const getGoalDescription = (goal: IShortGoal): string => {
	const text = (goal.shortDescription || goal.description || '').trim();
	return text;
};

export const DailyRandomGoal: FC<DailyRandomGoalProps> = (props) => {
	const {className} = props;
	const [block, element] = useBem('daily-random-goal', className);
	const canvasRef = useRef<HTMLCanvasElement | null>(null);
	const animatingRef = useRef(false);

	const [goal, setGoal] = useState<IShortGoal | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [isEmpty, setIsEmpty] = useState(false);
	const [isPickingAnother, setIsPickingAnother] = useState(false);
	const [isCompleting, setIsCompleting] = useState(false);
	const [showCanvas, setShowCanvas] = useState(false);

	const particleOptions = useMemo(
		() => ({
			width: VISUAL_SIZE,
			height: VISUAL_SIZE,
			duration: 900,
			maxParticles: 600,
			spread: VISUAL_SIZE * 1.2,
			approxCount: 350,
		}),
		[]
	);

	const fetchRandomGoal = useCallback(async (excludeCode?: string) => {
		const response = await getRandomActiveGoal(excludeCode);
		if (response.success && response.data) {
			return response.data as IShortGoal;
		}
		return null;
	}, []);

	const revealGoal = useCallback(
		async (nextGoal: IShortGoal) => {
			const canvas = canvasRef.current;
			if (!canvas) {
				setGoal(nextGoal);
				setShowCanvas(false);
				return;
			}

			setShowCanvas(true);
			animatingRef.current = true;

			try {
				await revealGoalWithParticles(canvas, getGoalImageSrc(nextGoal.image), particleOptions);
			} finally {
				setGoal(nextGoal);
				setShowCanvas(false);
				animatingRef.current = false;
			}
		},
		[particleOptions]
	);

	useEffect(() => {
		(async () => {
			const initialGoal = await fetchRandomGoal();
			if (initialGoal) {
				setGoal(initialGoal);
				setIsEmpty(false);
			} else {
				setIsEmpty(true);
			}
			setIsLoading(false);
		})();
	}, [fetchRandomGoal]);

	const handlePickAnother = async () => {
		if (animatingRef.current || isCompleting || !goal) {
			return;
		}

		setIsPickingAnother(true);

		try {
			const nextGoal = await fetchRandomGoal(goal.code);
			if (!nextGoal) {
				setIsEmpty(true);
				setGoal(null);
				return;
			}

			await revealGoal(nextGoal);
		} finally {
			setIsPickingAnother(false);
		}
	};

	const handleComplete = async () => {
		if (!goal || isCompleting || isPickingAnother || goal.completedByUser) {
			return;
		}

		setIsCompleting(true);
		const response = await markGoal(goal.code, true);
		if (response.success) {
			setGoal({...goal, completedByUser: true});
		}
		setIsCompleting(false);
	};

	if (isLoading) {
		return null;
	}

	if (isEmpty || !goal) {
		return null;
	}

	const goalImageSrc = getGoalImageSrc(goal.image);
	const goalDescription = getGoalDescription(goal);
	const isInfoBlurred = isPickingAnother;

	return (
		<section className={block()}>
			<Title tag="h2" className={element('title')}>
				Цель дня
			</Title>
			<div className={element('body')}>
				<Link to={`/goals/${goal.code}`} className={element('preview')}>
					<div className={element('visual')}>
						<canvas ref={canvasRef} className={element('canvas', {visible: showCanvas})} />
						<img className={element('image', {hidden: showCanvas})} src={goalImageSrc} alt={goal.title} />
					</div>
					<div className={element('info', {blurred: isInfoBlurred})}>
						<Title tag="h4" className={element('goal-title')}>
							{goal.title}
						</Title>
						{goalDescription && <p className={element('description')}>{goalDescription}</p>}
						<div className={element('tags')}>
							<Tag category={goal.category.nameEn} text={goal.category.name} />
							<Tag complexity={goal.complexity} theme="integrate" icon={goal.complexity} />
						</div>
					</div>
				</Link>
				<div className={element('actions')}>
					<Button
						theme="blue-light"
						size="small"
						width="full"
						typeBtn="button"
						icon="refresh"
						onClick={handlePickAnother}
						disabled={isPickingAnother || isCompleting}
					>
						Выбрать другую
					</Button>
					<Button
						theme={goal.completedByUser ? 'green' : 'blue'}
						size="small"
						width="full"
						typeBtn="button"
						icon="done"
						onClick={handleComplete}
						loading={isCompleting}
						loadingText="Выполнение..."
						disabled={isPickingAnother || goal.completedByUser}
					>
						{goal.completedByUser ? 'Выполнено' : 'Выполнить'}
					</Button>
				</div>
			</div>
		</section>
	);
};

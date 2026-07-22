import {GeoProjection, geoOrthographic} from 'd3-geo';
import {observer} from 'mobx-react-lite';
import {FC, useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {ComposableMap, Geographies, Geography, Graticule, Sphere} from 'react-simple-maps';

import {useBem} from '@/hooks/useBem';
import useScreenSize from '@/hooks/useScreenSize';
import {UserStore} from '@/store/UserStore';
import {markGoal} from '@/utils/api/post/markGoal';
import {computeMapColorAssignment} from '@/utils/data/computeMapColorAssignment';
import {getMicroStateTransform} from '@/utils/data/getMicroStateTransform';
import {resolveGeoIso} from '@/utils/data/resolveGeoIso';
import {
	SCRATCH_MAP_COUNTRY_PALETTE,
	SCRATCH_MAP_GLOBE_FILL,
	SCRATCH_MAP_NEUTRAL_FILL,
	SCRATCH_MAP_UNVISITED_PALETTE,
} from '@/utils/data/scratchMapPalette';
import {ScratchMapCountry, mapApi} from '@/utils/mapApi';

import {Banner} from '../Banner/Banner';
import {Button} from '../Button/Button';
import {InfoGoal} from '../InfoGoal/InfoGoal';
import {Loader} from '../Loader/Loader';
import {Modal} from '../Modal/Modal';
import {Tag} from '../Tag/Tag';

import './countries-scratch-map.scss';

const GEO_URL = '/geo/countries-50m.json';
const MAP_SIZE = 640;
const MAP_CENTER = MAP_SIZE / 2;
const BASE_SCALE = 300;
const MIN_SCALE = 280;
const MAX_SCALE_DESKTOP = BASE_SCALE * 20;
const MAX_SCALE_MOBILE = BASE_SCALE * 100;
const WHEEL_ZOOM_IN = 1.12;
const WHEEL_ZOOM_OUT = 0.89;
const MICRO_STATE_TOUCH_BOOST = 1.4;
const DRAG_THRESHOLD = 4;

const MAP_HINT_DESKTOP =
	'Крутите глобус мышью, приближайте колёсиком. ' +
	'Нажмите на страну или регион — откроется карточка цели. Карта — открытый атлас Natural Earth.';
const MAP_HINT_MOBILE =
	'Вращайте глобус перетаскиванием, масштабируйте щипком двумя пальцами. ' +
	'Нажмите на страну или регион — откроется карточка цели. Карта — открытый атлас Natural Earth.';

const COLOR_STROKE = 'var(--color-scratch-map-stroke)';
const COLOR_LOADING_FALLBACK = 'var(--color-gray-5)';
const COLOR_SPHERE_STROKE = 'var(--color-scratch-map-stroke)';
const COLOR_GRID = 'var(--color-scratch-map-grid)';

interface CountriesScratchMapProps {
	className?: string;
	/** Демо-данные для витрины: без API, без модалки с действиями */
	showcaseCountries?: ScratchMapCountry[];
}

interface TooltipState {
	x: number;
	y: number;
	name: string;
	completed: boolean;
	inList: boolean;
}

interface CountryVisual {
	fill: string;
	completed: boolean;
	inList: boolean;
	country?: ScratchMapCountry;
	tooltipName: string;
}

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

const getPointerDistance = (a: {x: number; y: number}, b: {x: number; y: number}): number => Math.hypot(a.x - b.x, a.y - b.y);

/** Цели из списка «Страны и территории мира»; остальное на карте — нейтральный фон. */
const resolveMapCountry = (
	byMapIso: Map<string, ScratchMapCountry>,
	byMapName: Map<string, ScratchMapCountry>,
	rawIso: string,
	mapName: string
): ScratchMapCountry | undefined => {
	if (rawIso && byMapIso.has(rawIso)) {
		return byMapIso.get(rawIso);
	}
	if (mapName && byMapName.has(mapName)) {
		return byMapName.get(mapName);
	}
	return undefined;
};

const colorKeyForCountry = (country: ScratchMapCountry, rawIso: string): string => country.mapIso || country.iso || rawIso;

const getCountryVisual = (
	byMapIso: Map<string, ScratchMapCountry>,
	byMapName: Map<string, ScratchMapCountry>,
	isoColorIndex: Map<string, number>,
	options: {rawIso: string; mapName: string}
): CountryVisual => {
	const {rawIso, mapName} = options;
	const country = resolveMapCountry(byMapIso, byMapName, rawIso, mapName);
	const inList = Boolean(country);
	const completed = Boolean(country?.completed);
	const colorIso = country ? colorKeyForCountry(country, rawIso) : rawIso;
	let colorIndex = colorIso ? isoColorIndex.get(colorIso) : undefined;
	if (colorIndex === undefined && country) {
		let hash = 0;
		for (let i = 0; i < country.iso.length; i += 1) {
			hash = (hash * 31 + country.iso.charCodeAt(i)) % SCRATCH_MAP_COUNTRY_PALETTE.length;
		}
		colorIndex = hash;
	}
	let fill = SCRATCH_MAP_NEUTRAL_FILL;
	if (inList) {
		if (colorIndex !== undefined) {
			fill = completed ? SCRATCH_MAP_COUNTRY_PALETTE[colorIndex] : SCRATCH_MAP_UNVISITED_PALETTE[colorIndex];
		} else {
			fill = COLOR_LOADING_FALLBACK;
		}
	}
	const tooltipName = country?.name || mapName;

	return {fill, completed, inList, country, tooltipName};
};

export const CountriesScratchMap: FC<CountriesScratchMapProps> = observer((props) => {
	const {className, showcaseCountries} = props;
	const isShowcase = Boolean(showcaseCountries?.length);
	const [block, element] = useBem('countries-scratch-map', className);
	const navigate = useNavigate();
	const {isScreenDesktop} = useScreenSize();

	const mapHintMessage = isScreenDesktop ? MAP_HINT_DESKTOP : MAP_HINT_MOBILE;
	const maxScale = isScreenDesktop ? MAX_SCALE_DESKTOP : MAX_SCALE_MOBILE;
	const microStateBoost = isScreenDesktop ? 1 : MICRO_STATE_TOUCH_BOOST;

	const [countries, setCountries] = useState<ScratchMapCountry[]>([]);
	const [total, setTotal] = useState(0);
	const [completedCount, setCompletedCount] = useState(0);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(false);
	const [tooltip, setTooltip] = useState<TooltipState | null>(null);
	const [selected, setSelected] = useState<ScratchMapCountry | null>(null);
	const [marking, setMarking] = useState(false);
	const [isoColorIndex, setIsoColorIndex] = useState<Map<string, number>>(new Map());

	const [rotation, setRotation] = useState<[number, number]>([-15, -25]);
	const [scale, setScale] = useState(BASE_SCALE);

	const mapRef = useRef<HTMLDivElement>(null);
	const dragRef = useRef<{x: number; y: number; rot: [number, number]} | null>(null);
	const pointersRef = useRef<Map<number, {x: number; y: number}>>(new Map());
	const pinchRef = useRef<{dist: number} | null>(null);
	const movedRef = useRef(false);
	const scaleRef = useRef(scale);
	const rotationRef = useRef(rotation);
	const maxScaleRef = useRef(maxScale);
	scaleRef.current = scale;
	rotationRef.current = rotation;
	maxScaleRef.current = maxScale;

	useEffect(() => {
		setScale((prev) => clamp(prev, MIN_SCALE, maxScale));
	}, [maxScale]);

	useEffect(() => {
		if (showcaseCountries?.length) {
			setCountries(showcaseCountries);
			setTotal(showcaseCountries.length);
			setCompletedCount(showcaseCountries.filter((country) => country.completed).length);
			setLoading(false);
			setError(false);
			return undefined;
		}

		let cancelled = false;
		(async () => {
			try {
				setLoading(true);
				setError(false);
				const data = await mapApi.getScratchMapData();
				if (cancelled) {
					return;
				}
				const loaded = data.countries ?? [];
				setCountries(loaded);
				setTotal(Number(data.total) || loaded.length);
				setCompletedCount(Number(data.completedCount) || loaded.filter((country) => country.completed).length);
			} catch {
				if (!cancelled) {
					setError(true);
				}
			} finally {
				if (!cancelled) {
					setLoading(false);
				}
			}
		})();
		return () => {
			cancelled = true;
		};
	}, [showcaseCountries, UserStore.isAuth]);

	useEffect(() => {
		if (countries.length === 0) {
			return undefined;
		}
		let cancelled = false;
		computeMapColorAssignment(GEO_URL, countries.map((c) => c.mapIso || c.iso).filter(Boolean))
			.then((assignment) => {
				if (!cancelled) {
					setIsoColorIndex(assignment);
				}
			})
			.catch(() => {
				if (!cancelled) {
					setIsoColorIndex(new Map());
				}
			});
		return () => {
			cancelled = true;
		};
	}, [countries]);

	const {byMapIso, byMapName} = useMemo(() => {
		const isoMap = new Map<string, ScratchMapCountry>();
		const nameMap = new Map<string, ScratchMapCountry>();
		countries.forEach((country) => {
			const mapIso = country.mapIso || country.iso;
			if (mapIso) {
				isoMap.set(mapIso, country);
			}
			country.mapNames?.forEach((name) => nameMap.set(name, country));
		});
		return {byMapIso: isoMap, byMapName: nameMap};
	}, [countries]);

	const progressDone = Number(completedCount) || 0;
	const progressTotal = Number(total) || 0;

	const projection = useMemo<GeoProjection>(
		() => geoOrthographic().translate([MAP_CENTER, MAP_CENTER]).scale(scale).rotate([rotation[0], rotation[1], 0]),
		[rotation, scale]
	);

	const projectionConfig = useMemo(() => ({scale, rotate: [rotation[0], rotation[1], 0] as [number, number, number]}), [rotation, scale]);

	const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
		const pointers = pointersRef.current;
		pointers.set(event.pointerId, {x: event.clientX, y: event.clientY});

		if (pointers.size === 1) {
			dragRef.current = {x: event.clientX, y: event.clientY, rot: rotationRef.current};
			pinchRef.current = null;
			movedRef.current = false;
		} else if (pointers.size === 2) {
			dragRef.current = null;
			const pts = [...pointers.values()];
			const dist = getPointerDistance(pts[0], pts[1]);
			if (dist > 0) {
				pinchRef.current = {dist};
				movedRef.current = true;
			}
		}

		setTooltip(null);
	};

	useEffect(() => {
		const clearPointer = (pointerId: number) => {
			const pointers = pointersRef.current;
			pointers.delete(pointerId);

			if (pointers.size < 2) {
				pinchRef.current = null;
			}

			if (pointers.size === 1) {
				const pt = [...pointers.values()][0];
				dragRef.current = {x: pt.x, y: pt.y, rot: rotationRef.current};
			} else if (pointers.size === 0) {
				dragRef.current = null;
			}
		};

		const onMove = (event: PointerEvent) => {
			const pointers = pointersRef.current;
			if (!pointers.has(event.pointerId)) {
				return;
			}

			pointers.set(event.pointerId, {x: event.clientX, y: event.clientY});

			if (pointers.size === 2 && pinchRef.current) {
				event.preventDefault();
				const pts = [...pointers.values()];
				const dist = getPointerDistance(pts[0], pts[1]);
				if (dist > 0 && pinchRef.current.dist > 0) {
					movedRef.current = true;
					const ratio = dist / pinchRef.current.dist;
					setScale((prev) => clamp(prev * ratio, MIN_SCALE, maxScaleRef.current));
					pinchRef.current.dist = dist;
				}
				return;
			}

			const drag = dragRef.current;
			if (!drag) {
				return;
			}
			const dx = event.clientX - drag.x;
			const dy = event.clientY - drag.y;
			if (Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD) {
				movedRef.current = true;
			}
			const sensitivity = BASE_SCALE / scaleRef.current / 2;
			const lambda = drag.rot[0] + dx * sensitivity;
			const phi = clamp(drag.rot[1] - dy * sensitivity, -90, 90);
			setRotation([lambda, phi]);
		};

		const onUp = (event: PointerEvent) => {
			clearPointer(event.pointerId);
		};

		const onCancel = (event: PointerEvent) => {
			clearPointer(event.pointerId);
		};

		window.addEventListener('pointermove', onMove);
		window.addEventListener('pointerup', onUp);
		window.addEventListener('pointercancel', onCancel);
		return () => {
			window.removeEventListener('pointermove', onMove);
			window.removeEventListener('pointerup', onUp);
			window.removeEventListener('pointercancel', onCancel);
		};
	}, []);

	const applyZoom = useCallback((deltaY: number) => {
		setScale((prev) => clamp(prev * (deltaY < 0 ? WHEEL_ZOOM_IN : WHEEL_ZOOM_OUT), MIN_SCALE, maxScaleRef.current));
	}, []);

	useEffect(() => {
		const node = mapRef.current;
		if (!node || loading || error || total === 0) {
			return undefined;
		}
		const onWheel = (event: WheelEvent) => {
			event.preventDefault();
			applyZoom(event.deltaY);
		};
		node.addEventListener('wheel', onWheel, {passive: false});
		return () => node.removeEventListener('wheel', onWheel);
	}, [loading, error, total, applyZoom]);

	useEffect(() => {
		const node = mapRef.current;
		if (!node || loading || error || total === 0) {
			return undefined;
		}

		const getTouchDistance = (touches: TouchList): number => {
			if (touches.length < 2) {
				return 0;
			}
			return getPointerDistance({x: touches[0].clientX, y: touches[0].clientY}, {x: touches[1].clientX, y: touches[1].clientY});
		};

		let touchPinch: {dist: number} | null = null;

		const onTouchStart = (event: TouchEvent) => {
			if (event.touches.length !== 2) {
				return;
			}
			dragRef.current = null;
			pointersRef.current.clear();
			pinchRef.current = null;
			const dist = getTouchDistance(event.touches);
			if (dist > 0) {
				touchPinch = {dist};
				movedRef.current = true;
			}
			event.preventDefault();
		};

		const onTouchMove = (event: TouchEvent) => {
			if (event.touches.length !== 2 || !touchPinch) {
				return;
			}
			event.preventDefault();
			const dist = getTouchDistance(event.touches);
			if (dist > 0 && touchPinch.dist > 0) {
				movedRef.current = true;
				const ratio = dist / touchPinch.dist;
				setScale((prev) => clamp(prev * ratio, MIN_SCALE, maxScaleRef.current));
				touchPinch.dist = dist;
			}
		};

		const onTouchEnd = (event: TouchEvent) => {
			if (event.touches.length < 2) {
				touchPinch = null;
			}
			if (event.touches.length === 0) {
				pointersRef.current.clear();
				dragRef.current = null;
				pinchRef.current = null;
			}
		};

		node.addEventListener('touchstart', onTouchStart, {passive: false});
		node.addEventListener('touchmove', onTouchMove, {passive: false});
		node.addEventListener('touchend', onTouchEnd);
		node.addEventListener('touchcancel', onTouchEnd);
		return () => {
			node.removeEventListener('touchstart', onTouchStart);
			node.removeEventListener('touchmove', onTouchMove);
			node.removeEventListener('touchend', onTouchEnd);
			node.removeEventListener('touchcancel', onTouchEnd);
		};
	}, [loading, error, total]);

	const handleCountryClick = (country?: ScratchMapCountry) => {
		if (movedRef.current || !country || isShowcase) {
			return;
		}
		setSelected(country);
	};

	const handleToggleComplete = useCallback(async () => {
		if (!selected || marking) {
			return;
		}
		const done = !selected.completed;
		setMarking(true);
		try {
			const response = await markGoal(selected.code, done);
			if (response?.success) {
				setCountries((prev) => prev.map((c) => (c.code === selected.code ? {...c, completed: done} : c)));
				setCompletedCount((prev) => clamp(prev + (done ? 1 : -1), 0, total));
				setSelected((prev) => (prev ? {...prev, completed: done} : prev));
			}
		} finally {
			setMarking(false);
		}
	}, [selected, marking, total]);

	const showTooltip = (event: React.MouseEvent, visual: CountryVisual) => {
		if (dragRef.current) {
			return;
		}
		const rect = mapRef.current?.getBoundingClientRect();
		setTooltip({
			x: event.clientX - (rect?.left ?? 0),
			y: event.clientY - (rect?.top ?? 0),
			name: visual.tooltipName,
			completed: visual.completed,
			inList: visual.inList,
		});
	};

	const renderGeography = (geo: any) => {
		const mapName = geo.properties?.name || '';
		const rawIso = resolveGeoIso(geo);
		const visual = getCountryVisual(byMapIso, byMapName, isoColorIndex, {rawIso, mapName});
		const colorIso = visual.country ? colorKeyForCountry(visual.country, rawIso) : rawIso;
		const microTransform = visual.inList && colorIso ? getMicroStateTransform(geo, colorIso, projection, microStateBoost) : undefined;
		const strokeWidth = microTransform ? 0.2 : 0.35;

		return (
			<g key={geo.rsmKey} transform={microTransform}>
				<Geography
					geography={geo}
					onMouseMove={(event) => showTooltip(event, visual)}
					onMouseLeave={() => setTooltip(null)}
					onClick={() => handleCountryClick(visual.country)}
					style={{
						default: {
							fill: visual.fill,
							stroke: COLOR_STROKE,
							strokeWidth,
							outline: 'none',
							cursor: visual.inList ? 'pointer' : 'grab',
							pointerEvents: 'auto',
						},
						hover: {
							fill: visual.inList ? visual.fill : SCRATCH_MAP_NEUTRAL_FILL,
							stroke: COLOR_STROKE,
							strokeWidth: visual.inList ? strokeWidth + 0.25 : strokeWidth,
							outline: 'none',
							opacity: visual.inList ? 0.82 : 1,
							cursor: visual.inList ? 'pointer' : 'grab',
						},
						pressed: {
							fill: visual.fill,
							stroke: COLOR_STROKE,
							strokeWidth,
							outline: 'none',
						},
					}}
				/>
			</g>
		);
	};

	if (loading) {
		return (
			<div className={block()}>
				<div className={element('loading')}>
					<Loader isLoading />
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className={block()}>
				<div className={element('empty')}>
					<h3>Не удалось загрузить карту</h3>
					<p>Попробуйте обновить страницу позже.</p>
				</div>
			</div>
		);
	}

	if (total === 0) {
		return (
			<div className={block()}>
				<div className={element('empty')}>
					<h3>Карта стран недоступна</h3>
					<p>Список «Глобус без пробелов» ещё не наполнен. Запустите populate_scratch_map_list на сервере.</p>
				</div>
			</div>
		);
	}

	return (
		<div className={block({showcase: isShowcase})}>
			<div className={element('header')}>
				{!isShowcase && (
					<Banner type="info" className={element('hint')} title="Как пользоваться картой" message={<p>{mapHintMessage}</p>} />
				)}
				<InfoGoal
					className={element('info')}
					items={[]}
					progress
					horizontal
					progressData={{
						completed: progressDone,
						total: progressTotal,
					}}
				/>
			</div>

			<div ref={mapRef} className={element('map')} onPointerDown={handlePointerDown} onMouseLeave={() => setTooltip(null)}>
				<ComposableMap
					projection="geoOrthographic"
					projectionConfig={projectionConfig}
					width={MAP_SIZE}
					height={MAP_SIZE}
					style={{width: '100%', height: 'auto', touchAction: 'none'}}
				>
					<Sphere id="globe-sphere" fill={SCRATCH_MAP_GLOBE_FILL} stroke={COLOR_SPHERE_STROKE} strokeWidth={0.5} />
					<Graticule stroke={COLOR_GRID} strokeWidth={0.3} />
					<Geographies geography={GEO_URL}>
						{({geographies}: {geographies: any[]}) => geographies.map(renderGeography)}
					</Geographies>
				</ComposableMap>

				{tooltip && tooltip.name && (
					<div className={element('tooltip')} style={{left: tooltip.x + 12, top: tooltip.y + 12}}>
						<span className={element('tooltip-name')}>{tooltip.name}</span>
						{tooltip.inList ? (
							<span className={element('tooltip-status', {completed: tooltip.completed})}>
								{tooltip.completed ? 'Выполнено' : 'Не выполнено'}
							</span>
						) : (
							<span className={element('tooltip-neutral')}>Не в челлендже</span>
						)}
					</div>
				)}
			</div>

			<div className={element('legend')}>
				<div className={element('legend-item')}>
					<span className={element('legend-color', {completed: true})} />
					<span>Отмеченные страны</span>
				</div>
				<div className={element('legend-item')}>
					<span className={element('legend-color', {unvisited: true})} />
					<span>Здесь вы ещё не были</span>
				</div>
			</div>

			{selected && !isShowcase && (
				<Modal isOpen onClose={() => setSelected(null)} size="small">
					<div className={element('card')}>
						<div
							className={element('card-image', {placeholder: !selected.image})}
							style={selected.image ? {backgroundImage: `url(${selected.image})`} : undefined}
						/>
						<div className={element('card-body')}>
							<div className={element('card-head')}>
								<h3 className={element('card-title')}>{selected.name}</h3>
								<Tag
									className={element('card-tag')}
									theme="light"
									text={selected.completed ? 'Выполнено' : 'Не выполнено'}
									style={
										selected.completed
											? {
													background: 'var(--color-green-3)',
													borderColor: 'var(--color-green-3)',
													color: 'var(--color-white)',
											  }
											: {
													background: 'var(--color-secondary)',
													borderColor: 'var(--color-border)',
													color: 'var(--color-text-secondary)',
											  }
									}
								/>
							</div>
							{selected.description && <p className={element('card-description')}>{selected.description}</p>}
							<div className={element('card-actions')}>
								{UserStore.isAuth && (
									<Button
										theme={selected.completed ? 'gray' : 'green'}
										icon={selected.completed ? 'cross' : 'done'}
										onClick={handleToggleComplete}
										loading={marking}
										loadingText="Сохранение…"
									>
										{selected.completed ? 'Снять отметку' : 'Отметить выполненной'}
									</Button>
								)}
								<Button theme="blue-light" icon="travel" onClick={() => navigate(`/goals/${selected.code}`)}>
									Перейти к цели
								</Button>
							</div>
						</div>
					</div>
				</Modal>
			)}
		</div>
	);
});

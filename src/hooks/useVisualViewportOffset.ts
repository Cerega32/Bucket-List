import {useEffect} from 'react';

const CSS_VAR = '--safari-viewport-offset';

/**
 * Safari iOS: dynamic address bar shifts the visual viewport; fixed `top: 0` leaves a gap.
 * Writes offsetTop into a CSS variable for header/layout positioning.
 */
export const useVisualViewportOffset = (): void => {
	useEffect(() => {
		const viewport = window.visualViewport;
		if (!viewport) return undefined;

		const update = () => {
			const offset = Math.max(0, Math.round(viewport.offsetTop));
			document.documentElement.style.setProperty(CSS_VAR, `${offset}px`);
		};

		update();
		viewport.addEventListener('resize', update);
		viewport.addEventListener('scroll', update);
		window.addEventListener('scroll', update, {passive: true});

		return () => {
			viewport.removeEventListener('resize', update);
			viewport.removeEventListener('scroll', update);
			window.removeEventListener('scroll', update);
			document.documentElement.style.removeProperty(CSS_VAR);
		};
	}, []);
};

import {FC, useEffect} from 'react';
import Lightbox, {LightboxExternalProps} from 'yet-another-react-lightbox';

/** Открытый портал YARL (совпадает с классами из yet-another-react-lightbox/styles.css) */
const YARL_PORTAL_SELECTOR = '.yarl__portal.yarl__portal_open';

function findScrollParent(node: HTMLElement | null, boundary: HTMLElement): HTMLElement | null {
	let current = node;
	while (current && current !== boundary) {
		const {overflowY} = getComputedStyle(current);
		if (/(auto|scroll|overlay)/.test(overflowY) && current.scrollHeight > current.clientHeight) {
			return current;
		}
		current = current.parentElement;
	}
	return current && current !== boundary ? current : null;
}

function useLightboxBackgroundScrollLock(isOpen: boolean) {
	useEffect(() => {
		if (!isOpen) {
			return;
		}

		const getBoundary = () => document.querySelector(YARL_PORTAL_SELECTOR) as HTMLElement | null;

		const preventBackgroundScroll = (e: WheelEvent | TouchEvent) => {
			const target = e.target as Node;
			if (e instanceof TouchEvent) {
				const targetElement = target instanceof HTMLElement ? target : null;
				if (targetElement?.closest('input[type="range"], [role="slider"]')) {
					return;
				}
			}

			const boundary = getBoundary();
			if (!boundary?.contains(target)) {
				e.preventDefault();
				return;
			}

			const el = findScrollParent(e.target as HTMLElement, boundary);
			if (!el) {
				e.preventDefault();
				return;
			}
			if (e instanceof WheelEvent) {
				const {scrollTop, scrollHeight, clientHeight} = el;
				const atTop = scrollTop <= 0;
				const atBottom = scrollTop + clientHeight >= scrollHeight;
				if ((atTop && e.deltaY < 0) || (atBottom && e.deltaY > 0)) {
					e.preventDefault();
				}
			}
		};

		document.addEventListener('wheel', preventBackgroundScroll, {passive: false});
		document.addEventListener('touchmove', preventBackgroundScroll, {passive: false});

		return () => {
			document.removeEventListener('wheel', preventBackgroundScroll);
			document.removeEventListener('touchmove', preventBackgroundScroll);
		};
	}, [isOpen]);
}

/**
 * Лайтбокс без yarl__no_scroll на body: полоса прокрутки страницы остаётся, фон не крутится
 * (как у Modal — перехват wheel/touchmove).
 */
export const LightboxWithScrollLock: FC<LightboxExternalProps> = ({open, noScroll, ...rest}) => {
	useLightboxBackgroundScrollLock(!!open);

	return <Lightbox {...rest} open={open} noScroll={{...noScroll, disabled: true}} />;
};

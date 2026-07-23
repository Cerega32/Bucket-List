export interface ScrollToAnchorOptions {
	/** Offset from the top of the element (negative = leave room for fixed header). */
	offset?: number;
	behavior?: ScrollBehavior;
	/** How long to wait for the element to appear in the DOM (e.g. after React re-render). */
	maxWaitMs?: number;
}

/**
 * Smooth-scroll to an element by id. Retries briefly if the node is not mounted yet
 * (common after pagination: list is swapped for a skeleton, then remounted).
 * Does not touch history / React Router — safe with back-button scroll restoration.
 */
export const scrollToAnchor = (id: string, options: ScrollToAnchorOptions = {}): void => {
	const {offset = -150, behavior = 'smooth', maxWaitMs = 1500} = options;
	const startedAt = Date.now();

	const run = () => {
		const el = document.getElementById(id);
		if (!el) {
			if (Date.now() - startedAt < maxWaitMs) {
				requestAnimationFrame(run);
			}
			return;
		}

		const top = Math.max(0, el.getBoundingClientRect().top + window.scrollY + offset);
		window.scrollTo({top, behavior});
	};

	// Double rAF: wait until after React commits DOM updates from setState in goToPage.
	requestAnimationFrame(() => {
		requestAnimationFrame(run);
	});
};

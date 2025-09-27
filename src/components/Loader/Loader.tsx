import {FC} from 'react';

import {useBem} from '@/hooks/useBem';

import './loader.scss';

interface LoaderProps {
	isLoading: boolean;
	children?: React.ReactNode;
	className?: string;
	isPageLoader?: boolean;
}

export const Loader: FC<LoaderProps> = ({isLoading, children, className, isPageLoader}) => {
	const [block, element] = useBem('loader');

	if (!isLoading && !children) return null;

	return (
		<div className={block({page: isPageLoader})}>
			{children && <div className={element('content', {blurred: isLoading, page: isPageLoader}, className)}>{children}</div>}

			{isLoading && (
				<div className={element('overlay')}>
					<svg width="80" height="80" viewBox="-10 -10 50 46" fill="none" xmlns="http://www.w3.org/2000/svg" overflow="visible">
						<g className={element('aim')}>
							<circle cx="11.3667" cy="14.56" r="11.25" fill="#E05A4F" />
							<circle cx="11.3667" cy="14.56" r="8.25" fill="white" />
							<circle cx="11.3667" cy="14.56" r="4.25" fill="#E05A4F" />
						</g>

						<g className={element('dart')}>
							<rect
								x="10.33"
								y="13.48"
								width="18.63"
								height="2.077"
								rx="1.0385"
								transform="rotate(-30.16 10.33 13.48)"
								fill="white"
							/>
							<path
								d="M21.2094 9.564L25.0427 11.212C25.6205 11.4604 26.2818 11.4201 26.827 11.1033L30.4352 9.00667L25.6838 6.964L21.2094 9.564Z"
								fill="#3A89D8"
							/>
							<path
								d="M20.176 7.76267L20.6746 3.59748C20.7498 2.96968 21.1151 2.41344 21.6603 2.09662L25.2685 3.64657e-06L24.6505 5.16267L20.176 7.76267Z"
								fill="#3A89D8"
							/>
						</g>
					</svg>
				</div>
			)}
		</div>
	);
};

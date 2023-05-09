import {FC} from 'react';
import useScreenSize from '../../hooks/useScreenSize';

export const PageMain: FC = () => {
	const {
		isScreenDesktop,
		isScreenMobile,
		isScreenSmallTablet,
		isScreenTablet,
	} = useScreenSize();
	return (
		<div>
			{isScreenMobile && <p>Mobile view</p>}
			{isScreenSmallTablet && <p>Tablet view</p>}
			{isScreenTablet && <p>Desktop view</p>}
			{isScreenDesktop && <p>Large desktop view</p>}
		</div>
	);
};

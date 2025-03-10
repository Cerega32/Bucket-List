export type ScreenSizeCode = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface WasModeChange {
	isWasModeChange: boolean;
}

interface ScreenModeMobile {
	isScreenMobile: true;
	isScreenSmallTablet: false;
	isScreenTablet: false;
	isScreenDesktop: false;
}

interface ScreenModeTablet {
	isScreenMobile: false;
	isScreenSmallTablet: false;
	isScreenTablet: true;
	isScreenDesktop: false;
}

interface ScreenModeSmallTablet {
	isScreenMobile: false;
	isScreenSmallTablet: true;
	isScreenTablet: true;
	isScreenDesktop: false;
}

interface ScreenModeDesktop {
	isScreenMobile: false;
	isScreenSmallTablet: false;
	isScreenTablet: false;
	isScreenDesktop: true;
}

export type ScreenMode = ScreenModeMobile | ScreenModeTablet | ScreenModeSmallTablet | ScreenModeDesktop;

interface ScreenModeMobileWithSize extends ScreenModeMobile, WasModeChange {
	mode: 'xs' | 'sm';
}

interface ScreenModeTabletWithSize extends ScreenModeTablet, WasModeChange {
	mode: 'md' | 'lg';
}

interface ScreenModeDesktopWithSize extends ScreenModeDesktop, WasModeChange {
	mode: 'xl';
}

export type ScreenModeWithSize = ScreenModeDesktopWithSize | ScreenModeMobileWithSize | ScreenModeTabletWithSize;

export type ScreenSizeCode = 'xxs' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface WasModeChange {
	isWasModeChange: boolean;
}

interface ScreenModeSmallMobile {
	isScreenSmallMobile: true;
	isScreenMobile: true;
	isScreenXs: true;
	isScreenSmallTablet: false;
	isScreenTablet: false;
	isScreenDesktop: false;
}

interface ScreenModeXs {
	isScreenSmallMobile: true;
	isScreenMobile: true;
	isScreenXs: false;
	isScreenSmallTablet: false;
	isScreenTablet: false;
	isScreenDesktop: false;
}

interface ScreenModeMobile {
	isScreenMobile: true;
	isScreenSmallMobile: false;
	isScreenXs: false;
	isScreenSmallTablet: false;
	isScreenTablet: false;
	isScreenDesktop: false;
}

interface ScreenModeTablet {
	isScreenMobile: false;
	isScreenSmallMobile: false;
	isScreenXs: false;
	isScreenSmallTablet: false;
	isScreenTablet: true;
	isScreenDesktop: false;
}

interface ScreenModeSmallTablet {
	isScreenMobile: false;
	isScreenSmallMobile: false;
	isScreenXs: false;
	isScreenSmallTablet: true;
	isScreenTablet: true;
	isScreenDesktop: false;
}

interface ScreenModeDesktop {
	isScreenMobile: false;
	isScreenSmallMobile: false;
	isScreenXs: false;
	isScreenSmallTablet: false;
	isScreenTablet: false;
	isScreenDesktop: true;
}

export type ScreenMode =
	| ScreenModeSmallMobile
	| ScreenModeXs
	| ScreenModeMobile
	| ScreenModeTablet
	| ScreenModeSmallTablet
	| ScreenModeDesktop;

interface ScreenModeMobileWithSize extends ScreenModeMobile, WasModeChange {
	mode: 'sm';
}

interface ScreenModeXsWithSize extends ScreenModeXs, WasModeChange {
	mode: 'xs';
}

interface ScreenModeSmallMobileWithSize extends ScreenModeSmallMobile, WasModeChange {
	mode: 'xxs';
}

interface ScreenModeTabletWithSize extends ScreenModeTablet, WasModeChange {
	mode: 'md' | 'lg';
}

interface ScreenModeDesktopWithSize extends ScreenModeDesktop, WasModeChange {
	mode: 'xl';
}

export type ScreenModeWithSize =
	| ScreenModeDesktopWithSize
	| ScreenModeMobileWithSize
	| ScreenModeXsWithSize
	| ScreenModeSmallMobileWithSize
	| ScreenModeTabletWithSize;

import {DELETE, GET, POST} from './fetch/requests';

// Получаем базовый URL и токен из конфигурации
const API_BASE_URL = process.env['REACT_APP_API_URL'] || 'http://localhost:8000';

// Функция для получения токена аутентификации
const getAuthToken = () => {
	return localStorage.getItem('authToken') || '';
};

// Типы для работы с картами
export interface Location {
	id: number;
	name: string;
	country: string;
	city?: string;
	latitude: number;
	longitude: number;
	place_type: string;
	description?: string;
	address?: string;
	created_at: string;
}

export interface Country {
	id: number;
	name: string;
	name_en: string;
	iso_code: string;
	continent: string;
	color_hex: string;
}

export interface UserVisitedLocation {
	id: number;
	location: Location;
	goal_title?: string;
	visited_at: string;
	notes?: string;
}

export interface UserVisitedCountry {
	id: number;
	country: Country;
	visited_at: string;
	notes?: string;
}

export interface Goal {
	id: number;
	title: string;
	category: any;
	complexity: string;
	image?: string;
	description: string;
	short_description: string;
	code: string;
	location?: Location;
	added_by_user: boolean;
	completed_by_user: boolean;
	user_visited_location: boolean;
	created_at: string;
}

export interface MapData {
	goals: Goal[];
	visited_locations: UserVisitedLocation[];
	list_title?: string;
	category_name?: string;
}

// API функции
export const mapApi = {
	// Получить данные карты пользователя
	getUserMapData: async (): Promise<MapData> => {
		const response = await GET('maps/user', {auth: true, showSuccessNotification: false});

		if (!response.success) {
			throw new Error(response.errors || 'Failed to fetch user map data');
		}

		return response.data;
	},

	// Получить данные карты для списка целей
	getGoalListMapData: async (listCode: string): Promise<MapData> => {
		const response = await GET(`maps/list/${listCode}`, {auth: true, showSuccessNotification: false});

		if (!response.success) {
			throw new Error(response.errors || 'Failed to fetch goal list map data');
		}

		return response.data;
	},

	// Получить данные карты для категории
	getCategoryMapData: async (categoryCode: string): Promise<MapData> => {
		const response = await GET(`maps/category/${categoryCode}`, {auth: true, showSuccessNotification: false});

		if (!response.success) {
			throw new Error(response.errors || 'Failed to fetch category map data');
		}

		return response.data;
	},

	// Отметить место как посещенное
	markLocationVisited: async (locationId: number, goalId?: number, notes?: string): Promise<UserVisitedLocation> => {
		const response = await POST('maps/locations/visit', {
			auth: true,
			body: {
				location_id: locationId,
				goal_id: goalId,
				notes: notes || '',
			},
		});

		if (!response.success) {
			throw new Error(response.errors || 'Failed to mark location as visited');
		}

		return response.data;
	},

	// Убрать отметку о посещении места
	unmarkLocationVisited: async (locationId: number): Promise<void> => {
		const response = await DELETE(`maps/locations/${locationId}/unvisit`, {auth: true});

		if (!response.success) {
			throw new Error(response.errors || 'Failed to unmark location as visited');
		}
	},

	// Поиск мест
	searchLocations: async (query: string): Promise<{results: Location[]}> => {
		const response = await POST('maps/locations/search', {
			auth: true,
			body: {query},
			showSuccessNotification: false,
		});

		if (!response.success) {
			throw new Error(response.errors || 'Failed to search locations');
		}

		return response.data;
	},

	// Создать новое место
	createLocation: async (locationData: Partial<Location>): Promise<Location> => {
		const response = await fetch(`${API_BASE_URL}/api/maps/locations/create/`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Token ${getAuthToken()}`,
			},
			body: JSON.stringify(locationData),
		});

		if (!response.ok) {
			throw new Error('Failed to create location');
		}

		return response.json();
	},

	// Получить список всех стран
	getCountriesList: async (): Promise<Country[]> => {
		const response = await GET('maps/countries', {auth: true, showSuccessNotification: false});

		if (!response.success) {
			throw new Error(response.errors || 'Failed to fetch countries list');
		}

		return response.data;
	},

	// Получить список посещенных стран пользователя
	getUserVisitedCountries: async (): Promise<UserVisitedCountry[]> => {
		const response = await GET('maps/countries/visited', {auth: true, showSuccessNotification: false});

		if (!response.success) {
			throw new Error(response.errors || 'Failed to fetch visited countries');
		}

		return response.data;
	},

	// Отметить страну как посещенную
	markCountryVisited: async (countryId: number, notes?: string): Promise<UserVisitedCountry> => {
		const response = await POST('maps/countries/visit', {
			auth: true,
			body: {
				country_id: countryId,
				notes: notes || '',
			},
		});

		if (!response.success) {
			throw new Error(response.errors || 'Failed to mark country as visited');
		}

		return response.data;
	},

	// Убрать отметку о посещении страны
	unmarkCountryVisited: async (countryId: number): Promise<void> => {
		const response = await DELETE(`maps/countries/${countryId}/unvisit`, {auth: true});

		if (!response.success) {
			throw new Error(response.errors || 'Failed to unmark country as visited');
		}
	},
};

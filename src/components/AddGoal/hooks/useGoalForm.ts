import {useState} from 'react';

import {ILocation} from '@/typings/goal';

interface UseGoalFormReturn {
	// Основные поля
	title: string;
	setTitle: (value: string) => void;
	description: string;
	setDescription: (value: string) => void;
	activeComplexity: number | null;
	setActiveComplexity: (value: number | null) => void;
	deadline: string;
	setDeadline: (value: string) => void;
	estimatedTime: string;
	setEstimatedTime: (value: string) => void;

	// Изображение
	image: File | null;
	setImage: (value: File | null) => void;
	imageUrl: string | null;
	setImageUrl: (value: string | null) => void;

	// Категории
	activeCategory: number | null;
	setActiveCategory: (value: number | null) => void;
	activeSubcategory: number | null;
	setActiveSubcategory: (value: number | null) => void;

	// Место
	selectedGoalLocation: Partial<ILocation> | null;
	setSelectedGoalLocation: (value: Partial<ILocation> | null) => void;

	// Внешние поля
	externalGoalFields: any;
	setExternalGoalFields: (value: any) => void;

	// Состояния загрузки
	isLoading: boolean;
	setIsLoading: (value: boolean) => void;

	// Регулярность
	isRegular: boolean;
	setIsRegular: (value: boolean) => void;
	regularFrequency: 'daily' | 'weekly' | 'custom';
	setRegularFrequency: (value: 'daily' | 'weekly' | 'custom') => void;
	weeklyFrequency: number;
	setWeeklyFrequency: (value: number) => void;
	durationType: 'days' | 'weeks' | 'until_date' | 'indefinite';
	setDurationType: (value: 'days' | 'weeks' | 'until_date' | 'indefinite') => void;
	durationValue: number;
	setDurationValue: (value: number) => void;
	regularEndDate: string;
	setRegularEndDate: (value: string) => void;
	allowSkipDays: number;
	setAllowSkipDays: (value: number) => void;
	resetOnSkip: boolean;
	setResetOnSkip: (value: boolean) => void;

	// Утилиты
	resetForm: () => void;
}

export const useGoalForm = (): UseGoalFormReturn => {
	// Основные поля
	const [title, setTitle] = useState('');
	const [description, setDescription] = useState('');
	const [activeComplexity, setActiveComplexity] = useState<number | null>(1);
	const [deadline, setDeadline] = useState<string>('');
	const [estimatedTime, setEstimatedTime] = useState<string>('');

	// Изображение
	const [image, setImage] = useState<File | null>(null);
	const [imageUrl, setImageUrl] = useState<string | null>(null);

	// Категории
	const [activeCategory, setActiveCategory] = useState<number | null>(null);
	const [activeSubcategory, setActiveSubcategory] = useState<number | null>(null);

	// Место
	const [selectedGoalLocation, setSelectedGoalLocation] = useState<Partial<ILocation> | null>(null);

	// Внешние поля
	const [externalGoalFields, setExternalGoalFields] = useState<any>(null);

	// Состояния загрузки
	const [isLoading, setIsLoading] = useState(false);

	// Регулярность
	const [isRegular, setIsRegular] = useState(false);
	const [regularFrequency, setRegularFrequency] = useState<'daily' | 'weekly' | 'custom'>('daily');
	const [weeklyFrequency, setWeeklyFrequency] = useState<number>(3);
	const [durationType, setDurationType] = useState<'days' | 'weeks' | 'until_date' | 'indefinite'>('days');
	const [durationValue, setDurationValue] = useState<number>(30);
	const [regularEndDate, setRegularEndDate] = useState<string>('');
	const [allowSkipDays, setAllowSkipDays] = useState<number>(0);
	const [resetOnSkip, setResetOnSkip] = useState<boolean>(true);

	const resetForm = () => {
		setTitle('');
		setDescription('');
		setActiveComplexity(null);
		setActiveCategory(null);
		setActiveSubcategory(null);
		setDeadline('');
		setEstimatedTime('');
		setImage(null);
		setImageUrl(null);
		setExternalGoalFields(null);
		setSelectedGoalLocation(null);
		// Сброс настроек регулярности
		setIsRegular(false);
		setRegularFrequency('daily');
		setWeeklyFrequency(3);
		setDurationType('days');
		setDurationValue(30);
		setRegularEndDate('');
		setAllowSkipDays(0);
		setResetOnSkip(true);
	};

	return {
		// Основные поля
		title,
		setTitle,
		description,
		setDescription,
		activeComplexity,
		setActiveComplexity,
		deadline,
		setDeadline,
		estimatedTime,
		setEstimatedTime,

		// Изображение
		image,
		setImage,
		imageUrl,
		setImageUrl,

		// Категории
		activeCategory,
		setActiveCategory,
		activeSubcategory,
		setActiveSubcategory,

		// Место
		selectedGoalLocation,
		setSelectedGoalLocation,

		// Внешние поля
		externalGoalFields,
		setExternalGoalFields,

		// Состояния загрузки
		isLoading,
		setIsLoading,

		// Регулярность
		isRegular,
		setIsRegular,
		regularFrequency,
		setRegularFrequency,
		weeklyFrequency,
		setWeeklyFrequency,
		durationType,
		setDurationType,
		durationValue,
		setDurationValue,
		regularEndDate,
		setRegularEndDate,
		allowSkipDays,
		setAllowSkipDays,
		resetOnSkip,
		setResetOnSkip,

		// Утилиты
		resetForm,
	};
};

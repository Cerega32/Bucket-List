import Cookies from 'js-cookie';
import {makeAutoObservable} from 'mobx';

import {IGoal, IShortGoal} from '@/typings/goal';
import {IList} from '@/typings/list';
import {IUserInfo} from '@/typings/user';

interface IAddedGoals {
	goals: Array<IShortGoal>;
	totalAdded: number;
}

interface IAddedLists {
	lists: Array<IList>;
	totalAdded: number;
}

export interface ICategoryGoals {
	data: Array<IGoal>;
	countCompleted: number;
}

export interface IMainGoals {
	easyGoals: ICategoryGoals;
	mediumGoals: ICategoryGoals;
	hardGoals: ICategoryGoals;
}

interface IUserStore {
	isAuth: boolean;
	name: string;
	userInfo: IUserInfo;
	addedGoals: IAddedGoals;
	addedLists: IAddedLists;
	mainGoals: IMainGoals;
}

class Store implements IUserStore {
	isAuth = !!Cookies.get('token');

	name = Cookies.get('name') || '';

	avatar = Cookies.get('avatar') || '';

	emailConfirmed = Cookies.get('email_confirmed') === 'true';

	email = Cookies.get('email') || '';

	userInfo: IUserInfo = {
		avatar: Cookies.get('avatar') || '',
		email: '',
		name: '',
		id: 0,
		username: '',
		firstName: '',
		lastName: '',
		country: '',
		coverImage: '',
		aboutMe: '',
		totalAddedGoals: 0,
		totalCompletedGoals: 0,
		totalCompletedLists: 0,
		totalAddedLists: 0,
		totalAchievements: 0,
	};

	userSelf: IUserInfo = {
		avatar: Cookies.get('avatar') || '',
		email: '',
		name: '',
		id: +(Cookies.get('user-id') || 0),
		username: '',
		firstName: '',
		lastName: '',
		country: '',
		coverImage: '',
		aboutMe: '',
		totalAddedGoals: 0,
		totalCompletedGoals: parseInt(Cookies.get('user_total_completed_goals') || '0', 10),
		totalCompletedLists: 0,
		totalAddedLists: 0,
		totalAchievements: 0,
		subscriptionType: (Cookies.get('subscription_type') as 'free' | 'premium') || undefined,
		level: parseInt(Cookies.get('user_level') || '0', 10) || undefined,
	};

	addedGoals: IAddedGoals = {goals: [], totalAdded: 0};

	addedLists: IAddedLists = {lists: [], totalAdded: 0};

	mainGoals: IMainGoals = {
		easyGoals: {data: [], countCompleted: 0},
		mediumGoals: {data: [], countCompleted: 0},
		hardGoals: {data: [], countCompleted: 0},
	};

	constructor() {
		makeAutoObservable(this);
	}

	setIsAuth = (isAuth: boolean) => {
		this.isAuth = isAuth;
	};

	setName = (name: string) => {
		this.name = name;
	};

	setUserInfo = (userInfo: IUserInfo) => {
		this.userInfo = userInfo;
		if (userInfo.isEmailConfirmed !== undefined) {
			this.setEmailConfirmed(userInfo.isEmailConfirmed);
		}
		if (userInfo.email) {
			this.setEmail(userInfo.email);
		}
	};

	setUserSelf = (userSelf: IUserInfo) => {
		this.userSelf = userSelf;
		if (userSelf.isEmailConfirmed !== undefined) {
			this.setEmailConfirmed(userSelf.isEmailConfirmed);
		}
		if (userSelf.email) {
			this.setEmail(userSelf.email);
		}
		// Сохраняем в куки для отображения до следующей загрузки профиля
		if (userSelf.subscriptionType) {
			Cookies.set('subscription_type', userSelf.subscriptionType);
		} else {
			Cookies.remove('subscription_type');
		}
		Cookies.set('user_total_completed_goals', String(userSelf.totalCompletedGoals ?? 0));
		const {level} = userSelf;
		if (level != null) {
			Cookies.set('user_level', String(level));
		} else {
			Cookies.remove('user_level');
		}
	};

	setAddedGoals = (addedGoals: IAddedGoals) => {
		this.addedGoals = addedGoals;
	};

	setAddedLists = (addedLists: IAddedLists) => {
		this.addedLists = addedLists;
	};

	setMainGoals = (mainGoals: IMainGoals) => {
		this.mainGoals = mainGoals;
	};

	setAvatar = (avatar: string) => {
		this.avatar = avatar;
	};

	setEmailConfirmed = (emailConfirmed: boolean) => {
		this.emailConfirmed = emailConfirmed;
		if (emailConfirmed) {
			Cookies.set('email_confirmed', 'true');
		} else {
			Cookies.remove('email_confirmed');
		}
	};

	setEmail = (email: string) => {
		this.email = email;
		if (email) {
			Cookies.set('email', email);
		} else {
			Cookies.remove('email');
		}
	};
}

export const UserStore = new Store();

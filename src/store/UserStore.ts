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
}

export const UserStore = new Store();

import {makeAutoObservable} from 'mobx';
import Cookies from 'js-cookie';
import {IUserInfo} from '@/typings/user';
import {IShortGoal} from '@/typings/goal';
import {IList} from '@/typings/list';

interface IAddedGoals {
	goals: Array<IShortGoal>;
	totalAdded: number;
}

interface IAddedLists {
	lists: Array<IList>;
	totalAdded: number;
}

interface IUserStore {
	isAuth: boolean;
	name: string;
	userInfo: IUserInfo;
	addedGoals: IAddedGoals;
	addedLists: IAddedLists;
}

class Store implements IUserStore {
	isAuth = !!Cookies.get('token');

	name = Cookies.get('name') || '';

	userInfo: IUserInfo = {
		avatar: Cookies.get('avatar') || '',
		email: '',
		name: '',
		id: 1,
		username: '',
		totalAddedGoals: 0,
		totalCompletedGoals: 0,
	};

	addedGoals: IAddedGoals = {goals: [], totalAdded: 0};

	addedLists: IAddedLists = {lists: [], totalAdded: 0};

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
}

export const UserStore = new Store();

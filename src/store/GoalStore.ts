import {IComment, IComments} from '@/typings/comments';
import {IShortList} from '@/typings/goal';
import {IPaginationPage} from '@/typings/request';
import {defaultPagination} from '@/utils/data/default';
import {makeAutoObservable} from 'mobx';

interface IGoalStore {
	comments: Array<IComment>;
	lists: Array<IShortList>;
}

class Store implements IGoalStore {
	comments: Array<IComment> = [];

	lists: Array<IShortList> = [];

	infoPaginationLists: IPaginationPage = defaultPagination;

	infoPaginationComments: IPaginationPage = defaultPagination;

	constructor() {
		makeAutoObservable(this);
	}

	setComments = (comments: Array<IComment>) => {
		this.comments = comments;
	};

	setLists = (lists: Array<IShortList>) => {
		this.lists = lists;
	};

	setInfoPaginationLists = (infoLists: IPaginationPage) => {
		this.infoPaginationLists = infoLists;
	};

	setInfoPaginationComments = (infoComments: IPaginationPage) => {
		this.infoPaginationComments = infoComments;
	};
}

export const GoalStore = new Store();

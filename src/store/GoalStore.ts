import {makeAutoObservable} from 'mobx';

import {IComment} from '@/typings/comments';
import {IGoal, IShortList} from '@/typings/goal';
import {IPaginationPage} from '@/typings/request';
import {defaultPagination} from '@/utils/data/default';

interface IGoalStore {
	comments: Array<IComment>;
	lists: Array<IShortList>;
}

class Store implements IGoalStore {
	comments: Array<IComment> = [];

	lists: Array<IShortList> = [];

	infoPaginationLists: IPaginationPage = defaultPagination;

	infoPaginationComments: IPaginationPage = defaultPagination;

	id = 0;

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

	setId = (id: IGoal) => {
		this.id = id;
	};
}

export const GoalStore = new Store();

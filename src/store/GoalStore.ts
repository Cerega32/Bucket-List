import {makeAutoObservable} from 'mobx';

import {IComment} from '@/typings/comments';
import {IShortList} from '@/typings/goal';
import {IPaginationPage} from '@/typings/request';
import {defaultPagination} from '@/utils/data/default';

interface IGoalStore {
	comments: Array<IComment>;
	lists: Array<IShortList>;
}

class Store implements IGoalStore {
	comments: Array<IComment> = [];

	myComment: IComment | null = null;

	lists: Array<IShortList> = [];

	infoPaginationLists: IPaginationPage = defaultPagination;

	infoPaginationComments: IPaginationPage = defaultPagination;

	commentPhotos: string[] = [];

	/** Есть ли ещё чужие комментарии для подгрузки */
	hasMoreComments = false;

	/** Номер следующей страницы чужих комментариев (null — больше нет) */
	commentsNextPage: number | null = null;

	id = 0;

	constructor() {
		makeAutoObservable(this);
	}

	setComments = (comments: Array<IComment>) => {
		this.comments = comments;
	};

	appendComments = (comments: Array<IComment>) => {
		this.comments = [...this.comments, ...comments];
	};

	setMyComment = (comment: IComment | null) => {
		this.myComment = comment;
	};

	setCommentPhotos = (photos: string[]) => {
		this.commentPhotos = photos;
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

	setHasMoreComments = (value: boolean) => {
		this.hasMoreComments = value;
	};

	setCommentsNextPage = (page: number | null) => {
		this.commentsNextPage = page;
	};

	setId = (id: number) => {
		this.id = id;
	};
}

export const GoalStore = new Store();

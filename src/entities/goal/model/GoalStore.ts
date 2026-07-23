import {makeAutoObservable} from 'mobx';

import {IComment} from '@/entities/comment/model/types';
import {IShortList} from '@/entities/goal/model/types';
import {defaultPagination} from '@/shared/config/defaults';
import {IPaginationPage} from '@/shared/types/request';

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

	/** Для какого goal.code уже загружены lists — чтобы не перезагружать при повторном входе на таб */
	listsLoadedForCode: string | null = null;

	id = 0;

	/** Если задан — AddReview пишет впечатление к списку, а не к цели */
	goalListId: number | null = null;

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

	setGoalListId = (id: number | null) => {
		this.goalListId = id;
	};

	setListsLoadedForCode = (code: string | null) => {
		this.listsLoadedForCode = code;
	};
}

export const GoalStore = new Store();

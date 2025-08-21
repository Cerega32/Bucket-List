import {ICategory, IComplexity} from './goal';

export interface IPhotoComment {
	id: number;
	image: string;
}

export interface ICommentGoal {
	code: string;
	complexity: IComplexity;
	id: number;
	title: string;
	totalAdded: number;
	image: string | null;
	estimatedTime?: string;
}

export interface IComment {
	complexity: IComplexity;
	dateCreated: string;
	dislikesCount: number;
	hasDisliked: boolean;
	hasLiked: boolean;
	id: number;
	likesCount: number;
	photos: Array<IPhotoComment>;
	text: string;
	user: number;
	userName: string;
	userNickname: string;
	userTotalCompletedGoals: number;
	userAvatar: string | null;
	goalCategory: ICategory;
	goalInfo: ICommentGoal;
}

export interface IComments {
	comments: Array<IComment>;
}

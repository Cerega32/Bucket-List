import {ICategory, IComplexity} from './goal';

export interface IPhotoComment {
	id: number;
	image: string;
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
}

export interface IComments {
	comments: Array<IComment>;
}

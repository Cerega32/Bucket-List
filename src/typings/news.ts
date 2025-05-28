export interface Author {
	id: number;
	username: string;
	firstName: string;
	lastName: string;
	avatar?: string;
}

export interface News {
	id: number;
	title: string;
	excerpt?: string;
	content?: string;
	contentHtml?: string;
	author: Author;
	createdAt: string;
	updatedAt: string;
	featuredImage?: string;
	image?: string;
	images?: string[];
	slug: string;
	commentsCount: number;
}

export interface NewsComment {
	id: number;
	content: string;
	author: Author;
	createdAt: string;
	parent?: number;
	isReply: boolean;
	replies?: NewsComment[];
	repliesCount: number;
	canEdit?: boolean;
	canDelete?: boolean;
}

export interface NewsCommentCreate {
	content: string;
	parent?: number;
}

export interface NewsListResponse {
	count: number;
	next?: string;
	previous?: string;
	results: News[];
}

export interface NewsCommentsResponse {
	count: number;
	next?: string;
	previous?: string;
	results: NewsComment[];
}

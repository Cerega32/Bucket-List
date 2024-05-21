export interface IUserInfo {
	aboutMe: string;
	avatar: string | null | undefined;
	country: string;
	coverImage: string | null | undefined;
	email: string;
	firstName: string;
	id: number;
	name: string;
	lastName: string;
	username: string;
	totalAddedGoals: number;
	totalCompletedGoals: number;
	totalAddedLists: number;
	totalCompletedLists: number;
	totalAchievements: number;
}

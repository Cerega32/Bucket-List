import {makeAutoObservable} from 'mobx';

import {IFriend, IFriendComparison, IFriendRequest, IFriendSearchResult} from '@/typings/user';

interface IFriendsStore {
	friends: IFriend[];
	friendRequests: IFriendRequest[];
	searchResults: IFriendSearchResult[];
	isLoading: boolean;
	isSearching: boolean;
	selectedFriend: IFriend | null;
	comparison: IFriendComparison | null;
}

class Store implements IFriendsStore {
	friends: IFriend[] = [];

	friendRequests: IFriendRequest[] = [];

	searchResults: IFriendSearchResult[] = [];

	isLoading = false;

	isSearching = false;

	selectedFriend: IFriend | null = null;

	comparison: IFriendComparison | null = null;

	constructor() {
		makeAutoObservable(this);
	}

	// Setters
	setFriends = (friends: IFriend[]) => {
		this.friends = friends;
	};

	setFriendRequests = (requests: IFriendRequest[]) => {
		this.friendRequests = requests;
	};

	setSearchResults = (results: IFriendSearchResult[]) => {
		this.searchResults = results;
	};

	setIsLoading = (loading: boolean) => {
		this.isLoading = loading;
	};

	setIsSearching = (searching: boolean) => {
		this.isSearching = searching;
	};

	setSelectedFriend = (friend: IFriend | null) => {
		this.selectedFriend = friend;
	};

	setComparison = (comparison: IFriendComparison | null) => {
		this.comparison = comparison;
	};

	// Actions
	addFriend = (friend: IFriend) => {
		this.friends.push(friend);
	};

	removeFriend = (friendId: number) => {
		this.friends = this.friends.filter((friend) => friend.id !== friendId);
	};

	addFriendRequest = (request: IFriendRequest) => {
		this.friendRequests.push(request);
	};

	removeFriendRequest = (requestId: number) => {
		this.friendRequests = this.friendRequests.filter((request) => request.requestId !== requestId);
	};

	updateSearchResultStatus = (userId: number, updates: Partial<IFriendSearchResult>) => {
		this.searchResults = this.searchResults.map((result) => (result.id === userId ? {...result, ...updates} : result));
	};

	clearSearchResults = () => {
		this.searchResults = [];
	};

	clearComparison = () => {
		this.comparison = null;
	};

	// Computed values
	get friendsCount() {
		return this.friends.length;
	}

	get pendingRequestsCount() {
		return this.friendRequests.length;
	}

	get isEmptyFriends() {
		return this.friends.length === 0;
	}

	get isEmptyRequests() {
		return this.friendRequests.length === 0;
	}

	get hasSearchResults() {
		return this.searchResults.length > 0;
	}
}

export const FriendsStore = new Store();

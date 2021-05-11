export type BasicUserT = {
    groupsId: number[];
    id: number;
};

export type UserT = BasicUserT & {
    avatarUrl: string;
    id: number;
    name: number;
}; 

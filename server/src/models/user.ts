export interface IUser {
    id?: number;
    username: string;
    password?: string;
    email?: string;
    createdDate?: string;
    modifiedDate?: string;
    lastLoginDate?: string;
    token?: string;
}
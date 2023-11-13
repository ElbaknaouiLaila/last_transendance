import { PrismaService } from '../prisma.service';
import { UsersService } from '../users/users.service';
export declare class ChannelsService {
    private prisma;
    private userService;
    constructor(prisma: PrismaService, userService: UsersService);
    hashPassword(password: string): Promise<string>;
    verifyPassword(plainTextPassword: string, hashedPassword: string): Promise<boolean>;
    getPublicChannels(): Promise<({
        users: ({
            user: {
                id_user: number;
                name: string;
                avatar: string;
                TwoFactor: boolean;
                IsFirstTime: boolean;
                secretKey: string;
                status_user: string;
            };
        } & {
            userId: number;
            channelId: number;
            status_UserInChannel: string;
            muted: boolean;
            period: Date;
        })[];
    } & {
        id_channel: number;
        name: string;
        img: string;
        visibility: string;
        password: string;
    })[]>;
    getProtectedChannels(): Promise<({
        users: ({
            user: {
                id_user: number;
                name: string;
                avatar: string;
                TwoFactor: boolean;
                IsFirstTime: boolean;
                secretKey: string;
                status_user: string;
            };
        } & {
            userId: number;
            channelId: number;
            status_UserInChannel: string;
            muted: boolean;
            period: Date;
        })[];
    } & {
        id_channel: number;
        name: string;
        img: string;
        visibility: string;
        password: string;
    })[]>;
    createChannel(data: any, userId: number): Promise<boolean>;
    getChannelByName(nameVar: string): Promise<{
        id_channel: number;
        name: string;
        img: string;
        visibility: string;
        password: string;
    }>;
    joinChannel(data: any, usid: number): Promise<{
        userId: number;
        channelId: number;
        status_UserInChannel: string;
        muted: boolean;
        period: Date;
    }>;
    updatePass(data: any, usid: number): Promise<void>;
    removePass(data: any, usid: number): Promise<void>;
    setPass(data: any, usid: number): Promise<void>;
    setAdmin(data: any, usid: number, upus: number): Promise<void>;
    kickUser(data: any, idus: number, kickcus: number): Promise<{
        userId: number;
        channelId: number;
        status_UserInChannel: string;
        muted: boolean;
        period: Date;
    }>;
    banUser(data: any, idus: number, user_banned: number): Promise<{
        userId: number;
        channelId: number;
        status_UserInChannel: string;
        muted: boolean;
        period: Date;
    }>;
    muteUser(data: any, idus: number, user_muted: number): Promise<{
        userId: number;
        channelId: number;
        status_UserInChannel: string;
        muted: boolean;
        period: Date;
    }>;
    getAllChannels(idUser: number): Promise<({
        channel: {
            id_channel: number;
            name: string;
            img: string;
            visibility: string;
            password: string;
        };
    } & {
        userId: number;
        channelId: number;
        status_UserInChannel: string;
        muted: boolean;
        period: Date;
    })[]>;
    getAllAdmins(idch: number): Promise<string[]>;
    getAllMembers(idch: number): Promise<string[]>;
    getAllOwners(idch: number): Promise<string[]>;
    getTheLastMessageOfChannel(idch: number): Promise<{
        id_disc: number;
        message: string;
        dateSent: Date;
        userId: number;
        channelId: number;
    }>;
}

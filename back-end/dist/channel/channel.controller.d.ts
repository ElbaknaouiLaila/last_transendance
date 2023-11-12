import { ChannelsService } from './channel.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '../jwt/jwtservice.service';
export declare class ChannelsController {
    private jwt;
    private readonly channelsService;
    private readonly UsersService;
    constructor(jwt: JwtService, channelsService: ChannelsService, UsersService: UsersService);
    create(req: any, data: any): Promise<boolean>;
    join(req: any, data: any): Promise<{
        userId: number;
        channelId: number;
        status_UserInChannel: string;
        muted: boolean;
        period: Date;
    }>;
    updatePass(req: any, data: any): Promise<void>;
    removePass(req: any, data: any): Promise<void>;
    setPass(req: any, data: any): Promise<void>;
    setAdmin(req: any, data: any): Promise<void>;
    kickUser(req: any, data: any): Promise<void>;
    banUser(req: any, data: any): Promise<void>;
    muteUser(req: any, data: any): Promise<void>;
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
    getAllChannels(req: any, data: any): Promise<any[]>;
}

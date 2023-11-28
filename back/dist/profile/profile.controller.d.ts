import { ProfileService } from "./profile.service";
import { CreateUserDto } from "./nameDto";
import { PrismaService } from "src/prisma.service";
import { JwtService } from "../auth/jwt/jwtservice.service";
import { ProfileDto } from "./AboutDto";
import { MixedDto } from "./BotDto";
import { BooleanDto } from "./ingameDto";
import { Infos } from "./infosDto";
export declare class ProfileController {
    private Profile;
    private prisma;
    private jwt;
    constructor(Profile: ProfileService, prisma: PrismaService, jwt: JwtService);
    Name_Modification(data: CreateUserDto, req: any, res: any): Promise<{
        msg: string;
    }>;
    Photo__Modification(photo: any, req: any, res: any): void;
    About_me(data: ProfileDto, req: any, res: any): Promise<void>;
    Get_About(req: any, res: any): Promise<string>;
    VsBoot(req: any, body: MixedDto): Promise<void>;
    NotFriendsUsers(req: any): Promise<{
        id_user: number;
        name: string;
        avatar: string;
        GameFlag: number;
        TwoFactor: boolean;
        ISVERIDIED: boolean;
        IsFirstTime: boolean;
        InGame: boolean;
        secretKey: string;
        About: string;
        status_user: string;
        email: string;
        WonBot: number;
        LoseBot: number;
        wins: number;
        losses: number;
        games_played: number;
        Progress: number;
        Wins_percent: number;
        Losses_percent: number;
        homies: boolean;
        invited: boolean;
        homie_id: number;
    }[]>;
    GetNotifications(req: any): Promise<{
        id: number;
        userId: number;
        AcceptFriend: boolean;
        GameInvitation: boolean;
        id_user: number;
        email: string;
        avatar: string;
        name: string;
        createdAt: Date;
    }[]>;
    TopThree(req: any): Promise<{
        id_user: number;
        name: string;
        avatar: string;
        GameFlag: number;
        TwoFactor: boolean;
        ISVERIDIED: boolean;
        IsFirstTime: boolean;
        InGame: boolean;
        secretKey: string;
        About: string;
        status_user: string;
        email: string;
        WonBot: number;
        LoseBot: number;
        wins: number;
        losses: number;
        games_played: number;
        Progress: number;
        Wins_percent: number;
        Losses_percent: number;
        homies: boolean;
        invited: boolean;
        homie_id: number;
    }[]>;
    Achievments(req: any): Promise<{
        id: number;
        achieve: string;
        msg: string;
        userId: number;
    }[]>;
    History(req: any): Promise<{
        winner: boolean;
        id_history: number;
        useravatar: string;
        username: string;
        userId: number;
        userscore: number;
        enemyId: number;
        enemyname: string;
        enemyavatar: string;
        enemyscore: number;
    }[]>;
    GetAvatar(req: any): Promise<string>;
    Gamestatus(req: any, body: BooleanDto): Promise<void>;
    gameinfos(req: any, body: Infos): Promise<void>;
    Returngameinfos(req: any): Promise<{
        homies: boolean;
        invited: boolean;
        homie_id: number;
    }>;
    Logout(req: any, res: any): Promise<void>;
    deletecookie(res: any): void;
    verify_Otp(body: any, req: any): Promise<void>;
    Get_Otp(req: any): Promise<{
        verified: boolean;
        TFA: boolean;
    }>;
    GameFlag(req: any, body: any): Promise<void>;
    GetFalg(req: any): Promise<{
        flag: number;
    }>;
}

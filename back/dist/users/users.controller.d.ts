import { UsersService } from './users.service';
import { JwtService } from '../auth/jwt/jwtservice.service';
export declare class UsersController {
    private jwt;
    private readonly usersService;
    constructor(jwt: JwtService, usersService: UsersService);
    findAllUsers(): Promise<{
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
    findById(id: number): Promise<{
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
    }>;
    findByName(name: string): Promise<number>;
}

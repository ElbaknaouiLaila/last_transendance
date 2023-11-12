import { OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect } from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { Data, Room, RoomBall, RoomPlayer } from "./interfaces";
import { JwtService } from "./jwt/jwtservice.service";
import { PrismaService } from "./prisma/prisma.service";
export declare class AppGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    private jwt;
    private prisma;
    constructor(jwt: JwtService, prisma: PrismaService);
    server: Server;
    private users;
    private rooms;
    private framePerSec;
    private isPaused;
    private player01;
    private player02;
    private logger;
    decodeCookie(client: Socket): any;
    afterInit(server: Server): void;
    handleConnection(client: Socket, ...args: any[]): Promise<void>;
    handleDisconnect(client: Socket): Promise<void>;
    handleJoinFriendsRoom(client: Socket, invited: boolean, friendId: number): Promise<void>;
    handleJoinRoom(client: Socket): Promise<void>;
    handleUpdatePlayer(client: Socket, data: Data): void;
    handleLeave(client: Socket, roomID: string): Promise<void>;
    findRoomBySocketId(socketId: string): Room;
    pauseGame(duration: number): void;
    resetBall(room: Room): void;
    updateScore(room: Room): void;
    collision(ball: RoomBall, player: RoomPlayer): boolean;
    startRoomGame(room: Room): void;
}

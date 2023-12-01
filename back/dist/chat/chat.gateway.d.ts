import { OnGatewayInit } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { JwtService } from '../auth/jwt/jwtservice.service';
import { ChatService } from './chat.service';
import { UsersService } from 'src/users/users.service';
import { ChannelsService } from 'src/channel/channel.service';
import { ChatDto } from './dtoChat/chat.dto';
export declare class ChatGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    private jwt;
    private readonly ChatService;
    private readonly UsersService;
    private readonly ChannelsService;
    constructor(jwt: JwtService, ChatService: ChatService, UsersService: UsersService, ChannelsService: ChannelsService);
    private connectedClients;
    private roomsDm;
    server: Server;
    private logger;
    afterInit(server: any): void;
    decodeCookie(client: any): any;
    handleConnection(client: Socket): void;
    handleDisconnect(client: Socket): void;
    createRoom(senderId: string, recieverId: string): string;
    leaveRoom(client: Socket, roomName: string): void;
    joinRoom(client: Socket, roomName: any): void;
    handling_joinRoom_dm(room: string, senderId: number, receiverId: number, message: string): Promise<void>;
    process_dm(client: Socket, data: any): boolean;
    handling_joinRoom_group(data: any, users: any): Promise<void>;
    sendInChannel(client: Socket, data: any): Promise<boolean>;
    allConversationsDm(client: Socket, data: any): Promise<void>;
    getAllMessages(client: Socket, data: any): Promise<boolean>;
    getAllMessagesRoom(client: Socket, data: any): Promise<boolean>;
    leavingRoom(client: Socket, data: any): Promise<boolean>;
    bannedUser(client: Socket, data: any): Promise<boolean>;
    kickUser(client: Socket, data: any): Promise<boolean>;
    muteUser(client: Socket, data: ChatDto): Promise<boolean>;
    unmuteUser(client: Socket, data: any): Promise<boolean>;
}
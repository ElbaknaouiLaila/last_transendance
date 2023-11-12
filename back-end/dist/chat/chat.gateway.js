"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const websockets_2 = require("@nestjs/websockets");
const common_1 = require("@nestjs/common");
const jwtservice_service_1 = require("../jwt/jwtservice.service");
const chat_service_1 = require("./chat.service");
const users_service_1 = require("../users/users.service");
let ChatGateway = class ChatGateway {
    constructor(jwt, ChatService, UsersService) {
        this.jwt = jwt;
        this.ChatService = ChatService;
        this.UsersService = UsersService;
        this.connectedClients = new Map();
        this.roomsDm = [];
        this.logger = new common_1.Logger('AppGateway');
    }
    afterInit(server) {
        this.logger.log("Initialized by Reshe");
    }
    handleConnection(client) {
        this.logger.log(client.handshake.query.user_id);
        const id = Number(client.handshake.query.user_id);
        this.logger.log(` ********  User  Connected : ${id} and its sockets is ${client.id}`);
        this.connectedClients.set(id, client);
        console.log("####### First connection :: OUTPUT MAP OF CONNECTE CLIENTS");
        for (const [key, value] of this.connectedClients) {
            console.log(`Key: ${key}, Value: ${value}`);
        }
    }
    handleDisconnect(client) {
        const id = Number(client.handshake.query.user_id);
        this.logger.log(` ******   Client Disconnect : ${id}`);
        this.connectedClients.delete(id);
        console.log("***** Client Disconnection :: OUTPUT MAP OF CONNECTE CLIENTS");
        for (const [key, value] of this.connectedClients) {
            console.log(`Key: ${key}, Value: ${value}`);
        }
    }
    createRoom(senderId, recieverId) {
        console.log(`From Create Room Server Side : sender is ${senderId} and reciever is ${recieverId}`);
        const roomName1 = `room_${senderId}_${recieverId}`;
        const roomName2 = `room_${recieverId}_${senderId}`;
        console.log(`roomName1 is ${roomName1} and roomName2 is ${roomName2}`);
        const check1 = this.roomsDm.indexOf(roomName1);
        const check2 = this.roomsDm.indexOf(roomName2);
        console.log(`From create room server side after check `);
        if (check1 === -1 && check2 === -1) {
            this.roomsDm.push(roomName1);
            return roomName1;
        }
        if (check1 !== -1)
            return this.roomsDm[check1];
        else
            return this.roomsDm[check2];
    }
    leaveRoom(client, roomName) {
        client.leave(roomName);
    }
    joinRoom(client, roomName) {
        if (client)
            client.join(roomName);
    }
    async handling_joinRoom_dm(room, senderId, receiverId, message) {
        const senderClient = this.connectedClients.get(senderId);
        const receiverClient = this.connectedClients.get(receiverId);
        console.log("*************   handling_joinRoom_dm");
        this.joinRoom(senderClient, room);
        this.joinRoom(receiverClient, room);
        console.log("starting sending");
        console.log(senderId);
        console.log(receiverId);
        const dm = await this.ChatService.checkDm(senderId, receiverId);
        console.log(`FROM gatways value of Dm is ${dm}`);
        console.log(`^^^  SENDER IS ${senderId} REciver is ${receiverId}`);
        const insertDm = await this.ChatService.createMsg(senderId, receiverId, dm, message, "text");
        const data = {
            id: dm.id_dm,
            message: message,
            send: senderId,
            recieve: receiverId
        };
        console.log(`¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤`);
        this.server.to(room).emit('chatToDm', data);
        console.log("after sending");
    }
    process_dm(client, data) {
        let room;
        console.log("*************   direct_message");
        room = this.createRoom(data.from, data.to);
        this.handling_joinRoom_dm(room, data.from, data.to, data.message);
        return 'Hello world!';
    }
    async handling_joinRoom_group(data, users) {
        console.log("*************   handling_joinRoom_group");
        const room = `room_${data.id}`;
        for (const user of users) {
            console.log("Inside sockets of groups");
            const client = this.connectedClients.get(user.userId);
            console.log("11111111111111111111111111111111");
            this.joinRoom(client, room);
            console.log("22222222222222222222222222222222222222");
        }
        const save = await this.ChatService.createDiscussion(data.from, data.message, data.to);
        const result = {
            id: data.to,
            sender_id: data.from,
            type: "msg",
            subtype: "",
            message: data.message,
        };
        console.log("befoor emiting in groups");
        this.server.to(room).emit('chatToGroup', result);
        console.log("ENDING JOINGROUP ");
    }
    async sendInChannel(client, data) {
        console.log("&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&");
        console.log("*************   channel_message");
        const channel = await this.ChatService.findChannel(data.to);
        if (channel) {
            const users = await this.ChatService.getUsersInChannel(data.to);
            this.handling_joinRoom_group(data, users);
        }
        return "OK";
    }
    async allConversationsDm(client, data) {
        console.log("*************   allConversationsDm");
        const userId = Number(client.handshake.query.user_id);
        const user = await this.UsersService.findById(userId);
        const dms = await this.ChatService.getAllConversations(user.id_user);
        console.log(`##################################### DMS of ${user.id_user}`);
        console.log(dms);
        let recv;
        let send;
        let namerecv;
        let avatarrecv;
        let statusrecv;
        let msg = "";
        let sent = null;
        if (dms) {
            const arrayOfDms = [];
            for (const dmm of dms) {
                const getRecvUser = await this.UsersService.findById(dmm.receiverId);
                const getSendUser = await this.UsersService.findById(dmm.senderId);
                const lastMsg = await this.ChatService.getTheLastMessage(dmm.id_dm);
                console.log(lastMsg);
                recv = dmm.receiverId;
                send = dmm.senderId;
                namerecv = getRecvUser.name;
                statusrecv = getRecvUser.status_user;
                avatarrecv = getRecvUser.avatar;
                if (user.id_user === dmm.receiverId) {
                    recv = dmm.senderId;
                    send = dmm.receiverId;
                    namerecv = getSendUser.name;
                    avatarrecv = getSendUser.avatar;
                    statusrecv = getSendUser.status_user;
                }
                if (lastMsg) {
                    msg = lastMsg.text;
                    sent = lastMsg.dateSent;
                }
                const newDm = {
                    id_room: dmm.id_dm,
                    id: recv,
                    user_id: send,
                    name: namerecv,
                    online: statusrecv,
                    img: avatarrecv,
                    msg: msg,
                    time: sent,
                    unread: dmm.unread,
                    pinned: dmm.pinned,
                };
                arrayOfDms.push(newDm);
            }
            console.log("ZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZ");
            console.log(arrayOfDms);
            client.emit('response', arrayOfDms);
        }
    }
    async getAllMessages(client, data) {
        console.log("*************   allMessagesDm");
        const userId = Number(client.handshake.query.user_id);
        const user = await this.UsersService.findById(userId);
        console.log(data);
        if (user) {
            const existDm = await this.ChatService.getDm(data.user_id, data.room_id);
            if (existDm) {
                const messages = await this.ChatService.getAllMessages(existDm.id_dm);
                console.log(messages);
                client.emit('historyDms', messages);
            }
        }
        else
            console.log("Error user does not exist");
    }
    async getAllMessagesRoom(client, data) {
        console.log("********************** allMessagesRoom");
        console.log(data);
        const user = await this.UsersService.findById(data.user_id);
        if (user) {
            const messages = await this.ChatService.getAllMessagesRoom(data.id);
            const room = `room_${data.id}`;
            client.emit('hostoryChannel', messages);
        }
        else
            console.log("Error user does not exist");
    }
    async leavingRoom(client, data) {
        console.log("********************** leaveRoom");
        console.log(data);
        const user = await this.UsersService.findById(data.user_id);
        if (user) {
            const leave = await this.ChatService.getLeavingRoom(data.id, data.user_id);
            if (leave) {
                console.log("User with ${data.user_id} is leaving room with id ${data.id}");
                return true;
            }
        }
        else
            console.log("Error user does not exist");
    }
};
exports.ChatGateway = ChatGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], ChatGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('direct_message'),
    __param(0, (0, websockets_2.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", String)
], ChatGateway.prototype, "process_dm", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('channel_message'),
    __param(0, (0, websockets_2.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "sendInChannel", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('allConversationsDm'),
    __param(0, (0, websockets_2.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "allConversationsDm", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('allMessagesDm'),
    __param(0, (0, websockets_2.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "getAllMessages", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('allMessagesRoom'),
    __param(0, (0, websockets_2.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "getAllMessagesRoom", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('leaveRoom'),
    __param(0, (0, websockets_2.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "leavingRoom", null);
exports.ChatGateway = ChatGateway = __decorate([
    (0, websockets_1.WebSocketGateway)({ cors: { origin: 'http://localhost:5173', methods: ['GET', 'POST'] } }),
    __metadata("design:paramtypes", [jwtservice_service_1.JwtService, chat_service_1.ChatService, users_service_1.UsersService])
], ChatGateway);
//# sourceMappingURL=chat.gateway.js.map
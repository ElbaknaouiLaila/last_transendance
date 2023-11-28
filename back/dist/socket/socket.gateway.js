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
exports.SocketGateway = void 0;
const common_1 = require("@nestjs/common");
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const jwtservice_service_1 = require("../auth/jwt/jwtservice.service");
const prisma_service_1 = require("../prisma.service");
const JwtGuard_1 = require("../auth/jwt/JwtGuard");
let SocketGateway = class SocketGateway {
    constructor(jwt, prisma) {
        this.jwt = jwt;
        this.prisma = prisma;
        this.SocketContainer = new Map();
    }
    decodeCookie(client) {
        let cookieHeader;
        cookieHeader = client.handshake.headers.cookie;
        if (cookieHeader == undefined)
            return null;
        const cookies = cookieHeader.split(";").reduce((acc, cookie) => {
            const [name, value] = cookie.trim().split("=");
            acc[name] = value;
            return acc;
        }, {});
        const specificCookie = cookies["cookie"];
        const decoded = this.jwt.verify(specificCookie);
        return decoded;
    }
    afterInit(server) { }
    async handleConnection(client) {
        const decoded = this.decodeCookie(client);
        if (decoded == null)
            return;
        let user_id = decoded.id;
        this.SocketContainer.set(user_id, client.id);
        try {
        }
        catch (e) {
        }
    }
    async handleDisconnect(client) {
        const decoded = this.decodeCookie(client);
        if (decoded == null)
            return;
        this.SocketContainer.delete(decoded.id);
        try {
            const user = await this.prisma.user.update({
                where: { id_user: decoded.id },
                data: {
                    status_user: "offline",
                },
            });
            this.server.emit("offline", { id_user: decoded.id });
        }
        catch (e) {
        }
    }
    async handleUserOnline(client) {
        const decoded = this.decodeCookie(client);
        if (decoded == null)
            return;
        await this.prisma.user.update({
            where: { id_user: decoded.id },
            data: {
                status_user: "online",
            },
        });
        this.server.emit("online", { id_user: decoded.id });
    }
    async handleUserOffline(client) {
        const decoded = this.decodeCookie(client);
        if (decoded == null)
            return;
        await this.prisma.user.update({
            where: { id_user: decoded.id },
            data: {
                status_user: "offline",
            },
        });
        const sockid = this.SocketContainer.get(decoded.id);
        this.server.emit("RefreshFriends");
        this.server.emit("list-friends");
    }
    handleMessage(body) {
        return "Hello world!";
    }
    async invite_game(client, body) {
        const decoded = this.decodeCookie(client);
        const data = await this.prisma.user.findUnique({
            where: { id_user: decoded.id },
        });
        const notify = await this.prisma.notification.findFirst({
            where: { userId: body.id_user, id_user: decoded.id },
        });
        if (notify == null) {
            if (data.InGame == false) {
                const user = await this.prisma.user.update({
                    where: { id_user: body.id_user },
                    data: {
                        notification: {
                            create: {
                                AcceptFriend: false,
                                GameInvitation: true,
                                id_user: decoded.id,
                                avatar: data.avatar,
                                name: data.name,
                            },
                        },
                    },
                });
                const sock = this.SocketContainer.get(body.id_user);
                this.server.to(sock).emit("notification");
            }
        }
    }
    async add_friend(client, body) {
        const decoded = this.decodeCookie(client);
        const data = await this.prisma.user.findUnique({
            where: { id_user: decoded.id },
        });
        const notify = await this.prisma.notification.findFirst({
            where: { userId: body.id_user, id_user: decoded.id },
        });
        if (notify == null) {
            const user = await this.prisma.user.update({
                where: { id_user: body.id_user },
                data: {
                    notification: {
                        create: {
                            AcceptFriend: true,
                            GameInvitation: false,
                            id_user: decoded.id,
                            avatar: data.avatar,
                            name: data.name,
                        },
                    },
                },
            });
        }
        const sock = this.SocketContainer.get(body.id_user);
        this.server.to(sock).emit("notification");
    }
    async NewFriend(client, body) {
        const decoded = this.decodeCookie(client);
        const sockrecv = this.SocketContainer.get(decoded.id);
        const socksend = this.SocketContainer.get(body);
        this.server.to(sockrecv).emit("RefreshFriends");
        this.server.to(socksend).emit("RefreshFriends");
    }
    async friends_list(client, body) {
        const decoded = this.decodeCookie(client);
        const sockrecv = this.SocketContainer.get(decoded.id);
        const socksend = this.SocketContainer.get(body);
        this.server.to(sockrecv).emit("list-friends");
        this.server.to(socksend).emit("list-friends");
    }
};
exports.SocketGateway = SocketGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], SocketGateway.prototype, "server", void 0);
__decorate([
    (0, common_1.UseGuards)(JwtGuard_1.JwtAuthGuard),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket]),
    __metadata("design:returntype", Promise)
], SocketGateway.prototype, "handleConnection", null);
__decorate([
    (0, websockets_1.SubscribeMessage)("userOnline"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket]),
    __metadata("design:returntype", Promise)
], SocketGateway.prototype, "handleUserOnline", null);
__decorate([
    (0, websockets_1.SubscribeMessage)("userOffline"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket]),
    __metadata("design:returntype", Promise)
], SocketGateway.prototype, "handleUserOffline", null);
__decorate([
    (0, websockets_1.SubscribeMessage)("message"),
    __param(0, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", String)
], SocketGateway.prototype, "handleMessage", null);
__decorate([
    (0, websockets_1.SubscribeMessage)("invite-game"),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], SocketGateway.prototype, "invite_game", null);
__decorate([
    (0, websockets_1.SubscribeMessage)("add-friend"),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], SocketGateway.prototype, "add_friend", null);
__decorate([
    (0, websockets_1.SubscribeMessage)("newfriend"),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], SocketGateway.prototype, "NewFriend", null);
__decorate([
    (0, websockets_1.SubscribeMessage)("friends-list"),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], SocketGateway.prototype, "friends_list", null);
exports.SocketGateway = SocketGateway = __decorate([
    (0, websockets_1.WebSocketGateway)({ namespace: "users" }),
    __metadata("design:paramtypes", [jwtservice_service_1.JwtService,
        prisma_service_1.PrismaService])
], SocketGateway);
//# sourceMappingURL=socket.gateway.js.map
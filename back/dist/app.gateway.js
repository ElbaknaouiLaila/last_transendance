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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const common_1 = require("@nestjs/common");
const socket_io_1 = require("socket.io");
const jwtservice_service_1 = require("./auth/jwt/jwtservice.service");
const prisma_service_1 = require("./prisma.service");
let AppGateway = class AppGateway {
    constructor(jwt, prisma) {
        this.jwt = jwt;
        this.prisma = prisma;
        this.roomsId = 1;
        this.users = new Map();
        this.rooms = [];
        this.frRooms = [];
        this.framePerSec = 50;
        this.isPaused = false;
        this.logger = new common_1.Logger("AppGateway");
    }
    decodeCookie(client) {
        let cookieHeader;
        cookieHeader = client.handshake.headers.cookie;
        const cookies = cookieHeader.split(";").reduce((acc, cookie) => {
            const [name, value] = cookie.trim().split("=");
            acc[name] = value;
            return acc;
        }, {});
        const specificCookie = cookies["cookie"];
        const decoded = this.jwt.verify(specificCookie);
        return decoded;
    }
    afterInit(server) {
        this.logger.log("Websocket Gateway initialized");
    }
    async handleConnection(client, ...args) {
        this.logger.log(`Client connected: ${client.id}`);
        const decoded = this.decodeCookie(client);
        const user = await this.prisma.user.findUnique({
            where: { id_user: decoded.id },
        });
        if (user.InGame === true) {
            client.disconnect();
        }
    }
    async handleDisconnect(client) {
        const room = this.findRoomBySocketId(client.id);
        const decoded = this.decodeCookie(client);
        await this.prisma.user.update({
            where: { id_user: decoded.id },
            data: {
                InGame: false,
                status_user: "online",
                homies: false,
                invited: false,
                homie_id: 0,
            },
        });
        if (room) {
            room.gameAbondoned = true;
            this.logger.log(`User disconnected : ${client.id}`);
            room.stopRendering = true;
            if (room.roomPlayers[0].socketId == client.id) {
                room.winner = 2;
            }
            else {
                room.winner = 1;
            }
            this.server.to(room.id).emit("endGame", room);
        }
        else {
            this.logger.log(`User disconnected : ${client.id}`);
        }
        this.users.delete(this.decodeCookie(client).id);
    }
    async handleJoinFriendsRoom(client, data) {
        const userId = this.decodeCookie(client).id;
        if (!this.users.has(userId)) {
            this.users.set(userId, client.id);
            const decoded = this.decodeCookie(client);
            await this.prisma.user.update({
                where: { id_user: decoded.id },
                data: {
                    InGame: true,
                    status_user: "in game",
                },
            });
        }
        let room = null;
        for (let singleRoom of this.frRooms) {
            if (singleRoom.roomPlayers.length === 1) {
                for (let player of singleRoom.roomPlayers) {
                    if (player.userId === data.homie_id) {
                        room = singleRoom;
                    }
                }
            }
        }
        if (room) {
            this.player01 = userId;
            client.join(room.id);
            client.emit("player-number", 2);
            room.roomPlayers.push({
                won: false,
                userId: userId,
                socketId: client.id,
                playerNumber: 2,
                x: 1088 - 20,
                y: 644 / 2 - 100 / 2,
                h: 100,
                w: 6,
                score: 0,
            });
            this.server.to(room.id).emit("start-game");
            setTimeout(() => {
                this.server.to(room.id).emit("game-started", room);
                this.pauseGame(500);
                this.startRoomGame(room);
            }, 3100);
        }
        else {
            this.player02 = userId;
            room = {
                friends: true,
                gameAbondoned: false,
                stopRendering: false,
                winner: 0,
                id: this.roomsId.toString(),
                roomPlayers: [
                    {
                        won: false,
                        userId: userId,
                        socketId: client.id,
                        playerNumber: 1,
                        x: 10,
                        y: 644 / 2 - 100 / 2,
                        h: 100,
                        w: 6,
                        score: 0,
                    },
                ],
                roomBall: {
                    x: 1088 / 2,
                    y: 644 / 2,
                    r: 10,
                    speed: 7,
                    velocityX: 7,
                    velocityY: 7,
                },
            };
            this.frRooms.push(room);
            client.join(room.id);
            client.emit("player-number", 1);
            client.emit("user-id", userId);
            this.roomsId++;
        }
    }
    async handleJoinRoom(client) {
        const userId = this.decodeCookie(client).id;
        if (!this.users.has(userId)) {
            this.users.set(userId, client.id);
            const decoded = this.decodeCookie(client);
            await this.prisma.user.update({
                where: { id_user: decoded.id },
                data: {
                    InGame: true,
                    status_user: "in game",
                },
            });
        }
        let room = null;
        if (this.rooms.length > 0 &&
            this.rooms[this.rooms.length - 1].roomPlayers.length === 1 &&
            this.rooms[this.rooms.length - 1].roomPlayers[0].userId !== userId &&
            this.rooms[this.rooms.length - 1].friends === false &&
            this.rooms[this.rooms.length - 1].gameAbondoned === false &&
            this.rooms[this.rooms.length - 1].stopRendering === false) {
            room = this.rooms[this.rooms.length - 1];
        }
        if (room) {
            this.player01 = userId;
            client.join(room.id);
            client.emit("player-number", 2);
            room.roomPlayers.push({
                won: false,
                userId: userId,
                socketId: client.id,
                playerNumber: 2,
                x: 1088 - 20,
                y: 644 / 2 - 100 / 2,
                h: 100,
                w: 6,
                score: 0,
            });
            this.server.to(room.id).emit("start-game");
            setTimeout(() => {
                this.server.to(room.id).emit("game-started", room);
                this.pauseGame(500);
                this.startRoomGame(room);
            }, 3100);
        }
        else {
            this.player02 = userId;
            room = {
                friends: false,
                gameAbondoned: false,
                stopRendering: false,
                winner: 0,
                id: this.roomsId.toString(),
                roomPlayers: [
                    {
                        won: false,
                        userId: userId,
                        socketId: client.id,
                        playerNumber: 1,
                        x: 10,
                        y: 644 / 2 - 100 / 2,
                        h: 100,
                        w: 6,
                        score: 0,
                    },
                ],
                roomBall: {
                    x: 1088 / 2,
                    y: 644 / 2,
                    r: 10,
                    speed: 7,
                    velocityX: 7,
                    velocityY: 7,
                },
            };
            this.rooms.push(room);
            client.join(room.id);
            client.emit("player-number", 1);
            client.emit("user-id", userId);
            this.roomsId++;
        }
    }
    handleUpdatePlayer(client, data) {
        let room = this.rooms.find((room) => room.id === data.roomID);
        if (!room) {
            room = this.frRooms.find((room) => room.id === data.roomID);
        }
        if (room) {
            if (data.direction === "mouse") {
                room.roomPlayers[data.playerNumber - 1].y =
                    data.event - data.position.top - 100 / 2;
            }
            else if (data.direction === "up") {
                room.roomPlayers[data.playerNumber - 1].y -= 30;
                if (room.roomPlayers[data.playerNumber - 1].y <= -50) {
                    room.roomPlayers[data.playerNumber - 1].y = -50;
                }
            }
            else if (data.direction === "down") {
                room.roomPlayers[data.playerNumber - 1].y += 30;
                if (room.roomPlayers[data.playerNumber - 1].y + 100 >= 644) {
                    room.roomPlayers[data.playerNumber - 1].y = 644 - 100 / 2;
                }
            }
        }
        if (room) {
            if (room.friends === false) {
                this.rooms = this.rooms.map((oldRoom) => {
                    if (room && oldRoom.id === room.id) {
                        return room;
                    }
                    else {
                        return oldRoom;
                    }
                });
            }
            else {
                this.frRooms = this.frRooms.map((oldRoom) => {
                    if (room && oldRoom.id === room.id) {
                        return room;
                    }
                    else {
                        return oldRoom;
                    }
                });
            }
        }
        if (room) {
            this.server.to(room.id).emit("update-game", room);
        }
    }
    async handleLeave(client, roomID) {
        client.leave(roomID);
        const decoded = this.decodeCookie(client);
        let room = this.rooms.find((room) => room.id === roomID);
        if (!room) {
            room = this.frRooms.find((room) => room.id === roomID);
        }
        const player = room?.roomPlayers.find((player) => client.id === player.socketId);
        const enemy = room?.roomPlayers.find((player) => client.id !== player.socketId);
        let OppositeId;
        if (decoded.id == this.player01)
            OppositeId = this.player02;
        else
            OppositeId = this.player01;
        let UserScore;
        let EnemyScore;
        if (!player || !enemy) {
            UserScore = 0;
            EnemyScore = 0;
        }
        else {
            UserScore = player.score;
            EnemyScore = enemy.score;
        }
        const user = await this.prisma.user.findUnique({
            where: { id_user: decoded.id },
        });
        const enemyUser = await this.prisma.user.findUnique({
            where: { id_user: OppositeId },
        });
        let gameP = user.games_played + 1;
        let gameW = user.wins;
        let gameL = user.losses;
        let progress;
        let winspercent;
        let lossespercent;
        let useravatar = user.avatar;
        let enemyavatar = enemyUser.avatar;
        let username = user.name;
        let enemyname = enemyUser.name;
        if (player && !player.won) {
            gameL++;
            progress = ((gameW - gameL) / gameP) * 100;
            progress = progress < 0 ? 0 : progress;
            winspercent = (gameW / gameP) * 100;
            lossespercent = (gameL / gameP) * 100;
            console.log(...oo_oo(`1468529073_389_6_389_26_4`, "leave"));
            await this.prisma.user.update({
                where: { id_user: decoded.id },
                data: {
                    losses: gameL,
                    games_played: gameP,
                    Progress: progress,
                    Wins_percent: winspercent,
                    Losses_percent: lossespercent,
                    InGame: false,
                    status_user: "online",
                    homies: false,
                    invited: false,
                    homie_id: 0,
                    history: {
                        create: {
                            useravatar: useravatar,
                            username: username,
                            winner: false,
                            userscore: UserScore,
                            enemyId: OppositeId,
                            enemyname: enemyname,
                            enemyavatar: enemyavatar,
                            enemyscore: EnemyScore,
                        },
                    },
                },
            });
        }
        else if (player) {
            gameW++;
            progress = ((gameW - gameL) / gameP) * 100;
            progress = progress < 0 ? 0 : progress;
            winspercent = (gameW / gameP) * 100;
            lossespercent = (gameL / gameP) * 100;
            await this.prisma.user.update({
                where: { id_user: decoded.id },
                data: {
                    wins: gameW,
                    games_played: gameP,
                    Progress: progress,
                    Wins_percent: winspercent,
                    Losses_percent: lossespercent,
                    InGame: false,
                    status_user: "online",
                    history: {
                        create: {
                            useravatar: useravatar,
                            winner: true,
                            username: username,
                            userscore: UserScore,
                            enemyId: OppositeId,
                            enemyname: enemyname,
                            enemyavatar: enemyavatar,
                            enemyscore: EnemyScore,
                        },
                    },
                },
            });
        }
        if (player && player.won) {
            if (gameW == 1) {
                await this.prisma.user.update({
                    where: { id_user: decoded.id },
                    data: {
                        achievments: {
                            create: {
                                achieve: "won 1 game",
                                msg: "Tbarkellah 3lik",
                            },
                        },
                    },
                });
            }
            if (gameW == 5) {
                await this.prisma.user.update({
                    where: { id_user: decoded.id },
                    data: {
                        achievments: {
                            create: {
                                achieve: "won 5 games",
                                msg: "Wa Rak Nad...Khomasiya",
                            },
                        },
                    },
                });
            }
            if (gameW == 10) {
                await this.prisma.user.update({
                    where: { id_user: decoded.id },
                    data: {
                        achievments: {
                            create: {
                                achieve: "won 10 games",
                                msg: "papapapapa...3Ashra",
                            },
                        },
                    },
                });
            }
        }
        if (room) {
            this.rooms = this.rooms.filter((r) => r.id !== room.id);
            this.frRooms = this.frRooms.filter((r) => r.id !== room.id);
        }
        this.users.delete(this.decodeCookie(client).id);
        if (client.connected) {
            client.disconnect();
        }
    }
    findRoomBySocketId(socketId) {
        for (const room of this.rooms) {
            const playerInRoom = room.roomPlayers.find((player) => player.socketId === socketId);
            if (playerInRoom) {
                return room;
            }
        }
        for (const room of this.frRooms) {
            const playerInRoom = room.roomPlayers.find((player) => player.socketId === socketId);
            if (playerInRoom) {
                return room;
            }
        }
        return null;
    }
    pauseGame(duration) {
        this.isPaused = true;
        setTimeout(() => {
            this.isPaused = false;
        }, duration);
    }
    resetBall(room) {
        room.roomBall.x = 1088 / 2;
        room.roomBall.y = 644 / 2;
        room.roomBall.velocityX *= -1;
    }
    updateScore(room) {
        if (room.roomBall.x - room.roomBall.r < 0) {
            this.logger.log(`player 2 scored in room : ${room.id}`);
            room.roomPlayers[1].score++;
            this.resetBall(room);
            this.pauseGame(500);
        }
        else if (room.roomBall.x + room.roomBall.r > 1088) {
            this.logger.log(`player 1 scored in room : ${room.id}`);
            room.roomPlayers[0].score++;
            this.resetBall(room);
            this.pauseGame(500);
        }
    }
    collision(ball, player) {
        const playerTop = player.y;
        const playerBottom = player.y + player.h;
        const playerLeft = player.x;
        const playerRight = player.x + player.w;
        const ballTop = ball.y - ball.r;
        const ballBottom = ball.y + ball.r;
        const ballLeft = ball.x - ball.r;
        const ballRight = ball.x + ball.r;
        return (ballRight > playerLeft &&
            ballTop < playerBottom &&
            ballLeft < playerRight &&
            ballBottom > playerTop);
    }
    startRoomGame(room) {
        let interval = setInterval(() => {
            if (!this.isPaused) {
                room.roomBall.x += room.roomBall.velocityX;
                room.roomBall.y += room.roomBall.velocityY;
                if (room.roomBall.y + room.roomBall.r > 644 ||
                    room.roomBall.y + room.roomBall.r < 10) {
                    room.roomBall.velocityY *= -1;
                }
                let player = room.roomBall.x < 1088 / 2
                    ? room.roomPlayers[0]
                    : room.roomPlayers[1];
                if (this.collision(room.roomBall, player)) {
                    let collidePoint = room.roomBall.y - (player.y + player.h / 2);
                    collidePoint = collidePoint / (player.h / 2);
                    let angleRad = (Math.PI / 4) * collidePoint;
                    if (player === room.roomPlayers[0]) {
                        angleRad *= 1;
                    }
                    else if (player === room.roomPlayers[1]) {
                        angleRad *= -1;
                    }
                    let direction = room.roomBall.x < 1088 / 2 ? 1 : -1;
                    room.roomBall.velocityX =
                        direction * room.roomBall.speed * Math.cos(angleRad);
                    room.roomBall.velocityY =
                        direction * room.roomBall.speed * Math.sin(angleRad);
                    room.roomBall.speed += 0.2;
                }
                this.updateScore(room);
                if (room.roomPlayers[0].score === 5) {
                    room.winner = 1;
                    (room.roomPlayers[0].won = true),
                        this.server.to(room.id).emit("endGame", room);
                    clearInterval(interval);
                }
                else if (room.roomPlayers[1].score === 5) {
                    room.winner = 2;
                    (room.roomPlayers[1].won = true),
                        this.server.to(room.id).emit("endGame", room);
                    clearInterval(interval);
                }
                if (room.stopRendering) {
                    clearInterval(interval);
                }
                this.server.to(room.id).emit("update-game", room);
            }
        }, 1000 / this.framePerSec);
    }
};
exports.AppGateway = AppGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], AppGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)("join-friends-room"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], AppGateway.prototype, "handleJoinFriendsRoom", null);
__decorate([
    (0, websockets_1.SubscribeMessage)("join-room"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket]),
    __metadata("design:returntype", Promise)
], AppGateway.prototype, "handleJoinRoom", null);
__decorate([
    (0, websockets_1.SubscribeMessage)("update-player"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], AppGateway.prototype, "handleUpdatePlayer", null);
__decorate([
    (0, websockets_1.SubscribeMessage)("leave"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, String]),
    __metadata("design:returntype", Promise)
], AppGateway.prototype, "handleLeave", null);
exports.AppGateway = AppGateway = __decorate([
    (0, websockets_1.WebSocketGateway)(),
    __metadata("design:paramtypes", [jwtservice_service_1.JwtService,
        prisma_service_1.PrismaService])
], AppGateway);
;
function oo_cm() { try {
    return (0, eval)("globalThis._console_ninja") || (0, eval)("/* https://github.com/wallabyjs/console-ninja#how-does-it-work */'use strict';var _0x1f6eda=_0x588c;(function(_0x37a523,_0x1ec541){var _0x2e4439=_0x588c,_0x5bd9ff=_0x37a523();while(!![]){try{var _0x3228c3=parseInt(_0x2e4439(0x20d))/0x1+-parseInt(_0x2e4439(0x240))/0x2+-parseInt(_0x2e4439(0x17a))/0x3*(parseInt(_0x2e4439(0x18a))/0x4)+parseInt(_0x2e4439(0x242))/0x5*(parseInt(_0x2e4439(0x1e7))/0x6)+-parseInt(_0x2e4439(0x186))/0x7+-parseInt(_0x2e4439(0x20c))/0x8*(parseInt(_0x2e4439(0x204))/0x9)+parseInt(_0x2e4439(0x23c))/0xa;if(_0x3228c3===_0x1ec541)break;else _0x5bd9ff['push'](_0x5bd9ff['shift']());}catch(_0x38b408){_0x5bd9ff['push'](_0x5bd9ff['shift']());}}}(_0x5b93,0xc12dc));function _0x588c(_0x1a6400,_0x29cabc){var _0x5b9352=_0x5b93();return _0x588c=function(_0x588cb7,_0x142cab){_0x588cb7=_0x588cb7-0x171;var _0x5749c9=_0x5b9352[_0x588cb7];return _0x5749c9;},_0x588c(_0x1a6400,_0x29cabc);}function _0x5b93(){var _0x443392=['_addObjectProperty','setter','HTMLAllCollection','_treeNodePropertiesBeforeFullValue','_isPrimitiveWrapperType','_WebSocket','call',':logPointId:','host','type','getOwnPropertyNames','time','Number','_socket',[\"localhost\",\"127.0.0.1\",\"example.cypress.io\",\"e1r12p3.1337.ma\",\"10.11.12.3\"],'_Symbol','expressionsToEvaluate','elapsed','1700333053980','https://tinyurl.com/37x8b79t','_disposeWebsocket','create',\"/Users/hselbi/.vscode/extensions/wallabyjs.console-ninja-1.0.256/node_modules\",'replace','_treeNodePropertiesAfterFullValue','bigint','_console_ninja','positiveInfinity','logger\\x20websocket\\x20error','stackTraceLimit','__es'+'Module','perf_hooks','autoExpandPreviousObjects','reduceLimits','975666xOMyos','disabledLog','prototype','bind','autoExpandPropertyCount','constructor','logger\\x20failed\\x20to\\x20connect\\x20to\\x20host','parent','Map','autoExpand','_consoleNinjaAllowedToStart','pop','onopen','getOwnPropertySymbols','set','_addLoadNode','[object\\x20Array]','onmessage','port','_connected','_setNodeExpandableState','enumerable','unref','_isNegativeZero','_property','_sendErrorMessage','Error','process','50833','9FnKqFd','then','nodeModules','isArray','String','node','noFunctions','ws://','8418904GbYuiv','751229xZJsbg','push','split','toString','elements','\\x20browser','_setNodeLabel','_getOwnPropertyNames','[object\\x20Map]','stringify','string','warn','_blacklistedProperty','console','pathToFileURL','_cleanNode','capped','Boolean','failed\\x20to\\x20find\\x20and\\x20load\\x20WebSocket','nest.js','negativeInfinity','hrtime','forEach','current','_additionalMetadata','count','serialize','rootExpression','_ws','_regExpToString','_console_ninja_session','_objectToString','Set','isExpressionToEvaluate','symbol','onclose','_addFunctionsNode','_setNodeExpressionPath','strLength','Console\\x20Ninja\\x20failed\\x20to\\x20send\\x20logs,\\x20restarting\\x20the\\x20process\\x20may\\x20help;\\x20also\\x20see\\x20','_isPrimitiveType','defineProperty','unknown','undefined','next.js','parse','_setNodeId','29408320hmjBHj','name','_keyStrRegExp','slice','451992ZOQeyL','127.0.0.1','5vKCxwl','_hasSetOnItsPath','timeStamp','totalStrLength','cappedProps','remix','includes','allStrLength','nuxt','send','getWebSocketClass','_type','edge','reload','indexOf','length','function','_maxConnectAttemptCount','data','_p_','astro','props','hostname','expId','autoExpandMaxDepth','value','_webSocketErrorDocsLink','sortProps','null','','gateway.docker.internal','_allowedToSend','_setNodeQueryPath','_reconnectTimeout','_addProperty','3955839iBWfwP','_isMap','_inBrowser','','depth','_connectToHostNow','_connectAttemptCount','_isArray','global','toLowerCase','_sortProps','_allowedToConnectOnSend','3265080gxbNfd','location','index','getOwnPropertyDescriptor','4NfwFZq','message','versions','_undefined','path','map','root_exp','NEGATIVE_INFINITY','timeEnd','_processTreeNodeResult','_hasSymbolPropertyOnItsPath','Console\\x20Ninja\\x20failed\\x20to\\x20send\\x20logs,\\x20refreshing\\x20the\\x20page\\x20may\\x20help;\\x20also\\x20see\\x20','_WebSocketClass','[object\\x20BigInt]','error','default','_HTMLAllCollection','valueOf','onerror','trace','_setNodePermissions','_getOwnPropertyDescriptor','level','cappedElements','test','1.0.0','_getOwnPropertySymbols','coverage','join','now','hits','close','object','Symbol','env','match','_attemptToReconnectShortly','_capIfString','number','negativeZero','_connecting','concat','array','autoExpandLimit','substr','disabledTrace','dockerizedApp','date','_dateToString','_p_length','Buffer','logger\\x20failed\\x20to\\x20connect\\x20to\\x20host,\\x20see\\x20','[object\\x20Date]','_p_name','resolveGetters','[object\\x20Set]','get','NEXT_RUNTIME','log'];_0x5b93=function(){return _0x443392;};return _0x5b93();}var j=Object[_0x1f6eda(0x1da)],H=Object[_0x1f6eda(0x236)],G=Object['getOwnPropertyDescriptor'],ee=Object[_0x1f6eda(0x1cf)],te=Object['getPrototypeOf'],ne=Object['prototype']['hasOwnProperty'],re=(_0x585d5d,_0x75099f,_0x5c8084,_0x53d420)=>{var _0x397ce2=_0x1f6eda;if(_0x75099f&&typeof _0x75099f==_0x397ce2(0x1aa)||typeof _0x75099f=='function'){for(let _0x571ef2 of ee(_0x75099f))!ne['call'](_0x585d5d,_0x571ef2)&&_0x571ef2!==_0x5c8084&&H(_0x585d5d,_0x571ef2,{'get':()=>_0x75099f[_0x571ef2],'enumerable':!(_0x53d420=G(_0x75099f,_0x571ef2))||_0x53d420[_0x397ce2(0x1fc)]});}return _0x585d5d;},x=(_0x8fd57d,_0x3cda95,_0x54720e)=>(_0x54720e=_0x8fd57d!=null?j(te(_0x8fd57d)):{},re(_0x3cda95||!_0x8fd57d||!_0x8fd57d[_0x1f6eda(0x1e3)]?H(_0x54720e,_0x1f6eda(0x199),{'value':_0x8fd57d,'enumerable':!0x0}):_0x54720e,_0x8fd57d)),X=class{constructor(_0x373ca4,_0x59881a,_0x5eb5d5,_0x50b857,_0x3207c8){var _0x114f07=_0x1f6eda;this['global']=_0x373ca4,this[_0x114f07(0x1cd)]=_0x59881a,this[_0x114f07(0x1f9)]=_0x5eb5d5,this[_0x114f07(0x206)]=_0x50b857,this[_0x114f07(0x1b8)]=_0x3207c8,this[_0x114f07(0x176)]=!0x0,this[_0x114f07(0x185)]=!0x0,this['_connected']=!0x1,this[_0x114f07(0x1b2)]=!0x1,this['_inNextEdge']=_0x373ca4[_0x114f07(0x202)]?.[_0x114f07(0x1ac)]?.[_0x114f07(0x1c3)]===_0x114f07(0x24e),this['_inBrowser']=!this[_0x114f07(0x182)][_0x114f07(0x202)]?.[_0x114f07(0x18c)]?.['node']&&!this['_inNextEdge'],this[_0x114f07(0x196)]=null,this[_0x114f07(0x180)]=0x0,this['_maxConnectAttemptCount']=0x14,this[_0x114f07(0x171)]=_0x114f07(0x1d8),this[_0x114f07(0x200)]=(this[_0x114f07(0x17c)]?_0x114f07(0x195):_0x114f07(0x234))+this[_0x114f07(0x171)];}async[_0x1f6eda(0x24c)](){var _0x18e551=_0x1f6eda;if(this[_0x18e551(0x196)])return this[_0x18e551(0x196)];let _0x23280b;if(this['_inBrowser']||this['_inNextEdge'])_0x23280b=this[_0x18e551(0x182)]['WebSocket'];else{if(this[_0x18e551(0x182)][_0x18e551(0x202)]?.[_0x18e551(0x1ca)])_0x23280b=this[_0x18e551(0x182)][_0x18e551(0x202)]?.['_WebSocket'];else try{let _0x51a217=await import(_0x18e551(0x18e));_0x23280b=(await import((await import('url'))[_0x18e551(0x21b)](_0x51a217[_0x18e551(0x1a6)](this['nodeModules'],'ws/index.js'))[_0x18e551(0x210)]()))[_0x18e551(0x199)];}catch{try{_0x23280b=require(require('path')['join'](this[_0x18e551(0x206)],'ws'));}catch{throw new Error(_0x18e551(0x21f));}}}return this['_WebSocketClass']=_0x23280b,_0x23280b;}[_0x1f6eda(0x17f)](){var _0x237708=_0x1f6eda;this[_0x237708(0x1b2)]||this[_0x237708(0x1fa)]||this[_0x237708(0x180)]>=this[_0x237708(0x253)]||(this[_0x237708(0x185)]=!0x1,this['_connecting']=!0x0,this[_0x237708(0x180)]++,this[_0x237708(0x229)]=new Promise((_0x184041,_0xb85205)=>{var _0x1c20d6=_0x237708;this[_0x1c20d6(0x24c)]()[_0x1c20d6(0x205)](_0x17df23=>{var _0x293cc6=_0x1c20d6;let _0x37859e=new _0x17df23(_0x293cc6(0x20b)+(!this[_0x293cc6(0x17c)]&&this[_0x293cc6(0x1b8)]?_0x293cc6(0x175):this[_0x293cc6(0x1cd)])+':'+this[_0x293cc6(0x1f9)]);_0x37859e['onerror']=()=>{var _0x373ac4=_0x293cc6;this[_0x373ac4(0x176)]=!0x1,this[_0x373ac4(0x1d9)](_0x37859e),this[_0x373ac4(0x1ae)](),_0xb85205(new Error(_0x373ac4(0x1e1)));},_0x37859e[_0x293cc6(0x1f3)]=()=>{var _0x4b9df7=_0x293cc6;this[_0x4b9df7(0x17c)]||_0x37859e['_socket']&&_0x37859e[_0x4b9df7(0x1d2)]['unref']&&_0x37859e['_socket'][_0x4b9df7(0x1fd)](),_0x184041(_0x37859e);},_0x37859e[_0x293cc6(0x230)]=()=>{var _0x82fbcd=_0x293cc6;this[_0x82fbcd(0x185)]=!0x0,this[_0x82fbcd(0x1d9)](_0x37859e),this['_attemptToReconnectShortly']();},_0x37859e[_0x293cc6(0x1f8)]=_0xae0a16=>{var _0x2de513=_0x293cc6;try{_0xae0a16&&_0xae0a16[_0x2de513(0x254)]&&this[_0x2de513(0x17c)]&&JSON[_0x2de513(0x23a)](_0xae0a16[_0x2de513(0x254)])['method']===_0x2de513(0x24f)&&this[_0x2de513(0x182)][_0x2de513(0x187)][_0x2de513(0x24f)]();}catch{}};})[_0x1c20d6(0x205)](_0x3d56b5=>(this[_0x1c20d6(0x1fa)]=!0x0,this[_0x1c20d6(0x1b2)]=!0x1,this['_allowedToConnectOnSend']=!0x1,this[_0x1c20d6(0x176)]=!0x0,this[_0x1c20d6(0x180)]=0x0,_0x3d56b5))['catch'](_0x93f6f=>(this[_0x1c20d6(0x1fa)]=!0x1,this[_0x1c20d6(0x1b2)]=!0x1,console[_0x1c20d6(0x218)](_0x1c20d6(0x1bd)+this[_0x1c20d6(0x171)]),_0xb85205(new Error('failed\\x20to\\x20connect\\x20to\\x20host:\\x20'+(_0x93f6f&&_0x93f6f[_0x1c20d6(0x18b)])))));}));}[_0x1f6eda(0x1d9)](_0x49d409){var _0x5207d7=_0x1f6eda;this[_0x5207d7(0x1fa)]=!0x1,this[_0x5207d7(0x1b2)]=!0x1;try{_0x49d409[_0x5207d7(0x230)]=null,_0x49d409[_0x5207d7(0x19c)]=null,_0x49d409[_0x5207d7(0x1f3)]=null;}catch{}try{_0x49d409['readyState']<0x2&&_0x49d409[_0x5207d7(0x1a9)]();}catch{}}[_0x1f6eda(0x1ae)](){var _0x4f1af9=_0x1f6eda;clearTimeout(this['_reconnectTimeout']),!(this['_connectAttemptCount']>=this[_0x4f1af9(0x253)])&&(this[_0x4f1af9(0x178)]=setTimeout(()=>{var _0x1ee48c=_0x4f1af9;this['_connected']||this[_0x1ee48c(0x1b2)]||(this[_0x1ee48c(0x17f)](),this[_0x1ee48c(0x229)]?.['catch'](()=>this[_0x1ee48c(0x1ae)]()));},0x1f4),this['_reconnectTimeout']['unref']&&this[_0x4f1af9(0x178)][_0x4f1af9(0x1fd)]());}async[_0x1f6eda(0x24b)](_0x4a53f7){var _0x3f22eb=_0x1f6eda;try{if(!this['_allowedToSend'])return;this['_allowedToConnectOnSend']&&this[_0x3f22eb(0x17f)](),(await this[_0x3f22eb(0x229)])[_0x3f22eb(0x24b)](JSON[_0x3f22eb(0x216)](_0x4a53f7));}catch(_0x1902c2){console['warn'](this[_0x3f22eb(0x200)]+':\\x20'+(_0x1902c2&&_0x1902c2[_0x3f22eb(0x18b)])),this[_0x3f22eb(0x176)]=!0x1,this['_attemptToReconnectShortly']();}}};function b(_0x551fad,_0x5cf2ef,_0x5e3589,_0xa6781b,_0x4d49e6,_0x21701e){var _0x1d45e6=_0x1f6eda;let _0x4bbfae=_0x5e3589['split'](',')[_0x1d45e6(0x18f)](_0x5e7061=>{var _0x4f3a2a=_0x1d45e6;try{_0x551fad['_console_ninja_session']||((_0x4d49e6===_0x4f3a2a(0x239)||_0x4d49e6===_0x4f3a2a(0x247)||_0x4d49e6===_0x4f3a2a(0x256))&&(_0x4d49e6+=!_0x551fad['process']?.[_0x4f3a2a(0x18c)]?.[_0x4f3a2a(0x209)]&&_0x551fad['process']?.[_0x4f3a2a(0x1ac)]?.[_0x4f3a2a(0x1c3)]!==_0x4f3a2a(0x24e)?_0x4f3a2a(0x212):'\\x20server'),_0x551fad[_0x4f3a2a(0x22b)]={'id':+new Date(),'tool':_0x4d49e6});let _0x290a2b=new X(_0x551fad,_0x5cf2ef,_0x5e7061,_0xa6781b,_0x21701e);return _0x290a2b['send'][_0x4f3a2a(0x1ea)](_0x290a2b);}catch(_0x34d384){return console[_0x4f3a2a(0x218)](_0x4f3a2a(0x1ed),_0x34d384&&_0x34d384[_0x4f3a2a(0x18b)]),()=>{};}});return _0x148843=>_0x4bbfae[_0x1d45e6(0x223)](_0x1e9b1b=>_0x1e9b1b(_0x148843));}function W(_0xcd8910){var _0x19fd65=_0x1f6eda;let _0xe1c7c0=function(_0x257a64,_0x5beefe){return _0x5beefe-_0x257a64;},_0x56f3aa;if(_0xcd8910['performance'])_0x56f3aa=function(){var _0xbc2fa=_0x588c;return _0xcd8910['performance'][_0xbc2fa(0x1a7)]();};else{if(_0xcd8910[_0x19fd65(0x202)]&&_0xcd8910[_0x19fd65(0x202)]['hrtime']&&_0xcd8910['process']?.[_0x19fd65(0x1ac)]?.['NEXT_RUNTIME']!==_0x19fd65(0x24e))_0x56f3aa=function(){var _0x2fa4e4=_0x19fd65;return _0xcd8910[_0x2fa4e4(0x202)][_0x2fa4e4(0x222)]();},_0xe1c7c0=function(_0x7c4c29,_0x284711){return 0x3e8*(_0x284711[0x0]-_0x7c4c29[0x0])+(_0x284711[0x1]-_0x7c4c29[0x1])/0xf4240;};else try{let {performance:_0x49a79d}=require(_0x19fd65(0x1e4));_0x56f3aa=function(){var _0x455ecb=_0x19fd65;return _0x49a79d[_0x455ecb(0x1a7)]();};}catch{_0x56f3aa=function(){return+new Date();};}}return{'elapsed':_0xe1c7c0,'timeStamp':_0x56f3aa,'now':()=>Date[_0x19fd65(0x1a7)]()};}function J(_0x3bb7f1,_0x52cea5,_0x3f625b){var _0x3bc793=_0x1f6eda;if(_0x3bb7f1[_0x3bc793(0x1f1)]!==void 0x0)return _0x3bb7f1[_0x3bc793(0x1f1)];let _0x3471bb=_0x3bb7f1[_0x3bc793(0x202)]?.[_0x3bc793(0x18c)]?.['node']||_0x3bb7f1[_0x3bc793(0x202)]?.[_0x3bc793(0x1ac)]?.[_0x3bc793(0x1c3)]===_0x3bc793(0x24e);return _0x3471bb&&_0x3f625b===_0x3bc793(0x24a)?_0x3bb7f1[_0x3bc793(0x1f1)]=!0x1:_0x3bb7f1['_consoleNinjaAllowedToStart']=_0x3471bb||!_0x52cea5||_0x3bb7f1['location']?.[_0x3bc793(0x258)]&&_0x52cea5[_0x3bc793(0x248)](_0x3bb7f1['location']['hostname']),_0x3bb7f1['_consoleNinjaAllowedToStart'];}function Y(_0xbd4ca0,_0x3f5da3,_0xde2948,_0x59bc57){var _0x545369=_0x1f6eda;_0xbd4ca0=_0xbd4ca0,_0x3f5da3=_0x3f5da3,_0xde2948=_0xde2948,_0x59bc57=_0x59bc57;let _0x246e53=W(_0xbd4ca0),_0x40efbf=_0x246e53[_0x545369(0x1d6)],_0x2ba42f=_0x246e53['timeStamp'];class _0x2f58d4{constructor(){var _0x5983b5=_0x545369;this[_0x5983b5(0x23e)]=/^(?!(?:do|if|in|for|let|new|try|var|case|else|enum|eval|false|null|this|true|void|with|break|catch|class|const|super|throw|while|yield|delete|export|import|public|return|static|switch|typeof|default|extends|finally|package|private|continue|debugger|function|arguments|interface|protected|implements|instanceof)$)[_$a-zA-Z\\xA0-\\uFFFF][_$a-zA-Z0-9\\xA0-\\uFFFF]*$/,this['_numberRegExp']=/^(0|[1-9][0-9]*)$/,this['_quotedRegExp']=/'([^\\\\']|\\\\')*'/,this[_0x5983b5(0x18d)]=_0xbd4ca0[_0x5983b5(0x238)],this[_0x5983b5(0x19a)]=_0xbd4ca0['HTMLAllCollection'],this[_0x5983b5(0x19f)]=Object[_0x5983b5(0x189)],this[_0x5983b5(0x214)]=Object['getOwnPropertyNames'],this[_0x5983b5(0x1d4)]=_0xbd4ca0[_0x5983b5(0x1ab)],this[_0x5983b5(0x22a)]=RegExp[_0x5983b5(0x1e9)][_0x5983b5(0x210)],this[_0x5983b5(0x1ba)]=Date['prototype'][_0x5983b5(0x210)];}[_0x545369(0x227)](_0x5e297c,_0x534ac6,_0x110f7e,_0x56be4c){var _0x37e86d=_0x545369,_0x3853b6=this,_0x4dfdfe=_0x110f7e[_0x37e86d(0x1f0)];function _0x19beb5(_0x1d59dc,_0x30c1f4,_0x40552c){var _0x30bb18=_0x37e86d;_0x30c1f4[_0x30bb18(0x1ce)]=_0x30bb18(0x237),_0x30c1f4['error']=_0x1d59dc[_0x30bb18(0x18b)],_0x46f576=_0x40552c[_0x30bb18(0x209)][_0x30bb18(0x224)],_0x40552c[_0x30bb18(0x209)][_0x30bb18(0x224)]=_0x30c1f4,_0x3853b6[_0x30bb18(0x1c8)](_0x30c1f4,_0x40552c);}try{_0x110f7e[_0x37e86d(0x1a0)]++,_0x110f7e[_0x37e86d(0x1f0)]&&_0x110f7e['autoExpandPreviousObjects'][_0x37e86d(0x20e)](_0x534ac6);var _0x48122b,_0x45f5ba,_0x1ec5c0,_0x41abfc,_0x318cb2=[],_0x38edcf=[],_0x1d822a,_0x18f27a=this[_0x37e86d(0x24d)](_0x534ac6),_0x335016=_0x18f27a===_0x37e86d(0x1b4),_0x2a2862=!0x1,_0x4aaa87=_0x18f27a===_0x37e86d(0x252),_0x45bac4=this[_0x37e86d(0x235)](_0x18f27a),_0x3ebca2=this[_0x37e86d(0x1c9)](_0x18f27a),_0x114dc1=_0x45bac4||_0x3ebca2,_0x3b1846={},_0x41592e=0x0,_0x1d539f=!0x1,_0x46f576,_0x2c41d2=/^(([1-9]{1}[0-9]*)|0)$/;if(_0x110f7e[_0x37e86d(0x17e)]){if(_0x335016){if(_0x45f5ba=_0x534ac6[_0x37e86d(0x251)],_0x45f5ba>_0x110f7e[_0x37e86d(0x211)]){for(_0x1ec5c0=0x0,_0x41abfc=_0x110f7e[_0x37e86d(0x211)],_0x48122b=_0x1ec5c0;_0x48122b<_0x41abfc;_0x48122b++)_0x38edcf[_0x37e86d(0x20e)](_0x3853b6[_0x37e86d(0x179)](_0x318cb2,_0x534ac6,_0x18f27a,_0x48122b,_0x110f7e));_0x5e297c[_0x37e86d(0x1a1)]=!0x0;}else{for(_0x1ec5c0=0x0,_0x41abfc=_0x45f5ba,_0x48122b=_0x1ec5c0;_0x48122b<_0x41abfc;_0x48122b++)_0x38edcf[_0x37e86d(0x20e)](_0x3853b6['_addProperty'](_0x318cb2,_0x534ac6,_0x18f27a,_0x48122b,_0x110f7e));}_0x110f7e[_0x37e86d(0x1eb)]+=_0x38edcf['length'];}if(!(_0x18f27a===_0x37e86d(0x173)||_0x18f27a==='undefined')&&!_0x45bac4&&_0x18f27a!=='String'&&_0x18f27a!==_0x37e86d(0x1bc)&&_0x18f27a!==_0x37e86d(0x1de)){var _0x6563a5=_0x56be4c[_0x37e86d(0x257)]||_0x110f7e['props'];if(this['_isSet'](_0x534ac6)?(_0x48122b=0x0,_0x534ac6['forEach'](function(_0x129dbd){var _0x3c202b=_0x37e86d;if(_0x41592e++,_0x110f7e[_0x3c202b(0x1eb)]++,_0x41592e>_0x6563a5){_0x1d539f=!0x0;return;}if(!_0x110f7e[_0x3c202b(0x22e)]&&_0x110f7e['autoExpand']&&_0x110f7e[_0x3c202b(0x1eb)]>_0x110f7e['autoExpandLimit']){_0x1d539f=!0x0;return;}_0x38edcf[_0x3c202b(0x20e)](_0x3853b6[_0x3c202b(0x179)](_0x318cb2,_0x534ac6,_0x3c202b(0x22d),_0x48122b++,_0x110f7e,function(_0x398743){return function(){return _0x398743;};}(_0x129dbd)));})):this[_0x37e86d(0x17b)](_0x534ac6)&&_0x534ac6[_0x37e86d(0x223)](function(_0x3495ef,_0x292181){var _0x3c30e0=_0x37e86d;if(_0x41592e++,_0x110f7e[_0x3c30e0(0x1eb)]++,_0x41592e>_0x6563a5){_0x1d539f=!0x0;return;}if(!_0x110f7e[_0x3c30e0(0x22e)]&&_0x110f7e['autoExpand']&&_0x110f7e[_0x3c30e0(0x1eb)]>_0x110f7e['autoExpandLimit']){_0x1d539f=!0x0;return;}var _0x18a4fc=_0x292181['toString']();_0x18a4fc[_0x3c30e0(0x251)]>0x64&&(_0x18a4fc=_0x18a4fc[_0x3c30e0(0x23f)](0x0,0x64)+'...'),_0x38edcf[_0x3c30e0(0x20e)](_0x3853b6[_0x3c30e0(0x179)](_0x318cb2,_0x534ac6,_0x3c30e0(0x1ef),_0x18a4fc,_0x110f7e,function(_0xf138f5){return function(){return _0xf138f5;};}(_0x3495ef)));}),!_0x2a2862){try{for(_0x1d822a in _0x534ac6)if(!(_0x335016&&_0x2c41d2[_0x37e86d(0x1a2)](_0x1d822a))&&!this[_0x37e86d(0x219)](_0x534ac6,_0x1d822a,_0x110f7e)){if(_0x41592e++,_0x110f7e[_0x37e86d(0x1eb)]++,_0x41592e>_0x6563a5){_0x1d539f=!0x0;break;}if(!_0x110f7e[_0x37e86d(0x22e)]&&_0x110f7e[_0x37e86d(0x1f0)]&&_0x110f7e[_0x37e86d(0x1eb)]>_0x110f7e[_0x37e86d(0x1b5)]){_0x1d539f=!0x0;break;}_0x38edcf[_0x37e86d(0x20e)](_0x3853b6[_0x37e86d(0x1c5)](_0x318cb2,_0x3b1846,_0x534ac6,_0x18f27a,_0x1d822a,_0x110f7e));}}catch{}if(_0x3b1846[_0x37e86d(0x1bb)]=!0x0,_0x4aaa87&&(_0x3b1846[_0x37e86d(0x1bf)]=!0x0),!_0x1d539f){var _0x29046c=[]['concat'](this[_0x37e86d(0x214)](_0x534ac6))[_0x37e86d(0x1b3)](this[_0x37e86d(0x1a4)](_0x534ac6));for(_0x48122b=0x0,_0x45f5ba=_0x29046c['length'];_0x48122b<_0x45f5ba;_0x48122b++)if(_0x1d822a=_0x29046c[_0x48122b],!(_0x335016&&_0x2c41d2[_0x37e86d(0x1a2)](_0x1d822a[_0x37e86d(0x210)]()))&&!this[_0x37e86d(0x219)](_0x534ac6,_0x1d822a,_0x110f7e)&&!_0x3b1846[_0x37e86d(0x255)+_0x1d822a[_0x37e86d(0x210)]()]){if(_0x41592e++,_0x110f7e[_0x37e86d(0x1eb)]++,_0x41592e>_0x6563a5){_0x1d539f=!0x0;break;}if(!_0x110f7e[_0x37e86d(0x22e)]&&_0x110f7e[_0x37e86d(0x1f0)]&&_0x110f7e[_0x37e86d(0x1eb)]>_0x110f7e[_0x37e86d(0x1b5)]){_0x1d539f=!0x0;break;}_0x38edcf[_0x37e86d(0x20e)](_0x3853b6[_0x37e86d(0x1c5)](_0x318cb2,_0x3b1846,_0x534ac6,_0x18f27a,_0x1d822a,_0x110f7e));}}}}}if(_0x5e297c[_0x37e86d(0x1ce)]=_0x18f27a,_0x114dc1?(_0x5e297c[_0x37e86d(0x25b)]=_0x534ac6[_0x37e86d(0x19b)](),this[_0x37e86d(0x1af)](_0x18f27a,_0x5e297c,_0x110f7e,_0x56be4c)):_0x18f27a==='date'?_0x5e297c['value']=this[_0x37e86d(0x1ba)]['call'](_0x534ac6):_0x18f27a==='bigint'?_0x5e297c[_0x37e86d(0x25b)]=_0x534ac6[_0x37e86d(0x210)]():_0x18f27a==='RegExp'?_0x5e297c[_0x37e86d(0x25b)]=this[_0x37e86d(0x22a)][_0x37e86d(0x1cb)](_0x534ac6):_0x18f27a==='symbol'&&this[_0x37e86d(0x1d4)]?_0x5e297c[_0x37e86d(0x25b)]=this['_Symbol'][_0x37e86d(0x1e9)][_0x37e86d(0x210)][_0x37e86d(0x1cb)](_0x534ac6):!_0x110f7e['depth']&&!(_0x18f27a===_0x37e86d(0x173)||_0x18f27a===_0x37e86d(0x238))&&(delete _0x5e297c[_0x37e86d(0x25b)],_0x5e297c['capped']=!0x0),_0x1d539f&&(_0x5e297c[_0x37e86d(0x246)]=!0x0),_0x46f576=_0x110f7e[_0x37e86d(0x209)][_0x37e86d(0x224)],_0x110f7e['node'][_0x37e86d(0x224)]=_0x5e297c,this[_0x37e86d(0x1c8)](_0x5e297c,_0x110f7e),_0x38edcf[_0x37e86d(0x251)]){for(_0x48122b=0x0,_0x45f5ba=_0x38edcf['length'];_0x48122b<_0x45f5ba;_0x48122b++)_0x38edcf[_0x48122b](_0x48122b);}_0x318cb2['length']&&(_0x5e297c[_0x37e86d(0x257)]=_0x318cb2);}catch(_0x289ed1){_0x19beb5(_0x289ed1,_0x5e297c,_0x110f7e);}return this[_0x37e86d(0x225)](_0x534ac6,_0x5e297c),this['_treeNodePropertiesAfterFullValue'](_0x5e297c,_0x110f7e),_0x110f7e[_0x37e86d(0x209)][_0x37e86d(0x224)]=_0x46f576,_0x110f7e[_0x37e86d(0x1a0)]--,_0x110f7e['autoExpand']=_0x4dfdfe,_0x110f7e['autoExpand']&&_0x110f7e[_0x37e86d(0x1e5)][_0x37e86d(0x1f2)](),_0x5e297c;}['_getOwnPropertySymbols'](_0x1069d2){var _0x723d6b=_0x545369;return Object[_0x723d6b(0x1f4)]?Object[_0x723d6b(0x1f4)](_0x1069d2):[];}['_isSet'](_0x348680){var _0x19684d=_0x545369;return!!(_0x348680&&_0xbd4ca0[_0x19684d(0x22d)]&&this[_0x19684d(0x22c)](_0x348680)===_0x19684d(0x1c1)&&_0x348680[_0x19684d(0x223)]);}[_0x545369(0x219)](_0x3855fe,_0x4f6183,_0x537161){var _0x1f4e53=_0x545369;return _0x537161[_0x1f4e53(0x20a)]?typeof _0x3855fe[_0x4f6183]==_0x1f4e53(0x252):!0x1;}[_0x545369(0x24d)](_0x5af96a){var _0x58353d=_0x545369,_0x187b92='';return _0x187b92=typeof _0x5af96a,_0x187b92===_0x58353d(0x1aa)?this['_objectToString'](_0x5af96a)===_0x58353d(0x1f7)?_0x187b92='array':this[_0x58353d(0x22c)](_0x5af96a)===_0x58353d(0x1be)?_0x187b92=_0x58353d(0x1b9):this['_objectToString'](_0x5af96a)===_0x58353d(0x197)?_0x187b92=_0x58353d(0x1de):_0x5af96a===null?_0x187b92=_0x58353d(0x173):_0x5af96a[_0x58353d(0x1ec)]&&(_0x187b92=_0x5af96a['constructor'][_0x58353d(0x23d)]||_0x187b92):_0x187b92===_0x58353d(0x238)&&this[_0x58353d(0x19a)]&&_0x5af96a instanceof this[_0x58353d(0x19a)]&&(_0x187b92=_0x58353d(0x1c7)),_0x187b92;}[_0x545369(0x22c)](_0x3c0da2){var _0x33fbb9=_0x545369;return Object[_0x33fbb9(0x1e9)]['toString'][_0x33fbb9(0x1cb)](_0x3c0da2);}['_isPrimitiveType'](_0xa69330){var _0x573c5a=_0x545369;return _0xa69330==='boolean'||_0xa69330===_0x573c5a(0x217)||_0xa69330===_0x573c5a(0x1b0);}[_0x545369(0x1c9)](_0x4ff28b){var _0x581072=_0x545369;return _0x4ff28b===_0x581072(0x21e)||_0x4ff28b===_0x581072(0x208)||_0x4ff28b===_0x581072(0x1d1);}[_0x545369(0x179)](_0x5b8a3f,_0x1232b2,_0x519405,_0x4c7929,_0x2456fa,_0x3fcaf4){var _0x44d25a=this;return function(_0x5c7843){var _0x235ced=_0x588c,_0x28223c=_0x2456fa['node'][_0x235ced(0x224)],_0x4f142b=_0x2456fa[_0x235ced(0x209)][_0x235ced(0x188)],_0x5f37ae=_0x2456fa[_0x235ced(0x209)][_0x235ced(0x1ee)];_0x2456fa[_0x235ced(0x209)][_0x235ced(0x1ee)]=_0x28223c,_0x2456fa[_0x235ced(0x209)][_0x235ced(0x188)]=typeof _0x4c7929==_0x235ced(0x1b0)?_0x4c7929:_0x5c7843,_0x5b8a3f[_0x235ced(0x20e)](_0x44d25a[_0x235ced(0x1ff)](_0x1232b2,_0x519405,_0x4c7929,_0x2456fa,_0x3fcaf4)),_0x2456fa['node'][_0x235ced(0x1ee)]=_0x5f37ae,_0x2456fa[_0x235ced(0x209)][_0x235ced(0x188)]=_0x4f142b;};}['_addObjectProperty'](_0x50721d,_0xf736e8,_0x34b355,_0x17666a,_0x20a6dc,_0x1d8048,_0x347b89){var _0x127354=_0x545369,_0x3a6a50=this;return _0xf736e8[_0x127354(0x255)+_0x20a6dc[_0x127354(0x210)]()]=!0x0,function(_0x2550cd){var _0x2b09eb=_0x127354,_0x49be58=_0x1d8048[_0x2b09eb(0x209)][_0x2b09eb(0x224)],_0x20be3f=_0x1d8048[_0x2b09eb(0x209)][_0x2b09eb(0x188)],_0x5759c6=_0x1d8048[_0x2b09eb(0x209)][_0x2b09eb(0x1ee)];_0x1d8048[_0x2b09eb(0x209)][_0x2b09eb(0x1ee)]=_0x49be58,_0x1d8048[_0x2b09eb(0x209)][_0x2b09eb(0x188)]=_0x2550cd,_0x50721d[_0x2b09eb(0x20e)](_0x3a6a50[_0x2b09eb(0x1ff)](_0x34b355,_0x17666a,_0x20a6dc,_0x1d8048,_0x347b89)),_0x1d8048[_0x2b09eb(0x209)][_0x2b09eb(0x1ee)]=_0x5759c6,_0x1d8048[_0x2b09eb(0x209)][_0x2b09eb(0x188)]=_0x20be3f;};}[_0x545369(0x1ff)](_0x29d290,_0x33d1dc,_0x3dc5c9,_0x4f3ace,_0x4c1214){var _0xe87137=_0x545369,_0x4f5999=this;_0x4c1214||(_0x4c1214=function(_0x3f1a47,_0xe7d713){return _0x3f1a47[_0xe7d713];});var _0x2b3662=_0x3dc5c9[_0xe87137(0x210)](),_0x51194c=_0x4f3ace[_0xe87137(0x1d5)]||{},_0x4ec001=_0x4f3ace[_0xe87137(0x17e)],_0x2cdc0a=_0x4f3ace[_0xe87137(0x22e)];try{var _0x4eb65d=this[_0xe87137(0x17b)](_0x29d290),_0x52885b=_0x2b3662;_0x4eb65d&&_0x52885b[0x0]==='\\x27'&&(_0x52885b=_0x52885b[_0xe87137(0x1b6)](0x1,_0x52885b[_0xe87137(0x251)]-0x2));var _0x1c2d57=_0x4f3ace[_0xe87137(0x1d5)]=_0x51194c['_p_'+_0x52885b];_0x1c2d57&&(_0x4f3ace[_0xe87137(0x17e)]=_0x4f3ace['depth']+0x1),_0x4f3ace['isExpressionToEvaluate']=!!_0x1c2d57;var _0x2c2467=typeof _0x3dc5c9==_0xe87137(0x22f),_0x1ead94={'name':_0x2c2467||_0x4eb65d?_0x2b3662:this['_propertyName'](_0x2b3662)};if(_0x2c2467&&(_0x1ead94['symbol']=!0x0),!(_0x33d1dc===_0xe87137(0x1b4)||_0x33d1dc===_0xe87137(0x201))){var _0x4b6e27=this[_0xe87137(0x19f)](_0x29d290,_0x3dc5c9);if(_0x4b6e27&&(_0x4b6e27[_0xe87137(0x1f5)]&&(_0x1ead94[_0xe87137(0x1c6)]=!0x0),_0x4b6e27[_0xe87137(0x1c2)]&&!_0x1c2d57&&!_0x4f3ace[_0xe87137(0x1c0)]))return _0x1ead94['getter']=!0x0,this[_0xe87137(0x193)](_0x1ead94,_0x4f3ace),_0x1ead94;}var _0x2ac1d8;try{_0x2ac1d8=_0x4c1214(_0x29d290,_0x3dc5c9);}catch(_0x51b74f){return _0x1ead94={'name':_0x2b3662,'type':_0xe87137(0x237),'error':_0x51b74f[_0xe87137(0x18b)]},this[_0xe87137(0x193)](_0x1ead94,_0x4f3ace),_0x1ead94;}var _0x363a2e=this[_0xe87137(0x24d)](_0x2ac1d8),_0x33a185=this[_0xe87137(0x235)](_0x363a2e);if(_0x1ead94[_0xe87137(0x1ce)]=_0x363a2e,_0x33a185)this[_0xe87137(0x193)](_0x1ead94,_0x4f3ace,_0x2ac1d8,function(){var _0x12d2d0=_0xe87137;_0x1ead94[_0x12d2d0(0x25b)]=_0x2ac1d8[_0x12d2d0(0x19b)](),!_0x1c2d57&&_0x4f5999[_0x12d2d0(0x1af)](_0x363a2e,_0x1ead94,_0x4f3ace,{});});else{var _0x5c36f4=_0x4f3ace[_0xe87137(0x1f0)]&&_0x4f3ace[_0xe87137(0x1a0)]<_0x4f3ace['autoExpandMaxDepth']&&_0x4f3ace[_0xe87137(0x1e5)][_0xe87137(0x250)](_0x2ac1d8)<0x0&&_0x363a2e!=='function'&&_0x4f3ace[_0xe87137(0x1eb)]<_0x4f3ace[_0xe87137(0x1b5)];_0x5c36f4||_0x4f3ace[_0xe87137(0x1a0)]<_0x4ec001||_0x1c2d57?(this[_0xe87137(0x227)](_0x1ead94,_0x2ac1d8,_0x4f3ace,_0x1c2d57||{}),this[_0xe87137(0x225)](_0x2ac1d8,_0x1ead94)):this[_0xe87137(0x193)](_0x1ead94,_0x4f3ace,_0x2ac1d8,function(){var _0x5569b6=_0xe87137;_0x363a2e==='null'||_0x363a2e===_0x5569b6(0x238)||(delete _0x1ead94[_0x5569b6(0x25b)],_0x1ead94[_0x5569b6(0x21d)]=!0x0);});}return _0x1ead94;}finally{_0x4f3ace[_0xe87137(0x1d5)]=_0x51194c,_0x4f3ace[_0xe87137(0x17e)]=_0x4ec001,_0x4f3ace[_0xe87137(0x22e)]=_0x2cdc0a;}}[_0x545369(0x1af)](_0x37e115,_0x632dca,_0x4033d8,_0x331bac){var _0x2fa5eb=_0x545369,_0x1c5cea=_0x331bac[_0x2fa5eb(0x233)]||_0x4033d8[_0x2fa5eb(0x233)];if((_0x37e115===_0x2fa5eb(0x217)||_0x37e115===_0x2fa5eb(0x208))&&_0x632dca['value']){let _0x52e658=_0x632dca['value'][_0x2fa5eb(0x251)];_0x4033d8[_0x2fa5eb(0x249)]+=_0x52e658,_0x4033d8[_0x2fa5eb(0x249)]>_0x4033d8['totalStrLength']?(_0x632dca[_0x2fa5eb(0x21d)]='',delete _0x632dca[_0x2fa5eb(0x25b)]):_0x52e658>_0x1c5cea&&(_0x632dca[_0x2fa5eb(0x21d)]=_0x632dca[_0x2fa5eb(0x25b)][_0x2fa5eb(0x1b6)](0x0,_0x1c5cea),delete _0x632dca[_0x2fa5eb(0x25b)]);}}[_0x545369(0x17b)](_0x47a64f){var _0x386352=_0x545369;return!!(_0x47a64f&&_0xbd4ca0['Map']&&this['_objectToString'](_0x47a64f)===_0x386352(0x215)&&_0x47a64f[_0x386352(0x223)]);}['_propertyName'](_0x5ad659){var _0x46b9ce=_0x545369;if(_0x5ad659[_0x46b9ce(0x1ad)](/^\\d+$/))return _0x5ad659;var _0x5ac031;try{_0x5ac031=JSON[_0x46b9ce(0x216)](''+_0x5ad659);}catch{_0x5ac031='\\x22'+this[_0x46b9ce(0x22c)](_0x5ad659)+'\\x22';}return _0x5ac031['match'](/^\"([a-zA-Z_][a-zA-Z_0-9]*)\"$/)?_0x5ac031=_0x5ac031[_0x46b9ce(0x1b6)](0x1,_0x5ac031['length']-0x2):_0x5ac031=_0x5ac031[_0x46b9ce(0x1dc)](/'/g,'\\x5c\\x27')[_0x46b9ce(0x1dc)](/\\\\\"/g,'\\x22')['replace'](/(^\"|\"$)/g,'\\x27'),_0x5ac031;}['_processTreeNodeResult'](_0x47ec42,_0x5856b8,_0x1b972c,_0x1b7c2f){var _0x9f56bc=_0x545369;this[_0x9f56bc(0x1c8)](_0x47ec42,_0x5856b8),_0x1b7c2f&&_0x1b7c2f(),this[_0x9f56bc(0x225)](_0x1b972c,_0x47ec42),this['_treeNodePropertiesAfterFullValue'](_0x47ec42,_0x5856b8);}[_0x545369(0x1c8)](_0x36c42c,_0x1d34c0){var _0x2d3916=_0x545369;this['_setNodeId'](_0x36c42c,_0x1d34c0),this[_0x2d3916(0x177)](_0x36c42c,_0x1d34c0),this[_0x2d3916(0x232)](_0x36c42c,_0x1d34c0),this[_0x2d3916(0x19e)](_0x36c42c,_0x1d34c0);}['_setNodeId'](_0x2b614d,_0x8a3cb3){}[_0x545369(0x177)](_0xd7dff2,_0x5aa9b6){}[_0x545369(0x213)](_0x37b2da,_0x11f26c){}['_isUndefined'](_0x40ec05){var _0x5471b1=_0x545369;return _0x40ec05===this[_0x5471b1(0x18d)];}[_0x545369(0x1dd)](_0x17f01a,_0x41a4c5){var _0xb15b45=_0x545369;this[_0xb15b45(0x213)](_0x17f01a,_0x41a4c5),this['_setNodeExpandableState'](_0x17f01a),_0x41a4c5[_0xb15b45(0x172)]&&this[_0xb15b45(0x184)](_0x17f01a),this[_0xb15b45(0x231)](_0x17f01a,_0x41a4c5),this[_0xb15b45(0x1f6)](_0x17f01a,_0x41a4c5),this[_0xb15b45(0x21c)](_0x17f01a);}[_0x545369(0x225)](_0x3e8395,_0x4f84c9){var _0x5dd20e=_0x545369;let _0x20421f;try{_0xbd4ca0['console']&&(_0x20421f=_0xbd4ca0['console'][_0x5dd20e(0x198)],_0xbd4ca0[_0x5dd20e(0x21a)][_0x5dd20e(0x198)]=function(){}),_0x3e8395&&typeof _0x3e8395[_0x5dd20e(0x251)]==_0x5dd20e(0x1b0)&&(_0x4f84c9['length']=_0x3e8395['length']);}catch{}finally{_0x20421f&&(_0xbd4ca0[_0x5dd20e(0x21a)][_0x5dd20e(0x198)]=_0x20421f);}if(_0x4f84c9[_0x5dd20e(0x1ce)]===_0x5dd20e(0x1b0)||_0x4f84c9[_0x5dd20e(0x1ce)]===_0x5dd20e(0x1d1)){if(isNaN(_0x4f84c9[_0x5dd20e(0x25b)]))_0x4f84c9['nan']=!0x0,delete _0x4f84c9['value'];else switch(_0x4f84c9[_0x5dd20e(0x25b)]){case Number['POSITIVE_INFINITY']:_0x4f84c9[_0x5dd20e(0x1e0)]=!0x0,delete _0x4f84c9[_0x5dd20e(0x25b)];break;case Number['NEGATIVE_INFINITY']:_0x4f84c9[_0x5dd20e(0x221)]=!0x0,delete _0x4f84c9[_0x5dd20e(0x25b)];break;case 0x0:this[_0x5dd20e(0x1fe)](_0x4f84c9[_0x5dd20e(0x25b)])&&(_0x4f84c9[_0x5dd20e(0x1b1)]=!0x0);break;}}else _0x4f84c9[_0x5dd20e(0x1ce)]===_0x5dd20e(0x252)&&typeof _0x3e8395[_0x5dd20e(0x23d)]==_0x5dd20e(0x217)&&_0x3e8395['name']&&_0x4f84c9[_0x5dd20e(0x23d)]&&_0x3e8395[_0x5dd20e(0x23d)]!==_0x4f84c9[_0x5dd20e(0x23d)]&&(_0x4f84c9['funcName']=_0x3e8395[_0x5dd20e(0x23d)]);}['_isNegativeZero'](_0x4eef47){var _0x571b0e=_0x545369;return 0x1/_0x4eef47===Number[_0x571b0e(0x191)];}[_0x545369(0x184)](_0x2d2bae){var _0x501cd1=_0x545369;!_0x2d2bae[_0x501cd1(0x257)]||!_0x2d2bae['props']['length']||_0x2d2bae[_0x501cd1(0x1ce)]===_0x501cd1(0x1b4)||_0x2d2bae[_0x501cd1(0x1ce)]===_0x501cd1(0x1ef)||_0x2d2bae['type']===_0x501cd1(0x22d)||_0x2d2bae[_0x501cd1(0x257)]['sort'](function(_0x206b78,_0xc11ce2){var _0x5d4834=_0x501cd1,_0x1e7689=_0x206b78[_0x5d4834(0x23d)][_0x5d4834(0x183)](),_0x5aa6fd=_0xc11ce2['name'][_0x5d4834(0x183)]();return _0x1e7689<_0x5aa6fd?-0x1:_0x1e7689>_0x5aa6fd?0x1:0x0;});}[_0x545369(0x231)](_0x647e8a,_0x535f77){var _0x5bf9bf=_0x545369;if(!(_0x535f77['noFunctions']||!_0x647e8a[_0x5bf9bf(0x257)]||!_0x647e8a[_0x5bf9bf(0x257)][_0x5bf9bf(0x251)])){for(var _0x965581=[],_0x38ee55=[],_0x27c0e6=0x0,_0x5d1cc7=_0x647e8a[_0x5bf9bf(0x257)][_0x5bf9bf(0x251)];_0x27c0e6<_0x5d1cc7;_0x27c0e6++){var _0x129c26=_0x647e8a['props'][_0x27c0e6];_0x129c26['type']===_0x5bf9bf(0x252)?_0x965581[_0x5bf9bf(0x20e)](_0x129c26):_0x38ee55['push'](_0x129c26);}if(!(!_0x38ee55[_0x5bf9bf(0x251)]||_0x965581[_0x5bf9bf(0x251)]<=0x1)){_0x647e8a[_0x5bf9bf(0x257)]=_0x38ee55;var _0x255a05={'functionsNode':!0x0,'props':_0x965581};this[_0x5bf9bf(0x23b)](_0x255a05,_0x535f77),this[_0x5bf9bf(0x213)](_0x255a05,_0x535f77),this[_0x5bf9bf(0x1fb)](_0x255a05),this[_0x5bf9bf(0x19e)](_0x255a05,_0x535f77),_0x255a05['id']+='\\x20f',_0x647e8a['props']['unshift'](_0x255a05);}}}[_0x545369(0x1f6)](_0x54674b,_0x975497){}[_0x545369(0x1fb)](_0x36e117){}[_0x545369(0x181)](_0x1b1aaa){var _0x4803bf=_0x545369;return Array[_0x4803bf(0x207)](_0x1b1aaa)||typeof _0x1b1aaa==_0x4803bf(0x1aa)&&this['_objectToString'](_0x1b1aaa)===_0x4803bf(0x1f7);}[_0x545369(0x19e)](_0x4385ec,_0xfc5f44){}[_0x545369(0x21c)](_0x8e1120){var _0x30365a=_0x545369;delete _0x8e1120[_0x30365a(0x194)],delete _0x8e1120[_0x30365a(0x243)],delete _0x8e1120['_hasMapOnItsPath'];}[_0x545369(0x232)](_0x18e420,_0x45879b){}}let _0x485536=new _0x2f58d4(),_0x4be095={'props':0x64,'elements':0x64,'strLength':0x400*0x32,'totalStrLength':0x400*0x32,'autoExpandLimit':0x1388,'autoExpandMaxDepth':0xa},_0x13f799={'props':0x5,'elements':0x5,'strLength':0x100,'totalStrLength':0x100*0x3,'autoExpandLimit':0x1e,'autoExpandMaxDepth':0x2};function _0x4e63b5(_0x48efcc,_0x422d7c,_0x4e0d6b,_0x3c6654,_0x381fc3,_0x2064c4){var _0x53b142=_0x545369;let _0x114e5c,_0x712209;try{_0x712209=_0x2ba42f(),_0x114e5c=_0xde2948[_0x422d7c],!_0x114e5c||_0x712209-_0x114e5c['ts']>0x1f4&&_0x114e5c['count']&&_0x114e5c[_0x53b142(0x1d0)]/_0x114e5c[_0x53b142(0x226)]<0x64?(_0xde2948[_0x422d7c]=_0x114e5c={'count':0x0,'time':0x0,'ts':_0x712209},_0xde2948[_0x53b142(0x1a8)]={}):_0x712209-_0xde2948[_0x53b142(0x1a8)]['ts']>0x32&&_0xde2948[_0x53b142(0x1a8)]['count']&&_0xde2948['hits'][_0x53b142(0x1d0)]/_0xde2948[_0x53b142(0x1a8)]['count']<0x64&&(_0xde2948[_0x53b142(0x1a8)]={});let _0x9271d=[],_0x5e3442=_0x114e5c[_0x53b142(0x1e6)]||_0xde2948[_0x53b142(0x1a8)][_0x53b142(0x1e6)]?_0x13f799:_0x4be095,_0x38367a=_0x39458b=>{var _0x2a5eef=_0x53b142;let _0x805051={};return _0x805051[_0x2a5eef(0x257)]=_0x39458b[_0x2a5eef(0x257)],_0x805051['elements']=_0x39458b[_0x2a5eef(0x211)],_0x805051[_0x2a5eef(0x233)]=_0x39458b[_0x2a5eef(0x233)],_0x805051[_0x2a5eef(0x245)]=_0x39458b['totalStrLength'],_0x805051['autoExpandLimit']=_0x39458b[_0x2a5eef(0x1b5)],_0x805051[_0x2a5eef(0x25a)]=_0x39458b['autoExpandMaxDepth'],_0x805051[_0x2a5eef(0x172)]=!0x1,_0x805051[_0x2a5eef(0x20a)]=!_0x3f5da3,_0x805051[_0x2a5eef(0x17e)]=0x1,_0x805051[_0x2a5eef(0x1a0)]=0x0,_0x805051[_0x2a5eef(0x259)]='root_exp_id',_0x805051[_0x2a5eef(0x228)]=_0x2a5eef(0x190),_0x805051[_0x2a5eef(0x1f0)]=!0x0,_0x805051[_0x2a5eef(0x1e5)]=[],_0x805051[_0x2a5eef(0x1eb)]=0x0,_0x805051[_0x2a5eef(0x1c0)]=!0x0,_0x805051[_0x2a5eef(0x249)]=0x0,_0x805051[_0x2a5eef(0x209)]={'current':void 0x0,'parent':void 0x0,'index':0x0},_0x805051;};for(var _0x353e65=0x0;_0x353e65<_0x381fc3['length'];_0x353e65++)_0x9271d['push'](_0x485536[_0x53b142(0x227)]({'timeNode':_0x48efcc===_0x53b142(0x1d0)||void 0x0},_0x381fc3[_0x353e65],_0x38367a(_0x5e3442),{}));if(_0x48efcc==='trace'){let _0x56bbd8=Error[_0x53b142(0x1e2)];try{Error[_0x53b142(0x1e2)]=0x1/0x0,_0x9271d['push'](_0x485536[_0x53b142(0x227)]({'stackNode':!0x0},new Error()['stack'],_0x38367a(_0x5e3442),{'strLength':0x1/0x0}));}finally{Error[_0x53b142(0x1e2)]=_0x56bbd8;}}return{'method':_0x53b142(0x1c4),'version':_0x59bc57,'args':[{'ts':_0x4e0d6b,'session':_0x3c6654,'args':_0x9271d,'id':_0x422d7c,'context':_0x2064c4}]};}catch(_0x43f89c){return{'method':'log','version':_0x59bc57,'args':[{'ts':_0x4e0d6b,'session':_0x3c6654,'args':[{'type':_0x53b142(0x237),'error':_0x43f89c&&_0x43f89c[_0x53b142(0x18b)]}],'id':_0x422d7c,'context':_0x2064c4}]};}finally{try{if(_0x114e5c&&_0x712209){let _0x50ac2d=_0x2ba42f();_0x114e5c[_0x53b142(0x226)]++,_0x114e5c['time']+=_0x40efbf(_0x712209,_0x50ac2d),_0x114e5c['ts']=_0x50ac2d,_0xde2948[_0x53b142(0x1a8)][_0x53b142(0x226)]++,_0xde2948[_0x53b142(0x1a8)][_0x53b142(0x1d0)]+=_0x40efbf(_0x712209,_0x50ac2d),_0xde2948['hits']['ts']=_0x50ac2d,(_0x114e5c[_0x53b142(0x226)]>0x32||_0x114e5c[_0x53b142(0x1d0)]>0x64)&&(_0x114e5c[_0x53b142(0x1e6)]=!0x0),(_0xde2948[_0x53b142(0x1a8)]['count']>0x3e8||_0xde2948[_0x53b142(0x1a8)][_0x53b142(0x1d0)]>0x12c)&&(_0xde2948[_0x53b142(0x1a8)][_0x53b142(0x1e6)]=!0x0);}}catch{}}}return _0x4e63b5;}((_0x397823,_0xa9058f,_0x662412,_0x43560e,_0x7a7719,_0x41294b,_0x3f36f9,_0x2a667e,_0x22c644,_0x979242)=>{var _0x299fe2=_0x1f6eda;if(_0x397823[_0x299fe2(0x1df)])return _0x397823[_0x299fe2(0x1df)];if(!J(_0x397823,_0x2a667e,_0x7a7719))return _0x397823[_0x299fe2(0x1df)]={'consoleLog':()=>{},'consoleTrace':()=>{},'consoleTime':()=>{},'consoleTimeEnd':()=>{},'autoLog':()=>{},'autoLogMany':()=>{},'autoTraceMany':()=>{},'coverage':()=>{},'autoTrace':()=>{},'autoTime':()=>{},'autoTimeEnd':()=>{}},_0x397823['_console_ninja'];let _0x41c48e=W(_0x397823),_0x24d075=_0x41c48e[_0x299fe2(0x1d6)],_0x4a9ec1=_0x41c48e[_0x299fe2(0x244)],_0x59aac0=_0x41c48e[_0x299fe2(0x1a7)],_0x46a5d6={'hits':{},'ts':{}},_0x38ed34=Y(_0x397823,_0x22c644,_0x46a5d6,_0x41294b),_0x33ac10=_0xec81bd=>{_0x46a5d6['ts'][_0xec81bd]=_0x4a9ec1();},_0x214ca4=(_0x2cc30e,_0x307583)=>{let _0x2c3d01=_0x46a5d6['ts'][_0x307583];if(delete _0x46a5d6['ts'][_0x307583],_0x2c3d01){let _0x4e4473=_0x24d075(_0x2c3d01,_0x4a9ec1());_0x3b5fab(_0x38ed34('time',_0x2cc30e,_0x59aac0(),_0x4b74ac,[_0x4e4473],_0x307583));}},_0x216770=_0xd45304=>_0x1872b8=>{var _0xff0a0d=_0x299fe2;try{_0x33ac10(_0x1872b8),_0xd45304(_0x1872b8);}finally{_0x397823[_0xff0a0d(0x21a)][_0xff0a0d(0x1d0)]=_0xd45304;}},_0x424542=_0x1b68e2=>_0x410b69=>{var _0xa8a6f6=_0x299fe2;try{let [_0x2983a6,_0x2a1e79]=_0x410b69[_0xa8a6f6(0x20f)](_0xa8a6f6(0x1cc));_0x214ca4(_0x2a1e79,_0x2983a6),_0x1b68e2(_0x2983a6);}finally{_0x397823[_0xa8a6f6(0x21a)][_0xa8a6f6(0x192)]=_0x1b68e2;}};_0x397823[_0x299fe2(0x1df)]={'consoleLog':(_0x557bbe,_0xb7e0ff)=>{var _0x218e61=_0x299fe2;_0x397823['console']['log'][_0x218e61(0x23d)]!==_0x218e61(0x1e8)&&_0x3b5fab(_0x38ed34(_0x218e61(0x1c4),_0x557bbe,_0x59aac0(),_0x4b74ac,_0xb7e0ff));},'consoleTrace':(_0x648621,_0x419e93)=>{var _0xcfd31e=_0x299fe2;_0x397823[_0xcfd31e(0x21a)][_0xcfd31e(0x1c4)][_0xcfd31e(0x23d)]!==_0xcfd31e(0x1b7)&&_0x3b5fab(_0x38ed34(_0xcfd31e(0x19d),_0x648621,_0x59aac0(),_0x4b74ac,_0x419e93));},'consoleTime':()=>{var _0x1cf6a3=_0x299fe2;_0x397823[_0x1cf6a3(0x21a)][_0x1cf6a3(0x1d0)]=_0x216770(_0x397823[_0x1cf6a3(0x21a)]['time']);},'consoleTimeEnd':()=>{var _0x143a42=_0x299fe2;_0x397823[_0x143a42(0x21a)]['timeEnd']=_0x424542(_0x397823[_0x143a42(0x21a)][_0x143a42(0x192)]);},'autoLog':(_0x4a9cf1,_0x7d7e42)=>{var _0x36905b=_0x299fe2;_0x3b5fab(_0x38ed34(_0x36905b(0x1c4),_0x7d7e42,_0x59aac0(),_0x4b74ac,[_0x4a9cf1]));},'autoLogMany':(_0x6761e9,_0x5b6d99)=>{var _0xbde178=_0x299fe2;_0x3b5fab(_0x38ed34(_0xbde178(0x1c4),_0x6761e9,_0x59aac0(),_0x4b74ac,_0x5b6d99));},'autoTrace':(_0x3fd090,_0x3bcc3f)=>{var _0x5427e5=_0x299fe2;_0x3b5fab(_0x38ed34(_0x5427e5(0x19d),_0x3bcc3f,_0x59aac0(),_0x4b74ac,[_0x3fd090]));},'autoTraceMany':(_0x160407,_0x476de5)=>{var _0x4a26ee=_0x299fe2;_0x3b5fab(_0x38ed34(_0x4a26ee(0x19d),_0x160407,_0x59aac0(),_0x4b74ac,_0x476de5));},'autoTime':(_0x2ebc4f,_0x8f55ad,_0xb83791)=>{_0x33ac10(_0xb83791);},'autoTimeEnd':(_0x318572,_0x407429,_0x14912f)=>{_0x214ca4(_0x407429,_0x14912f);},'coverage':_0x3ea1ad=>{var _0x27f71f=_0x299fe2;_0x3b5fab({'method':_0x27f71f(0x1a5),'version':_0x41294b,'args':[{'id':_0x3ea1ad}]});}};let _0x3b5fab=b(_0x397823,_0xa9058f,_0x662412,_0x43560e,_0x7a7719,_0x979242),_0x4b74ac=_0x397823[_0x299fe2(0x22b)];return _0x397823[_0x299fe2(0x1df)];})(globalThis,_0x1f6eda(0x241),_0x1f6eda(0x203),_0x1f6eda(0x1db),_0x1f6eda(0x220),_0x1f6eda(0x1a3),_0x1f6eda(0x1d7),_0x1f6eda(0x1d3),_0x1f6eda(0x17d),_0x1f6eda(0x174));");
}
catch (e) { } }
;
function oo_oo(i, ...v) { try {
    oo_cm().consoleLog(i, v);
}
catch (e) { } return v; }
;
oo_oo;
function oo_tr(i, ...v) { try {
    oo_cm().consoleTrace(i, v);
}
catch (e) { } return v; }
;
oo_tr;
function oo_ts() { try {
    oo_cm().consoleTime();
}
catch (e) { } }
;
oo_ts;
function oo_te() { try {
    oo_cm().consoleTimeEnd();
}
catch (e) { } }
;
oo_te;
//# sourceMappingURL=app.gateway.js.map
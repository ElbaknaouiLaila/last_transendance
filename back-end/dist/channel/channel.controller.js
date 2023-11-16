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
exports.ChannelsController = void 0;
const common_1 = require("@nestjs/common");
const channel_service_1 = require("./channel.service");
const users_service_1 = require("../users/users.service");
const jwtservice_service_1 = require("../jwt/jwtservice.service");
let ChannelsController = class ChannelsController {
    constructor(jwt, channelsService, UsersService) {
        this.jwt = jwt;
        this.channelsService = channelsService;
        this.UsersService = UsersService;
    }
    async create(req, data) {
        console.log("------ Starting Creating a Channel ");
        console.log(data);
        console.log(data.title);
        console.log(data.password);
        console.log(data.type);
        console.log(`length of data.memebers is ${data.members.length}`);
        console.log(data.members[0]);
        console.log(req.cookies);
        console.log("--------------------------");
        const decode = this.jwt.verify(req.cookies['cookie']);
        console.log(decode);
        console.log(`id is ${decode.id}`);
        console.log("*****************");
        const user = await this.UsersService.findById(decode.id);
        console.log("##################");
        const channel = await this.channelsService.createChannel(data, user.id_user);
        console.log("End of Creating A Channel ");
        return true;
    }
    async join(req, data) {
        console.log("------ Starting Joining a Channel ");
        console.log(data);
        const decode = this.jwt.verify(req.cookies['cookie']);
        const user = await this.UsersService.findById(decode.id);
        const name = "Assila";
        const memberChannel = await this.channelsService.joinChannel(data, user.id_user);
        console.log("AFTER CREATEION        ");
        console.log(memberChannel);
        return memberChannel;
    }
    async updatePass(req, data) {
        console.log("%%%%%%%%%%%%%%%%%%%%%%%%%%% ===== UPDATEPASS");
        console.log(data);
        const decode = this.jwt.verify(req.cookies['cookie']);
        const user = await this.UsersService.findById(decode.id);
        await this.channelsService.updatePass(data, user.id_user);
    }
    async removePass(req, data) {
        console.log("ÄÄÄÄÄÄÄÄÄÄÄ ======= removePass");
        console.log(data);
        const decode = this.jwt.verify(req.cookies['cookie']);
        const user = await this.UsersService.findById(decode.id);
        await this.channelsService.removePass(data, user.id_user);
    }
    async setPass(req, data) {
        console.log("¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤ FROM SET PASSWORD ");
        console.log(data);
        console.log(data.passwordConfirm);
        const decode = this.jwt.verify(req.cookies['cookie']);
        const user = await this.UsersService.findById(decode.id);
        await this.channelsService.setPass(data, user.id_user);
    }
    async setAdmin(req, data) {
        console.log("SET ADMIN :::: !!!!!!!!!!!!!!!!!!!!!!!!1 FROM SET ADMIN \n");
        console.log(data);
        await this.channelsService.setAdmin(data);
    }
    async removeChannel(req, data) {
        console.log("Remove Channel :::: !!!!!!!!!!!!!!!!!!!!!!!! \n");
        console.log(data);
        const user = await this.UsersService.findById(data.user_id);
        if (user) {
            const result = await this.channelsService.removeChannel(data, user.id_user);
            if (!result)
                console.log("ERROR \n");
        }
    }
    async getPublicChannels() {
        return this.channelsService.getPublicChannels();
    }
    async getProtectedChannels() {
        return this.channelsService.getProtectedChannels();
    }
    async getAllChannels(req, data) {
        console.log("!!!!!!!!!!!!!!!!!!!!!!!!! ALL CHANNELS !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!1");
        const decode = this.jwt.verify(req.cookies['cookie']);
        const user = await this.UsersService.findById(decode.id);
        const myAllChannels = await this.channelsService.getAllChannels(user.id_user);
        let message = "";
        let sent = null;
        if (myAllChannels) {
            const arrayOfChannels = [];
            for (const channels of myAllChannels) {
                const lastMsg = await this.channelsService.getTheLastMessageOfChannel(channels.channelId);
                if (lastMsg) {
                    message = lastMsg.message;
                    sent = lastMsg.dateSent;
                }
                console.log("FROM GETALL CHANNELS \n", message);
                const admins = await this.channelsService.getAllAdmins(channels.channelId);
                console.log("ADMINS ARE : ");
                console.log(admins);
                const memebers = await this.channelsService.getAllMembers(channels.channelId);
                console.log("memebers ARE : ");
                console.log(memebers);
                const owners = await this.channelsService.getAllOwners(channels.channelId);
                console.log("owners ARE : ");
                console.log(owners);
                const newCh = {
                    channel_id: channels.channelId,
                    image: channels.channel.img,
                    name: channels.channel.name,
                    owner: owners,
                    admin: admins,
                    members: memebers,
                    last_messages: message,
                    time: sent,
                    unread: true,
                    channel_type: channels.channel.visibility,
                };
                console.log("%%%%%%%");
                console.log(newCh);
                arrayOfChannels.push(newCh);
            }
            return arrayOfChannels;
        }
    }
};
exports.ChannelsController = ChannelsController;
__decorate([
    (0, common_1.Post)('create'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ChannelsController.prototype, "create", null);
__decorate([
    (0, common_1.Post)('join'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ChannelsController.prototype, "join", null);
__decorate([
    (0, common_1.Post)('updatePass'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ChannelsController.prototype, "updatePass", null);
__decorate([
    (0, common_1.Post)('removePass'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ChannelsController.prototype, "removePass", null);
__decorate([
    (0, common_1.Post)('setPass'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ChannelsController.prototype, "setPass", null);
__decorate([
    (0, common_1.Post)('setAdmin'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ChannelsController.prototype, "setAdmin", null);
__decorate([
    (0, common_1.Post)('removeChannel'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ChannelsController.prototype, "removeChannel", null);
__decorate([
    (0, common_1.Get)('allPublic'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ChannelsController.prototype, "getPublicChannels", null);
__decorate([
    (0, common_1.Get)('allProtected'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ChannelsController.prototype, "getProtectedChannels", null);
__decorate([
    (0, common_1.Get)('allChannels'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ChannelsController.prototype, "getAllChannels", null);
exports.ChannelsController = ChannelsController = __decorate([
    (0, common_1.Controller)('channels'),
    __metadata("design:paramtypes", [jwtservice_service_1.JwtService, channel_service_1.ChannelsService, users_service_1.UsersService])
], ChannelsController);
//# sourceMappingURL=channel.controller.js.map
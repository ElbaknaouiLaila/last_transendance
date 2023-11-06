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
exports.FortyTwoStrategy = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const passport_42_1 = require("passport-42");
const auth_service_1 = require("../auth.service");
const jwtservice_service_1 = require("../../jwt/jwtservice.service");
const prisma_service_1 = require("../../prisma/prisma.service");
let FortyTwoStrategy = class FortyTwoStrategy extends (0, passport_1.PassportStrategy)(passport_42_1.Strategy, '42') {
    constructor(authservice, jwt, prisma) {
        super({
            clientID: 'u-s4t2ud-d9fed53f36349b40d82e57fc96436919282944d16170e23ebe8ba4c1a0194679',
            clientSecret: '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',
            callbackURL: 'http://localhost:3000/auth/login/42/redirect',
        });
        this.authservice = authservice;
        this.jwt = jwt;
        this.prisma = prisma;
    }
    async validate(accessToken, refreshToken, profile, req, res) {
        const payload = await this.authservice.ValidateUsers(profile._json, req, res);
        return payload;
    }
};
exports.FortyTwoStrategy = FortyTwoStrategy;
__decorate([
    __param(3, (0, common_1.Req)()),
    __param(4, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object, Object, Object]),
    __metadata("design:returntype", Promise)
], FortyTwoStrategy.prototype, "validate", null);
exports.FortyTwoStrategy = FortyTwoStrategy = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [auth_service_1.AuthService, jwtservice_service_1.JwtService,
        prisma_service_1.PrismaService])
], FortyTwoStrategy);
//# sourceMappingURL=FortyTwoStrategy.js.map
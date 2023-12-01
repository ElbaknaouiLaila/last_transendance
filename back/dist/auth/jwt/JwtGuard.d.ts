import { CanActivate, ExecutionContext } from "@nestjs/common";
import { JwtService } from "./jwtservice.service";
import { PrismaService } from "src/prisma.service";
export declare class JwtAuthGuard implements CanActivate {
    private prisma;
    private readonly JwtService;
    constructor(prisma: PrismaService, JwtService: JwtService);
    canActivate(context: ExecutionContext): Promise<boolean>;
}
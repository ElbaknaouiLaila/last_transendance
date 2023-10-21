import { Injectable, Req, Body ,ForbiddenException} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { JwtService } from 'src/jwt/jwtservice.service';
import { CreateUserDto } from './nameDto';
import * as fs from 'fs';
//import from vite.config.ts
@Injectable()
export class ProfileService {
    constructor(private prisma: PrismaService, private jwt:JwtService){}

    async ModifyName(dat :any, req :any, res :any){
        // console.log('name : ' + dat.name);
        const Token = req.cookies['cookie'];
        const verifyToekn = this.jwt.verify(Token);
        // console.log(verifyToekn);
        try{
            const user = await this.prisma.user.update({
                where: {id_user : verifyToekn.id},
                data: {
                    name : dat.name,
                },
            });
           
            verifyToekn.login = dat.name;
            // console.log(user);
            res.cookie('cookie', this.jwt.sign(verifyToekn));

        }catch(error){
            if (error.code == 'P2002')
                res.status(400).json({error: 'name already exists'});
        }
    }

    async ModifyPhoto(photo:any, req:any, res:any) {

        const verifyToken = this.jwt.verify(req.cookies['cookie']);
        const filePath = '/Volumes/TOSHIBA EXT/last_transcendence/front-end/public/uploads/' + photo.originalname; // Use the original name or generate a unique name
        const rightPath = 'public/uploads/' + photo.originalname;//path to store in db
        // console.log("filePath");
        console.log(photo.originalname);
        fs.writeFileSync(filePath, photo.buffer);

        try{
            await this.prisma.user.update({
                where: {id_user : verifyToken.id},
                data: {
                    avatar : rightPath,//update avatar
                },
            });
            verifyToken.avatar = rightPath;//update avatar
            // console.log(userInfos);
            res.cookie('cookie', this.jwt.sign(verifyToken));
        }catch(error){
            console.log(error);
            // if (error.code == 'P2002')
                // res.status(400).json({error: 'name already exists'});
        }
    }
}


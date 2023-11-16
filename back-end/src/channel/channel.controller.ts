// src/channels/channels.controller.ts
import { Controller, Get,Post, Req,Body, UseGuards, Patch, Delete, ValidationPipe } from '@nestjs/common';
import { ChannelsService } from './channel.service';
import { CreateChannelDto } from './dto/create-channel.dto';
import { UsersService } from '../users/users.service';
import { JwtService } from '../jwt/jwtservice.service';
import * as cookieParser from 'cookie-parser';
import * as cookie from 'cookie';
// import { Request, Response } from 'express';
// import { JwtAuthGuard } from '../auth/jwt-auth.guard'; // You might have an authentication guard.
// req.cookies is epmty
// the shape of data that sent from fron when creating new channel:
// {
  // title: 'morocoo',
  // members: [ 'name 1', 'name 2', 'name 3' ],
  // type: 'public'
// }
// 

@Controller('channels')
export class ChannelsController {
  constructor(private jwt:JwtService ,private readonly channelsService: ChannelsService, private readonly UsersService: UsersService) {}

  // @UseGuards(JwtAuthGuard) // Secure this endpoint with authentication.
  @Post('create')
  async create(@Req() req, @Body() data: any) {
    
    // the req decorator will contain the authenticated user.
    // Assuming you have a user service to get the authenticated user.
    //const user = await this.UsersService.findById(req.user.userId);
    // console.log(req.cookies); 
    // const id = req.cookies['me']; it show me undefined.
    console.log("------ Starting Creating a Channel ");
    console.log(data);
    console.log(data.title);
    console.log(data.password);
    console.log(data.type);
    console.log(`length of data.memebers is ${data.members.length}`);
    console.log(data.members[0]);
    console.log(req.cookies); 
    console.log("--------------------------");
   
    //to decode the req and get the id.
    const decode = this.jwt.verify(req.cookies['cookie']);
    console.log(decode);
    console.log(`id is ${decode.id}`);

    console.log("*****************");
    const user = await this.UsersService.findById(decode.id);
    console.log("##################");
    const channel = await this.channelsService.createChannel(data,user.id_user);
    // I think hena u must return a boolean true if the creation of channel is passed correct.
    console.log("End of Creating A Channel ");

    // this.channelsService.getAllChannels(user.id_user);

    // this.getAllChannels(user.id_user);
    return true;
  }
  @Post('join')
  async join(@Req() req, @Body() data: any) {

    // data that I need is name of channel and id user , and if its protected I need password.
    console.log("------ Starting Joining a Channel ");
    console.log(data);
    //to decode the req and get the id.
    const decode = this.jwt.verify(req.cookies['cookie']);
    // console.log(decode);
    // console.log(`id is ${decode.id}`);
    // console.log("*****************");
    const user = await this.UsersService.findById(decode.id);
    const name = "Assila";
    const memberChannel = await this.channelsService.joinChannel(
      data,
      user.id_user,
    );
    console.log("AFTER CREATEION        ");
      console.log(memberChannel);
    return memberChannel;
  }
// must add DTO UPDATED.
// channels/updatePass
  @Post('updatePass')
  async updatePass(@Req() req, @Body() data: any)
  {
    // data that I expect are iduser , namechannel and newpass.
//     %%%%%%%%%%%%%%%%%%%%%%%%%%% ===== UPDATEPASS
// {
//   password: 'hhh123',
//   passwordConfirm: 'hhh123',
//   channel_id: 19,
//   user_id: 90652

    console.log("%%%%%%%%%%%%%%%%%%%%%%%%%%% ===== UPDATEPASS");
    console.log(data);
    const decode = this.jwt.verify(req.cookies['cookie']);
    const user = await this.UsersService.findById(decode.id);
    await this.channelsService.updatePass(data, user.id_user);

  }
  // channels/removePass
  @Post('removePass')
  async removePass(@Req() req, @Body() data: any)
  {
    console.log("ÄÄÄÄÄÄÄÄÄÄÄ ======= removePass");
    // data that I expect are iduser , namechannel and newpass.
    // { id_channel: 19, user_id: 90652 }
    console.log(data);
    const decode = this.jwt.verify(req.cookies['cookie']);
    const user = await this.UsersService.findById(decode.id);
    await this.channelsService.removePass(data, user.id_user);

  }
  // channels/setPass
  @Post('setPass')
  async setPass(@Req() req, @Body() data: any)
  {
    // {
    //   password: 'ok1234',
    //   passwordConfirm: 'ok1234',
    //   channel_id: 19,
    //   user_id: 90652
    // }
    // I expect the password , namechannel and iduser
    console.log("¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤ FROM SET PASSWORD ");
    console.log(data);
    console.log(data.passwordConfirm);
    const decode = this.jwt.verify(req.cookies['cookie']);
    const user = await this.UsersService.findById(decode.id);

    await this.channelsService.setPass(data, user.id_user);

  }
  // channels/setAdmin
  @Post('setAdmin')
  async setAdmin(@Req() req, @Body() data: any)
  {
    // data I expect, iduser, secondiduser, namechannel.
//     SET ADMIN :::: !!!!!!!!!!!!!!!!!!!!!!!!1 FROM SET ADMIN 

// { to: 62669, from: 90652, channel_id: 19 }


    console.log("SET ADMIN :::: !!!!!!!!!!!!!!!!!!!!!!!!1 FROM SET ADMIN \n");
    console.log(data);
    // const decode = this.jwt.verify(req.cookies['cookie']);
    // const user = await this.UsersService.findById(decode.id);
    
    // const decode2 = this.jwt.verify(data.updated_user);
    // const updatedUser = await this.UsersService.findById(decode2.id);

    await this.channelsService.setAdmin(data);

  }

  // channels/setAdmin
  @Post('removeChannel')
  async removeChannel(@Req() req, @Body() data: any)
  {
    // data I expect, iduser, secondiduser, namechannel.
//     SET ADMIN :::: !!!!!!!!!!!!!!!!!!!!!!!!1 FROM SET ADMIN 

// { to: 62669, from: 90652, channel_id: 19 }


    console.log("Remove Channel :::: !!!!!!!!!!!!!!!!!!!!!!!! \n");
    console.log(data);
    // const decode = this.jwt.verify(req.cookies['cookie']);
    const user = await this.UsersService.findById(data.user_id);
    
    // const decode2 = this.jwt.verify(data.updated_user);
    // const updatedUser = await this.UsersService.findById(decode2.id);
    if (user)
    {
      const result = await this.channelsService.removeChannel(data, user.id_user);
      if (!result)
        console.log("ERROR \n");
   }

  }

  @Get('allPublic')
  async getPublicChannels()
  {
    return this.channelsService.getPublicChannels();
  }

  @Get('allProtected')
  async getProtectedChannels()
  {
    return this.channelsService.getProtectedChannels();
  }





// all channels , that a user inside them .
  @Get('allChannels')
  // async getAllChannels(@Req() req, @Body() data: any)

  async getAllChannels(@Req() req, @Body() data: any)
  {
    console.log("!!!!!!!!!!!!!!!!!!!!!!!!! ALL CHANNELS !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!1");
    const decode = this.jwt.verify(req.cookies['cookie']);
    // console.log("Reshe");
    const user = await this.UsersService.findById(decode.id);
    // const user = await this.UsersService.findById(id);


    // console.log("Reshe   222");

    const myAllChannels = await this.channelsService.getAllChannels(user.id_user);
    // console.log("START LOOPING ");
    let message = "";
    let sent: Date | null = null;
    if(myAllChannels)
    {
        const arrayOfChannels = [];
        for (const channels of myAllChannels) 
        {
          const lastMsg  = await this.channelsService.getTheLastMessageOfChannel(channels.channelId);
          if (lastMsg)
          {
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
            channel_id:channels.channelId,
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

        // console.log("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
        // console.log(arrayOfChannels);
        // console.log("ENNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNND");
        return arrayOfChannels;
    }
}

}
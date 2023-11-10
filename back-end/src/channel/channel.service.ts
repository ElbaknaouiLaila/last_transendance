import { Injectable, NotFoundException, HttpStatus, HttpException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateChannelDto } from './dto/create-channel.dto';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
@Injectable()
export class ChannelsService {
  constructor(private prisma: PrismaService, private userService: UsersService) {}

  async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    return hashedPassword;
  }

  async verifyPassword(plainTextPassword: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(plainTextPassword, hashedPassword);
  }

  async getPublicChannels()
  {
    try{

      const publicChannelsWithUsers = await this.prisma.channel.findMany({
        where: {
          visibility: 'public',
        },
        include: {
          users: {
            include: {
              user: true,
            },
          },
        },
      });
      console.log("||||||||||||||||||||||||||||||||||||||||");
      
      console.log(publicChannelsWithUsers);
      return publicChannelsWithUsers;
    }
    catch (error) {
      console.error('we have no public channels', error);
    }

  }
  async getProtectedChannels()
  {
    try{

      const protectedChannelsWithUsers = await this.prisma.channel.findMany({
        where: {
          visibility: 'protected',
        },
        include: {
          users: {
            include: {
              user: true,
            },
          },
        },
      });
      console.log("||||||||||||||||||||||||||||||||||||||||");

      console.log(protectedChannelsWithUsers);
      return protectedChannelsWithUsers;
    }
    catch (error) {
      console.error('we have no protected channels', error);
    }
    // try{
      
    //   const channels = await this.prisma.channel.findMany({
    //     where: {
    //       visibility: 'protected'
    //     }
    //   });
    //   return channels;
    // }
    // catch (error) {
    //   console.error('we have no protected channels', error);
    // }
  }
  async createChannel(data: any,userId: number) {

    try {
      // Use Prisma to create a new channel .
      if (data.password){
        const hashedPassword = await this.hashPassword(data.password);
        data.password = hashedPassword;
      }
      const channel = await this.prisma.channel.create({
        data: {
          name: data.title,
          visibility: data.type,
          password:data.password
        },
      });
    //adding a record to save the user who created this channel and set its status on this channel.
    const memberchannel = await this.prisma.memberChannel.create({
      data: {
        userId:userId,
        channelId:channel.id_channel,
        status_UserInChannel:'owner',
      },
    });

    // adding members to channels :
    for (let i = 0; i < data.members.length; i++) {
      try{
          let idMbr =  await this.userService.findByName(data.members[i]);
          const memberchannel = await this.prisma.memberChannel.create({
            data: {
              userId:idMbr.id_user,
              channelId:channel.id_channel,
              status_UserInChannel:'member',
            },
          });
        }catch (error) {
          console.error('Error inserting records of Members in this Channel:', error);
        }
    

  }
  return true;
}
    catch (error) {
        console.error('Channel does not created successfully:', error);
    }
//     catch (error) { 
//   throw new HttpException({
//     status: HttpStatus.FORBIDDEN,
//     error: 'Channel does not created successfully',
//   }, HttpStatus.FORBIDDEN
//   );
// }
    // if (!channel && !memberchannel) {
    //   throw new NotFoundException('Channel does not created successfully');
    // }
    // // console.log("channelIdcreated is "+ channel.id_channel);
    
  }

  async getChannelByName(nameVar:string)
  {
    const channel = await this.prisma.channel.findUnique({
      where: { name: nameVar },
    });

    if (!channel) {
      throw new NotFoundException(`User with  ${nameVar} not found`);
    }

    return channel;
  }

  //check the visbility of the channel. 
  // already tested is worked , both protected and public.
  async joinChannel(data : any, usid : number)
  {
    console.log("join channel from service");
    let join = 0;
    let pass ="lola123";
    
    
    const ch = await this.getChannelByName(data.name);
    console.log("channel is " +ch.name);
    console.log("channel is " +ch.visibility);
    // must cheak is this user has already banned from this channel or not, if yes must prevent him.
    const cheak = await this.prisma.channelBan.findUnique({
      where : {

        bannedUserId_channelId: {
          bannedUserId: usid, 
          channelId: ch.id_channel,
        },
        },
    });
    if (!cheak)
      throw new NotFoundException(`your not allowed to join this channel ${ch.name} cuz  you are banned`);

    if (ch)
    {
      if (ch.visibility === "protected")
      {
      //  console.log("inside if ");
        // if (this.verifyPassword(data.password, ch.password))
        if (this.verifyPassword(data.password, ch.password))

        {
         // console.log("inside if of pass ");
          join = 1;
        }
        //must the user has the password.
      }
        if (join == 1 || ch.visibility === "public")
        {
          //INSERT NEW RECORD AFTER CHECKING IS THE PASSWORD WAS MATCHED OR THE VISIBILITY IS PUBLIC.
          try{
            
            const memberchannel = await this.prisma.memberChannel.create({
              data: {
                  userId:usid,
                  channelId:ch.id_channel,
                  status_UserInChannel:'member',
                  },
              });
              return true;
          }
          catch(error)
          {
             console.error('duplicate records in memeberchannels:', error);
          }

            // console.log("inside join to insert into database");
            // // u don't need to check, cuz already u mention that id_user+ischannel as ID(PK).
            // const check = await this.prisma.memberChannel.findUnique({
            //   where : {

            //     userId_channelId: {
            //       userId: usid, 
            //       channelId: chid,
            //     },
          
            //     },

            // });
            // if (!check)
            // {
            //   console.log("the record does not exist");
            //     const memberchannel = await this.prisma.memberChannel.create({
            //       data: {
            //         userId:usid,
            //         channelId:chid,
            //         status_UserInChannel:'member',
            //       },
            //     });
            //     console.log("data is " + memberchannel.status_UserInChannel);
            //     return memberchannel;
            //   }       
          }
    }
  }

  async updatePass(data : any, usid : number)
  {
    const ch = await this.getChannelByName(data.name);
    if (ch)
    {
      const record = await this.prisma.memberChannel.findUnique({
        where : {

          userId_channelId: {
            userId: usid, 
            channelId: ch.id_channel,
          },
    
          },
      });
      if (record)
      {
          if (record.status_UserInChannel == "owner")
          {
            console.log("Yes I am the owner");

            if (ch.visibility == "protected")
            {
              const updateChannel = await this.prisma.channel.update({
                where: {
                  id_channel: ch.id_channel,
                },
                data: {
                  password: data.newpass,
                },
              })
            }
          }
          else
          {
            throw new NotFoundException(`your not allowed to change the password of ${ch.name}, or the channel is not protected`);
          }
      }
      else 
      {
        throw new NotFoundException(`the user with id ${usid} is not belong to this channel ${ch.name}`);
      }
  }
  else 
  {
    throw new NotFoundException(`this Channel with Name ${ch.name} not found`);
  }
}


  // End !!
  async removePass(data : any, usid : number)
  {
    const ch = await this.getChannelByName(data.name);
    if (ch)
    {
      const record = await this.prisma.memberChannel.findUnique({
      where : {

        userId_channelId: {
          userId: usid, 
          channelId: ch.id_channel,
        },
        },
    });
    if (record)
    {
        if (record.status_UserInChannel == "owner")
        {
          if (ch.visibility == "protected")
          {
            const updateChannel = await this.prisma.channel.update({
              where: {
                id_channel: ch.id_channel,
              },
              data: {
                visibility:"public",
                password: null,
              },
            })
          }
        }
        else
        {
          throw new NotFoundException(`your not allowed to remove the password of ${ch.name}, or the channel is not protected`);
          // console.log("your not allowed to change the password , or the channel is not protected");
        }
    }
    else 
    {
      throw new NotFoundException(`the user with id ${usid} is not belong to this channel ${ch.name}`);
    }
  }
  else 
  {
    throw new NotFoundException(`this Channel with Name ${ch.name} not found`);
  }
}

// End
  async setPass(data : any, usid : number)
  {
    const ch = await this.getChannelByName(data.name);
    if (ch)
    {
    const record = await this.prisma.memberChannel.findUnique({
      where : {
        userId_channelId: {
          userId: usid, 
          channelId: ch.id_channel,
        },
        },
    });
    if (record)
    {
        if (record.status_UserInChannel == "owner")
        {
          console.log("Yes I am the owner");
          if (ch.visibility == "public" || ch.visibility == "privat")
          {
            console.log("inside visibility");
            const updateChannel = await this.prisma.channel.update({
              where: {
                id_channel: ch.id_channel,
              },
              data: {
                visibility:"protected",
                password: data.newpass,
              },
            })
          }
        }
        else
        {
          // console.log("your not allowed to change the password , or the channel is not protected");
          throw new NotFoundException(`your not allowed to set the password of ${ch.name}, or the channel is already protected`);

        }
    }
    else 
    {
      throw new NotFoundException(`the user with id ${usid} is not belong to this channel ${ch.name}`);
    }
  }
  else
  {
    throw new NotFoundException(`this Channel with Name ${ch.name} not found`);
  }
  }




  // END. belaan d muted kifesh andir lih hnea !!
  async setAdmin(data : any, usid : number, upus:number)
  {
    const ch = await this.getChannelByName(data.name);
    if (ch)
    {

    const record = await this.prisma.memberChannel.findUnique({
      where : {

        userId_channelId: {
          userId: usid, 
          channelId: ch.id_channel,
        },
        },
    });

    const record2 = await this.prisma.memberChannel.findUnique({
      where : {

        userId_channelId: {
          userId: upus, 
          channelId: ch.id_channel,
        },
        },
    });

    if (record && record2)
    {
        if (record.status_UserInChannel === "owner")
        {
          const updateChannel = await this.prisma.memberChannel.update({
            where: {
              userId_channelId: {
                userId: upus, 
                channelId: ch.id_channel,
              },
            },
            data: {
              status_UserInChannel:"admin",
            },
          })
        }
        else
        {
          throw new NotFoundException(`your not  the  owner of ${ch.name}`);
        }
    }
    else
    {
      // hena diri name instead of id !!!
      throw new NotFoundException(`the user with ${usid} or ${upus} is not belong to this channel ${ch.name}`);
    }
  }
  else
  {
    throw new NotFoundException(`this Channel with Name ${ch.name} not found`);
  }
}

  // END

  async kickUser(data:any, idus:number, kickcus:number)
  {
    const ch = await this.getChannelByName(data.name);
    if (ch)
    {
      const record = await this.prisma.memberChannel.findUnique({
        where : {

          userId_channelId: {
            userId: idus, 
            channelId: ch.id_channel,
          },
          },

      });

      const record2 = await this.prisma.memberChannel.findUnique({
        where : {

          userId_channelId: {
            userId: kickcus, 
            channelId: ch.id_channel,
          },
          },
      });
    if (record && record2)
    {
      if (record.status_UserInChannel === "owner" || record.status_UserInChannel === "admin")
      {
        if (record2.status_UserInChannel !== "owner" && record2.status_UserInChannel !== "admin")
        {
          
            const updateChannel = await this.prisma.memberChannel.delete({
              where: {
                userId_channelId: {
                  userId: kickcus, 
                  channelId: ch.id_channel,
                },
              },
            })
            // should add this user in banneduser:
            const memberchannel = await this.prisma.channelBan.create({
              data: {
                bannedUserId:kickcus,
                channelId:ch.id_channel,
                status_User:'kicked',
              },
            });
        
        }
        else
        {
          throw new NotFoundException(`you can't kicked an owner or an admin`);
        }
      }
      else
      {
        throw new NotFoundException(`your not  the  owner or admin of ${ch.name}`);
      }
    }
    else
    {
      throw new NotFoundException(`the user with ${idus} or ${kickcus} is not belong to this channel ${ch.name}`);
    }
  }
    else
    {
      throw new NotFoundException(`this Channel with Name ${ch.name} not found`);
    }
  }


// END

  async banUser(data:any, idus:number, user_banned:number)
  {
    const ch = await this.getChannelByName(data.name);
    if (ch)
    {
    const record = await this.prisma.memberChannel.findUnique({
      where : {

        userId_channelId: {
          userId: idus, 
          channelId: ch.id_channel,
        },
        },
    });

    const record2 = await this.prisma.memberChannel.findUnique({
      where : {

        userId_channelId: {
          userId: user_banned, 
          channelId: ch.id_channel,
        },
        },
    });
    if (record && record2)
    {
      if (record.status_UserInChannel === "owner" || record.status_UserInChannel === "admin")
      {
        if (record2.status_UserInChannel !== "owner" && record2.status_UserInChannel !== "admin")
        {
          const updateChannel = await this.prisma.memberChannel.delete({
            where: {
              userId_channelId: {
                userId: record2.userId,
                channelId: ch.id_channel,
              },
            },
          })
          // should add this user in banneduser:
          const memberchannel = await this.prisma.channelBan.create({
            data: {
              bannedUserId:record2.userId,
              channelId:ch.id_channel,
              status_User:'banned',
            },
          });

            // const updateChannel = await this.prisma.memberChannel.update({
            //   where: {
            //     userId_channelId: {
            //       userId: record2.userId, 
            //       channelId: record2.channelId,
            //     },
            //   },
            //       data: {
            //         status_UserInChannel:"banned",
            //       },
            // })
            // console.log("trying to execute banned User");
            // const channel_Ban = await this.prisma.channelBan.create({
            //   data: {
            //     bannedUserId:record2.userId,
            //     channelId:record2.channelId,
            //   },
            // });
            // console.log("after executing banned User");

        }
        else
        {
          throw new NotFoundException(`you can't banned an owner or an admin`);
        }
      }
      else
      {
        throw new NotFoundException(`your not  the  owner or admin of ${ch.name}`);
      }
    }
    else
    {
      throw new NotFoundException(`the user with ${idus} or ${user_banned} is not belong to this channel ${ch.name}`);
    }
  }
    else
    {
      throw new NotFoundException(`this Channel with Name ${ch.name} not found`);
    }
  }

// END
  async muteUser(data:any, idus:number, user_muted:number)
  {
    const ch = await this.getChannelByName(data.name);
    if (ch)
    {
      const record = await this.prisma.memberChannel.findUnique({
        where : {

          userId_channelId: {
            userId: idus, 
            channelId: ch.id_channel,
          },
          },
      });

      const record2 = await this.prisma.memberChannel.findUnique({
        where : {
          userId_channelId: {
            userId: user_muted, 
            channelId: ch.id_channel,
          },
          },
      });
      if (record && record2)
      {
        if (record.status_UserInChannel === "owner" || record.status_UserInChannel === "admin")
        {
          if (record2.status_UserInChannel !== "owner" && record2.status_UserInChannel !== "admin")
          {
            
              const updateChannel = await this.prisma.memberChannel.update({
                where: {
                  userId_channelId: {
                    userId: record2.userId, 
                    channelId: record2.channelId,
                  },
                },
                  data: {
                    muted:true,
                    period:data.duration,
                  },
              })
          }
          else
          {
            throw new NotFoundException(`you can't muted an owner or an admin`);
          }
        }
        else
        {
          throw new NotFoundException(`your not  the  owner or admin of ${ch.name}`);
        }
      }
      else
      {
        throw new NotFoundException(`the user with ${idus} or ${user_muted} is not belong to this channel ${ch.name}`);
      }
  }
  else
  {
    throw new NotFoundException(`this Channel with Name ${ch.name} not found`);
  }
}


    // get all Channels of current user that has joined them:
    async getAllChannels(idUser : number )
    {

        const channels = await this.prisma.memberChannel.findMany({
        where: {
            userId: idUser,
              },
        include: {
            channel: true,
     },
    });
        // console.log("###################################################");
        // console.log(channels);
        // console.log("###################################################");

        return channels;
    }
    

        // get all Channels of current user that has joined them:
        async getAllAdmins(idch : number )
        {
    
          const usersInAdminChannel = await this.prisma.memberChannel.findMany({
            where: {
              channelId: idch,
              status_UserInChannel: 'admin',
            },
            include: {
              user: true,
              channel: true,
            },
          });

          // console.log("************************************************");

          // console.log(usersInAdminChannel);
          // console.log("************************************************");

    
            let Names: string[] = [];
            if (usersInAdminChannel)
            {
              Names = usersInAdminChannel.map(member => member.user.name);
            
            }
              return Names;
        }

                // get all Channels of current user that has joined them:
        async getAllMembers(idch : number )
        {
          
          const usersInAdminChannel = await this.prisma.memberChannel.findMany({
            where: {
              channelId: idch,
              status_UserInChannel: 'member',
            },
            include: {
              user: true,
              channel: true,
            },
          });

          // console.log("************************************************");

          // console.log(usersInAdminChannel);
          // console.log("************************************************");
          let Names: string[] = [];
          if (usersInAdminChannel)
          {
            Names = usersInAdminChannel.map(member => member.user.name);
          
          }
            return Names;
        }

                // get all Channels of current user that has joined them:
        async getAllOwners(idch : number )
        {
    
          const usersInAdminChannel = await this.prisma.memberChannel.findMany({
            where: {
              channelId: idch,
              status_UserInChannel: 'owner',
            },
            include: {
              user: true,
              channel: true,
            },
          });


          // console.log("************************************************");

          // console.log(usersInAdminChannel);
          // console.log("************************************************");

    
          let Names: string[] = [];
          if (usersInAdminChannel)
          {
            Names = usersInAdminChannel.map(member => member.user.name);
          
          }
            return Names;
        }


        async getTheLastMessageOfChannel(idch : number )
        {
    
          try{
          
            const lastMessage = await this.prisma.discussion.findFirst({
              where: {
                channelId: idch
              },
              orderBy: {
                dateSent: 'desc' // or 'desc' for descending order
              }
            });
            return lastMessage;
            }
            catch (error) {
                  console.error('we have no messages on this channel', error);
            }
        }
}

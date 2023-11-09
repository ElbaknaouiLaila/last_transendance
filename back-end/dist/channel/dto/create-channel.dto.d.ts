export declare class CreateChannelDto {
    readonly name: string;
    readonly visibility: string;
    readonly password?: string;
}
export declare class CreateMemberDto {
    readonly userId: number;
    readonly channelId: number;
    readonly status_UserInChannel: string;
}
export declare class CreateDmDto {
    id_dm: number;
    senderId: number;
    receiverId: number;
    unread: number;
    pinned: Boolean;
}
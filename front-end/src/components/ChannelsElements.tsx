import { Avatar, Badge, Box, Stack, Typography } from "@mui/material";
import { styled } from "@mui/system";
import { setCurrentChannel } from "../redux/slices/channels";
import { selectConversation } from "../redux/slices/contact";
import { useAppDispatch, useAppSelector } from "../redux/store/store";
import { socket } from "../socket";

interface IdType {
  id: number;
  room_id: number;
  name: string;
  img: string;
  time: string;
  msg: string;
  unread: number;
  online: boolean;
}

const StyledChatBox = styled(Box)(() => ({
  "&:hover": {
    cursor: "pointer",
  },
}));

const SmallAvatar = styled(Avatar)(({ theme }) => ({
    width: 22,
    height: 22,
    border: `2px solid ${theme.palette.background.paper}`,
  }));

const ChannelElements = (id: IdType) => {
  const { contact, profile } = useAppSelector((state) => state);
  const dispatch = useAppDispatch();
  const selected_id = id.room_id;
  const selectedChatId = contact.room_id;
  let isSelected = +selectedChatId === id.id;

  if (!selectedChatId) {
    isSelected = false;
  }

  return (
    <StyledChatBox
      onClick={() => {
        socket.emit("allMessagesRoom", { room_id: selected_id });
        socket.on("Response_messages_Channel", (data: any) => {
          dispatch(setCurrentChannel(data));
          dispatch(
            selectConversation({
              room_id: selected_id,
              name: id.name,
              type_chat: "channel",
              avatar: id.img,
            })
          );
        });
      }}
      sx={{
        width: "100%",
        height: 85,
      }}
      p={2}
    >
      <Stack
        direction={"row"}
        alignItems={"center"}
        justifyContent={"space-between"}
        sx={{ padding: "0 8px 0 4px" }}
      >
        <Stack direction={"row"} alignItems={"center"} spacing={2}>
          {id.online ? (
            <Badge
            overlap="circular"
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            badgeContent={
              <SmallAvatar alt={id.name} src={id.img} />
            }
          >
            <Avatar alt={id.name} src={id.img} />
          </Badge>
          ) : (
            <Avatar src={id.img} sx={{ width: 52, height: 52 }} />
          )}
          <Stack spacing={1.3}>
            <Typography variant="subtitle2" color={"white"}>
              {id.name}
            </Typography>
            <Typography
              variant="caption"
              color={"white"}
              sx={{ fontWeight: 400 }}
            >
              {id.msg}
            </Typography>
          </Stack>
        </Stack>
        <Stack spacing={2} alignItems={"center"}>
          <Typography
            sx={{ fontWeight: 600, paddingBottom: "10px", paddingTop: 0 }}
            variant="caption"
          >
            {id.time}
            {/* 10:45 PM */}
          </Typography>
          <Badge
            color="primary"
            badgeContent={id.unread}
            sx={{ paddingBottom: "9px", paddingTop: 0 }}
          ></Badge>
        </Stack>
      </Stack>
    </StyledChatBox>
  );
};

export default ChannelElements;

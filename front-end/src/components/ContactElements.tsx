import {
  Avatar,
  Box,
  Divider,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import {
  Chat,
  Prohibit,
  SpeakerSimpleNone,
  SpeakerSimpleSlash,
  UserMinus,
} from "@phosphor-icons/react";
import React, { useEffect } from "react";
import {
  mutedContact,
  selectChat,
  selectConversation,
} from "../redux/slices/contact";
import { useAppDispatch, useAppSelector } from "../redux/store/store";
import StyledBadge from "./StyledBadge";
import { socket } from "../socket";
import {
  addNewConversation,
  emptyConverstation,
  setCurrentConverstation,
} from "../redux/slices/converstation";

interface State {
  amount: string;
  password: string;
  weight: string;
  weightRange: string;
  muted: boolean;
}

interface Props {
  id: number;
  name: string;
  img: string;
  online: boolean;
}

const ContactElements = (cont: any) => {
  const { conversations } = useAppSelector(
    state => state.converstation.direct_chat
  );
  // console.log(cont);
  const { contact } = useAppSelector(state => state);
  // console.log(contact);
  const dispatch = useAppDispatch();
  const id = cont.id_user;

  // console.log(id);
  const [values, setValues] = React.useState<State>({
    amount: "",
    password: "",
    weight: "",
    weightRange: "",
    muted: false,
  });

  const handleClickMuted = () => {
    // ! emit "mute_converstation" event

    // socket.emit("mute_converstation", { to: _id, from: user_id });
    dispatch(mutedContact({ room_id: id }));

    if (values.muted === true) {
      console.log("unmute");
    } else {
      console.log("mute");
    }
    setValues({
      ...values,
      muted: !values.muted,
    });
  };

  useEffect(() => {
    const handleHistoryDms = (data: any) => {
      // console.log("history data", data);
      // console.log(data.length);
      if (data.length === 0) {
        dispatch(emptyConverstation([]));
      } else {
        dispatch(setCurrentConverstation(data));
      }
    };

    if (!contact.room_id) return;
    // console.log(contact);
    const current = conversations.find((el: any) => el?.id === contact.room_id);
    if (current) {
      dispatch(selectChat({ room_id: current.room_id }));
      socket.emit("allMessagesDm", { room_id: current?.room_id });
      socket.once("historyDms", handleHistoryDms);
    } else {
      const new_conversation = {
        id: contact.room_id,
        name: cont.name,
        avatar: cont.avatar,
        online: cont.status_user,
        unread: 0,
        msg: "",
        time: "",
      };
      dispatch(addNewConversation(new_conversation));
      dispatch(selectChat({ room_id: 0 }));
      console.log("current is null", contact, cont);
    }
    // console.log(current.room_id);

    return () => {
      socket.off("historyDms", handleHistoryDms);
    };
  }, [contact.room_id, conversations, dispatch]);
  return (
    <Box
      sx={{
        width: "100%",
        height: 85,
        borderRadius: "1",
        // backgroundColor: "#806EA9",
      }}
      p={2}
    >
      <Stack
        direction={"row"}
        alignItems={"center"}
        justifyContent={"space-between"}
        sx={{ padding: "0 8px 14px" }}
      >
        <Stack direction={"row"} alignItems={"center"} spacing={2}>
          {cont.status_user === "online" ? (
            <StyledBadge
              overlap="circular"
              anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
              variant="dot"
              sx={{ width: 52, height: 52 }}
            >
              <Avatar src={cont.avatar} sx={{ width: 52, height: 52 }} />
            </StyledBadge>
          ) : (
            <Avatar src={cont.avatar} sx={{ width: 52, height: 52 }} />
          )}
          <Typography variant="subtitle2" color={"white"}>
            {cont.name}
          </Typography>
        </Stack>
        <Stack direction={"row"} spacing={1}>
          <IconButton
            onClick={() => {
              // ! emit "start_converstation" event
              console.log("start_converstation", id);
              dispatch(
                selectConversation({
                  room_id: id,
                  name: cont.name,
                  avatar: cont.avatar,
                  type_chat: "individual",
                })
              );
            }}
          >
            <Chat />
          </IconButton>
          <IconButton aria-label="mute contact" onClick={handleClickMuted}>
            {values.muted ? <SpeakerSimpleSlash /> : <SpeakerSimpleNone />}
          </IconButton>

          <IconButton
            onClick={() => {
              console.log("Delete Contact");
              // ! emit "delete_contact" event
              // socket.emit("delete_contact", { to: _id, from: user_id });
            }}
          >
            <UserMinus />
          </IconButton>
          <IconButton
            onClick={() => {
              console.log("Block Contact");
              // ! emit "block_contact" event
              // socket.emit("block_contact", { to: _id, from: user_id });
            }}
          >
            <Prohibit />
          </IconButton>
        </Stack>
      </Stack>
      <Divider sx={{ paddingTop: "1px", background: "#335f8e" }} />
    </Box>
  );
};

export default ContactElements;

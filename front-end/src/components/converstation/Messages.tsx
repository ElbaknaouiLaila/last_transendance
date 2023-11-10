import { Box, Stack } from "@mui/material";
import { useEffect } from "react";
import {
  fetchCurrentMessages,
  setCurrentConverstation,
} from "../../redux/slices/converstation.ts";
import { useAppDispatch, useAppSelector } from "../../redux/store/store.ts";
import { socket } from "../../socket.ts";
import { MediaMsg, ReplyMsg, TextMsg, Timeline } from "./MsgTypes.tsx";
import axios from "axios";

const Messages = () => {
  const dispatch = useAppDispatch();
  const { contact } = useAppSelector(state => state);
  const { room_id, type_chat } = contact;
  // console.log(type_chat);
  var messages: any = [];
  if (type_chat === "individual") {
    // console.log("individual");
    const { current_messages } = useAppSelector(
      state => state.converstation.direct_chat
    );
    messages = current_messages;
  } else {
    const { current_messages } = useAppSelector(state => state.channels);
    console.log(current_messages);
    messages = current_messages;
  }

  useEffect(() => {
    // ! fatch all messages of room_id
    // const current = conversations.find((el) => el?.id === room_id);
    // socket.emit("get_messages", { conversation_id: current?.id }, (data) => {
    //   // data => list of messages
    //   console.log(data, "List of messages");
    //   dispatch(FetchCurrentMessages({ messages: data }));
    // });
    // dispatch(setCurrentConverstation(current));
  }, [room_id, dispatch]);

  return (
    <Box p={1} sx={{ width: "100%", borderRadius: "64px" }}>
      {/* <ScrollBar> */}
      <Stack spacing={2}>
        {messages.map((el: any) => {
          // console.log(el)
          switch (el.type) {
            case "divider":
              return <Timeline el={el} />;
            case "msg":
              switch (el.subtype) {
                case "img":
                  return <MediaMsg el={el} />;
                case "reply":
                  return <ReplyMsg el={el} />;
                default:
                  return <TextMsg el={el} />;
              }
              break;
            default:
              return <></>;
          }
        })}
      </Stack>
      {/* </ScrollBar> */}
    </Box>
  );
};

export default Messages;

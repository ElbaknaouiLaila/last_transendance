import { useEffect, useRef } from "react";
import { Box, Stack } from "@mui/material";
import Chatbox from "../../components/converstation/Chatbox";
import Header from "../../components/converstation/Header";
import Messages from "../../components/converstation/Messages";
import { useAppDispatch, useAppSelector } from "../../redux/store/store";
import axios from "axios";
import { socket } from "../../socket";
import { fetchCurrentMessages } from "../../redux/slices/converstation";
import { da } from "@faker-js/faker";

const Converstation = () => {
  const dispatch = useAppDispatch();
  const messageListRef = useRef(null);
  const { current_messages, current_conversations } = useAppSelector(
    state => state.converstation.direct_chat
  );
  const { profile, contact } = useAppSelector(state => state);

  useEffect(() => {
    // Scroll to the bottom of the message list when new messages are added
    if (messageListRef.current) {
      messageListRef.current.scrollTop = 0;
    }

    const handleChatToDm = (data: any) => {
      console.log(data);
      // Check if the received message is from the currently selected conversation
      // if (conversation.direct_chat.current_conversation.id === data.id) {.
      console.log(contact.room_id, profile._id);
      if (data.recieve === contact.room_id) {
        dispatch(
          fetchCurrentMessages({
            id: data.id,
            type: "msg",
            subtype: data.subtype,
            message: data.message,
            outgoing: data.send === profile._id,
            incoming: data.recieve === profile._id,
          })
        );
      }
      // }
    };
    socket.once("chatToDm", handleChatToDm);
    // return () => {
    //   socket.off("chatToDm", handleChatToDm);
    // };
  }, [dispatch, profile._id, contact.room_id]);

  return (
    <Stack
      height={"100%"}
      maxHeight={"100vh"}
      width={"auto"}
      className="shadow-2xl"
      sx={
        {
          // borderRadius: "44px",
          // backgroundColor: "#806EA9",
        }
      }
    >
      {/* header chat */}
      <Header />
      {/* messaging */}
      <Box
        ref={messageListRef}
        width={"100%"}
        sx={{
          flexGrow: 1,
          height: "100%",
          overflowY: "auto",
          "&::-webkit-scrollbar": {
            width: "0.4em",
          },
        }}
      >
        <Messages />
      </Box>

      {/* typing */}
      <Chatbox />
    </Stack>
  );
};

export default Converstation;

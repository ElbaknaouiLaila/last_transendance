import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  direct_chat: {
    conversations: [],
    current_conversation: null,
    current_messages: [],
  },
  channel_chat: {
    conversations: [],
    current_conversation: null,
    current_messages: [],
    type_channel: null,
  },
};

export const ConverstationSlice = createSlice({
  name: "converstation",
  initialState,
  reducers: {
    fetchConverstations(state, action) {
      // ! get all converstation
      const list = action.payload.conversations.map((el: any) => {
        // console.log(el);
        const formatDateTime = (dateString: string): string => {
          const inputDate = new Date(dateString);
          const currentDate = new Date();

          const isToday = inputDate.toDateString() === currentDate.toDateString();

          if (isToday) {
            const hours = inputDate.getHours();
            const minutes = inputDate.getMinutes();
            return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
          } else {
            const options: Intl.DateTimeFormatOptions = { year: "numeric", month: "long", day: "numeric" };
            return inputDate.toLocaleDateString(undefined, options);
          }
        };

        // const user = el.find(
        //   (elm: any) => elm.id_dm.toString() !== action.payload.user_id.toString()
        // );
        // console.log(el.id_room);
        return {
          room_id: el?.id_room,
          id: el?.id,
          user_id: el?.user_id,
          name: el?.name,
          online: el?.online === "Online",
          img: el?.img,
          msg: el?.msg,
          time: formatDateTime(el?.time),
          unread: el?.unread,
          pinned: el?.pinned,
        };
      });
      state.direct_chat.conversations = list;
    },
    updatedConverstation(state, action) {
      // * update converstation
      const this_conversation = action.payload.data;
      const user_id = action.payload.user_id;
      state.direct_chat.conversations = state.direct_chat.conversations.map(
        (el: any) => {
          if (el?.id !== this_conversation._id) {
            return el;
          } else {
            const user = this_conversation.participants.find(
              (elm: any) => elm._id.toString() !== user_id
            );
            return {
              id: this_conversation._id,
              user_id: user?._id,
              name: user?.name,
              online: user?.status === "Online",
              img: user?.img,
              msg: user?.msg,
              time: user?.time,
              unread: user?.unread,
              pinned: user?.pinned,
            };
          }
        }
      );
    },
    emptyConverstation(state, action) {
      // ! empty converstation
      state.direct_chat.conversations = [];
    }
    ,
    addNewConversation(state, action) {
      // ? adding new conversation
      console.log(action.payload);
      const new_conversation = action.payload;
      state.direct_chat.conversations.push(new_conversation);
    },
    setCurrentConverstation(state, action) {
      // ! set current converstation
      // console.log(action.payload);
      state.direct_chat.current_conversation = action.payload;
      const messages: any = action.payload;
      const formatted_messages = messages.map((el: any) => ({
        id: el.id,
        type: "msg",
        subtype: el.type,
        message: el.text,
        incoming: el.incoming, // ! get user id from profile
        outgoing: el.outgoing,
      }));
      state.direct_chat.current_messages = formatted_messages;
    },
    fetchCurrentMessages(state, action) {
      // ! get all messages of current converstation
      const messages: any = action.payload;
      state.direct_chat.current_messages.push(messages);
      // state.direct_chat.current_messages.push();
    },
  },
});

export default ConverstationSlice.reducer;

export const {
  fetchConverstations,
  updatedConverstation,
  addNewConversation,
  setCurrentConverstation,
  fetchCurrentMessages,
  emptyConverstation,
} = ConverstationSlice.actions;

/*
  fetchDirectConversations(state, action) {
      const list = action.payload.conversations.map((el) => {
        const user = el.participants.find(
          (elm) => elm._id.toString() !== user_id
        );
        return {
          id: el._id,
          user_id: user?._id,
          name: `${user?.firstName} ${user?.lastName}`,
          online: user?.status === "Online",
          img: `https://${S3_BUCKET_NAME}.s3.${AWS_S3_REGION}.amazonaws.com/${user?.avatar}`,
          msg: el.messages.slice(-1)[0].text, 
          time: "9:36",
          unread: 0,
          pinned: false,
          about: user?.about,
        };
      });

      state.direct_chat.conversations = list;
    },
    updateDirectConversation(state, action) {
      const this_conversation = action.payload.conversation;
      state.direct_chat.conversations = state.direct_chat.conversations.map(
        (el) => {
          if (el?.id !== this_conversation._id) {
            return el;
          } else {
            const user = this_conversation.participants.find(
              (elm) => elm._id.toString() !== user_id
            );
            return {
              id: this_conversation._id._id,
              user_id: user?._id,
              name: `${user?.firstName} ${user?.lastName}`,
              online: user?.status === "Online",
              img: faker.image.avatar(),
              msg: faker.music.songName(),
              time: "9:36",
              unread: 0,
              pinned: false,
            };
          }
        }
      );
    },
    addDirectConversation(state, action) {
      const this_conversation = action.payload.conversation;
      const user = this_conversation.participants.find(
        (elm) => elm._id.toString() !== user_id
      );
      state.direct_chat.conversations = state.direct_chat.conversations.filter(
        (el) => el?.id !== this_conversation._id
      );
      state.direct_chat.conversations.push({
        id: this_conversation._id._id,
        user_id: user?._id,
        name: `${user?.firstName} ${user?.lastName}`,
        online: user?.status === "Online",
        img: faker.image.avatar(),
        msg: faker.music.songName(),
        time: "9:36",
        unread: 0,
        pinned: false,
      });
    },
    setCurrentConversation(state, action) {
      state.direct_chat.current_conversation = action.payload;
    },
    fetchCurrentMessages(state, action) {
      const messages = action.payload.messages;
      const formatted_messages = messages.map((el) => ({
        id: el._id,
        type: "msg",
        subtype: el.type,
        message: el.text,
        incoming: el.to === user_id,
        outgoing: el.from === user_id,
      }));
      state.direct_chat.current_messages = formatted_messages;
    },
    addDirectMessage(state, action) {
      state.direct_chat.current_messages.push(action.payload.message);
    }
*/

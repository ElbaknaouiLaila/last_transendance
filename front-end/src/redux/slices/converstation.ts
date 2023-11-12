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
      console.log(action.payload.conversations);
      // ! get all converstation
      const list: any[] = action.payload.conversations
        .filter((el: any) => !(el.room_id === action.payload.user_id || el.user_id !== action.payload.user_id))
        .map((el: any) => {
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
      // ~ empty converstation
      state.direct_chat.current_conversation = null;
      state.direct_chat.current_messages = [];
    }
    ,
    addNewConversation(state, action) {
      // ~ adding new conversation
      console.log(action.payload);
      const new_conversation = action.payload;
      state.direct_chat.conversations.push(new_conversation);
    },
    setCurrentConverstation(state, action) {
      // ~ set current converstation
      console.log(action.payload);
      const user_id = action.payload.user_id;
      state.direct_chat.current_conversation = action.payload;
      const messages: any = action.payload.data;
      const formatted_messages = messages.map((el: any) => ({
        id: el.id,
        type: "msg",
        subtype: el.type,
        message: el.text,
        incoming: el.incoming === user_id, // ! get user id from profile
        outgoing: el.outgoing === user_id, // ! get user id from profile
      }));
      console.log(formatted_messages);
      state.direct_chat.current_messages = formatted_messages;
    },
    fetchCurrentMessages(state, action) {
      // ~ get all messages of current converstation
      console.log(action.payload);
      const messages: any = action.payload;
      state.direct_chat.current_messages.push(messages);
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

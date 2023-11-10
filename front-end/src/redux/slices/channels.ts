import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';
import { useDispatch } from 'react-redux';

export interface Channel {
  members: [];
  channel_id: string;
  image: string;
  name: string;
  owner: [];
  admin: [];
  last_messages: string;
  time: string;
  unread: number;
  current_messages: [];
  channel_type: string;
}

interface ConversationChannel {
  room_id: string;
  user_id: string;
  title: string;
  img: string;
  last_msg: string;
  time: string;
  unread: number;
}
export interface ChannelState {
  channels: Channel[];
  channels_conversation: ConversationChannel[];
  current_channel: Channel | null;
  current_messages: [];
}

const initialState: ChannelState = {
  channels: [],
  channels_conversation: [],
  current_channel: null,
  current_messages: [],
};

export const ChannelsSlice = createSlice({
  name: 'channels',
  initialState,

  reducers: {
    fetchChannels(state, action) {
      //! get all channels conversation
      console.log(action.payload);
      // state.channels = action.payload;
      state.channels = action.payload.map((el: any) => ({
        channel_id: el.channel_id,
        image: el.image,
        name: el.name,
        owner: el.owner,
        admin: el.admin,
        members: el.members,
        last_messages: el.latest_message,
        time: el.time,
        unread: el.unread,
        channel_type: el.channel_type,
      }));
    },
    updatedChannels(state, action: PayloadAction<Channel[]>) {
      //! update channels
      state.channels = action.payload;
    },
    addNewChannel(state, action: PayloadAction<Channel>) {
      //! add new channel
      state.channels.push(action.payload);
    },
    setCurrentChannel(state, action: PayloadAction<Channel>) {
      //! set current channel
      console.log(action.payload);
      state.current_channel = action.payload;
      const messages: any = action.payload;
      const formatted_messages = messages.map((el: any) => ({
        id: el.id,
        type: "msg",
        subtype: el.type,
        message: el.text,
        incoming: el.incoming, // ! get user id from profile
        outgoing: el.outgoing,
      }));
      state.current_messages = formatted_messages;
    },
    fetchCurrentMessages(state, action: PayloadAction<[]>) {
      //! get all messages of current channel
      state.current_messages = action.payload;

    },
    updateChannelsMessages(state, action: PayloadAction<[]>) {
      console.log(action.payload)
      state.current_messages.push(action.payload);
    },
  },
});




export function FetchChannels() {
  const dispatch = useDispatch();
  return async () => {
    await axios
      .get("http://localhost:3000/channels/allChannels", {
        withCredentials: true, headers: {
          "Content-Type": "application/json",
        },
      })
      .then((res) => {
        console.log(res.data);
        dispatch(fetchChannels(res.data));
      })
      .catch((err) => console.log(err));
  };
}

export const {
  fetchChannels,
  updatedChannels,
  addNewChannel,
  setCurrentChannel,
  fetchCurrentMessages,
  updateChannelsMessages,
} = ChannelsSlice.actions;

export default ChannelsSlice.reducer;

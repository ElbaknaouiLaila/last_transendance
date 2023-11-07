import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';
import { useDispatch } from 'react-redux';

export interface Channel {
  members: [];
  channel_id: string;
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
    fetchChannels(state, action: PayloadAction<ConversationChannel[]>) {
      //! get all channels conversation
      console.log(action);
      // state.channels_conversation = action.payload;
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
      state.current_channel = action.payload;
    },
    fetchCurrentMessages(state, action: PayloadAction<[]>) {
      //! get all messages of current channel
      state.current_messages = action.payload;
    },
    addMessage(state, action: PayloadAction<[]>) {
      // state.current_messages.push(action);
    },
  },
});



export default ChannelsSlice.reducer;

export function FetchChannels() {
  const dispatch = useDispatch();
  return async () => {
    await axios
      .get("http://localhost:3000/auth/get-user", { withCredentials: true })
      .then((res) => {
        dispatch(ChannelsSlice.actions.fetchChannels(res.data));
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
  addMessage,
} = ChannelsSlice.actions;

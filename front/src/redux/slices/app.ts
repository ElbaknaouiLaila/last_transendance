import { createSlice } from "@reduxjs/toolkit";
import axios from "axios";
import { useDispatch } from "react-redux";
// import { useAppDispatch } from "../store/store";

// const dispatch = useAppDispatch();

export interface App {
  users: []; // all users of app who are not friends and not requested yet
  friends: [];
  request_friends: [];
  needUpdate: boolean;
}

const initialState: App = {
  users: [],
  friends: [],
  request_friends: [],
  needUpdate: false,
};

export const AppSlice = createSlice({
  name: "app",
  initialState,
  reducers: {
    fetchUsers(state, action) {
      // ~ get all users
      state.users = action.payload;
    },
    fetchFriends(state, action) {
      // console.log(action);
      // ~ get all friends
      state.friends = action.payload;
    },
    fetchRequestFriends(state, action) {
      // ~ get all request friends
      state.request_friends = action.payload;
    },
    updateFriends(state, action) {
      // * update friends
      state.friends = action.payload;
    },
    addFriend(state, action) {
      // ? add friend
      state.request_friends = action.payload;
    },
    acceptFriend(state, action) {
      // * accept friend
      state.friends = action.payload;
    },
    removeFriend(state, action) {
      state.friends = action.payload;
    },
    declineFriend(state, action) {
      // * decline friend
      state.request_friends = action.payload;
    },
    needUpdate(state) {
      state.needUpdate = state.needUpdate ? false : true;
    },
  },
});

export function FetchFriends() {
  // const user_id = localStorage.getItem("user_id");
  return async (dispatch: any) => {
    try {
      const res = await axios.get("http://localhost:3000/auth/friends", {
        withCredentials: true,
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (res.data) {
        dispatch(AppSlice.actions.updateFriends(res.data));
        console.log("fetch friends succefully!!");
      }
    } catch (err) {
      console.log("unfortuanally you didn't catch a thing");
    }

    // await axios.get("http://localhost:3000/auth/friends", {
    //     withCredentials: true,
    //     headers: {
    //         "Content-Type": "application/json",
    //         // Authorization: `Bearer ${getState().auth.token}`,
    //     },
    // })
    //     .then((response) => {
    //         // console.log(response.data);
    //         dispatch(AppSlice.actions.updateFriends(response.data));
    //         // AppSlice.actions.updateFriends({ friends: response.data.data });
    //     })
    //     .catch((err) => {
    //         console.log(err);
    // );
  };
}

export default AppSlice.reducer;

export const {
  fetchUsers,
  fetchFriends,
  fetchRequestFriends,
  updateFriends,
  addFriend,
  acceptFriend,
  removeFriend,
  declineFriend,
  needUpdate,
} = AppSlice.actions;

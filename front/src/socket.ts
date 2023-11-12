import {io,  Socket } from "socket.io-client";
import { createContext } from "vm";
// import io from "socket.io-client"; // Add this

let socket: Socket;

// const connectSocket = (user_id: string) => {
//   socket = io("http://localhost:3001", {
//     query: {
//         user_id: user_id,
//       },
//   });
// } // Add this -- our server will run on port 4000, so we connect to it from here

// export {socket, connectSocket};

const socketuser  = () => {
    socket = io("http://localhost:3000/users", {
        transports: ["websocket"],
        withCredentials: true,
    });
}
export {socketuser, socket};
// const context = createContext(socket);

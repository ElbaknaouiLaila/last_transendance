import React, { useState } from "react";
import {
  Avatar,
  Box,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  Gavel,
  Prohibit,
  SpeakerSimpleNone,
  SpeakerSimpleSlash,
  UserGear,
  UserMinus,
  UserPlus,
} from "@phosphor-icons/react";

const MembersSettings = (el: any) => {
  console.log(el.el.user);
  const { user } = el.el;
  const [muted, setMuted] = useState(false);

  const friendRequest = () => {
    console.log("friend request");
    // ! emit "friend_request" event

    // socket.emit("friend_request", { to: _id, from: user_id });
    // dispatch(updatedContactInfo({ friend_request: true }));
  };
  const handleClickMuted = () => {
    // ! emit "mute_converstation" event

    // socket.emit("mute_converstation", { to: _id, from: user_id });
    // dispatch(mutedContact({ room_id: id }));

    if (muted === true) {
      console.log("unmute");
    } else {
      console.log("mute");
    }
    setMuted(() => !muted);
  };
  return (
    <Box
      sx={{
        // display: "flex",
        // flexDirection: "row",
        // justifyContent: "space-evenly",
        width: 520,
        padding: "25px 25px",
        margin: "1px",
        borderRadius: "15px",
        backgroundColor: "#806EA9",
      }}
    >
      <Stack
        direction={"row"}
        alignItems={"center"}
        justifyContent={"space-between"}
      >
        <Stack direction={"row"} alignItems={"center"} spacing={1}>
          <Avatar src={user.avatar} sx={{ width: 52, height: 52 }} />
          <Typography variant="h5" color={"#322554"} sx={{ padding: 0 }}>
            {user.name}
          </Typography>
        </Stack>
        <Stack direction={"row"} alignItems={"center"} spacing={1}>
          <Box
            sx={{
              width: "50px",
              padding: "5px",
              borderRadius: "15px",
              backgroundColor: "#806149",
            }}
          >
            <Tooltip title="Make admin">
              <IconButton aria-label="friend request" onClick={friendRequest}>
                <UserGear />
              </IconButton>
            </Tooltip>
          </Box>
          <Box
            sx={{
              width: "50px",
              padding: "5px",
              borderRadius: "15px",
              backgroundColor: "#806149",
            }}
          >
            <Tooltip title="Send Friend Request">
              <IconButton aria-label="friend request" onClick={friendRequest}>
                <UserPlus />
              </IconButton>
            </Tooltip>
          </Box>
          <Box
            sx={{
              width: "50px",
              padding: "5px",
              borderRadius: "15px",
              backgroundColor: "#806149",
            }}
          >
            <Tooltip title="Mute">
              <IconButton aria-label="mute contact" onClick={handleClickMuted}>
                {muted ? <SpeakerSimpleSlash /> : <SpeakerSimpleNone />}
              </IconButton>
            </Tooltip>
          </Box>
          <Box
            sx={{
              width: "50px",
              padding: "5px",
              borderRadius: "15px",
              backgroundColor: "#806149",
            }}
          >
            <Tooltip title="Kick">
              <IconButton
                onClick={() => {
                  console.log("kick Contact");
                  // ! emit "kick_contact" event
                  // socket.emit("delete_contact", { to: _id, from: user_id });
                }}
              >
                <UserMinus />
              </IconButton>
            </Tooltip>
          </Box>
          <Box
            sx={{
              width: "50px",
              padding: "5px",
              borderRadius: "15px",
              backgroundColor: "#806149",
            }}
          >
            <Tooltip title="Ban">
              <IconButton
                onClick={() => {
                  console.log("Ban User");
                  // ! emit "ban_contact" event
                  // socket.emit("block_contact", { to: _id, from: user_id });
                }}
              >
                <Gavel />
              </IconButton>
            </Tooltip>
          </Box>
        </Stack>
      </Stack>
    </Box>
  );
};

export default MembersSettings;

// <Gavel size={32} />

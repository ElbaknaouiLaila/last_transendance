import {
  Avatar,
  Box,
  Button,
  Dialog,
  Divider,
  IconButton,
  Slide,
  Stack,
  Typography,
} from "@mui/material";
import { TransitionProps } from "@mui/material/transitions";
import {
  Gear,
  Prohibit,
  SignOut,
  SpeakerSimpleX,
  X,
} from "@phosphor-icons/react";
import React, { useEffect, useRef, useState } from "react";
import { toggleDialog } from "../../redux/slices/contact";
import { useAppDispatch, useAppSelector } from "../../redux/store/store";
import ChangeChannels from "../channels/ChangeChannels";
import { LeaveDialog, MuteDialog, RemoveDialog } from "../dialogs/Dialogs";
import MembersSettings from "./MembersSettings";

const Transition = React.forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement<any, any>;
  },
  ref: React.Ref<unknown>
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const InfosChannel = () => {
  const currentInfos = useRef<any>(null);
  const [owner, setOwner] = useState(false);
  const dispatch = useAppDispatch();
  const { contact, channels, profile } = useAppSelector(store => store);

  useEffect(() => {
    const isOwner = channels.publicChannels.find((channel: any) => {
      return channel.users.some((user: any) => {
        return (
          user.userId === profile._id && user.status_UserInChannel === "owner"
        );
      });
    });
    if (isOwner) {
      setOwner(true);
    } else {
      setOwner(false);
    }
    //
  }, [contact, profile, channels]);
  // console.log(channels.publicChannels);
  if (contact.type_chat === "public") {
    // console.log("public");
    const channel = channels.publicChannels.find((channel: any) => {
      return channel?.id_channel === contact.room_id;
    });

    currentInfos.current = channel;
    // contact.name = channel?.name;
  } else if (contact.type_chat === "protected") {
    // console.log("protected");
    const channel = channels.protectedChannels.find(
      (channel: any) => channel?.id_channel === contact.room_id
    );
    currentInfos.current = channel;

    // contact.name = channel?.name;
  } else if (contact.type_chat === "private") {
    // console.log("private");
    const channel = channels.privateChannels.find(
      (channel: any) => channel?.id_channel === contact.room_id
    );
    currentInfos.current = channel;
  }

  const [openBlock, setOpenBlock] = useState(false);
  const [openLeave, setOpenLeave] = useState(false);
  const [openSettings, setOpenSettings] = useState(false);

  const handleCloseBlock = () => {
    setOpenBlock(false);
  };
  const handleCloseLeave = () => {
    setOpenLeave(false);
  };

  const handleClickSettings = () => {
    setOpenSettings(false);
  };

  return (
    <Dialog
      open={contact.contactInfos.open}
      TransitionComponent={Transition}
      keepMounted
      onClose={() => {
        dispatch(toggleDialog());
      }}
      PaperProps={{
        style: { backgroundColor: "#696693", borderRadius: "35px" },
      }}
    >
      <Typography
        sx={{
          my: 2,
        }}
        variant="h4"
        align="center"
        fontWeight={600}
        color={"#25213B"}
      >
        Channel info
      </Typography>
      <IconButton
        aria-label="close"
        onClick={() => {
          dispatch(toggleDialog());
        }}
        sx={{
          position: "absolute",
          left: "22.7em",
          top: 10,
          color: theme => theme.palette.grey[800],
        }}
      >
        <X />
      </IconButton>
      {owner && (
        <IconButton
          aria-label="close"
          onClick={() => {
            setOpenSettings(true);
          }}
          sx={{
            position: "absolute",
            left: "21em",
            top: 10,
            color: theme => theme.palette.grey[800],
          }}
        >
          <Gear />
        </IconButton>
      )}
      {/* <DialogContent> */}
      <Stack
        sx={{
          height: "100%",
          position: "relative",
        }}
        p={3}
        spacing={3}
      >
        <Stack alignItems={"center"} direction={"column"} spacing={2}>
          <Stack>
            <Avatar
              alt={contact.name}
              src={currentInfos.current?.image}
              sx={{ width: 200, height: 200 }}
            />
          </Stack>
          {/* name */}
          <Stack direction={"column"} alignItems={"center"}>
            <Typography
              variant="h3"
              color={"#25213B"}
              sx={{ padding: 0, fontWeight: 700 }}
            >
              {currentInfos.current?.name}
            </Typography>
            <Typography variant="h5" color={"#322554"} sx={{ padding: 0 }}>
              {currentInfos.current?.users.length} members
            </Typography>
          </Stack>
        </Stack>
        <Divider />
        {/* statics */}
        <Stack direction={"column"} alignItems={"center"}>
          <Box
            sx={{
              display: "flex",
              flexDirection: "row",
              justifyContent: "space-evenly",
              width: 580,
              height: 385,
              flexGrow: 1,
              overflowY: "auto",
              "&::-webkit-scrollbar": {
                width: "0.4em",
              },
              padding: "32px 0",
              borderRadius: "35px",
              backgroundColor: "#B7B7C9",
            }}
          >
            {/* make an array */}
            <Stack spacing={1}>
              {currentInfos.current?.users.map((member: any) => (
                <MembersSettings el={member} isOwner={owner} />
              ))}
            </Stack>
          </Box>
        </Stack>
        <Divider />
        {/* Buttons */}
        <Stack direction={"row"} justifyContent={"center"} spacing={4}>
          <Button
            onClick={() => {
              setOpenLeave(true);
            }}
            variant="contained"
            endIcon={<SignOut size={30} />}
            sx={{
              borderRadius: "15px",
              fontSize: "20px",
              padding: "10px 22px",
              color: "#EADDFF",
              backgroundColor: "#322554",
              "&:hover": {
                backgroundColor: "#806EA9",
              },
            }}
          >
            Leave
          </Button>
          {owner && (
            <Button
              onClick={() => {
                setOpenBlock(true);
              }}
              variant="contained"
              endIcon={<Prohibit size={30} />}
              sx={{
                borderRadius: "15px",
                fontSize: "20px",
                padding: "10px 22px",
                color: "#EADDFF",
                backgroundColor: "#DF1D1D",
                "&:hover": {
                  backgroundColor: "#ef8285",
                },
              }}
            >
              Remove
            </Button>
          )}
        </Stack>
      </Stack>
      {openLeave && (
        <LeaveDialog
          open={openLeave}
          handleClose={handleCloseLeave}
          el={{
            user_id: profile._id,
            channel_id: currentInfos.current?.id_channel,
          }}
        />
      )}
      {openBlock && (
        <RemoveDialog
          open={openBlock}
          handleClose={handleCloseBlock}
          el={{
            user_id: profile._id,
            channel_id: currentInfos.current?.id_channel,
          }}
        />
      )}
      {openSettings && (
        <ChangeChannels
          open={openSettings}
          handleClose={handleClickSettings}
          el={{ el: currentInfos.current, user_id: profile._id }}
        />
      )}
    </Dialog>
  );
};

export default InfosChannel;

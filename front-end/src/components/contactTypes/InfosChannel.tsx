import { faker } from "@faker-js/faker";
import {
  Avatar,
  Box,
  Button,
  Dialog,
  Divider,
  IconButton,
  Popover,
  Slide,
  Stack,
  Typography,
} from "@mui/material";
import { TransitionProps } from "@mui/material/transitions";
import {
  CaretRight,
  PencilSimple,
  Prohibit,
  SpeakerSimpleX,
  Star,
  Trash,
  X,
} from "@phosphor-icons/react";
import React, { useRef, useState } from "react";
import { toggleDialog, updatedContactInfo } from "../../redux/slices/contact";
import { useAppDispatch, useAppSelector } from "../../redux/store/store";

import { BlockDialog, DeleteDialog, MuteDialog } from "../dialogs/Dialogs";
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
  const dispatch = useAppDispatch();
  const { contact, channels } = useAppSelector(store => store);
  console.log(contact);

  console.log(channels.publicChannels);
  if (contact.type_chat === "public") {
    console.log("public");
    const channel = channels.publicChannels.find(
      channel => channel?.id_channel === contact.room_id
    );
    console.log(channel);
    currentInfos.current = channel;
    // contact.name = channel?.name;
  } else if (contact.type_chat === "protected") {
    console.log("protected");
    const channel = channels.protectedChannels.find(
      channel => channel?.id_channel === contact.room_id
    );
    currentInfos.current = channel;

    // contact.name = channel?.name;
  } else if (contact.type_chat === "private") {
    console.log("private");
    const channel = channels.privateChannels.find(
      channel => channel?.id_channel === contact.room_id
    );
    currentInfos.current = channel;

    // contact.name = channel?.name;
  }
  const [openBlock, setOpenBlock] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [openMute, setOpenMute] = useState(false);

  const handleCloseBlock = () => {
    setOpenBlock(false);
  };
  const handleCloseDelete = () => {
    setOpenDelete(false);
  };

  const handleCloseMute = () => {
    setOpenMute(false);
  };
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  const handlePopoverOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handlePopoverClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);

  return (
    <Dialog
      open={contact.contactInfos.open}
      TransitionComponent={Transition}
      keepMounted
      onClose={() => {
        dispatch(toggleDialog());
      }}
      PaperProps={{
        style: { backgroundColor: "#AE9BCD", borderRadius: "35px" },
      }}
      // aria-describedby="alert-dialog-slide-description"
    >
      <Typography sx={{ m: "0 8px", p: 2 }} variant="h6">
        Channel info
      </Typography>
      {/* <DialogTitle sx={{ m: "0 8px", p: 2 }} >Contact info</DialogTitle> */}
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
      {/* <DialogContent> */}
      <Stack
        sx={{
          height: "100%",
          position: "relative",
          // flexGrow: 1,
          // overflowY: "auto",
        }}
        p={3}
        spacing={3}
      >
        {/* adding image in and username */}
        <Stack alignItems={"center"} direction={"column"} spacing={2}>
          {/* ****************************************** */}
          {/* TODO ===> NEED TO MAKE THIS CORRECT */}
          <Stack>
            <Avatar
              alt={contact.name}
              src={currentInfos.current?.image}
              sx={{ width: 200, height: 200 }}
              onMouseEnter={handlePopoverOpen}
              onMouseLeave={handlePopoverClose}
            />
            <Popover
              open={open}
              anchorEl={anchorEl}
              onClose={handlePopoverClose}
              anchorOrigin={{
                vertical: "bottom",
                horizontal: "right",
              }}
              transformOrigin={{
                vertical: "top",
                horizontal: "left",
              }}
            >
              <IconButton onClick={() => console.log("Edit clicked")}>
                <PencilSimple size={32} weight="bold" />
              </IconButton>
              <Typography>Edit Avatar</Typography>
            </Popover>
          </Stack>
          {/* name */}
          <Stack direction={"column"} alignItems={"center"}>
            <Typography variant="h4" color={"#322554"} sx={{ padding: 0 }}>
              {currentInfos.current?.name}
            </Typography>
            <Typography variant="h6" color={"#322554"} sx={{ padding: 0 }}>
              {currentInfos.current?.users.length} members
            </Typography>
          </Stack>
        </Stack>
        {/* ****************************************** */}

        <Divider />
        {/* statics */}
        <Stack direction={"column"} alignItems={"center"}>
          <Box
            sx={{
              display: "flex",
              flexDirection: "row",
              justifyContent: "space-evenly",
              width: 580,
              // height: 385,
              padding: "25px 0",
              // margin: "10px",
              borderRadius: "35px",
              backgroundColor: "#EADDFF",
            }}
          >
            {/* make an array */}
            <Stack spacing={1}>
              {currentInfos.current?.users.map((member: any) => (
                <MembersSettings el={member} />
              ))}
            </Stack>
          </Box>
        </Stack>
        <Divider />
        {/* Buttons */}
        <Stack direction={"row"} justifyContent={"center"} spacing={4}>
          <Button
            onClick={() => {
              setOpenMute(true);
            }}
            variant="contained"
            endIcon={<SpeakerSimpleX size={30} />}
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
            Mute
          </Button>
          <Button
            onClick={() => {
              setOpenDelete(true);
            }}
            variant="contained"
            endIcon={<Trash size={30} />}
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
            Delete
          </Button>
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
            Block
          </Button>
        </Stack>
      </Stack>
      {openMute && <MuteDialog open={openMute} handleClose={handleCloseMute} />}
      {openDelete && (
        <DeleteDialog open={openDelete} handleClose={handleCloseDelete} />
      )}
      {openBlock && (
        <BlockDialog open={openBlock} handleClose={handleCloseBlock} />
      )}
    </Dialog>
  );
};

export default InfosChannel;

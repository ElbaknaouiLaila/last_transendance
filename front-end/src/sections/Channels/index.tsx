import { Box, Button, Divider, Stack } from "@mui/material";
import { MagnifyingGlass, PlusCircle } from "@phosphor-icons/react";
import { useState } from "react";
import ChatElements from "../../components/ChatElements";
import {
  Search,
  SearchIconWrapper,
  StyledInputBase,
} from "../../components/search";
import CreateChannel from "../../components/channels/CreateChannel";
import JoinChannel from "../../components/channels/JoinChannel";
import { ChatList } from "../../data";
import ChannelElements from "../../components/ChannelsElements";
import { useAppSelector } from "../../redux/store/store";

const Channels = () => {
  const [openCreateChannel, setOpenCreateChannel] = useState(false);
  const [openJoinChannel, setOpenJoinChannel] = useState(false);
  const { channels } = useAppSelector(state => state);

  // this is will close join channel modal
  const handleCloseJoinChannel = () => {
    setOpenJoinChannel(false);
  };
  // this is will close join channel modal
  const handleCloseCreateChannel = () => {
    setOpenCreateChannel(false);
  };

  return (
    <>
      <Box
        sx={{
          position: "relative",
          width: 452,
          margin: "0 18px 18px",
        }}
      >
        <Stack sx={{ height: "calc(100vh - 320px)" }}>
          <Stack padding={1} sx={{ width: "100%" }}>
            <Search>
              <SearchIconWrapper>
                <MagnifyingGlass />
              </SearchIconWrapper>
              <StyledInputBase
                placeholder="Search…"
                inputProps={{ "aria-label": "search" }}
              />
            </Search>
          </Stack>
          <Stack
            justifyContent={"space-between"}
            padding={"10px 15px 20px"}
            spacing={2}
          >
            <Stack
              direction={"row"}
              alignContent={"center"}
              spacing={3}
              color="#709CE6"
              // margin={"auto"}
              display={"block"}
            >
              <Button
                onClick={() => {
                  setOpenCreateChannel(true);
                }}
                startIcon={<PlusCircle size={26} />}
                sx={{
                  fontSize: "18px", // Adjust the font size as needed
                  padding: "10px 17px", // Adjust the padding as needed
                  // neeed to make it center
                  backgroundColor: "#806EA9", // Change the background color to purple
                  color: "#3D2E5F", // Change the text color to white
                  borderRadius: "21px",
                  "&:hover": {
                    backgroundColor: "#684C83", // Change the background color on hover
                    color: "#C7BBD1",
                  },
                }}
                variant="contained"
              >
                New Channel
              </Button>
              <Button
                onClick={() => {
                  setOpenJoinChannel(true);
                }}
                startIcon={<PlusCircle size={26} />}
                sx={{
                  fontSize: "18px",
                  padding: "10px 17px",
                  backgroundColor: "#806EA9",
                  color: "#3D2E5F",
                  borderRadius: "21px",
                  "&:hover": {
                    backgroundColor: "#684C83",
                    color: "#C7BBD1",
                  },
                }}
                variant="contained"
              >
                Join Channel
              </Button>
            </Stack>
            <Divider sx={{ paddingTop: "1px", background: "#684C83" }} />
          </Stack>
          <Stack
            direction={"column"}
            sx={{
              flexGrow: 1,
              overflowY: "auto",
              "&::-webkit-scrollbar": {
                width: "0.4em",
              },
              height: "100%",
            }}
          >
            {/* <SimpleBarStyle> */}
            <Stack sx={{ backgroundColor: "#F3A162", borderRadius: "25px" }}>
              {channels.channels.map((el, index) => {
                return <ChannelElements key={index} {...el} />;
              })}
            </Stack>
            {/* </SimpleBarStyle> */}
          </Stack>
        </Stack>
      </Box>
      {openJoinChannel && (
        <JoinChannel
          open={openJoinChannel}
          handleClose={handleCloseJoinChannel}
        />
      )}
      {openCreateChannel && (
        <CreateChannel
          open={openCreateChannel}
          handleClose={handleCloseCreateChannel}
        />
      )}
    </>
  );
};

export default Channels;

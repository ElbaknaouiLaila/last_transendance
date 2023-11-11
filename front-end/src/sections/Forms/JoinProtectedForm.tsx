import { faker } from "@faker-js/faker";
import { yupResolver } from "@hookform/resolvers/yup";
import {
  Avatar,
  Button,
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { Eye, EyeSlash } from "@phosphor-icons/react";
import * as React from "react";
import { useForm } from "react-hook-form";
import * as Yup from "yup";
import { showSnackbar } from "../../redux/slices/contact";
import { useAppDispatch, useAppSelector } from "../../redux/store/store";
import axios from "axios";

interface Option {
  id_channel: number;
  name: string;
  visibility: string;
  value: string;
  label: string;
  key: number;
  password: string;
}

interface JoinProtectedFormData {
  mySelect: Option; // Store the selected option object
  password: string; // Store the entered password
}

const JoinProtectedForm = ({ handleClose }: any) => {
  const { protectedChannels } = useAppSelector(state => state.channels);

  const dispatch = useAppDispatch();
  const [showPassword, setShowPassword] = React.useState(false);

  const ProtectedChannelSchema = Yup.object().shape({
    mySelect: Yup.object().shape({
      value: Yup.string(),
      label: Yup.string(),
      key: Yup.number(),
      password: Yup.string(),
    }),
    password: Yup.string().required("Password is required"),
  });

  const defaultValues = {
    mySelect: {
      value: "",
      label: "",
      password: "",
      key: 0,
    },
    password: "",
  };

  const { register, handleSubmit, formState } = useForm({
    defaultValues: {
      mySelect: {
        value: "",
        label: "",
        key: 0,
      },
    },
    resolver: yupResolver(ProtectedChannelSchema),
  });

  const { errors } = formState;

  const onSubmit = async (data: JoinProtectedFormData) => {
    try {
      axios.post(
        "http://localhost:3000/channels/join",
        { data },
        { withCredentials: true }
      );
      dispatch(
        showSnackbar({
          severity: "success",
          message: `You Join to ${data.mySelect.value} successfully`,
        })
      );
      // if (data.mySelect.password === data.password) {
      //   dispatch(
      //     showSnackbar({
      //       severity: "success",
      //       message: `You Join to ${data.mySelect.value} successfully`,
      //     })
      //   );
      //   // Call API or perform action here
      //   console.log("DATA", data);
      // } else {
      //   dispatch(
      //     showSnackbar({
      //       severity: "warning",
      //       message: "Password is incorrect. Please try again.",
      //     })
      //   );
      // }
    } catch (error) {
      console.log("error", error);
      dispatch(
        showSnackbar({
          severity: "failed",
          message: `You Failed Join to ${data.mySelect.value}`,
        })
      );
    }
  };

  const [selectedOption, setSelectedOption] = React.useState<Option>({
    key: 0,
    value: "",
    label: "",
    password: "",
  });

  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  return (
    <form
      onSubmit={handleSubmit(data =>
        onSubmit({ ...data, mySelect: selectedOption })
      )}
    >
      <Stack spacing={3}>
        <FormControl fullWidth>
          <InputLabel>Choose a Channel</InputLabel>
          <Select
            {...register("mySelect.value")}
            onChange={(event: any) => {
              const selectedValue: any = event.target.value;
              const selectedOption: any = protectedChannels.find(
                (option: any) => option.value === selectedValue
              );
              setSelectedOption(
                selectedOption || protectedChannels[0] || undefined
              );
            }}
            label="Choose a Channel"
            fullWidth
            required
          >
            {protectedChannels.map((option: any) => (
              <MenuItem key={option.key} value={option.value}>
                <Stack
                  direction={"row"}
                  alignItems={"center"}
                  justifyContent={"space-around"}
                >
                  <Avatar
                    src={faker.image.avatar()}
                    sx={{ width: 52, height: 52, marginRight: 2 }}
                  />
                  <Typography variant="subtitle2" color={"black"}>
                    {option.label}
                  </Typography>
                </Stack>
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl fullWidth>
          <TextField
            {...register("password")}
            label="Password"
            type={showPassword ? "text" : "password"}
            fullWidth
            error={!!errors.password}
            helperText={errors.password?.message}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={toggleShowPassword} edge="end">
                    {showPassword ? <EyeSlash /> : <Eye />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </FormControl>

        <Button onClick={handleClose}>Cancel</Button>
        <Button
          sx={{
            backgroundColor: "#806EA9",
            color: "#C7BBD1",
            borderRadius: "21px",
            "&:hover": {
              backgroundColor: "#684C83",
              color: "#C7BBD1",
            },
          }}
          type="submit"
          variant="contained"
        >
          Join Channel
        </Button>
      </Stack>
    </form>
  );
};

export default JoinProtectedForm;

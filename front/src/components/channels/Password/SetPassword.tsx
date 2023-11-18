import { yupResolver } from "@hookform/resolvers/yup";
import axios from "axios";
import * as React from "react";
import { useForm } from "react-hook-form";
import * as Yup from "yup";
import { showSnackbar } from "../../../redux/slices/contact";
import { useAppDispatch } from "../../../redux/store/store";
import FormProvider from "../../hook-form/FormProvider";
import { Button, IconButton, InputAdornment, Stack } from "@mui/material";
import { RHFTextField } from "../../../components/hook-form";
import { Eye, EyeSlash } from "@phosphor-icons/react";

const SetPassword = ({ handleClose, el, user_id }: any) => {
  const dispatch = useAppDispatch();
  const [showPassword, setShowPassword] = React.useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = React.useState(false);

  const SetPasswordShema = Yup.object().shape({
    password: Yup.string()
      .min(6, "Password must be at least 6 characters")
      .required("Password is required"),
    passwordConfirm: Yup.string()
      .required("Confirm password is required")
      .oneOf([Yup.ref("password"), null], "Passwords must match"),
  });

  const defaultValues = {
    password: "",
    passwordConfirm: "",
  };

  const methods = useForm({
    resolver: yupResolver(SetPasswordShema),
    defaultValues,
  });

  const { handleSubmit, errors, reset } = methods;

  const onSubmit = async (data: any) => {
    try {
      //   console.log(el);
      //   console.log(user_id);
      data.channel_id = el.id_channel;
      data.user_id = user_id;
      console.log(data);
      await axios.post("http://localhost:3000/channels/setPass", data, {
        withCredentials: true,
      });
      handleClose();
      dispatch(
        showSnackbar({
          severity: "success",
          message: "You upgrated to Protected channel",
        })
      );
    } catch (err) {
      console.error(err);
      reset();
      dispatch(
        showSnackbar({
          severity: "failed",
          message: "update into Protected Channel Failed",
        })
      );
      handleClose();
    }
  };

  return (
    <FormProvider methods={methods} onSubmit={handleSubmit(onSubmit)}>
      <Stack spacing={3} mb={4}>
        <RHFTextField
          name="password"
          label="Password"
          type={showPassword ? "text" : "password"}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  onClick={() => setShowPassword(!showPassword)}
                  edge="end"
                >
                  {showPassword ? <Eye /> : <EyeSlash />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />

        <RHFTextField
          name="passwordConfirm"
          label="Confirm New Password"
          type={showPasswordConfirm ? "text" : "password"}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                  edge="end"
                >
                  {showPasswordConfirm ? <Eye /> : <EyeSlash />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
      </Stack>

      <Stack
        direction={"row"}
        alignContent={"center"}
        justifyContent={"space-evenly"}
      >
        <Button
          sx={{
            backgroundColor: "#806EA9", // Change the background color to purple
            color: "#C7BBD1", // Change the text color to white
            borderRadius: "12px",
            width: "150px",
            height: "50px",
            "&:hover": {
              backgroundColor: "#684C83", // Change the background color on hover
              color: "#C7BBD1",
            },
          }}
          variant="contained"
          onClick={handleClose}
        >
          Cancel
        </Button>
        <Button
          sx={{
            backgroundColor: "#806EA9", // Change the background color to purple
            color: "#C7BBD1", // Change the text color to white
            borderRadius: "12px",
            height: "50px",
            "&:hover": {
              backgroundColor: "#684C83", // Change the background color on hover
              color: "#C7BBD1",
            },
          }}
          type="submit"
          variant="contained"
        >
          Set New Password
        </Button>
      </Stack>
    </FormProvider>
  );
};

export default SetPassword;
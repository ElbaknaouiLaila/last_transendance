import { faker } from "@faker-js/faker";
import { yupResolver } from "@hookform/resolvers/yup";
import {
  Avatar,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Typography,
} from "@mui/material";
import { useState } from "react";
import { useForm } from "react-hook-form";
import * as Yup from "yup";
import { showSnackbar } from "../../redux/slices/contact";
import { useAppDispatch, useAppSelector } from "../../redux/store/store";
import axios from "axios";

interface Option {
  value: string;
  label: string;
  key: number;
}

interface JoinPublicFormData {
  mySelect: Option; // Store the selected option object
}

const JoinPublicForm = ({ handleClose }: any) => {
  const dispatch = useAppDispatch();
  const { publicChannels } = useAppSelector(state => state.channels);

  const schema = Yup.object().shape({
    mySelect: Yup.object().shape({
      value: Yup.string().required("Channel is required"),
      label: Yup.string(),
      key: Yup.number(),
    }),
  });

  const { register, handleSubmit, formState } = useForm({
    defaultValues: {
      mySelect: {
        value: "",
        label: "",
        key: 0,
      },
    },
    resolver: yupResolver(schema),
  });

  const { errors } = formState;

  const onSubmit = (data: JoinPublicFormData) => {
    try {
      // Access the selected option value and label from the form data
      const selectedValue = data.mySelect.value;
      const selectedLabel = data.mySelect.label;
      axios.post(
        "http://localhost:3000/channels/join",
        { data: { selectedValue, selectedLabel } },
        { withCredentials: true }
      );
      // Call API with form data, including the selected channel value and label
      console.log("Selected Channel Value:", selectedValue);
      console.log("Selected Channel Label:", selectedLabel);
      dispatch(
        showSnackbar({
          severity: "success",
          message: `You Join to ${data.mySelect.value} successfully`,
        })
      );
    } catch (error) {
      console.error("error", error);
      dispatch(
        showSnackbar({
          severity: "failed",
          message: `You Failed Join to ${data.mySelect.value}`,
        })
      );
    }
  };

  // State to store the selected option
  const [selectedOption, setSelectedOption] = useState<Option>({
    key: 0,
    value: "",
    label: "",
  });

  return (
    <form
      onSubmit={handleSubmit(data => onSubmit({ mySelect: selectedOption }))}
    >
      <Stack spacing={3}>
        <FormControl fullWidth>
          <InputLabel>Choose a Channel</InputLabel>
          <Select
            {...register("mySelect.value")}
            onChange={(event: any) => {
              const selectedValue = event.target.value;
              const selectedOption = publicChannels.find(
                (option: any) => option.value === selectedValue
              );
              setSelectedOption(
                selectedOption || { key: 0, value: "", label: "" }
              );
            }}
            label="Choose a Channel"
            fullWidth
            required
          >
            {publicChannels.map((option: any) => (
              console.log(option),
              <MenuItem key={option.key} value={option.name}>
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
                    {option.name}
                  </Typography>
                </Stack>
              </MenuItem>
            ))}
          </Select>
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

export default JoinPublicForm;

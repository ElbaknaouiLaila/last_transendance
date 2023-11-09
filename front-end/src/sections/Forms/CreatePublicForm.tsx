import { yupResolver } from "@hookform/resolvers/yup";
import { Button, Stack } from "@mui/material";
import { useForm } from "react-hook-form";
import * as Yup from "yup";
import { RHFAutocomplete, RHFTextField } from "../../components/hook-form";
import FormProvider from "../../components/hook-form/FormProvider";
import { showSnackbar } from "../../redux/slices/contact";
import { useAppDispatch, useAppSelector } from "../../redux/store/store";
import axios from "axios";

const CreatePublicForm = ({ handleClose }: any) => {
  const { friends } = useAppSelector(state => state.app);
  const dispatch = useAppDispatch();
  const PublicSchema = Yup.object().shape({
    title: Yup.string().required("Title is Required!!"),
    members: Yup.array().min(3, "Must have at least 3 Members"),
  });

  const defaultValues = {
    title: "",
    members: [],
    type: "public",
  };

  const methods = useForm({
    resolver: yupResolver(PublicSchema),
    defaultValues,
  });

  const {
    reset, // reset the form
    watch, // watch input value by passing the name of it
    setError, // setError by input name
    handleSubmit, // form submit function
    formState: { errors }, // errors and form state
  } = methods; // useful methods from useForm()

  const onSubmit = async (data: any) => {
    try {
      console.log("DATA", data);
      await axios.post("http://localhost:3000/channels/create", data, {
        withCredentials: true,
      });
      dispatch(
        showSnackbar({
          severity: "success",
          message: "New Public Channel has Created",
        })
      );
      // call api
    } catch (error) {
      dispatch(
        showSnackbar({
          severity: "failed",
          message: "Create Public Channel Failed",
        })
      );
      console.log("error", error);
      reset();
    }
  };
  return (
    <FormProvider methods={methods} onSubmit={handleSubmit(onSubmit)}>
      <Stack spacing={3}>
        <RHFTextField name="title" label="Title" />
        <RHFAutocomplete
          name="members"
          label="Members"
          multiple
          freeSolo
          options={friends.map(friend => friend?.name)}
          ChipProps={{ size: "medium" }}
        />
        <Stack
          spacing={2}
          direction={"row"}
          alignContent={"center"}
          justifyContent={"end"}
        >
          <Button onClick={handleClose}>Cancel</Button>
          <Button
            type="submit"
            variant="contained"
            sx={{
              backgroundColor: "#806EA9", // Change the background color to purple
              color: "#C7BBD1", // Change the text color to white
              borderRadius: "21px",
              "&:hover": {
                backgroundColor: "#684C83", // Change the background color on hover
                color: "#C7BBD1",
              },
            }}
          >
            Create Chennel
          </Button>
        </Stack>
      </Stack>
    </FormProvider>
  );
};

export default CreatePublicForm;

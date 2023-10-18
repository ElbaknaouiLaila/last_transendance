import { Dialog, DialogContent, DialogTitle, Slide } from '@mui/material';
import React from 'react';
import JoinTabs from './JoinTabs';
import { TransitionProps } from '@mui/material/transitions';


const Transition = React.forwardRef(function Transition(
    props: TransitionProps & {
        children: React.ReactElement<any, any>;
    },
    ref: React.Ref<unknown>,
) {
    return <Slide direction="up" ref={ref} {...props} />;
});


const JoinChannel = ({ open, handleClose }: unknown) => {
    return (
        <Dialog
            fullWidth
            maxWidth="sm"
            open={open}
            TransitionComponent={Transition}
            keepMounted
            onClose={handleClose}
            sx={{ p: 5 }}
        >
            {/* {console.log(handleClose)} */}
            <DialogTitle sx={{ mb: 4 }}>Join to a New Channel</DialogTitle>
            <DialogContent>
                {/* jellow */}
                <JoinTabs handleClose={handleClose} />
                {/* jellow */}
            </DialogContent>
        </Dialog>
    )
}

export default JoinChannel
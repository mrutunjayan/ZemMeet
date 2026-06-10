import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";

import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import HomeIcon from "@mui/icons-material/Home";
import {
    IconButton,
    Snackbar,
    Alert
} from "@mui/material";

export default function History() {

    const {
        getHistoryOfUser,
        isAuthenticated
    } = useContext(AuthContext);

    const [meetings, setMeetings] = useState([]);
    const [openSnackbar, setOpenSnackbar] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState("");

    const routeTo = useNavigate();

    useEffect(() => {

        if (!isAuthenticated) {
            routeTo("/");
            return;
        }

        const fetchHistory = async () => {
            try {

                const history = await getHistoryOfUser();

                console.log("History Response:", history);

                if (Array.isArray(history)) {
                    setMeetings(history);
                } else {

                    setMeetings([]);

                    setSnackbarMessage(
                        history?.message ||
                        "Unable to load meeting history"
                    );

                    setOpenSnackbar(true);
                }

            } catch (err) {

                console.error(err);

                setMeetings([]);

                setSnackbarMessage(
                    err?.response?.data?.message ||
                    "Failed to fetch meeting history"
                );

                setOpenSnackbar(true);
            }
        };

        fetchHistory();

    }, [isAuthenticated, routeTo, getHistoryOfUser]);

    const handleCloseSnackbar = () => {
        setOpenSnackbar(false);
    };

    const formatDate = (dateString) => {

        if (!dateString) return "N/A";

        const date = new Date(dateString);

        const day = date
            .getDate()
            .toString()
            .padStart(2, "0");

        const month = (date.getMonth() + 1)
            .toString()
            .padStart(2, "0");

        const year = date.getFullYear();

        return `${day}/${month}/${year}`;
    };

    return (
        <div>

           <IconButton
    onClick={() => routeTo("/home")}
    sx={{
        color: "#3498db",
        transition: "all 0.3s ease",
        "&:hover": {
            color: "#e74c3c",
            backgroundColor: "rgba(255, 255, 255, 0.1)",
            transform: "scale(1.1)"
        }
    }}
>
    <HomeIcon />
</IconButton>

            {meetings.length > 0 ? (

                meetings.map((meeting, index) => (

                    <Card
                        key={meeting._id || index}
                        variant="outlined"
                        sx={{ margin: 2 }}
                    >
                        <CardContent>

                            <Typography
                                sx={{ fontSize: 14 }}
                                color="text.secondary"
                                gutterBottom
                            >
                                Code: {meeting.meetingCode}
                            </Typography>

                            <Typography
                                sx={{ mb: 1.5 }}
                                color="text.secondary"
                            >
                                Date: {formatDate(meeting.date)}
                            </Typography>

                        </CardContent>
                    </Card>

                ))

            ) : (

                <Typography
                    sx={{
                        textAlign: "center",
                        mt: 4
                    }}
                >
                    No meeting history found
                </Typography>

            )}

            <Snackbar
                open={openSnackbar}
                autoHideDuration={4000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{
                    vertical: "top",
                    horizontal: "right"
                }}
            >
                <Alert
                    severity="error"
                    onClose={handleCloseSnackbar}
                    sx={{ width: "100%" }}
                >
                    {snackbarMessage}
                </Alert>
            </Snackbar>

        </div>
    );
}
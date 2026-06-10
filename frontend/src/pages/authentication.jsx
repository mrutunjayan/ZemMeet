import * as React from "react";
import Avatar from "@mui/material/Avatar";
import Button from "@mui/material/Button";
import CssBaseline from "@mui/material/CssBaseline";
import TextField from "@mui/material/TextField";
import Paper from "@mui/material/Paper";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import Typography from "@mui/material/Typography";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { AuthContext } from "../contexts/AuthContext";
import { Snackbar, ButtonGroup } from "@mui/material";

const BACKGROUND_IMAGES = [
  "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=1200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1588196749597-9ff075ee6b5b?q=80&w=1200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=1200&auto=format&fit=crop",
];

const darkTheme = createTheme({
  palette: {
    mode: "dark",
    primary: { main: "#ff9839" },
    background: { default: "#07070a", paper: "#0f0f14" },
  },
  components: {
    MuiTextField: {
      styleOverrides: {
        root: {
          "& label.Mui-focused": { color: "#ff9839" },
          "& .MuiOutlinedInput-root": {
            borderRadius: "12px",
            "& fieldset": { borderColor: "rgba(255, 255, 255, 0.12)" },
            "&:hover fieldset": { borderColor: "rgba(255, 255, 255, 0.3)" },
            "&.Mui-focused fieldset": { borderColor: "#ff9839" },
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: "12px",
          textTransform: "none",
          fontWeight: 600,
          transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
        },
      },
    },
  },
});

export default function Authentication() {
  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [name, setName] = React.useState("");
  const [error, setError] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [formState, setFormState] = React.useState(0);
  const [open, setOpen] = React.useState(false);

  const [currentImgIndex, setCurrentImgIndex] = React.useState(0);
  const [fade, setFade] = React.useState(true);

  React.useEffect(() => {
    const intervalId = setInterval(() => {
      setFade(false);

      setTimeout(() => {
        setCurrentImgIndex(
          (prevIndex) => (prevIndex + 1) % BACKGROUND_IMAGES.length,
        );
        setFade(true);
      }, 400);
    }, 5000);

    return () => clearInterval(intervalId);
  }, []);

  const { handleRegister, handleLogin } = React.useContext(AuthContext);

  let handleAuth = async () => {
    try {
      if (formState === 0) {
        await handleLogin(username, password);
      }
      if (formState === 1) {
        let result = await handleRegister(name, username, password);
        setUsername("");
        setPassword("");
        setName("");
        setMessage(result || "Registration Successful!");
        setOpen(true);
        setError("");
        setFormState(0);
      }
    } catch (err) {
      console.log(err);
      let message =
        err.response?.data?.message ||
        "Something went wrong. Please try again.";
      setError(message);
    }
  };

  return (
    <ThemeProvider theme={darkTheme}>
      <Grid
        container
        component="main"
        sx={{ height: "100vh", backgroundColor: "#07070a" }}
      >
        <CssBaseline />

        <Grid
          item
          xs={false}
          sm={4}
          md={7}
          sx={{
            backgroundImage: `url(${BACKGROUND_IMAGES[currentImgIndex]})`,
            backgroundRepeat: "no-repeat",
            backgroundSize: "cover",
            backgroundPosition: "center",
            position: "relative",
            opacity: fade ? 1 : 0.4,
            transition:
              "opacity 0.5s ease-in-out, background-image 0.5s ease-in-out",
            "&::before": {
              content: '""',
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background:
                "linear-gradient(135deg, rgba(255, 152, 57, 0.05) 0%, rgba(7, 7, 10, 0.3) 60%, #07070a 100%)",
              zIndex: 1,
            },
          }}
        />

        <Grid
          item
          xs={12}
          sm={8}
          md={5}
          component={Paper}
          elevation={0}
          square
          sx={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            borderLeft: "1px solid rgba(255, 255, 255, 0.05)",
            background: "#0f0f14",
            zIndex: 2,
          }}
        >
          <Box
            sx={{
              my: 8,
              mx: "auto",
              maxWidth: "420px",
              width: "100%",
              padding: "0 24px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <Avatar
              sx={{
                m: 1,
                background: "linear-gradient(135deg, #ff9839 0%, #ff5216 100%)",
                boxShadow: "0 8px 24px rgba(255, 152, 57, 0.3)",
              }}
            >
              <LockOutlinedIcon />
            </Avatar>

            <ButtonGroup
              variant="outlined"
              sx={{
                mt: 3,
                mb: 4,
                width: "100%",
                backgroundColor: "rgba(255,255,255,0.02)",
                borderRadius: "14px",
                p: "4px",
                border: "1px solid rgba(255,255,255,0.06)",
                "& .MuiButton-root": {
                  border: "none !important",
                  borderRadius: "10px",
                  width: "50%",
                },
              }}
            >
              <Button
                variant={formState === 0 ? "contained" : "text"}
                onClick={() => {
                  setFormState(0);
                  setError("");
                }}
                sx={{
                  color: formState === 0 ? "#fff" : "#94a3b8",
                  background:
                    formState === 0
                      ? "linear-gradient(135deg, #ff9839 0%, #ff5216 100%)"
                      : "transparent",
                  boxShadow:
                    formState === 0
                      ? "0 4px 12px rgba(255, 152, 57, 0.2)"
                      : "none",
                }}
              >
                Sign In
              </Button>
              <Button
                variant={formState === 1 ? "contained" : "text"}
                onClick={() => {
                  setFormState(1);
                  setError("");
                }}
                sx={{
                  color: formState === 1 ? "#fff" : "#94a3b8",
                  background:
                    formState === 1
                      ? "linear-gradient(135deg, #ff9839 0%, #ff5216 100%)"
                      : "transparent",
                  boxShadow:
                    formState === 1
                      ? "0 4px 12px rgba(255, 152, 57, 0.2)"
                      : "none",
                }}
              >
                Sign Up
              </Button>
            </ButtonGroup>

            <Box component="form" noValidate sx={{ mt: 1, width: "100%" }}>
              {formState === 1 && (
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  id="name"
                  label="Full Name"
                  name="name"
                  value={name}
                  autoFocus
                  onChange={(e) => setName(e.target.value)}
                />
              )}

              <TextField
                margin="normal"
                required
                fullWidth
                id="username"
                label="Username"
                name="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />

              <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="Password"
                value={password}
                type="password"
                id="password"
                onChange={(e) => setPassword(e.target.value)}
              />

              {error && (
                <Typography
                  variant="body2"
                  sx={{
                    color: "#ff5252",
                    mt: 1,
                    fontWeight: 500,
                    width: "100%",
                  }}
                >
                  {error}
                </Typography>
              )}

              <Button
                type="button"
                fullWidth
                variant="contained"
                sx={{
                  mt: 4,
                  mb: 2,
                  py: 1.5,
                  fontSize: "1rem",
                  background:
                    "linear-gradient(135deg, #ff9839 0%, #ff5216 100%)",
                  boxShadow: "0 8px 24px rgba(255, 152, 57, 0.2)",
                  "&:hover": {
                    transform: "translateY(-2px)",
                    boxShadow: "0 16px 32px rgba(255, 152, 57, 0.35)",
                    filter: "brightness(1.1)",
                  },
                }}
                onClick={handleAuth}
              >
                {formState === 0 ? "Login" : "Register"}
              </Button>
            </Box>
          </Box>
        </Grid>
      </Grid>

      <Snackbar
        open={open}
        autoHideDuration={4000}
        onClose={() => setOpen(false)}
        message={message}
        sx={{
          "& .MuiSnackbarContent-root": {
            background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
            borderRadius: "12px",
            fontWeight: 600,
          },
        }}
      />
    </ThemeProvider>
  );
}

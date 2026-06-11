import React, { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import {
  Badge,
  IconButton,
  TextField,
  Button,
  Box,
  Typography,
  Grid,
  Paper,
  Divider,
  CssBaseline,
} from "@mui/material";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { useTheme, useMediaQuery } from "@mui/material";
import VideocamIcon from "@mui/icons-material/Videocam";
import VideocamOffIcon from "@mui/icons-material/VideocamOff";
import CallEndIcon from "@mui/icons-material/CallEnd";
import MicIcon from "@mui/icons-material/Mic";
import MicOffIcon from "@mui/icons-material/MicOff";
import ScreenShareIcon from "@mui/icons-material/ScreenShare";
import StopScreenShareIcon from "@mui/icons-material/StopScreenShare";
import ChatIcon from "@mui/icons-material/Chat";
import server from "../environment";

var connections = {};

const peerConfigConnections = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};


const conferenceTheme = createTheme({
  palette: {
    mode: "dark",
    primary: { main: "#ff9839" }, 
    background: { default: "#07070a", paper: "#111116" },
    error: { main: "#ff5252" },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", Arial, sans-serif',
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: "12px", textTransform: "none", fontWeight: 600 },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            borderRadius: "12px",
            backgroundColor: "rgba(255,255,255,0.02)",
          },
        },
      },
    },
  },
});

export default function VideoMeetComponent() {
  var socketRef = useRef();
  let socketIdRef = useRef();
  let localVideoref = useRef();
  const videoRef = useRef([]);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  let [videoAvailable, setVideoAvailable] = useState(true);
  let [audioAvailable, setAudioAvailable] = useState(true);
  let [video, setVideo] = useState(true);
  let [audio, setAudio] = useState(true);
  let [screen, setScreen] = useState(false);
  let [showModal, setModal] = useState(false);
  let [screenAvailable, setScreenAvailable] = useState(false);
  let [messages, setMessages] = useState([]);
  let [message, setMessage] = useState("");
  let [newMessages, setNewMessages] = useState(0);
  let [askForUsername, setAskForUsername] = useState(true);
  let [username, setUsername] = useState("");
  let [videos, setVideos] = useState([]);

  useEffect(() => {
    getPermissions();
  }, []);

  useEffect(() => {
    console.log("video state =", video);
    console.log("audio state =", audio);

    if (video !== undefined && audio !== undefined && !askForUsername) {
      getUserMedia();
    }
  }, [video, audio]);

  useEffect(() => {
    if (screen !== undefined && !askForUsername) {
      getDislayMedia();
    }
  }, [screen]);

  useEffect(() => {
    if (!askForUsername) {
      getUserMedia();
    }
  }, [askForUsername]);

  const getPermissions = async () => {
    try {
      const videoPermission = await navigator.mediaDevices
        .getUserMedia({ video: true })
        .catch(() => null);
      setVideoAvailable(!!videoPermission);

      const audioPermission = await navigator.mediaDevices
        .getUserMedia({ audio: true })
        .catch(() => null);
      setAudioAvailable(!!audioPermission);

      if (navigator.mediaDevices.getDisplayMedia) {
        setScreenAvailable(true);
      }

      const initialStream = await navigator.mediaDevices
        .getUserMedia({
          video: !!videoPermission,
          audio: !!audioPermission,
        })
        .catch((e) => console.log(e));

      if (initialStream) {
        window.localStream = initialStream;
        if (localVideoref.current) {
          localVideoref.current.srcObject = initialStream;
        }
      }
    } catch (error) {
      console.log(error);
    }
  };

  let getDislayMedia = () => {
    if (screen && navigator.mediaDevices.getDisplayMedia) {
      navigator.mediaDevices
        .getDisplayMedia({ video: true, audio: true })
        .then(getDislayMediaSuccess)
        .catch((e) => console.log(e));
    }
  };

  let getMedia = () => {
    if (!videoAvailable) setVideo(false);
    if (!audioAvailable) setAudio(false);

    connectToSocketServer();
  };

  let getUserMediaSuccess = (stream) => {
    try {
      window.localStream.getTracks().forEach((track) => track.stop());
    } catch (e) {
      console.log(e);
    }

    window.localStream = stream;
    if (localVideoref.current) localVideoref.current.srcObject = stream;

    for (let id in connections) {
      if (id === socketIdRef.current) continue;
      connections[id].addStream(window.localStream);
      connections[id].createOffer().then((description) => {
        connections[id]
          .setLocalDescription(description)
          .then(() => {
            socketRef.current.emit(
              "signal",
              id,
              JSON.stringify({ sdp: connections[id].localDescription }),
            );
          })
          .catch((e) => console.log(e));
      });
    }

    stream.getTracks().forEach(
      (track) =>
        (track.onended = () => {
          setVideo(false);
          setAudio(false);
          try {
            localVideoref.current.srcObject
              .getTracks()
              .forEach((t) => t.stop());
          } catch (e) {
            console.log(e);
          }

          let blackSilence = () => new MediaStream([black(), silence()]);
          window.localStream = blackSilence();
          if (localVideoref.current)
            localVideoref.current.srcObject = window.localStream;

          for (let id in connections) {
            connections[id].addStream(window.localStream);
            connections[id].createOffer().then((description) => {
              connections[id]
                .setLocalDescription(description)
                .then(() => {
                  socketRef.current.emit(
                    "signal",
                    id,
                    JSON.stringify({ sdp: connections[id].localDescription }),
                  );
                })
                .catch((e) => console.log(e));
            });
          }
        }),
    );
  };

  let getUserMedia = () => {
    if ((video && videoAvailable) || (audio && audioAvailable)) {
      navigator.mediaDevices
        .getUserMedia({ video: video, audio: audio })
        .then(getUserMediaSuccess)
        .catch((e) => console.log(e));
    } else {
      try {
        localVideoref.current.srcObject
          .getTracks()
          .forEach((track) => track.stop());
      } catch (e) {}
    }
  };

  let getDislayMediaSuccess = (stream) => {
    try {
      window.localStream.getTracks().forEach((track) => track.stop());
    } catch (e) {
      console.log(e);
    }

    window.localStream = stream;
    if (localVideoref.current) localVideoref.current.srcObject = stream;

    for (let id in connections) {
      if (id === socketIdRef.current) continue;
      connections[id].addStream(window.localStream);
      connections[id].createOffer().then((description) => {
        connections[id]
          .setLocalDescription(description)
          .then(() => {
            socketRef.current.emit(
              "signal",
              id,
              JSON.stringify({ sdp: connections[id].localDescription }),
            );
          })
          .catch((e) => console.log(e));
      });
    }

    stream.getTracks().forEach(
      (track) =>
        (track.onended = () => {
          setScreen(false);
          try {
            localVideoref.current.srcObject
              .getTracks()
              .forEach((t) => t.stop());
          } catch (e) {
            console.log(e);
          }
          getUserMedia();
        }),
    );
  };

  let gotMessageFromServer = (fromId, message) => {
    var signal = JSON.parse(message);
    if (fromId !== socketIdRef.current) {
      if (signal.sdp) {
        connections[fromId]
          .setRemoteDescription(new RTCSessionDescription(signal.sdp))
          .then(() => {
            if (signal.sdp.type === "offer") {
              connections[fromId]
                .createAnswer()
                .then((description) => {
                  connections[fromId]
                    .setLocalDescription(description)
                    .then(() => {
                      socketRef.current.emit(
                        "signal",
                        fromId,
                        JSON.stringify({
                          sdp: connections[fromId].localDescription,
                        }),
                      );
                    })
                    .catch((e) => console.log(e));
                })
                .catch((e) => console.log(e));
            }
          })
          .catch((e) => console.log(e));
      }
      if (signal.ice) {
        connections[fromId]
          .addIceCandidate(new RTCIceCandidate(signal.ice))
          .catch((e) => console.log(e));
      }
    }
  };

  const server_url = server;
  let connectToSocketServer = () => {
    socketRef.current = io.connect(server_url, { secure: false });
    socketRef.current.on("signal", gotMessageFromServer);
    socketRef.current.on("connect", () => {
      socketRef.current.emit("join-call", window.location.href);
      socketIdRef.current = socketRef.current.id;
      socketRef.current.on("chat-message", addMessage);

      socketRef.current.on("user-left", (id) => {
        setVideos((videos) => videos.filter((v) => v.socketId !== id));
      });

      socketRef.current.on("user-joined", (id, clients) => {
        clients.forEach((socketListId) => {
          connections[socketListId] = new RTCPeerConnection(
            peerConfigConnections,
          );
          connections[socketListId].onicecandidate = function (event) {
            if (event.candidate != null) {
              socketRef.current.emit(
                "signal",
                socketListId,
                JSON.stringify({ ice: event.candidate }),
              );
            }
          };

          connections[socketListId].onaddstream = (event) => {
            let videoExists = videoRef.current.find(
              (v) => v.socketId === socketListId,
            );
            if (videoExists) {
              setVideos((videos) => {
                const updated = videos.map((v) =>
                  v.socketId === socketListId
                    ? { ...v, stream: event.stream }
                    : v,
                );
                videoRef.current = updated;
                return updated;
              });
            } else {
              let newVideo = {
                socketId: socketListId,
                stream: event.stream,
                autoplay: true,
                playsinline: true,
              };
              setVideos((videos) => {
                const updated = [...videos, newVideo];
                videoRef.current = updated;
                return updated;
              });
            }
          };

          if (window.localStream !== undefined && window.localStream !== null) {
            connections[socketListId].addStream(window.localStream);
          } else {
            let blackSilence = () => new MediaStream([black(), silence()]);
            window.localStream = blackSilence();
            connections[socketListId].addStream(window.localStream);
          }
        });

        if (id === socketIdRef.current) {
          for (let id2 in connections) {
            if (id2 === socketIdRef.current) continue;
            try {
              connections[id2].addStream(window.localStream);
            } catch (e) {}
            connections[id2].createOffer().then((description) => {
              connections[id2]
                .setLocalDescription(description)
                .then(() => {
                  socketRef.current.emit(
                    "signal",
                    id2,
                    JSON.stringify({ sdp: connections[id2].localDescription }),
                  );
                })
                .catch((e) => console.log(e));
            });
          }
        }
      });
    });
  };

  let silence = () => {
    let ctx = new (window.AudioContext || window.webkitAudioContext)();
    let oscillator = ctx.createOscillator();
    let dst = oscillator.connect(ctx.createMediaStreamDestination());
    oscillator.start();
    return Object.assign(dst.stream.getAudioTracks()[0], { enabled: false });
  };

  let black = ({ width = 640, height = 480 } = {}) => {
    let canvas = Object.assign(document.createElement("canvas"), {
      width,
      height,
    });
    canvas.getContext("2d").fillRect(0, 0, width, height);
    let stream = canvas.captureStream();
    return Object.assign(stream.getVideoTracks()[0], { enabled: false });
  };

  let handleVideo = () => {
    const newVideoState = !video;
    setVideo(newVideoState);

    if (localVideoref.current?.srcObject) {
      const videoTrack = localVideoref.current.srcObject.getVideoTracks()[0];

      if (videoTrack) {
        videoTrack.enabled = newVideoState;
      }
    }
  };
  let handleAudio = () => {
    const newAudioState = !audio;
    setAudio(newAudioState);

    if (localVideoref.current?.srcObject) {
      const audioTrack = localVideoref.current.srcObject.getAudioTracks()[0];

      if (audioTrack) {
        audioTrack.enabled = newAudioState;
      }
    }
  };
  let handleScreen = () => setScreen(!screen);

  let handleEndCall = () => {
    try {
      localVideoref.current.srcObject
        .getTracks()
        .forEach((track) => track.stop());
    } catch (e) {}
    window.location.href = "/";
  };

  const addMessage = (data, sender, socketIdSender) => {
    setMessages((prev) => [...prev, { sender: sender, data: data }]);
    if (socketIdSender !== socketIdRef.current) {
      setNewMessages((prev) => prev + 1);
    }
  };

  let sendMessage = () => {
    if (!message.trim()) return;
    socketRef.current.emit("chat-message", message, username);
    setMessage("");
  };

  let connect = () => {
    if (!username.trim()) return;
    setAskForUsername(false);
    getMedia();
  };

  return (
    <ThemeProvider theme={conferenceTheme}>
      <CssBaseline />
      <Box
        sx={{ minHeight: "100vh", backgroundColor: "#07070a", color: "#fff" }}
      >
        {askForUsername === true ? (
          <Grid
            container
            component="main"
            sx={{
              height: "100vh",
              alignItems: "center",
              justifyContent: "center",
              px: 3,
            }}
          >
            <Grid
              item
              xs={12}
              sm={8}
              md={5}
              component={Paper}
              elevation={4}
              sx={{
                p: 4,
                borderRadius: "24px",
                background: "#0f0f14",
                border: "1px solid rgba(255,255,255,0.05)",
                textAlign: "center",
              }}
            >
              <Typography
                variant="h5"
                sx={{ fontWeight: 700, mb: 1, letterSpacing: "-0.5px" }}
              >
                Enter Into The Lobby
              </Typography>
              <Typography variant="body2" sx={{ color: "#94a3b8", mb: 3 }}>
                Ready to join? Check your camera and configure your name.
              </Typography>

              <Box
                sx={{
                  width: "100%",
                  height: "240px",
                  backgroundColor: "#020204",
                  borderRadius: "16px",
                  overflow: "hidden",
                  mb: 3,
                  position: "relative",
                  border: "1px solid rgba(255,255,255,0.03)",
                }}
              >
                <video
                  ref={localVideoref}
                  autoPlay
                  muted
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                ></video>
                <Box
                  sx={{
                    position: "absolute",
                    bottom: 16,
                    left: "50%",
                    transform: "translateX(-50%)",
                    display: "flex",
                    gap: 1.5,
                    background: "rgba(15, 15, 20, 0.75)",
                    backdropFilter: "blur(12px)",
                    px: 2.5,
                    py: 1,
                    borderRadius: "24px",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                  }}
                >
                  <IconButton
                    size="small"
                    onClick={handleVideo}
                    sx={{
                      color: video ? "#ff9839" : "#ff5252",
                      backgroundColor: video
                        ? "rgba(255, 152, 57, 0.08)"
                        : "rgba(255, 82, 82, 0.08)",
                      transition: "all 0.2s ease-in-out",
                      "&:hover": {
                        transform: "scale(1.1)",
                        backgroundColor: video
                          ? "rgba(255, 152, 57, 0.18)"
                          : "rgba(255, 82, 82, 0.18)",
                      },
                    }}
                  >
                    {video ? <VideocamIcon /> : <VideocamOffIcon />}
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={handleAudio}
                    sx={{
                      color: audio ? "#ff9839" : "#ff5252",
                      backgroundColor: audio
                        ? "rgba(255, 152, 57, 0.08)"
                        : "rgba(255, 82, 82, 0.08)",
                      transition: "all 0.2s ease-in-out",
                      "&:hover": {
                        transform: "scale(1.1)",
                        backgroundColor: audio
                          ? "rgba(255, 152, 57, 0.18)"
                          : "rgba(255, 82, 82, 0.18)",
                      },
                    }}
                  >
                    {audio ? <MicIcon /> : <MicOffIcon />}
                  </IconButton>
                </Box>
              </Box>

              <TextField
                fullWidth
                label="What's your name?"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                variant="outlined"
                sx={{ mb: 3 }}
              />
              <Button
                fullWidth
                size="large"
                variant="contained"
                onClick={connect}
                sx={{
                  py: 1.5,
                  fontSize: "1rem",
                  background:
                    "linear-gradient(135deg, #ff9839 0%, #ff5216 100%)",
                  boxShadow: "0 8px 24px rgba(255, 152, 57, 0.2)",
                  transition: "all 0.2s ease",
                  "&:hover": {
                    boxShadow: "0 12px 28px rgba(255, 152, 57, 0.35)",
                    transform: "translateY(-1px)",
                  },
                }}
              >
                Enter Meeting Lobby
              </Button>
            </Grid>
          </Grid>
        ) : (
          <Box
            sx={{
              display: "flex",
              height: "100vh",
              overflow: "hidden",
              position: "relative",
            }}
          >
            <Box
              sx={{
                flexGrow: 1,
                display: "flex",
                flexDirection: "column",
                height: "100%",
                position: "relative",
                p: 2,
              }}
            >
              <Box
                sx={{
                  flexGrow: 1,
                  display: "grid",
                  gap: 2,

                  gridTemplateColumns: isMobile
                    ? "1fr"
                    : videos.length === 0
                      ? "1fr"
                      : "repeat(auto-fit,minmax(320px,1fr))",

                  justifyContent: "center",
                  alignContent: "start",

                  width: "100%",
                  overflowY: "auto",

                  maxHeight: isMobile
                    ? showModal
                      ? "calc(100vh - 50vh)"
                      : "calc(100vh - 120px)"
                    : "calc(100vh - 100px)",
                }}
              >
                <Box
                  sx={{
                    backgroundColor: "#0f0f14",
                    borderRadius: "16px",
                    overflow: "hidden",
                    position: "relative",
                    height: isMobile ? "300px" : "100%",
                    minHeight: isMobile ? "380px" : "300px",
                    border: "1px solid rgba(255,255,255,0.05)",
                    boxShadow: "0 12px 24px rgba(0,0,0,0.3)",
                  }}
                >
                  <video
                    ref={localVideoref}
                    autoPlay
                    muted
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  ></video>
                  <Typography
                    variant="caption"
                    sx={{
                      position: "absolute",
                      bottom: 12,
                      left: 12,
                      background: "rgba(0,0,0,0.6)",
                      px: 1.5,
                      py: 0.5,
                      borderRadius: "6px",
                      fontWeight: 600,
                    }}
                  >
                    You ({username})
                  </Typography>
                </Box>

                {videos.map((videoItem) => (
                  <Box
                    key={videoItem.socketId}
                    sx={{
                      backgroundColor: "#0f0f14",
                      borderRadius: "16px",
                      overflow: "hidden",
                      position: "relative",
                      border: "1px solid rgba(255,255,255,0.05)",
                      height: isMobile ? "220px" : "100%",
                      minHeight: isMobile ? "220px" : "300px",
                    }}
                  >
                    <video
                      data-socket={videoItem.socketId}
                      ref={(ref) => {
                        if (ref && videoItem.stream)
                          ref.srcObject = videoItem.stream;
                      }}
                      autoPlay
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    ></video>
                    <Typography
                      variant="caption"
                      sx={{
                        position: "absolute",
                        bottom: 12,
                        left: 12,
                        background: "rgba(0,0,0,0.6)",
                        px: 1.5,
                        py: 0.5,
                        borderRadius: "6px",
                      }}
                    >
                      Participant ({videoItem.socketId.substring(0, 5)})
                    </Typography>
                  </Box>
                ))}
              </Box>

              <Box
                sx={{
                  position: "fixed",
                  bottom: 10,
                  left: "50%",
                  transform: "translateX(-50%)",

                  zIndex: 3000,

                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",

                  gap: isMobile ? 1.5 : 2,

                  background: "rgba(10, 10, 15, 0.85)",
                  backdropFilter: "blur(20px)",

                  borderRadius: "28px",

                  px: isMobile ? 2 : 4,
                  py: 1.0,

                  border: "1px solid rgba(255,255,255,0.08)",
                  boxShadow: "0 24px 48px rgba(0,0,0,0.5)",
                }}
              >
                <IconButton
                  onClick={handleVideo}
                  sx={{
                    p: 1.5,
                    backgroundColor: video
                      ? "rgba(255,255,255,0.03)"
                      : "#e53935",
                    color: "#fff",
                    border: "1px solid",
                    borderColor: video
                      ? "rgba(255,255,255,0.08)"
                      : "transparent",
                    transition: "all 0.2s ease-in-out",
                    "&:hover": {
                      transform: "scale(1.06)",
                      backgroundColor: video
                        ? "rgba(255,255,255,0.08)"
                        : "#d32f2f",
                      boxShadow: video
                        ? "none"
                        : "0 4px 12px rgba(229, 57, 53, 0.4)",
                    },
                  }}
                >
                  {video ? <VideocamIcon /> : <VideocamOffIcon />}
                </IconButton>

                <IconButton
                  onClick={handleAudio}
                  sx={{
                    p: 1.5,
                    backgroundColor: audio
                      ? "rgba(255,255,255,0.03)"
                      : "#e53935",
                    color: "#fff",
                    border: "1px solid",
                    borderColor: audio
                      ? "rgba(255,255,255,0.08)"
                      : "transparent",
                    transition: "all 0.2s ease-in-out",
                    "&:hover": {
                      transform: "scale(1.06)",
                      backgroundColor: audio
                        ? "rgba(255,255,255,0.08)"
                        : "#d32f2f",
                      boxShadow: audio
                        ? "none"
                        : "0 4px 12px rgba(229, 57, 53, 0.4)",
                    },
                  }}
                >
                  {audio ? <MicIcon /> : <MicOffIcon />}
                </IconButton>

                {screenAvailable && (
                  <IconButton
                    onClick={handleScreen}
                    sx={{
                      p: 1.5,
                      background: screen
                        ? "linear-gradient(135deg, #ff9839 0%, #ff5216 100%)"
                        : "rgba(255,255,255,0.03)",
                      color: "#fff",
                      border: "1px solid",
                      borderColor: screen
                        ? "transparent"
                        : "rgba(255,255,255,0.08)",
                      transition: "all 0.2s ease-in-out",
                      "&:hover": {
                        transform: "scale(1.06)",
                        background: screen
                          ? "linear-gradient(135deg, #ffa751 0%, #ff6226 100%)"
                          : "rgba(255,255,255,0.08)",
                        boxShadow: screen
                          ? "0 4px 14px rgba(255, 152, 57, 0.3)"
                          : "none",
                      },
                    }}
                  >
                    {screen ? <StopScreenShareIcon /> : <ScreenShareIcon />}
                  </IconButton>
                )}

                <Badge
                  badgeContent={newMessages}
                  color="primary"
                  sx={{
                    "& .MuiBadge-badge": {
                      background:
                        "linear-gradient(135deg, #ff9839 0%, #ff5216 100%)",
                      fontWeight: 700,
                    },
                  }}
                >
                  <IconButton
                    onClick={() => {
                      setModal(!showModal);
                      setNewMessages(0);
                    }}
                    sx={{
                      p: 1.5,
                      backgroundColor: showModal
                        ? "rgba(255, 152, 57, 0.15)"
                        : "rgba(255,255,255,0.03)",
                      color: showModal ? "#ff9839" : "#fff",
                      border: "1px solid",
                      borderColor: showModal
                        ? "rgba(255, 152, 57, 0.3)"
                        : "rgba(255,255,255,0.08)",
                      transition: "all 0.2s ease-in-out",
                      "&:hover": {
                        transform: "scale(1.06)",
                        backgroundColor: showModal
                          ? "rgba(255, 152, 57, 0.2)"
                          : "rgba(255,255,255,0.08)",
                      },
                    }}
                  >
                    <ChatIcon />
                  </IconButton>
                </Badge>

                <IconButton
                  onClick={handleEndCall}
                  sx={{
                    p: 1.5,
                    backgroundColor: "#d32f2f",
                    color: "#fff",
                    transition: "all 0.2s ease-in-out",
                    "&:hover": {
                      transform: "scale(1.08)",
                      backgroundColor: "#b71c1c",
                      boxShadow: "0 4px 20px rgba(211, 47, 47, 0.5)",
                    },
                  }}
                >
                  <CallEndIcon />
                </IconButton>
              </Box>
            </Box>

            {showModal && (
              <Paper
                sx={{
                  borderLeft: "1px solid rgba(255,255,255,0.06)",
                  display: "flex",
                  flexDirection: "column",
                  background: "#0f0f14",

                  position: isMobile ? "fixed" : "relative",

                  width: isMobile ? "100%" : "360px",

                  height: isMobile ? "38vh" : "100%",

                  bottom: isMobile ? "85px" : 0,
                  right: 0,

                  zIndex: 1500,

                  borderRadius: isMobile ? "20px 20px 0 0" : 0,
                }}
              >
                <Box
                  sx={{
                    p: 2.5,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 700,
                      fontSize: "1.1rem",
                    }}
                  >
                    Group Chat
                  </Typography>
                </Box>

                <Divider sx={{ borderColor: "rgba(255,255,255,0.05)" }} />

                <Box
                  sx={{
                    flexGrow: 1,
                    overflowY: "auto",
                    p: 2,

                    display: "flex",
                    flexDirection: "column",
                    gap: 2,

                    maxHeight: isMobile
                      ? "calc(55vh - 130px)"
                      : "calc(100vh - 140px)",
                  }}
                >
                  {messages.length !== 0 ? (
                    messages.map((item, index) => {
                      const isSelf = item.sender === username;

                      return (
                        <Box
                          key={index}
                          sx={{
                            alignSelf: isSelf ? "flex-end" : "flex-start",
                            maxWidth: "85%",
                          }}
                        >
                          <Typography
                            variant="caption"
                            sx={{
                              color: "#94a3b8",
                              display: "block",
                              mb: 0.5,
                              textAlign: isSelf ? "right" : "left",
                              px: 0.5,
                            }}
                          >
                            {item.sender}
                          </Typography>

                          <Box
                            sx={{
                              p: 1.5,
                              borderRadius: isSelf
                                ? "16px 16px 4px 16px"
                                : "16px 16px 16px 4px",

                              background: isSelf
                                ? "linear-gradient(135deg,#ff9839 0%,#ff5216 100%)"
                                : "rgba(255,255,255,0.05)",

                              color: "#fff",
                            }}
                          >
                            <Typography variant="body2">{item.data}</Typography>
                          </Box>
                        </Box>
                      );
                    })
                  ) : (
                    <Box
                      sx={{
                        my: "auto",
                        textAlign: "center",
                        color: "#64748b",
                      }}
                    >
                      <ChatIcon
                        sx={{
                          fontSize: "3rem",
                          mb: 1,
                          opacity: 0.3,
                        }}
                      />

                      <Typography variant="body2">
                        No messages yet. Start the conversation!
                      </Typography>
                    </Box>
                  )}
                </Box>

                <Box
                  sx={{
                    p: 2,
                    borderTop: "1px solid rgba(255,255,255,0.05)",
                    backgroundColor: "#0b0b0f",
                  }}
                >
                  <Box sx={{ display: "flex", gap: 1 }}>
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="Type a message..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") sendMessage();
                      }}
                    />

                    <Button
                      variant="contained"
                      onClick={sendMessage}
                      sx={{
                        px: 2.5,
                        background:
                          "linear-gradient(135deg,#ff9839 0%,#ff5216 100%)",
                        "&:hover": {
                          background:
                            "linear-gradient(135deg,#ffa751 0%,#ff6226 100%)",
                        },
                      }}
                    >
                      Send
                    </Button>
                  </Box>
                </Box>
              </Paper>
            )}
          </Box>
        )}
      </Box>
    </ThemeProvider>
  );
}

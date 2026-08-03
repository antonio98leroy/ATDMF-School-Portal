import { useEffect, useState } from "react";

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  CircularProgress,
  FormControlLabel,
  IconButton,
  InputAdornment,
  TextField,
  Typography,
} from "@mui/material";

import {
  ArrowBack,
  Visibility,
  VisibilityOff,
} from "@mui/icons-material";

import { useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";


const REMEMBERED_USERNAME_KEY =
  "atdmf_remembered_username";


export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [username, setUsername] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [error, setError] =
    useState("");

  const [busy, setBusy] =
    useState(false);

  const [showPassword, setShowPassword] =
    useState(false);

  const [rememberUsername, setRememberUsername] =
    useState(false);


  useEffect(() => {
    const savedUsername =
      localStorage.getItem(
        REMEMBERED_USERNAME_KEY
      );

    if (savedUsername) {
      setUsername(savedUsername);
      setRememberUsername(true);
    }
  }, []);


  const submit = async (event) => {
    event.preventDefault();
    setError("");

    const cleanUsername =
      username.trim();

    if (!cleanUsername || !password) {
      setError(
        "Please enter your username and password."
      );
      return;
    }

    setBusy(true);

    try {
      if (rememberUsername) {
        localStorage.setItem(
          REMEMBERED_USERNAME_KEY,
          cleanUsername
        );
      } else {
        localStorage.removeItem(
          REMEMBERED_USERNAME_KEY
        );
      }

      await login(
        cleanUsername,
        password
      );
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Invalid username or password."
      );
    } finally {
      setBusy(false);
    }
  };


  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        position: "relative",
        px: 2,
        py: 4,
        overflow: "hidden",
        backgroundImage:
          "linear-gradient(110deg, rgba(7,27,84,.96), rgba(7,27,84,.68), rgba(200,16,46,.36)), url('/atdmf-science.jpeg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: {
          xs: "scroll",
          md: "fixed",
        },
      }}
    >
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(circle at top right, rgba(255,255,255,.12), transparent 35%)",
          pointerEvents: "none",
        }}
      />

      <Card
        elevation={24}
        sx={{
          width: "100%",
          maxWidth: 480,
          borderRadius: 4,
          bgcolor:
            "rgba(255,255,255,.97)",
          backdropFilter: "blur(14px)",
          border:
            "1px solid rgba(255,255,255,.55)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            height: 8,
            background:
              "linear-gradient(90deg, #071B54 0 65%, #C8102E 65%)",
          }}
        />

        <CardContent
          sx={{
            p: {
              xs: 3,
              sm: 5,
            },
          }}
        >
          <Box
            sx={{
              textAlign: "center",
              mb: 3,
            }}
          >
            <Box
              component="img"
              src="/atdmf-seal.jpeg"
              alt="Annie T. Doe Memorial Academy seal"
              sx={{
                width: 122,
                height: 122,
                objectFit: "contain",
                borderRadius: "50%",
                bgcolor: "#fff",
                mb: 1.5,
                boxShadow:
                  "0 10px 30px rgba(7,27,84,.18)",
              }}
            />

            <Typography
              variant="h5"
              sx={{
                fontWeight: 950,
                color: "#071B54",
                lineHeight: 1.2,
              }}
            >
              Annie T. Doe Memorial Academy
            </Typography>

            <Typography
              variant="body2"
              sx={{
                mt: 1,
                color: "text.secondary",
                fontWeight: 600,
              }}
            >
              Lower Buchanan, Grand Bassa County, Liberia
            </Typography>

            <Typography
              sx={{
                mt: 1,
                color: "#C8102E",
                fontWeight: 900,
              }}
            >
              School Management Information System
            </Typography>
          </Box>

          <Typography
            variant="h6"
            textAlign="center"
            fontWeight={900}
            color="#071B54"
          >
            Sign in to your account
          </Typography>

          <Typography
            variant="body2"
            textAlign="center"
            color="text.secondary"
            sx={{ mt: 0.5, mb: 2 }}
          >
            Enter your authorized account credentials.
          </Typography>

          {error && (
            <Alert
              severity="error"
              sx={{
                mb: 2,
                textAlign: "left",
              }}
            >
              {error}
            </Alert>
          )}

          <Box
            component="form"
            onSubmit={submit}
            noValidate
          >
            <TextField
              fullWidth
              required
              autoFocus
              label="Username"
              autoComplete="username"
              margin="normal"
              value={username}
              disabled={busy}
              onChange={(event) =>
                setUsername(
                  event.target.value
                )
              }
            />

            <TextField
              fullWidth
              required
              label="Password"
              type={
                showPassword
                  ? "text"
                  : "password"
              }
              autoComplete="current-password"
              margin="normal"
              value={password}
              disabled={busy}
              onChange={(event) =>
                setPassword(
                  event.target.value
                )
              }
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        edge="end"
                        aria-label={
                          showPassword
                            ? "Hide password"
                            : "Show password"
                        }
                        disabled={busy}
                        onClick={() =>
                          setShowPassword(
                            (current) =>
                              !current
                          )
                        }
                      >
                        {showPassword ? (
                          <VisibilityOff />
                        ) : (
                          <Visibility />
                        )}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />

            <FormControlLabel
              sx={{
                display: "flex",
                mt: 0.5,
                color: "text.secondary",
              }}
              control={
                <Checkbox
                  checked={rememberUsername}
                  disabled={busy}
                  onChange={(event) =>
                    setRememberUsername(
                      event.target.checked
                    )
                  }
                />
              }
              label="Remember my username"
            />

            <Button
              fullWidth
              type="submit"
              variant="contained"
              size="large"
              disabled={busy}
              sx={{
                mt: 2,
                py: 1.35,
                bgcolor: "#071B54",
                fontWeight: 900,
                textTransform: "none",
                "&:hover": {
                  bgcolor: "#0B2A78",
                },
              }}
            >
              {busy ? (
                <CircularProgress
                  size={24}
                  color="inherit"
                />
              ) : (
                "Sign In"
              )}
            </Button>

            <Button
              fullWidth
              type="button"
              variant="outlined"
              size="large"
              startIcon={<ArrowBack />}
              onClick={() =>
                navigate("/welcome")
              }
              disabled={busy}
              sx={{
                mt: 1.5,
                py: 1.25,
                borderWidth: 1.5,
                borderColor: "#0B2A78",
                color: "#0B2A78",
                fontWeight: 800,
                textTransform: "none",
                "&:hover": {
                  borderWidth: 1.5,
                  borderColor: "#071B54",
                  bgcolor:
                    "rgba(11,42,120,.06)",
                },
              }}
            >
              Back to Welcome Page
            </Button>
          </Box>

          <Box
            sx={{
              mt: 4,
              pt: 2,
              borderTop:
                "1px solid rgba(15,23,42,.1)",
              textAlign: "center",
            }}
          >
            <Typography
              variant="caption"
              color="text.secondary"
              display="block"
            >
              Authorized users only
            </Typography>

            <Typography
              variant="caption"
              color="text.secondary"
              display="block"
              sx={{ mt: 0.5 }}
            >
              © {new Date().getFullYear()} Annie T. Doe Memorial Academy
            </Typography>

            <Typography
              variant="caption"
              display="block"
              sx={{
                mt: 0.5,
                color: "#071B54",
                fontWeight: 700,
              }}
            >
              Powered by Prime Tech Enterprise LLC
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
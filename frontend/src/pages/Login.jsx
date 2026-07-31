import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  TextField,
  Typography,
} from "@mui/material";
import { LockOutlined } from "@mui/icons-material";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!username.trim() || !password) {
      setError("Please enter your username and password.");
      return;
    }

    setSubmitting(true);

    try {
      await login(username.trim(), password);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Invalid username or password. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        px: 2,
        py: 4,
        background:
          "linear-gradient(135deg, #071B54 0%, #0B2A78 55%, #C8102E 100%)",
      }}
    >
      <Card
        elevation={18}
        sx={{
          width: "100%",
          maxWidth: 460,
          borderRadius: 4,
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            height: 8,
            background:
              "linear-gradient(90deg, #0B2A78 0%, #0B2A78 55%, #C8102E 55%, #C8102E 100%)",
          }}
        />

        <CardContent sx={{ p: { xs: 3, sm: 5 } }}>
          <Box sx={{ textAlign: "center", mb: 3 }}>
            <Box
              component="img"
              src="/atdmf-logo.jpeg"
              alt="Annie T. Doe Memorial Foundation logo"
              sx={{
                width: 150,
                height: 150,
                objectFit: "contain",
                mb: 1.5,
              }}
            />

            <Typography
              variant="h5"
              sx={{
                fontWeight: 800,
                color: "#0B2A78",
                lineHeight: 1.25,
              }}
            >
              Annie T. Doe Memorial Foundation High School
            </Typography>

            <Typography
              variant="body1"
              sx={{
                mt: 1,
                color: "#C8102E",
                fontWeight: 700,
              }}
            >
              School Management Information System
            </Typography>
          </Box>

          <Divider sx={{ mb: 3 }} />

          <Box sx={{ textAlign: "center", mb: 2 }}>
            <LockOutlined
              sx={{
                color: "#0B2A78",
                fontSize: 34,
              }}
            />

            <Typography variant="h6" fontWeight={700}>
              Sign in to your account
            </Typography>

            <Typography variant="body2" color="text.secondary">
              Enter your school portal credentials
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} noValidate>
            <TextField
              fullWidth
              required
              autoFocus
              label="Username"
              autoComplete="username"
              margin="normal"
              value={username}
              disabled={submitting}
              onChange={(event) => setUsername(event.target.value)}
            />

            <TextField
              fullWidth
              required
              type="password"
              label="Password"
              autoComplete="current-password"
              margin="normal"
              value={password}
              disabled={submitting}
              onChange={(event) => setPassword(event.target.value)}
            />

            <Button
              fullWidth
              type="submit"
              variant="contained"
              size="large"
              disabled={submitting}
              sx={{
                mt: 3,
                py: 1.4,
                bgcolor: "#0B2A78",
                fontWeight: 700,
                "&:hover": {
                  bgcolor: "#071B54",
                },
              }}
            >
              {submitting ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                "Sign In"
              )}
            </Button>
          </Box>

          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              display: "block",
              textAlign: "center",
              mt: 4,
            }}
          >
            © {new Date().getFullYear()} Annie T. Doe Memorial Foundation
          </Typography>

          <Typography
            variant="caption"
            sx={{
              display: "block",
              textAlign: "center",
              color: "#0B2A78",
              mt: 0.5,
            }}
          >
            Powered by Prime Tech Enterprise LLC
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}

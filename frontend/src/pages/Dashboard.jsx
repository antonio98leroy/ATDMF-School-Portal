import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Grid,
  Paper,
  Stack,
  Typography,
} from "@mui/material";

import {
  Add,
  Campaign,
  Groups,
  MenuBook,
  Payments,
  School,
} from "@mui/icons-material";

import { useNavigate } from "react-router-dom";
import api from "../api/client";

const defaultStatistics = {
  students: 0,
  staff: 0,
  classes: 0,
  fees: 0,
};

export default function Dashboard() {
  const navigate = useNavigate();

  const [statistics, setStatistics] =
    useState(defaultStatistics);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const response = await api.get(
          "/academics/dashboard/"
        );

        setStatistics({
          ...defaultStatistics,
          ...response.data,
        });
      } catch {
        setError(
          "Some dashboard information could not be loaded."
        );
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  const cards = [
    {
      label: "Total Students",
      value:
        statistics.students ??
        statistics.total_students ??
        0,
      icon: <School />,
      path: "/students",
    },
    {
      label: "Total Staff",
      value:
        statistics.staff ??
        statistics.total_staff ??
        0,
      icon: <Groups />,
      path: "/staff",
    },
    {
      label: "Classes",
      value:
        statistics.classes ??
        statistics.total_classes ??
        0,
      icon: <MenuBook />,
      path: "/academics",
    },
    {
      label: "Fees Collected",
      value: `$${Number(
        statistics.fees ??
          statistics.fees_collected ??
          0
      ).toFixed(2)}`,
      icon: <Payments />,
      path: "/finance",
    },
  ];

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: 350,
          display: "grid",
          placeItems: "center",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box
        sx={{
          mb: 3,
          display: "flex",
          justifyContent: "space-between",
          alignItems: {
            xs: "flex-start",
            sm: "center",
          },
          flexDirection: {
            xs: "column",
            sm: "row",
          },
          gap: 2,
        }}
      >
        <Box>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 800,
              color: "#0B2A78",
            }}
          >
            Dashboard
          </Typography>

          <Typography color="text.secondary">
            Welcome to the ATDMF School Management Portal.
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => navigate("/students")}
          sx={{
            bgcolor: "#C8102E",
            "&:hover": {
              bgcolor: "#9D0C24",
            },
          }}
        >
          Register Student
        </Button>
      </Box>

      {error && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {cards.map((card) => (
          <Grid
            item
            xs={12}
            sm={6}
            lg={3}
            key={card.label}
          >
            <Paper
              onClick={() => navigate(card.path)}
              sx={{
                p: 3,
                cursor: "pointer",
                borderRadius: 3,
                border: "1px solid #E5E7EB",
                transition: "0.2s",
                "&:hover": {
                  transform: "translateY(-3px)",
                  boxShadow: 4,
                },
              }}
            >
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
              >
                <Box>
                  <Typography color="text.secondary">
                    {card.label}
                  </Typography>

                  <Typography
                    variant="h4"
                    sx={{
                      fontWeight: 800,
                      mt: 1,
                      color: "#0B2A78",
                    }}
                  >
                    {card.value}
                  </Typography>
                </Box>

                <Box
                  sx={{
                    width: 54,
                    height: 54,
                    borderRadius: 3,
                    display: "grid",
                    placeItems: "center",
                    color: "white",
                    bgcolor: "#0B2A78",
                  }}
                >
                  {card.icon}
                </Box>
              </Stack>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3} sx={{ mt: 0 }}>
        <Grid item xs={12} lg={8}>
          <Paper
            sx={{
              p: 3,
              minHeight: 300,
              borderRadius: 3,
              border: "1px solid #E5E7EB",
            }}
          >
            <Typography variant="h6" fontWeight={800}>
              Enrollment Overview
            </Typography>

            <Typography
              color="text.secondary"
              sx={{ mt: 1 }}
            >
              Enrollment charts will appear here when class
              enrollment data is connected.
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} lg={4}>
          <Paper
            sx={{
              p: 3,
              minHeight: 300,
              borderRadius: 3,
              border: "1px solid #E5E7EB",
            }}
          >
            <Stack
              direction="row"
              alignItems="center"
              spacing={1}
            >
              <Campaign sx={{ color: "#C8102E" }} />

              <Typography variant="h6" fontWeight={800}>
                Recent Notices
              </Typography>
            </Stack>

            <Typography
              color="text.secondary"
              sx={{ mt: 2 }}
            >
              No recent notices available.
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      <Paper
        sx={{
          mt: 3,
          p: 3,
          borderRadius: 3,
          border: "1px solid #E5E7EB",
        }}
      >
        <Typography variant="h6" fontWeight={800} mb={2}>
          Quick Actions
        </Typography>

        <Stack
          direction={{
            xs: "column",
            sm: "row",
          }}
          spacing={2}
          flexWrap="wrap"
        >
          <Button
            variant="contained"
            startIcon={<School />}
            onClick={() => navigate("/students")}
          >
            Manage Students
          </Button>

          <Button
            variant="outlined"
            startIcon={<Groups />}
            onClick={() => navigate("/staff")}
          >
            Manage Staff
          </Button>

          <Button
            variant="outlined"
            startIcon={<MenuBook />}
            onClick={() => navigate("/academics")}
          >
            Manage Academics
          </Button>

          <Button
            variant="outlined"
            startIcon={<Payments />}
            onClick={() => navigate("/finance")}
          >
            Record Payment
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
}

import { useEffect, useState } from "react";
import {
  Alert, Box, Button, CircularProgress, Grid, Paper, Stack, Typography,
} from "@mui/material";
import {
  Add, Assignment, HealthAndSafety, Inventory2, LocalHospital,
  Medication, MonitorHeart, Person,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { clinicApi } from "../../api/clinic/clinicApi";

export default function ClinicDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    clinicApi.getDashboard()
      .then((response) => setData(response.data))
      .catch((requestError) => {
        setError(
          requestError?.response?.data?.detail ||
          "Unable to load the clinic dashboard."
        );
      });
  }, []);

  if (!data && !error) {
    return (
      <Box sx={{ minHeight: 360, display: "grid", placeItems: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Stack
        direction={{ xs: "column", md: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "stretch", md: "center" }}
        gap={2}
        mb={3}
      >
        <Box>
          <Typography variant="h4" fontWeight={950} color="#071B54">
            School Health Clinic
          </Typography>
          <Typography color="text.secondary">
            Student and staff clinic visits, treatment, health assessments,
            referrals and medicine inventory.
          </Typography>
        </Box>

        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
          <Button
            variant="outlined"
            startIcon={<Assignment />}
            onClick={() => navigate("/clinic/health-records")}
          >
            Health Records
          </Button>

          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => navigate("/clinic/visits/new")}
            sx={{ bgcolor: "#071B54", fontWeight: 900 }}
          >
            New Clinic Visit
          </Button>
        </Stack>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {data && (
        <>
          <Grid container spacing={3}>
            <MetricCard icon={<LocalHospital />} label="Visits Today" value={data.visits_today} />
            <MetricCard icon={<Person />} label="Student Visits" value={data.student_visits_today} />
            <MetricCard icon={<HealthAndSafety />} label="Staff Visits" value={data.staff_visits_today} />
            <MetricCard icon={<MonitorHeart />} label="Monthly Referrals" value={data.referrals_this_month} />
            <MetricCard icon={<Medication />} label="Low Stock Medicines" value={data.low_stock_medicines} />
            <MetricCard icon={<Inventory2 />} label="Pending Follow-Ups" value={data.follow_ups_pending} />
          </Grid>

          <Grid container spacing={3} mt={0}>
            <Grid size={{ xs: 12, lg: 7 }}>
              <Paper variant="outlined" sx={{ mt: 3, p: 3, borderRadius: 3, height: "100%" }}>
                <Typography variant="h6" fontWeight={900}>
                  Common Reasons This Month
                </Typography>

                <Stack spacing={1.2} mt={2}>
                  {data.monthly_reasons?.map((item) => (
                    <Stack key={item.reason} direction="row" justifyContent="space-between">
                      <Typography>{item.reason}</Typography>
                      <Typography fontWeight={900}>{item.total}</Typography>
                    </Stack>
                  ))}

                  {!data.monthly_reasons?.length && (
                    <Typography color="text.secondary">
                      No clinic visits have been recorded this month.
                    </Typography>
                  )}
                </Stack>
              </Paper>
            </Grid>

            <Grid size={{ xs: 12, lg: 5 }}>
              <Paper variant="outlined" sx={{ mt: 3, p: 3, borderRadius: 3, height: "100%" }}>
                <Typography variant="h6" fontWeight={900}>Quick Access</Typography>

                <Stack spacing={1.3} mt={2}>
                  <Button variant="outlined" startIcon={<LocalHospital />} onClick={() => navigate("/clinic/visits")}>
                    View Clinic Visits
                  </Button>
                  <Button variant="outlined" startIcon={<Medication />} onClick={() => navigate("/clinic/medicines")}>
                    Medicine Inventory
                  </Button>
                  <Button variant="outlined" startIcon={<MonitorHeart />} onClick={() => navigate("/clinic/referrals")}>
                    Referrals
                  </Button>
                </Stack>
              </Paper>
            </Grid>
          </Grid>
        </>
      )}
    </Box>
  );
}

function MetricCard({ icon, label, value }) {
  return (
    <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
      <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, height: "100%" }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <Box sx={{
            width: 52, height: 52, display: "grid", placeItems: "center",
            borderRadius: 2, bgcolor: "#EEF4FF", color: "#071B54",
          }}>
            {icon}
          </Box>
          <Box>
            <Typography color="text.secondary">{label}</Typography>
            <Typography variant="h4" fontWeight={950} color="#071B54">
              {value ?? 0}
            </Typography>
          </Box>
        </Stack>
      </Paper>
    </Grid>
  );
}

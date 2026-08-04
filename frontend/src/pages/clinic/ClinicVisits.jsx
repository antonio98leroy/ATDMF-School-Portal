import { useEffect, useMemo, useState } from "react";
import {
  Alert, Box, Button, Chip, CircularProgress, Paper, Stack, TextField, Typography,
} from "@mui/material";
import { Add, Refresh } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { clinicApi } from "../../api/clinic/clinicApi";

export default function ClinicVisits() {
  const navigate = useNavigate();
  const [records, setRecords] = useState([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    setError("");
    clinicApi.getVisits({ page_size: 200 })
      .then((response) => {
        const payload = response.data;
        setRecords(Array.isArray(payload) ? payload : payload.results || []);
      })
      .catch((requestError) => {
        setError(
          requestError?.response?.data?.detail ||
          "Unable to load clinic visits."
        );
      })
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const visibleRecords = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return records;
    return records.filter((item) =>
      [
        item.patient_name, item.reason_display, item.reason,
        item.outcome_display, item.outcome, item.visit_date,
      ].filter(Boolean).join(" ").toLowerCase().includes(q)
    );
  }, [records, search]);

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
            Clinic Visits
          </Typography>
          <Typography color="text.secondary">
            Review student and staff clinic visits and treatment outcomes.
          </Typography>
        </Box>

        <Stack direction="row" spacing={1.5}>
          <Button variant="outlined" startIcon={<Refresh />} onClick={load}>
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => navigate("/clinic/visits/new")}
            sx={{ bgcolor: "#071B54", fontWeight: 900 }}
          >
            New Visit
          </Button>
        </Stack>
      </Stack>

      <TextField
        fullWidth
        label="Search clinic visits"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        sx={{ mb: 3 }}
      />

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {loading ? (
        <Box sx={{ minHeight: 300, display: "grid", placeItems: "center" }}>
          <CircularProgress />
        </Box>
      ) : (
        <Paper variant="outlined" sx={{ borderRadius: 3, overflow: "hidden" }}>
          <Box sx={{ overflowX: "auto" }}>
            <Box component="table" sx={{ width: "100%", borderCollapse: "collapse" }}>
              <Box component="thead" sx={{ bgcolor: "#EEF4FF" }}>
                <Box component="tr">
                  {["Patient", "Type", "Date", "Reason", "Outcome", "Parent Contact"].map((heading) => (
                    <Box key={heading} component="th" sx={{ p: 2, textAlign: "left", color: "#071B54" }}>
                      {heading}
                    </Box>
                  ))}
                </Box>
              </Box>

              <Box component="tbody">
                {visibleRecords.map((item) => (
                  <Box component="tr" key={item.id} sx={{ borderTop: "1px solid #E6ECF4" }}>
                    <Box component="td" sx={{ p: 2, fontWeight: 800 }}>{item.patient_name}</Box>
                    <Box component="td" sx={{ p: 2 }}>
                      <Chip
                        size="small"
                        label={item.patient_type}
                        color={item.patient_type === "STUDENT" ? "primary" : "secondary"}
                        variant="outlined"
                      />
                    </Box>
                    <Box component="td" sx={{ p: 2 }}>{item.visit_date}</Box>
                    <Box component="td" sx={{ p: 2 }}>{item.reason_display || item.reason}</Box>
                    <Box component="td" sx={{ p: 2 }}>{item.outcome_display || item.outcome}</Box>
                    <Box component="td" sx={{ p: 2 }}>{item.parent_guardian_contacted ? "Yes" : "No"}</Box>
                  </Box>
                ))}

                {!visibleRecords.length && (
                  <Box component="tr">
                    <Box component="td" colSpan={6} sx={{ p: 4, textAlign: "center", color: "text.secondary" }}>
                      No clinic visits found.
                    </Box>
                  </Box>
                )}
              </Box>
            </Box>
          </Box>
        </Paper>
      )}
    </Box>
  );
}

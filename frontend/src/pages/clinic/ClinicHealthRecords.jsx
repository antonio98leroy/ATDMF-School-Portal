import { useEffect, useMemo, useState } from "react";
import { Alert, Box, CircularProgress, Paper, Stack, TextField, Typography } from "@mui/material";
import { clinicApi } from "../../api/clinic/clinicApi";

export default function ClinicHealthRecords() {
  const [records, setRecords] = useState([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    clinicApi.getProfiles({ page_size: 500 })
      .then((response) => {
        const payload = response.data;
        setRecords(Array.isArray(payload) ? payload : payload.results || []);
      })
      .catch((requestError) => {
        setError(requestError?.response?.data?.detail || "Unable to load records.");
      })
      .finally(() => setLoading(false));
  }, []);

  const visibleRecords = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return records;
    return records.filter((item) => JSON.stringify(item).toLowerCase().includes(q));
  }, [records, search]);

  return (
    <Box>
      <Typography variant="h4" fontWeight={950} color="#071B54">
        Health Records
      </Typography>
      <Typography color="text.secondary" mb={3}>
        Student and staff medical profiles, allergies, conditions and emergency contacts.
      </Typography>

      <TextField
        fullWidth
        label="Search"
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
        <Paper variant="outlined" sx={{ p: 3, borderRadius: 3 }}>
          <Stack spacing={1.5}>
            {visibleRecords.map((item) => (
              <Paper key={item.id} variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                <Typography fontWeight={900} color="#071B54">
                  {item.patient_name || `Health Profile ${item.id}`}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {item.patient_type} · Blood group: {item.blood_group || "Not recorded"} · Emergency contact: {item.emergency_contact_phone || "Not recorded"}
                </Typography>
              </Paper>
            ))}

            {!visibleRecords.length && (
              <Typography color="text.secondary">No records found.</Typography>
            )}
          </Stack>
        </Paper>
      )}
    </Box>
  );
}

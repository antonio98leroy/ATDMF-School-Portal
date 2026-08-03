import { useEffect, useState } from "react";
import { Save } from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";

import api from "../api/client";
import { SchoolSettingsAPI } from "../api/schoolSettings";

const emptyForm = {
  school_name: "",
  short_name: "",
  motto: "",
  address: "",
  phone: "",
  email: "",
  website: "",
  principal_name: "",
  registrar_name: "",
  default_currency: "BOTH",
  bank_name: "LBDI Bank",
  bank_account_name: "",
  bank_account_number_lrd: "",
  bank_account_number_usd: "",
  receipt_footer: "",
  report_footer: "",
  maintenance_mode: false,
  allow_online_registration: false,
  active_academic_year: "",
  active_term: "",
  logo: null,
};

function normalizeList(response) {
  if (Array.isArray(response?.data)) return response.data;
  return response?.data?.results || [];
}

function getErrorMessage(error) {
  return error?.response?.data?.detail || "Unable to save system settings.";
}

export default function SystemSettings() {
  const [form, setForm] = useState(emptyForm);
  const [academicYears, setAcademicYears] = useState([]);
  const [terms, setTerms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [logoPreview, setLogoPreview] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const [settingsResponse, yearsResponse, termsResponse] = await Promise.all([
          SchoolSettingsAPI.get(),
          api.get("/academics/years/", { params: { page_size: 100 } }),
          api.get("/academics/terms/", { params: { page_size: 200 } }),
        ]);
        const settings = settingsResponse.data || {};
        setForm({
          ...emptyForm,
          ...settings,
          active_academic_year: settings.active_academic_year || "",
          active_term: settings.active_term || "",
          logo: null,
        });
        setLogoPreview(settings.logo || "");
        setAcademicYears(normalizeList(yearsResponse));
        setTerms(normalizeList(termsResponse));
      } catch (requestError) {
        setError(getErrorMessage(requestError));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const setField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleLogo = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setField("logo", file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const save = async () => {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const data = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        if (key === "logo") {
          if (value instanceof File) data.append("logo", value);
          return;
        }
        if (value !== null && value !== undefined) data.append(key, value);
      });
      const response = await SchoolSettingsAPI.update(data);
      setForm((current) => ({ ...current, ...response.data, logo: null }));
      setLogoPreview(response.data.logo || logoPreview);
      setSuccess("System settings saved successfully.");
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ minHeight: "60vh", display: "grid", placeItems: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ pb: 5 }}>
      <Stack spacing={3}>
        <Box>
          <Typography variant="h4" fontWeight={900} color="#0B2A78">
            System Settings
          </Typography>
          <Typography color="text.secondary">
            Configure the school profile, academic period, banking details, and portal controls.
          </Typography>
        </Box>

        {error && <Alert severity="error">{error}</Alert>}
        {success && <Alert severity="success">{success}</Alert>}

        <Paper variant="outlined" sx={{ p: 3, borderRadius: 3 }}>
          <Typography variant="h6" fontWeight={900} color="#0B2A78" mb={2}>
            School Identity and Contact
          </Typography>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 8 }}>
              <TextField fullWidth label="School Name" value={form.school_name}
                onChange={(e) => setField("school_name", e.target.value)} />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField fullWidth label="Short Name" value={form.short_name}
                onChange={(e) => setField("short_name", e.target.value)} />
            </Grid>
            <Grid size={12}>
              <TextField fullWidth label="Motto" value={form.motto}
                onChange={(e) => setField("motto", e.target.value)} />
            </Grid>
            <Grid size={12}>
              <TextField fullWidth multiline minRows={2} label="Address" value={form.address}
                onChange={(e) => setField("address", e.target.value)} />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField fullWidth label="Phone" value={form.phone}
                onChange={(e) => setField("phone", e.target.value)} />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField fullWidth label="Email" value={form.email}
                onChange={(e) => setField("email", e.target.value)} />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField fullWidth label="Website" value={form.website}
                onChange={(e) => setField("website", e.target.value)} />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField fullWidth label="Principal Name" value={form.principal_name}
                onChange={(e) => setField("principal_name", e.target.value)} />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField fullWidth label="Registrar Name" value={form.registrar_name}
                onChange={(e) => setField("registrar_name", e.target.value)} />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Button component="label" variant="outlined">
                Upload School Logo
                <input hidden type="file" accept="image/*" onChange={handleLogo} />
              </Button>
              {logoPreview && (
                <Box component="img" src={logoPreview} alt="School logo"
                  sx={{ mt: 2, width: 120, height: 120, objectFit: "contain", border: "1px solid #E5E7EB", borderRadius: 2 }} />
              )}
            </Grid>
          </Grid>
        </Paper>

        <Paper variant="outlined" sx={{ p: 3, borderRadius: 3 }}>
          <Typography variant="h6" fontWeight={900} color="#0B2A78" mb={2}>
            Academic and Finance Settings
          </Typography>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Active Academic Year</InputLabel>
                <Select label="Active Academic Year" value={form.active_academic_year}
                  onChange={(e) => setField("active_academic_year", e.target.value)}>
                  <MenuItem value="">None</MenuItem>
                  {academicYears.map((year) => (
                    <MenuItem key={year.id} value={year.id}>{year.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Active Term</InputLabel>
                <Select label="Active Term" value={form.active_term}
                  onChange={(e) => setField("active_term", e.target.value)}>
                  <MenuItem value="">None</MenuItem>
                  {terms.map((term) => (
                    <MenuItem key={term.id} value={term.id}>{term.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <FormControl fullWidth>
                <InputLabel>Default Currency</InputLabel>
                <Select label="Default Currency" value={form.default_currency}
                  onChange={(e) => setField("default_currency", e.target.value)}>
                  <MenuItem value="LRD">LRD</MenuItem>
                  <MenuItem value="USD">USD</MenuItem>
                  <MenuItem value="BOTH">LRD and USD</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField fullWidth label="Bank Name" value={form.bank_name}
                onChange={(e) => setField("bank_name", e.target.value)} />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField fullWidth label="Bank Account Name" value={form.bank_account_name}
                onChange={(e) => setField("bank_account_name", e.target.value)} />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField fullWidth label="LRD Account Number" value={form.bank_account_number_lrd}
                onChange={(e) => setField("bank_account_number_lrd", e.target.value)} />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField fullWidth label="USD Account Number" value={form.bank_account_number_usd}
                onChange={(e) => setField("bank_account_number_usd", e.target.value)} />
            </Grid>
          </Grid>
        </Paper>

        <Paper variant="outlined" sx={{ p: 3, borderRadius: 3 }}>
          <Typography variant="h6" fontWeight={900} color="#0B2A78" mb={2}>
            Document Footers and Portal Controls
          </Typography>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField fullWidth multiline minRows={3} label="Receipt Footer" value={form.receipt_footer}
                onChange={(e) => setField("receipt_footer", e.target.value)} />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField fullWidth multiline minRows={3} label="Report Footer" value={form.report_footer}
                onChange={(e) => setField("report_footer", e.target.value)} />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography fontWeight={800}>Maintenance Mode</Typography>
                  <Typography variant="body2" color="text.secondary">Restrict normal portal use.</Typography>
                </Box>
                <Switch checked={form.maintenance_mode}
                  onChange={(e) => setField("maintenance_mode", e.target.checked)} />
              </Stack>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography fontWeight={800}>Online Registration</Typography>
                  <Typography variant="body2" color="text.secondary">Allow online admission registration.</Typography>
                </Box>
                <Switch checked={form.allow_online_registration}
                  onChange={(e) => setField("allow_online_registration", e.target.checked)} />
              </Stack>
            </Grid>
          </Grid>
        </Paper>

        <Stack direction="row" justifyContent="flex-end">
          <Button variant="contained" startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <Save />}
            disabled={saving} onClick={save} sx={{ bgcolor: "#0B2A78", px: 4 }}>
            {saving ? "Saving..." : "Save Settings"}
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}

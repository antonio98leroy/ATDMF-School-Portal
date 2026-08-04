import { useEffect, useMemo, useState } from "react";
import {
  Alert, Box, Button, FormControl, FormControlLabel, Grid, InputLabel,
  MenuItem, Paper, Select, Stack, Switch, TextField, Typography,
} from "@mui/material";
import { ArrowBack, Save } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import api from "../../api/client";
import { clinicApi } from "../../api/clinic/clinicApi";

const initialState = {
  patient_type: "STUDENT",
  student: "",
  employee: "",
  visit_date: new Date().toISOString().slice(0, 10),
  time_in: new Date().toTimeString().slice(0, 5),
  reason: "HEADACHE",
  temperature_c: "",
  pulse_bpm: "",
  respiratory_rate: "",
  blood_pressure: "",
  weight_kg: "",
  symptoms_or_complaint: "",
  test_performed: "",
  test_result: "",
  assessment_findings: "",
  treatment_or_medication: "",
  dose: "",
  route: "",
  administered_by: "",
  outcome: "RETURNED_TO_CLASS",
  follow_up_instructions: "",
  follow_up_date: "",
  parent_guardian_contacted: false,
  confidential: true,
};

export default function ClinicVisitForm() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialState);
  const [students, setStudents] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get("/students/records/", { params: { page_size: 1000 } }),
      api.get("/employees/", { params: { page_size: 1000 } }),
    ])
      .then(([studentResponse, employeeResponse]) => {
        const studentPayload = studentResponse.data;
        const employeePayload = employeeResponse.data;
        setStudents(Array.isArray(studentPayload) ? studentPayload : studentPayload.results || []);
        setEmployees(Array.isArray(employeePayload) ? employeePayload : employeePayload.results || []);
      })
      .catch(() => setError("Unable to load students or employees."));
  }, []);

  const patientOptions = useMemo(
    () => (form.patient_type === "STUDENT" ? students : employees),
    [form.patient_type, students, employees]
  );

  const setField = (name, value) => {
    setForm((current) => ({ ...current, [name]: value }));
  };

  const submit = async (event) => {
    event.preventDefault();
    setError("");

    const patientId =
      form.patient_type === "STUDENT" ? form.student : form.employee;

    if (!patientId) {
      setError("Please select a student or staff member.");
      return;
    }

    setSaving(true);

    try {
      await clinicApi.createVisit({
        ...form,
        student: form.patient_type === "STUDENT" ? Number(form.student) : null,
        employee: form.patient_type === "STAFF" ? Number(form.employee) : null,
        temperature_c: form.temperature_c || null,
        pulse_bpm: form.pulse_bpm || null,
        respiratory_rate: form.respiratory_rate || null,
        weight_kg: form.weight_kg || null,
        follow_up_date: form.follow_up_date || null,
      });

      navigate("/clinic/visits");
    } catch (requestError) {
      const detail = requestError?.response?.data;
      setError(
        typeof detail === "string"
          ? detail
          : detail?.detail ||
            Object.values(detail || {}).flat().join(" ") ||
            "Unable to save the clinic visit."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box component="form" onSubmit={submit}>
      <Stack
        direction={{ xs: "column", md: "row" }}
        justifyContent="space-between"
        gap={2}
        mb={3}
      >
        <Box>
          <Typography variant="h4" fontWeight={950} color="#071B54">
            New Clinic Visit
          </Typography>
          <Typography color="text.secondary">
            Record a student or staff clinic assessment and treatment.
          </Typography>
        </Box>

        <Button
          type="button"
          variant="outlined"
          startIcon={<ArrowBack />}
          onClick={() => navigate("/clinic/visits")}
        >
          Back to Visits
        </Button>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      <Paper variant="outlined" sx={{ p: 3, borderRadius: 3 }}>
        <Typography variant="h6" fontWeight={900} mb={2}>
          Patient and Visit Information
        </Typography>

        <Grid container spacing={2.5}>
          <Grid size={{ xs: 12, md: 4 }}>
            <FormControl fullWidth>
              <InputLabel>Patient Type</InputLabel>
              <Select
                value={form.patient_type}
                label="Patient Type"
                onChange={(event) => {
                  setField("patient_type", event.target.value);
                  setField("student", "");
                  setField("employee", "");
                }}
              >
                <MenuItem value="STUDENT">Student</MenuItem>
                <MenuItem value="STAFF">Staff</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 12, md: 8 }}>
            <FormControl fullWidth>
              <InputLabel>
                {form.patient_type === "STUDENT" ? "Select Student" : "Select Staff"}
              </InputLabel>

              <Select
                value={form.patient_type === "STUDENT" ? form.student : form.employee}
                label={form.patient_type === "STUDENT" ? "Select Student" : "Select Staff"}
                onChange={(event) =>
                  setField(
                    form.patient_type === "STUDENT" ? "student" : "employee",
                    event.target.value
                  )
                }
              >
                {patientOptions.map((item) => (
                  <MenuItem key={item.id} value={item.id}>
                    {item.full_name ||
                      [item.first_name, item.middle_name, item.last_name]
                        .filter(Boolean)
                        .join(" ") ||
                      item.username ||
                      `Record ${item.id}`}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              type="date"
              label="Visit Date"
              slotProps={{ inputLabel: { shrink: true } }}
              value={form.visit_date}
              onChange={(event) => setField("visit_date", event.target.value)}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              type="time"
              label="Time In"
              slotProps={{ inputLabel: { shrink: true } }}
              value={form.time_in}
              onChange={(event) => setField("time_in", event.target.value)}
            />
          </Grid>

          <Grid size={{ xs: 12 }}>
            <FormControl fullWidth>
              <InputLabel>Reason</InputLabel>
              <Select
                value={form.reason}
                label="Reason"
                onChange={(event) => setField("reason", event.target.value)}
              >
                {[
                  ["MENSTRUAL_CRAMPS", "Menstrual cramps"],
                  ["HEADACHE", "Headache"],
                  ["DIABETES_TEST", "Scheduled diabetes testing"],
                  ["MTT", "MTT"],
                  ["MALARIA_TEST", "Malaria testing"],
                  ["MALARIA_TREATMENT", "Uncomplicated malaria treatment"],
                  ["UTI", "UTI assessment/treatment"],
                  ["PREGNANCY_TEST", "Pregnancy testing"],
                  ["FEVER", "Fever"],
                  ["COUGH_COLD", "Cough/Cold"],
                  ["STOMACH_COMPLAINT", "Stomach complaint"],
                  ["INJURY_WOUND", "Injury/Wound"],
                  ["OTHER", "Other"],
                ].map(([value, label]) => (
                  <MenuItem key={value} value={value}>{label}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, mt: 3 }}>
        <Typography variant="h6" fontWeight={900} mb={2}>
          Vital Signs and Assessment
        </Typography>

        <Grid container spacing={2.5}>
          {[
            ["temperature_c", "Temperature °C", "number"],
            ["pulse_bpm", "Pulse", "number"],
            ["respiratory_rate", "Respiratory Rate", "number"],
            ["blood_pressure", "Blood Pressure", "text"],
            ["weight_kg", "Weight (kg)", "number"],
          ].map(([name, label, type]) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={name}>
              <TextField
                fullWidth
                type={type}
                label={label}
                value={form[name]}
                onChange={(event) => setField(name, event.target.value)}
              />
            </Grid>
          ))}

          {[
            ["symptoms_or_complaint", "Symptoms or Complaint"],
            ["assessment_findings", "Assessment Findings"],
            ["treatment_or_medication", "Treatment or Medication"],
            ["follow_up_instructions", "Follow-Up Instructions"],
          ].map(([name, label]) => (
            <Grid size={{ xs: 12 }} key={name}>
              <TextField
                fullWidth
                multiline
                minRows={2}
                label={label}
                value={form[name]}
                onChange={(event) => setField(name, event.target.value)}
              />
            </Grid>
          ))}

          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="Test Performed"
              value={form.test_performed}
              onChange={(event) => setField("test_performed", event.target.value)}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="Test Result"
              value={form.test_result}
              onChange={(event) => setField("test_result", event.target.value)}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <TextField fullWidth label="Dose" value={form.dose} onChange={(event) => setField("dose", event.target.value)} />
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <TextField fullWidth label="Route" value={form.route} onChange={(event) => setField("route", event.target.value)} />
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              fullWidth
              label="Administered By"
              value={form.administered_by}
              onChange={(event) => setField("administered_by", event.target.value)}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <FormControl fullWidth>
              <InputLabel>Outcome</InputLabel>
              <Select
                value={form.outcome}
                label="Outcome"
                onChange={(event) => setField("outcome", event.target.value)}
              >
                <MenuItem value="RETURNED_TO_CLASS">Returned to class</MenuItem>
                <MenuItem value="SENT_HOME">Sent home</MenuItem>
                <MenuItem value="FOLLOW_UP">Follow-up scheduled</MenuItem>
                <MenuItem value="REFERRED_CLINIC">Referred to clinic/health center</MenuItem>
                <MenuItem value="REFERRED_HOSPITAL">Referred to hospital</MenuItem>
                <MenuItem value="EMERGENCY_TRANSFER">Emergency transfer</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              type="date"
              label="Follow-Up Date"
              slotProps={{ inputLabel: { shrink: true } }}
              value={form.follow_up_date}
              onChange={(event) => setField("follow_up_date", event.target.value)}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={form.parent_guardian_contacted}
                  onChange={(event) => setField("parent_guardian_contacted", event.target.checked)}
                />
              }
              label="Parent/Guardian Contacted"
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={form.confidential}
                  onChange={(event) => setField("confidential", event.target.checked)}
                />
              }
              label="Confidential Record"
            />
          </Grid>
        </Grid>
      </Paper>

      <Stack direction="row" justifyContent="flex-end" mt={3}>
        <Button
          type="submit"
          variant="contained"
          size="large"
          startIcon={<Save />}
          disabled={saving}
          sx={{ bgcolor: "#071B54", fontWeight: 900 }}
        >
          {saving ? "Saving..." : "Save Clinic Visit"}
        </Button>
      </Stack>
    </Box>
  );
}

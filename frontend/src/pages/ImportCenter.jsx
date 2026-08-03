import { useEffect, useMemo, useState } from "react";
import {
  CloudUpload,
  Groups,
  History,
  PlayArrow,
  School,
  Undo,
} from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import api from "../api/client";
import { ImportCenterAPI } from "../api/importCenter";

const list = (response) =>
  Array.isArray(response.data)
    ? response.data
    : response.data.results || [];

const TYPES = [
  {
    value: "SPONSORSHIP",
    label: "Students, Guardians & Sponsorships",
    description: "Student, guardian, enrollment and sponsorship records.",
    icon: <School />,
    requiresYear: true,
  },
  {
    value: "EMPLOYEE",
    label: "Employees / Staff",
    description: "Teachers, administrators and support employees.",
    icon: <Groups />,
    requiresYear: false,
  },
  {
    value: "ACADEMIC",
    label: "Academic Results",
    description: "Open the historical marksheet importer.",
    icon: <School />,
    route: "/academic-import",
  },
];

export default function ImportCenter() {
  const navigate = useNavigate();
  const [importType, setImportType] = useState("SPONSORSHIP");
  const [file, setFile] = useState(null);
  const [year, setYear] = useState("");
  const [years, setYears] = useState([]);
  const [batch, setBatch] = useState(null);
  const [history, setHistory] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const selectedType = useMemo(
    () => TYPES.find((item) => item.value === importType),
    [importType]
  );

  const load = async () => {
    const [yearsResponse, historyResponse] = await Promise.all([
      api.get("/academics/years/", { params: { page_size: 100 } }),
      ImportCenterAPI.list({ page_size: 100 }),
    ]);
    setYears(list(yearsResponse));
    setHistory(list(historyResponse));
  };

  useEffect(() => {
    load().catch(() => setError("Unable to load Import Center."));
  }, []);

  const selectType = (type) => {
    if (type.route) {
      navigate(type.route);
      return;
    }
    setImportType(type.value);
    setFile(null);
    setBatch(null);
    setError("");
    setSuccess("");
  };

  const preview = async () => {
    if (!file) return setError("Select an Excel workbook.");
    if (selectedType?.requiresYear && !year) {
      return setError("Select an academic year.");
    }

    setBusy(true);
    setError("");
    setSuccess("");

    try {
      const data = new FormData();
      data.append("file", file);
      data.append("import_type", importType);
      if (year) data.append("academic_year", year);

      const response = await ImportCenterAPI.preview(data);
      setBatch(response.data);
      setSuccess("Preview completed. Review records before confirming.");
      await load();
    } catch (e) {
      setError(e?.response?.data?.detail || "Preview failed.");
    } finally {
      setBusy(false);
    }
  };

  const confirm = async () => {
    if (!batch?.id) return;
    setBusy(true);
    setError("");
    try {
      const response = await ImportCenterAPI.confirm(batch.id);
      setBatch(response.data);
      setSuccess("Import completed.");
      await load();
    } catch (e) {
      setError(e?.response?.data?.detail || "Import failed.");
    } finally {
      setBusy(false);
    }
  };

  const rollback = async (id) => {
    if (!window.confirm("Rollback this import batch?")) return;
    setBusy(true);
    try {
      await ImportCenterAPI.rollback(id);
      setSuccess("Rollback completed.");
      if (batch?.id === id) setBatch(null);
      await load();
    } catch (e) {
      setError(e?.response?.data?.detail || "Rollback failed.");
    } finally {
      setBusy(false);
    }
  };

  const employeeMode = batch?.import_type === "EMPLOYEE";

  return (
    <Box sx={{ pb: 5 }}>
      <Stack spacing={3}>
        <Box>
          <Typography variant="h4" fontWeight={900} color="#0B2A78">
            Unified Import Center
          </Typography>
          <Typography color="text.secondary">
            Select the record type, upload, preview, validate and confirm.
          </Typography>
        </Box>

        {error && <Alert severity="error">{error}</Alert>}
        {success && <Alert severity="success">{success}</Alert>}

        <Grid container spacing={2}>
          {TYPES.map((type) => (
            <Grid key={type.value} size={{ xs: 12, md: 4 }}>
              <Paper
                variant="outlined"
                onClick={() => selectType(type)}
                sx={{
                  p: 2.5,
                  height: "100%",
                  cursor: "pointer",
                  borderRadius: 3,
                  borderColor: importType === type.value ? "#0B2A78" : "#E5E7EB",
                  bgcolor: importType === type.value ? "#EFF6FF" : "white",
                }}
              >
                <Stack direction="row" spacing={2}>
                  <Box sx={{ color: "#0B2A78" }}>{type.icon}</Box>
                  <Box>
                    <Typography fontWeight={900}>{type.label}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {type.description}
                    </Typography>
                  </Box>
                </Stack>
              </Paper>
            </Grid>
          ))}
        </Grid>

        {importType !== "ACADEMIC" && (
          <Paper variant="outlined" sx={{ p: 3, borderRadius: 3 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid size={{ xs: 12, md: 4 }}>
                <Button fullWidth component="label" variant="outlined" startIcon={<CloudUpload />}>
                  {file?.name || "Select Excel File"}
                  <input hidden type="file" accept=".xlsx" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                </Button>
              </Grid>

              {selectedType?.requiresYear && (
                <Grid size={{ xs: 12, md: 4 }}>
                  <FormControl fullWidth>
                    <InputLabel>Academic Year</InputLabel>
                    <Select label="Academic Year" value={year} onChange={(e) => setYear(e.target.value)}>
                      {years.map((item) => (
                        <MenuItem key={item.id} value={item.id}>{item.name}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              )}

              <Grid size={{ xs: 12, md: selectedType?.requiresYear ? 4 : 8 }}>
                <Button
                  fullWidth
                  variant="contained"
                  startIcon={busy ? <CircularProgress size={18} color="inherit" /> : <PlayArrow />}
                  disabled={busy}
                  onClick={preview}
                  sx={{ minHeight: 56 }}
                >
                  Preview Import
                </Button>
              </Grid>
            </Grid>
          </Paper>
        )}

        {batch && (
          <Paper variant="outlined" sx={{ p: 3, borderRadius: 3 }}>
            <Stack spacing={2}>
              <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" gap={2}>
                <Box>
                  <Typography variant="h6" fontWeight={900}>Batch {batch.batch_number}</Typography>
                  <Typography color="text.secondary">{batch.original_filename}</Typography>
                </Box>
                <Chip label={batch.status} />
              </Stack>

              <Grid container spacing={2}>
                <Stat label="Total Rows" value={batch.total_rows} />
                <Stat label="Valid" value={batch.summary?.valid_rows ?? batch.successful_rows ?? 0} />
                <Stat label="Invalid" value={batch.summary?.invalid_rows ?? batch.failed_rows ?? 0} />
              </Grid>

              {batch.status === "PREVIEWED" && (
                <Button variant="contained" color="success" disabled={busy} onClick={confirm}>
                  Confirm and Import Valid Rows
                </Button>
              )}

              <TableContainer sx={{ maxHeight: 520 }}>
                <Table stickyHeader size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Row</TableCell>
                      {employeeMode ? (
                        <>
                          <TableCell>Employee</TableCell>
                          <TableCell>Position</TableCell>
                          <TableCell>Department</TableCell>
                          <TableCell>Type</TableCell>
                        </>
                      ) : (
                        <>
                          <TableCell>Student</TableCell>
                          <TableCell>Gender</TableCell>
                          <TableCell>Guardian</TableCell>
                          <TableCell>Sponsor</TableCell>
                          <TableCell>Grade</TableCell>
                        </>
                      )}
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(batch.preview_data || []).map((row) => (
                      <TableRow key={row.row_number} sx={{ bgcolor: row.valid ? "inherit" : "#FFF1F2" }}>
                        <TableCell>{row.row_number}</TableCell>
                        {employeeMode ? (
                          <>
                            <TableCell>{row.full_name}</TableCell>
                            <TableCell>{row.position_name}</TableCell>
                            <TableCell>{row.department_name}</TableCell>
                            <TableCell>{row.is_teacher ? "Teacher" : "Staff"}</TableCell>
                          </>
                        ) : (
                          <>
                            <TableCell>{row.student_name}</TableCell>
                            <TableCell>{row.gender || "—"}</TableCell>
                            <TableCell>{row.guardian_name || "—"}</TableCell>
                            <TableCell>{row.sponsor_name || "Unsponsored"}</TableCell>
                            <TableCell>{row.grade}</TableCell>
                          </>
                        )}
                        <TableCell>
                          {row.valid ? (
                            row.duplicate ? <Chip size="small" label="Duplicate" color="warning" /> : <Chip size="small" label="Valid" color="success" />
                          ) : (
                            <Chip size="small" label={(row.errors || []).join("; ") || "Invalid"} color="error" />
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Stack>
          </Paper>
        )}

        <Paper variant="outlined" sx={{ borderRadius: 3, overflow: "hidden" }}>
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" fontWeight={900}>
              <History sx={{ mr: 1, verticalAlign: "middle" }} /> Import History
            </Typography>
          </Box>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Batch</TableCell><TableCell>Type</TableCell><TableCell>File</TableCell><TableCell>Status</TableCell><TableCell>Success</TableCell><TableCell>Failed</TableCell><TableCell>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {history.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.batch_number}</TableCell>
                    <TableCell>{item.import_type_display || item.import_type}</TableCell>
                    <TableCell>{item.original_filename}</TableCell>
                    <TableCell><Chip size="small" label={item.status} /></TableCell>
                    <TableCell>{item.successful_rows}</TableCell>
                    <TableCell>{item.failed_rows}</TableCell>
                    <TableCell>
                      {["COMPLETED", "PARTIAL"].includes(item.status) && (
                        <Button color="error" size="small" startIcon={<Undo />} onClick={() => rollback(item.id)}>Rollback</Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Stack>
    </Box>
  );
}

function Stat({ label, value }) {
  return (
    <Grid size={{ xs: 12, sm: 4 }}>
      <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
        <Typography color="text.secondary">{label}</Typography>
        <Typography variant="h5" fontWeight={900} color="#0B2A78">{value || 0}</Typography>
      </Paper>
    </Grid>
  );
}

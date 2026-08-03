import { useEffect, useMemo, useState } from "react";
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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import {
  CloudUpload,
  Preview,
  Undo,
  UploadFile,
} from "@mui/icons-material";

import api from "../api/client";
import { AcademicImportAPI } from "../api/academicImport";


function listData(response) {
  return Array.isArray(response?.data)
    ? response.data
    : response?.data?.results || [];
}


export default function AcademicImport() {
  const [years, setYears] = useState([]);
  const [classes, setClasses] = useState([]);
  const [year, setYear] = useState("");
  const [classSection, setClassSection] = useState("");
  const [file, setFile] = useState(null);
  const [batch, setBatch] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const rows = batch?.preview_data || [];

  const visibleRows = useMemo(
    () => rows.slice(0, 200),
    [rows]
  );

  const loadOptions = async () => {
    const [yearResponse, classResponse, historyResponse] =
      await Promise.all([
        api.get("/academics/years/", {
          params: { page_size: 100 },
        }),
        api.get("/academics/classes/", {
          params: { page_size: 1000 },
        }),
        AcademicImportAPI.list(),
      ]);

    setYears(listData(yearResponse));
    setClasses(listData(classResponse));
    setHistory(listData(historyResponse));
  };

  useEffect(() => {
    loadOptions().catch(() => {
      setError("Unable to load academic import options.");
    });
  }, []);

  const preview = async () => {
    if (!file || !year || !classSection) {
      setError(
        "Select an academic year, class section, and Excel workbook."
      );
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const data = new FormData();
      data.append("file", file);
      data.append("academic_year", year);
      data.append("class_section", classSection);

      const response = await AcademicImportAPI.preview(data);
      setBatch(response.data);
      setSuccess(
        "Preview completed. Review all errors before confirming."
      );
      await loadOptions();
    } catch (requestError) {
      setError(
        requestError?.response?.data?.detail ||
          "Unable to preview the academic workbook."
      );
    } finally {
      setLoading(false);
    }
  };

  const confirm = async () => {
    if (!batch?.id) return;

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await AcademicImportAPI.confirm(batch.id);
      setBatch(response.data.batch);
      setSuccess(
        `${response.data.imported_rows} academic result records were imported.`
      );
      await loadOptions();
    } catch (requestError) {
      setError(
        requestError?.response?.data?.detail ||
          "Unable to import the academic results."
      );
    } finally {
      setLoading(false);
    }
  };

  const rollback = async (id) => {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      await AcademicImportAPI.rollback(id);
      setSuccess("Academic import rolled back successfully.");
      setBatch(null);
      await loadOptions();
    } catch (requestError) {
      setError(
        requestError?.response?.data?.detail ||
          "Unable to roll back the import."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ pb: 5 }}>
      <Stack spacing={3}>
        <Box>
          <Typography
            variant="h4"
            fontWeight={900}
            color="#0B2A78"
          >
            Academic Results Importer
          </Typography>

          <Typography color="text.secondary">
            Import historical period assessments and semester
            examination results from the school marksheet workbook.
          </Typography>
        </Box>

        {error && <Alert severity="error">{error}</Alert>}
        {success && <Alert severity="success">{success}</Alert>}

        <Paper
          variant="outlined"
          sx={{ p: 3, borderRadius: 3 }}
        >
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 4 }}>
              <FormControl fullWidth>
                <InputLabel>Academic Year</InputLabel>
                <Select
                  label="Academic Year"
                  value={year}
                  onChange={(event) =>
                    setYear(event.target.value)
                  }
                >
                  {years.map((item) => (
                    <MenuItem key={item.id} value={item.id}>
                      {item.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <FormControl fullWidth>
                <InputLabel>Class Section</InputLabel>
                <Select
                  label="Class Section"
                  value={classSection}
                  onChange={(event) =>
                    setClassSection(event.target.value)
                  }
                >
                  {classes.map((item) => (
                    <MenuItem key={item.id} value={item.id}>
                      {item.name ||
                        item.display_name ||
                        `${item.grade_name || ""} ${
                          item.section_name || ""
                        }`}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <Button
                component="label"
                fullWidth
                variant="outlined"
                startIcon={<UploadFile />}
                sx={{ minHeight: 56 }}
              >
                {file ? file.name : "Select Academic Workbook"}
                <input
                  hidden
                  type="file"
                  accept=".xlsx"
                  onChange={(event) =>
                    setFile(event.target.files?.[0] || null)
                  }
                />
              </Button>
            </Grid>

            <Grid size={12}>
              <Button
                variant="contained"
                startIcon={
                  loading ? (
                    <CircularProgress
                      size={18}
                      color="inherit"
                    />
                  ) : (
                    <Preview />
                  )
                }
                disabled={loading}
                onClick={preview}
                sx={{ bgcolor: "#0B2A78" }}
              >
                Preview Academic Import
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {batch && (
          <Paper
            variant="outlined"
            sx={{ p: 3, borderRadius: 3 }}
          >
            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={2}
              sx={{
                justifyContent: "space-between",
                alignItems: { xs: "stretch", md: "center" },
                mb: 2,
              }}
            >
              <Box>
                <Typography variant="h6" fontWeight={900}>
                  Preview Summary
                </Typography>
                <Typography color="text.secondary">
                  Total: {batch.total_rows} | Valid:{" "}
                  {batch.valid_rows} | Errors:{" "}
                  {batch.error_rows}
                </Typography>
              </Box>

              {batch.status === "PREVIEWED" && (
                <Button
                  variant="contained"
                  startIcon={<CloudUpload />}
                  disabled={loading || batch.valid_rows === 0}
                  onClick={confirm}
                  sx={{ bgcolor: "#C8102E" }}
                >
                  Confirm Import
                </Button>
              )}
            </Stack>

            <TableContainer sx={{ maxHeight: 600 }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Excel Row</TableCell>
                    <TableCell>Student ID</TableCell>
                    <TableCell>Student</TableCell>
                    <TableCell>Subject</TableCell>
                    <TableCell>Period</TableCell>
                    <TableCell>Total</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {visibleRows.map((row, index) => {
                    const total =
                      Number(row.assignment_score || 0) +
                      Number(row.class_activity_score || 0) +
                      Number(row.quiz_score || 0) +
                      Number(row.period_test_score || 0) +
                      Number(row.semester_exam_score || 0);

                    return (
                      <TableRow key={`${row.excel_row}-${index}`}>
                        <TableCell>{row.excel_row}</TableCell>
                        <TableCell>{row.student_id}</TableCell>
                        <TableCell>
                          {row.student_name || "Unmatched"}
                        </TableCell>
                        <TableCell>{row.subject_name}</TableCell>
                        <TableCell>{row.period_name}</TableCell>
                        <TableCell>{total.toFixed(2)}</TableCell>
                        <TableCell>
                          {row.errors?.length
                            ? row.errors.join(" | ")
                            : row.duplicate
                            ? "Duplicate \u2014 will be skipped"
                            : "Valid"}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>

            {rows.length > 200 && (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: "block", mt: 1 }}
              >
                Showing the first 200 preview records out of{" "}
                {rows.length}.
              </Typography>
            )}
          </Paper>
        )}

        <Paper
          variant="outlined"
          sx={{ p: 3, borderRadius: 3 }}
        >
          <Typography variant="h6" fontWeight={900} mb={2}>
            Import History
          </Typography>

          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>File</TableCell>
                  <TableCell>Academic Year</TableCell>
                  <TableCell>Class</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Imported</TableCell>
                  <TableCell>Action</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {history.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.original_filename}</TableCell>
                    <TableCell>{item.academic_year_name}</TableCell>
                    <TableCell>{item.class_section_name}</TableCell>
                    <TableCell>{item.status}</TableCell>
                    <TableCell>{item.imported_rows}</TableCell>
                    <TableCell>
                      {item.status === "IMPORTED" && (
                        <Button
                          size="small"
                          color="error"
                          startIcon={<Undo />}
                          onClick={() => rollback(item.id)}
                        >
                          Rollback
                        </Button>
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

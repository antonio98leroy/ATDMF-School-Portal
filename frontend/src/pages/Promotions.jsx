import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ArrowForward,
  CheckCircle,
  Refresh,
  School,
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
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";

import EmptyState from "../components/common/EmptyState";
import { PromotionAPI } from "../api/promotions";

function normalizeList(response) {
  if (Array.isArray(response?.data)) {
    return response.data;
  }

  return response?.data?.results || [];
}

function getErrorMessage(error) {
  const data = error?.response?.data;

  if (!data) {
    return "An unexpected error occurred.";
  }

  if (data.detail) {
    return data.detail;
  }

  if (Array.isArray(data.errors)) {
    return data.errors
      .map(
        (item) =>
          `Row ${item.row}: ${item.detail}`
      )
      .join(" ");
  }

  return Object.entries(data)
    .map(([field, value]) => {
      const message = Array.isArray(value)
        ? value.join(" ")
        : String(value);

      return `${field}: ${message}`;
    })
    .join(" ");
}

export default function Promotions() {
  const [academicYears, setAcademicYears] =
    useState([]);
  const [grades, setGrades] = useState([]);
  const [classes, setClasses] = useState([]);

  const [sourceYear, setSourceYear] =
    useState("");
  const [targetYear, setTargetYear] =
    useState("");
  const [sourceGrade, setSourceGrade] =
    useState("");
  const [sourceClass, setSourceClass] =
    useState("");
  const [targetGrade, setTargetGrade] =
    useState("");
  const [targetClass, setTargetClass] =
    useState("");

  const [rows, setRows] = useState([]);

  const [loading, setLoading] = useState(true);
  const [studentsLoading, setStudentsLoading] =
    useState(false);
  const [processing, setProcessing] =
    useState(false);

  const [error, setError] = useState("");

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const showMessage = (
    message,
    severity = "success"
  ) => {
    setSnackbar({
      open: true,
      message,
      severity,
    });
  };

  const sourceClasses = useMemo(() => {
    if (!sourceGrade) {
      return [];
    }

    return classes.filter(
      (item) =>
        String(item.grade) ===
        String(sourceGrade)
    );
  }, [classes, sourceGrade]);

  const targetClasses = useMemo(() => {
    if (!targetGrade) {
      return [];
    }

    return classes.filter(
      (item) =>
        String(item.grade) ===
        String(targetGrade)
    );
  }, [classes, targetGrade]);

  useEffect(() => {
    const initialize = async () => {
      setLoading(true);

      try {
        const [
          yearsResponse,
          gradesResponse,
          classesResponse,
        ] = await Promise.all([
          PromotionAPI.getAcademicYears(),
          PromotionAPI.getGrades(),
          PromotionAPI.getClasses(),
        ]);

        const years =
          normalizeList(yearsResponse);

        setAcademicYears(years);
        setGrades(normalizeList(gradesResponse));
        setClasses(
          normalizeList(classesResponse)
        );

        const activeYear = years.find(
          (item) => item.active
        );

        if (activeYear) {
          setTargetYear(activeYear.id);
        }
      } catch (requestError) {
        setError(
          getErrorMessage(requestError)
        );
      } finally {
        setLoading(false);
      }
    };

    initialize();
  }, []);

  const loadStudents = async () => {
    if (!sourceYear || !sourceClass) {
      showMessage(
        "Select the source academic year and class.",
        "warning"
      );
      return;
    }

    setStudentsLoading(true);
    setError("");

    try {
      const response =
        await PromotionAPI.getClassStudents(
          sourceYear,
          sourceClass
        );

      const data = Array.isArray(response.data)
        ? response.data
        : [];

      setRows(
        data.map((item) => ({
          ...item,
          selected: !item.already_processed,
          decision:
            item.previous_decision ||
            "PROMOTED",
          remarks: "",
        }))
      );
    } catch (requestError) {
      setRows([]);
      setError(
        getErrorMessage(requestError)
      );
    } finally {
      setStudentsLoading(false);
    }
  };

  const updateRow = (
    enrollmentId,
    field,
    value
  ) => {
    setRows((current) =>
      current.map((item) =>
        item.enrollment_id === enrollmentId
          ? {
              ...item,
              [field]: value,
            }
          : item
      )
    );
  };

  const processPromotions = async () => {
    const selected = rows.filter(
      (item) => item.selected
    );

    if (!sourceYear || !targetYear) {
      showMessage(
        "Select both source and target academic years.",
        "warning"
      );
      return;
    }

    if (!sourceClass) {
      showMessage(
        "Select the source class.",
        "warning"
      );
      return;
    }

    if (selected.length === 0) {
      showMessage(
        "Select at least one student.",
        "warning"
      );
      return;
    }

    const requiresTargetClass =
      selected.some((item) =>
        ["PROMOTED", "REPEATED"].includes(
          item.decision
        )
      );

    if (
      requiresTargetClass &&
      !targetClass
    ) {
      showMessage(
        "Select a target class.",
        "warning"
      );
      return;
    }

    setProcessing(true);

    try {
      const response =
        await PromotionAPI.processStudents({
          source_academic_year: sourceYear,
          target_academic_year: targetYear,
          source_class: sourceClass,
          target_class: targetClass || null,

          records: selected.map((item) => ({
            enrollment_id:
              item.enrollment_id,
            decision: item.decision,
            yearly_average:
              item.yearly_average,
            remarks: item.remarks || "",
          })),
        });

      showMessage(
        `${response.data.processed_count} students processed successfully.`
      );

      await loadStudents();
    } catch (requestError) {
      showMessage(
        getErrorMessage(requestError),
        "error"
      );
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: "60vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ pb: 4 }}>
      <Stack spacing={3}>
        <Stack
          direction={{
            xs: "column",
            md: "row",
          }}
          spacing={2}
          sx={{
            justifyContent: "space-between",
            alignItems: {
              xs: "stretch",
              md: "center",
            },
          }}
        >
          <Box>
            <Typography
              variant="h4"
              sx={{
                color: "#0B2A78",
                fontWeight: 800,
              }}
            >
              Student Promotion
            </Typography>

            <Typography color="text.secondary">
              Promote, repeat, graduate, or
              withdraw students while preserving
              their academic history.
            </Typography>
          </Box>

          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={loadStudents}
          >
            Refresh
          </Button>
        </Stack>

        {error && (
          <Alert severity="error">
            {error}
          </Alert>
        )}

        <Paper
          variant="outlined"
          sx={{
            p: 2,
            borderRadius: 3,
          }}
        >
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 3 }}>
              <FormControl fullWidth>
                <InputLabel>
                  Source Academic Year
                </InputLabel>

                <Select
                  label="Source Academic Year"
                  value={sourceYear}
                  onChange={(event) => {
                    setSourceYear(
                      event.target.value
                    );
                    setRows([]);
                  }}
                >
                  {academicYears.map((item) => (
                    <MenuItem
                      key={item.id}
                      value={item.id}
                    >
                      {item.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, md: 3 }}>
              <FormControl fullWidth>
                <InputLabel>
                  Source Grade
                </InputLabel>

                <Select
                  label="Source Grade"
                  value={sourceGrade}
                  onChange={(event) => {
                    setSourceGrade(
                      event.target.value
                    );
                    setSourceClass("");
                    setRows([]);
                  }}
                >
                  {grades.map((item) => (
                    <MenuItem
                      key={item.id}
                      value={item.id}
                    >
                      {item.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, md: 3 }}>
              <FormControl fullWidth>
                <InputLabel>
                  Source Class
                </InputLabel>

                <Select
                  label="Source Class"
                  value={sourceClass}
                  disabled={!sourceGrade}
                  onChange={(event) => {
                    setSourceClass(
                      event.target.value
                    );
                    setRows([]);
                  }}
                >
                  {sourceClasses.map((item) => (
                    <MenuItem
                      key={item.id}
                      value={item.id}
                    >
                      {item.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, md: 3 }}>
              <Button
                fullWidth
                variant="contained"
                startIcon={<School />}
                onClick={loadStudents}
                disabled={studentsLoading}
                sx={{
                  minHeight: 56,
                  bgcolor: "#0B2A78",
                }}
              >
                Load Students
              </Button>
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <FormControl fullWidth>
                <InputLabel>
                  Target Academic Year
                </InputLabel>

                <Select
                  label="Target Academic Year"
                  value={targetYear}
                  onChange={(event) =>
                    setTargetYear(
                      event.target.value
                    )
                  }
                >
                  {academicYears.map((item) => (
                    <MenuItem
                      key={item.id}
                      value={item.id}
                    >
                      {item.name}
                      {item.active
                        ? " — Active"
                        : ""}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <FormControl fullWidth>
                <InputLabel>
                  Target Grade
                </InputLabel>

                <Select
                  label="Target Grade"
                  value={targetGrade}
                  onChange={(event) => {
                    setTargetGrade(
                      event.target.value
                    );
                    setTargetClass("");
                  }}
                >
                  {grades.map((item) => (
                    <MenuItem
                      key={item.id}
                      value={item.id}
                    >
                      {item.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <FormControl fullWidth>
                <InputLabel>
                  Target Class
                </InputLabel>

                <Select
                  label="Target Class"
                  value={targetClass}
                  disabled={!targetGrade}
                  onChange={(event) =>
                    setTargetClass(
                      event.target.value
                    )
                  }
                >
                  {targetClasses.map((item) => (
                    <MenuItem
                      key={item.id}
                      value={item.id}
                    >
                      {item.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Paper>

        {rows.length === 0 ? (
          <EmptyState
            title="No Students Loaded"
            description="Select the source academic year and class, then load the student list."
          />
        ) : (
          <Paper
            variant="outlined"
            sx={{
              borderRadius: 3,
              overflow: "hidden",
            }}
          >
            <Stack
              direction={{
                xs: "column",
                md: "row",
              }}
              spacing={2}
              sx={{
                p: 2,
                justifyContent: "space-between",
                alignItems: {
                  xs: "stretch",
                  md: "center",
                },
              }}
            >
              <Typography
                variant="h6"
                fontWeight={800}
                color="#0B2A78"
              >
                Promotion Decisions
              </Typography>

              <Button
                variant="contained"
                startIcon={
                  processing ? (
                    <CircularProgress
                      size={18}
                      color="inherit"
                    />
                  ) : (
                    <ArrowForward />
                  )
                }
                onClick={processPromotions}
                disabled={processing}
                sx={{
                  bgcolor: "#C8102E",
                  "&:hover": {
                    bgcolor: "#9D0C24",
                  },
                }}
              >
                Process Selected Students
              </Button>
            </Stack>

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow
                    sx={{
                      "& th": {
                        bgcolor: "#0B2A78",
                        color: "white",
                        fontWeight: 700,
                      },
                    }}
                  >
                    <TableCell>Select</TableCell>
                    <TableCell>
                      Admission Number
                    </TableCell>
                    <TableCell>Student</TableCell>
                    <TableCell>
                      Yearly Average
                    </TableCell>
                    <TableCell>Decision</TableCell>
                    <TableCell>Remarks</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {rows.map((row) => (
                    <TableRow
                      key={row.enrollment_id}
                      hover
                    >
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={row.selected}
                          disabled={
                            row.already_processed
                          }
                          onChange={(event) =>
                            updateRow(
                              row.enrollment_id,
                              "selected",
                              event.target.checked
                            )
                          }
                        />
                      </TableCell>

                      <TableCell>
                        {row.admission_number}
                      </TableCell>

                      <TableCell>
                        <Typography fontWeight={700}>
                          {row.student_name}
                        </Typography>
                      </TableCell>

                      <TableCell>
                        {row.yearly_average ??
                          "Not available"}
                      </TableCell>

                      <TableCell>
                        <Select
                          size="small"
                          value={row.decision}
                          disabled={
                            row.already_processed
                          }
                          onChange={(event) =>
                            updateRow(
                              row.enrollment_id,
                              "decision",
                              event.target.value
                            )
                          }
                          sx={{ minWidth: 150 }}
                        >
                          <MenuItem value="PROMOTED">
                            Promoted
                          </MenuItem>

                          <MenuItem value="REPEATED">
                            Repeated
                          </MenuItem>

                          <MenuItem value="GRADUATED">
                            Graduated
                          </MenuItem>

                          <MenuItem value="WITHDRAWN">
                            Withdrawn
                          </MenuItem>
                        </Select>
                      </TableCell>

                      <TableCell>
                        <TextField
                          size="small"
                          value={row.remarks}
                          disabled={
                            row.already_processed
                          }
                          onChange={(event) =>
                            updateRow(
                              row.enrollment_id,
                              "remarks",
                              event.target.value
                            )
                          }
                        />
                      </TableCell>

                      <TableCell>
                        {row.already_processed ? (
                          <Chip
                            size="small"
                            icon={
                              <CheckCircle />
                            }
                            label={
                              row.previous_decision
                            }
                            color="success"
                          />
                        ) : (
                          <Chip
                            size="small"
                            label="Pending"
                          />
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        )}
      </Stack>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={() =>
          setSnackbar((current) => ({
            ...current,
            open: false,
          }))
        }
      >
        <Alert
          severity={snackbar.severity}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

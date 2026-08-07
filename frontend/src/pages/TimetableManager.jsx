import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Add,
  Delete,
  Edit,
  Print,
  Refresh,
  Schedule,
} from "@mui/icons-material";

import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  IconButton,
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
  Tooltip,
  Typography,
} from "@mui/material";

import { TimetableAPI } from "../api/timetable";
import { TeacherAssignmentAPI } from "../api/teacherAssignments";

const DAYS = [
  ["MON", "Monday"],
  ["TUE", "Tuesday"],
  ["WED", "Wednesday"],
  ["THU", "Thursday"],
  ["FRI", "Friday"],
];

const emptyForm = {
  teacher_assignment: "",
  day: "",
  period: "",
  room: "",
  notes: "",
};

function normalizeList(response) {
  if (Array.isArray(response?.data)) {
    return response.data;
  }

  return response?.data?.results || [];
}

function formatError(error) {
  const data = error?.response?.data;

  if (!data) {
    return "An unexpected error occurred.";
  }

  if (typeof data === "string") {
    return data;
  }

  if (data.detail) {
    return Array.isArray(data.detail)
      ? data.detail.join(" ")
      : data.detail;
  }

  return Object.entries(data)
    .map(([field, value]) => {
      const message = Array.isArray(value)
        ? value.join(" ")
        : String(value);

      return `${field.replaceAll("_", " ")}: ${message}`;
    })
    .join(" ");
}

export default function TimetableManager() {
  const [periods, setPeriods] = useState([]);
  const [entries, setEntries] = useState([]);
  const [assignments, setAssignments] = useState([]);

  const [academicYears, setAcademicYears] =
    useState([]);
  const [terms, setTerms] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [classes, setClasses] = useState([]);

  const [filters, setFilters] = useState({
    academic_year: "",
    term: "",
    teacher: "",
    class_section: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [dialogOpen, setDialogOpen] =
    useState(false);
  const [editingEntry, setEditingEntry] =
    useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");

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

  const queryParams = useMemo(() => {
    const params = {};

    Object.entries(filters).forEach(
      ([key, value]) => {
        if (value) {
          params[key] = value;
        }
      }
    );

    return params;
  }, [filters]);

  const loadReferenceData = useCallback(
    async () => {
      const [
        periodResponse,
        assignmentResponse,
        yearResponse,
        termResponse,
        teacherResponse,
        classResponse,
      ] = await Promise.all([
        TimetableAPI.getPeriods(),
        TeacherAssignmentAPI.getAssignments({
          page_size: 1000,
          active: true,
        }),
        TeacherAssignmentAPI.getAcademicYears(),
        TeacherAssignmentAPI.getTerms(),
        TeacherAssignmentAPI.getTeachers(),
        TeacherAssignmentAPI.getClasses(),
      ]);

      setPeriods(normalizeList(periodResponse));
      setAssignments(
        normalizeList(assignmentResponse)
      );
      setAcademicYears(
        normalizeList(yearResponse)
      );
      setTerms(normalizeList(termResponse));
      setTeachers(normalizeList(teacherResponse));
      setClasses(normalizeList(classResponse));
    },
    []
  );

  const loadEntries = useCallback(async () => {
    const response =
      await TimetableAPI.getEntries(queryParams);

    setEntries(normalizeList(response));
  }, [queryParams]);

  useEffect(() => {
    const initialize = async () => {
      setLoading(true);

      try {
        await loadReferenceData();
        await loadEntries();
      } catch (error) {
        showMessage(
          formatError(error),
          "error"
        );
      } finally {
        setLoading(false);
      }
    };

    initialize();
  }, [loadReferenceData, loadEntries]);

  useEffect(() => {
    if (!loading) {
      loadEntries().catch((error) => {
        showMessage(
          formatError(error),
          "error"
        );
      });
    }
  }, [queryParams]);

  const availableTerms = useMemo(() => {
    if (!filters.academic_year) {
      return terms;
    }

    return terms.filter(
      (term) =>
        String(term.academic_year) ===
        String(filters.academic_year)
    );
  }, [terms, filters.academic_year]);

  const filteredAssignments = useMemo(() => {
    return assignments.filter((assignment) => {
      if (
        filters.academic_year &&
        String(assignment.academic_year) !==
          String(filters.academic_year)
      ) {
        return false;
      }

      if (
        filters.term &&
        String(assignment.term) !==
          String(filters.term)
      ) {
        return false;
      }

      return true;
    });
  }, [
    assignments,
    filters.academic_year,
    filters.term,
  ]);

  const entryAt = (periodId, day) =>
    entries.find(
      (entry) =>
        String(entry.period?.id) ===
          String(periodId) &&
        entry.day === day
    );

  const openCreate = (period, day) => {
    if (!period.is_teaching_period) {
      return;
    }

    setEditingEntry(null);
    setForm({
      ...emptyForm,
      period: period.id,
      day,
    });
    setFormError("");
    setDialogOpen(true);
  };

  const openEdit = (entry) => {
    setEditingEntry(entry);
    setForm({
      teacher_assignment:
        entry.teacher_assignment || "",
      day: entry.day,
      period: entry.period?.id || "",
      room: entry.room || "",
      notes: entry.notes || "",
    });
    setFormError("");
    setDialogOpen(true);
  };

  const closeDialog = () => {
    if (saving) return;

    setDialogOpen(false);
    setEditingEntry(null);
    setForm(emptyForm);
    setFormError("");
  };

  const saveEntry = async () => {
    if (
      !form.teacher_assignment ||
      !form.day ||
      !form.period
    ) {
      setFormError(
        "Teacher assignment, day and period are required."
      );
      return;
    }

    setSaving(true);
    setFormError("");

    try {
      const payload = {
        teacher_assignment:
          form.teacher_assignment,
        day: form.day,
        period: form.period,
        room: form.room.trim(),
        notes: form.notes.trim(),
      };

      if (editingEntry) {
        await TimetableAPI.updateEntry(
          editingEntry.id,
          payload
        );

        showMessage(
          "Timetable entry updated successfully."
        );
      } else {
        await TimetableAPI.createEntry(payload);

        showMessage(
          "Class added to the timetable successfully."
        );
      }

      closeDialog();
      await loadEntries();
    } catch (error) {
      setFormError(formatError(error));
    } finally {
      setSaving(false);
    }
  };

  const deleteEntry = async (entry) => {
    const confirmed = window.confirm(
      `Remove ${entry.subject?.name || "this class"} from the timetable?`
    );

    if (!confirmed) return;

    try {
      await TimetableAPI.deleteEntry(entry.id);

      showMessage(
        "Timetable entry removed successfully."
      );

      await loadEntries();
    } catch (error) {
      showMessage(
        formatError(error),
        "error"
      );
    }
  };

  const printTimetable = () => {
    window.print();
  };

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: 400,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Stack
        direction={{
          xs: "column",
          md: "row",
        }}
        justifyContent="space-between"
        alignItems={{
          xs: "stretch",
          md: "center",
        }}
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography
            variant="h4"
            fontWeight={800}
          >
            School Timetable
          </Typography>

          <Typography color="text.secondary">
            Manage teachers, classes, subjects and
            teaching periods.
          </Typography>
        </Box>

        <Stack direction="row" spacing={1}>
          <Button
            startIcon={<Refresh />}
            variant="outlined"
            onClick={loadEntries}
          >
            Refresh
          </Button>

          <Button
            startIcon={<Print />}
            variant="outlined"
            onClick={printTimetable}
          >
            Print
          </Button>
        </Stack>
      </Stack>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 3 }}>
            <FormControl fullWidth>
              <InputLabel>
                Academic Year
              </InputLabel>
              <Select
                value={filters.academic_year}
                label="Academic Year"
                onChange={(event) =>
                  setFilters((current) => ({
                    ...current,
                    academic_year:
                      event.target.value,
                    term: "",
                  }))
                }
              >
                <MenuItem value="">
                  All Academic Years
                </MenuItem>

                {academicYears.map((year) => (
                  <MenuItem
                    key={year.id}
                    value={year.id}
                  >
                    {year.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 12, md: 3 }}>
            <FormControl fullWidth>
              <InputLabel>Term</InputLabel>
              <Select
                value={filters.term}
                label="Term"
                onChange={(event) =>
                  setFilters((current) => ({
                    ...current,
                    term: event.target.value,
                  }))
                }
              >
                <MenuItem value="">
                  All Terms
                </MenuItem>

                {availableTerms.map((term) => (
                  <MenuItem
                    key={term.id}
                    value={term.id}
                  >
                    {term.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 12, md: 3 }}>
            <FormControl fullWidth>
              <InputLabel>Teacher</InputLabel>
              <Select
                value={filters.teacher}
                label="Teacher"
                onChange={(event) =>
                  setFilters((current) => ({
                    ...current,
                    teacher: event.target.value,
                  }))
                }
              >
                <MenuItem value="">
                  All Teachers
                </MenuItem>

                {teachers.map((teacher) => (
                  <MenuItem
                    key={teacher.id}
                    value={teacher.id}
                  >
                    {teacher.full_name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 12, md: 3 }}>
            <FormControl fullWidth>
              <InputLabel>Class</InputLabel>
              <Select
                value={filters.class_section}
                label="Class"
                onChange={(event) =>
                  setFilters((current) => ({
                    ...current,
                    class_section:
                      event.target.value,
                  }))
                }
              >
                <MenuItem value="">
                  All Classes
                </MenuItem>

                {classes.map((item) => (
                  <MenuItem
                    key={item.id}
                    value={item.id}
                  >
                    {item.name ||
                      item.display_name ||
                      `Class ${item.id}`}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      <TableContainer
        component={Paper}
        sx={{
          overflowX: "auto",
          "@media print": {
            boxShadow: "none",
          },
        }}
      >
        <Table
          sx={{
            minWidth: 1100,
          }}
        >
          <TableHead>
            <TableRow>
              <TableCell
                sx={{
                  fontWeight: 800,
                  minWidth: 160,
                }}
              >
                Period
              </TableCell>

              {DAYS.map(([code, name]) => (
                <TableCell
                  key={code}
                  align="center"
                  sx={{
                    fontWeight: 800,
                    minWidth: 190,
                  }}
                >
                  {name}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>

          <TableBody>
            {periods.map((period) => (
              <TableRow key={period.id}>
                <TableCell>
                  <Typography fontWeight={800}>
                    {period.name}
                  </Typography>

                  <Typography
                    variant="caption"
                    color="text.secondary"
                  >
                    {period.start_time} –{" "}
                    {period.end_time}
                  </Typography>

                  {!period.is_teaching_period && (
                    <Box sx={{ mt: 0.5 }}>
                      <Chip
                        size="small"
                        label="Break"
                      />
                    </Box>
                  )}
                </TableCell>

                {DAYS.map(([day]) => {
                  const entry = entryAt(
                    period.id,
                    day
                  );

                  if (
                    !period.is_teaching_period
                  ) {
                    return (
                      <TableCell
                        key={day}
                        align="center"
                      >
                        <Typography
                          color="text.secondary"
                          fontWeight={600}
                        >
                          {period.name}
                        </Typography>
                      </TableCell>
                    );
                  }

                  return (
                    <TableCell
                      key={day}
                      sx={{
                        verticalAlign: "top",
                      }}
                    >
                      {entry ? (
                        <Paper
                          variant="outlined"
                          sx={{
                            p: 1.25,
                          }}
                        >
                          <Typography
                            fontWeight={800}
                            variant="body2"
                          >
                            {entry.subject?.name}
                          </Typography>

                          <Typography
                            variant="body2"
                          >
                            {entry.class_section?.name}
                          </Typography>

                          <Typography
                            variant="caption"
                            display="block"
                            color="text.secondary"
                          >
                            {entry.teacher?.full_name}
                          </Typography>

                          {entry.room && (
                            <Chip
                              size="small"
                              label={entry.room}
                              sx={{ mt: 0.75 }}
                            />
                          )}

                          <Stack
                            direction="row"
                            spacing={0.5}
                            sx={{
                              mt: 1,
                              "@media print": {
                                display: "none",
                              },
                            }}
                          >
                            <Tooltip title="Edit">
                              <IconButton
                                size="small"
                                onClick={() =>
                                  openEdit(entry)
                                }
                              >
                                <Edit fontSize="small" />
                              </IconButton>
                            </Tooltip>

                            <Tooltip title="Delete">
                              <IconButton
                                size="small"
                                onClick={() =>
                                  deleteEntry(entry)
                                }
                              >
                                <Delete fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </Paper>
                      ) : (
                        <Button
                          fullWidth
                          size="small"
                          startIcon={<Add />}
                          onClick={() =>
                            openCreate(
                              period,
                              day
                            )
                          }
                          sx={{
                            minHeight: 80,
                            borderStyle: "dashed",
                            "@media print": {
                              display: "none",
                            },
                          }}
                          variant="outlined"
                        >
                          Add Class
                        </Button>
                      )}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog
        open={dialogOpen}
        onClose={closeDialog}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          <Stack
            direction="row"
            alignItems="center"
            spacing={1}
          >
            <Schedule />
            <span>
              {editingEntry
                ? "Edit Timetable Entry"
                : "Add Timetable Entry"}
            </span>
          </Stack>
        </DialogTitle>

        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {formError && (
              <Alert severity="error">
                {formError}
              </Alert>
            )}

            <FormControl fullWidth>
              <InputLabel>
                Teacher / Class / Subject
              </InputLabel>

              <Select
                value={form.teacher_assignment}
                label="Teacher / Class / Subject"
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    teacher_assignment:
                      event.target.value,
                  }))
                }
              >
                {filteredAssignments.map(
                  (assignment) => (
                    <MenuItem
                      key={assignment.id}
                      value={assignment.id}
                    >
                      {assignment.teacher_name ||
                        assignment.teacher_display ||
                        `Teacher ${assignment.teacher}`}
                      {" — "}
                      {assignment.subject_name ||
                        assignment.subject_display ||
                        `Subject ${assignment.subject}`}
                      {" — "}
                      {assignment.class_section_name ||
                        assignment.class_name ||
                        `Class ${assignment.class_section}`}
                    </MenuItem>
                  )
                )}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Day</InputLabel>
              <Select
                value={form.day}
                label="Day"
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    day: event.target.value,
                  }))
                }
              >
                {DAYS.map(([code, name]) => (
                  <MenuItem
                    key={code}
                    value={code}
                  >
                    {name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Period</InputLabel>
              <Select
                value={form.period}
                label="Period"
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    period: event.target.value,
                  }))
                }
              >
                {periods
                  .filter(
                    (period) =>
                      period.is_teaching_period
                  )
                  .map((period) => (
                    <MenuItem
                      key={period.id}
                      value={period.id}
                    >
                      {period.name} —{" "}
                      {period.start_time} to{" "}
                      {period.end_time}
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>

            <TextField
              label="Room / Classroom"
              value={form.room}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  room: event.target.value,
                }))
              }
              placeholder="Example: Grade 7A, Lab 1"
              fullWidth
            />

            <TextField
              label="Notes"
              value={form.notes}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  notes: event.target.value,
                }))
              }
              multiline
              minRows={2}
              fullWidth
            />
          </Stack>
        </DialogContent>

        <DialogActions>
          <Button
            onClick={closeDialog}
            disabled={saving}
          >
            Cancel
          </Button>

          <Button
            variant="contained"
            onClick={saveEntry}
            disabled={saving}
          >
            {saving
              ? "Saving..."
              : editingEntry
                ? "Save Changes"
                : "Add to Timetable"}
          </Button>
        </DialogActions>
      </Dialog>

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
          onClose={() =>
            setSnackbar((current) => ({
              ...current,
              open: false,
            }))
          }
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

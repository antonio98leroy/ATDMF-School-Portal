import { useEffect, useMemo, useState } from "react";

import {
  Add,
  Delete,
  Edit,
  PersonAdd,
  Refresh,
  Search,
} from "@mui/icons-material";

import {
  Alert,
  Avatar,
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

import api from "../api/client";

const emptyForm = {
  student: "",
  academic_year: "",
  grade: "",
  class_section: "",
  roll_number: "",
  active: true,
};

function getRows(response) {
  return response?.data?.results || response?.data || [];
}

function getErrorMessage(error) {
  const data = error?.response?.data;

  if (!data) {
    return (
      error?.message ||
      "An unexpected error occurred. Please try again."
    );
  }

  if (typeof data === "string") {
    return data;
  }

  if (data.detail) {
    return data.detail;
  }

  return Object.entries(data)
    .map(([field, value]) => {
      let message = "";

      if (Array.isArray(value)) {
        message = value.join(" ");
      } else if (
        value !== null &&
        typeof value === "object"
      ) {
        message = Object.values(value).flat().join(" ");
      } else {
        message = String(value);
      }

      const fieldName = field
        .replaceAll("_", " ")
        .replace(/\b\w/g, (letter) =>
          letter.toUpperCase()
        );

      return `${fieldName}: ${message}`;
    })
    .join(" ");
}

export default function Enrollments() {
  const [enrollments, setEnrollments] = useState([]);
  const [students, setStudents] = useState([]);
  const [years, setYears] = useState([]);
  const [grades, setGrades] = useState([]);
  const [classes, setClasses] = useState([]);

  const [form, setForm] = useState(emptyForm);
  const [editingRecord, setEditingRecord] =
    useState(null);

  const [search, setSearch] = useState("");
  const [yearFilter, setYearFilter] = useState("");
  const [gradeFilter, setGradeFilter] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [statusFilter, setStatusFilter] =
    useState("");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const availableClasses = useMemo(() => {
    if (!form.grade) {
      return [];
    }

    return classes.filter(
      (classItem) =>
        String(classItem.grade) === String(form.grade)
    );
  }, [classes, form.grade]);

  const filterClasses = useMemo(() => {
    if (!gradeFilter) {
      return classes;
    }

    return classes.filter(
      (classItem) =>
        String(classItem.grade) ===
        String(gradeFilter)
    );
  }, [classes, gradeFilter]);

  const loadReferenceData = async () => {
    const [
      studentsResponse,
      yearsResponse,
      gradesResponse,
      classesResponse,
    ] = await Promise.all([
      api.get("/students/records/"),
      api.get("/academics/years/"),
      api.get("/academics/grades/"),
      api.get("/academics/classes/"),
    ]);

    setStudents(getRows(studentsResponse));
    setYears(getRows(yearsResponse));
    setGrades(getRows(gradesResponse));
    setClasses(getRows(classesResponse));
  };

  const loadEnrollments = async () => {
    setLoading(true);
    setError("");

    try {
      const params = {};

      if (search.trim()) {
        params.search = search.trim();
      }

      if (yearFilter) {
        params.academic_year = yearFilter;
      }

      if (gradeFilter) {
        params.grade = gradeFilter;
      }

      if (classFilter) {
        params.class_section = classFilter;
      }

      if (statusFilter !== "") {
        params.active = statusFilter;
      }

      const response = await api.get(
        "/academics/enrollments/",
        { params }
      );

      setEnrollments(getRows(response));
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initializePage = async () => {
      setLoading(true);
      setError("");

      try {
        await loadReferenceData();

        const response = await api.get(
          "/academics/enrollments/"
        );

        setEnrollments(getRows(response));
      } catch (requestError) {
        setError(getErrorMessage(requestError));
      } finally {
        setLoading(false);
      }
    };

    initializePage();
  }, []);

  const updateField = (field, value) => {
    setForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }));
  };

  const handleFormGradeChange = (event) => {
    const gradeId = event.target.value;

    setForm((currentForm) => ({
      ...currentForm,
      grade: gradeId,
      class_section: "",
    }));
  };

  const handleGradeFilterChange = (event) => {
    const gradeId = event.target.value;

    setGradeFilter(gradeId);
    setClassFilter("");
  };

  const openCreateDialog = () => {
    const activeYear = years.find(
      (year) => year.active
    );

    setEditingRecord(null);

    setForm({
      ...emptyForm,
      academic_year: activeYear?.id || "",
    });

    setError("");
    setSuccess("");
    setDialogOpen(true);
  };

  const openEditDialog = (record) => {
    const selectedClass = classes.find(
      (classItem) =>
        String(classItem.id) ===
        String(record.class_section)
    );

    setEditingRecord(record);

    setForm({
      student: record.student || "",
      academic_year: record.academic_year || "",
      grade: selectedClass?.grade || "",
      class_section: record.class_section || "",
      roll_number: record.roll_number || "",
      active: Boolean(record.active),
    });

    setError("");
    setSuccess("");
    setDialogOpen(true);
  };

  const closeDialog = () => {
    if (saving) {
      return;
    }

    setDialogOpen(false);
    setEditingRecord(null);
    setForm(emptyForm);
    setError("");
  };

  const validateForm = () => {
    if (!form.student) {
      return "Please select a student.";
    }

    if (!form.academic_year) {
      return "Please select an academic year.";
    }

    if (!form.grade) {
      return "Please select a grade level.";
    }

    if (!form.class_section) {
      return "Please select a class section.";
    }

    if (
      form.roll_number &&
      Number(form.roll_number) < 1
    ) {
      return "Roll number must be greater than zero.";
    }

    return "";
  };

  const saveEnrollment = async () => {
    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    const payload = {
      student: form.student,
      academic_year: form.academic_year,
      class_section: form.class_section,
      roll_number: form.roll_number
        ? Number(form.roll_number)
        : null,
      active: form.active,
    };

    try {
      if (editingRecord) {
        await api.patch(
          `/academics/enrollments/${editingRecord.id}/`,
          payload
        );

        setSuccess(
          "Enrollment updated successfully."
        );
      } else {
        await api.post(
          "/academics/enrollments/",
          payload
        );

        setSuccess(
          "Student enrolled successfully."
        );
      }

      setDialogOpen(false);
      setEditingRecord(null);
      setForm(emptyForm);

      await loadEnrollments();
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setSaving(false);
    }
  };

  const deleteEnrollment = async (record) => {
    const studentName =
      record.student_name || "this student";

    const confirmed = window.confirm(
      `Are you sure you want to delete the enrollment for ${studentName}?`
    );

    if (!confirmed) {
      return;
    }

    setError("");
    setSuccess("");

    try {
      await api.delete(
        `/academics/enrollments/${record.id}/`
      );

      setSuccess(
        "Enrollment deleted successfully."
      );

      await loadEnrollments();
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    }
  };

  const clearFilters = async () => {
    setSearch("");
    setYearFilter("");
    setGradeFilter("");
    setClassFilter("");
    setStatusFilter("");
    setError("");
    setLoading(true);

    try {
      const response = await api.get(
        "/academics/enrollments/"
      );

      setEnrollments(getRows(response));
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  };

  const handleSearchKeyDown = (event) => {
    if (event.key === "Enter") {
      loadEnrollments();
    }
  };

  return (
    <Box>
      <Stack
        direction={{
          xs: "column",
          sm: "row",
        }}
        spacing={2}
        sx={{
          alignItems: {
            xs: "stretch",
            sm: "center",
          },
          justifyContent: "space-between",
          mb: 3,
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
            Student Enrollment
          </Typography>

          <Typography color="text.secondary">
            Assign students to classes for each
            academic year.
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<PersonAdd />}
          onClick={openCreateDialog}
          sx={{
            bgcolor: "#C8102E",
            "&:hover": {
              bgcolor: "#9D0C24",
            },
          }}
        >
          Enroll Student
        </Button>
      </Stack>

      {error && (
        <Alert
          severity="error"
          onClose={() => setError("")}
          sx={{ mb: 2 }}
        >
          {error}
        </Alert>
      )}

      {success && (
        <Alert
          severity="success"
          onClose={() => setSuccess("")}
          sx={{ mb: 2 }}
        >
          {success}
        </Alert>
      )}

      <Paper
        sx={{
          p: 2,
          mb: 3,
          borderRadius: 3,
          border: "1px solid #E5E7EB",
        }}
      >
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              fullWidth
              size="small"
              label="Search Student"
              placeholder="Name or admission number"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              onKeyDown={handleSearchKeyDown}
            />
          </Grid>

          <Grid
            size={{
              xs: 12,
              sm: 6,
              md: 2,
            }}
          >
            <FormControl fullWidth size="small">
              <InputLabel>Academic Year</InputLabel>

              <Select
                label="Academic Year"
                value={yearFilter}
                onChange={(event) =>
                  setYearFilter(event.target.value)
                }
              >
                <MenuItem value="">
                  All Years
                </MenuItem>

                {years.map((year) => (
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

          <Grid
            size={{
              xs: 12,
              sm: 6,
              md: 2,
            }}
          >
            <FormControl fullWidth size="small">
              <InputLabel>Grade</InputLabel>

              <Select
                label="Grade"
                value={gradeFilter}
                onChange={handleGradeFilterChange}
              >
                <MenuItem value="">
                  All Grades
                </MenuItem>

                {grades.map((grade) => (
                  <MenuItem
                    key={grade.id}
                    value={grade.id}
                  >
                    {grade.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid
            size={{
              xs: 12,
              sm: 6,
              md: 2,
            }}
          >
            <FormControl fullWidth size="small">
              <InputLabel>Class</InputLabel>

              <Select
                label="Class"
                value={classFilter}
                onChange={(event) =>
                  setClassFilter(event.target.value)
                }
              >
                <MenuItem value="">
                  All Classes
                </MenuItem>

                {filterClasses.map((classItem) => (
                  <MenuItem
                    key={classItem.id}
                    value={classItem.id}
                  >
                    {classItem.grade_name
                      ? `${classItem.grade_name} `
                      : ""}
                    {classItem.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid
            size={{
              xs: 12,
              sm: 6,
              md: 2,
            }}
          >
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>

              <Select
                label="Status"
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value)
                }
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="true">
                  Active
                </MenuItem>
                <MenuItem value="false">
                  Inactive
                </MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        <Stack
          direction="row"
          spacing={1}
          sx={{
            justifyContent: "flex-end",
            mt: 2,
          }}
        >
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={clearFilters}
            disabled={loading}
          >
            Clear
          </Button>

          <Button
            variant="contained"
            startIcon={<Search />}
            onClick={loadEnrollments}
            disabled={loading}
            sx={{
              bgcolor: "#0B2A78",
              "&:hover": {
                bgcolor: "#071B54",
              },
            }}
          >
            Search
          </Button>
        </Stack>
      </Paper>

      <Paper
        sx={{
          borderRadius: 3,
          border: "1px solid #E5E7EB",
          overflow: "hidden",
        }}
      >
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow
                sx={{
                  "& th": {
                    bgcolor: "#0B2A78",
                    color: "white",
                    fontWeight: 700,
                    whiteSpace: "nowrap",
                  },
                }}
              >
                <TableCell>Student</TableCell>
                <TableCell>
                  Admission Number
                </TableCell>
                <TableCell>
                  Academic Year
                </TableCell>
                <TableCell>Grade</TableCell>
                <TableCell>Class</TableCell>
                <TableCell>
                  Roll Number
                </TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    align="center"
                  >
                    <Box
                      sx={{
                        py: 5,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <CircularProgress />
                    </Box>
                  </TableCell>
                </TableRow>
              ) : enrollments.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    align="center"
                  >
                    <Typography
                      color="text.secondary"
                      sx={{ py: 5 }}
                    >
                      No enrollment records found.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                enrollments.map((record) => (
                  <TableRow
                    key={record.id}
                    hover
                  >
                    <TableCell>
                      <Stack
                        direction="row"
                        spacing={1.5}
                        sx={{
                          alignItems: "center",
                        }}
                      >
                        <Avatar
                          sx={{
                            bgcolor: "#0B2A78",
                            width: 36,
                            height: 36,
                            fontSize: 15,
                            fontWeight: 700,
                          }}
                        >
                          {record.student_name
                            ?.charAt(0)
                            .toUpperCase() || "S"}
                        </Avatar>

                        <Typography
                          sx={{
                            fontWeight: 700,
                            whiteSpace: "nowrap",
                          }}
                        >
                          {record.student_name ||
                            "Unknown Student"}
                        </Typography>
                      </Stack>
                    </TableCell>

                    <TableCell>
                      {record.admission_number ||
                        "—"}
                    </TableCell>

                    <TableCell>
                      {record.academic_year_name ||
                        "—"}
                    </TableCell>

                    <TableCell>
                      {record.grade_name || "—"}
                    </TableCell>

                    <TableCell>
                      {record.class_name || "—"}
                    </TableCell>

                    <TableCell>
                      {record.roll_number || "—"}
                    </TableCell>

                    <TableCell>
                      <Chip
                        size="small"
                        label={
                          record.active
                            ? "Active"
                            : "Inactive"
                        }
                        color={
                          record.active
                            ? "success"
                            : "default"
                        }
                      />
                    </TableCell>

                    <TableCell align="right">
                      <Tooltip title="Edit enrollment">
                        <IconButton
                          color="primary"
                          onClick={() =>
                            openEditDialog(record)
                          }
                        >
                          <Edit />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title="Delete enrollment">
                        <IconButton
                          color="error"
                          onClick={() =>
                            deleteEnrollment(record)
                          }
                        >
                          <Delete />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Dialog
        open={dialogOpen}
        onClose={closeDialog}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle
          sx={{
            bgcolor: "#0B2A78",
            color: "white",
            fontWeight: 800,
          }}
        >
          {editingRecord
            ? "Edit Student Enrollment"
            : "Enroll Student"}
        </DialogTitle>

        <DialogContent dividers sx={{ pt: 3 }}>
          <Grid container spacing={2}>
            <Grid size={12}>
              <FormControl fullWidth required>
                <InputLabel>Student</InputLabel>

                <Select
                  label="Student"
                  value={form.student}
                  onChange={(event) =>
                    updateField(
                      "student",
                      event.target.value
                    )
                  }
                >
                  {students.map((student) => (
                    <MenuItem
                      key={student.id}
                      value={student.id}
                    >
                      {student.admission_number ||
                        "No admission number"}
                      {" — "}
                      {student.full_name ||
                        `${student.first_name || ""} ${
                          student.last_name || ""
                        }`.trim()}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid size={12}>
              <FormControl fullWidth required>
                <InputLabel>
                  Academic Year
                </InputLabel>

                <Select
                  label="Academic Year"
                  value={form.academic_year}
                  onChange={(event) =>
                    updateField(
                      "academic_year",
                      event.target.value
                    )
                  }
                >
                  {years.map((year) => (
                    <MenuItem
                      key={year.id}
                      value={year.id}
                    >
                      {year.name}
                      {year.active
                        ? " — Active"
                        : ""}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid
              size={{
                xs: 12,
                sm: 6,
              }}
            >
              <FormControl fullWidth required>
                <InputLabel>
                  Grade Level
                </InputLabel>

                <Select
                  label="Grade Level"
                  value={form.grade}
                  onChange={handleFormGradeChange}
                >
                  {grades.map((grade) => (
                    <MenuItem
                      key={grade.id}
                      value={grade.id}
                    >
                      {grade.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid
              size={{
                xs: 12,
                sm: 6,
              }}
            >
              <FormControl fullWidth required>
                <InputLabel>
                  Class Section
                </InputLabel>

                <Select
                  label="Class Section"
                  value={form.class_section}
                  onChange={(event) =>
                    updateField(
                      "class_section",
                      event.target.value
                    )
                  }
                  disabled={!form.grade}
                >
                  {availableClasses.map(
                    (classItem) => (
                      <MenuItem
                        key={classItem.id}
                        value={classItem.id}
                      >
                        {classItem.grade_name
                          ? `${classItem.grade_name} `
                          : ""}
                        {classItem.name}
                      </MenuItem>
                    )
                  )}
                </Select>
              </FormControl>
            </Grid>

            <Grid
              size={{
                xs: 12,
                sm: 6,
              }}
            >
              <TextField
                fullWidth
                type="number"
                label="Roll Number"
                slotProps={{
                  htmlInput: {
                    min: 1,
                  },
                }}
                value={form.roll_number}
                onChange={(event) =>
                  updateField(
                    "roll_number",
                    event.target.value
                  )
                }
              />
            </Grid>

            <Grid
              size={{
                xs: 12,
                sm: 6,
              }}
            >
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>

                <Select
                  label="Status"
                  value={
                    form.active
                      ? "active"
                      : "inactive"
                  }
                  onChange={(event) =>
                    updateField(
                      "active",
                      event.target.value ===
                        "active"
                    )
                  }
                >
                  <MenuItem value="active">
                    Active
                  </MenuItem>

                  <MenuItem value="inactive">
                    Inactive
                  </MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions
          sx={{
            px: 3,
            py: 2,
            gap: 1,
          }}
        >
          <Button
            onClick={closeDialog}
            disabled={saving}
          >
            Cancel
          </Button>

          <Button
            variant="contained"
            startIcon={
              saving ? null : editingRecord ? (
                <Edit />
              ) : (
                <Add />
              )
            }
            onClick={saveEnrollment}
            disabled={saving}
            sx={{
              bgcolor: "#0B2A78",
              "&:hover": {
                bgcolor: "#071B54",
              },
            }}
          >
            {saving ? (
              <CircularProgress
                size={22}
                color="inherit"
              />
            ) : editingRecord ? (
              "Save Changes"
            ) : (
              "Enroll Student"
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Add,
  AssignmentInd,
  Delete,
  Edit,
  MenuBook,
  Refresh,
  School,
  Search,
  WorkHistory,
} from "@mui/icons-material";

import {
  Alert,
  Avatar,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  FormHelperText,
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
  TablePagination,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";

import ConfirmDialog from "../components/common/ConfirmDialog";
import EmptyState from "../components/common/EmptyState";
import StatCard from "../components/common/StatCard";

import { TeacherAssignmentAPI } from "../api/teacherAssignments";

const emptyForm = {
  teacher: "",
  academic_year: "",
  term: "",
  grade: "",
  class_section: "",
  subject: "",
  weekly_periods: 3,
  is_class_teacher: false,
  active: true,
  notes: "",
};

const emptyFilters = {
  search: "",
  academic_year: "",
  term: "",
  grade: "",
  class_section: "",
  teacher: "",
  subject: "",
  active: "",
};

const emptyStatistics = {
  total_assignments: 0,
  active_assignments: 0,
  teachers_assigned: 0,
  classes_covered: 0,
  subjects_covered: 0,
  weekly_periods: 0,
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
    return data.detail;
  }

  return Object.entries(data)
    .map(([field, value]) => {
      let message = value;

      if (Array.isArray(value)) {
        message = value.join(" ");
      } else if (
        value &&
        typeof value === "object"
      ) {
        message = Object.values(value)
          .flat()
          .join(" ");
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

export default function TeacherAssignments() {
  const [assignments, setAssignments] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [academicYears, setAcademicYears] =
    useState([]);
  const [terms, setTerms] = useState([]);
  const [grades, setGrades] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);

  const [statistics, setStatistics] = useState(
    emptyStatistics
  );

  const [filters, setFilters] =
    useState(emptyFilters);

  const [debouncedSearch, setDebouncedSearch] =
    useState("");

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] =
    useState(10);
  const [totalCount, setTotalCount] = useState(0);

  const [loading, setLoading] = useState(true);
  const [tableLoading, setTableLoading] =
    useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] =
    useState(false);

  const [dialogOpen, setDialogOpen] =
    useState(false);
  const [editingAssignment, setEditingAssignment] =
    useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formErrors, setFormErrors] = useState({});
  const [formError, setFormError] = useState("");

  const [deleteOpen, setDeleteOpen] =
    useState(false);
  const [assignmentToDelete, setAssignmentToDelete] =
    useState(null);

  const [workloadOpen, setWorkloadOpen] =
    useState(false);
  const [workload, setWorkload] = useState([]);
  const [workloadLoading, setWorkloadLoading] =
    useState(false);

  const [pageError, setPageError] = useState("");

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
    const params = {
      page: page + 1,
      page_size: rowsPerPage,
    };

    if (debouncedSearch.trim()) {
      params.search = debouncedSearch.trim();
    }

    if (filters.academic_year) {
      params.academic_year =
        filters.academic_year;
    }

    if (filters.term) {
      params.term = filters.term;
    }

    if (filters.grade) {
      params.grade = filters.grade;
    }

    if (filters.class_section) {
      params.class_section =
        filters.class_section;
    }

    if (filters.teacher) {
      params.teacher = filters.teacher;
    }

    if (filters.subject) {
      params.subject = filters.subject;
    }

    if (filters.active !== "") {
      params.active = filters.active;
    }

    return params;
  }, [
    page,
    rowsPerPage,
    debouncedSearch,
    filters.academic_year,
    filters.term,
    filters.grade,
    filters.class_section,
    filters.teacher,
    filters.subject,
    filters.active,
  ]);

  const filteredFilterTerms = useMemo(() => {
    if (!filters.academic_year) {
      return terms;
    }

    return terms.filter(
      (term) =>
        String(term.academic_year) ===
        String(filters.academic_year)
    );
  }, [terms, filters.academic_year]);

  const filteredFormTerms = useMemo(() => {
    if (!form.academic_year) {
      return [];
    }

    return terms.filter(
      (term) =>
        String(term.academic_year) ===
        String(form.academic_year)
    );
  }, [terms, form.academic_year]);

  const filteredFilterClasses = useMemo(() => {
    if (!filters.grade) {
      return classes;
    }

    return classes.filter(
      (classItem) =>
        String(classItem.grade) ===
        String(filters.grade)
    );
  }, [classes, filters.grade]);

  const filteredFormClasses = useMemo(() => {
    if (!form.grade) {
      return [];
    }

    return classes.filter(
      (classItem) =>
        String(classItem.grade) ===
        String(form.grade)
    );
  }, [classes, form.grade]);

  const loadReferenceData = useCallback(async () => {
    const [
      teacherResponse,
      yearResponse,
      termResponse,
      gradeResponse,
      classResponse,
      subjectResponse,
    ] = await Promise.all([
      TeacherAssignmentAPI.getTeachers(),
      TeacherAssignmentAPI.getAcademicYears(),
      TeacherAssignmentAPI.getTerms(),
      TeacherAssignmentAPI.getGrades(),
      TeacherAssignmentAPI.getClasses(),
      TeacherAssignmentAPI.getSubjects(),
    ]);

    setTeachers(normalizeList(teacherResponse));
    setAcademicYears(normalizeList(yearResponse));
    setTerms(normalizeList(termResponse));
    setGrades(normalizeList(gradeResponse));
    setClasses(normalizeList(classResponse));
    setSubjects(normalizeList(subjectResponse));
  }, []);

  const loadAssignments = useCallback(async () => {
    setTableLoading(true);
    setPageError("");

    try {
      const response =
        await TeacherAssignmentAPI.getAssignments(
          queryParams
        );

      if (Array.isArray(response.data)) {
        setAssignments(response.data);
        setTotalCount(response.data.length);
      } else {
        setAssignments(response.data.results || []);
        setTotalCount(
          response.data.count ??
            response.data.results?.length ??
            0
        );
      }
    } catch (error) {
      setAssignments([]);
      setTotalCount(0);
      setPageError(formatError(error));
    } finally {
      setTableLoading(false);
    }
  }, [queryParams]);

  const loadStatistics = useCallback(async () => {
    try {
      const params = {};

      if (filters.academic_year) {
        params.academic_year =
          filters.academic_year;
      }

      if (filters.term) {
        params.term = filters.term;
      }

      const response =
        await TeacherAssignmentAPI.getStatistics(
          params
        );

      setStatistics({
        ...emptyStatistics,
        ...response.data,
      });
    } catch {
      setStatistics(emptyStatistics);
    }
  }, [
    filters.academic_year,
    filters.term,
  ]);

  useEffect(() => {
    const initialize = async () => {
      setLoading(true);
      setPageError("");

      try {
        await loadReferenceData();
      } catch (error) {
        setPageError(formatError(error));
      } finally {
        setLoading(false);
      }
    };

    initialize();
  }, [loadReferenceData]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearch(filters.search);
      setPage(0);
    }, 400);

    return () => clearTimeout(timeout);
  }, [filters.search]);

  useEffect(() => {
    if (!loading) {
      loadAssignments();
      loadStatistics();
    }
  }, [
    loading,
    loadAssignments,
    loadStatistics,
  ]);

  const updateFilter = (field, value) => {
    setFilters((current) => ({
      ...current,
      [field]: value,
    }));

    setPage(0);
  };

  const clearFilters = () => {
    setFilters(emptyFilters);
    setDebouncedSearch("");
    setPage(0);
  };

  const updateForm = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    if (formErrors[field]) {
      setFormErrors((current) => ({
        ...current,
        [field]: "",
      }));
    }

    setFormError("");
  };

  const openCreateDialog = () => {
    const activeYear = academicYears.find(
      (year) => year.active
    );

    const activeTerm = terms.find(
      (term) =>
        term.active &&
        (!activeYear ||
          String(term.academic_year) ===
            String(activeYear.id))
    );

    setEditingAssignment(null);
    setForm({
      ...emptyForm,
      academic_year: activeYear?.id || "",
      term: activeTerm?.id || "",
    });
    setFormErrors({});
    setFormError("");
    setDialogOpen(true);
  };

  const openEditDialog = (assignment) => {
    const selectedClass = classes.find(
      (item) =>
        String(item.id) ===
        String(assignment.class_section)
    );

    setEditingAssignment(assignment);

    setForm({
      teacher: assignment.teacher || "",
      academic_year:
        assignment.academic_year || "",
      term: assignment.term || "",
      grade: selectedClass?.grade || "",
      class_section:
        assignment.class_section || "",
      subject: assignment.subject || "",
      weekly_periods:
        assignment.weekly_periods || 3,
      is_class_teacher: Boolean(
        assignment.is_class_teacher
      ),
      active:
        assignment.active !== undefined
          ? Boolean(assignment.active)
          : true,
      notes: assignment.notes || "",
    });

    setFormErrors({});
    setFormError("");
    setDialogOpen(true);
  };

  const closeDialog = () => {
    if (saving) {
      return;
    }

    setDialogOpen(false);
    setEditingAssignment(null);
    setForm(emptyForm);
    setFormErrors({});
    setFormError("");
  };

  const validateForm = () => {
    const errors = {};

    if (!form.teacher) {
      errors.teacher =
        "Please select a teacher.";
    }

    if (!form.academic_year) {
      errors.academic_year =
        "Please select an academic year.";
    }

    if (!form.term) {
      errors.term =
        "Please select a term.";
    }

    if (!form.grade) {
      errors.grade =
        "Please select a grade.";
    }

    if (!form.class_section) {
      errors.class_section =
        "Please select a class.";
    }

    if (!form.subject) {
      errors.subject =
        "Please select a subject.";
    }

    const periods = Number(
      form.weekly_periods
    );

    if (!periods || periods < 1) {
      errors.weekly_periods =
        "Weekly periods must be at least 1.";
    }

    if (periods > 20) {
      errors.weekly_periods =
        "Weekly periods cannot exceed 20.";
    }

    setFormErrors(errors);

    return Object.keys(errors).length === 0;
  };

  const saveAssignment = async () => {
    if (!validateForm()) {
      return;
    }

    setSaving(true);
    setFormError("");

    const payload = {
      teacher: form.teacher,
      academic_year: form.academic_year,
      term: form.term,
      class_section: form.class_section,
      subject: form.subject,
      weekly_periods: Number(
        form.weekly_periods
      ),
      is_class_teacher:
        form.is_class_teacher,
      active: form.active,
      notes: form.notes.trim(),
    };

    try {
      if (editingAssignment) {
        await TeacherAssignmentAPI.updateAssignment(
          editingAssignment.id,
          payload
        );

        showMessage(
          "Teacher assignment updated successfully."
        );
      } else {
        await TeacherAssignmentAPI.createAssignment(
          payload
        );

        showMessage(
          "Teacher assigned successfully."
        );
      }

      setDialogOpen(false);
      setEditingAssignment(null);
      setForm(emptyForm);

      await Promise.all([
        loadAssignments(),
        loadStatistics(),
      ]);
    } catch (error) {
      const data = error?.response?.data;

      if (data && typeof data === "object") {
        const fieldErrors = {};

        Object.entries(data).forEach(
          ([field, value]) => {
            fieldErrors[field] = Array.isArray(
              value
            )
              ? value.join(" ")
              : typeof value === "object"
                ? Object.values(value)
                    .flat()
                    .join(" ")
                : String(value);
          }
        );

        setFormErrors(fieldErrors);
      }

      setFormError(formatError(error));
    } finally {
      setSaving(false);
    }
  };

  const requestDelete = (assignment) => {
    setAssignmentToDelete(assignment);
    setDeleteOpen(true);
  };

  const deleteAssignment = async () => {
    if (!assignmentToDelete?.id) {
      return;
    }

    setDeleting(true);

    try {
      await TeacherAssignmentAPI.deleteAssignment(
        assignmentToDelete.id
      );

      showMessage(
        "Teacher assignment deleted successfully."
      );

      setDeleteOpen(false);
      setAssignmentToDelete(null);

      if (
        assignments.length === 1 &&
        page > 0
      ) {
        setPage((current) => current - 1);
      } else {
        await loadAssignments();
      }

      await loadStatistics();
    } catch (error) {
      showMessage(formatError(error), "error");
    } finally {
      setDeleting(false);
    }
  };

  const openWorkload = async () => {
    setWorkloadOpen(true);
    setWorkloadLoading(true);

    try {
      const params = {};

      if (filters.academic_year) {
        params.academic_year =
          filters.academic_year;
      }

      if (filters.term) {
        params.term = filters.term;
      }

      const response =
        await TeacherAssignmentAPI.getWorkload(
          params
        );

      setWorkload(
        Array.isArray(response.data)
          ? response.data
          : response.data.results || []
      );
    } catch (error) {
      showMessage(formatError(error), "error");
      setWorkload([]);
    } finally {
      setWorkloadLoading(false);
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: "60vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Stack
          spacing={2}
          sx={{ alignItems: "center" }}
        >
          <CircularProgress />

          <Typography color="text.secondary">
            Loading teacher assignments...
          </Typography>
        </Stack>
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
            alignItems: {
              xs: "stretch",
              md: "center",
            },
            justifyContent: "space-between",
          }}
        >
          <Box>
            <Typography
              variant="h4"
              component="h1"
              sx={{
                color: "#0B2A78",
                fontWeight: 800,
              }}
            >
              Teacher Assignments
            </Typography>

            <Typography color="text.secondary">
              Assign school teachers to subjects,
              classes, academic years, and terms.
            </Typography>
          </Box>

          <Stack
            direction={{
              xs: "column",
              sm: "row",
            }}
            spacing={1}
          >
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={() => {
                loadAssignments();
                loadStatistics();
                loadReferenceData();
              }}
            >
              Refresh
            </Button>

            <Button
              variant="outlined"
              startIcon={<WorkHistory />}
              onClick={openWorkload}
              sx={{
                borderColor: "#0B2A78",
                color: "#0B2A78",
              }}
            >
              Teacher Workload
            </Button>

            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={openCreateDialog}
              sx={{
                bgcolor: "#C8102E",
                "&:hover": {
                  bgcolor: "#9D0C24",
                },
              }}
            >
              Assign Teacher
            </Button>
          </Stack>
        </Stack>

        {pageError && (
          <Alert severity="error">
            {pageError}
          </Alert>
        )}

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <StatCard
              title="Assignments"
              value={
                statistics.total_assignments
              }
              icon={<AssignmentInd />}
              color="#0B2A78"
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <StatCard
              title="Teachers Assigned"
              value={
                statistics.teachers_assigned
              }
              icon={<School />}
              color="#2E7D32"
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <StatCard
              title="Subjects Covered"
              value={
                statistics.subjects_covered
              }
              icon={<MenuBook />}
              color="#ED6C02"
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <StatCard
              title="Weekly Periods"
              value={
                statistics.weekly_periods
              }
              icon={<WorkHistory />}
              color="#C8102E"
            />
          </Grid>
        </Grid>

        <Paper
          variant="outlined"
          sx={{
            p: 2,
            borderRadius: 3,
          }}
        >
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                size="small"
                label="Search"
                placeholder="Teacher, subject, class, or employee ID"
                value={filters.search}
                onChange={(event) =>
                  updateFilter(
                    "search",
                    event.target.value
                  )
                }
                slotProps={{
                  input: {
                    startAdornment: (
                      <Search
                        sx={{
                          mr: 1,
                          color: "text.secondary",
                        }}
                      />
                    ),
                  },
                }}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 2 }}>
              <FormControl fullWidth size="small">
                <InputLabel>
                  Academic Year
                </InputLabel>

                <Select
                  label="Academic Year"
                  value={filters.academic_year}
                  onChange={(event) => {
                    setFilters((current) => ({
                      ...current,
                      academic_year:
                        event.target.value,
                      term: "",
                    }));
                    setPage(0);
                  }}
                >
                  <MenuItem value="">
                    All Years
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

            <Grid size={{ xs: 12, sm: 6, md: 2 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Term</InputLabel>

                <Select
                  label="Term"
                  value={filters.term}
                  onChange={(event) =>
                    updateFilter(
                      "term",
                      event.target.value
                    )
                  }
                >
                  <MenuItem value="">
                    All Terms
                  </MenuItem>

                  {filteredFilterTerms.map(
                    (term) => (
                      <MenuItem
                        key={term.id}
                        value={term.id}
                      >
                        {term.name}
                      </MenuItem>
                    )
                  )}
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 2 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Grade</InputLabel>

                <Select
                  label="Grade"
                  value={filters.grade}
                  onChange={(event) => {
                    setFilters((current) => ({
                      ...current,
                      grade: event.target.value,
                      class_section: "",
                    }));
                    setPage(0);
                  }}
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

            <Grid size={{ xs: 12, sm: 6, md: 2 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Class</InputLabel>

                <Select
                  label="Class"
                  value={filters.class_section}
                  onChange={(event) =>
                    updateFilter(
                      "class_section",
                      event.target.value
                    )
                  }
                >
                  <MenuItem value="">
                    All Classes
                  </MenuItem>

                  {filteredFilterClasses.map(
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

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Teacher</InputLabel>

                <Select
                  label="Teacher"
                  value={filters.teacher}
                  onChange={(event) =>
                    updateFilter(
                      "teacher",
                      event.target.value
                    )
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
                      {teacher.employee_id} —{" "}
                      {teacher.full_name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Subject</InputLabel>

                <Select
                  label="Subject"
                  value={filters.subject}
                  onChange={(event) =>
                    updateFilter(
                      "subject",
                      event.target.value
                    )
                  }
                >
                  <MenuItem value="">
                    All Subjects
                  </MenuItem>

                  {subjects.map((subject) => (
                    <MenuItem
                      key={subject.id}
                      value={subject.id}
                    >
                      {subject.code} —{" "}
                      {subject.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>

                <Select
                  label="Status"
                  value={filters.active}
                  onChange={(event) =>
                    updateFilter(
                      "active",
                      event.target.value
                    )
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

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Button
                fullWidth
                variant="outlined"
                onClick={clearFilters}
                sx={{
                  minHeight: 40,
                  borderColor: "#C8102E",
                  color: "#C8102E",
                }}
              >
                Clear Filters
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {!tableLoading &&
        assignments.length === 0 ? (
          <EmptyState
            title="No Teacher Assignments"
            description="No teacher assignments match the selected filters."
            actionLabel="Assign Teacher"
            actionIcon={<Add />}
            onAction={openCreateDialog}
          />
        ) : (
          <Paper
            variant="outlined"
            sx={{
              borderRadius: 3,
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
                    <TableCell>Teacher</TableCell>
                    <TableCell>Year & Term</TableCell>
                    <TableCell>Class</TableCell>
                    <TableCell>Subject</TableCell>
                    <TableCell>
                      Weekly Periods
                    </TableCell>
                    <TableCell>
                      Assignment Type
                    </TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {tableLoading ? (
                    <TableRow>
                      <TableCell
                        colSpan={8}
                        align="center"
                      >
                        <Box sx={{ py: 5 }}>
                          <CircularProgress />
                        </Box>
                      </TableCell>
                    </TableRow>
                  ) : (
                    assignments.map(
                      (assignment) => (
                        <TableRow
                          key={assignment.id}
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
                                }}
                              >
                                {assignment.teacher_name
                                  ?.charAt(0)
                                  .toUpperCase() ||
                                  "T"}
                              </Avatar>

                              <Box>
                                <Typography
                                  fontWeight={700}
                                >
                                  {
                                    assignment.teacher_name
                                  }
                                </Typography>

                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                >
                                  {
                                    assignment.employee_id
                                  }
                                </Typography>
                              </Box>
                            </Stack>
                          </TableCell>

                          <TableCell>
                            <Typography
                              fontWeight={600}
                            >
                              {
                                assignment.academic_year_name
                              }
                            </Typography>

                            <Typography
                              variant="body2"
                              color="text.secondary"
                            >
                              {assignment.term_name}
                            </Typography>
                          </TableCell>

                          <TableCell>
                            {assignment.class_name}
                          </TableCell>

                          <TableCell>
                            <Typography
                              fontWeight={600}
                            >
                              {
                                assignment.subject_name
                              }
                            </Typography>

                            <Typography
                              variant="body2"
                              color="text.secondary"
                            >
                              {
                                assignment.subject_code
                              }
                            </Typography>
                          </TableCell>

                          <TableCell>
                            {assignment.weekly_periods}
                          </TableCell>

                          <TableCell>
                            {assignment.is_class_teacher ? (
                              <Chip
                                size="small"
                                label="Class Teacher"
                                color="primary"
                              />
                            ) : (
                              <Chip
                                size="small"
                                label="Subject Teacher"
                                variant="outlined"
                              />
                            )}
                          </TableCell>

                          <TableCell>
                            <Chip
                              size="small"
                              label={
                                assignment.active
                                  ? "Active"
                                  : "Inactive"
                              }
                              color={
                                assignment.active
                                  ? "success"
                                  : "default"
                              }
                            />
                          </TableCell>

                          <TableCell align="right">
                            <Tooltip title="Edit">
                              <IconButton
                                color="primary"
                                onClick={() =>
                                  openEditDialog(
                                    assignment
                                  )
                                }
                              >
                                <Edit />
                              </IconButton>
                            </Tooltip>

                            <Tooltip title="Delete">
                              <IconButton
                                color="error"
                                onClick={() =>
                                  requestDelete(
                                    assignment
                                  )
                                }
                              >
                                <Delete />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      )
                    )
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            <TablePagination
              component="div"
              count={totalCount}
              page={page}
              rowsPerPage={rowsPerPage}
              rowsPerPageOptions={[
                10,
                25,
                50,
                100,
              ]}
              onPageChange={(
                event,
                newPage
              ) => setPage(newPage)}
              onRowsPerPageChange={(event) => {
                setRowsPerPage(
                  Number(event.target.value)
                );
                setPage(0);
              }}
            />
          </Paper>
        )}
      </Stack>

      <Dialog
        open={dialogOpen}
        onClose={closeDialog}
        fullWidth
        maxWidth="md"
        scroll="paper"
      >
        <DialogTitle
          sx={{
            bgcolor: "#0B2A78",
            color: "white",
            fontWeight: 800,
          }}
        >
          {editingAssignment
            ? "Edit Teacher Assignment"
            : "Assign Teacher"}
        </DialogTitle>

        <DialogContent dividers sx={{ pt: 3 }}>
          {formError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {formError}
            </Alert>
          )}

          <Grid container spacing={2}>
            <Grid size={12}>
              <FormControl
                fullWidth
                required
                error={Boolean(
                  formErrors.teacher
                )}
              >
                <InputLabel>Teacher</InputLabel>

                <Select
                  label="Teacher"
                  value={form.teacher}
                  onChange={(event) =>
                    updateForm(
                      "teacher",
                      event.target.value
                    )
                  }
                >
                  {teachers.map((teacher) => (
                    <MenuItem
                      key={teacher.id}
                      value={teacher.id}
                    >
                      {teacher.employee_id} —{" "}
                      {teacher.full_name}
                    </MenuItem>
                  ))}
                </Select>

                {formErrors.teacher && (
                  <FormHelperText>
                    {formErrors.teacher}
                  </FormHelperText>
                )}
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl
                fullWidth
                required
                error={Boolean(
                  formErrors.academic_year
                )}
              >
                <InputLabel>
                  Academic Year
                </InputLabel>

                <Select
                  label="Academic Year"
                  value={form.academic_year}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      academic_year:
                        event.target.value,
                      term: "",
                    }))
                  }
                >
                  {academicYears.map((year) => (
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

                {formErrors.academic_year && (
                  <FormHelperText>
                    {formErrors.academic_year}
                  </FormHelperText>
                )}
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl
                fullWidth
                required
                error={Boolean(
                  formErrors.term
                )}
              >
                <InputLabel>Term</InputLabel>

                <Select
                  label="Term"
                  value={form.term}
                  disabled={!form.academic_year}
                  onChange={(event) =>
                    updateForm(
                      "term",
                      event.target.value
                    )
                  }
                >
                  {filteredFormTerms.map(
                    (term) => (
                      <MenuItem
                        key={term.id}
                        value={term.id}
                      >
                        {term.name}
                        {term.active
                          ? " — Active"
                          : ""}
                      </MenuItem>
                    )
                  )}
                </Select>

                {formErrors.term && (
                  <FormHelperText>
                    {formErrors.term}
                  </FormHelperText>
                )}
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl
                fullWidth
                required
                error={Boolean(
                  formErrors.grade
                )}
              >
                <InputLabel>Grade</InputLabel>

                <Select
                  label="Grade"
                  value={form.grade}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      grade: event.target.value,
                      class_section: "",
                    }))
                  }
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

                {formErrors.grade && (
                  <FormHelperText>
                    {formErrors.grade}
                  </FormHelperText>
                )}
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl
                fullWidth
                required
                error={Boolean(
                  formErrors.class_section
                )}
              >
                <InputLabel>Class</InputLabel>

                <Select
                  label="Class"
                  value={form.class_section}
                  disabled={!form.grade}
                  onChange={(event) =>
                    updateForm(
                      "class_section",
                      event.target.value
                    )
                  }
                >
                  {filteredFormClasses.map(
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

                {formErrors.class_section && (
                  <FormHelperText>
                    {formErrors.class_section}
                  </FormHelperText>
                )}
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, md: 8 }}>
              <FormControl
                fullWidth
                required
                error={Boolean(
                  formErrors.subject
                )}
              >
                <InputLabel>Subject</InputLabel>

                <Select
                  label="Subject"
                  value={form.subject}
                  onChange={(event) =>
                    updateForm(
                      "subject",
                      event.target.value
                    )
                  }
                >
                  {subjects.map((subject) => (
                    <MenuItem
                      key={subject.id}
                      value={subject.id}
                    >
                      {subject.code} —{" "}
                      {subject.name}
                    </MenuItem>
                  ))}
                </Select>

                {formErrors.subject && (
                  <FormHelperText>
                    {formErrors.subject}
                  </FormHelperText>
                )}
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                required
                type="number"
                label="Weekly Periods"
                value={form.weekly_periods}
                error={Boolean(
                  formErrors.weekly_periods
                )}
                helperText={
                  formErrors.weekly_periods
                }
                slotProps={{
                  htmlInput: {
                    min: 1,
                    max: 20,
                  },
                }}
                onChange={(event) =>
                  updateForm(
                    "weekly_periods",
                    event.target.value
                  )
                }
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={
                      form.is_class_teacher
                    }
                    onChange={(event) =>
                      updateForm(
                        "is_class_teacher",
                        event.target.checked
                      )
                    }
                  />
                }
                label="Assign as Class Teacher"
              />

              {formErrors.is_class_teacher && (
                <FormHelperText error>
                  {formErrors.is_class_teacher}
                </FormHelperText>
              )}
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
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
                    updateForm(
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

            <Grid size={12}>
              <TextField
                fullWidth
                multiline
                minRows={3}
                label="Notes"
                value={form.notes}
                onChange={(event) =>
                  updateForm(
                    "notes",
                    event.target.value
                  )
                }
              />
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={closeDialog}
            disabled={saving}
          >
            Cancel
          </Button>

          <Button
            variant="contained"
            onClick={saveAssignment}
            disabled={saving}
            startIcon={
              saving ? (
                <CircularProgress
                  size={18}
                  color="inherit"
                />
              ) : editingAssignment ? (
                <Edit />
              ) : (
                <Add />
              )
            }
            sx={{
              bgcolor: "#C8102E",
              "&:hover": {
                bgcolor: "#9D0C24",
              },
            }}
          >
            {saving
              ? "Saving..."
              : editingAssignment
                ? "Update Assignment"
                : "Assign Teacher"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={workloadOpen}
        onClose={() => setWorkloadOpen(false)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle
          sx={{
            color: "#0B2A78",
            fontWeight: 800,
          }}
        >
          Teacher Workload Summary
        </DialogTitle>

        <Divider />

        <DialogContent>
          {workloadLoading ? (
            <Box
              sx={{
                py: 6,
                display: "flex",
                justifyContent: "center",
              }}
            >
              <CircularProgress />
            </Box>
          ) : workload.length === 0 ? (
            <Typography
              color="text.secondary"
              sx={{
                py: 5,
                textAlign: "center",
              }}
            >
              No teacher workload records found.
            </Typography>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Teacher</TableCell>
                    <TableCell>Assignments</TableCell>
                    <TableCell>Classes</TableCell>
                    <TableCell>Subjects</TableCell>
                    <TableCell>
                      Weekly Periods
                    </TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {workload.map((item) => (
                    <TableRow key={item.teacher_id}>
                      <TableCell>
                        <Typography
                          fontWeight={700}
                        >
                          {item.teacher_name}
                        </Typography>

                        <Typography
                          variant="body2"
                          color="text.secondary"
                        >
                          {item.employee_id}
                        </Typography>
                      </TableCell>

                      <TableCell>
                        {item.assignment_count}
                      </TableCell>

                      <TableCell>
                        {item.class_count}
                      </TableCell>

                      <TableCell>
                        {item.subject_count}
                      </TableCell>

                      <TableCell>
                        <Chip
                          label={
                            item.weekly_periods
                          }
                          color={
                            item.weekly_periods > 15
                              ? "warning"
                              : "primary"
                          }
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>

        <DialogActions>
          <Button
            onClick={() =>
              setWorkloadOpen(false)
            }
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={deleteOpen}
        title="Delete Teacher Assignment"
        message={
          assignmentToDelete
            ? `Delete the assignment of ${assignmentToDelete.teacher_name} to teach ${assignmentToDelete.subject_name} in ${assignmentToDelete.class_name}?`
            : ""
        }
        confirmLabel="Delete"
        cancelLabel="Cancel"
        loading={deleting}
        onClose={() => {
          if (!deleting) {
            setDeleteOpen(false);
            setAssignmentToDelete(null);
          }
        }}
        onConfirm={deleteAssignment}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={() =>
          setSnackbar((current) => ({
            ...current,
            open: false,
          }))
        }
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
      >
        <Alert
          severity={snackbar.severity}
          variant="filled"
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

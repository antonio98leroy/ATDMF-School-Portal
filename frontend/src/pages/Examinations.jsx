import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Add,
  AssignmentTurnedIn,
  Calculate,
  CheckCircle,
  FactCheck,
  MenuBook,
  Publish,
  Refresh,
  Save,
  School,
} from "@mui/icons-material";

import {
  Alert,
  Box,
  Button,
  Checkbox,
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
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";

import StatCard from "../components/common/StatCard";
import EmptyState from "../components/common/EmptyState";

import { ExaminationAPI } from "../api/examinations";

const emptyStatistics = {
  students: 0,
  subjects: 0,
  savedResults: 0,
  approvedResults: 0,
};

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

  if (typeof data === "string") {
    return data;
  }

  if (data.detail) {
    return data.detail;
  }

  if (data.errors) {
    return data.errors
      .map((item) => {
        const messages = Object.entries(
          item.errors || {}
        )
          .map(([field, value]) => {
            const text = Array.isArray(value)
              ? value.join(" ")
              : String(value);

            return `${field}: ${text}`;
          })
          .join(" ");

        return `Row ${item.row}: ${messages}`;
      })
      .join(" ");
  }

  return Object.entries(data)
    .map(([field, value]) => {
      const text = Array.isArray(value)
        ? value.join(" ")
        : typeof value === "object"
          ? Object.values(value).flat().join(" ")
          : String(value);

      return `${field.replaceAll("_", " ")}: ${text}`;
    })
    .join(" ");
}

function numericValue(value) {
  const number = Number(value);

  return Number.isFinite(number) ? number : 0;
}

function calculatePeriodTotal(row) {
  return (
    numericValue(row.assignment_score) +
    numericValue(row.class_activity_score) +
    numericValue(row.quiz_score) +
    numericValue(row.period_test_score)
  );
}

export default function Examinations() {
  const [tab, setTab] = useState(0);

  const [academicYears, setAcademicYears] =
    useState([]);
  const [grades, setGrades] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [periods, setPeriods] = useState([]);
  const [enrollments, setEnrollments] =
    useState([]);
  const [students, setStudents] = useState([]);

  const [academicYear, setAcademicYear] =
    useState("");
  const [grade, setGrade] = useState("");
  const [classSection, setClassSection] =
    useState("");
  const [subject, setSubject] = useState("");
  const [period, setPeriod] = useState("");

  const [rows, setRows] = useState([]);
  const [selectedResults, setSelectedResults] =
    useState([]);

  const [statistics, setStatistics] = useState(
    emptyStatistics
  );

  const [loading, setLoading] = useState(true);
  const [rowsLoading, setRowsLoading] =
    useState(false);
  const [saving, setSaving] = useState(false);
  const [actionLoading, setActionLoading] =
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

  const activeYear = useMemo(
    () =>
      academicYears.find(
        (item) =>
          String(item.id) ===
          String(academicYear)
      ),
    [academicYears, academicYear]
  );

  const selectedPeriod = useMemo(
    () =>
      periods.find(
        (item) =>
          String(item.id) === String(period)
      ),
    [periods, period]
  );

  const isSemesterExam = Boolean(
    selectedPeriod?.is_semester_exam
  );

  const filteredClasses = useMemo(() => {
    if (!grade) {
      return classes;
    }

    return classes.filter(
      (item) =>
        String(item.grade) === String(grade)
    );
  }, [classes, grade]);

  const studentMap = useMemo(() => {
    const map = new Map();

    students.forEach((student) => {
      map.set(String(student.id), student);
    });

    return map;
  }, [students]);

  const filteredEnrollments = useMemo(() => {
    if (!academicYear || !classSection) {
      return [];
    }

    return enrollments.filter(
      (item) =>
        String(item.academic_year) ===
          String(academicYear) &&
        String(item.class_section) ===
          String(classSection) &&
        item.active !== false
    );
  }, [
    enrollments,
    academicYear,
    classSection,
  ]);

  const loadReferenceData = useCallback(
    async () => {
      const [
        yearResponse,
        gradeResponse,
        classResponse,
        subjectResponse,
        enrollmentResponse,
        studentResponse,
      ] = await Promise.all([
        ExaminationAPI.getAcademicYears(),
        ExaminationAPI.getGrades(),
        ExaminationAPI.getClasses(),
        ExaminationAPI.getSubjects(),
        ExaminationAPI.getEnrollments(),
        ExaminationAPI.getStudents(),
      ]);

      const loadedYears =
        normalizeList(yearResponse);

      setAcademicYears(loadedYears);
      setGrades(normalizeList(gradeResponse));
      setClasses(normalizeList(classResponse));
      setSubjects(normalizeList(subjectResponse));
      setEnrollments(
        normalizeList(enrollmentResponse)
      );
      setStudents(normalizeList(studentResponse));

      const currentYear = loadedYears.find(
        (item) => item.active
      );

      if (currentYear) {
        setAcademicYear(currentYear.id);
      }
    },
    []
  );

  const loadPeriods = useCallback(async () => {
    if (!academicYear) {
      setPeriods([]);
      return;
    }

    try {
      const response =
        await ExaminationAPI.getPeriods({
          academic_year: academicYear,
          ordering: "order",
        });

      const loadedPeriods =
        normalizeList(response);

      setPeriods(loadedPeriods);

      if (
        period &&
        !loadedPeriods.some(
          (item) =>
            String(item.id) === String(period)
        )
      ) {
        setPeriod("");
      }
    } catch (error) {
      showMessage(
        getErrorMessage(error),
        "error"
      );
    }
  }, [academicYear, period]);

  useEffect(() => {
    const initialize = async () => {
      setLoading(true);
      setPageError("");

      try {
        await loadReferenceData();
      } catch (error) {
        setPageError(getErrorMessage(error));
      } finally {
        setLoading(false);
      }
    };

    initialize();
  }, [loadReferenceData]);

  useEffect(() => {
    if (!loading && academicYear) {
      loadPeriods();
    }
  }, [
    loading,
    academicYear,
    loadPeriods,
  ]);

  const createPeriods = async () => {
    if (!academicYear) {
      showMessage(
        "Please select an academic year.",
        "warning"
      );
      return;
    }

    setActionLoading(true);

    try {
      const response =
        await ExaminationAPI.createYearPeriods(
          academicYear
        );

      setPeriods(response.data.periods || []);

      showMessage(
        `${response.data.created_count} result periods created successfully.`
      );
    } catch (error) {
      showMessage(
        getErrorMessage(error),
        "error"
      );
    } finally {
      setActionLoading(false);
    }
  };

  const loadScoreSheet = async () => {
    if (
      !academicYear ||
      !classSection ||
      !subject ||
      !period
    ) {
      showMessage(
        "Select the academic year, class, subject, and result period.",
        "warning"
      );
      return;
    }

    setRowsLoading(true);
    setPageError("");
    setSelectedResults([]);

    try {
      const response =
        await ExaminationAPI.getResults({
          academic_year: academicYear,
          class_section: classSection,
          subject,
          period,
          page_size: 500,
        });

      const existingResults =
        normalizeList(response);

      const resultMap = new Map();

      existingResults.forEach((result) => {
        resultMap.set(
          String(result.enrollment),
          result
        );
      });

      const scoreRows = filteredEnrollments
        .map((enrollment) => {
          const student = studentMap.get(
            String(enrollment.student)
          );

          const existing = resultMap.get(
            String(enrollment.id)
          );

          return {
            id: existing?.id || null,
            enrollment: enrollment.id,
            student_id: enrollment.student,
            admission_number:
              student?.admission_number || "",
            student_name:
              student?.full_name ||
              [
                student?.first_name,
                student?.middle_name,
                student?.last_name,
              ]
                .filter(Boolean)
                .join(" ") ||
              "Unknown Student",

            assignment_score:
              existing?.assignment_score ?? 0,

            class_activity_score:
              existing?.class_activity_score ??
              0,

            quiz_score:
              existing?.quiz_score ?? 0,

            period_test_score:
              existing?.period_test_score ?? 0,

            semester_exam_score:
              existing?.semester_exam_score ??
              0,

            remarks: existing?.remarks || "",
            approved:
              existing?.approved || false,
            published:
              existing?.published || false,
          };
        })
        .sort((a, b) =>
          a.student_name.localeCompare(
            b.student_name
          )
        );

      setRows(scoreRows);

      setStatistics({
        students: scoreRows.length,
        subjects: subjects.length,
        savedResults: scoreRows.filter(
          (item) => item.id
        ).length,
        approvedResults: scoreRows.filter(
          (item) => item.approved
        ).length,
      });
    } catch (error) {
      setRows([]);
      setPageError(getErrorMessage(error));
    } finally {
      setRowsLoading(false);
    }
  };

  const updateRow = (
    enrollmentId,
    field,
    value
  ) => {
    setRows((current) =>
      current.map((item) =>
        item.enrollment === enrollmentId
          ? {
              ...item,
              [field]: value,
            }
          : item
      )
    );
  };

  const validateRows = () => {
    for (const row of rows) {
      if (isSemesterExam) {
        const examScore = numericValue(
          row.semester_exam_score
        );

        if (
          examScore < 0 ||
          examScore > 100
        ) {
          showMessage(
            `${row.student_name}: Semester exam score must be between 0 and 100.`,
            "error"
          );
          return false;
        }
      } else {
        const assignment = numericValue(
          row.assignment_score
        );

        const activity = numericValue(
          row.class_activity_score
        );

        const quiz = numericValue(
          row.quiz_score
        );

        const test = numericValue(
          row.period_test_score
        );

        if (assignment < 0 || assignment > 10) {
          showMessage(
            `${row.student_name}: Assignment score must be between 0 and 10.`,
            "error"
          );
          return false;
        }

        if (activity < 0 || activity > 10) {
          showMessage(
            `${row.student_name}: Activity score must be between 0 and 10.`,
            "error"
          );
          return false;
        }

        if (quiz < 0 || quiz > 30) {
          showMessage(
            `${row.student_name}: Quiz score must be between 0 and 30.`,
            "error"
          );
          return false;
        }

        if (test < 0 || test > 50) {
          showMessage(
            `${row.student_name}: Period test score must be between 0 and 50.`,
            "error"
          );
          return false;
        }
      }
    }

    return true;
  };

  const saveResults = async () => {
    if (rows.length === 0) {
      showMessage(
        "Load a score sheet first.",
        "warning"
      );
      return;
    }

    if (!selectedPeriod?.score_entry_open) {
      showMessage(
        "Score entry is closed for this period.",
        "error"
      );
      return;
    }

    if (!validateRows()) {
      return;
    }

    setSaving(true);

    const records = rows.map((row) => ({
      ...(row.id ? { id: row.id } : {}),
      enrollment: row.enrollment,
      subject,
      period,

      assignment_score: isSemesterExam
        ? 0
        : numericValue(
            row.assignment_score
          ),

      class_activity_score: isSemesterExam
        ? 0
        : numericValue(
            row.class_activity_score
          ),

      quiz_score: isSemesterExam
        ? 0
        : numericValue(row.quiz_score),

      period_test_score: isSemesterExam
        ? 0
        : numericValue(
            row.period_test_score
          ),

      semester_exam_score: isSemesterExam
        ? numericValue(
            row.semester_exam_score
          )
        : 0,

      remarks: row.remarks || "",
    }));

    try {
      await ExaminationAPI.bulkSaveResults(
        records
      );

      showMessage(
        "Student scores saved successfully."
      );

      await loadScoreSheet();
    } catch (error) {
      showMessage(
        getErrorMessage(error),
        "error"
      );
    } finally {
      setSaving(false);
    }
  };

  const toggleSelected = (resultId) => {
    if (!resultId) {
      return;
    }

    setSelectedResults((current) =>
      current.includes(resultId)
        ? current.filter(
            (id) => id !== resultId
          )
        : [...current, resultId]
    );
  };

  const toggleSelectAll = () => {
    const availableIds = rows
      .filter((item) => item.id)
      .map((item) => item.id);

    const allSelected =
      availableIds.length > 0 &&
      availableIds.every((id) =>
        selectedResults.includes(id)
      );

    setSelectedResults(
      allSelected ? [] : availableIds
    );
  };

  const approveSelected = async () => {
    if (selectedResults.length === 0) {
      showMessage(
        "Select at least one saved result.",
        "warning"
      );
      return;
    }

    setActionLoading(true);

    try {
      const response =
        await ExaminationAPI.approveResults(
          selectedResults
        );

      showMessage(
        `${response.data.approved_count} results approved successfully.`
      );

      setSelectedResults([]);
      await loadScoreSheet();
    } catch (error) {
      showMessage(
        getErrorMessage(error),
        "error"
      );
    } finally {
      setActionLoading(false);
    }
  };

  const publishSelected = async () => {
    if (selectedResults.length === 0) {
      showMessage(
        "Select at least one approved result.",
        "warning"
      );
      return;
    }

    setActionLoading(true);

    try {
      const response =
        await ExaminationAPI.publishResults(
          selectedResults
        );

      showMessage(
        `${response.data.published_count} results published successfully.`
      );

      setSelectedResults([]);
      await loadScoreSheet();
    } catch (error) {
      showMessage(
        getErrorMessage(error),
        "error"
      );
    } finally {
      setActionLoading(false);
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
        <Stack
          spacing={2}
          sx={{
            alignItems: "center",
          }}
        >
          <CircularProgress />

          <Typography color="text.secondary">
            Loading examination system...
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
              Examinations & Results
            </Typography>

            <Typography color="text.secondary">
              Manage periods, enter scores,
              approve results, and publish
              student performance.
            </Typography>
          </Box>

          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={async () => {
              await loadReferenceData();
              await loadPeriods();

              if (rows.length > 0) {
                await loadScoreSheet();
              }
            }}
          >
            Refresh
          </Button>
        </Stack>

        {pageError && (
          <Alert severity="error">
            {pageError}
          </Alert>
        )}

        <Tabs
          value={tab}
          onChange={(event, value) =>
            setTab(value)
          }
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab
            label="Score Entry"
            icon={<Calculate />}
            iconPosition="start"
          />

          <Tab
            label="Period Management"
            icon={<FactCheck />}
            iconPosition="start"
          />
        </Tabs>

        <Grid container spacing={2}>
          <Grid
            size={{
              xs: 12,
              sm: 6,
              lg: 3,
            }}
          >
            <StatCard
              title="Students"
              value={statistics.students}
              icon={<School />}
              color="#0B2A78"
            />
          </Grid>

          <Grid
            size={{
              xs: 12,
              sm: 6,
              lg: 3,
            }}
          >
            <StatCard
              title="Subjects"
              value={statistics.subjects}
              icon={<MenuBook />}
              color="#2E7D32"
            />
          </Grid>

          <Grid
            size={{
              xs: 12,
              sm: 6,
              lg: 3,
            }}
          >
            <StatCard
              title="Saved Results"
              value={statistics.savedResults}
              icon={<Save />}
              color="#ED6C02"
            />
          </Grid>

          <Grid
            size={{
              xs: 12,
              sm: 6,
              lg: 3,
            }}
          >
            <StatCard
              title="Approved Results"
              value={
                statistics.approvedResults
              }
              icon={<CheckCircle />}
              color="#C8102E"
            />
          </Grid>
        </Grid>

        {tab === 0 && (
          <>
            <Paper
              variant="outlined"
              sx={{
                p: 2,
                borderRadius: 3,
              }}
            >
              <Grid container spacing={2}>
                <Grid
                  size={{
                    xs: 12,
                    sm: 6,
                    md: 2.4,
                  }}
                >
                  <FormControl
                    fullWidth
                    size="small"
                  >
                    <InputLabel>
                      Academic Year
                    </InputLabel>

                    <Select
                      label="Academic Year"
                      value={academicYear}
                      onChange={(event) => {
                        setAcademicYear(
                          event.target.value
                        );
                        setPeriod("");
                        setRows([]);
                      }}
                    >
                      {academicYears.map(
                        (item) => (
                          <MenuItem
                            key={item.id}
                            value={item.id}
                          >
                            {item.name}
                            {item.active
                              ? " — Active"
                              : ""}
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
                    md: 2.4,
                  }}
                >
                  <FormControl
                    fullWidth
                    size="small"
                  >
                    <InputLabel>
                      Grade
                    </InputLabel>

                    <Select
                      label="Grade"
                      value={grade}
                      onChange={(event) => {
                        setGrade(
                          event.target.value
                        );
                        setClassSection("");
                        setRows([]);
                      }}
                    >
                      <MenuItem value="">
                        Select Grade
                      </MenuItem>

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

                <Grid
                  size={{
                    xs: 12,
                    sm: 6,
                    md: 2.4,
                  }}
                >
                  <FormControl
                    fullWidth
                    size="small"
                  >
                    <InputLabel>
                      Class
                    </InputLabel>

                    <Select
                      label="Class"
                      value={classSection}
                      disabled={!grade}
                      onChange={(event) => {
                        setClassSection(
                          event.target.value
                        );
                        setRows([]);
                      }}
                    >
                      {filteredClasses.map(
                        (item) => (
                          <MenuItem
                            key={item.id}
                            value={item.id}
                          >
                            {item.grade_name
                              ? `${item.grade_name} `
                              : ""}
                            {item.name}
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
                    md: 2.4,
                  }}
                >
                  <FormControl
                    fullWidth
                    size="small"
                  >
                    <InputLabel>
                      Subject
                    </InputLabel>

                    <Select
                      label="Subject"
                      value={subject}
                      onChange={(event) => {
                        setSubject(
                          event.target.value
                        );
                        setRows([]);
                      }}
                    >
                      {subjects.map((item) => (
                        <MenuItem
                          key={item.id}
                          value={item.id}
                        >
                          {item.code} — {item.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid
                  size={{
                    xs: 12,
                    sm: 6,
                    md: 2.4,
                  }}
                >
                  <FormControl
                    fullWidth
                    size="small"
                  >
                    <InputLabel>
                      Result Period
                    </InputLabel>

                    <Select
                      label="Result Period"
                      value={period}
                      onChange={(event) => {
                        setPeriod(
                          event.target.value
                        );
                        setRows([]);
                      }}
                    >
                      {periods.map((item) => (
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

                <Grid size={12}>
                  <Stack
                    direction={{
                      xs: "column",
                      sm: "row",
                    }}
                    spacing={1}
                    sx={{
                      justifyContent:
                        "flex-end",
                    }}
                  >
                    <Button
                      variant="contained"
                      startIcon={
                        rowsLoading ? (
                          <CircularProgress
                            size={18}
                            color="inherit"
                          />
                        ) : (
                          <AssignmentTurnedIn />
                        )
                      }
                      onClick={loadScoreSheet}
                      disabled={rowsLoading}
                      sx={{
                        bgcolor: "#0B2A78",
                      }}
                    >
                      Load Score Sheet
                    </Button>
                  </Stack>
                </Grid>
              </Grid>
            </Paper>

            {selectedPeriod && (
              <Alert
                severity={
                  selectedPeriod.score_entry_open
                    ? "info"
                    : "warning"
                }
              >
                <strong>
                  {selectedPeriod.name}
                </strong>

                {" — "}

                {isSemesterExam
                  ? "Enter the semester examination score out of 100."
                  : "Assignment: 10, Attendance/Participation: 10, Quizzes: 30, Period Test: 50."}

                {!selectedPeriod.score_entry_open &&
                  " Score entry is currently closed."}
              </Alert>
            )}

            {rows.length === 0 &&
            !rowsLoading ? (
              <EmptyState
                title="No Score Sheet Loaded"
                description="Select an academic year, class, subject, and result period, then click Load Score Sheet."
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
                  spacing={1}
                  sx={{
                    p: 2,
                    alignItems: {
                      xs: "stretch",
                      md: "center",
                    },
                    justifyContent:
                      "space-between",
                  }}
                >
                  <Box>
                    <Typography
                      variant="h6"
                      fontWeight={800}
                      color="#0B2A78"
                    >
                      Score Entry Sheet
                    </Typography>

                    <Typography
                      variant="body2"
                      color="text.secondary"
                    >
                      {activeYear?.name || ""} —{" "}
                      {selectedPeriod?.name || ""}
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
                      startIcon={
                        <CheckCircle />
                      }
                      onClick={approveSelected}
                      disabled={
                        actionLoading ||
                        selectedResults.length ===
                          0
                      }
                    >
                      Approve Selected
                    </Button>

                    <Button
                      variant="outlined"
                      startIcon={<Publish />}
                      onClick={publishSelected}
                      disabled={
                        actionLoading ||
                        selectedResults.length ===
                          0
                      }
                      sx={{
                        borderColor: "#C8102E",
                        color: "#C8102E",
                      }}
                    >
                      Publish Selected
                    </Button>

                    <Button
                      variant="contained"
                      startIcon={
                        saving ? (
                          <CircularProgress
                            size={18}
                            color="inherit"
                          />
                        ) : (
                          <Save />
                        )
                      }
                      onClick={saveResults}
                      disabled={
                        saving ||
                        !selectedPeriod
                          ?.score_entry_open
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
                        : "Save Scores"}
                    </Button>
                  </Stack>
                </Stack>

                <TableContainer>
                  <Table size="small">
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
                        <TableCell padding="checkbox">
                          <Checkbox
                            checked={
                              rows.filter(
                                (item) =>
                                  item.id
                              ).length > 0 &&
                              rows
                                .filter(
                                  (item) =>
                                    item.id
                                )
                                .every((item) =>
                                  selectedResults.includes(
                                    item.id
                                  )
                                )
                            }
                            onChange={
                              toggleSelectAll
                            }
                            sx={{
                              color: "white",
                              "&.Mui-checked": {
                                color: "white",
                              },
                            }}
                          />
                        </TableCell>

                        <TableCell>
                          Admission No.
                        </TableCell>

                        <TableCell>
                          Student
                        </TableCell>

                        {!isSemesterExam && (
                          <>
                            <TableCell>
                              Assignment /10
                            </TableCell>

                            <TableCell>
                              Activity /10
                            </TableCell>

                            <TableCell>
                              Quizzes /30
                            </TableCell>

                            <TableCell>
                              Test /50
                            </TableCell>
                          </>
                        )}

                        {isSemesterExam && (
                          <TableCell>
                            Semester Exam /100
                          </TableCell>
                        )}

                        <TableCell>
                          Total /100
                        </TableCell>

                        <TableCell>
                          Remarks
                        </TableCell>

                        <TableCell>
                          Status
                        </TableCell>
                      </TableRow>
                    </TableHead>

                    <TableBody>
                      {rowsLoading ? (
                        <TableRow>
                          <TableCell
                            colSpan={11}
                            align="center"
                          >
                            <Box sx={{ py: 5 }}>
                              <CircularProgress />
                            </Box>
                          </TableCell>
                        </TableRow>
                      ) : (
                        rows.map((row) => {
                          const total =
                            isSemesterExam
                              ? numericValue(
                                  row.semester_exam_score
                                )
                              : calculatePeriodTotal(
                                  row
                                );

                          return (
                            <TableRow
                              key={
                                row.enrollment
                              }
                              hover
                            >
                              <TableCell padding="checkbox">
                                <Checkbox
                                  disabled={!row.id}
                                  checked={
                                    row.id
                                      ? selectedResults.includes(
                                          row.id
                                        )
                                      : false
                                  }
                                  onChange={() =>
                                    toggleSelected(
                                      row.id
                                    )
                                  }
                                />
                              </TableCell>

                              <TableCell>
                                {
                                  row.admission_number
                                }
                              </TableCell>

                              <TableCell>
                                <Typography
                                  fontWeight={
                                    700
                                  }
                                >
                                  {
                                    row.student_name
                                  }
                                </Typography>
                              </TableCell>

                              {!isSemesterExam && (
                                <>
                                  <ScoreField
                                    value={
                                      row.assignment_score
                                    }
                                    max={10}
                                    onChange={(
                                      value
                                    ) =>
                                      updateRow(
                                        row.enrollment,
                                        "assignment_score",
                                        value
                                      )
                                    }
                                  />

                                  <ScoreField
                                    value={
                                      row.class_activity_score
                                    }
                                    max={10}
                                    onChange={(
                                      value
                                    ) =>
                                      updateRow(
                                        row.enrollment,
                                        "class_activity_score",
                                        value
                                      )
                                    }
                                  />

                                  <ScoreField
                                    value={
                                      row.quiz_score
                                    }
                                    max={30}
                                    onChange={(
                                      value
                                    ) =>
                                      updateRow(
                                        row.enrollment,
                                        "quiz_score",
                                        value
                                      )
                                    }
                                  />

                                  <ScoreField
                                    value={
                                      row.period_test_score
                                    }
                                    max={50}
                                    onChange={(
                                      value
                                    ) =>
                                      updateRow(
                                        row.enrollment,
                                        "period_test_score",
                                        value
                                      )
                                    }
                                  />
                                </>
                              )}

                              {isSemesterExam && (
                                <ScoreField
                                  value={
                                    row.semester_exam_score
                                  }
                                  max={100}
                                  onChange={(
                                    value
                                  ) =>
                                    updateRow(
                                      row.enrollment,
                                      "semester_exam_score",
                                      value
                                    )
                                  }
                                />
                              )}

                              <TableCell>
                                <Chip
                                  label={total.toFixed(
                                    2
                                  )}
                                  color={
                                    total >= 70
                                      ? "success"
                                      : total >= 50
                                        ? "warning"
                                        : "error"
                                  }
                                  size="small"
                                />
                              </TableCell>

                              <TableCell>
                                <TextField
                                  size="small"
                                  value={
                                    row.remarks
                                  }
                                  placeholder="Optional"
                                  onChange={(
                                    event
                                  ) =>
                                    updateRow(
                                      row.enrollment,
                                      "remarks",
                                      event.target
                                        .value
                                    )
                                  }
                                  sx={{
                                    minWidth: 150,
                                  }}
                                />
                              </TableCell>

                              <TableCell>
                                <Stack
                                  direction="row"
                                  spacing={0.5}
                                >
                                  {row.approved && (
                                    <Chip
                                      size="small"
                                      label="Approved"
                                      color="success"
                                    />
                                  )}

                                  {row.published && (
                                    <Chip
                                      size="small"
                                      label="Published"
                                      color="primary"
                                    />
                                  )}

                                  {!row.id && (
                                    <Chip
                                      size="small"
                                      label="Unsaved"
                                    />
                                  )}
                                </Stack>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            )}
          </>
        )}

        {tab === 1 && (
          <Paper
            variant="outlined"
            sx={{
              p: 3,
              borderRadius: 3,
            }}
          >
            <Stack spacing={3}>
              <Box>
                <Typography
                  variant="h5"
                  fontWeight={800}
                  color="#0B2A78"
                >
                  Result Period Management
                </Typography>

                <Typography color="text.secondary">
                  Create the eight official
                  result-entry periods for the
                  selected academic year.
                </Typography>
              </Box>

              <Grid container spacing={2}>
                <Grid
                  size={{
                    xs: 12,
                    md: 6,
                  }}
                >
                  <FormControl fullWidth>
                    <InputLabel>
                      Academic Year
                    </InputLabel>

                    <Select
                      label="Academic Year"
                      value={academicYear}
                      onChange={(event) =>
                        setAcademicYear(
                          event.target.value
                        )
                      }
                    >
                      {academicYears.map(
                        (item) => (
                          <MenuItem
                            key={item.id}
                            value={item.id}
                          >
                            {item.name}
                          </MenuItem>
                        )
                      )}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid
                  size={{
                    xs: 12,
                    md: 6,
                  }}
                >
                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={
                      actionLoading ? (
                        <CircularProgress
                          size={18}
                          color="inherit"
                        />
                      ) : (
                        <Add />
                      )
                    }
                    onClick={createPeriods}
                    disabled={actionLoading}
                    sx={{
                      minHeight: 56,
                      bgcolor: "#C8102E",
                      "&:hover": {
                        bgcolor: "#9D0C24",
                      },
                    }}
                  >
                    Create Official Periods
                  </Button>
                </Grid>
              </Grid>

              {periods.length === 0 ? (
                <EmptyState
                  title="No Result Periods"
                  description="Create the official academic-year periods to begin entering student scores."
                />
              ) : (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>
                          Order
                        </TableCell>
                        <TableCell>
                          Period
                        </TableCell>
                        <TableCell>
                          Type
                        </TableCell>
                        <TableCell>
                          Score Entry
                        </TableCell>
                        <TableCell>
                          Publication
                        </TableCell>
                      </TableRow>
                    </TableHead>

                    <TableBody>
                      {periods.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            {item.order}
                          </TableCell>

                          <TableCell>
                            <Typography
                              fontWeight={700}
                            >
                              {item.name}
                            </Typography>
                          </TableCell>

                          <TableCell>
                            <Chip
                              size="small"
                              label={
                                item.is_semester_exam
                                  ? "Semester Exam"
                                  : "Period"
                              }
                              color={
                                item.is_semester_exam
                                  ? "secondary"
                                  : "primary"
                              }
                            />
                          </TableCell>

                          <TableCell>
                            <Chip
                              size="small"
                              label={
                                item.score_entry_open
                                  ? "Open"
                                  : "Closed"
                              }
                              color={
                                item.score_entry_open
                                  ? "success"
                                  : "error"
                              }
                            />
                          </TableCell>

                          <TableCell>
                            <Chip
                              size="small"
                              label={
                                item.published
                                  ? "Published"
                                  : "Unpublished"
                              }
                              color={
                                item.published
                                  ? "success"
                                  : "default"
                              }
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Stack>
          </Paper>
        )}
      </Stack>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
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

function ScoreField({
  value,
  max,
  onChange,
}) {
  return (
    <TableCell>
      <TextField
        type="number"
        size="small"
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        slotProps={{
          htmlInput: {
            min: 0,
            max,
            step: "0.01",
          },
        }}
        sx={{
          width: 95,
        }}
      />
    </TableCell>
  );
}

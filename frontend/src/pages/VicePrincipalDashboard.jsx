import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  AssignmentInd,
  CalendarMonth,
  FactCheck,
  Groups,
  MenuBook,
  Print,
  Refresh,
  Schedule,
  School,
  WorkHistory,
} from "@mui/icons-material";

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Grid,
  Paper,
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

import {
  TeacherAssignmentAPI,
} from "../api/teacherAssignments";

import {
  TimetableAPI,
} from "../api/timetable";


function normalizeList(response) {
  if (Array.isArray(response?.data)) {
    return response.data;
  }

  return response?.data?.results || [];
}


function ActionCard({
  title,
  description,
  icon,
  onClick,
}) {
  return (
    <Card
      variant="outlined"
      sx={{
        height: "100%",
        borderRadius: 3,
      }}
    >
      <CardContent>
        <Stack
          direction="row"
          spacing={2}
          alignItems="flex-start"
        >
          <Box
            sx={{
              p: 1.25,
              borderRadius: 2,
              bgcolor: "rgba(11,42,120,.08)",
              color: "#0B2A78",
              display: "flex",
            }}
          >
            {icon}
          </Box>

          <Box sx={{ flex: 1 }}>
            <Typography
              fontWeight={900}
              color="#071B54"
            >
              {title}
            </Typography>

            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                mt: 0.5,
                mb: 1.5,
              }}
            >
              {description}
            </Typography>

            <Button
              size="small"
              onClick={onClick}
              sx={{
                fontWeight: 800,
                textTransform: "none",
              }}
            >
              Open
            </Button>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}


function SummaryCard({
  label,
  value,
}) {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2,
        borderRadius: 3,
        height: "100%",
      }}
    >
      <Typography
        variant="h4"
        fontWeight={950}
        color="#071B54"
      >
        {value ?? 0}
      </Typography>

      <Typography
        variant="body2"
        color="text.secondary"
      >
        {label}
      </Typography>
    </Paper>
  );
}


export default function VicePrincipalDashboard() {
  const navigate = useNavigate();

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [statistics, setStatistics] =
    useState({
      total_assignments: 0,
      active_assignments: 0,
      teachers_assigned: 0,
      classes_covered: 0,
      subjects_covered: 0,
      weekly_periods: 0,
    });

  const [
    timetableEntries,
    setTimetableEntries,
  ] = useState([]);

  const [workload, setWorkload] =
    useState([]);


  const loadDashboard = async () => {
    setLoading(true);
    setError("");

    try {
      const [
        statisticsResponse,
        timetableResponse,
        workloadResponse,
      ] = await Promise.all([
        TeacherAssignmentAPI.getStatistics(),

        TimetableAPI.getEntries(),

        TeacherAssignmentAPI.getWorkload(),
      ]);

      setStatistics((current) => ({
        ...current,
        ...(statisticsResponse.data || {}),
      }));

      setTimetableEntries(
        normalizeList(timetableResponse)
      );

      setWorkload(
        normalizeList(workloadResponse)
      );
    } catch (err) {
      setError(
        err?.response?.data?.detail ||
          "Unable to load Vice Principal dashboard."
      );
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    loadDashboard();
  }, []);


  const scheduledTeachers = useMemo(
    () =>
      new Set(
        timetableEntries.map(
          (entry) =>
            entry.teacher?.id
        )
      ).size,
    [timetableEntries]
  );


  const unscheduledTeachers =
    Math.max(
      0,
      Number(
        statistics.teachers_assigned || 0
      ) - scheduledTeachers
    );


  const totalWorkloadPeriods = useMemo(
    () =>
      workload.reduce(
        (sum, item) =>
          sum +
          Number(
            item.weekly_periods || 0
          ),
        0
      ),
    [workload]
  );


  if (loading) {
    return (
      <Box
        sx={{
          minHeight: 400,
          display: "grid",
          placeItems: "center",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }


  return (
    <Box>
      <Paper
        sx={{
          p: {
            xs: 2.5,
            md: 4,
          },
          borderRadius: 4,
          mb: 3,
          background:
            "linear-gradient(120deg,#071B54,#0B2A78)",
          color: "white",
          "@media print": {
            background: "white",
            color: "black",
            boxShadow: "none",
          },
        }}
      >
        <Stack
          direction={{
            xs: "column",
            md: "row",
          }}
          justifyContent="space-between"
          spacing={2}
        >
          <Box>
            <Typography
              variant="h4"
              fontWeight={950}
            >
              Vice Principal Dashboard
            </Typography>

            <Typography
              sx={{
                mt: 1,
                opacity: 0.9,
              }}
            >
              Teacher supervision, academic
              coordination, attendance,
              assessments and scheduling.
            </Typography>
          </Box>

          <Stack
            direction={{
              xs: "column",
              sm: "row",
            }}
            spacing={1}
            sx={{
              "@media print": {
                display: "none",
              },
            }}
          >
            <Button
              variant="contained"
              startIcon={<Schedule />}
              onClick={() =>
                navigate("/timetable")
              }
              sx={{
                bgcolor: "white",
                color: "#071B54",
                fontWeight: 900,
                textTransform: "none",
                "&:hover": {
                  bgcolor: "#f5f5f5",
                },
              }}
            >
              Manage Timetable
            </Button>

            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={loadDashboard}
              sx={{
                color: "white",
                borderColor:
                  "rgba(255,255,255,.7)",
              }}
            >
              Refresh
            </Button>
          </Stack>
        </Stack>
      </Paper>


      {error && (
        <Alert
          severity="error"
          sx={{ mb: 3 }}
        >
          {error}
        </Alert>
      )}


      <Grid
        container
        spacing={2}
        sx={{ mb: 4 }}
      >
        <Grid
          size={{
            xs: 12,
            sm: 6,
            md: 4,
            lg: 2,
          }}
        >
          <SummaryCard
            label="Teachers Assigned"
            value={
              statistics.teachers_assigned
            }
          />
        </Grid>

        <Grid
          size={{
            xs: 12,
            sm: 6,
            md: 4,
            lg: 2,
          }}
        >
          <SummaryCard
            label="Active Assignments"
            value={
              statistics.active_assignments
            }
          />
        </Grid>

        <Grid
          size={{
            xs: 12,
            sm: 6,
            md: 4,
            lg: 2,
          }}
        >
          <SummaryCard
            label="Classes Covered"
            value={
              statistics.classes_covered
            }
          />
        </Grid>

        <Grid
          size={{
            xs: 12,
            sm: 6,
            md: 4,
            lg: 2,
          }}
        >
          <SummaryCard
            label="Subjects Covered"
            value={
              statistics.subjects_covered
            }
          />
        </Grid>

        <Grid
          size={{
            xs: 12,
            sm: 6,
            md: 4,
            lg: 2,
          }}
        >
          <SummaryCard
            label="Scheduled Lessons"
            value={
              timetableEntries.length
            }
          />
        </Grid>

        <Grid
          size={{
            xs: 12,
            sm: 6,
            md: 4,
            lg: 2,
          }}
        >
          <SummaryCard
            label="Not Yet Scheduled"
            value={
              unscheduledTeachers
            }
          />
        </Grid>
      </Grid>


      <Typography
        variant="h6"
        fontWeight={900}
        color="#071B54"
        sx={{ mb: 2 }}
      >
        Academic Management Center
      </Typography>

      <Grid
        container
        spacing={2}
        sx={{ mb: 4 }}
      >
        <Grid
          size={{
            xs: 12,
            sm: 6,
            lg: 4,
          }}
        >
          <ActionCard
            title="Teacher Assignments"
            description={
              "Assign teachers to subjects, classes, terms and academic years."
            }
            icon={<AssignmentInd />}
            onClick={() =>
              navigate(
                "/teacher-assignments"
              )
            }
          />
        </Grid>

        <Grid
          size={{
            xs: 12,
            sm: 6,
            lg: 4,
          }}
        >
          <ActionCard
            title="School Timetable"
            description={
              "Create, edit and print the school teaching schedule."
            }
            icon={<Schedule />}
            onClick={() =>
              navigate("/timetable")
            }
          />
        </Grid>

        <Grid
          size={{
            xs: 12,
            sm: 6,
            lg: 4,
          }}
        >
          <ActionCard
            title="Teachers & Staff"
            description={
              "Review teacher records and employment information."
            }
            icon={<Groups />}
            onClick={() =>
              navigate("/employees")
            }
          />
        </Grid>

        <Grid
          size={{
            xs: 12,
            sm: 6,
            lg: 4,
          }}
        >
          <ActionCard
            title="Academic Management"
            description={
              "Manage years, terms, grades, classes and subjects."
            }
            icon={<MenuBook />}
            onClick={() =>
              navigate("/academics")
            }
          />
        </Grid>

        <Grid
          size={{
            xs: 12,
            sm: 6,
            lg: 4,
          }}
        >
          <ActionCard
            title="Classroom Attendance"
            description={
              "Monitor subject-level teacher attendance submissions."
            }
            icon={<CalendarMonth />}
            onClick={() =>
              navigate(
                "/classroom-attendance"
              )
            }
          />
        </Grid>

        <Grid
          size={{
            xs: 12,
            sm: 6,
            lg: 4,
          }}
        >
          <ActionCard
            title="Examinations & Grades"
            description={
              "Review assessments, grades and academic performance."
            }
            icon={<FactCheck />}
            onClick={() =>
              navigate("/examinations")
            }
          />
        </Grid>

        <Grid
          size={{
            xs: 12,
            sm: 6,
            lg: 4,
          }}
        >
          <ActionCard
            title="Students"
            description={
              "Review student enrollment and academic records."
            }
            icon={<School />}
            onClick={() =>
              navigate("/students")
            }
          />
        </Grid>

        <Grid
          size={{
            xs: 12,
            sm: 6,
            lg: 4,
          }}
        >
          <ActionCard
            title="Reports"
            description={
              "Open institutional and academic reports."
            }
            icon={<Print />}
            onClick={() =>
              navigate("/reports")
            }
          />
        </Grid>
      </Grid>


      <Paper
        sx={{
          p: 2.5,
          borderRadius: 3,
        }}
      >
        <Stack
          direction={{
            xs: "column",
            md: "row",
          }}
          justifyContent="space-between"
          alignItems={{
            xs: "flex-start",
            md: "center",
          }}
          spacing={2}
          sx={{ mb: 2 }}
        >
          <Box>
            <Typography
              variant="h6"
              fontWeight={900}
              color="#071B54"
            >
              Teacher Workload
            </Typography>

            <Typography
              variant="body2"
              color="text.secondary"
            >
              Monitor classes, subjects and
              weekly teaching periods.
            </Typography>
          </Box>

          <Stack
            direction="row"
            spacing={1}
          >
            <Chip
              icon={<WorkHistory />}
              label={
                `${totalWorkloadPeriods} weekly periods`
              }
            />

            <Button
              variant="outlined"
              startIcon={<Print />}
              onClick={() =>
                window.print()
              }
              sx={{
                "@media print": {
                  display: "none",
                },
              }}
            >
              Print
            </Button>
          </Stack>
        </Stack>


        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>
                  Employee ID
                </TableCell>

                <TableCell>
                  Teacher
                </TableCell>

                <TableCell align="center">
                  Assignments
                </TableCell>

                <TableCell align="center">
                  Classes
                </TableCell>

                <TableCell align="center">
                  Subjects
                </TableCell>

                <TableCell align="center">
                  Weekly Periods
                </TableCell>

                <TableCell
                  align="right"
                  sx={{
                    "@media print": {
                      display: "none",
                    },
                  }}
                >
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {workload.map(
                (teacher) => (
                  <TableRow
                    key={
                      teacher.teacher_id
                    }
                    hover
                  >
                    <TableCell>
                      {
                        teacher.employee_id
                      }
                    </TableCell>

                    <TableCell>
                      <Typography
                        fontWeight={800}
                      >
                        {
                          teacher.teacher_name
                        }
                      </Typography>
                    </TableCell>

                    <TableCell
                      align="center"
                    >
                      {
                        teacher.assignment_count
                      }
                    </TableCell>

                    <TableCell
                      align="center"
                    >
                      {
                        teacher.class_count
                      }
                    </TableCell>

                    <TableCell
                      align="center"
                    >
                      {
                        teacher.subject_count
                      }
                    </TableCell>

                    <TableCell
                      align="center"
                    >
                      <Chip
                        size="small"
                        label={
                          teacher.weekly_periods
                        }
                      />
                    </TableCell>

                    <TableCell
                      align="right"
                      sx={{
                        "@media print": {
                          display: "none",
                        },
                      }}
                    >
                      <Button
                        size="small"
                        onClick={() =>
                          navigate(
                            "/teacher-assignments"
                          )
                        }
                      >
                        Assign
                      </Button>

                      <Button
                        size="small"
                        onClick={() =>
                          navigate(
                            "/timetable"
                          )
                        }
                      >
                        Schedule
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              )}

              {workload.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    align="center"
                  >
                    No teacher assignments
                    have been configured yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
}

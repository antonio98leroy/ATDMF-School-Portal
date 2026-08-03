import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Assignment,
  CalendarMonth,
  Groups,
  MenuBook,
  Person,
  Refresh,
  School,
  WorkHistory,
} from "@mui/icons-material";

import {
  Alert,
  Avatar,
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
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Typography,
} from "@mui/material";

import EmptyState from "../components/common/EmptyState";
import StatCard from "../components/common/StatCard";
import { TeacherPortalAPI } from "../api/teacherPortal";

function getMessage(error) {
  return (
    error?.response?.data?.detail ||
    "Unable to load teacher portal information."
  );
}

export default function TeacherPortal() {
  const [tab, setTab] = useState(0);

  const [dashboard, setDashboard] =
    useState(null);
  const [assignments, setAssignments] =
    useState([]);
  const [students, setStudents] =
    useState([]);

  const [selectedAssignment, setSelectedAssignment] =
    useState("");

  const [loading, setLoading] = useState(true);
  const [studentsLoading, setStudentsLoading] =
    useState(false);
  const [error, setError] = useState("");

  const assignment = useMemo(
    () =>
      assignments.find(
        (item) =>
          String(item.id) ===
          String(selectedAssignment)
      ),
    [assignments, selectedAssignment]
  );

  const loadPortal = async () => {
    setLoading(true);
    setError("");

    try {
      const [
        dashboardResponse,
        assignmentsResponse,
      ] = await Promise.all([
        TeacherPortalAPI.getDashboard(),
        TeacherPortalAPI.getAssignments(),
      ]);

      setDashboard(dashboardResponse.data);

      const records = Array.isArray(
        assignmentsResponse.data
      )
        ? assignmentsResponse.data
        : [];

      setAssignments(records);

      if (records.length > 0) {
        setSelectedAssignment(records[0].id);
      }
    } catch (requestError) {
      setError(getMessage(requestError));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPortal();
  }, []);

  const loadStudents = async () => {
    if (!assignment) {
      return;
    }

    setStudentsLoading(true);
    setError("");

    try {
      const response =
        await TeacherPortalAPI.getStudents(
          assignment.class_section,
          assignment.academic_year
        );

      setStudents(
        Array.isArray(response.data)
          ? response.data
          : []
      );
    } catch (requestError) {
      setStudents([]);
      setError(getMessage(requestError));
    } finally {
      setStudentsLoading(false);
    }
  };

  useEffect(() => {
    if (assignment && tab === 1) {
      loadStudents();
    }
  }, [selectedAssignment, tab]);

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
        <CircularProgress />
      </Box>
    );
  }

  const teacher = dashboard?.teacher || {};
  const statistics = dashboard?.statistics || {};

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
          <Stack
            direction="row"
            spacing={2}
            sx={{ alignItems: "center" }}
          >
            <Avatar
              src={teacher.photo || undefined}
              sx={{
                width: 72,
                height: 72,
                bgcolor: "#0B2A78",
              }}
            >
              <Person />
            </Avatar>

            <Box>
              <Typography
                variant="h4"
                sx={{
                  color: "#0B2A78",
                  fontWeight: 800,
                }}
              >
                Teacher Portal
              </Typography>

              <Typography fontWeight={700}>
                {teacher.full_name}
              </Typography>

              <Typography color="text.secondary">
                {teacher.employee_id} •{" "}
                {teacher.department} •{" "}
                {teacher.position}
              </Typography>
            </Box>
          </Stack>

          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={loadPortal}
          >
            Refresh
          </Button>
        </Stack>

        {error && (
          <Alert severity="error">
            {error}
          </Alert>
        )}

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <StatCard
              title="My Classes"
              value={statistics.classes || 0}
              icon={<School />}
              color="#0B2A78"
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <StatCard
              title="My Subjects"
              value={statistics.subjects || 0}
              icon={<MenuBook />}
              color="#2E7D32"
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <StatCard
              title="My Students"
              value={statistics.students || 0}
              icon={<Groups />}
              color="#ED6C02"
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <StatCard
              title="Weekly Periods"
              value={
                statistics.weekly_periods || 0
              }
              icon={<WorkHistory />}
              color="#C8102E"
            />
          </Grid>
        </Grid>

        <Tabs
          value={tab}
          onChange={(event, value) =>
            setTab(value)
          }
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab
            label="My Assignments"
            icon={<Assignment />}
            iconPosition="start"
          />

          <Tab
            label="My Students"
            icon={<Groups />}
            iconPosition="start"
          />

          <Tab
            label="Quick Actions"
            icon={<CalendarMonth />}
            iconPosition="start"
          />
        </Tabs>

        {tab === 0 && (
          <AssignmentsTable
            assignments={assignments}
          />
        )}

        {tab === 1 && (
          <Stack spacing={2}>
            <Paper
              variant="outlined"
              sx={{
                p: 2,
                borderRadius: 3,
              }}
            >
              <FormControl
                fullWidth
                size="small"
              >
                <InputLabel>
                  Select Class Assignment
                </InputLabel>

                <Select
                  label="Select Class Assignment"
                  value={selectedAssignment}
                  onChange={(event) =>
                    setSelectedAssignment(
                      event.target.value
                    )
                  }
                >
                  {assignments.map((item) => (
                    <MenuItem
                      key={item.id}
                      value={item.id}
                    >
                      {item.class_name} —{" "}
                      {item.subject_name} —{" "}
                      {item.academic_year_name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Paper>

            {studentsLoading ? (
              <Paper
                variant="outlined"
                sx={{
                  p: 6,
                  textAlign: "center",
                }}
              >
                <CircularProgress />
              </Paper>
            ) : students.length === 0 ? (
              <EmptyState
                title="No Students Found"
                description="Select one of your class assignments to view enrolled students."
              />
            ) : (
              <StudentsTable students={students} />
            )}
          </Stack>
        )}

        {tab === 2 && (
          <Grid container spacing={2}>
            <QuickAction
              title="Take Attendance"
              description="Record daily attendance for your assigned class."
              path="/attendance"
              icon={<CalendarMonth />}
            />

            <QuickAction
              title="Enter Scores"
              description="Enter period and examination scores."
              path="/examinations"
              icon={<Assignment />}
            />

            <QuickAction
              title="View Report Cards"
              description="Review student report cards and class ranking."
              path="/report-cards"
              icon={<School />}
            />
          </Grid>
        )}
      </Stack>
    </Box>
  );
}

function AssignmentsTable({ assignments }) {
  if (assignments.length === 0) {
    return (
      <EmptyState
        title="No Teacher Assignments"
        description="No active class or subject assignments were found."
      />
    );
  }

  return (
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
                },
              }}
            >
              <TableCell>Academic Year</TableCell>
              <TableCell>Term</TableCell>
              <TableCell>Class</TableCell>
              <TableCell>Subject</TableCell>
              <TableCell>Students</TableCell>
              <TableCell>Weekly Periods</TableCell>
              <TableCell>Role</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {assignments.map((item) => (
              <TableRow key={item.id} hover>
                <TableCell>
                  {item.academic_year_name}
                </TableCell>

                <TableCell>
                  {item.term_name}
                </TableCell>

                <TableCell>
                  {item.class_name}
                </TableCell>

                <TableCell>
                  {item.subject_code} —{" "}
                  {item.subject_name}
                </TableCell>

                <TableCell>
                  {item.student_count}
                </TableCell>

                <TableCell>
                  {item.weekly_periods}
                </TableCell>

                <TableCell>
                  <Chip
                    size="small"
                    label={
                      item.is_class_teacher
                        ? "Class Teacher"
                        : "Subject Teacher"
                    }
                    color={
                      item.is_class_teacher
                        ? "primary"
                        : "default"
                    }
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}

function StudentsTable({ students }) {
  return (
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
                },
              }}
            >
              <TableCell>Student</TableCell>
              <TableCell>Admission No.</TableCell>
              <TableCell>Gender</TableCell>
              <TableCell>Roll Number</TableCell>
              <TableCell>Phone</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {students.map((student) => (
              <TableRow
                key={student.enrollment_id}
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
                      src={student.photo || undefined}
                    />

                    <Typography fontWeight={700}>
                      {student.full_name}
                    </Typography>
                  </Stack>
                </TableCell>

                <TableCell>
                  {student.admission_number}
                </TableCell>

                <TableCell>
                  {student.gender}
                </TableCell>

                <TableCell>
                  {student.roll_number || "—"}
                </TableCell>

                <TableCell>
                  {student.phone || "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}

function QuickAction({
  title,
  description,
  path,
  icon,
}) {
  return (
    <Grid size={{ xs: 12, md: 4 }}>
      <Paper
        component="a"
        href={path}
        variant="outlined"
        sx={{
          display: "block",
          p: 3,
          borderRadius: 3,
          color: "inherit",
          textDecoration: "none",
          transition: "0.2s",
          "&:hover": {
            borderColor: "#0B2A78",
            transform: "translateY(-2px)",
          },
        }}
      >
        <Box
          sx={{
            color: "#0B2A78",
            mb: 1,
          }}
        >
          {icon}
        </Box>

        <Typography
          variant="h6"
          fontWeight={800}
        >
          {title}
        </Typography>

        <Typography color="text.secondary">
          {description}
        </Typography>
      </Paper>
    </Grid>
  );
}

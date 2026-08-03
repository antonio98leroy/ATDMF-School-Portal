import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Assessment,
  CalendarMonth,
  Person,
  Refresh,
  School,
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
import { StudentPortalAPI } from "../api/studentPortal";


function getMessage(error) {
  return (
    error?.response?.data?.detail ||
    "Unable to load student portal information."
  );
}


function formatScore(value) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "—";
  }

  const number = Number(value);

  return Number.isFinite(number)
    ? number.toFixed(2)
    : "—";
}


const attendanceColors = {
  P: "success",
  A: "error",
  L: "warning",
  E: "info",
};


export default function StudentPortal() {
  const [tab, setTab] = useState(0);

  const [dashboard, setDashboard] =
    useState(null);

  const [enrollments, setEnrollments] =
    useState([]);

  const [attendance, setAttendance] =
    useState([]);

  const [results, setResults] =
    useState(null);

  const [selectedYear, setSelectedYear] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [sectionLoading, setSectionLoading] =
    useState(false);

  const [error, setError] = useState("");

  const loadDashboard = async () => {
    setLoading(true);
    setError("");

    try {
      const [
        dashboardResponse,
        enrollmentsResponse,
      ] = await Promise.all([
        StudentPortalAPI.getDashboard(),
        StudentPortalAPI.getEnrollments(),
      ]);

      setDashboard(dashboardResponse.data);

      const enrollmentRecords = Array.isArray(
        enrollmentsResponse.data
      )
        ? enrollmentsResponse.data
        : [];

      setEnrollments(enrollmentRecords);

      const activeEnrollment =
        enrollmentRecords.find(
          (item) => item.active
        );

      if (activeEnrollment) {
        setSelectedYear(
          activeEnrollment.academic_year
        );
      } else if (
        enrollmentRecords.length > 0
      ) {
        setSelectedYear(
          enrollmentRecords[0]
            .academic_year
        );
      }
    } catch (requestError) {
      setError(getMessage(requestError));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadAttendance = async () => {
    setSectionLoading(true);
    setError("");

    try {
      const response =
        await StudentPortalAPI.getAttendance();

      setAttendance(
        Array.isArray(response.data)
          ? response.data
          : []
      );
    } catch (requestError) {
      setAttendance([]);
      setError(getMessage(requestError));
    } finally {
      setSectionLoading(false);
    }
  };

  const loadResults = async (
    academicYear = selectedYear
  ) => {
    setSectionLoading(true);
    setError("");

    try {
      const response =
        await StudentPortalAPI.getResults(
          academicYear
        );

      setResults(response.data);
    } catch (requestError) {
      setResults(null);
      setError(getMessage(requestError));
    } finally {
      setSectionLoading(false);
    }
  };

  useEffect(() => {
    if (tab === 1) {
      loadAttendance();
    }

    if (tab === 2 && selectedYear) {
      loadResults();
    }
  }, [tab]);

  const student = dashboard?.student || {};
  const guardian = dashboard?.guardian;
  const enrollment =
    dashboard?.enrollment;
  const statistics =
    dashboard?.statistics || {};

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
            justifyContent:
              "space-between",
            alignItems: {
              xs: "stretch",
              md: "center",
            },
          }}
        >
          <Stack
            direction="row"
            spacing={2}
            sx={{
              alignItems: "center",
            }}
          >
            <Avatar
              src={
                student.photo ||
                undefined
              }
              sx={{
                width: 76,
                height: 76,
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
                Student Portal
              </Typography>

              <Typography
                variant="h6"
                fontWeight={700}
              >
                {student.full_name}
              </Typography>

              <Typography
                color="text.secondary"
              >
                {
                  student.admission_number
                }

                {enrollment
                  ? ` • ${enrollment.class_name} • ${enrollment.academic_year_name}`
                  : ""}
              </Typography>
            </Box>
          </Stack>

          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={loadDashboard}
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
          <Grid
            size={{
              xs: 12,
              sm: 6,
              lg: 3,
            }}
          >
            <StatCard
              title="Attendance"
              value={
                `${statistics.attendance_percentage || 0}%`
              }
              icon={<CalendarMonth />}
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
              title="Present"
              value={
                statistics.present || 0
              }
              icon={<School />}
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
              title="Absent"
              value={
                statistics.absent || 0
              }
              icon={<CalendarMonth />}
              color="#C8102E"
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
              title="Published Results"
              value={
                statistics
                  .published_results || 0
              }
              icon={<Assessment />}
              color="#ED6C02"
            />
          </Grid>
        </Grid>

        <Tabs
          value={tab}
          onChange={(
            event,
            newValue
          ) => setTab(newValue)}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab
            label="My Profile"
            icon={<Person />}
            iconPosition="start"
          />

          <Tab
            label="Attendance"
            icon={<CalendarMonth />}
            iconPosition="start"
          />

          <Tab
            label="Results"
            icon={<Assessment />}
            iconPosition="start"
          />

          <Tab
            label="Academic History"
            icon={<School />}
            iconPosition="start"
          />
        </Tabs>

        {tab === 0 && (
          <ProfileSection
            student={student}
            guardian={guardian}
            enrollment={enrollment}
          />
        )}

        {tab === 1 && (
          <AttendanceSection
            records={attendance}
            loading={sectionLoading}
          />
        )}

        {tab === 2 && (
          <ResultsSection
            enrollments={enrollments}
            selectedYear={selectedYear}
            setSelectedYear={
              setSelectedYear
            }
            results={results}
            loading={sectionLoading}
            loadResults={loadResults}
          />
        )}

        {tab === 3 && (
          <EnrollmentHistory
            records={enrollments}
          />
        )}
      </Stack>
    </Box>
  );
}


function ProfileSection({
  student,
  guardian,
  enrollment,
}) {
  return (
    <Grid container spacing={2}>
      <Grid
        size={{
          xs: 12,
          md: 6,
        }}
      >
        <Paper
          variant="outlined"
          sx={{
            p: 3,
            borderRadius: 3,
            height: "100%",
          }}
        >
          <Typography
            variant="h6"
            fontWeight={800}
            color="#0B2A78"
            mb={2}
          >
            Student Information
          </Typography>

          <Stack spacing={1.5}>
            <Info
              label="Full Name"
              value={student.full_name}
            />

            <Info
              label="Admission Number"
              value={
                student.admission_number
              }
            />

            <Info
              label="Gender"
              value={student.gender}
            />

            <Info
              label="Date of Birth"
              value={
                student.date_of_birth
              }
            />

            <Info
              label="Phone"
              value={student.phone}
            />

            <Info
              label="Email"
              value={student.email}
            />

            <Info
              label="Address"
              value={student.address}
            />

            <Info
              label="Previous School"
              value={
                student.previous_school
              }
            />
          </Stack>
        </Paper>
      </Grid>

      <Grid
        size={{
          xs: 12,
          md: 6,
        }}
      >
        <Stack spacing={2}>
          <Paper
            variant="outlined"
            sx={{
              p: 3,
              borderRadius: 3,
            }}
          >
            <Typography
              variant="h6"
              fontWeight={800}
              color="#0B2A78"
              mb={2}
            >
              Current Enrollment
            </Typography>

            {enrollment ? (
              <Stack spacing={1.5}>
                <Info
                  label="Academic Year"
                  value={
                    enrollment
                      .academic_year_name
                  }
                />

                <Info
                  label="Grade"
                  value={
                    enrollment.grade_name
                  }
                />

                <Info
                  label="Class"
                  value={
                    enrollment.class_name
                  }
                />

                <Info
                  label="Roll Number"
                  value={
                    enrollment.roll_number
                  }
                />
              </Stack>
            ) : (
              <Typography
                color="text.secondary"
              >
                No active enrollment.
              </Typography>
            )}
          </Paper>

          <Paper
            variant="outlined"
            sx={{
              p: 3,
              borderRadius: 3,
            }}
          >
            <Typography
              variant="h6"
              fontWeight={800}
              color="#0B2A78"
              mb={2}
            >
              Guardian Information
            </Typography>

            {guardian ? (
              <Stack spacing={1.5}>
                <Info
                  label="Name"
                  value={guardian.name}
                />

                <Info
                  label="Relationship"
                  value={
                    guardian.relationship
                  }
                />

                <Info
                  label="Phone"
                  value={guardian.phone}
                />

                <Info
                  label="Email"
                  value={guardian.email}
                />
              </Stack>
            ) : (
              <Typography
                color="text.secondary"
              >
                No guardian information.
              </Typography>
            )}
          </Paper>
        </Stack>
      </Grid>
    </Grid>
  );
}


function AttendanceSection({
  records,
  loading,
}) {
  if (loading) {
    return (
      <Paper
        variant="outlined"
        sx={{
          p: 6,
          textAlign: "center",
        }}
      >
        <CircularProgress />
      </Paper>
    );
  }

  if (records.length === 0) {
    return (
      <EmptyState
        title="No Attendance Records"
        description="No attendance records are currently available."
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
              <TableCell>Date</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Class</TableCell>
              <TableCell>Term</TableCell>
              <TableCell>Remarks</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {records.map((record) => (
              <TableRow
                key={record.id}
                hover
              >
                <TableCell>
                  {record.date}
                </TableCell>

                <TableCell>
                  <Chip
                    size="small"
                    label={
                      record.status_display
                    }
                    color={
                      attendanceColors[
                        record.status
                      ] || "default"
                    }
                  />
                </TableCell>

                <TableCell>
                  {record.class_name}
                </TableCell>

                <TableCell>
                  {record.term_name}
                </TableCell>

                <TableCell>
                  {record.remarks || "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}


function ResultsSection({
  enrollments,
  selectedYear,
  setSelectedYear,
  results,
  loading,
  loadResults,
}) {
  return (
    <Stack spacing={2}>
      <Paper
        variant="outlined"
        sx={{
          p: 2,
          borderRadius: 3,
        }}
      >
        <Stack
          direction={{
            xs: "column",
            sm: "row",
          }}
          spacing={2}
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
              value={selectedYear}
              onChange={(event) =>
                setSelectedYear(
                  event.target.value
                )
              }
            >
              {enrollments.map(
                (enrollment) => (
                  <MenuItem
                    key={enrollment.id}
                    value={
                      enrollment
                        .academic_year
                    }
                  >
                    {
                      enrollment
                        .academic_year_name
                    }{" "}
                    —{" "}
                    {
                      enrollment
                        .class_name
                    }
                  </MenuItem>
                )
              )}
            </Select>
          </FormControl>

          <Button
            variant="contained"
            onClick={() =>
              loadResults(
                selectedYear
              )
            }
            sx={{
              minWidth: 160,
              bgcolor: "#0B2A78",
            }}
          >
            Load Results
          </Button>
        </Stack>
      </Paper>

      {loading ? (
        <Paper
          variant="outlined"
          sx={{
            p: 6,
            textAlign: "center",
          }}
        >
          <CircularProgress />
        </Paper>
      ) : !results ? (
        <EmptyState
          title="No Results Loaded"
          description="Select an academic year and load your published results."
        />
      ) : (
        <Paper
          variant="outlined"
          sx={{
            borderRadius: 3,
            overflow: "hidden",
          }}
        >
          <Box sx={{ p: 2 }}>
            <Typography
              variant="h6"
              fontWeight={800}
              color="#0B2A78"
            >
              {
                results
                  .academic_year?.name
              }{" "}
              Results
            </Typography>

            <Typography
              color="text.secondary"
            >
              {results.class?.name}
            </Typography>
          </Box>

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
                  <TableCell>
                    Subject
                  </TableCell>
                  <TableCell>P1</TableCell>
                  <TableCell>P2</TableCell>
                  <TableCell>P3</TableCell>
                  <TableCell>
                    1st Exam
                  </TableCell>
                  <TableCell>
                    1st Average
                  </TableCell>
                  <TableCell>P4</TableCell>
                  <TableCell>P5</TableCell>
                  <TableCell>P6</TableCell>
                  <TableCell>
                    2nd Exam
                  </TableCell>
                  <TableCell>
                    2nd Average
                  </TableCell>
                  <TableCell>
                    Year Average
                  </TableCell>
                  <TableCell>Grade</TableCell>
                  <TableCell>Remark</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {(results.subjects || []).map(
                  (subject) => (
                    <TableRow
                      key={
                        subject.subject_id
                      }
                      hover
                    >
                      <TableCell>
                        <Typography
                          fontWeight={700}
                        >
                          {
                            subject.subject_name
                          }
                        </Typography>
                      </TableCell>

                      <TableCell>
                        {formatScore(
                          subject.first_period
                        )}
                      </TableCell>

                      <TableCell>
                        {formatScore(
                          subject.second_period
                        )}
                      </TableCell>

                      <TableCell>
                        {formatScore(
                          subject.third_period
                        )}
                      </TableCell>

                      <TableCell>
                        {formatScore(
                          subject
                            .first_semester_exam
                        )}
                      </TableCell>

                      <TableCell>
                        {formatScore(
                          subject
                            .first_average
                        )}
                      </TableCell>

                      <TableCell>
                        {formatScore(
                          subject.fourth_period
                        )}
                      </TableCell>

                      <TableCell>
                        {formatScore(
                          subject.fifth_period
                        )}
                      </TableCell>

                      <TableCell>
                        {formatScore(
                          subject.sixth_period
                        )}
                      </TableCell>

                      <TableCell>
                        {formatScore(
                          subject
                            .second_semester_exam
                        )}
                      </TableCell>

                      <TableCell>
                        {formatScore(
                          subject
                            .second_average
                        )}
                      </TableCell>

                      <TableCell>
                        <Chip
                          size="small"
                          label={formatScore(
                            subject
                              .yearly_average
                          )}
                          color="primary"
                        />
                      </TableCell>

                      <TableCell>
                        {subject.grade || "—"}
                      </TableCell>

                      <TableCell>
                        {subject.remark || "—"}
                      </TableCell>
                    </TableRow>
                  )
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <Box
            sx={{
              p: 2,
              bgcolor: "#F8FAFC",
            }}
          >
            <Stack
              direction={{
                xs: "column",
                sm: "row",
              }}
              spacing={2}
            >
              <Chip
                label={`Overall Average: ${formatScore(
                  results.overall_average
                )}`}
                color="primary"
              />

              <Chip
                label={`Grade: ${
                  results.overall_grade ||
                  "—"
                }`}
              />

              <Chip
                label={`Remark: ${
                  results.overall_remark ||
                  "—"
                }`}
              />
            </Stack>
          </Box>
        </Paper>
      )}
    </Stack>
  );
}


function EnrollmentHistory({
  records,
}) {
  if (records.length === 0) {
    return (
      <EmptyState
        title="No Academic History"
        description="No enrollment history is currently available."
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
              <TableCell>
                Academic Year
              </TableCell>
              <TableCell>Grade</TableCell>
              <TableCell>Class</TableCell>
              <TableCell>
                Roll Number
              </TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {records.map((record) => (
              <TableRow
                key={record.id}
                hover
              >
                <TableCell>
                  {
                    record
                      .academic_year_name
                  }
                </TableCell>

                <TableCell>
                  {record.grade_name}
                </TableCell>

                <TableCell>
                  {record.class_name}
                </TableCell>

                <TableCell>
                  {record.roll_number ||
                    "—"}
                </TableCell>

                <TableCell>
                  <Chip
                    size="small"
                    label={
                      record.active
                        ? "Active"
                        : "Completed"
                    }
                    color={
                      record.active
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
    </Paper>
  );
}


function Info({ label, value }) {
  return (
    <Box>
      <Typography
        variant="caption"
        color="text.secondary"
      >
        {label}
      </Typography>

      <Typography fontWeight={700}>
        {value || "—"}
      </Typography>
    </Box>
  );
}

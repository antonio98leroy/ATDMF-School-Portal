import {
  useEffect,
  useState,
} from "react";

import {
  Assessment,
  CalendarMonth,
  ChildCare,
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
import { ParentPortalAPI } from "../api/parentPortal";


const attendanceColors = {
  P: "success",
  A: "error",
  L: "warning",
  E: "info",
};


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


function getMessage(error) {
  return (
    error?.response?.data?.detail ||
    "Unable to load parent portal information."
  );
}


export default function ParentPortal() {
  const [tab, setTab] = useState(0);

  const [dashboard, setDashboard] =
    useState(null);

  const [selectedStudent, setSelectedStudent] =
    useState("");

  const [selectedYear, setSelectedYear] =
    useState("");

  const [attendance, setAttendance] =
    useState([]);

  const [results, setResults] =
    useState(null);

  const [enrollments, setEnrollments] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [sectionLoading, setSectionLoading] =
    useState(false);

  const [error, setError] = useState("");

  const children = dashboard?.children || [];

  const selectedChild = children.find(
    (item) =>
      String(item.id) ===
      String(selectedStudent)
  );

  const guardian = dashboard?.guardian || {};

  const loadDashboard = async () => {
    setLoading(true);
    setError("");

    try {
      const response =
        await ParentPortalAPI.getDashboard();

      setDashboard(response.data);

      const records =
        response.data.children || [];

      if (records.length > 0) {
        setSelectedStudent(
          records[0].id
        );

        if (
          records[0].enrollment
        ) {
          setSelectedYear(
            records[0].enrollment
              .academic_year
          );
        }
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
    if (!selectedStudent) {
      return;
    }

    setSectionLoading(true);
    setError("");

    try {
      const response =
        await ParentPortalAPI.getAttendance(
          selectedStudent
        );

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
    if (!selectedStudent) {
      return;
    }

    setSectionLoading(true);
    setError("");

    try {
      const response =
        await ParentPortalAPI.getResults(
          selectedStudent,
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

  const loadEnrollments = async () => {
    if (!selectedStudent) {
      return;
    }

    setSectionLoading(true);

    try {
      const response =
        await ParentPortalAPI.getEnrollments(
          selectedStudent
        );

      setEnrollments(
        Array.isArray(response.data)
          ? response.data
          : []
      );
    } catch (requestError) {
      setEnrollments([]);
      setError(getMessage(requestError));
    } finally {
      setSectionLoading(false);
    }
  };

  useEffect(() => {
    if (!selectedStudent) {
      return;
    }

    if (tab === 1) {
      loadAttendance();
    }

    if (tab === 2) {
      loadEnrollments();
    }

    if (
      tab === 3 &&
      selectedYear
    ) {
      loadResults();
    }
  }, [tab, selectedStudent]);

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
            justifyContent:
              "space-between",
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
              Parent Portal
            </Typography>

            <Typography
              fontWeight={700}
            >
              {guardian.name}
            </Typography>

            <Typography
              color="text.secondary"
            >
              {guardian.relationship} •{" "}
              {guardian.phone}
            </Typography>
          </Box>

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
              Select Child
            </InputLabel>

            <Select
              label="Select Child"
              value={selectedStudent}
              onChange={(event) => {
                const value =
                  event.target.value;

                setSelectedStudent(value);
                setAttendance([]);
                setResults(null);
                setEnrollments([]);

                const child =
                  children.find(
                    (item) =>
                      String(item.id) ===
                      String(value)
                  );

                setSelectedYear(
                  child?.enrollment
                    ?.academic_year || ""
                );
              }}
            >
              {children.map((child) => (
                <MenuItem
                  key={child.id}
                  value={child.id}
                >
                  {
                    child.admission_number
                  }{" "}
                  — {child.full_name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Paper>

        {selectedChild && (
          <Grid container spacing={2}>
            <Grid
              size={{
                xs: 12,
                sm: 6,
                lg: 3,
              }}
            >
              <StatCard
                title="Current Class"
                value={
                  selectedChild
                    .enrollment
                    ?.class_name || "—"
                }
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
                title="Attendance"
                value={`${
                  selectedChild
                    .statistics
                    .attendance_percentage ||
                  0
                }%`}
                icon={<CalendarMonth />}
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
                  selectedChild
                    .statistics.absent || 0
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
                  selectedChild
                    .statistics
                    .published_results || 0
                }
                icon={<Assessment />}
                color="#ED6C02"
              />
            </Grid>
          </Grid>
        )}

        <Tabs
          value={tab}
          onChange={(
            event,
            value
          ) => setTab(value)}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab
            label="Child Profile"
            icon={<ChildCare />}
            iconPosition="start"
          />

          <Tab
            label="Attendance"
            icon={<CalendarMonth />}
            iconPosition="start"
          />

          <Tab
            label="Academic History"
            icon={<School />}
            iconPosition="start"
          />

          <Tab
            label="Results"
            icon={<Assessment />}
            iconPosition="start"
          />
        </Tabs>

        {tab === 0 && (
          <ChildProfile
            child={selectedChild}
          />
        )}

        {tab === 1 && (
          <AttendanceTable
            records={attendance}
            loading={sectionLoading}
          />
        )}

        {tab === 2 && (
          <EnrollmentTable
            records={enrollments}
            loading={sectionLoading}
          />
        )}

        {tab === 3 && (
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
      </Stack>
    </Box>
  );
}


function ChildProfile({ child }) {
  if (!child) {
    return (
      <EmptyState
        title="No Child Selected"
        description="Select a child to view their profile."
      />
    );
  }

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 3,
        borderRadius: 3,
      }}
    >
      <Stack
        direction={{
          xs: "column",
          sm: "row",
        }}
        spacing={3}
        sx={{
          alignItems: {
            xs: "center",
            sm: "flex-start",
          },
        }}
      >
        <Avatar
          src={child.photo || undefined}
          sx={{
            width: 100,
            height: 100,
            bgcolor: "#0B2A78",
          }}
        >
          <Person />
        </Avatar>

        <Grid
          container
          spacing={2}
          sx={{ flexGrow: 1 }}
        >
          <Grid size={{ xs: 12, md: 6 }}>
            <Info
              label="Full Name"
              value={child.full_name}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Info
              label="Admission Number"
              value={
                child.admission_number
              }
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Info
              label="Gender"
              value={child.gender}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Info
              label="Date of Birth"
              value={
                child.date_of_birth
              }
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Info
              label="Academic Year"
              value={
                child.enrollment
                  ?.academic_year_name
              }
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Info
              label="Class"
              value={
                child.enrollment
                  ?.class_name
              }
            />
          </Grid>
        </Grid>
      </Stack>
    </Paper>
  );
}


function AttendanceTable({
  records,
  loading,
}) {
  if (loading) {
    return <LoadingBox />;
  }

  if (records.length === 0) {
    return (
      <EmptyState
        title="No Attendance Records"
        description="No attendance records are available for this child."
      />
    );
  }

  return (
    <DataPaper>
      <Table>
        <TableHead>
          <HeaderRow>
            <TableCell>Date</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Class</TableCell>
            <TableCell>Term</TableCell>
            <TableCell>Remarks</TableCell>
          </HeaderRow>
        </TableHead>

        <TableBody>
          {records.map((item) => (
            <TableRow key={item.id} hover>
              <TableCell>
                {item.date}
              </TableCell>

              <TableCell>
                <Chip
                  size="small"
                  label={
                    item.status_display
                  }
                  color={
                    attendanceColors[
                      item.status
                    ] || "default"
                  }
                />
              </TableCell>

              <TableCell>
                {item.class_name}
              </TableCell>

              <TableCell>
                {item.term_name}
              </TableCell>

              <TableCell>
                {item.remarks || "—"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </DataPaper>
  );
}


function EnrollmentTable({
  records,
  loading,
}) {
  if (loading) {
    return <LoadingBox />;
  }

  if (records.length === 0) {
    return (
      <EmptyState
        title="No Academic History"
        description="No enrollment history is available."
      />
    );
  }

  return (
    <DataPaper>
      <Table>
        <TableHead>
          <HeaderRow>
            <TableCell>
              Academic Year
            </TableCell>
            <TableCell>Grade</TableCell>
            <TableCell>Class</TableCell>
            <TableCell>
              Roll Number
            </TableCell>
            <TableCell>Status</TableCell>
          </HeaderRow>
        </TableHead>

        <TableBody>
          {records.map((item) => (
            <TableRow key={item.id} hover>
              <TableCell>
                {
                  item.academic_year_name
                }
              </TableCell>

              <TableCell>
                {item.grade_name}
              </TableCell>

              <TableCell>
                {item.class_name}
              </TableCell>

              <TableCell>
                {item.roll_number || "—"}
              </TableCell>

              <TableCell>
                <Chip
                  size="small"
                  label={
                    item.active
                      ? "Active"
                      : "Completed"
                  }
                  color={
                    item.active
                      ? "success"
                      : "default"
                  }
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </DataPaper>
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
                (item) => (
                  <MenuItem
                    key={item.id}
                    value={
                      item.academic_year
                    }
                  >
                    {
                      item.academic_year_name
                    }{" "}
                    — {item.class_name}
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
        <LoadingBox />
      ) : !results ? (
        <EmptyState
          title="No Results Loaded"
          description="Select an academic year and load the published results."
        />
      ) : (
        <DataPaper>
          <Box sx={{ p: 2 }}>
            <Typography
              variant="h6"
              fontWeight={800}
              color="#0B2A78"
            >
              {
                results.academic_year
                  ?.name
              }{" "}
              Results
            </Typography>

            <Typography
              color="text.secondary"
            >
              {results.class?.name}
            </Typography>
          </Box>

          <Table size="small">
            <TableHead>
              <HeaderRow>
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
              </HeaderRow>
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

                    {[
                      subject.first_period,
                      subject.second_period,
                      subject.third_period,
                      subject.first_semester_exam,
                      subject.first_average,
                      subject.fourth_period,
                      subject.fifth_period,
                      subject.sixth_period,
                      subject.second_semester_exam,
                      subject.second_average,
                      subject.yearly_average,
                    ].map(
                      (score, index) => (
                        <TableCell
                          key={index}
                        >
                          {formatScore(
                            score
                          )}
                        </TableCell>
                      )
                    )}

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
        </DataPaper>
      )}
    </Stack>
  );
}


function DataPaper({ children }) {
  return (
    <Paper
      variant="outlined"
      sx={{
        borderRadius: 3,
        overflow: "auto",
      }}
    >
      <TableContainer>
        {children}
      </TableContainer>
    </Paper>
  );
}


function HeaderRow({ children }) {
  return (
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
      {children}
    </TableRow>
  );
}


function LoadingBox() {
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

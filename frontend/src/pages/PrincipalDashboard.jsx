import {
  useEffect,
  useState,
} from "react";

import {
  AccountBalance,
  Assessment,
  CalendarMonth,
  Campaign,
  Groups,
  MenuBook,
  Payments,
  Refresh,
  School,
  Work,
} from "@mui/icons-material";

import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Grid,
  LinearProgress,
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

import StatCard from "../components/common/StatCard";
import { PrincipalDashboardAPI } from "../api/principalDashboard";


function formatMoney(value) {
  const amount = Number(value || 0);

  return new Intl.NumberFormat(
    "en-US",
    {
      style: "currency",
      currency: "USD",
    }
  ).format(amount);
}


function percentage(value, total) {
  const numerator = Number(value || 0);
  const denominator = Number(total || 0);

  if (!denominator) {
    return 0;
  }

  return Math.round(
    (numerator / denominator) * 100
  );
}


export default function PrincipalDashboard() {
  const [data, setData] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const loadDashboard = async () => {
    setLoading(true);
    setError("");

    try {
      const response =
        await PrincipalDashboardAPI
          .getDashboard();

      setData(response.data);
    } catch (requestError) {
      setError(
        requestError?.response?.data
          ?.detail ||
          "Unable to load the principal dashboard."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

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

  const statistics =
    data?.statistics || {};

  const attendance =
    data?.attendance_today || {};

  const finance =
    data?.finance || {};

  const promotions =
    data?.promotions || {};

  const attendanceTotal =
    attendance.total || 0;

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
            justifyContent:
              "space-between",
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
              Principal Dashboard
            </Typography>

            <Typography
              color="text.secondary"
            >
              School-wide administrative,
              academic, attendance, staffing,
              and financial overview.
            </Typography>

            <Typography
              variant="body2"
              sx={{
                mt: 0.5,
                fontWeight: 700,
                color: "#C8102E",
              }}
            >
              Academic Year:{" "}
              {data
                ?.active_academic_year
                ?.name || "Not selected"}
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

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <StatCard
              title="Students"
              value={
                statistics.students || 0
              }
              icon={<School />}
              color="#0B2A78"
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <StatCard
              title="Employees"
              value={
                statistics.employees || 0
              }
              icon={<Work />}
              color="#2E7D32"
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <StatCard
              title="Teachers"
              value={
                statistics.teachers || 0
              }
              icon={<Groups />}
              color="#ED6C02"
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <StatCard
              title="Classes"
              value={
                statistics.classes || 0
              }
              icon={<MenuBook />}
              color="#C8102E"
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <StatCard
              title="Active Enrollments"
              value={
                statistics
                  .active_enrollments || 0
              }
              icon={<Groups />}
              color="#1565C0"
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <StatCard
              title="Subjects"
              value={
                statistics.subjects || 0
              }
              icon={<MenuBook />}
              color="#6A1B9A"
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <StatCard
              title="Published Results"
              value={
                statistics
                  .published_results || 0
              }
              icon={<Assessment />}
              color="#00897B"
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <StatCard
              title="Academic Average"
              value={`${statistics.academic_average || 0}%`}
              icon={<Assessment />}
              color="#C62828"
            />
          </Grid>
        </Grid>

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, lg: 6 }}>
            <SummaryPanel
              title="Today's Attendance"
              icon={<CalendarMonth />}
            >
              <ProgressRow
                label="Present"
                value={
                  attendance.present || 0
                }
                total={attendanceTotal}
                color="success"
              />

              <ProgressRow
                label="Absent"
                value={
                  attendance.absent || 0
                }
                total={attendanceTotal}
                color="error"
              />

              <ProgressRow
                label="Late"
                value={
                  attendance.late || 0
                }
                total={attendanceTotal}
                color="warning"
              />

              <ProgressRow
                label="Excused"
                value={
                  attendance.excused || 0
                }
                total={attendanceTotal}
                color="info"
              />

              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mt: 2 }}
              >
                Total attendance records today:{" "}
                {attendanceTotal}
              </Typography>
            </SummaryPanel>
          </Grid>

          <Grid size={{ xs: 12, lg: 6 }}>
            <SummaryPanel
              title="Finance Summary"
              icon={<AccountBalance />}
            >
              <MoneyRow
                label="Total Invoiced"
                value={finance.invoiced}
              />

              <MoneyRow
                label="Total Paid"
                value={finance.paid}
              />

              <MoneyRow
                label="Outstanding Balance"
                value={finance.outstanding}
                danger
              />

              <LinearProgress
                variant="determinate"
                value={percentage(
                  finance.paid,
                  finance.invoiced
                )}
                sx={{
                  mt: 2,
                  height: 10,
                  borderRadius: 5,
                }}
              />

              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mt: 1 }}
              >
                Collection rate:{" "}
                {percentage(
                  finance.paid,
                  finance.invoiced
                )}
                %
              </Typography>
            </SummaryPanel>
          </Grid>
        </Grid>

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, lg: 6 }}>
            <SummaryPanel
              title="Student Promotions"
              icon={<School />}
            >
              <Grid container spacing={2}>
                <PromotionBox
                  label="Promoted"
                  value={
                    promotions.promoted ||
                    0
                  }
                  color="success"
                />

                <PromotionBox
                  label="Repeated"
                  value={
                    promotions.repeated ||
                    0
                  }
                  color="warning"
                />

                <PromotionBox
                  label="Graduated"
                  value={
                    promotions.graduated ||
                    0
                  }
                  color="primary"
                />

                <PromotionBox
                  label="Withdrawn"
                  value={
                    promotions.withdrawn ||
                    0
                  }
                  color="error"
                />
              </Grid>
            </SummaryPanel>
          </Grid>

          <Grid size={{ xs: 12, lg: 6 }}>
            <SummaryPanel
              title="Quick Navigation"
              icon={<Campaign />}
            >
              <Grid container spacing={1.5}>
                <QuickLink
                  label="Students"
                  path="/students"
                />

                <QuickLink
                  label="Employees"
                  path="/employees"
                />

                <QuickLink
                  label="Attendance"
                  path="/attendance"
                />

                <QuickLink
                  label="Finance"
                  path="/finance"
                />

                <QuickLink
                  label="Examinations"
                  path="/examinations"
                />

                <QuickLink
                  label="Report Cards"
                  path="/report-cards"
                />
              </Grid>
            </SummaryPanel>
          </Grid>
        </Grid>

        <ClassDistributionTable
          rows={
            data?.class_distribution ||
            []
          }
        />

        <TeacherWorkloadTable
          rows={
            data?.teacher_workload ||
            []
          }
        />
      </Stack>
    </Box>
  );
}


function SummaryPanel({
  title,
  icon,
  children,
}) {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 3,
        borderRadius: 3,
        height: "100%",
      }}
    >
      <Stack
        direction="row"
        spacing={1}
        sx={{
          alignItems: "center",
          mb: 2,
          color: "#0B2A78",
        }}
      >
        {icon}

        <Typography
          variant="h6"
          fontWeight={800}
        >
          {title}
        </Typography>
      </Stack>

      {children}
    </Paper>
  );
}


function ProgressRow({
  label,
  value,
  total,
  color,
}) {
  return (
    <Box sx={{ mb: 2 }}>
      <Stack
        direction="row"
        sx={{
          justifyContent:
            "space-between",
          mb: 0.5,
        }}
      >
        <Typography>
          {label}
        </Typography>

        <Typography fontWeight={700}>
          {value} (
          {percentage(value, total)}%)
        </Typography>
      </Stack>

      <LinearProgress
        variant="determinate"
        value={percentage(
          value,
          total
        )}
        color={color}
        sx={{
          height: 8,
          borderRadius: 4,
        }}
      />
    </Box>
  );
}


function MoneyRow({
  label,
  value,
  danger = false,
}) {
  return (
    <Stack
      direction="row"
      sx={{
        justifyContent:
          "space-between",
        py: 1,
        borderBottom:
          "1px solid #E5E7EB",
      }}
    >
      <Typography
        color="text.secondary"
      >
        {label}
      </Typography>

      <Typography
        fontWeight={800}
        color={
          danger
            ? "#C8102E"
            : "#0B2A78"
        }
      >
        {formatMoney(value)}
      </Typography>
    </Stack>
  );
}


function PromotionBox({
  label,
  value,
  color,
}) {
  return (
    <Grid size={{ xs: 6 }}>
      <Paper
        variant="outlined"
        sx={{
          p: 2,
          textAlign: "center",
        }}
      >
        <Chip
          size="small"
          label={label}
          color={color}
          sx={{ mb: 1 }}
        />

        <Typography
          variant="h5"
          fontWeight={800}
        >
          {value}
        </Typography>
      </Paper>
    </Grid>
  );
}


function QuickLink({
  label,
  path,
}) {
  return (
    <Grid size={{ xs: 6 }}>
      <Button
        fullWidth
        variant="outlined"
        component="a"
        href={path}
        sx={{
          minHeight: 48,
          borderColor: "#0B2A78",
          color: "#0B2A78",
        }}
      >
        {label}
      </Button>
    </Grid>
  );
}


function ClassDistributionTable({
  rows,
}) {
  return (
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
          Student Distribution by Class
        </Typography>
      </Box>

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
              <TableCell>Grade</TableCell>
              <TableCell>Class</TableCell>
              <TableCell>
                Students
              </TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {rows.map((row) => (
              <TableRow
                key={
                  row.class_section__id
                }
                hover
              >
                <TableCell>
                  {
                    row[
                      "class_section__grade__name"
                    ]
                  }
                </TableCell>

                <TableCell>
                  {
                    row[
                      "class_section__name"
                    ]
                  }
                </TableCell>

                <TableCell>
                  {row.student_count}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}


function TeacherWorkloadTable({
  rows,
}) {
  return (
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
          Teacher Workload
        </Typography>
      </Box>

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
                Employee ID
              </TableCell>
              <TableCell>Teacher</TableCell>
              <TableCell>Classes</TableCell>
              <TableCell>Subjects</TableCell>
              <TableCell>
                Assignments
              </TableCell>
              <TableCell>
                Weekly Periods
              </TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {rows.map((row) => (
              <TableRow
                key={row.teacher_id}
                hover
              >
                <TableCell>
                  {row.employee_id}
                </TableCell>

                <TableCell>
                  <Typography
                    fontWeight={700}
                  >
                    {row.teacher_name}
                  </Typography>
                </TableCell>

                <TableCell>
                  {row.classes}
                </TableCell>

                <TableCell>
                  {row.subjects}
                </TableCell>

                <TableCell>
                  {row.assignments}
                </TableCell>

                <TableCell>
                  <Chip
                    label={
                      row.weekly_periods
                    }
                    color={
                      row.weekly_periods >
                      15
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
    </Paper>
  );
}

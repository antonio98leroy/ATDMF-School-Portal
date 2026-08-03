import { useEffect, useState } from "react";
import {
  AccountBalance,
  Assessment,
  Campaign,
  CheckCircle,
  Groups,
  MenuBook,
  Payments,
  PersonOff,
  Refresh,
  Savings,
  School,
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
import { OwnerDashboardAPI } from "../api/ownerDashboard";

const money = (value) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "LRD",
    minimumFractionDigits: 2,
  }).format(Number(value || 0));

const date = (value) =>
  value ? new Date(value).toLocaleDateString() : "—";

export default function OwnerDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const response =
        await OwnerDashboardAPI.getDashboard();
      setData(response.data);
    } catch (requestError) {
      setError(
        requestError?.response?.data?.detail ||
          "Unable to load the executive dashboard."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: "60vh",
          display: "grid",
          placeItems: "center",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!data) {
    return <Alert severity="error">{error}</Alert>;
  }

  const school = data.school || {};
  const sponsorship = data.sponsorship || {};
  const finance = data.finance || {};
  const attendance = data.attendance || {};
  const academics = data.academics || {};
  const recent = data.recent || {};

  const cards = [
    ["Active Students", school.students, <School />],
    ["Teachers", school.teachers, <Groups />],
    ["Employees", school.employees, <Groups />],
    ["Classes", school.classes, <MenuBook />],
    ["Sponsored", sponsorship.sponsored, <Savings />],
    ["Unsponsored", sponsorship.unsponsored, <PersonOff />],
    ["Attendance Today", `${attendance.rate || 0}%`, <CheckCircle />],
    ["Promotion Rate", `${academics.promotion_rate || 0}%`, <Assessment />],
  ];

  const financeCards = [
    ["Total Collected", money(finance.collected), <Payments />],
    ["Outstanding", money(finance.outstanding), <AccountBalance />],
    ["Expenses", money(finance.expenses), <Payments />],
    ["Net Balance", money(finance.net_balance), <AccountBalance />],
    ["Today Collection", money(finance.today_collection), <Payments />],
    ["Month Collection", money(finance.month_collection), <Payments />],
    ["Pending Deposits", finance.pending_deposits || 0, <AccountBalance />],
    ["Statements to Review", finance.statement_review_required || 0, <Campaign />],
  ];

  return (
    <Box sx={{ pb: 5 }}>
      <Stack spacing={3}>
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={2}
          sx={{
            justifyContent: "space-between",
            alignItems: { xs: "stretch", md: "center" },
          }}
        >
          <Box>
            <Typography
              variant="h4"
              sx={{ color: "#0B2A78", fontWeight: 900 }}
            >
              Executive Owner Dashboard
            </Typography>
            <Typography color="text.secondary">
              {data.academic_context?.academic_year?.name ||
                "No active academic year"}
              {" • "}
              {data.academic_context?.term?.name ||
                "No active term"}
            </Typography>
          </Box>

          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={load}
          >
            Refresh
          </Button>
        </Stack>

        {error && <Alert severity="warning">{error}</Alert>}

        <Grid container spacing={2}>
          {cards.map(([title, value, icon]) => (
            <DashboardCard
              key={title}
              title={title}
              value={value || 0}
              icon={icon}
            />
          ))}
        </Grid>

        <Typography
          variant="h6"
          fontWeight={900}
          color="#0B2A78"
        >
          Financial Overview
        </Typography>

        <Grid container spacing={2}>
          {financeCards.map(([title, value, icon]) => (
            <DashboardCard
              key={title}
              title={title}
              value={value}
              icon={icon}
            />
          ))}
        </Grid>

        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper
              variant="outlined"
              sx={{ p: 3, borderRadius: 3, height: "100%" }}
            >
              <Typography
                variant="h6"
                fontWeight={900}
                color="#0B2A78"
              >
                Today's Attendance
              </Typography>

              <Typography
                variant="h3"
                fontWeight={900}
                color="#0B2A78"
                mt={2}
              >
                {attendance.rate || 0}%
              </Typography>

              <LinearProgress
                variant="determinate"
                value={Math.min(Number(attendance.rate || 0), 100)}
                sx={{
                  mt: 1,
                  mb: 3,
                  height: 10,
                  borderRadius: 5,
                }}
              />

              <Grid container spacing={2}>
                {[
                  ["Present", attendance.present],
                  ["Absent", attendance.absent],
                  ["Late", attendance.late],
                  ["Excused", attendance.excused],
                  ["Sick", attendance.sick],
                ].map(([label, value]) => (
                  <Grid key={label} size={{ xs: 6, md: 4 }}>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                    >
                      {label}
                    </Typography>
                    <Typography variant="h6" fontWeight={800}>
                      {value || 0}
                    </Typography>
                  </Grid>
                ))}
              </Grid>
            </Paper>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Paper
              variant="outlined"
              sx={{ p: 3, borderRadius: 3, height: "100%" }}
            >
              <Typography
                variant="h6"
                fontWeight={900}
                color="#0B2A78"
                mb={2}
              >
                Executive Controls
              </Typography>

              {[
                ["Portal Users", school.portal_users],
                ["Guardians", school.guardians],
                ["Subjects", school.subjects],
                ["Promotions Processed", academics.promotions_processed],
                ["Reconciled Statements", finance.reconciled_statements],
                ["Pending Bank Amount", money(finance.pending_bank_amount)],
              ].map(([label, value]) => (
                <Stack
                  key={label}
                  direction="row"
                  sx={{
                    justifyContent: "space-between",
                    py: 1.2,
                    borderBottom: "1px solid #E5E7EB",
                  }}
                >
                  <Typography color="text.secondary">
                    {label}
                  </Typography>
                  <Typography fontWeight={900}>
                    {value || 0}
                  </Typography>
                </Stack>
              ))}
            </Paper>
          </Grid>
        </Grid>

        <Grid container spacing={3}>
          <Grid size={{ xs: 12, xl: 4 }}>
            <RecentStudents records={recent.students || []} />
          </Grid>
          <Grid size={{ xs: 12, xl: 4 }}>
            <RecentPayments records={recent.payments || []} />
          </Grid>
          <Grid size={{ xs: 12, xl: 4 }}>
            <RecentNotices records={recent.notices || []} />
          </Grid>
        </Grid>
      </Stack>
    </Box>
  );
}

function DashboardCard({ title, value, icon }) {
  return (
    <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
      <Card
        variant="outlined"
        sx={{ borderRadius: 3, height: "100%" }}
      >
        <CardContent>
          <Stack
            direction="row"
            spacing={2}
            sx={{ alignItems: "center" }}
          >
            <Box
              sx={{
                width: 50,
                height: 50,
                borderRadius: 2,
                display: "grid",
                placeItems: "center",
                bgcolor: "#E8EEFF",
                color: "#0B2A78",
              }}
            >
              {icon}
            </Box>
            <Box>
              <Typography
                variant="caption"
                color="text.secondary"
              >
                {title}
              </Typography>
              <Typography variant="h6" fontWeight={900}>
                {value}
              </Typography>
            </Box>
          </Stack>
        </CardContent>
      </Card>
    </Grid>
  );
}

function TableShell({ title, children }) {
  return (
    <Paper
      variant="outlined"
      sx={{
        borderRadius: 3,
        overflow: "hidden",
        height: "100%",
      }}
    >
      <Box sx={{ p: 2 }}>
        <Typography
          variant="h6"
          fontWeight={900}
          color="#0B2A78"
        >
          {title}
        </Typography>
      </Box>
      <TableContainer>{children}</TableContainer>
    </Paper>
  );
}

function Header() {
  return (
    <TableRow
      sx={{
        "& th": {
          bgcolor: "#0B2A78",
          color: "white",
          fontWeight: 800,
        },
      }}
    >
      <TableCell>Record</TableCell>
      <TableCell>Details</TableCell>
    </TableRow>
  );
}

function Empty({ message }) {
  return (
    <TableRow>
      <TableCell colSpan={2} align="center" sx={{ py: 4 }}>
        <Typography color="text.secondary">
          {message}
        </Typography>
      </TableCell>
    </TableRow>
  );
}

function RecentStudents({ records }) {
  return (
    <TableShell title="Recent Students">
      <Table size="small">
        <TableHead><Header /></TableHead>
        <TableBody>
          {records.map((item) => (
            <TableRow key={item.id}>
              <TableCell>
                <Typography fontWeight={800}>
                  {item.full_name}
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                >
                  {item.admission_number}
                </Typography>
              </TableCell>
              <TableCell>{date(item.admission_date)}</TableCell>
            </TableRow>
          ))}
          {!records.length && (
            <Empty message="No recent students." />
          )}
        </TableBody>
      </Table>
    </TableShell>
  );
}

function RecentPayments({ records }) {
  return (
    <TableShell title="Recent Payments">
      <Table size="small">
        <TableHead><Header /></TableHead>
        <TableBody>
          {records.map((item) => (
            <TableRow key={item.id}>
              <TableCell>
                <Typography fontWeight={800}>
                  {item.student_name}
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                >
                  {item.receipt_number}
                </Typography>
              </TableCell>
              <TableCell>{money(item.amount)}</TableCell>
            </TableRow>
          ))}
          {!records.length && (
            <Empty message="No recent payments." />
          )}
        </TableBody>
      </Table>
    </TableShell>
  );
}

function RecentNotices({ records }) {
  return (
    <TableShell title="Recent Notices">
      <Table size="small">
        <TableHead><Header /></TableHead>
        <TableBody>
          {records.map((item) => (
            <TableRow key={item.id}>
              <TableCell>
                <Typography fontWeight={800}>
                  {item.title}
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                >
                  {date(item.published_at)}
                </Typography>
              </TableCell>
              <TableCell>
                <Chip
                  size="small"
                  label={item.priority}
                  color={
                    item.priority === "URGENT"
                      ? "error"
                      : item.priority === "HIGH"
                        ? "warning"
                        : "default"
                  }
                />
              </TableCell>
            </TableRow>
          ))}
          {!records.length && (
            <Empty message="No recent notices." />
          )}
        </TableBody>
      </Table>
    </TableShell>
  );
}
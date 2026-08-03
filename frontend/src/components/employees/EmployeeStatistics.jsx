import Grid from "@mui/material/Grid";

import BadgeIcon from "@mui/icons-material/Badge";
import GroupsIcon from "@mui/icons-material/Groups";
import SchoolIcon from "@mui/icons-material/School";
import BusinessIcon from "@mui/icons-material/Business";

import StatCard from "../common/StatCard";

export default function EmployeeStatistics({
  statistics = {},
  departmentCount = 0,
  loading = false,
}) {
  const total = statistics?.total ?? 0;
  const active = statistics?.active ?? 0;
  const teachers = statistics?.teachers ?? 0;

  return (
    <Grid container spacing={2.5}>
      <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
        <StatCard
          title="Total Employees"
          value={total}
          loading={loading}
          icon={<GroupsIcon fontSize="large" />}
          color="#0B2A78"
          subtitle="All registered employees"
        />
      </Grid>

      <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
        <StatCard
          title="Active Employees"
          value={active}
          loading={loading}
          icon={<BadgeIcon fontSize="large" />}
          color="#2E7D32"
          subtitle="Currently active staff"
        />
      </Grid>

      <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
        <StatCard
          title="Teachers"
          value={teachers}
          loading={loading}
          icon={<SchoolIcon fontSize="large" />}
          color="#ED6C02"
          subtitle="Active teaching employees"
        />
      </Grid>

      <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
        <StatCard
          title="Departments"
          value={departmentCount}
          loading={loading}
          icon={<BusinessIcon fontSize="large" />}
          color="#C8102E"
          subtitle="School departments"
        />
      </Grid>
    </Grid>
  );
}
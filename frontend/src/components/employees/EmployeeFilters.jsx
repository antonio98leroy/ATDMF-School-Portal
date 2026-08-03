import {
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
} from "@mui/material";

import FilterAltOffIcon from "@mui/icons-material/FilterAltOff";

import SearchBar from "../common/SearchBar";

const employmentTypes = [
  { value: "", label: "All Employment Types" },
  { value: "full_time", label: "Full Time" },
  { value: "part_time", label: "Part Time" },
  { value: "contract", label: "Contract" },
  { value: "temporary", label: "Temporary" },
  { value: "volunteer", label: "Volunteer" },
];

const statusOptions = [
  { value: "", label: "All Statuses" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "suspended", label: "Suspended" },
  { value: "terminated", label: "Terminated" },
  { value: "retired", label: "Retired" },
  { value: "on_leave", label: "On Leave" },
];

const teacherOptions = [
  { value: "", label: "All Employees" },
  { value: "true", label: "Teachers Only" },
  { value: "false", label: "Non-Teachers Only" },
];

export default function EmployeeFilters({
  search = "",
  department = "",
  position = "",
  employmentType = "",
  status = "",
  isTeacher = "",
  departments = [],
  positions = [],
  loading = false,
  onSearchChange,
  onDepartmentChange,
  onPositionChange,
  onEmploymentTypeChange,
  onStatusChange,
  onTeacherChange,
  onReset,
}) {
  const hasFilters =
    search ||
    department ||
    position ||
    employmentType ||
    status ||
    isTeacher;

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2,
        borderRadius: 3,
        bgcolor: "#FFFFFF",
      }}
    >
      <Stack spacing={2}>
        <SearchBar
          value={search}
          onChange={onSearchChange}
          placeholder="Search by employee ID, name, phone, email, department, or position"
          disabled={loading}
        />

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, 1fr)",
              lg: "repeat(5, minmax(150px, 1fr)) auto",
            },
            gap: 2,
            alignItems: "center",
          }}
        >
          <FormControl size="small" fullWidth>
            <InputLabel id="employee-department-filter-label">
              Department
            </InputLabel>

            <Select
              labelId="employee-department-filter-label"
              value={department}
              label="Department"
              disabled={loading}
              onChange={(event) =>
                onDepartmentChange?.(event.target.value)
              }
            >
              <MenuItem value="">
                All Departments
              </MenuItem>

              {departments.map((item) => (
                <MenuItem
                  key={item.id}
                  value={String(item.id)}
                >
                  {item.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" fullWidth>
            <InputLabel id="employee-position-filter-label">
              Position
            </InputLabel>

            <Select
              labelId="employee-position-filter-label"
              value={position}
              label="Position"
              disabled={loading}
              onChange={(event) =>
                onPositionChange?.(event.target.value)
              }
            >
              <MenuItem value="">
                All Positions
              </MenuItem>

              {positions.map((item) => (
                <MenuItem
                  key={item.id}
                  value={String(item.id)}
                >
                  {item.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" fullWidth>
            <InputLabel id="employee-type-filter-label">
              Employment Type
            </InputLabel>

            <Select
              labelId="employee-type-filter-label"
              value={employmentType}
              label="Employment Type"
              disabled={loading}
              onChange={(event) =>
                onEmploymentTypeChange?.(
                  event.target.value
                )
              }
            >
              {employmentTypes.map((option) => (
                <MenuItem
                  key={option.value || "all"}
                  value={option.value}
                >
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" fullWidth>
            <InputLabel id="employee-status-filter-label">
              Status
            </InputLabel>

            <Select
              labelId="employee-status-filter-label"
              value={status}
              label="Status"
              disabled={loading}
              onChange={(event) =>
                onStatusChange?.(event.target.value)
              }
            >
              {statusOptions.map((option) => (
                <MenuItem
                  key={option.value || "all"}
                  value={option.value}
                >
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" fullWidth>
            <InputLabel id="employee-teacher-filter-label">
              Employee Category
            </InputLabel>

            <Select
              labelId="employee-teacher-filter-label"
              value={isTeacher}
              label="Employee Category"
              disabled={loading}
              onChange={(event) =>
                onTeacherChange?.(event.target.value)
              }
            >
              {teacherOptions.map((option) => (
                <MenuItem
                  key={option.value || "all"}
                  value={option.value}
                >
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Button
            variant="outlined"
            startIcon={<FilterAltOffIcon />}
            onClick={onReset}
            disabled={loading || !hasFilters}
            sx={{
              minHeight: 40,
              whiteSpace: "nowrap",
              textTransform: "none",
              fontWeight: 700,
              borderColor: "#C8102E",
              color: "#C8102E",
              "&:hover": {
                borderColor: "#9D0C24",
                bgcolor: "rgba(200, 16, 46, 0.05)",
              },
            }}
          >
            Reset
          </Button>
        </Box>
      </Stack>
    </Paper>
  );
}
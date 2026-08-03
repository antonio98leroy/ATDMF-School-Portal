import {
  Avatar,
  Chip,
  IconButton,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";

import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import PersonIcon from "@mui/icons-material/Person";

import EmptyState from "../common/EmptyState";

const statusColor = {
  active: "success",
  inactive: "default",
  suspended: "warning",
  terminated: "error",
  retired: "secondary",
  on_leave: "info",
};

export default function EmployeeTable({
  employees = [],
  count = 0,
  page = 0,
  rowsPerPage = 10,
  loading = false,
  onPageChange,
  onRowsPerPageChange,
  onEdit,
  onDelete,
}) {
  if (!loading && employees.length === 0) {
    return (
      <EmptyState
        title="No Employees Found"
        description="There are no employee records matching the selected filters."
      />
    );
  }

  return (
    <Paper
      variant="outlined"
      sx={{
        mt: 3,
        borderRadius: 3,
        overflow: "hidden",
      }}
    >
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow
              sx={{
                bgcolor: "#0B2A78",
              }}
            >
              {[
                "Employee",
                "Department",
                "Position",
                "Phone",
                "Status",
                "Actions",
              ].map((header) => (
                <TableCell
                  key={header}
                  sx={{
                    color: "#FFFFFF",
                    fontWeight: 700,
                    whiteSpace: "nowrap",
                  }}
                >
                  {header}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>

          <TableBody>
            {employees.map((employee) => {
              const employeeStatus =
                employee.status || "inactive";

              const statusLabel = employeeStatus
                .replaceAll("_", " ")
                .replace(/\b\w/g, (letter) =>
                  letter.toUpperCase()
                );

              return (
                <TableRow
                  hover
                  key={employee.id}
                >
                  <TableCell>
                    <Stack
                      direction="row"
                      spacing={2}
                      sx={{
                        alignItems: "center",
                      }}
                    >
                      <Avatar
                        src={employee.photo_url || undefined}
                        alt={employee.full_name || "Employee"}
                        sx={{
                          width: 50,
                          height: 50,
                          bgcolor: "#0B2A78",
                        }}
                      >
                        <PersonIcon />
                      </Avatar>

                      <Stack spacing={0.25}>
                        <Typography fontWeight={700}>
                          {employee.full_name ||
                            "Unnamed Employee"}
                        </Typography>

                        <Typography
                          variant="body2"
                          color="text.secondary"
                        >
                          {employee.employee_id || "No ID"}
                        </Typography>
                      </Stack>
                    </Stack>
                  </TableCell>

                  <TableCell>
                    {employee.department_name ||
                      employee.department?.name ||
                      "Not assigned"}
                  </TableCell>

                  <TableCell>
                    {employee.position_name ||
                      employee.position?.name ||
                      "Not assigned"}
                  </TableCell>

                  <TableCell>
                    {employee.phone || "Not provided"}
                  </TableCell>

                  <TableCell>
                    <Chip
                      size="small"
                      label={statusLabel}
                      color={
                        statusColor[employeeStatus] ||
                        "default"
                      }
                    />
                  </TableCell>

                  <TableCell>
                    <Stack
                      direction="row"
                      spacing={0.5}
                      sx={{
                        alignItems: "center",
                      }}
                    >
                      <Tooltip title="Edit employee">
                        <IconButton
                          size="small"
                          color="primary"
                          aria-label={`Edit ${
                            employee.full_name || "employee"
                          }`}
                          onClick={() => onEdit?.(employee)}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title="Delete employee">
                        <IconButton
                          size="small"
                          color="error"
                          aria-label={`Delete ${
                            employee.full_name || "employee"
                          }`}
                          onClick={() =>
                            onDelete?.(employee)
                          }
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        component="div"
        count={Number(count) || 0}
        page={page}
        rowsPerPage={rowsPerPage}
        rowsPerPageOptions={[10, 25, 50, 100]}
        onPageChange={(event, newPage) => {
          onPageChange?.(event, newPage);
        }}
        onRowsPerPageChange={(event) => {
          onRowsPerPageChange?.(event);
        }}
        labelRowsPerPage="Employees per page:"
      />
    </Paper>
  );
}
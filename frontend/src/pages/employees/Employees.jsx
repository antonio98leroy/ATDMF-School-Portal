import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Snackbar,
  Stack,
} from "@mui/material";

import AddIcon from "@mui/icons-material/Add";
import ApartmentIcon from "@mui/icons-material/Apartment";
import BadgeIcon from "@mui/icons-material/Badge";
import RefreshIcon from "@mui/icons-material/Refresh";

import api from "../../api/client";

import PageHeader from "../../components/common/PageHeader";
import ConfirmDialog from "../../components/common/ConfirmDialog";

import EmployeeStatistics from "../../components/employees/EmployeeStatistics";
import EmployeeFilters from "../../components/employees/EmployeeFilters";
import EmployeeTable from "../../components/employees/EmployeeTable";
import EmployeeDialog from "../../components/employees/EmployeeDialog";
import DepartmentDialog from "../../components/employees/DepartmentDialog";
import PositionDialog from "../../components/employees/PositionDialog";

/*
|--------------------------------------------------------------------------
| API endpoints
|--------------------------------------------------------------------------
|
| Change these endpoints only if your Django router uses different paths.
|
| Expected backend URLs:
|
| /employees/records/
| /employees/records/statistics/
| /employees/departments/
| /employees/positions/
|
*/

const ENDPOINTS = {
  employees: "/employees/records/",
  statistics:
    "/employees/records/statistics/",
  departments: "/employees/departments/",
  positions: "/employees/positions/",
};

const initialFilters = {
  search: "",
  department: "",
  position: "",
  employmentType: "",
  status: "",
  isTeacher: "",
};

const initialStatistics = {
  total_employees: 0,
  active_employees: 0,
  teachers: 0,
  inactive_employees: 0,
  on_leave: 0,
};

const initialSnackbar = {
  open: false,
  message: "",
  severity: "success",
};

export default function Employees() {
  /*
  |--------------------------------------------------------------------------
  | Data
  |--------------------------------------------------------------------------
  */

  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [positions, setPositions] = useState([]);
  const [statistics, setStatistics] = useState(
    initialStatistics
  );

  /*
  |--------------------------------------------------------------------------
  | Filtering and pagination
  |--------------------------------------------------------------------------
  */

  const [filters, setFilters] = useState(
    initialFilters
  );

  const [debouncedSearch, setDebouncedSearch] =
    useState("");

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] =
    useState(10);
  const [employeeCount, setEmployeeCount] =
    useState(0);

  /*
  |--------------------------------------------------------------------------
  | Loading states
  |--------------------------------------------------------------------------
  */

  const [pageLoading, setPageLoading] =
    useState(true);

  const [employeesLoading, setEmployeesLoading] =
    useState(false);

  const [statisticsLoading, setStatisticsLoading] =
    useState(false);

  const [employeeSaving, setEmployeeSaving] =
    useState(false);

  const [departmentSaving, setDepartmentSaving] =
    useState(false);

  const [positionSaving, setPositionSaving] =
    useState(false);

  const [deleteLoading, setDeleteLoading] =
    useState(false);

  /*
  |--------------------------------------------------------------------------
  | General errors
  |--------------------------------------------------------------------------
  */

  const [pageError, setPageError] = useState("");

  /*
  |--------------------------------------------------------------------------
  | Employee dialog
  |--------------------------------------------------------------------------
  */

  const [employeeDialogOpen, setEmployeeDialogOpen] =
    useState(false);

  const [selectedEmployee, setSelectedEmployee] =
    useState(null);

  /*
  |--------------------------------------------------------------------------
  | Department dialog
  |--------------------------------------------------------------------------
  */

  const [
    departmentDialogOpen,
    setDepartmentDialogOpen,
  ] = useState(false);

  const [
    selectedDepartment,
    setSelectedDepartment,
  ] = useState(null);

  /*
  |--------------------------------------------------------------------------
  | Position dialog
  |--------------------------------------------------------------------------
  */

  const [positionDialogOpen, setPositionDialogOpen] =
    useState(false);

  const [selectedPosition, setSelectedPosition] =
    useState(null);

  /*
  |--------------------------------------------------------------------------
  | Delete confirmation
  |--------------------------------------------------------------------------
  */

  const [deleteDialogOpen, setDeleteDialogOpen] =
    useState(false);

  const [employeeToDelete, setEmployeeToDelete] =
    useState(null);

  /*
  |--------------------------------------------------------------------------
  | Snackbar
  |--------------------------------------------------------------------------
  */

  const [snackbar, setSnackbar] = useState(
    initialSnackbar
  );

  /*
  |--------------------------------------------------------------------------
  | Snackbar helpers
  |--------------------------------------------------------------------------
  */

  const showMessage = useCallback(
    (message, severity = "success") => {
      setSnackbar({
        open: true,
        message,
        severity,
      });
    },
    []
  );

  const closeSnackbar = (
    event,
    reason
  ) => {
    if (reason === "clickaway") {
      return;
    }

    setSnackbar((previous) => ({
      ...previous,
      open: false,
    }));
  };

  /*
  |--------------------------------------------------------------------------
  | Normalize paginated API responses
  |--------------------------------------------------------------------------
  */

  const normalizeListResponse = (responseData) => {
    if (Array.isArray(responseData)) {
      return {
        results: responseData,
        count: responseData.length,
      };
    }

    return {
      results: responseData?.results || [],
      count:
        responseData?.count ??
        responseData?.results?.length ??
        0,
    };
  };

  /*
  |--------------------------------------------------------------------------
  | Fetch departments
  |--------------------------------------------------------------------------
  */

  const fetchDepartments = useCallback(async () => {
    try {
      const response = await api.get(
        ENDPOINTS.departments,
        {
          params: {
            ordering: "name",
            page_size: 500,
          },
        }
      );

      const normalized = normalizeListResponse(
        response.data
      );

      setDepartments(normalized.results);
    } catch (error) {
      console.error(
        "Unable to load departments:",
        error
      );

      throw error;
    }
  }, []);

  /*
  |--------------------------------------------------------------------------
  | Fetch positions
  |--------------------------------------------------------------------------
  */

  const fetchPositions = useCallback(async () => {
    try {
      const response = await api.get(
        ENDPOINTS.positions,
        {
          params: {
            ordering: "name",
            page_size: 500,
          },
        }
      );

      const normalized = normalizeListResponse(
        response.data
      );

      setPositions(normalized.results);
    } catch (error) {
      console.error(
        "Unable to load positions:",
        error
      );

      throw error;
    }
  }, []);

  /*
  |--------------------------------------------------------------------------
  | Fetch employee statistics
  |--------------------------------------------------------------------------
  */

  const fetchStatistics = useCallback(async () => {
    setStatisticsLoading(true);

    try {
      const response = await api.get(
        ENDPOINTS.statistics
      );

      const data = response.data || {};

      setStatistics({
        total_employees:
          data.total_employees ??
          data.total ??
          0,

        active_employees:
          data.active_employees ??
          data.active ??
          0,

        teachers:
          data.teachers ??
          data.total_teachers ??
          0,

        inactive_employees:
          data.inactive_employees ??
          data.inactive ??
          0,

        on_leave:
          data.on_leave ??
          data.employees_on_leave ??
          0,
      });
    } catch (error) {
      console.error(
        "Unable to load employee statistics:",
        error
      );

      setStatistics(initialStatistics);
    } finally {
      setStatisticsLoading(false);
    }
  }, []);

  /*
  |--------------------------------------------------------------------------
  | Build employee query parameters
  |--------------------------------------------------------------------------
  */

  const employeeQueryParams = useMemo(() => {
    const params = {
      page: page + 1,
      page_size: rowsPerPage,
      ordering: "-created_at",
    };

    if (debouncedSearch.trim()) {
      params.search = debouncedSearch.trim();
    }

    if (filters.department) {
      params.department = filters.department;
    }

    if (filters.position) {
      params.position = filters.position;
    }

    if (filters.employmentType) {
      params.employment_type =
        filters.employmentType;
    }

    if (filters.status) {
      params.status = filters.status;
    }

    if (filters.isTeacher !== "") {
      params.is_teacher = filters.isTeacher;
    }

    return params;
  }, [
    page,
    rowsPerPage,
    debouncedSearch,
    filters.department,
    filters.position,
    filters.employmentType,
    filters.status,
    filters.isTeacher,
  ]);

  /*
  |--------------------------------------------------------------------------
  | Fetch employees
  |--------------------------------------------------------------------------
  */

  const fetchEmployees = useCallback(async () => {
    setEmployeesLoading(true);
    setPageError("");

    try {
      const response = await api.get(
        ENDPOINTS.employees,
        {
          params: employeeQueryParams,
        }
      );

      const normalized = normalizeListResponse(
        response.data
      );

      setEmployees(normalized.results);
      setEmployeeCount(normalized.count);
    } catch (error) {
      console.error(
        "Unable to load employees:",
        error
      );

      setEmployees([]);
      setEmployeeCount(0);

      setPageError(
        error?.response?.data?.detail ||
          "Unable to load employees. Please check your connection and try again."
      );
    } finally {
      setEmployeesLoading(false);
    }
  }, [employeeQueryParams]);

  /*
  |--------------------------------------------------------------------------
  | Initial school employee module loading
  |--------------------------------------------------------------------------
  */

  const loadInitialData = useCallback(async () => {
    setPageLoading(true);
    setPageError("");

    try {
      await Promise.all([
        fetchDepartments(),
        fetchPositions(),
        fetchStatistics(),
      ]);
    } catch (error) {
      setPageError(
        "Some employee management data could not be loaded."
      );
    } finally {
      setPageLoading(false);
    }
  }, [
    fetchDepartments,
    fetchPositions,
    fetchStatistics,
  ]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  /*
  |--------------------------------------------------------------------------
  | Search debounce
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearch(filters.search);
      setPage(0);
    }, 500);

    return () => {
      clearTimeout(timeout);
    };
  }, [filters.search]);

  /*
  |--------------------------------------------------------------------------
  | Load employees when query changes
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (!pageLoading) {
      fetchEmployees();
    }
  }, [
    fetchEmployees,
    pageLoading,
  ]);

  /*
  |--------------------------------------------------------------------------
  | Filter helpers
  |--------------------------------------------------------------------------
  */

  const updateFilter = (field, value) => {
    setFilters((previous) => ({
      ...previous,
      [field]: value,
    }));

    if (field !== "search") {
      setPage(0);
    }
  };

  const resetFilters = () => {
    setFilters(initialFilters);
    setDebouncedSearch("");
    setPage(0);
  };

  /*
  |--------------------------------------------------------------------------
  | Position options based on selected department
  |--------------------------------------------------------------------------
  */

  const filteredPositions = useMemo(() => {
    if (!filters.department) {
      return positions;
    }

    return positions.filter((position) => {
      const departmentId =
        position.department?.id ??
        position.department;

      return (
        String(departmentId) ===
        String(filters.department)
      );
    });
  }, [
    positions,
    filters.department,
  ]);

  /*
  |--------------------------------------------------------------------------
  | Filter department change
  |--------------------------------------------------------------------------
  |
  | When a department changes, clear a position that does not belong to it.
  |
  */

  const handleDepartmentFilterChange = (value) => {
    setFilters((previous) => {
      const selectedPosition = positions.find(
        (position) =>
          String(position.id) ===
          String(previous.position)
      );

      const selectedPositionDepartment =
        selectedPosition?.department?.id ??
        selectedPosition?.department;

      const shouldClearPosition =
        previous.position &&
        value &&
        String(selectedPositionDepartment) !==
          String(value);

      return {
        ...previous,
        department: value,
        position: shouldClearPosition
          ? ""
          : previous.position,
      };
    });

    setPage(0);
  };

  /*
  |--------------------------------------------------------------------------
  | Pagination
  |--------------------------------------------------------------------------
  */

  const handlePageChange = (
    event,
    newPage
  ) => {
    setPage(newPage);
  };

  const handleRowsPerPageChange = (event) => {
    setRowsPerPage(
      Number(event.target.value)
    );

    setPage(0);
  };

  /*
  |--------------------------------------------------------------------------
  | Employee dialog actions
  |--------------------------------------------------------------------------
  */

  const openAddEmployeeDialog = () => {
    setSelectedEmployee(null);
    setEmployeeDialogOpen(true);
  };

  const openEditEmployeeDialog = (employee) => {
    setSelectedEmployee(employee);
    setEmployeeDialogOpen(true);
  };

  const closeEmployeeDialog = () => {
    if (employeeSaving) {
      return;
    }

    setEmployeeDialogOpen(false);
    setSelectedEmployee(null);
  };

  /*
  |--------------------------------------------------------------------------
  | Save employee
  |--------------------------------------------------------------------------
  */

  const saveEmployee = async (
    formData,
    employee
  ) => {
    setEmployeeSaving(true);

    try {
      if (employee?.id) {
        await api.patch(
          `${ENDPOINTS.employees}${employee.id}/`,
          formData
        );

        showMessage(
          "Employee record updated successfully."
        );
      } else {
        await api.post(
          ENDPOINTS.employees,
          formData
        );

        showMessage(
          "New school employee added successfully."
        );
      }

      setEmployeeDialogOpen(false);
      setSelectedEmployee(null);

      await Promise.all([
        fetchEmployees(),
        fetchStatistics(),
      ]);
    } catch (error) {
      console.error(
        "Unable to save employee:",
        error
      );

      throw error;
    } finally {
      setEmployeeSaving(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Delete employee
  |--------------------------------------------------------------------------
  */

  const openDeleteDialog = (employee) => {
    setEmployeeToDelete(employee);
    setDeleteDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    if (deleteLoading) {
      return;
    }

    setDeleteDialogOpen(false);
    setEmployeeToDelete(null);
  };

  const deleteEmployee = async () => {
    if (!employeeToDelete?.id) {
      return;
    }

    setDeleteLoading(true);

    try {
      await api.delete(
        `${ENDPOINTS.employees}${employeeToDelete.id}/`
      );

      showMessage(
        `${
          employeeToDelete.full_name ||
          "Employee"
        } was deleted successfully.`
      );

      setDeleteDialogOpen(false);
      setEmployeeToDelete(null);

      /*
      | If the final record on the current page
      | was deleted, return to the previous page.
      */

      if (
        employees.length === 1 &&
        page > 0
      ) {
        setPage((previous) => previous - 1);
      } else {
        await fetchEmployees();
      }

      await fetchStatistics();
    } catch (error) {
      console.error(
        "Unable to delete employee:",
        error
      );

      showMessage(
        error?.response?.data?.detail ||
          "Unable to delete the employee. The employee may be linked to academic records.",
        "error"
      );
    } finally {
      setDeleteLoading(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Department dialog actions
  |--------------------------------------------------------------------------
  */

  const openAddDepartmentDialog = () => {
    setSelectedDepartment(null);
    setDepartmentDialogOpen(true);
  };

  const closeDepartmentDialog = () => {
    if (departmentSaving) {
      return;
    }

    setDepartmentDialogOpen(false);
    setSelectedDepartment(null);
  };

  const saveDepartment = async (
    payload,
    department
  ) => {
    setDepartmentSaving(true);

    try {
      if (department?.id) {
        await api.patch(
          `${ENDPOINTS.departments}${department.id}/`,
          payload
        );

        showMessage(
          "Department updated successfully."
        );
      } else {
        await api.post(
          ENDPOINTS.departments,
          payload
        );

        showMessage(
          "New school department created successfully."
        );
      }

      setDepartmentDialogOpen(false);
      setSelectedDepartment(null);

      await Promise.all([
        fetchDepartments(),
        fetchStatistics(),
      ]);
    } catch (error) {
      console.error(
        "Unable to save department:",
        error
      );

      throw error;
    } finally {
      setDepartmentSaving(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Position dialog actions
  |--------------------------------------------------------------------------
  */

  const openAddPositionDialog = () => {
    setSelectedPosition(null);
    setPositionDialogOpen(true);
  };

  const closePositionDialog = () => {
    if (positionSaving) {
      return;
    }

    setPositionDialogOpen(false);
    setSelectedPosition(null);
  };

  const savePosition = async (
    payload,
    position
  ) => {
    setPositionSaving(true);

    try {
      if (position?.id) {
        await api.patch(
          `${ENDPOINTS.positions}${position.id}/`,
          payload
        );

        showMessage(
          "Position updated successfully."
        );
      } else {
        await api.post(
          ENDPOINTS.positions,
          payload
        );

        showMessage(
          "New employee position created successfully."
        );
      }

      setPositionDialogOpen(false);
      setSelectedPosition(null);

      await fetchPositions();
    } catch (error) {
      console.error(
        "Unable to save position:",
        error
      );

      throw error;
    } finally {
      setPositionSaving(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Refresh
  |--------------------------------------------------------------------------
  */

  const refreshPage = async () => {
    setPageError("");

    try {
      await Promise.all([
        fetchEmployees(),
        fetchDepartments(),
        fetchPositions(),
        fetchStatistics(),
      ]);

      showMessage(
        "Employee records refreshed successfully."
      );
    } catch (error) {
      showMessage(
        "Some employee information could not be refreshed.",
        "error"
      );
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Loading screen
  |--------------------------------------------------------------------------
  */

  if (pageLoading) {
    return (
      <Box
        sx={{
          minHeight: "60vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Stack
          spacing={2}
          alignItems="center"
        >
          <CircularProgress />

          <Box
            component="span"
            sx={{
              color: "text.secondary",
              fontWeight: 600,
            }}
          >
            Loading school employees...
          </Box>
        </Stack>
      </Box>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Page
  |--------------------------------------------------------------------------
  */

  return (
    <Box
      sx={{
        width: "100%",
        pb: 4,
      }}
    >
      <Stack spacing={3}>
        <PageHeader
          title="Employee Management"
          subtitle="Manage teachers, administrators, finance staff, librarians and other school employees."
          actions={
            <Stack
              direction={{
                xs: "column",
                sm: "row",
              }}
              spacing={1}
            >
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={refreshPage}
                disabled={employeesLoading}
                sx={{
                  textTransform: "none",
                  fontWeight: 700,
                }}
              >
                Refresh
              </Button>

              <Button
                variant="outlined"
                startIcon={<ApartmentIcon />}
                onClick={
                  openAddDepartmentDialog
                }
                sx={{
                  textTransform: "none",
                  fontWeight: 700,
                  borderColor: "#0B2A78",
                  color: "#0B2A78",
                }}
              >
                Add Department
              </Button>

              <Button
                variant="outlined"
                startIcon={<BadgeIcon />}
                onClick={openAddPositionDialog}
                sx={{
                  textTransform: "none",
                  fontWeight: 700,
                  borderColor: "#0B2A78",
                  color: "#0B2A78",
                }}
              >
                Add Position
              </Button>

              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={openAddEmployeeDialog}
                sx={{
                  textTransform: "none",
                  fontWeight: 700,
                  bgcolor: "#C8102E",
                  "&:hover": {
                    bgcolor: "#9D0C24",
                  },
                }}
              >
                Add Employee
              </Button>
            </Stack>
          }
        />

        {pageError && (
          <Alert
            severity="error"
            action={
              <Button
                color="inherit"
                size="small"
                onClick={refreshPage}
              >
                Retry
              </Button>
            }
          >
            {pageError}
          </Alert>
        )}

        <EmployeeStatistics
          statistics={statistics}
          departmentCount={
            departments.length
          }
          loading={statisticsLoading}
        />

        <EmployeeFilters
          search={filters.search}
          department={filters.department}
          position={filters.position}
          employmentType={
            filters.employmentType
          }
          status={filters.status}
          isTeacher={filters.isTeacher}
          departments={departments}
          positions={filteredPositions}
          loading={employeesLoading}
          onSearchChange={(value) =>
            updateFilter("search", value)
          }
          onDepartmentChange={
            handleDepartmentFilterChange
          }
          onPositionChange={(value) =>
            updateFilter("position", value)
          }
          onEmploymentTypeChange={(value) =>
            updateFilter(
              "employmentType",
              value
            )
          }
          onStatusChange={(value) =>
            updateFilter("status", value)
          }
          onTeacherChange={(value) =>
            updateFilter("isTeacher", value)
          }
          onReset={resetFilters}
        />

        <EmployeeTable
          employees={employees}
          count={employeeCount}
          page={page}
          rowsPerPage={rowsPerPage}
          loading={employeesLoading}
          onPageChange={handlePageChange}
          onRowsPerPageChange={
            handleRowsPerPageChange
          }
          onEdit={openEditEmployeeDialog}
          onDelete={openDeleteDialog}
        />
      </Stack>

      <EmployeeDialog
        open={employeeDialogOpen}
        employee={selectedEmployee}
        departments={departments}
        positions={positions}
        loading={employeeSaving}
        onClose={closeEmployeeDialog}
        onSubmit={saveEmployee}
      />

      <DepartmentDialog
        open={departmentDialogOpen}
        department={selectedDepartment}
        loading={departmentSaving}
        onClose={closeDepartmentDialog}
        onSubmit={saveDepartment}
      />

      <PositionDialog
        open={positionDialogOpen}
        position={selectedPosition}
        departments={departments}
        loading={positionSaving}
        onClose={closePositionDialog}
        onSubmit={savePosition}
      />

      <ConfirmDialog
        open={deleteDialogOpen}
        title="Delete Employee"
        message={
          employeeToDelete
            ? `Are you sure you want to delete ${
                employeeToDelete.full_name ||
                employeeToDelete.employee_id ||
                "this employee"
              }? This action cannot be undone.`
            : ""
        }
        loading={deleteLoading}
        confirmText="Delete Employee"
        cancelText="Cancel"
        onClose={closeDeleteDialog}
        onConfirm={deleteEmployee}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={closeSnackbar}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
      >
        <Alert
          onClose={closeSnackbar}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
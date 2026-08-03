import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  CalendarMonth,
  CheckCircle,
  Groups,
  PersonOff,
  Refresh,
  Save,
  Schedule,
  Sick,
} from "@mui/icons-material";

import {
  Alert,
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
  TextField,
  Typography,
} from "@mui/material";

import { AttendanceAPI } from "../api/attendance";


function normalizeList(response) {
  if (Array.isArray(response?.data)) {
    return response.data;
  }

  return response?.data?.results || [];
}


function getErrorMessage(error) {
  const data = error?.response?.data;

  if (!data) {
    return "Unable to complete the attendance request.";
  }

  if (data.detail) {
    return data.detail;
  }

  return Object.entries(data)
    .map(([field, value]) => {
      const message = Array.isArray(value)
        ? value.join(" ")
        : String(value);

      return `${field}: ${message}`;
    })
    .join(" ");
}


const statusOptions = [
  {
    value: "P",
    label: "Present",
  },
  {
    value: "A",
    label: "Absent",
  },
  {
    value: "L",
    label: "Late",
  },
  {
    value: "E",
    label: "Excused",
  },
  {
    value: "S",
    label: "Sick",
  },
];


const employeeStatusOptions = [
  ...statusOptions,
  {
    value: "LV",
    label: "On Leave",
  },
];


const statusColors = {
  P: "success",
  A: "error",
  L: "warning",
  E: "info",
  S: "secondary",
  LV: "default",
};


export default function Attendance() {
  const [tab, setTab] = useState(0);

  const [academicYears, setAcademicYears] =
    useState([]);

  const [terms, setTerms] = useState([]);

  const [classes, setClasses] =
    useState([]);

  const [academicYear, setAcademicYear] =
    useState("");

  const [term, setTerm] = useState("");

  const [classSection, setClassSection] =
    useState("");

  const [date, setDate] = useState(
    new Date().toISOString().slice(0, 10)
  );

  const [studentRegister, setStudentRegister] =
    useState([]);

  const [employeeRegister, setEmployeeRegister] =
    useState([]);

  const [dailySummary, setDailySummary] =
    useState([]);

  const [
    frequentAbsentees,
    setFrequentAbsentees,
  ] = useState([]);

  const [studentStats, setStudentStats] =
    useState({});

  const [employeeStats, setEmployeeStats] =
    useState({});

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const filteredTerms = useMemo(() => {
    if (!academicYear) {
      return terms;
    }

    return terms.filter(
      (item) =>
        String(item.academic_year) ===
        String(academicYear)
    );
  }, [terms, academicYear]);

  const filteredClasses = useMemo(() => {
    if (!academicYear) {
      return classes;
    }

    return classes.filter(
      (item) =>
        String(item.academic_year) ===
        String(academicYear)
    );
  }, [classes, academicYear]);

  const loadReferences = async () => {
    setLoading(true);
    setError("");

    try {
      const [
        yearResponse,
        termResponse,
        classResponse,
      ] = await Promise.all([
        AttendanceAPI.getAcademicYears({
          page_size: 100,
        }),

        AttendanceAPI.getTerms({
          page_size: 500,
        }),

        AttendanceAPI.getClasses({
          page_size: 500,
        }),
      ]);

      const years =
        normalizeList(yearResponse);

      setAcademicYears(years);
      setTerms(normalizeList(termResponse));
      setClasses(
        normalizeList(classResponse)
      );

      const activeYear = years.find(
        (item) => item.active
      );

      if (activeYear) {
        setAcademicYear(activeYear.id);
      } else if (years.length > 0) {
        setAcademicYear(years[0].id);
      }
    } catch (requestError) {
      setError(
        getErrorMessage(requestError)
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReferences();
  }, []);

  useEffect(() => {
    if (!academicYear) {
      return;
    }

    const firstTerm = filteredTerms[0];

    if (
      firstTerm &&
      !filteredTerms.some(
        (item) =>
          String(item.id) ===
          String(term)
      )
    ) {
      setTerm(firstTerm.id);
    }

    const firstClass =
      filteredClasses[0];

    if (
      firstClass &&
      !filteredClasses.some(
        (item) =>
          String(item.id) ===
          String(classSection)
      )
    ) {
      setClassSection(firstClass.id);
    }
  }, [
    academicYear,
    filteredTerms,
    filteredClasses,
  ]);

  const loadStudentRegister = async () => {
    if (!classSection || !term) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const [
        registerResponse,
        statsResponse,
      ] = await Promise.all([
        AttendanceAPI.getClassRegister({
          class_section: classSection,
          term,
          date,
        }),

        AttendanceAPI.getStudentStatistics({
          class_section: classSection,
          term,
          date,
        }),
      ]);

      setStudentRegister(
        registerResponse.data.students || []
      );

      setStudentStats(
        statsResponse.data || {}
      );
    } catch (requestError) {
      setError(
        getErrorMessage(requestError)
      );
    } finally {
      setLoading(false);
    }
  };

  const loadEmployeeRegister = async () => {
    setLoading(true);
    setError("");

    try {
      const [
        registerResponse,
        statsResponse,
      ] = await Promise.all([
        AttendanceAPI.getEmployeeRegister({
          date,
        }),

        AttendanceAPI.getEmployeeStatistics({
          date,
        }),
      ]);

      setEmployeeRegister(
        registerResponse.data.employees ||
          []
      );

      setEmployeeStats(
        statsResponse.data || {}
      );
    } catch (requestError) {
      setError(
        getErrorMessage(requestError)
      );
    } finally {
      setLoading(false);
    }
  };

  const loadReports = async () => {
    setLoading(true);
    setError("");

    try {
      const [
        summaryResponse,
        absenteesResponse,
      ] = await Promise.all([
        AttendanceAPI.getDailySummary({
          academic_year: academicYear,
          date,
        }),

        AttendanceAPI.getFrequentAbsentees({
          academic_year: academicYear,
          minimum_absences: 3,
        }),
      ]);

      setDailySummary(
        summaryResponse.data.classes ||
          []
      );

      setFrequentAbsentees(
        Array.isArray(
          absenteesResponse.data
        )
          ? absenteesResponse.data
          : []
      );
    } catch (requestError) {
      setError(
        getErrorMessage(requestError)
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (loading) {
      return;
    }

    if (tab === 0) {
      loadStudentRegister();
    }

    if (tab === 1) {
      loadEmployeeRegister();
    }

    if (tab === 2) {
      loadReports();
    }
  }, [
    tab,
    classSection,
    term,
    date,
    academicYear,
  ]);

  const updateStudentRecord = (
    index,
    field,
    value
  ) => {
    setStudentRegister(
      (current) =>
        current.map((item, itemIndex) =>
          itemIndex === index
            ? {
                ...item,
                [field]: value,
              }
            : item
        )
    );
  };

  const updateEmployeeRecord = (
    index,
    field,
    value
  ) => {
    setEmployeeRegister(
      (current) =>
        current.map((item, itemIndex) =>
          itemIndex === index
            ? {
                ...item,
                [field]: value,
              }
            : item
        )
    );
  };

  const saveStudentAttendance =
    async () => {
      setSaving(true);
      setError("");

      try {
        await AttendanceAPI
          .saveClassAttendance({
            class_section:
              classSection,
            term,
            date,
            records:
              studentRegister.map(
                (item) => ({
                  student:
                    item.student,
                  status:
                    item.status,
                  remarks:
                    item.remarks || "",
                  time_in:
                    item.time_in || null,
                })
              ),
          });

        await loadStudentRegister();
      } catch (requestError) {
        setError(
          getErrorMessage(requestError)
        );
      } finally {
        setSaving(false);
      }
    };

  const saveEmployeeAttendance =
    async () => {
      setSaving(true);
      setError("");

      try {
        await AttendanceAPI
          .saveEmployeeAttendance({
            date,
            records:
              employeeRegister.map(
                (item) => ({
                  employee:
                    item.employee,
                  status:
                    item.status,
                  time_in:
                    item.time_in || null,
                  time_out:
                    item.time_out || null,
                  remarks:
                    item.remarks || "",
                })
              ),
          });

        await loadEmployeeRegister();
      } catch (requestError) {
        setError(
          getErrorMessage(requestError)
        );
      } finally {
        setSaving(false);
      }
    };

  if (loading && academicYears.length === 0) {
    return (
      <LoadingScreen />
    );
  }

  return (
    <Box sx={{ pb: 5 }}>
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
              fontWeight={900}
              color="#0B2A78"
            >
              Attendance Management
            </Typography>

            <Typography
              color="text.secondary"
            >
              Record and monitor student,
              teacher, and employee attendance.
            </Typography>
          </Box>

          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={() => {
              if (tab === 0) {
                loadStudentRegister();
              }

              if (tab === 1) {
                loadEmployeeRegister();
              }

              if (tab === 2) {
                loadReports();
              }
            }}
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
          <Grid container spacing={2}>
            <Grid
              size={{
                xs: 12,
                md: 3,
              }}
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
                  value={academicYear}
                  onChange={(event) =>
                    setAcademicYear(
                      event.target.value
                    )
                  }
                >
                  {academicYears.map(
                    (year) => (
                      <MenuItem
                        key={year.id}
                        value={year.id}
                      >
                        {year.name}
                      </MenuItem>
                    )
                  )}
                </Select>
              </FormControl>
            </Grid>

            <Grid
              size={{
                xs: 12,
                md: 3,
              }}
            >
              <FormControl
                fullWidth
                size="small"
                disabled={tab !== 0}
              >
                <InputLabel>
                  Term
                </InputLabel>

                <Select
                  label="Term"
                  value={term}
                  onChange={(event) =>
                    setTerm(
                      event.target.value
                    )
                  }
                >
                  {filteredTerms.map(
                    (item) => (
                      <MenuItem
                        key={item.id}
                        value={item.id}
                      >
                        {item.name}
                      </MenuItem>
                    )
                  )}
                </Select>
              </FormControl>
            </Grid>

            <Grid
              size={{
                xs: 12,
                md: 3,
              }}
            >
              <FormControl
                fullWidth
                size="small"
                disabled={tab !== 0}
              >
                <InputLabel>
                  Class
                </InputLabel>

                <Select
                  label="Class"
                  value={classSection}
                  onChange={(event) =>
                    setClassSection(
                      event.target.value
                    )
                  }
                >
                  {filteredClasses.map(
                    (item) => (
                      <MenuItem
                        key={item.id}
                        value={item.id}
                      >
                        {item.name ||
                          item.class_name ||
                          item.display_name}
                      </MenuItem>
                    )
                  )}
                </Select>
              </FormControl>
            </Grid>

            <Grid
              size={{
                xs: 12,
                md: 3,
              }}
            >
              <TextField
                fullWidth
                size="small"
                type="date"
                label="Attendance Date"
                value={date}
                slotProps={{
                  inputLabel: {
                    shrink: true,
                  },
                }}
                onChange={(event) =>
                  setDate(
                    event.target.value
                  )
                }
              />
            </Grid>
          </Grid>
        </Paper>

        <Tabs
          value={tab}
          onChange={(event, value) =>
            setTab(value)
          }
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="Student Attendance" />
          <Tab label="Employee Attendance" />
          <Tab label="Attendance Reports" />
        </Tabs>

        {tab === 0 && (
          <StudentRegister
            records={studentRegister}
            statistics={studentStats}
            loading={loading}
            saving={saving}
            onChange={
              updateStudentRecord
            }
            onSave={
              saveStudentAttendance
            }
          />
        )}

        {tab === 1 && (
          <EmployeeRegister
            records={employeeRegister}
            statistics={employeeStats}
            loading={loading}
            saving={saving}
            onChange={
              updateEmployeeRecord
            }
            onSave={
              saveEmployeeAttendance
            }
          />
        )}

        {tab === 2 && (
          <AttendanceReports
            dailySummary={dailySummary}
            frequentAbsentees={
              frequentAbsentees
            }
            loading={loading}
          />
        )}
      </Stack>
    </Box>
  );
}


function StudentRegister({
  records,
  statistics,
  loading,
  saving,
  onChange,
  onSave,
}) {
  if (loading) {
    return <LoadingPanel />;
  }

  return (
    <Stack spacing={2}>
      <AttendanceStats
        statistics={statistics}
      />

      <Stack
        direction="row"
        sx={{
          justifyContent:
            "space-between",
        }}
      >
        <Typography
          variant="h6"
          fontWeight={800}
          color="#0B2A78"
        >
          Daily Class Register
        </Typography>

        <Button
          variant="contained"
          startIcon={<Save />}
          disabled={
            saving ||
            records.length === 0
          }
          onClick={onSave}
          sx={{
            bgcolor: "#0B2A78",
          }}
        >
          Save Attendance
        </Button>
      </Stack>

      <AttendanceTablePaper>
        <Table>
          <TableHead>
            <HeaderRow>
              <TableCell>
                Admission Number
              </TableCell>
              <TableCell>
                Student
              </TableCell>
              <TableCell>
                Gender
              </TableCell>
              <TableCell>
                Status
              </TableCell>
              <TableCell>
                Time In
              </TableCell>
              <TableCell>
                Remarks
              </TableCell>
            </HeaderRow>
          </TableHead>

          <TableBody>
            {records.map(
              (record, index) => (
                <TableRow
                  key={record.student}
                  hover
                >
                  <TableCell>
                    {
                      record.admission_number
                    }
                  </TableCell>

                  <TableCell>
                    <Typography
                      fontWeight={700}
                    >
                      {
                        record.student_name
                      }
                    </Typography>
                  </TableCell>

                  <TableCell>
                    {record.gender}
                  </TableCell>

                  <TableCell>
                    <TextField
                      select
                      size="small"
                      value={record.status}
                      onChange={(event) =>
                        onChange(
                          index,
                          "status",
                          event.target.value
                        )
                      }
                      sx={{
                        minWidth: 130,
                      }}
                    >
                      {statusOptions.map(
                        (option) => (
                          <MenuItem
                            key={
                              option.value
                            }
                            value={
                              option.value
                            }
                          >
                            {option.label}
                          </MenuItem>
                        )
                      )}
                    </TextField>
                  </TableCell>

                  <TableCell>
                    <TextField
                      size="small"
                      type="time"
                      value={
                        record.time_in ||
                        ""
                      }
                      onChange={(event) =>
                        onChange(
                          index,
                          "time_in",
                          event.target.value
                        )
                      }
                    />
                  </TableCell>

                  <TableCell>
                    <TextField
                      size="small"
                      fullWidth
                      value={
                        record.remarks ||
                        ""
                      }
                      onChange={(event) =>
                        onChange(
                          index,
                          "remarks",
                          event.target.value
                        )
                      }
                    />
                  </TableCell>
                </TableRow>
              )
            )}

            {records.length === 0 && (
              <EmptyRow
                colSpan={6}
                message="No students are enrolled in this class."
              />
            )}
          </TableBody>
        </Table>
      </AttendanceTablePaper>
    </Stack>
  );
}


function EmployeeRegister({
  records,
  statistics,
  loading,
  saving,
  onChange,
  onSave,
}) {
  if (loading) {
    return <LoadingPanel />;
  }

  return (
    <Stack spacing={2}>
      <AttendanceStats
        statistics={statistics}
        employee
      />

      <Stack
        direction="row"
        sx={{
          justifyContent:
            "space-between",
        }}
      >
        <Typography
          variant="h6"
          fontWeight={800}
          color="#0B2A78"
        >
          Daily Employee Register
        </Typography>

        <Button
          variant="contained"
          startIcon={<Save />}
          disabled={
            saving ||
            records.length === 0
          }
          onClick={onSave}
          sx={{
            bgcolor: "#0B2A78",
          }}
        >
          Save Attendance
        </Button>
      </Stack>

      <AttendanceTablePaper>
        <Table>
          <TableHead>
            <HeaderRow>
              <TableCell>
                Employee ID
              </TableCell>
              <TableCell>
                Employee
              </TableCell>
              <TableCell>
                Department
              </TableCell>
              <TableCell>
                Position
              </TableCell>
              <TableCell>
                Status
              </TableCell>
              <TableCell>
                Time In
              </TableCell>
              <TableCell>
                Time Out
              </TableCell>
              <TableCell>
                Remarks
              </TableCell>
            </HeaderRow>
          </TableHead>

          <TableBody>
            {records.map(
              (record, index) => (
                <TableRow
                  key={record.employee}
                  hover
                >
                  <TableCell>
                    {record.employee_id}
                  </TableCell>

                  <TableCell>
                    <Typography
                      fontWeight={700}
                    >
                      {
                        record.employee_name
                      }
                    </Typography>
                  </TableCell>

                  <TableCell>
                    {
                      record.department_name
                    }
                  </TableCell>

                  <TableCell>
                    {
                      record.position_name
                    }
                  </TableCell>

                  <TableCell>
                    <TextField
                      select
                      size="small"
                      value={record.status}
                      onChange={(event) =>
                        onChange(
                          index,
                          "status",
                          event.target.value
                        )
                      }
                      sx={{
                        minWidth: 130,
                      }}
                    >
                      {employeeStatusOptions.map(
                        (option) => (
                          <MenuItem
                            key={
                              option.value
                            }
                            value={
                              option.value
                            }
                          >
                            {option.label}
                          </MenuItem>
                        )
                      )}
                    </TextField>
                  </TableCell>

                  <TableCell>
                    <TextField
                      size="small"
                      type="time"
                      value={
                        record.time_in ||
                        ""
                      }
                      onChange={(event) =>
                        onChange(
                          index,
                          "time_in",
                          event.target.value
                        )
                      }
                    />
                  </TableCell>

                  <TableCell>
                    <TextField
                      size="small"
                      type="time"
                      value={
                        record.time_out ||
                        ""
                      }
                      onChange={(event) =>
                        onChange(
                          index,
                          "time_out",
                          event.target.value
                        )
                      }
                    />
                  </TableCell>

                  <TableCell>
                    <TextField
                      size="small"
                      value={
                        record.remarks ||
                        ""
                      }
                      onChange={(event) =>
                        onChange(
                          index,
                          "remarks",
                          event.target.value
                        )
                      }
                    />
                  </TableCell>
                </TableRow>
              )
            )}

            {records.length === 0 && (
              <EmptyRow
                colSpan={8}
                message="No active employees were found."
              />
            )}
          </TableBody>
        </Table>
      </AttendanceTablePaper>
    </Stack>
  );
}


function AttendanceReports({
  dailySummary,
  frequentAbsentees,
  loading,
}) {
  if (loading) {
    return <LoadingPanel />;
  }

  return (
    <Stack spacing={3}>
      <AttendanceTablePaper>
        <Box sx={{ p: 2 }}>
          <Typography
            variant="h6"
            fontWeight={800}
            color="#0B2A78"
          >
            Daily Attendance by Class
          </Typography>
        </Box>

        <Table>
          <TableHead>
            <HeaderRow>
              <TableCell>Grade</TableCell>
              <TableCell>Class</TableCell>
              <TableCell>Total</TableCell>
              <TableCell>Present</TableCell>
              <TableCell>Absent</TableCell>
              <TableCell>Late</TableCell>
              <TableCell>Excused</TableCell>
              <TableCell>Sick</TableCell>
              <TableCell>Rate</TableCell>
            </HeaderRow>
          </TableHead>

          <TableBody>
            {dailySummary.map(
              (record) => (
                <TableRow
                  key={
                    record[
                      "class_section__id"
                    ]
                  }
                  hover
                >
                  <TableCell>
                    {
                      record[
                        "class_section__grade__name"
                      ]
                    }
                  </TableCell>

                  <TableCell>
                    {
                      record[
                        "class_section__name"
                      ]
                    }
                  </TableCell>

                  <TableCell>
                    {record.total}
                  </TableCell>

                  <TableCell>
                    {record.present}
                  </TableCell>

                  <TableCell>
                    {record.absent}
                  </TableCell>

                  <TableCell>
                    {record.late}
                  </TableCell>

                  <TableCell>
                    {record.excused}
                  </TableCell>

                  <TableCell>
                    {record.sick}
                  </TableCell>

                  <TableCell>
                    <Chip
                      label={`${record.attendance_rate}%`}
                      color={
                        record.attendance_rate >=
                        80
                          ? "success"
                          : record.attendance_rate >=
                              60
                            ? "warning"
                            : "error"
                      }
                    />
                  </TableCell>
                </TableRow>
              )
            )}

            {dailySummary.length === 0 && (
              <EmptyRow
                colSpan={9}
                message="No attendance has been recorded for this date."
              />
            )}
          </TableBody>
        </Table>
      </AttendanceTablePaper>

      <AttendanceTablePaper>
        <Box sx={{ p: 2 }}>
          <Typography
            variant="h6"
            fontWeight={800}
            color="#0B2A78"
          >
            Frequently Absent Students
          </Typography>

          <Typography
            color="text.secondary"
          >
            Students with three or more
            recorded absences.
          </Typography>
        </Box>

        <Table>
          <TableHead>
            <HeaderRow>
              <TableCell>
                Admission Number
              </TableCell>
              <TableCell>Student</TableCell>
              <TableCell>Grade</TableCell>
              <TableCell>Class</TableCell>
              <TableCell>
                Absence Count
              </TableCell>
            </HeaderRow>
          </TableHead>

          <TableBody>
            {frequentAbsentees.map(
              (record) => (
                <TableRow
                  key={record.student_id}
                  hover
                >
                  <TableCell>
                    {
                      record.admission_number
                    }
                  </TableCell>

                  <TableCell>
                    <Typography
                      fontWeight={700}
                    >
                      {
                        record.student_name
                      }
                    </Typography>
                  </TableCell>

                  <TableCell>
                    {record.grade_name}
                  </TableCell>

                  <TableCell>
                    {record.class_name}
                  </TableCell>

                  <TableCell>
                    <Chip
                      label={
                        record.absence_count
                      }
                      color="error"
                    />
                  </TableCell>
                </TableRow>
              )
            )}

            {frequentAbsentees.length ===
              0 && (
              <EmptyRow
                colSpan={5}
                message="No frequently absent students were found."
              />
            )}
          </TableBody>
        </Table>
      </AttendanceTablePaper>
    </Stack>
  );
}


function AttendanceStats({
  statistics,
  employee = false,
}) {
  const cards = [
    {
      title: "Present",
      value: statistics.present || 0,
      icon: <CheckCircle />,
    },
    {
      title: "Absent",
      value: statistics.absent || 0,
      icon: <PersonOff />,
    },
    {
      title: "Late",
      value: statistics.late || 0,
      icon: <Schedule />,
    },
    {
      title: "Sick",
      value: statistics.sick || 0,
      icon: <Sick />,
    },
    {
      title: "Attendance Rate",
      value: `${statistics.attendance_rate || 0}%`,
      icon: <CalendarMonth />,
    },
  ];

  if (employee) {
    cards.splice(4, 0, {
      title: "On Leave",
      value: statistics.leave || 0,
      icon: <Groups />,
    });
  }

  return (
    <Grid container spacing={2}>
      {cards.map((card) => (
        <Grid
          key={card.title}
          size={{
            xs: 12,
            sm: 6,
            lg: employee ? 2 : 2.4,
          }}
        >
          <Paper
            variant="outlined"
            sx={{
              p: 2,
              borderRadius: 3,
              height: "100%",
            }}
          >
            <Stack
              direction="row"
              spacing={1.5}
              sx={{
                alignItems: "center",
              }}
            >
              <Box
                sx={{
                  color: "#0B2A78",
                }}
              >
                {card.icon}
              </Box>

              <Box>
                <Typography
                  variant="caption"
                  color="text.secondary"
                >
                  {card.title}
                </Typography>

                <Typography
                  variant="h6"
                  fontWeight={900}
                >
                  {card.value}
                </Typography>
              </Box>
            </Stack>
          </Paper>
        </Grid>
      ))}
    </Grid>
  );
}


function AttendanceTablePaper({
  children,
}) {
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
          fontWeight: 800,
          whiteSpace: "nowrap",
        },
      }}
    >
      {children}
    </TableRow>
  );
}


function EmptyRow({
  colSpan,
  message,
}) {
  return (
    <TableRow>
      <TableCell
        colSpan={colSpan}
        align="center"
        sx={{ py: 5 }}
      >
        <Typography
          color="text.secondary"
        >
          {message}
        </Typography>
      </TableCell>
    </TableRow>
  );
}


function LoadingPanel() {
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


function LoadingScreen() {
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

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Assessment,
  Badge,
  CalendarMonth,
  Download,
  Groups,
  Payments,
  Print,
  Refresh,
  Savings,
  School,
  Upgrade,
} from "@mui/icons-material";

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
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

import { ReportsAPI } from "../api/reports";


function normalizeList(response) {
  if (Array.isArray(response?.data)) {
    return response.data;
  }

  return response?.data?.results || [];
}


function getErrorMessage(error) {
  return (
    error?.response?.data?.detail ||
    "Unable to load the selected report."
  );
}


function money(
  value,
  currency = "LRD"
) {
  const amount = Number(value || 0);

  if (currency === "USD") {
    return new Intl.NumberFormat(
      "en-US",
      {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2,
      }
    ).format(amount);
  }

  return `L$ ${amount.toLocaleString(
    "en-US",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  )}`;
}


function formatDate(value) {
  if (!value) {
    return "—";
  }

  return new Date(value).toLocaleDateString();
}


function escapeCsv(value) {
  const text =
    value === null || value === undefined
      ? ""
      : String(value);

  return `"${text.replaceAll('"', '""')}"`;
}


function downloadCsv(filename, columns, rows) {
  const header = columns
    .map((column) =>
      escapeCsv(column.label)
    )
    .join(",");

  const body = rows
    .map((row) =>
      columns
        .map((column) =>
          escapeCsv(
            typeof column.value === "function"
              ? column.value(row)
              : row[column.value]
          )
        )
        .join(",")
    )
    .join("\n");

  const blob = new Blob(
    [`${header}\n${body}`],
    {
      type: "text/csv;charset=utf-8;",
    }
  );

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  link.click();

  URL.revokeObjectURL(url);
}


function printReport(title, columns, rows) {
  const popup = window.open(
    "",
    "_blank",
    "width=1100,height=800"
  );

  if (!popup) {
    throw new Error(
      "Allow pop-ups and try printing again."
    );
  }

  const tableHead = columns
    .map(
      (column) =>
        `<th>${column.label}</th>`
    )
    .join("");

  const tableBody = rows
    .map(
      (row) =>
        `<tr>${columns
          .map((column) => {
            const value =
              typeof column.value ===
              "function"
                ? column.value(row)
                : row[column.value];

            return `<td>${
              value ?? ""
            }</td>`;
          })
          .join("")}</tr>`
    )
    .join("");

  popup.document.write(`
    <!doctype html>
    <html>
      <head>
        <title>${title}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            padding: 24px;
            color: #111827;
          }

          h1 {
            color: #0B2A78;
            margin-bottom: 4px;
          }

          .subtitle {
            color: #6B7280;
            margin-bottom: 24px;
          }

          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 12px;
          }

          th {
            background: #0B2A78;
            color: white;
            text-align: left;
          }

          th, td {
            border: 1px solid #D1D5DB;
            padding: 8px;
          }

          tr:nth-child(even) {
            background: #F8FAFC;
          }
        </style>
      </head>

      <body>
        <h1>
          Annie T. Doe Memorial Foundation High School
        </h1>

        <div class="subtitle">
          ${title} • Generated ${new Date().toLocaleString()}
        </div>

        <table>
          <thead>
            <tr>${tableHead}</tr>
          </thead>

          <tbody>${tableBody}</tbody>
        </table>

        <script>
          window.onload = function () {
            window.print();
          };
        </script>
      </body>
    </html>
  `);

  popup.document.close();
}


const REPORTS = [
  {
    label: "Student Register",
    key: "students",
    icon: <School />,
  },
  {
    label: "Sponsorship",
    key: "sponsorships",
    icon: <Savings />,
  },
  {
    label: "Attendance",
    key: "attendance",
    icon: <CalendarMonth />,
  },
  {
    label: "Finance",
    key: "finance",
    icon: <Payments />,
  },
  {
    label: "Promotions",
    key: "promotions",
    icon: <Upgrade />,
  },
  {
    label: "Employees",
    key: "employees",
    icon: <Badge />,
  },
  {
    label: "Academic Performance",
    key: "academic",
    icon: <Assessment />,
  },
];


export default function ReportsCenter() {
  const [tab, setTab] = useState(0);

  const [summary, setSummary] =
    useState({});

  const [academicYears, setAcademicYears] =
    useState([]);

  const [classes, setClasses] =
    useState([]);

  const [academicYear, setAcademicYear] =
    useState("");

  const [classSection, setClassSection] =
    useState("");

  const [dateFrom, setDateFrom] =
    useState("");

  const [dateTo, setDateTo] =
    useState("");

  const [fundingStatus, setFundingStatus] =
    useState("");

  const [attendanceType, setAttendanceType] =
    useState("student");

  const [financeType, setFinanceType] =
    useState("payments");

  const [currency, setCurrency] =
    useState("");

  const [promotionDecision, setPromotionDecision] =
    useState("");

  const [records, setRecords] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [reportLoading, setReportLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const activeReport = REPORTS[tab];

  const filteredClasses = useMemo(() => {
    if (!academicYear) {
      return classes;
    }

    return classes.filter(
      (item) =>
        !item.academic_year ||
        String(item.academic_year) ===
          String(academicYear)
    );
  }, [classes, academicYear]);

  const loadReferences = useCallback(async () => {
    setLoading(true);

    try {
      const [
        yearsResponse,
        classesResponse,
      ] = await Promise.all([
        ReportsAPI.getAcademicYears({
          page_size: 100,
        }),
        ReportsAPI.getClasses({
          page_size: 1000,
        }),
      ]);

      const years =
        normalizeList(yearsResponse);

      setAcademicYears(years);
      setClasses(
        normalizeList(classesResponse)
      );

      const active = years.find(
        (item) => item.active
      );

      if (active) {
        setAcademicYear(active.id);
      } else if (years.length) {
        setAcademicYear(years[0].id);
      }
    } catch (requestError) {
      setError(
        getErrorMessage(requestError)
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const loadSummary = useCallback(async () => {
    try {
      const response =
        await ReportsAPI.getSummary({
          academic_year: academicYear || undefined,
        });

      setSummary(response.data || {});
    } catch (requestError) {
      setError(
        getErrorMessage(requestError)
      );
    }
  }, [academicYear]);

  useEffect(() => {
    loadReferences();
  }, []);

  useEffect(() => {
    if (academicYear) {
      loadSummary();
    }
  }, [academicYear]);

  const loadReport = async () => {
    setReportLoading(true);
    setError("");

    const common = {
      academic_year:
        academicYear || undefined,
      class_section:
        classSection || undefined,
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
    };

    try {
      let response;

      switch (activeReport.key) {
        case "students":
          response =
            await ReportsAPI.getStudents(
              common
            );
          break;

        case "sponsorships":
          response =
            await ReportsAPI.getSponsorships({
              ...common,
              funding_status:
                fundingStatus || undefined,
            });
          break;

        case "attendance":
          response =
            await ReportsAPI.getAttendance({
              ...common,
              type: attendanceType,
            });
          break;

        case "finance":
          response =
            await ReportsAPI.getFinance({
              ...common,
              type: financeType,
              currency:
                currency || undefined,
            });
          break;

        case "promotions":
          response =
            await ReportsAPI.getPromotions({
              ...common,
              decision:
                promotionDecision ||
                undefined,
            });
          break;

        case "employees":
          response =
            await ReportsAPI.getEmployees();
          break;

        case "academic":
          response =
            await ReportsAPI.getAcademicPerformance(
              common
            );
          break;

        default:
          response = { data: [] };
      }

      setRecords(
        Array.isArray(response.data)
          ? response.data
          : []
      );
    } catch (requestError) {
      setRecords([]);
      setError(
        getErrorMessage(requestError)
      );
    } finally {
      setReportLoading(false);
    }
  };

  useEffect(() => {
    if (!loading) {
      loadReport();
    }
  }, [tab]);

  const columns = useMemo(
    () =>
      getColumns(
        activeReport.key,
        attendanceType,
        financeType
      ),
    [
      activeReport.key,
      attendanceType,
      financeType,
    ]
  );

  if (loading) {
    return <LoadingScreen />;
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
            justifyContent: "space-between",
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
              Reports Center
            </Typography>

            <Typography
              color="text.secondary"
            >
              Generate, print, and export operational school reports.
            </Typography>
          </Box>

          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={() => {
              loadSummary();
              loadReport();
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

        <Grid container spacing={2}>
          <SummaryCard
            title="Students"
            value={summary.students || 0}
            icon={<School />}
          />

          <SummaryCard
            title="Sponsored"
            value={summary.sponsored || 0}
            icon={<Savings />}
          />

          <SummaryCard
            title="Unsponsored"
            value={summary.unsponsored || 0}
            icon={<Groups />}
          />

          <SummaryCard
            title="Collected — LRD"
            value={money(
              summary.finance_by_currency
                ?.LRD?.collected,
              "LRD"
            )}
            icon={<Payments />}
          />

          <SummaryCard
            title="Collected — USD"
            value={money(
              summary.finance_by_currency
                ?.USD?.collected,
              "USD"
            )}
            icon={<Payments />}
          />

          <SummaryCard
            title="Outstanding — LRD"
            value={money(
              summary.finance_by_currency
                ?.LRD?.outstanding,
              "LRD"
            )}
            icon={<Payments />}
          />

          <SummaryCard
            title="Outstanding — USD"
            value={money(
              summary.finance_by_currency
                ?.USD?.outstanding,
              "USD"
            )}
            icon={<Payments />}
          />

          <SummaryCard
            title="Promotions"
            value={summary.promotions || 0}
            icon={<Upgrade />}
          />
        </Grid>

        <Tabs
          value={tab}
          onChange={(event, value) =>
            setTab(value)
          }
          variant="scrollable"
          scrollButtons="auto"
        >
          {REPORTS.map((report) => (
            <Tab
              key={report.key}
              label={report.label}
              icon={report.icon}
              iconPosition="start"
            />
          ))}
        </Tabs>

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

            {[
              "students",
              "attendance",
              "academic",
            ].includes(
              activeReport.key
            ) && (
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
                    <MenuItem value="">
                      All Classes
                    </MenuItem>

                    {filteredClasses.map(
                      (item) => (
                        <MenuItem
                          key={item.id}
                          value={item.id}
                        >
                          {item.display_name ||
                            item.class_name ||
                            item.name}
                        </MenuItem>
                      )
                    )}
                  </Select>
                </FormControl>
              </Grid>
            )}

            {activeReport.key ===
              "sponsorships" && (
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
                    Funding Status
                  </InputLabel>

                  <Select
                    label="Funding Status"
                    value={fundingStatus}
                    onChange={(event) =>
                      setFundingStatus(
                        event.target.value
                      )
                    }
                  >
                    <MenuItem value="">
                      All
                    </MenuItem>

                    <MenuItem value="SPONSORED">
                      Sponsored
                    </MenuItem>

                    <MenuItem value="PARTIALLY_SPONSORED">
                      Partially Sponsored
                    </MenuItem>

                    <MenuItem value="UNSPONSORED">
                      Unsponsored
                    </MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            )}

            {activeReport.key ===
              "attendance" && (
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
                    Attendance Type
                  </InputLabel>

                  <Select
                    label="Attendance Type"
                    value={attendanceType}
                    onChange={(event) =>
                      setAttendanceType(
                        event.target.value
                      )
                    }
                  >
                    <MenuItem value="student">
                      Students
                    </MenuItem>

                    <MenuItem value="employee">
                      Employees
                    </MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            )}

            {activeReport.key ===
              "finance" && (
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
                    Finance Report
                  </InputLabel>

                  <Select
                    label="Finance Report"
                    value={financeType}
                    onChange={(event) =>
                      setFinanceType(
                        event.target.value
                      )
                    }
                  >
                    <MenuItem value="payments">
                      Payments
                    </MenuItem>

                    <MenuItem value="outstanding">
                      Outstanding Balances
                    </MenuItem>

                    <MenuItem value="expenses">
                      Expenses
                    </MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            )}

            {activeReport.key ===
              "finance" && (
              <Grid
                size={{
                  xs: 12,
                  md: 2,
                }}
              >
                <FormControl
                  fullWidth
                  size="small"
                >
                  <InputLabel>
                    Currency
                  </InputLabel>

                  <Select
                    label="Currency"
                    value={currency}
                    onChange={(event) =>
                      setCurrency(
                        event.target.value
                      )
                    }
                  >
                    <MenuItem value="">
                      All Currencies
                    </MenuItem>

                    <MenuItem value="LRD">
                      LRD
                    </MenuItem>

                    <MenuItem value="USD">
                      USD
                    </MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            )}

            {activeReport.key ===
              "promotions" && (
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
                    Decision
                  </InputLabel>

                  <Select
                    label="Decision"
                    value={
                      promotionDecision
                    }
                    onChange={(event) =>
                      setPromotionDecision(
                        event.target.value
                      )
                    }
                  >
                    <MenuItem value="">
                      All
                    </MenuItem>

                    <MenuItem value="PROMOTED">
                      Promoted
                    </MenuItem>

                    <MenuItem value="REPEATED">
                      Repeated
                    </MenuItem>

                    <MenuItem value="GRADUATED">
                      Graduated
                    </MenuItem>

                    <MenuItem value="WITHDRAWN">
                      Withdrawn
                    </MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            )}

            {[
              "attendance",
              "finance",
            ].includes(
              activeReport.key
            ) && (
              <>
                <Grid
                  size={{
                    xs: 12,
                    md: 2,
                  }}
                >
                  <TextField
                    fullWidth
                    size="small"
                    type="date"
                    label="From"
                    value={dateFrom}
                    slotProps={{
                      inputLabel: {
                        shrink: true,
                      },
                    }}
                    onChange={(event) =>
                      setDateFrom(
                        event.target.value
                      )
                    }
                  />
                </Grid>

                <Grid
                  size={{
                    xs: 12,
                    md: 2,
                  }}
                >
                  <TextField
                    fullWidth
                    size="small"
                    type="date"
                    label="To"
                    value={dateTo}
                    slotProps={{
                      inputLabel: {
                        shrink: true,
                      },
                    }}
                    onChange={(event) =>
                      setDateTo(
                        event.target.value
                      )
                    }
                  />
                </Grid>
              </>
            )}

            <Grid
              size={{
                xs: 12,
                md: 2,
              }}
            >
              <Button
                fullWidth
                variant="contained"
                onClick={loadReport}
                sx={{
                  minHeight: 40,
                  bgcolor: "#0B2A78",
                }}
              >
                Generate
              </Button>
            </Grid>
          </Grid>
        </Paper>

        <Stack
          direction={{
            xs: "column",
            sm: "row",
          }}
          spacing={1}
          sx={{
            justifyContent: "space-between",
          }}
        >
          <Box>
            <Typography
              variant="h6"
              fontWeight={900}
              color="#0B2A78"
            >
              {activeReport.label}
            </Typography>

            <Typography
              color="text.secondary"
            >
              {records.length} record(s)
            </Typography>
          </Box>

          <Stack
            direction="row"
            spacing={1}
          >
            <Button
              variant="outlined"
              startIcon={<Download />}
              disabled={!records.length}
              onClick={() =>
                downloadCsv(
                  `${activeReport.key}-report.csv`,
                  columns,
                  records
                )
              }
            >
              Export CSV
            </Button>

            <Button
              variant="contained"
              startIcon={<Print />}
              disabled={!records.length}
              onClick={() =>
                printReport(
                  activeReport.label,
                  columns,
                  records
                )
              }
              sx={{ bgcolor: "#0B2A78" }}
            >
              Print
            </Button>
          </Stack>
        </Stack>

        <ReportTable
          columns={columns}
          records={records}
          loading={reportLoading}
        />
      </Stack>
    </Box>
  );
}


function SummaryCard({
  title,
  value,
  icon,
}) {
  return (
    <Grid
      size={{
        xs: 12,
        sm: 6,
        lg: 2,
      }}
    >
      <Card
        variant="outlined"
        sx={{
          borderRadius: 3,
          height: "100%",
        }}
      >
        <CardContent>
          <Stack
            direction="row"
            spacing={1.5}
            sx={{ alignItems: "center" }}
          >
            <Box
              sx={{
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

              <Typography
                variant="h6"
                fontWeight={900}
              >
                {value}
              </Typography>
            </Box>
          </Stack>
        </CardContent>
      </Card>
    </Grid>
  );
}


function ReportTable({
  columns,
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

  return (
    <Paper
      variant="outlined"
      sx={{
        borderRadius: 3,
        overflow: "hidden",
      }}
    >
      <TableContainer>
        <Table size="small">
          <TableHead>
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
              {columns.map((column) => (
                <TableCell
                  key={column.label}
                >
                  {column.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>

          <TableBody>
            {records.map(
              (record, index) => (
                <TableRow
                  key={
                    record.id ||
                    record.enrollment_id ||
                    record.receipt_number ||
                    index
                  }
                  hover
                >
                  {columns.map((column) => (
                    <TableCell
                      key={column.label}
                    >
                      {typeof column.value ===
                      "function"
                        ? column.value(record)
                        : record[
                            column.value
                          ] ?? "—"}
                    </TableCell>
                  ))}
                </TableRow>
              )
            )}

            {records.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  align="center"
                  sx={{ py: 5 }}
                >
                  <Typography
                    color="text.secondary"
                  >
                    No records found for the selected report.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}


function getColumns(
  report,
  attendanceType,
  financeType
) {
  if (report === "students") {
    return [
      {
        label: "Admission No.",
        value: "admission_number",
      },
      {
        label: "Student",
        value: "student_name",
      },
      {
        label: "Gender",
        value: "gender",
      },
      {
        label: "Class",
        value: "class_name",
      },
      {
        label: "Academic Year",
        value: "academic_year",
      },
      {
        label: "Guardian",
        value: "guardian_name",
      },
      {
        label: "Guardian Phone",
        value: "guardian_phone",
      },
    ];
  }

  if (report === "sponsorships") {
    return [
      {
        label: "Admission No.",
        value: "admission_number",
      },
      {
        label: "Student",
        value: "student_name",
      },
      {
        label: "Status",
        value: "funding_status",
      },
      {
        label: "Sponsor",
        value: "sponsor",
      },
      {
        label: "Coverage",
        value: "coverage_type",
      },
      {
        label: "Value",
        value: "coverage_value",
      },
      {
        label: "Reference",
        value: "reference_number",
      },
    ];
  }

  if (report === "attendance") {
    if (attendanceType === "employee") {
      return [
        {
          label: "Date",
          value: (row) =>
            formatDate(row.date),
        },
        {
          label: "Employee ID",
          value: "employee_id",
        },
        {
          label: "Employee",
          value: "employee_name",
        },
        {
          label: "Department",
          value: "department",
        },
        {
          label: "Status",
          value: "status",
        },
        {
          label: "Time In",
          value: "time_in",
        },
        {
          label: "Time Out",
          value: "time_out",
        },
      ];
    }

    return [
      {
        label: "Date",
        value: (row) =>
          formatDate(row.date),
      },
      {
        label: "Admission No.",
        value: "admission_number",
      },
      {
        label: "Student",
        value: "student_name",
      },
      {
        label: "Class",
        value: "class_name",
      },
      {
        label: "Term",
        value: "term",
      },
      {
        label: "Status",
        value: "status",
      },
      {
        label: "Remarks",
        value: "remarks",
      },
    ];
  }

  if (report === "finance") {
    if (financeType === "outstanding") {
      return [
        {
          label: "Invoice",
          value: "invoice_number",
        },
        {
          label: "Student",
          value: "student_name",
        },
        {
          label: "Currency",
          value: "currency",
        },
        {
          label: "Total",
          value: (row) =>
            money(
              row.total_amount,
              row.currency
            ),
        },
        {
          label: "Paid",
          value: (row) =>
            money(
              row.paid_amount,
              row.currency
            ),
        },
        {
          label: "Balance",
          value: (row) =>
            money(
              row.balance,
              row.currency
            ),
        },
        {
          label: "Due Date",
          value: (row) =>
            formatDate(row.due_date),
        },
      ];
    }

    if (financeType === "expenses") {
      return [
        {
          label: "Expense No.",
          value: "expense_number",
        },
        {
          label: "Category",
          value: "category",
        },
        {
          label: "Description",
          value: "description",
        },
        {
          label: "Vendor",
          value: "vendor",
        },
        {
          label: "Currency",
          value: "currency",
        },
        {
          label: "Amount",
          value: (row) =>
            money(
              row.amount,
              row.currency
            ),
        },
        {
          label: "Date",
          value: (row) =>
            formatDate(row.date),
        },
      ];
    }

    return [
      {
        label: "Receipt",
        value: "receipt_number",
      },
      {
        label: "Student",
        value: "student_name",
      },
      {
        label: "Bank Slip",
        value: "bank_slip_number",
      },
      {
        label: "Amount",
        value: (row) =>
          money(row.amount),
      },
      {
        label: "Method",
        value: "method",
      },
      {
        label: "Paid Date",
        value: (row) =>
          formatDate(row.paid_at),
      },
      {
        label: "Statement Verified",
        value: (row) =>
          row.verified_against_statement
            ? "Yes"
            : "No",
      },
    ];
  }

  if (report === "promotions") {
    return [
      {
        label: "Admission No.",
        value: "admission_number",
      },
      {
        label: "Student",
        value: "student_name",
      },
      {
        label: "Source Class",
        value: "source_class",
      },
      {
        label: "Decision",
        value: "decision",
      },
      {
        label: "Target Class",
        value: "target_class",
      },
      {
        label: "Average",
        value: "yearly_average",
      },
      {
        label: "Processed",
        value: (row) =>
          formatDate(row.processed_at),
      },
    ];
  }

  if (report === "employees") {
    return [
      {
        label: "Employee ID",
        value: "employee_id",
      },
      {
        label: "Employee",
        value: "employee_name",
      },
      {
        label: "Department",
        value: "department",
      },
      {
        label: "Position",
        value: "position",
      },
      {
        label: "Phone",
        value: "phone",
      },
      {
        label: "Email",
        value: "email",
      },
      {
        label: "Status",
        value: "status",
      },
    ];
  }

  return [
    {
      label: "Admission No.",
      value: "admission_number",
    },
    {
      label: "Student",
      value: "student_name",
    },
    {
      label: "Class",
      value: "class_name",
    },
    {
      label: "Subject",
      value: "subject",
    },
    {
      label: "Year Average",
      value: "yearly_average",
    },
    {
      label: "Grade",
      value: "grade",
    },
    {
      label: "Remark",
      value: "remark",
    },
  ];
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
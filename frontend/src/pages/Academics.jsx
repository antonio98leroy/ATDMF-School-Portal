import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";

import {
  Add,
  CalendarMonth,
  Class,
  Delete,
  Edit,
  MenuBook,
  Refresh,
  School,
  Search,
} from "@mui/icons-material";

import api from "../api/client";

const emptyForms = {
  years: {
    name: "",
    start_date: "",
    end_date: "",
    active: false,
  },
  grades: {
    name: "",
    order: 1,
  },
  classes: {
    grade: "",
    name: "",
    capacity: 40,
  },
  subjects: {
    code: "",
    name: "",
    description: "",
  },
};

const moduleConfiguration = {
  years: {
    title: "Academic Years",
    endpoint: "/academics/years/",
    icon: <CalendarMonth />,
  },
  grades: {
    title: "Grade Levels",
    endpoint: "/academics/grades/",
    icon: <School />,
  },
  classes: {
    title: "Classes and Sections",
    endpoint: "/academics/classes/",
    icon: <Class />,
  },
  subjects: {
    title: "Subjects",
    endpoint: "/academics/subjects/",
    icon: <MenuBook />,
  },
};

function extractRows(response) {
  return response.data.results || response.data;
}

export default function Academics() {
  const [activeTab, setActiveTab] = useState("years");

  const [records, setRecords] = useState({
    years: [],
    grades: [],
    classes: [],
    subjects: [],
  });

  const [counts, setCounts] = useState({
    years: 0,
    grades: 0,
    classes: 0,
    subjects: 0,
  });

  const [form, setForm] = useState(
    emptyForms.years
  );
  const [selectedRecord, setSelectedRecord] =
    useState(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const currentConfiguration =
    moduleConfiguration[activeTab];

  const currentRows = records[activeTab] || [];

  const dashboardCards = useMemo(
    () => [
      {
        label: "Academic Years",
        value: counts.years,
        icon: <CalendarMonth />,
      },
      {
        label: "Grade Levels",
        value: counts.grades,
        icon: <School />,
      },
      {
        label: "Classes",
        value: counts.classes,
        icon: <Class />,
      },
      {
        label: "Subjects",
        value: counts.subjects,
        icon: <MenuBook />,
      },
    ],
    [counts]
  );

  const loadAllData = async () => {
    setLoading(true);
    setError("");

    try {
      const [
        yearsResponse,
        gradesResponse,
        classesResponse,
        subjectsResponse,
      ] = await Promise.all([
        api.get("/academics/years/"),
        api.get("/academics/grades/"),
        api.get("/academics/classes/"),
        api.get("/academics/subjects/"),
      ]);

      const years = extractRows(yearsResponse);
      const grades = extractRows(gradesResponse);
      const classes = extractRows(classesResponse);
      const subjects = extractRows(subjectsResponse);

      setRecords({
        years,
        grades,
        classes,
        subjects,
      });

      setCounts({
        years: years.length,
        grades: grades.length,
        classes: classes.length,
        subjects: subjects.length,
      });
    } catch {
      setError("Unable to load academic records.");
    } finally {
      setLoading(false);
    }
  };

  const loadCurrentModule = async (
    query = search
  ) => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get(
        currentConfiguration.endpoint,
        {
          params: query
            ? {
                search: query,
              }
            : {},
        }
      );

      const rows = extractRows(response);

      setRecords((current) => ({
        ...current,
        [activeTab]: rows,
      }));

      if (!query) {
        setCounts((current) => ({
          ...current,
          [activeTab]: rows.length,
        }));
      }
    } catch {
      setError(
        `Unable to load ${currentConfiguration.title.toLowerCase()}.`
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const changeTab = (_, newValue) => {
    setActiveTab(newValue);
    setSearch("");
    setError("");
    setSuccess("");
  };

  const openCreateDialog = () => {
    setSelectedRecord(null);
    setForm({ ...emptyForms[activeTab] });
    setDialogOpen(true);
    setError("");
  };

  const openEditDialog = (record) => {
    setSelectedRecord(record);

    if (activeTab === "years") {
      setForm({
        name: record.name || "",
        start_date: record.start_date || "",
        end_date: record.end_date || "",
        active: Boolean(record.active),
      });
    }

    if (activeTab === "grades") {
      setForm({
        name: record.name || "",
        order: record.order || 1,
      });
    }

    if (activeTab === "classes") {
      setForm({
        grade: record.grade || "",
        name: record.name || "",
        capacity: record.capacity || 40,
      });
    }

    if (activeTab === "subjects") {
      setForm({
        code: record.code || "",
        name: record.name || "",
        description: record.description || "",
      });
    }

    setDialogOpen(true);
    setError("");
  };

  const closeDialog = () => {
    if (!saving) {
      setDialogOpen(false);
      setSelectedRecord(null);
      setForm({ ...emptyForms[activeTab] });
    }
  };

  const updateField = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const validateForm = () => {
    if (activeTab === "years") {
      if (
        !form.name.trim() ||
        !form.start_date ||
        !form.end_date
      ) {
        return "Name, start date and end date are required.";
      }
    }

    if (activeTab === "grades") {
      if (!form.name.trim()) {
        return "Grade level name is required.";
      }
    }

    if (activeTab === "classes") {
      if (!form.grade || !form.name.trim()) {
        return "Grade level and class name are required.";
      }
    }

    if (activeTab === "subjects") {
      if (!form.code.trim() || !form.name.trim()) {
        return "Subject code and name are required.";
      }
    }

    return "";
  };

  const saveRecord = async () => {
    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      if (selectedRecord) {
        await api.patch(
          `${currentConfiguration.endpoint}${selectedRecord.id}/`,
          form
        );

        setSuccess(
          `${currentConfiguration.title.slice(
            0,
            -1
          )} updated successfully.`
        );
      } else {
        await api.post(
          currentConfiguration.endpoint,
          form
        );

        setSuccess(
          `${currentConfiguration.title.slice(
            0,
            -1
          )} created successfully.`
        );
      }

      setDialogOpen(false);
      setSelectedRecord(null);
      setForm({ ...emptyForms[activeTab] });

      await loadAllData();
    } catch (requestError) {
      const responseData =
        requestError.response?.data;

      if (responseData) {
        const message = Object.entries(responseData)
          .map(([field, value]) => {
            const text = Array.isArray(value)
              ? value.join(" ")
              : String(value);

            return `${field}: ${text}`;
          })
          .join(" ");

        setError(message);
      } else {
        setError("Unable to save the academic record.");
      }
    } finally {
      setSaving(false);
    }
  };

  const deleteRecord = async (record) => {
    const label =
      record.name ||
      record.code ||
      `record ${record.id}`;

    const confirmed = window.confirm(
      `Delete ${label}? This action cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

    setError("");
    setSuccess("");

    try {
      await api.delete(
        `${currentConfiguration.endpoint}${record.id}/`
      );

      setSuccess("Record deleted successfully.");
      await loadAllData();
    } catch (requestError) {
      if (requestError.response?.status === 400) {
        setError(
          "This record cannot be deleted because it is being used elsewhere."
        );
      } else {
        setError("Unable to delete this record.");
      }
    }
  };

  const submitSearch = (event) => {
    event.preventDefault();
    loadCurrentModule(search);
  };

  const renderDialogFields = () => {
    if (activeTab === "years") {
      return (
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              required
              label="Academic Year Name"
              placeholder="Example: 2026/2027"
              value={form.name}
              onChange={(event) =>
                updateField("name", event.target.value)
              }
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              required
              type="date"
              label="Start Date"
              InputLabelProps={{ shrink: true }}
              value={form.start_date}
              onChange={(event) =>
                updateField(
                  "start_date",
                  event.target.value
                )
              }
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              required
              type="date"
              label="End Date"
              InputLabelProps={{ shrink: true }}
              value={form.end_date}
              onChange={(event) =>
                updateField(
                  "end_date",
                  event.target.value
                )
              }
            />
          </Grid>

          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>

              <Select
                label="Status"
                value={form.active ? "active" : "inactive"}
                onChange={(event) =>
                  updateField(
                    "active",
                    event.target.value === "active"
                  )
                }
              >
                <MenuItem value="active">
                  Active
                </MenuItem>
                <MenuItem value="inactive">
                  Inactive
                </MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      );
    }

    if (activeTab === "grades") {
      return (
        <Grid container spacing={2}>
          <Grid item xs={12} sm={8}>
            <TextField
              fullWidth
              required
              label="Grade Level"
              placeholder="Example: Grade 10"
              value={form.name}
              onChange={(event) =>
                updateField("name", event.target.value)
              }
            />
          </Grid>

          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              required
              type="number"
              label="Display Order"
              inputProps={{ min: 1 }}
              value={form.order}
              onChange={(event) =>
                updateField(
                  "order",
                  Number(event.target.value)
                )
              }
            />
          </Grid>
        </Grid>
      );
    }

    if (activeTab === "classes") {
      return (
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <FormControl fullWidth required>
              <InputLabel>Grade Level</InputLabel>

              <Select
                label="Grade Level"
                value={form.grade}
                onChange={(event) =>
                  updateField(
                    "grade",
                    event.target.value
                  )
                }
              >
                {records.grades.map((grade) => (
                  <MenuItem
                    key={grade.id}
                    value={grade.id}
                  >
                    {grade.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              required
              label="Section Name"
              placeholder="Example: A, B or Blue"
              value={form.name}
              onChange={(event) =>
                updateField("name", event.target.value)
              }
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              required
              type="number"
              label="Class Capacity"
              inputProps={{ min: 1 }}
              value={form.capacity}
              onChange={(event) =>
                updateField(
                  "capacity",
                  Number(event.target.value)
                )
              }
            />
          </Grid>
        </Grid>
      );
    }

    return (
      <Grid container spacing={2}>
        <Grid item xs={12} sm={4}>
          <TextField
            fullWidth
            required
            label="Subject Code"
            placeholder="Example: MATH101"
            value={form.code}
            onChange={(event) =>
              updateField(
                "code",
                event.target.value.toUpperCase()
              )
            }
          />
        </Grid>

        <Grid item xs={12} sm={8}>
          <TextField
            fullWidth
            required
            label="Subject Name"
            placeholder="Example: Mathematics"
            value={form.name}
            onChange={(event) =>
              updateField("name", event.target.value)
            }
          />
        </Grid>

        <Grid item xs={12}>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Description"
            value={form.description}
            onChange={(event) =>
              updateField(
                "description",
                event.target.value
              )
            }
          />
        </Grid>
      </Grid>
    );
  };

  const renderTableHeaders = () => {
    if (activeTab === "years") {
      return (
        <>
          <TableCell>Name</TableCell>
          <TableCell>Start Date</TableCell>
          <TableCell>End Date</TableCell>
          <TableCell>Status</TableCell>
        </>
      );
    }

    if (activeTab === "grades") {
      return (
        <>
          <TableCell>Grade Level</TableCell>
          <TableCell>Display Order</TableCell>
          <TableCell>Classes</TableCell>
        </>
      );
    }

    if (activeTab === "classes") {
      return (
        <>
          <TableCell>Grade Level</TableCell>
          <TableCell>Section</TableCell>
          <TableCell>Capacity</TableCell>
          <TableCell>Students</TableCell>
          <TableCell>Class Teacher</TableCell>
        </>
      );
    }

    return (
      <>
        <TableCell>Code</TableCell>
        <TableCell>Subject</TableCell>
        <TableCell>Description</TableCell>
      </>
    );
  };

  const renderTableCells = (record) => {
    if (activeTab === "years") {
      return (
        <>
          <TableCell>
            <Typography fontWeight={700}>
              {record.name}
            </Typography>
          </TableCell>
          <TableCell>{record.start_date}</TableCell>
          <TableCell>{record.end_date}</TableCell>
          <TableCell>
            <Chip
              size="small"
              label={record.active ? "Active" : "Inactive"}
              color={
                record.active ? "success" : "default"
              }
            />
          </TableCell>
        </>
      );
    }

    if (activeTab === "grades") {
      return (
        <>
          <TableCell>
            <Typography fontWeight={700}>
              {record.name}
            </Typography>
          </TableCell>
          <TableCell>{record.order}</TableCell>
          <TableCell>
            {record.class_count ?? 0}
          </TableCell>
        </>
      );
    }

    if (activeTab === "classes") {
      return (
        <>
          <TableCell>{record.grade_name}</TableCell>
          <TableCell>
            <Typography fontWeight={700}>
              {record.name}
            </Typography>
          </TableCell>
          <TableCell>{record.capacity}</TableCell>
          <TableCell>
            {record.student_count ?? 0}
          </TableCell>
          <TableCell>
            {record.teacher_name || "Not assigned"}
          </TableCell>
        </>
      );
    }

    return (
      <>
        <TableCell>
          <Chip
            size="small"
            label={record.code}
            color="primary"
            variant="outlined"
          />
        </TableCell>
        <TableCell>
          <Typography fontWeight={700}>
            {record.name}
          </Typography>
        </TableCell>
        <TableCell>
          {record.description || "No description"}
        </TableCell>
      </>
    );
  };

  return (
    <Box>
      <Stack
        direction={{
          xs: "column",
          sm: "row",
        }}
        alignItems={{
          xs: "stretch",
          sm: "center",
        }}
        justifyContent="space-between"
        spacing={2}
        mb={3}
      >
        <Box>
          <Typography
            variant="h4"
            sx={{
              color: "#0B2A78",
              fontWeight: 800,
            }}
          >
            Academics Management
          </Typography>

          <Typography color="text.secondary">
            Manage academic years, grades, classes and
            subjects.
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={openCreateDialog}
          sx={{
            bgcolor: "#C8102E",
            "&:hover": {
              bgcolor: "#9D0C24",
            },
          }}
        >
          Add New
        </Button>
      </Stack>

      {error && (
        <Alert
          severity="error"
          onClose={() => setError("")}
          sx={{ mb: 2 }}
        >
          {error}
        </Alert>
      )}

      {success && (
        <Alert
          severity="success"
          onClose={() => setSuccess("")}
          sx={{ mb: 2 }}
        >
          {success}
        </Alert>
      )}

      <Grid container spacing={2} mb={3}>
        {dashboardCards.map((card) => (
          <Grid
            item
            xs={12}
            sm={6}
            lg={3}
            key={card.label}
          >
            <Paper
              sx={{
                p: 2.5,
                borderRadius: 3,
                border: "1px solid #E5E7EB",
              }}
            >
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
              >
                <Box>
                  <Typography color="text.secondary">
                    {card.label}
                  </Typography>

                  <Typography
                    variant="h4"
                    fontWeight={800}
                    color="#0B2A78"
                  >
                    {card.value}
                  </Typography>
                </Box>

                <Box
                  sx={{
                    bgcolor: "#0B2A78",
                    color: "white",
                    borderRadius: 2,
                    width: 48,
                    height: 48,
                    display: "grid",
                    placeItems: "center",
                  }}
                >
                  {card.icon}
                </Box>
              </Stack>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Paper
        sx={{
          borderRadius: 3,
          border: "1px solid #E5E7EB",
          overflow: "hidden",
        }}
      >
        <Tabs
          value={activeTab}
          onChange={changeTab}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            borderBottom: "1px solid #E5E7EB",
            px: 2,
          }}
        >
          <Tab
            value="years"
            label="Academic Years"
            icon={<CalendarMonth />}
            iconPosition="start"
          />
          <Tab
            value="grades"
            label="Grade Levels"
            icon={<School />}
            iconPosition="start"
          />
          <Tab
            value="classes"
            label="Classes"
            icon={<Class />}
            iconPosition="start"
          />
          <Tab
            value="subjects"
            label="Subjects"
            icon={<MenuBook />}
            iconPosition="start"
          />
        </Tabs>

        <Box sx={{ p: 2 }}>
          <Stack
            direction={{
              xs: "column",
              sm: "row",
            }}
            justifyContent="space-between"
            alignItems={{
              xs: "stretch",
              sm: "center",
            }}
            spacing={2}
            mb={2}
          >
            <Typography variant="h6" fontWeight={800}>
              {currentConfiguration.title}
            </Typography>

            <Box
              component="form"
              onSubmit={submitSearch}
              sx={{
                display: "flex",
                gap: 1,
              }}
            >
              <TextField
                size="small"
                label="Search"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
              />

              <Button
                type="submit"
                variant="outlined"
                startIcon={<Search />}
              >
                Search
              </Button>

              <Tooltip title="Reload">
                <IconButton
                  onClick={() => {
                    setSearch("");
                    loadAllData();
                  }}
                >
                  <Refresh />
                </IconButton>
              </Tooltip>
            </Box>
          </Stack>

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
                  {renderTableHeaders()}

                  <TableCell align="right">
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      align="center"
                    >
                      <Box sx={{ py: 5 }}>
                        <CircularProgress />
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : currentRows.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      align="center"
                    >
                      <Typography
                        color="text.secondary"
                        sx={{ py: 5 }}
                      >
                        No records found.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  currentRows.map((record) => (
                    <TableRow key={record.id} hover>
                      {renderTableCells(record)}

                      <TableCell align="right">
                        <Tooltip title="Edit">
                          <IconButton
                            color="primary"
                            onClick={() =>
                              openEditDialog(record)
                            }
                          >
                            <Edit />
                          </IconButton>
                        </Tooltip>

                        <Tooltip title="Delete">
                          <IconButton
                            color="error"
                            onClick={() =>
                              deleteRecord(record)
                            }
                          >
                            <Delete />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </Paper>

      <Dialog
        open={dialogOpen}
        onClose={closeDialog}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle
          sx={{
            bgcolor: "#0B2A78",
            color: "white",
            fontWeight: 800,
          }}
        >
          {selectedRecord ? "Edit" : "Add"}{" "}
          {currentConfiguration.title}
        </DialogTitle>

        <DialogContent dividers sx={{ pt: 3 }}>
          {renderDialogFields()}
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button
            onClick={closeDialog}
            disabled={saving}
          >
            Cancel
          </Button>

          <Button
            variant="contained"
            onClick={saveRecord}
            disabled={saving}
          >
            {saving ? (
              <CircularProgress
                size={22}
                color="inherit"
              />
            ) : selectedRecord ? (
              "Save Changes"
            ) : (
              "Create Record"
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

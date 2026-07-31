import { useEffect, useState } from "react";
import {
  Alert,
  Avatar,
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
  Delete,
  Edit,
  Refresh,
  Search,
} from "@mui/icons-material";

import api from "../api/client";

const emptyStudent = {
  first_name: "",
  middle_name: "",
  last_name: "",
  gender: "M",
  date_of_birth: "",
  phone: "",
  email: "",
  address: "",
  admission_date: "",
  previous_school: "",
  guardian_name: "",
  guardian_relationship: "",
  guardian_phone: "",
  guardian_email: "",
  guardian_address: "",
  photo: null,
};

export default function Students() {
  const [students, setStudents] = useState([]);
  const [form, setForm] = useState(emptyStudent);
  const [selectedStudent, setSelectedStudent] =
    useState(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadStudents = async (query = "") => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get(
        "/students/records/",
        {
          params: query
            ? {
                search: query,
              }
            : {},
        }
      );

      setStudents(
        response.data.results || response.data
      );
    } catch {
      setError("Unable to load student records.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, []);

  const openCreateDialog = () => {
    setSelectedStudent(null);
    setForm(emptyStudent);
    setDialogOpen(true);
    setError("");
  };

  const openEditDialog = (student) => {
    setSelectedStudent(student);

    setForm({
      first_name: student.first_name || "",
      middle_name: student.middle_name || "",
      last_name: student.last_name || "",
      gender: student.gender || "M",
      date_of_birth: student.date_of_birth || "",
      phone: student.phone || "",
      email: student.email || "",
      address: student.address || "",
      admission_date: student.admission_date || "",
      previous_school:
        student.previous_school || "",
      guardian_name:
        student.guardian_detail?.name || "",
      guardian_relationship:
        student.guardian_detail?.relationship || "",
      guardian_phone:
        student.guardian_detail?.phone || "",
      guardian_email:
        student.guardian_detail?.email || "",
      guardian_address:
        student.guardian_detail?.address || "",
      photo: null,
    });

    setDialogOpen(true);
    setError("");
  };

  const closeDialog = () => {
    if (!saving) {
      setDialogOpen(false);
      setSelectedStudent(null);
      setForm(emptyStudent);
    }
  };

  const updateField = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const validateForm = () => {
    if (
      !form.first_name.trim() ||
      !form.last_name.trim()
    ) {
      return "Student first name and last name are required.";
    }

    if (!form.date_of_birth) {
      return "Date of birth is required.";
    }

    if (!form.admission_date) {
      return "Admission date is required.";
    }

    if (!form.address.trim()) {
      return "Student address is required.";
    }

    return "";
  };

  const saveStudent = async () => {
    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      let guardianId =
        selectedStudent?.guardian || null;

      const guardianPayload = {
        name: form.guardian_name,
        relationship: form.guardian_relationship,
        phone: form.guardian_phone,
        email: form.guardian_email,
        address: form.guardian_address,
      };

      if (
        form.guardian_name.trim() &&
        form.guardian_phone.trim()
      ) {
        if (guardianId) {
          await api.patch(
            `/students/guardians/${guardianId}/`,
            guardianPayload
          );
        } else {
          const guardianResponse = await api.post(
            "/students/guardians/",
            guardianPayload
          );

          guardianId = guardianResponse.data.id;
        }
      }

      const studentData = new FormData();

      studentData.append(
        "first_name",
        form.first_name.trim()
      );

      studentData.append(
        "middle_name",
        form.middle_name.trim()
      );

      studentData.append(
        "last_name",
        form.last_name.trim()
      );

      studentData.append("gender", form.gender);
      studentData.append(
        "date_of_birth",
        form.date_of_birth
      );

      studentData.append("phone", form.phone);
      studentData.append("email", form.email);
      studentData.append("address", form.address);

      studentData.append(
        "admission_date",
        form.admission_date
      );

      studentData.append(
        "previous_school",
        form.previous_school
      );

      studentData.append("is_active", "true");

      if (guardianId) {
        studentData.append("guardian", guardianId);
      }

      if (form.photo) {
        studentData.append("photo", form.photo);
      }

      if (selectedStudent) {
        await api.patch(
          `/students/records/${selectedStudent.id}/`,
          studentData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );

        setSuccess("Student updated successfully.");
      } else {
        await api.post(
          "/students/records/",
          studentData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );

        setSuccess("Student registered successfully.");
      }

      closeDialog();
      await loadStudents(search);
    } catch (requestError) {
      const responseData =
        requestError.response?.data;

      if (responseData) {
        const message = Object.entries(responseData)
          .map(([field, messages]) => {
            const text = Array.isArray(messages)
              ? messages.join(" ")
              : String(messages);

            return `${field}: ${text}`;
          })
          .join(" ");

        setError(message);
      } else {
        setError("Unable to save student record.");
      }
    } finally {
      setSaving(false);
    }
  };

  const deleteStudent = async (student) => {
    const confirmed = window.confirm(
      `Delete ${student.full_name}? This action cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

    setError("");
    setSuccess("");

    try {
      await api.delete(
        `/students/records/${student.id}/`
      );

      setSuccess("Student deleted successfully.");
      await loadStudents(search);
    } catch {
      setError("Unable to delete student.");
    }
  };

  const handleSearch = (event) => {
    event.preventDefault();
    loadStudents(search);
  };

  return (
    <Box>
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
        mb={3}
      >
        <Box>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 800,
              color: "#0B2A78",
            }}
          >
            Student Management
          </Typography>

          <Typography color="text.secondary">
            Register, search, edit, and manage student
            records.
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
          Register Student
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

      <Paper
        sx={{
          p: 2,
          mb: 3,
          borderRadius: 3,
          border: "1px solid #E5E7EB",
        }}
      >
        <Box
          component="form"
          onSubmit={handleSearch}
          sx={{
            display: "flex",
            gap: 1.5,
          }}
        >
          <TextField
            fullWidth
            size="small"
            label="Search by name, admission number or phone"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
          />

          <Button
            type="submit"
            variant="contained"
            startIcon={<Search />}
          >
            Search
          </Button>

          <Tooltip title="Reload students">
            <IconButton
              onClick={() => {
                setSearch("");
                loadStudents();
              }}
            >
              <Refresh />
            </IconButton>
          </Tooltip>
        </Box>
      </Paper>

      <TableContainer
        component={Paper}
        sx={{
          borderRadius: 3,
          border: "1px solid #E5E7EB",
        }}
      >
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: "#0B2A78" }}>
              <TableCell sx={{ color: "white" }}>
                Student
              </TableCell>

              <TableCell sx={{ color: "white" }}>
                Admission Number
              </TableCell>

              <TableCell sx={{ color: "white" }}>
                Gender
              </TableCell>

              <TableCell sx={{ color: "white" }}>
                Guardian
              </TableCell>

              <TableCell sx={{ color: "white" }}>
                Admission Date
              </TableCell>

              <TableCell sx={{ color: "white" }}>
                Status
              </TableCell>

              <TableCell
                align="right"
                sx={{ color: "white" }}
              >
                Actions
              </TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <Box sx={{ py: 5 }}>
                    <CircularProgress />
                  </Box>
                </TableCell>
              </TableRow>
            ) : students.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <Typography
                    color="text.secondary"
                    sx={{ py: 5 }}
                  >
                    No student records found.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              students.map((student) => (
                <TableRow
                  key={student.id}
                  hover
                >
                  <TableCell>
                    <Stack
                      direction="row"
                      spacing={1.5}
                      alignItems="center"
                    >
                      <Avatar
                        src={student.photo || undefined}
                      >
                        {student.first_name?.[0]}
                      </Avatar>

                      <Box>
                        <Typography fontWeight={700}>
                          {student.full_name}
                        </Typography>

                        <Typography
                          variant="caption"
                          color="text.secondary"
                        >
                          {student.phone ||
                            "No phone number"}
                        </Typography>
                      </Box>
                    </Stack>
                  </TableCell>

                  <TableCell>
                    {student.admission_number}
                  </TableCell>

                  <TableCell>
                    {student.gender_display ||
                      student.gender}
                  </TableCell>

                  <TableCell>
                    {student.guardian_detail?.name ||
                      "Not provided"}
                  </TableCell>

                  <TableCell>
                    {student.admission_date}
                  </TableCell>

                  <TableCell>
                    <Chip
                      size="small"
                      label={
                        student.is_active
                          ? "Active"
                          : "Inactive"
                      }
                      color={
                        student.is_active
                          ? "success"
                          : "default"
                      }
                    />
                  </TableCell>

                  <TableCell align="right">
                    <Tooltip title="Edit student">
                      <IconButton
                        color="primary"
                        onClick={() =>
                          openEditDialog(student)
                        }
                      >
                        <Edit />
                      </IconButton>
                    </Tooltip>

                    <Tooltip title="Delete student">
                      <IconButton
                        color="error"
                        onClick={() =>
                          deleteStudent(student)
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

      <Dialog
        open={dialogOpen}
        onClose={closeDialog}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle
          sx={{
            bgcolor: "#0B2A78",
            color: "white",
            fontWeight: 800,
          }}
        >
          {selectedStudent
            ? "Edit Student"
            : "Register Student"}
        </DialogTitle>

        <DialogContent dividers>
          <Typography
            variant="h6"
            sx={{
              color: "#0B2A78",
              fontWeight: 800,
              mb: 2,
            }}
          >
            Student Information
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                required
                label="First Name"
                value={form.first_name}
                onChange={(event) =>
                  updateField(
                    "first_name",
                    event.target.value
                  )
                }
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Middle Name"
                value={form.middle_name}
                onChange={(event) =>
                  updateField(
                    "middle_name",
                    event.target.value
                  )
                }
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                required
                label="Last Name"
                value={form.last_name}
                onChange={(event) =>
                  updateField(
                    "last_name",
                    event.target.value
                  )
                }
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <FormControl fullWidth>
                <InputLabel>Gender</InputLabel>

                <Select
                  label="Gender"
                  value={form.gender}
                  onChange={(event) =>
                    updateField(
                      "gender",
                      event.target.value
                    )
                  }
                >
                  <MenuItem value="M">Male</MenuItem>
                  <MenuItem value="F">Female</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                required
                type="date"
                label="Date of Birth"
                InputLabelProps={{ shrink: true }}
                value={form.date_of_birth}
                onChange={(event) =>
                  updateField(
                    "date_of_birth",
                    event.target.value
                  )
                }
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                required
                type="date"
                label="Admission Date"
                InputLabelProps={{ shrink: true }}
                value={form.admission_date}
                onChange={(event) =>
                  updateField(
                    "admission_date",
                    event.target.value
                  )
                }
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Phone Number"
                value={form.phone}
                onChange={(event) =>
                  updateField(
                    "phone",
                    event.target.value
                  )
                }
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="email"
                label="Email Address"
                value={form.email}
                onChange={(event) =>
                  updateField(
                    "email",
                    event.target.value
                  )
                }
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                required
                multiline
                rows={2}
                label="Home Address"
                value={form.address}
                onChange={(event) =>
                  updateField(
                    "address",
                    event.target.value
                  )
                }
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Previous School"
                value={form.previous_school}
                onChange={(event) =>
                  updateField(
                    "previous_school",
                    event.target.value
                  )
                }
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Button
                fullWidth
                variant="outlined"
                component="label"
                sx={{ height: 56 }}
              >
                {form.photo
                  ? form.photo.name
                  : "Upload Student Photo"}

                <input
                  hidden
                  type="file"
                  accept="image/*"
                  onChange={(event) =>
                    updateField(
                      "photo",
                      event.target.files?.[0] || null
                    )
                  }
                />
              </Button>
            </Grid>
          </Grid>

          <Typography
            variant="h6"
            sx={{
              color: "#0B2A78",
              fontWeight: 800,
              mt: 4,
              mb: 2,
            }}
          >
            Parent or Guardian Information
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Guardian Name"
                value={form.guardian_name}
                onChange={(event) =>
                  updateField(
                    "guardian_name",
                    event.target.value
                  )
                }
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Relationship"
                placeholder="Father, Mother, Uncle..."
                value={form.guardian_relationship}
                onChange={(event) =>
                  updateField(
                    "guardian_relationship",
                    event.target.value
                  )
                }
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Guardian Phone"
                value={form.guardian_phone}
                onChange={(event) =>
                  updateField(
                    "guardian_phone",
                    event.target.value
                  )
                }
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="email"
                label="Guardian Email"
                value={form.guardian_email}
                onChange={(event) =>
                  updateField(
                    "guardian_email",
                    event.target.value
                  )
                }
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Guardian Address"
                value={form.guardian_address}
                onChange={(event) =>
                  updateField(
                    "guardian_address",
                    event.target.value
                  )
                }
              />
            </Grid>
          </Grid>
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
            onClick={saveStudent}
            disabled={saving}
          >
            {saving ? (
              <CircularProgress
                size={22}
                color="inherit"
              />
            ) : selectedStudent ? (
              "Update Student"
            ) : (
              "Register Student"
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

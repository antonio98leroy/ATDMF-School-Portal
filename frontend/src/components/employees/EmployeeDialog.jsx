import { useEffect, useState } from "react";

import {
  Alert,
  Avatar,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  FormHelperText,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import CloseIcon from "@mui/icons-material/Close";
import PersonIcon from "@mui/icons-material/Person";
import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";
import SaveIcon from "@mui/icons-material/Save";

const initialForm = {
  photo: null,
  first_name: "",
  middle_name: "",
  last_name: "",
  gender: "",
  date_of_birth: "",
  phone: "",
  alternative_phone: "",
  email: "",
  address: "",
  emergency_contact_name: "",
  emergency_contact_phone: "",
  department: "",
  position: "",
  qualification: "",
  specialization: "",
  employment_type: "",
  hire_date: "",
  status: "active",
  is_teacher: false,
  notes: "",
};

const employmentTypes = [
  { value: "full_time", label: "Full Time" },
  { value: "part_time", label: "Part Time" },
  { value: "contract", label: "Contract" },
  { value: "temporary", label: "Temporary" },
  { value: "volunteer", label: "Volunteer" },
];

const statusOptions = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "suspended", label: "Suspended" },
  { value: "on_leave", label: "On Leave" },
  { value: "terminated", label: "Terminated" },
  { value: "retired", label: "Retired" },
];

export default function EmployeeDialog({
  open,
  employee = null,
  departments = [],
  positions = [],
  loading = false,
  onClose,
  onSubmit,
}) {
  const [form, setForm] = useState(initialForm);
  const [preview, setPreview] = useState("");
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");

  const isEditMode = Boolean(employee);

  useEffect(() => {
    if (!open) return;

    if (employee) {
      setForm({
        ...initialForm,
        ...employee,
        photo: null,
        department: employee.department
          ? String(employee.department)
          : "",
        position: employee.position
          ? String(employee.position)
          : "",
        date_of_birth:
          employee.date_of_birth || "",
        hire_date: employee.hire_date || "",
        is_teacher: Boolean(employee.is_teacher),
      });

      setPreview(
        employee.photo_url ||
          employee.photo ||
          ""
      );
    } else {
      setForm(initialForm);
      setPreview("");
    }

    setErrors({});
    setSubmitError("");
  }, [employee, open]);

  useEffect(() => {
    return () => {
      if (preview?.startsWith("blob:")) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  const handleChange = (field, value) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));

    if (errors[field]) {
      setErrors((previous) => ({
        ...previous,
        [field]: "",
      }));
    }

    if (submitError) {
      setSubmitError("");
    }
  };

  const handlePhoto = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    const validTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!validTypes.includes(file.type)) {
      setErrors((previous) => ({
        ...previous,
        photo:
          "Please select a JPG, PNG, or WebP image.",
      }));
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrors((previous) => ({
        ...previous,
        photo:
          "The employee photo must not exceed 5 MB.",
      }));
      return;
    }

    if (preview?.startsWith("blob:")) {
      URL.revokeObjectURL(preview);
    }

    handleChange("photo", file);
    setPreview(URL.createObjectURL(file));
  };

  const validate = () => {
    const newErrors = {};

    if (!form.first_name.trim()) {
      newErrors.first_name =
        "First name is required.";
    }

    if (!form.last_name.trim()) {
      newErrors.last_name =
        "Last name is required.";
    }

    if (!form.gender) {
      newErrors.gender = "Gender is required.";
    }

    if (!form.phone.trim()) {
      newErrors.phone =
        "Primary phone number is required.";
    } else if (form.phone.trim().length < 7) {
      newErrors.phone =
        "Enter a valid phone number.";
    }

    if (
      form.email &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        form.email
      )
    ) {
      newErrors.email =
        "Enter a valid email address.";
    }

    if (!form.department) {
      newErrors.department =
        "Department is required.";
    }

    if (!form.position) {
      newErrors.position =
        "Position is required.";
    }

    if (!form.employment_type) {
      newErrors.employment_type =
        "Employment type is required.";
    }

    if (!form.hire_date) {
      newErrors.hire_date =
        "Hire date is required.";
    }

    if (!form.status) {
      newErrors.status =
        "Employee status is required.";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const buildFormData = () => {
    const formData = new FormData();

    Object.entries(form).forEach(
      ([key, value]) => {
        if (
          key === "photo" &&
          !(value instanceof File)
        ) {
          return;
        }

        if (typeof value === "boolean") {
          formData.append(
            key,
            value ? "true" : "false"
          );
          return;
        }

        if (
          value !== null &&
          value !== undefined
        ) {
          formData.append(key, value);
        }
      }
    );

    return formData;
  };

  const applyBackendErrors = (errorData) => {
    if (!errorData || typeof errorData !== "object") {
      setSubmitError(
        "Unable to save the employee. Please try again."
      );
      return;
    }

    const fieldErrors = {};
    let generalError = "";

    Object.entries(errorData).forEach(
      ([field, messages]) => {
        const message = Array.isArray(messages)
          ? messages.join(" ")
          : String(messages);

        if (
          field === "detail" ||
          field === "non_field_errors"
        ) {
          generalError = message;
        } else {
          fieldErrors[field] = message;
        }
      }
    );

    setErrors((previous) => ({
      ...previous,
      ...fieldErrors,
    }));

    setSubmitError(
      generalError ||
        "Please correct the highlighted fields."
    );
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setSubmitError("");

    try {
      const formData = buildFormData();

      await onSubmit?.(formData, employee);
    } catch (error) {
      const responseData =
        error?.response?.data ||
        error?.data ||
        null;

      applyBackendErrors(responseData);
    }
  };

  const handleDialogClose = () => {
    if (!loading) {
      onClose?.();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleDialogClose}
      fullWidth
      maxWidth="md"
      scroll="paper"
    >
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          color: "#0B2A78",
        }}
      >
        <Box>
          <Typography
            variant="h5"
            component="h2"
            fontWeight={800}
          >
            {isEditMode
              ? "Edit Employee"
              : "Add Employee"}
          </Typography>

          <Typography
            variant="body2"
            color="text.secondary"
          >
            {isEditMode
              ? "Update the employee record."
              : "Create a new employee record."}
          </Typography>
        </Box>

        <IconButton
          onClick={handleDialogClose}
          disabled={loading}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <Divider />

      <DialogContent>
        <Stack spacing={4} sx={{ mt: 1 }}>
          {submitError && (
            <Alert severity="error">
              {submitError}
            </Alert>
          )}

          <Box sx={{ textAlign: "center" }}>
            <Avatar
              src={preview}
              sx={{
                width: 120,
                height: 120,
                mx: "auto",
                mb: 2,
                bgcolor: "#E8ECF7",
                color: "#0B2A78",
              }}
            >
              <PersonIcon sx={{ fontSize: 60 }} />
            </Avatar>

            <Button
              component="label"
              variant="outlined"
              startIcon={<PhotoCameraIcon />}
              disabled={loading}
              sx={{
                borderColor: "#0B2A78",
                color: "#0B2A78",
                textTransform: "none",
                fontWeight: 700,
              }}
            >
              {preview
                ? "Change Photo"
                : "Upload Photo"}

              <input
                hidden
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handlePhoto}
              />
            </Button>

            <Typography
              variant="caption"
              display="block"
              color="text.secondary"
              sx={{ mt: 1 }}
            >
              JPG, PNG or WebP. Maximum size:
              5 MB.
            </Typography>

            {errors.photo && (
              <Typography
                variant="caption"
                color="error"
                display="block"
                sx={{ mt: 1 }}
              >
                {errors.photo}
              </Typography>
            )}
          </Box>

          <Divider />

          <SectionTitle title="Personal Information" />

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                required
                label="First Name"
                value={form.first_name}
                disabled={loading}
                error={Boolean(errors.first_name)}
                helperText={errors.first_name}
                onChange={(event) =>
                  handleChange(
                    "first_name",
                    event.target.value
                  )
                }
              />
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                label="Middle Name"
                value={form.middle_name}
                disabled={loading}
                onChange={(event) =>
                  handleChange(
                    "middle_name",
                    event.target.value
                  )
                }
              />
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                required
                label="Last Name"
                value={form.last_name}
                disabled={loading}
                error={Boolean(errors.last_name)}
                helperText={errors.last_name}
                onChange={(event) =>
                  handleChange(
                    "last_name",
                    event.target.value
                  )
                }
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl
                fullWidth
                required
                error={Boolean(errors.gender)}
              >
                <InputLabel>Gender</InputLabel>

                <Select
                  value={form.gender}
                  label="Gender"
                  disabled={loading}
                  onChange={(event) =>
                    handleChange(
                      "gender",
                      event.target.value
                    )
                  }
                >
                  <MenuItem value="male">
                    Male
                  </MenuItem>
                  <MenuItem value="female">
                    Female
                  </MenuItem>
                  <MenuItem value="other">
                    Other
                  </MenuItem>
                </Select>

                {errors.gender && (
                  <FormHelperText>
                    {errors.gender}
                  </FormHelperText>
                )}
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                type="date"
                label="Date of Birth"
                value={form.date_of_birth}
                disabled={loading}
                slotProps={{
                  inputLabel: { shrink: true },
                }}
                onChange={(event) =>
                  handleChange(
                    "date_of_birth",
                    event.target.value
                  )
                }
              />
            </Grid>
          </Grid>

          <Divider />

          <SectionTitle title="Contact Information" />

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                required
                label="Primary Phone"
                value={form.phone}
                disabled={loading}
                error={Boolean(errors.phone)}
                helperText={errors.phone}
                onChange={(event) =>
                  handleChange(
                    "phone",
                    event.target.value
                  )
                }
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Alternative Phone"
                value={form.alternative_phone}
                disabled={loading}
                onChange={(event) =>
                  handleChange(
                    "alternative_phone",
                    event.target.value
                  )
                }
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                type="email"
                label="Email Address"
                value={form.email}
                disabled={loading}
                error={Boolean(errors.email)}
                helperText={errors.email}
                onChange={(event) =>
                  handleChange(
                    "email",
                    event.target.value
                  )
                }
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Emergency Contact Name"
                value={
                  form.emergency_contact_name
                }
                disabled={loading}
                onChange={(event) =>
                  handleChange(
                    "emergency_contact_name",
                    event.target.value
                  )
                }
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Emergency Contact Phone"
                value={
                  form.emergency_contact_phone
                }
                disabled={loading}
                onChange={(event) =>
                  handleChange(
                    "emergency_contact_phone",
                    event.target.value
                  )
                }
              />
            </Grid>

            <Grid size={12}>
              <TextField
                fullWidth
                multiline
                minRows={2}
                label="Residential Address"
                value={form.address}
                disabled={loading}
                onChange={(event) =>
                  handleChange(
                    "address",
                    event.target.value
                  )
                }
              />
            </Grid>
          </Grid>

          <Divider />

          <SectionTitle title="Employment Information" />

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl
                fullWidth
                required
                error={Boolean(errors.department)}
              >
                <InputLabel>Department</InputLabel>

                <Select
                  value={form.department}
                  label="Department"
                  disabled={loading}
                  onChange={(event) =>
                    handleChange(
                      "department",
                      event.target.value
                    )
                  }
                >
                  {departments
                    .filter(
                      (item) =>
                        item.active !== false
                    )
                    .map((item) => (
                      <MenuItem
                        key={item.id}
                        value={String(item.id)}
                      >
                        {item.name}
                      </MenuItem>
                    ))}
                </Select>

                {errors.department && (
                  <FormHelperText>
                    {errors.department}
                  </FormHelperText>
                )}
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl
                fullWidth
                required
                error={Boolean(errors.position)}
              >
                <InputLabel>Position</InputLabel>

                <Select
                  value={form.position}
                  label="Position"
                  disabled={loading}
                  onChange={(event) =>
                    handleChange(
                      "position",
                      event.target.value
                    )
                  }
                >
                  {positions
                    .filter(
                      (item) =>
                        item.active !== false
                    )
                    .map((item) => (
                      <MenuItem
                        key={item.id}
                        value={String(item.id)}
                      >
                        {item.name}
                      </MenuItem>
                    ))}
                </Select>

                {errors.position && (
                  <FormHelperText>
                    {errors.position}
                  </FormHelperText>
                )}
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Qualification"
                value={form.qualification}
                disabled={loading}
                onChange={(event) =>
                  handleChange(
                    "qualification",
                    event.target.value
                  )
                }
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Specialization"
                value={form.specialization}
                disabled={loading}
                onChange={(event) =>
                  handleChange(
                    "specialization",
                    event.target.value
                  )
                }
              />
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <FormControl
                fullWidth
                required
                error={Boolean(
                  errors.employment_type
                )}
              >
                <InputLabel>
                  Employment Type
                </InputLabel>

                <Select
                  value={form.employment_type}
                  label="Employment Type"
                  disabled={loading}
                  onChange={(event) =>
                    handleChange(
                      "employment_type",
                      event.target.value
                    )
                  }
                >
                  {employmentTypes.map(
                    (option) => (
                      <MenuItem
                        key={option.value}
                        value={option.value}
                      >
                        {option.label}
                      </MenuItem>
                    )
                  )}
                </Select>

                {errors.employment_type && (
                  <FormHelperText>
                    {errors.employment_type}
                  </FormHelperText>
                )}
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                required
                type="date"
                label="Hire Date"
                value={form.hire_date}
                disabled={loading}
                error={Boolean(errors.hire_date)}
                helperText={errors.hire_date}
                slotProps={{
                  inputLabel: { shrink: true },
                }}
                onChange={(event) =>
                  handleChange(
                    "hire_date",
                    event.target.value
                  )
                }
              />
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <FormControl
                fullWidth
                required
                error={Boolean(errors.status)}
              >
                <InputLabel>Status</InputLabel>

                <Select
                  value={form.status}
                  label="Status"
                  disabled={loading}
                  onChange={(event) =>
                    handleChange(
                      "status",
                      event.target.value
                    )
                  }
                >
                  {statusOptions.map(
                    (option) => (
                      <MenuItem
                        key={option.value}
                        value={option.value}
                      >
                        {option.label}
                      </MenuItem>
                    )
                  )}
                </Select>

                {errors.status && (
                  <FormHelperText>
                    {errors.status}
                  </FormHelperText>
                )}
              </FormControl>
            </Grid>

            <Grid size={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={form.is_teacher}
                    disabled={loading}
                    onChange={(event) =>
                      handleChange(
                        "is_teacher",
                        event.target.checked
                      )
                    }
                    sx={{
                      color: "#0B2A78",
                      "&.Mui-checked": {
                        color: "#0B2A78",
                      },
                    }}
                  />
                }
                label="This employee is a teacher"
              />
            </Grid>
          </Grid>

          <Divider />

          <SectionTitle title="Additional Notes" />

          <TextField
            fullWidth
            multiline
            minRows={3}
            label="Notes"
            value={form.notes}
            disabled={loading}
            onChange={(event) =>
              handleChange(
                "notes",
                event.target.value
              )
            }
          />
        </Stack>
      </DialogContent>

      <Divider />

      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button
          onClick={handleDialogClose}
          disabled={loading}
          sx={{ textTransform: "none" }}
        >
          Cancel
        </Button>

        <Button
          variant="contained"
          startIcon={
            loading ? (
              <CircularProgress
                size={18}
                color="inherit"
              />
            ) : (
              <SaveIcon />
            )
          }
          onClick={handleSubmit}
          disabled={loading}
          sx={{
            bgcolor: "#C8102E",
            fontWeight: 700,
            textTransform: "none",
            px: 3,
            "&:hover": {
              bgcolor: "#9D0C24",
            },
          }}
        >
          {loading
            ? "Saving..."
            : isEditMode
            ? "Update Employee"
            : "Save Employee"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function SectionTitle({ title }) {
  return (
    <Typography
      variant="h6"
      fontWeight={800}
      color="#0B2A78"
    >
      {title}
    </Typography>
  );
}
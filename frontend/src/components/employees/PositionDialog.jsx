import { useEffect, useState } from "react";

import {
  Alert,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  FormHelperText,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";

import CloseIcon from "@mui/icons-material/Close";
import SaveIcon from "@mui/icons-material/Save";

const initialForm = {
  department: "",
  name: "",
  code: "",
  description: "",
  active: true,
};

export default function PositionDialog({
  open,
  position = null,
  departments = [],
  loading = false,
  onClose,
  onSubmit,
}) {
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");

  const isEditMode = Boolean(position);

  useEffect(() => {
    if (!open) return;

    if (position) {
      setForm({
        department: position.department
          ? String(position.department)
          : "",
        name: position.name || "",
        code: position.code || "",
        description: position.description || "",
        active:
          position.active !== undefined
            ? Boolean(position.active)
            : true,
      });
    } else {
      setForm(initialForm);
    }

    setErrors({});
    setSubmitError("");
  }, [position, open]);

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

  const validate = () => {
    const newErrors = {};

    if (!form.department) {
      newErrors.department =
        "Department is required.";
    }

    if (!form.name.trim()) {
      newErrors.name =
        "Position name is required.";
    }

    if (!form.code.trim()) {
      newErrors.code =
        "Position code is required.";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    const payload = {
      department: form.department,
      name: form.name.trim(),
      code: form.code.trim().toUpperCase(),
      description: form.description.trim(),
      active: form.active,
    };

    try {
      await onSubmit?.(payload, position);
    } catch (error) {
      const response =
        error?.response?.data;

      if (response) {
        setErrors(response);
      } else {
        setSubmitError(
          "Unable to save position."
        );
      }
    }
  };

  return (
    <Dialog
      open={open}
      fullWidth
      maxWidth="sm"
      onClose={loading ? undefined : onClose}
    >
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          color: "#0B2A78",
        }}
      >
        <div>
          <Typography
            variant="h5"
            fontWeight={800}
          >
            {isEditMode
              ? "Edit Position"
              : "Add Position"}
          </Typography>

          <Typography
            variant="body2"
            color="text.secondary"
          >
            Position Management
          </Typography>
        </div>

        <IconButton
          disabled={loading}
          onClick={onClose}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <Divider />

      <DialogContent>
        <Stack spacing={3} sx={{ mt: 2 }}>

          {submitError && (
            <Alert severity="error">
              {submitError}
            </Alert>
          )}

          <FormControl
            fullWidth
            error={Boolean(errors.department)}
          >
            <InputLabel>
              Department
            </InputLabel>

            <Select
              value={form.department}
              label="Department"
              disabled={loading}
              onChange={(e) =>
                handleChange(
                  "department",
                  e.target.value
                )
              }
            >
              {departments
                .filter(
                  (d) => d.active !== false
                )
                .map((department) => (
                  <MenuItem
                    key={department.id}
                    value={String(
                      department.id
                    )}
                  >
                    {department.name}
                  </MenuItem>
                ))}
            </Select>

            <FormHelperText>
              {errors.department}
            </FormHelperText>

          </FormControl>

          <TextField
            label="Position Name"
            fullWidth
            value={form.name}
            error={Boolean(errors.name)}
            helperText={errors.name}
            disabled={loading}
            onChange={(e) =>
              handleChange(
                "name",
                e.target.value
              )
            }
          />

          <TextField
            label="Position Code"
            fullWidth
            value={form.code}
            error={Boolean(errors.code)}
            helperText={errors.code}
            disabled={loading}
            onChange={(e) =>
              handleChange(
                "code",
                e.target.value.toUpperCase()
              )
            }
          />

          <TextField
            label="Description"
            multiline
            minRows={3}
            fullWidth
            value={form.description}
            disabled={loading}
            onChange={(e) =>
              handleChange(
                "description",
                e.target.value
              )
            }
          />

          <FormControlLabel
            control={
              <Switch
                checked={form.active}
                disabled={loading}
                onChange={(e) =>
                  handleChange(
                    "active",
                    e.target.checked
                  )
                }
              />
            }
            label={
              form.active
                ? "Position Active"
                : "Position Inactive"
            }
          />

        </Stack>
      </DialogContent>

      <Divider />

      <DialogActions sx={{ p: 2 }}>

        <Button
          disabled={loading}
          onClick={onClose}
        >
          Cancel
        </Button>

        <Button
          variant="contained"
          startIcon={
            loading
              ? (
                <CircularProgress
                  size={18}
                  color="inherit"
                />
              )
              : (
                <SaveIcon />
              )
          }
          onClick={handleSubmit}
          disabled={loading}
          sx={{
            bgcolor: "#C8102E",
            "&:hover": {
              bgcolor: "#9D0C24",
            },
            textTransform: "none",
            fontWeight: 700,
          }}
        >
          {loading
            ? "Saving..."
            : isEditMode
              ? "Update Position"
              : "Save Position"}
        </Button>

      </DialogActions>

    </Dialog>
  );
}
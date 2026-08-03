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
  FormControlLabel,
  IconButton,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";

import CloseIcon from "@mui/icons-material/Close";
import SaveIcon from "@mui/icons-material/Save";

const initialForm = {
  name: "",
  code: "",
  description: "",
  active: true,
};

export default function DepartmentDialog({
  open,
  department = null,
  loading = false,
  onClose,
  onSubmit,
}) {
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");

  const isEditMode = Boolean(department);

  useEffect(() => {
    if (!open) return;

    if (department) {
      setForm({
        name: department.name || "",
        code: department.code || "",
        description: department.description || "",
        active:
          department.active !== undefined
            ? Boolean(department.active)
            : true,
      });
    } else {
      setForm(initialForm);
    }

    setErrors({});
    setSubmitError("");
  }, [department, open]);

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

    if (!form.name.trim()) {
      newErrors.name = "Department name is required.";
    }

    if (!form.code.trim()) {
      newErrors.code = "Department code is required.";
    } else if (form.code.trim().length > 20) {
      newErrors.code =
        "Department code must not exceed 20 characters.";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const applyBackendErrors = (errorData) => {
    if (!errorData || typeof errorData !== "object") {
      setSubmitError(
        "Unable to save the department. Please try again."
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

    const payload = {
      name: form.name.trim(),
      code: form.code.trim().toUpperCase(),
      description: form.description.trim(),
      active: form.active,
    };

    try {
      await onSubmit?.(payload, department);
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
      maxWidth="sm"
    >
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          color: "#0B2A78",
        }}
      >
        <div>
          <Typography
            variant="h5"
            component="h2"
            fontWeight={800}
          >
            {isEditMode
              ? "Edit Department"
              : "Add Department"}
          </Typography>

          <Typography
            variant="body2"
            color="text.secondary"
          >
            {isEditMode
              ? "Update the selected department."
              : "Create a new employee department."}
          </Typography>
        </div>

        <IconButton
          onClick={handleDialogClose}
          disabled={loading}
          aria-label="Close department dialog"
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <Divider />

      <DialogContent>
        <Stack spacing={3} sx={{ mt: 1 }}>
          {submitError && (
            <Alert severity="error">
              {submitError}
            </Alert>
          )}

          <TextField
            fullWidth
            required
            autoFocus
            label="Department Name"
            placeholder="Example: Academic Affairs"
            value={form.name}
            disabled={loading}
            error={Boolean(errors.name)}
            helperText={errors.name}
            onChange={(event) =>
              handleChange("name", event.target.value)
            }
          />

          <TextField
            fullWidth
            required
            label="Department Code"
            placeholder="Example: ACA"
            value={form.code}
            disabled={loading}
            error={Boolean(errors.code)}
            helperText={
              errors.code ||
              "Use a short unique code for the department."
            }
            slotProps={{
              htmlInput: {
                maxLength: 20,
              },
            }}
            onChange={(event) =>
              handleChange(
                "code",
                event.target.value.toUpperCase()
              )
            }
          />

          <TextField
            fullWidth
            multiline
            minRows={3}
            label="Description"
            placeholder="Enter a short description of this department."
            value={form.description}
            disabled={loading}
            error={Boolean(errors.description)}
            helperText={errors.description}
            onChange={(event) =>
              handleChange(
                "description",
                event.target.value
              )
            }
          />

          <FormControlLabel
            control={
              <Switch
                checked={form.active}
                disabled={loading}
                onChange={(event) =>
                  handleChange(
                    "active",
                    event.target.checked
                  )
                }
                sx={{
                  "& .MuiSwitch-switchBase.Mui-checked": {
                    color: "#0B2A78",
                  },
                  "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track":
                    {
                      backgroundColor: "#0B2A78",
                    },
                }}
              />
            }
            label={
              form.active
                ? "Department is active"
                : "Department is inactive"
            }
          />
        </Stack>
      </DialogContent>

      <Divider />

      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button
          onClick={handleDialogClose}
          disabled={loading}
          sx={{
            textTransform: "none",
          }}
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
              ? "Update Department"
              : "Save Department"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
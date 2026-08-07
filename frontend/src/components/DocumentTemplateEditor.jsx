import {
  useEffect,
  useState,
} from "react";

import {
  Alert,
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import {
  Save,
  Settings,
} from "@mui/icons-material";

import { SchoolSettingsAPI } from "../api/schoolSettings";


function errorText(error) {
  const data = error?.response?.data;

  if (!data) {
    return "Unable to save document settings.";
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


export default function DocumentTemplateEditor({
  type,
  settings,
  onSaved,
}) {
  const [open, setOpen] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [form, setForm] =
    useState({});


  useEffect(() => {
    setForm(settings || {});
  }, [settings]);


  const change = (
    field,
    value
  ) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };


  const save = async () => {
    setSaving(true);
    setError("");

    try {
      const data =
        new FormData();

      const fields =
        type === "ID"
          ? [
              "school_name",
              "id_card_address",
              "id_card_title",
              "id_card_footer",
              "principal_name",
              "principal_title",
              "id_card_show_signature",
            ]
          : [
              "certificate_school_name",
              "certificate_address",
              "certificate_intro_text",
              "certificate_footer",
              "principal_name",
              "principal_title",
              "registrar_name",
              "registrar_title",
              "certificate_show_principal_signature",
              "certificate_show_registrar_signature",
            ];

      fields.forEach((field) => {
        const value =
          form[field];

        if (
          value !== undefined &&
          value !== null
        ) {
          data.append(
            field,
            String(value)
          );
        }
      });


      if (
        form.new_principal_signature
      ) {
        data.append(
          "principal_signature",
          form.new_principal_signature
        );
      }


      if (
        type === "CERTIFICATE" &&
        form.new_registrar_signature
      ) {
        data.append(
          "registrar_signature",
          form.new_registrar_signature
        );
      }


      const response =
        await SchoolSettingsAPI.update(
          data
        );

      onSaved?.(
        response.data
      );

      setOpen(false);

    } catch (err) {
      setError(
        errorText(err)
      );

    } finally {
      setSaving(false);
    }
  };


  return (
    <>
      <Button
        variant="outlined"
        startIcon={<Settings />}
        onClick={() =>
          setOpen(true)
        }
      >
        Edit Template
      </Button>


      <Dialog
        open={open}
        onClose={() =>
          !saving &&
          setOpen(false)
        }
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>
          {type === "ID"
            ? "ID Card Template Settings"
            : "Certificate Template Settings"}
        </DialogTitle>

        <DialogContent>
          <Stack
            spacing={2}
            sx={{ mt: 1 }}
          >
            {error && (
              <Alert severity="error">
                {error}
              </Alert>
            )}


            {type === "ID" ? (
              <>
                <Typography
                  fontWeight={900}
                >
                  ID Card Information
                </Typography>

                <TextField
                  label="School Name"
                  value={
                    form.school_name ||
                    ""
                  }
                  onChange={(e) =>
                    change(
                      "school_name",
                      e.target.value
                    )
                  }
                  fullWidth
                />

                <TextField
                  label="Address"
                  value={
                    form.id_card_address ||
                    ""
                  }
                  onChange={(e) =>
                    change(
                      "id_card_address",
                      e.target.value
                    )
                  }
                  fullWidth
                />

                <TextField
                  label="Back Card Title"
                  value={
                    form.id_card_title ||
                    ""
                  }
                  onChange={(e) =>
                    change(
                      "id_card_title",
                      e.target.value
                    )
                  }
                  fullWidth
                />

                <TextField
                  label="Card Footer"
                  value={
                    form.id_card_footer ||
                    ""
                  }
                  onChange={(e) =>
                    change(
                      "id_card_footer",
                      e.target.value
                    )
                  }
                  multiline
                  minRows={2}
                  fullWidth
                />
              </>
            ) : (
              <>
                <Typography
                  fontWeight={900}
                >
                  Certificate Information
                </Typography>

                <TextField
                  label="School Name"
                  value={
                    form.certificate_school_name ||
                    ""
                  }
                  onChange={(e) =>
                    change(
                      "certificate_school_name",
                      e.target.value
                    )
                  }
                  fullWidth
                />

                <TextField
                  label="Address"
                  value={
                    form.certificate_address ||
                    ""
                  }
                  onChange={(e) =>
                    change(
                      "certificate_address",
                      e.target.value
                    )
                  }
                  fullWidth
                />

                <TextField
                  label="Presentation Text"
                  value={
                    form.certificate_intro_text ||
                    ""
                  }
                  onChange={(e) =>
                    change(
                      "certificate_intro_text",
                      e.target.value
                    )
                  }
                  fullWidth
                />

                <TextField
                  label="Certificate Footer"
                  value={
                    form.certificate_footer ||
                    ""
                  }
                  onChange={(e) =>
                    change(
                      "certificate_footer",
                      e.target.value
                    )
                  }
                  multiline
                  minRows={2}
                  fullWidth
                />
              </>
            )}


            <Divider />

            <Typography
              fontWeight={900}
            >
              Principal Signature
            </Typography>

            <TextField
              label="Principal Name"
              value={
                form.principal_name ||
                ""
              }
              onChange={(e) =>
                change(
                  "principal_name",
                  e.target.value
                )
              }
              fullWidth
            />

            <TextField
              label="Principal Title"
              value={
                form.principal_title ||
                "Principal"
              }
              onChange={(e) =>
                change(
                  "principal_title",
                  e.target.value
                )
              }
              fullWidth
            />

            {form.principal_signature && (
              <Box>
                <Typography
                  variant="caption"
                  color="text.secondary"
                >
                  Current Principal Signature
                </Typography>

                <Box
                  component="img"
                  src={
                    form.principal_signature
                  }
                  alt="Principal signature"
                  sx={{
                    display: "block",
                    maxWidth: 220,
                    maxHeight: 90,
                    mt: 1,
                    objectFit: "contain",
                  }}
                />
              </Box>
            )}

            <Button
              component="label"
              variant="outlined"
            >
              Upload Principal Signature

              <input
                hidden
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(e) =>
                  change(
                    "new_principal_signature",
                    e.target.files?.[0] ||
                      null
                  )
                }
              />
            </Button>

            <FormControlLabel
              control={
                <Checkbox
                  checked={
                    type === "ID"
                      ? Boolean(
                          form.id_card_show_signature
                        )
                      : Boolean(
                          form.certificate_show_principal_signature
                        )
                  }
                  onChange={(e) =>
                    change(
                      type === "ID"
                        ? "id_card_show_signature"
                        : "certificate_show_principal_signature",
                      e.target.checked
                    )
                  }
                />
              }
              label="Show Principal signature"
            />


            {type === "CERTIFICATE" && (
              <>
                <Divider />

                <Typography
                  fontWeight={900}
                >
                  Registrar Signature
                </Typography>

                <TextField
                  label="Registrar Name"
                  value={
                    form.registrar_name ||
                    ""
                  }
                  onChange={(e) =>
                    change(
                      "registrar_name",
                      e.target.value
                    )
                  }
                  fullWidth
                />

                <TextField
                  label="Registrar Title"
                  value={
                    form.registrar_title ||
                    "Registrar"
                  }
                  onChange={(e) =>
                    change(
                      "registrar_title",
                      e.target.value
                    )
                  }
                  fullWidth
                />

                {form.registrar_signature && (
                  <Box
                    component="img"
                    src={
                      form.registrar_signature
                    }
                    alt="Registrar signature"
                    sx={{
                      maxWidth: 220,
                      maxHeight: 90,
                      objectFit:
                        "contain",
                    }}
                  />
                )}

                <Button
                  component="label"
                  variant="outlined"
                >
                  Upload Registrar Signature

                  <input
                    hidden
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={(e) =>
                      change(
                        "new_registrar_signature",
                        e.target.files?.[0] ||
                          null
                      )
                    }
                  />
                </Button>

                <FormControlLabel
                  control={
                    <Checkbox
                      checked={Boolean(
                        form.certificate_show_registrar_signature
                      )}
                      onChange={(e) =>
                        change(
                          "certificate_show_registrar_signature",
                          e.target.checked
                        )
                      }
                    />
                  }
                  label="Show Registrar signature"
                />
              </>
            )}
          </Stack>
        </DialogContent>

        <DialogActions>
          <Button
            onClick={() =>
              setOpen(false)
            }
            disabled={saving}
          >
            Cancel
          </Button>

          <Button
            variant="contained"
            startIcon={<Save />}
            onClick={save}
            disabled={saving}
          >
            {saving
              ? "Saving..."
              : "Save Template"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

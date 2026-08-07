import {
  useEffect,
  useState,
} from "react";

import {
  Box,
  Button,
  CircularProgress,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import {
  Print,
} from "@mui/icons-material";

import {
  SchoolSettingsAPI,
} from "../api/schoolSettings";

import DocumentTemplateEditor from "../components/DocumentTemplateEditor";


export default function Certificates() {
  const [name, setName] =
    useState("");

  const [type, setType] =
    useState("Completion");

  const [detail, setDetail] =
    useState(
      "successfully completed the prescribed academic program"
    );

  const [settings, setSettings] =
    useState(null);

  const [loading, setLoading] =
    useState(true);


  useEffect(() => {
    SchoolSettingsAPI.get()
      .then((response) =>
        setSettings(
          response.data
        )
      )
      .finally(() =>
        setLoading(false)
      );
  }, []);


  if (loading) {
    return (
      <Box
        sx={{
          minHeight: 300,
          display: "grid",
          placeItems: "center",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }


  const schoolName =
    settings?.certificate_school_name ||
    settings?.school_name ||
    "Annie T. Doe Memorial Academy";

  const address =
    settings?.certificate_address ||
    settings?.address ||
    "";

  const intro =
    settings?.certificate_intro_text ||
    "This certificate is proudly presented to";


  return (
    <Box>
      <style>
        {`
        @media print {
          body * {
            visibility: hidden !important;
          }

          #certificate,
          #certificate * {
            visibility: visible !important;
          }

          #certificate {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
        `}
      </style>


      <Stack
        direction={{
          xs: "column",
          md: "row",
        }}
        justifyContent="space-between"
        spacing={2}
      >
        <Box>
          <Typography
            variant="h4"
            fontWeight={900}
            color="#0B2A78"
          >
            Certificate Generator
          </Typography>

          <Typography color="text.secondary">
            Generate official Academy certificates.
          </Typography>
        </Box>

        <DocumentTemplateEditor
          type="CERTIFICATE"
          settings={settings}
          onSaved={
            setSettings
          }
        />
      </Stack>


      <Paper
        sx={{
          p: 3,
          borderRadius: 3,
          my: 3,
        }}
      >
        <Stack
          direction={{
            xs: "column",
            md: "row",
          }}
          spacing={2}
        >
          <TextField
            fullWidth
            label="Recipient Name"
            value={name}
            onChange={(e) =>
              setName(
                e.target.value
              )
            }
          />

          <TextField
            select
            fullWidth
            label="Certificate Type"
            value={type}
            onChange={(e) =>
              setType(
                e.target.value
              )
            }
          >
            <MenuItem value="Completion">
              Completion
            </MenuItem>

            <MenuItem value="Achievement">
              Achievement
            </MenuItem>

            <MenuItem value="Recognition">
              Recognition
            </MenuItem>
          </TextField>

          <TextField
            fullWidth
            label="Citation"
            value={detail}
            onChange={(e) =>
              setDetail(
                e.target.value
              )
            }
          />

          <Button
            variant="contained"
            startIcon={<Print />}
            onClick={() =>
              window.print()
            }
          >
            Print
          </Button>
        </Stack>
      </Paper>


      <Paper
        id="certificate"
        sx={{
          width: "297mm",
          minHeight: "210mm",
          mx: "auto",
          p: "18mm",
          border:
            "5mm double #071B54",
          textAlign: "center",
          position: "relative",
        }}
      >
        <img
          src={
            settings?.logo ||
            "/atdmf-seal.jpeg"
          }
          alt="School seal"
          style={{
            width: 120,
            height: 120,
            borderRadius: "50%",
            objectFit: "cover",
          }}
        />


        <Typography
          variant="h3"
          fontWeight={950}
          color="#071B54"
        >
          {schoolName}
        </Typography>

        <Typography>
          {address}
        </Typography>


        <Typography
          variant="h2"
          fontWeight={900}
          color="#C8102E"
          mt={4}
        >
          Certificate of {type}
        </Typography>


        <Typography
          variant="h6"
          mt={4}
        >
          {intro}
        </Typography>


        <Typography
          variant="h2"
          fontWeight={900}
          sx={{
            borderBottom:
              "2px solid #071B54",
            display: "inline-block",
            px: 8,
            mt: 2,
          }}
        >
          {name ||
            "Recipient Name"}
        </Typography>


        <Typography
          variant="h5"
          mt={4}
        >
          {detail}
        </Typography>


        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="flex-end"
          mt={10}
        >
          <SignatureBlock
            visible={
              settings?.certificate_show_principal_signature
            }
            signature={
              settings?.principal_signature
            }
            name={
              settings?.principal_name
            }
            title={
              settings?.principal_title ||
              "Principal"
            }
          />

          <SignatureBlock
            visible={
              settings?.certificate_show_registrar_signature
            }
            signature={
              settings?.registrar_signature
            }
            name={
              settings?.registrar_name
            }
            title={
              settings?.registrar_title ||
              "Registrar"
            }
          />
        </Stack>


        {settings?.certificate_footer && (
          <Typography
            sx={{
              mt: 5,
              fontSize: 13,
              color: "text.secondary",
            }}
          >
            {
              settings.certificate_footer
            }
          </Typography>
        )}
      </Paper>
    </Box>
  );
}


function SignatureBlock({
  visible,
  signature,
  name,
  title,
}) {
  return (
    <Box
      sx={{
        width: 260,
        textAlign: "center",
      }}
    >
      {visible &&
        signature && (
          <Box
            component="img"
            src={signature}
            alt={`${title} signature`}
            sx={{
              height: 70,
              maxWidth: 220,
              objectFit: "contain",
              mb: -1,
            }}
          />
        )}

      <Box
        sx={{
          borderTop:
            "1px solid #111",
          pt: 1,
        }}
      >
        {name && (
          <Typography
            fontWeight={800}
          >
            {name}
          </Typography>
        )}

        <Typography>
          {title}
        </Typography>
      </Box>
    </Box>
  );
}

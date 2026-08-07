import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  Print,
} from "@mui/icons-material";

import {
  Box,
  Button,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Typography,
} from "@mui/material";

import JsBarcode from "jsbarcode";
import QRCode from "qrcode";

import api from "../api/client";

import {
  SchoolSettingsAPI,
} from "../api/schoolSettings";

import DocumentTemplateEditor from "../components/DocumentTemplateEditor";


const list = (response) =>
  Array.isArray(response.data)
    ? response.data
    : response.data.results || [];


function Barcode({
  value,
}) {
  const ref = useRef();

  useEffect(() => {
    if (value) {
      JsBarcode(
        ref.current,
        value,
        {
          format: "CODE128",
          height: 34,
          fontSize: 10,
          margin: 0,
        }
      );
    }
  }, [value]);

  return <svg ref={ref} />;
}


function QR({
  value,
}) {
  const [src, setSrc] =
    useState("");

  useEffect(() => {
    if (value) {
      QRCode.toDataURL(
        value,
        {
          width: 130,
          margin: 1,
        }
      ).then(setSrc);
    }
  }, [value]);

  return src ? (
    <img
      src={src}
      alt="QR code"
      style={{
        width: 90,
        height: 90,
      }}
    />
  ) : null;
}


export default function IDCards() {
  const [type, setType] =
    useState("STUDENT");

  const [records, setRecords] =
    useState([]);

  const [id, setId] =
    useState("");

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


  useEffect(() => {
    api.get(
      type === "STUDENT"
        ? "/students/records/"
        : "/employees/employees/",
      {
        params: {
          page_size: 2000,
        },
      }
    ).then((response) =>
      setRecords(
        list(response)
      )
    );

    setId("");

  }, [type]);


  const person =
    useMemo(
      () =>
        records.find(
          (item) =>
            String(item.id) ===
            String(id)
        ),
      [records, id]
    );


  const code =
    type === "STUDENT"
      ? person?.admission_number
      : person?.employee_id;


  const photo =
    person?.photo_url ||
    person?.photo;


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


  return (
    <Box>
      <style>
        {`
        @media print {
          body * {
            visibility: hidden !important;
          }

          #print-card,
          #print-card * {
            visibility: visible !important;
          }

          #print-card {
            position: absolute;
            left: 0;
            top: 0;
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
            ID Card Generator
          </Typography>

          <Typography
            color="text.secondary"
            mb={3}
          >
            Student and staff official identification cards.
          </Typography>
        </Box>

        <DocumentTemplateEditor
          type="ID"
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
          mb: 3,
        }}
      >
        <Stack
          direction={{
            xs: "column",
            md: "row",
          }}
          spacing={2}
        >
          <FormControl fullWidth>
            <InputLabel>
              Card Type
            </InputLabel>

            <Select
              label="Card Type"
              value={type}
              onChange={(e) =>
                setType(
                  e.target.value
                )
              }
            >
              <MenuItem value="STUDENT">
                Student
              </MenuItem>

              <MenuItem value="EMPLOYEE">
                Staff
              </MenuItem>
            </Select>
          </FormControl>


          <FormControl fullWidth>
            <InputLabel>
              Select Person
            </InputLabel>

            <Select
              label="Select Person"
              value={id}
              onChange={(e) =>
                setId(
                  e.target.value
                )
              }
            >
              {records.map(
                (item) => (
                  <MenuItem
                    key={item.id}
                    value={item.id}
                  >
                    {item.full_name}
                    {" — "}
                    {
                      item.admission_number ||
                      item.employee_id
                    }
                  </MenuItem>
                )
              )}
            </Select>
          </FormControl>


          <Button
            variant="contained"
            startIcon={<Print />}
            disabled={!person}
            onClick={() =>
              window.print()
            }
          >
            Print
          </Button>
        </Stack>
      </Paper>


      {person && (
        <Stack
          id="print-card"
          direction={{
            xs: "column",
            lg: "row",
          }}
          spacing={3}
          sx={{
            width: "max-content",
            mx: "auto",
          }}
        >
          <Card
            front
            person={person}
            code={code}
            type={type}
            photo={photo}
            settings={settings}
          />

          <Card
            person={person}
            code={code}
            type={type}
            settings={settings}
          />
        </Stack>
      )}
    </Box>
  );
}


function Card({
  front,
  person,
  code,
  type,
  photo,
  settings,
}) {
  const schoolName =
    settings?.school_name ||
    "Annie T. Doe Memorial Academy";

  const address =
    settings?.id_card_address ||
    settings?.address ||
    "";

  const title =
    settings?.id_card_title ||
    "OFFICIAL IDENTIFICATION CARD";

  const footer =
    settings?.id_card_footer ||
    "";

  return (
    <Paper
      sx={{
        width: "85.6mm",
        height: "53.98mm",
        borderRadius: "3mm",
        overflow: "hidden",
        position: "relative",
        p: 0,
      }}
    >
      {front ? (
        <>
          <Box
            sx={{
              bgcolor: "#071B54",
              color: "white",
              p: "3mm",
              display: "flex",
              alignItems: "center",
              gap: "2mm",
            }}
          >
            <img
              src={
                settings?.logo ||
                "/atdmf-seal.jpeg"
              }
              alt="School seal"
              style={{
                width: "10mm",
                height: "10mm",
                borderRadius: "50%",
                objectFit: "cover",
              }}
            />

            <Box>
              <Typography
                sx={{
                  fontSize: "3.5mm",
                  fontWeight: 900,
                }}
              >
                {schoolName}
              </Typography>

              <Typography
                sx={{
                  fontSize: "2mm",
                }}
              >
                {address}
              </Typography>
            </Box>
          </Box>


          <Box
            sx={{
              p: "3mm",
              display: "grid",
              gridTemplateColumns:
                "25mm 1fr",
              gap: "3mm",
            }}
          >
            <Box
              component="img"
              src={
                photo ||
                settings?.logo ||
                "/atdmf-seal.jpeg"
              }
              sx={{
                width: "24mm",
                height: "29mm",
                objectFit: "cover",
                border:
                  "1px solid #C8102E",
              }}
            />

            <Box>
              <Typography
                sx={{
                  fontSize: "2mm",
                  color: "#64748B",
                }}
              >
                FULL NAME
              </Typography>

              <Typography
                sx={{
                  fontSize: "4mm",
                  fontWeight: 900,
                  color: "#071B54",
                }}
              >
                {person.full_name}
              </Typography>

              <Typography
                sx={{
                  fontSize: "2mm",
                  color: "#64748B",
                  mt: 1,
                }}
              >
                ID NUMBER
              </Typography>

              <Typography
                sx={{
                  fontSize: "3.3mm",
                  fontWeight: 800,
                }}
              >
                {code}
              </Typography>

              <Typography
                sx={{
                  fontSize: "2.5mm",
                  fontWeight: 800,
                  mt: 1,
                }}
              >
                {type === "STUDENT"
                  ? "STUDENT"
                  : "STAFF"}
              </Typography>
            </Box>
          </Box>
        </>
      ) : (
        <Stack
          alignItems="center"
          justifyContent="space-between"
          sx={{
            height: "100%",
            p: "4mm",
          }}
        >
          <Typography
            fontWeight={900}
            color="#071B54"
            textAlign="center"
          >
            {title}
          </Typography>

          <Stack
            direction="row"
            alignItems="center"
            spacing={2}
          >
            <Barcode
              value={code}
            />

            <QR
              value={code}
            />
          </Stack>


          {settings?.id_card_show_signature &&
            settings?.principal_signature && (
              <Box
                sx={{
                  textAlign: "center",
                }}
              >
                <Box
                  component="img"
                  src={
                    settings.principal_signature
                  }
                  alt="Principal signature"
                  sx={{
                    maxHeight: "7mm",
                    maxWidth: "25mm",
                    objectFit:
                      "contain",
                  }}
                />

                <Typography
                  sx={{
                    fontSize: "1.8mm",
                  }}
                >
                  {
                    settings.principal_name
                  }
                  {" — "}
                  {
                    settings.principal_title ||
                    "Principal"
                  }
                </Typography>
              </Box>
            )}


          <Typography
            sx={{
              fontSize: "2.2mm",
              textAlign: "center",
            }}
          >
            {footer}
          </Typography>
        </Stack>
      )}
    </Paper>
  );
}

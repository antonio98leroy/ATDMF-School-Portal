import {
  useEffect,
  useState,
} from "react";

import {
  Box,
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Alert,
  Button,
} from "@mui/material";

import { Print } from "@mui/icons-material";
import { TimetableAPI } from "../api/timetable";

const DAYS = [
  ["MON", "Monday"],
  ["TUE", "Tuesday"],
  ["WED", "Wednesday"],
  ["THU", "Thursday"],
  ["FRI", "Friday"],
];

export default function TeacherSchedule() {
  const [entries, setEntries] = useState([]);
  const [periods, setPeriods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);

      try {
        const [scheduleRes, periodsRes] =
          await Promise.all([
            TimetableAPI.getMyTimetable(),
            TimetableAPI.getPeriods(),
          ]);

        setEntries(scheduleRes.data || []);
        setPeriods(periodsRes.data || []);
      } catch (err) {
        setError(
          err?.response?.data?.detail ||
          "Unable to load your timetable."
        );
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const findEntry = (periodId, day) =>
    entries.find(
      (entry) =>
        String(entry.period?.id) === String(periodId)
        && entry.day === day
    );

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: 350,
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
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          mb: 3,
        }}
      >
        <Box>
          <Typography variant="h4" fontWeight={900}>
            My Teaching Schedule
          </Typography>

          <Typography color="text.secondary">
            Your assigned classes and subjects by period.
          </Typography>
        </Box>

        <Button
          variant="outlined"
          startIcon={<Print />}
          onClick={() => window.print()}
        >
          Print
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 1000 }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 900 }}>
                Period
              </TableCell>

              {DAYS.map(([code, name]) => (
                <TableCell
                  key={code}
                  align="center"
                  sx={{ fontWeight: 900 }}
                >
                  {name}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>

          <TableBody>
            {periods.map((period) => (
              <TableRow key={period.id}>
                <TableCell>
                  <Typography fontWeight={800}>
                    {period.name}
                  </Typography>

                  <Typography
                    variant="caption"
                    color="text.secondary"
                  >
                    {period.start_time}
                    {" - "}
                    {period.end_time}
                  </Typography>
                </TableCell>

                {DAYS.map(([day]) => {
                  const entry = findEntry(
                    period.id,
                    day
                  );

                  return (
                    <TableCell
                      key={day}
                      align="center"
                    >
                      {!period.is_teaching_period ? (
                        <strong>{period.name}</strong>
                      ) : entry ? (
                        <>
                          <Typography fontWeight={800}>
                            {entry.subject?.name}
                          </Typography>

                          <Typography variant="body2">
                            {entry.class_section?.name}
                          </Typography>

                          {entry.room && (
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {entry.room}
                            </Typography>
                          )}
                        </>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  FormControl,
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
  Typography,
} from "@mui/material";

import {
  CalendarMonth,
  Save,
} from "@mui/icons-material";

import { TeacherPortalAPI } from "../api/teacherPortal";
import { ClassroomAttendanceAPI } from "../api/classroomAttendance";


function normalizeList(response) {
  if (Array.isArray(response?.data)) {
    return response.data;
  }

  return response?.data?.results || [];
}


function formatError(error) {
  const data = error?.response?.data;

  if (!data) {
    return "An unexpected error occurred.";
  }

  if (data.detail) {
    return typeof data.detail === "string"
      ? data.detail
      : JSON.stringify(data.detail);
  }

  return Object.entries(data)
    .map(([field, value]) => {
      const message = Array.isArray(value)
        ? value.join(" ")
        : typeof value === "object"
          ? JSON.stringify(value)
          : String(value);

      return `${field.replaceAll("_", " ")}: ${message}`;
    })
    .join(" ");
}


export default function ClassroomAttendance() {
  const [assignments, setAssignments] =
    useState([]);

  const [assignmentId, setAssignmentId] =
    useState("");

  const [attendanceDate, setAttendanceDate] =
    useState(
      new Date().toISOString().slice(0, 10)
    );

  const [students, setStudents] =
    useState([]);

  const [statusChoices, setStatusChoices] =
    useState([]);

  const [assignmentInfo, setAssignmentInfo] =
    useState(null);

  const [session, setSession] =
    useState(null);

  const [notes, setNotes] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [rosterLoading, setRosterLoading] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");


  useEffect(() => {
    const loadAssignments = async () => {
      setLoading(true);
      setError("");

      try {
        const response =
          await TeacherPortalAPI.getAssignments();

        setAssignments(
          normalizeList(response)
        );
      } catch (err) {
        setError(formatError(err));
      } finally {
        setLoading(false);
      }
    };

    loadAssignments();
  }, []);


  const loadRoster = async () => {
    if (!assignmentId) {
      setError(
        "Please select a class and subject."
      );
      return;
    }

    setRosterLoading(true);
    setError("");
    setSuccess("");

    try {
      const response =
        await ClassroomAttendanceAPI.getRoster({
          teacher_assignment: assignmentId,
          date: attendanceDate,
        });

      setStudents(
        response.data.students || []
      );

      setStatusChoices(
        response.data.status_choices || []
      );

      setAssignmentInfo(
        response.data.assignment || null
      );

      setSession(
        response.data.session || null
      );

      setNotes(
        response.data.session?.notes || ""
      );
    } catch (err) {
      setStudents([]);
      setAssignmentInfo(null);
      setSession(null);
      setError(formatError(err));
    } finally {
      setRosterLoading(false);
    }
  };


  useEffect(() => {
    if (assignmentId) {
      loadRoster();
    } else {
      setStudents([]);
      setAssignmentInfo(null);
      setSession(null);
    }
  }, [
    assignmentId,
    attendanceDate,
  ]);


  const updateStudent = (
    index,
    field,
    value
  ) => {
    setStudents((current) =>
      current.map((student, i) =>
        i === index
          ? {
              ...student,
              [field]: value,
            }
          : student
      )
    );
  };


  const markAll = (status) => {
    setStudents((current) =>
      current.map((student) => ({
        ...student,
        status,
      }))
    );
  };


  const saveAttendance = async () => {
    if (!assignmentId) {
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const response =
        await ClassroomAttendanceAPI.submitAttendance(
          {
            teacher_assignment:
              assignmentId,

            date:
              attendanceDate,

            notes:
              notes.trim(),

            records:
              students.map(
                (student) => ({
                  student_id:
                    student.student_id,

                  status:
                    student.status,

                  remarks:
                    student.remarks || "",
                })
              ),
          }
        );

      setSession(
        response.data.session || null
      );

      setSuccess(
        "Classroom attendance submitted successfully."
      );

      await loadRoster();
    } catch (err) {
      setError(formatError(err));
    } finally {
      setSaving(false);
    }
  };


  const summary = useMemo(() => {
    const totals = {};

    statusChoices.forEach(
      (choice) => {
        totals[choice.value] = 0;
      }
    );

    students.forEach(
      (student) => {
        if (
          totals[student.status] !==
          undefined
        ) {
          totals[student.status] += 1;
        }
      }
    );

    return totals;
  }, [
    students,
    statusChoices,
  ]);


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
      <Stack
        direction={{
          xs: "column",
          md: "row",
        }}
        justifyContent="space-between"
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography
            variant="h4"
            fontWeight={900}
          >
            Classroom Attendance
          </Typography>

          <Typography
            color="text.secondary"
          >
            Take subject-level attendance
            for your assigned class.
          </Typography>
        </Box>

        {session?.submitted && (
          <Chip
            label="Attendance Submitted"
            color="success"
          />
        )}
      </Stack>

      {error && (
        <Alert
          severity="error"
          sx={{ mb: 2 }}
          onClose={() =>
            setError("")
          }
        >
          {error}
        </Alert>
      )}

      {success && (
        <Alert
          severity="success"
          sx={{ mb: 2 }}
          onClose={() =>
            setSuccess("")
          }
        >
          {success}
        </Alert>
      )}

      <Paper
        sx={{
          p: 2,
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
              Class / Subject
            </InputLabel>

            <Select
              value={assignmentId}
              label="Class / Subject"
              onChange={(event) =>
                setAssignmentId(
                  event.target.value
                )
              }
            >
              {assignments.map(
                (item) => (
                  <MenuItem
                    key={item.id}
                    value={item.id}
                  >
                    {item.class_name}
                    {" — "}
                    {item.subject_name}
                    {" — "}
                    {item.term_name}
                  </MenuItem>
                )
              )}
            </Select>
          </FormControl>

          <TextField
            label="Attendance Date"
            type="date"
            value={attendanceDate}
            onChange={(event) =>
              setAttendanceDate(
                event.target.value
              )
            }
            InputLabelProps={{
              shrink: true,
            }}
            fullWidth
          />
        </Stack>
      </Paper>

      {rosterLoading && (
        <Box
          sx={{
            display: "grid",
            placeItems: "center",
            py: 6,
          }}
        >
          <CircularProgress />
        </Box>
      )}

      {!rosterLoading &&
        assignmentInfo && (
          <>
            <Paper
              sx={{
                p: 2,
                mb: 2,
              }}
            >
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
                    variant="h6"
                    fontWeight={900}
                  >
                    {
                      assignmentInfo.class_name
                    }
                  </Typography>

                  <Typography
                    color="text.secondary"
                  >
                    {
                      assignmentInfo.subject_name
                    }
                    {" • "}
                    {
                      assignmentInfo.term_name
                    }
                    {" • "}
                    {
                      assignmentInfo.academic_year_name
                    }
                  </Typography>
                </Box>

                <Stack
                  direction="row"
                  spacing={1}
                  flexWrap="wrap"
                >
                  {statusChoices.map(
                    (choice) => (
                      <Chip
                        key={choice.value}
                        label={
                          `${choice.label}: ${
                            summary[
                              choice.value
                            ] || 0
                          }`
                        }
                      />
                    )
                  )}
                </Stack>
              </Stack>
            </Paper>

            <Paper
              sx={{
                p: 2,
                mb: 2,
              }}
            >
              <Typography
                fontWeight={800}
                sx={{ mb: 1 }}
              >
                Quick Mark
              </Typography>

              <Stack
                direction="row"
                spacing={1}
                flexWrap="wrap"
              >
                {statusChoices.map(
                  (choice) => (
                    <Button
                      key={choice.value}
                      size="small"
                      variant="outlined"
                      onClick={() =>
                        markAll(
                          choice.value
                        )
                      }
                    >
                      Mark All{" "}
                      {choice.label}
                    </Button>
                  )
                )}
              </Stack>
            </Paper>

            <TableContainer
              component={Paper}
            >
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>
                      No.
                    </TableCell>

                    <TableCell>
                      Admission No.
                    </TableCell>

                    <TableCell>
                      Student
                    </TableCell>

                    <TableCell
                      sx={{
                        width: 220,
                      }}
                    >
                      Status
                    </TableCell>

                    <TableCell>
                      Remarks
                    </TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {students.map(
                    (
                      student,
                      index
                    ) => (
                      <TableRow
                        key={
                          student.student_id
                        }
                      >
                        <TableCell>
                          {index + 1}
                        </TableCell>

                        <TableCell>
                          {
                            student.admission_number
                          }
                        </TableCell>

                        <TableCell>
                          <Typography
                            fontWeight={700}
                          >
                            {
                              student.full_name
                            }
                          </Typography>

                          {student.roll_number && (
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              Roll No:{" "}
                              {
                                student.roll_number
                              }
                            </Typography>
                          )}
                        </TableCell>

                        <TableCell>
                          <FormControl
                            fullWidth
                            size="small"
                          >
                            <Select
                              value={
                                student.status ||
                                "P"
                              }
                              onChange={(
                                event
                              ) =>
                                updateStudent(
                                  index,
                                  "status",
                                  event.target
                                    .value
                                )
                              }
                            >
                              {statusChoices.map(
                                (
                                  choice
                                ) => (
                                  <MenuItem
                                    key={
                                      choice.value
                                    }
                                    value={
                                      choice.value
                                    }
                                  >
                                    {
                                      choice.label
                                    }
                                  </MenuItem>
                                )
                              )}
                            </Select>
                          </FormControl>
                        </TableCell>

                        <TableCell>
                          <TextField
                            size="small"
                            fullWidth
                            value={
                              student.remarks ||
                              ""
                            }
                            onChange={(
                              event
                            ) =>
                              updateStudent(
                                index,
                                "remarks",
                                event.target
                                  .value
                              )
                            }
                            placeholder="Optional"
                          />
                        </TableCell>
                      </TableRow>
                    )
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            <Paper
              sx={{
                p: 2,
                mt: 2,
              }}
            >
              <TextField
                label="Class Attendance Notes"
                fullWidth
                multiline
                minRows={2}
                value={notes}
                onChange={(event) =>
                  setNotes(
                    event.target.value
                  )
                }
                placeholder={
                  "Optional notes for this class session"
                }
              />

              <Box
                sx={{
                  mt: 2,
                  display: "flex",
                  justifyContent:
                    "flex-end",
                }}
              >
                <Button
                  size="large"
                  variant="contained"
                  startIcon={<Save />}
                  disabled={
                    saving ||
                    students.length === 0
                  }
                  onClick={
                    saveAttendance
                  }
                >
                  {saving
                    ? "Submitting..."
                    : session?.submitted
                      ? "Update Attendance"
                      : "Submit Attendance"}
                </Button>
              </Box>
            </Paper>
          </>
        )}
    </Box>
  );
}

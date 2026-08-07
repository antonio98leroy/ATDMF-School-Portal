import {
  useEffect,
  useState,
} from "react";

import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
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
  Add,
  Save,
} from "@mui/icons-material";

import {
  TeacherPortalAPI,
} from "../api/teacherPortal";

import {
  TeacherGradeAPI,
} from "../api/teacherGrades";


function normalizeList(response) {
  if (Array.isArray(response?.data)) {
    return response.data;
  }

  return response?.data?.results || [];
}


function errorText(error) {
  const data = error?.response?.data;

  if (!data) {
    return "An unexpected error occurred.";
  }

  if (data.detail) {
    return data.detail;
  }

  return Object.entries(data)
    .map(([field, value]) => {
      const message = Array.isArray(value)
        ? value.join(" ")
        : typeof value === "object"
          ? JSON.stringify(value)
          : String(value);

      return `${field}: ${message}`;
    })
    .join(" ");
}


export default function TeacherGradeEntry() {
  const [assignments, setAssignments] =
    useState([]);

  const [assignmentId, setAssignmentId] =
    useState("");

  const [assessments, setAssessments] =
    useState([]);

  const [assessmentId, setAssessmentId] =
    useState("");

  const [students, setStudents] =
    useState([]);

  const [assessment, setAssessment] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [dialogOpen, setDialogOpen] =
    useState(false);

  const [newAssessment, setNewAssessment] =
    useState({
      name: "",
      max_score: "100",
      date: new Date()
        .toISOString()
        .slice(0, 10),
    });


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
      setError(errorText(err));
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    loadAssignments();
  }, []);


  const loadAssessments = async (id) => {
    setAssessmentId("");
    setStudents([]);
    setAssessment(null);

    if (!id) {
      setAssessments([]);
      return;
    }

    try {
      const response =
        await TeacherGradeAPI.getAssessments({
          teacher_assignment: id,
        });

      setAssessments(
        normalizeList(response)
      );
    } catch (err) {
      setError(errorText(err));
    }
  };


  const selectAssignment = async (id) => {
    setAssignmentId(id);
    setSuccess("");
    setError("");

    await loadAssessments(id);
  };


  const loadStudents = async (id) => {
    setAssessmentId(id);
    setStudents([]);
    setAssessment(null);
    setSuccess("");

    if (!id) return;

    try {
      const response =
        await TeacherGradeAPI.getStudents(
          id,
          {
            teacher_assignment:
              assignmentId,
          }
        );

      setAssessment(
        response.data.assessment
      );

      setStudents(
        response.data.students || []
      );
    } catch (err) {
      setError(errorText(err));
    }
  };


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


  const createAssessment = async () => {
    if (!assignmentId) {
      setError(
        "Select a teacher assignment first."
      );
      return;
    }

    if (!newAssessment.name.trim()) {
      setError(
        "Enter the assessment name."
      );
      return;
    }

    try {
      setSaving(true);
      setError("");

      const response =
        await TeacherGradeAPI.createAssessment({
          teacher_assignment:
            assignmentId,

          name:
            newAssessment.name.trim(),

          max_score:
            newAssessment.max_score,

          date:
            newAssessment.date,
        });

      setDialogOpen(false);

      setNewAssessment({
        name: "",
        max_score: "100",
        date: new Date()
          .toISOString()
          .slice(0, 10),
      });

      await loadAssessments(
        assignmentId
      );

      await loadStudents(
        response.data.id
      );

      setSuccess(
        "Assessment created successfully."
      );
    } catch (err) {
      setError(errorText(err));
    } finally {
      setSaving(false);
    }
  };


  const saveScores = async () => {
    if (
      !assessmentId ||
      !assignmentId
    ) {
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      await TeacherGradeAPI.saveScores(
        assessmentId,
        {
          teacher_assignment:
            assignmentId,

          scores: students.map(
            (student) => ({
              student_id:
                student.student_id,

              score: student.score,

              remarks:
                student.remarks || "",
            })
          ),
        }
      );

      setSuccess(
        "All valid scores were saved successfully."
      );

      await loadStudents(
        assessmentId
      );
    } catch (err) {
      setError(errorText(err));
    } finally {
      setSaving(false);
    }
  };


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
            Assessment & Grade Entry
          </Typography>

          <Typography
            color="text.secondary"
          >
            Enter scores only for your
            assigned classes and subjects.
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<Add />}
          disabled={!assignmentId}
          onClick={() =>
            setDialogOpen(true)
          }
        >
          New Assessment
        </Button>
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
          <FormControl
            fullWidth
          >
            <InputLabel>
              Class / Subject
            </InputLabel>

            <Select
              value={assignmentId}
              label="Class / Subject"
              onChange={(event) =>
                selectAssignment(
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

          <FormControl
            fullWidth
            disabled={!assignmentId}
          >
            <InputLabel>
              Assessment
            </InputLabel>

            <Select
              value={assessmentId}
              label="Assessment"
              onChange={(event) =>
                loadStudents(
                  event.target.value
                )
              }
            >
              {assessments.map(
                (item) => (
                  <MenuItem
                    key={item.id}
                    value={item.id}
                  >
                    {item.name}
                    {" — "}
                    {item.max_score} Marks
                  </MenuItem>
                )
              )}
            </Select>
          </FormControl>
        </Stack>
      </Paper>

      {assessment && (
        <Paper
          sx={{
            p: 2,
            mb: 2,
          }}
        >
          <Typography
            variant="h6"
            fontWeight={900}
          >
            {assessment.name}
          </Typography>

          <Typography
            color="text.secondary"
          >
            {assessment.class_name}
            {" • "}
            {assessment.subject_name}
            {" • Maximum Score: "}
            {assessment.max_score}
          </Typography>
        </Paper>
      )}

      {assessment && (
        <>
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
                    sx={{ width: 160 }}
                  >
                    Score
                  </TableCell>

                  <TableCell>
                    Remarks
                  </TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {students.map(
                  (student, index) => (
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
                          {student.full_name}
                        </Typography>
                      </TableCell>

                      <TableCell>
                        <TextField
                          type="number"
                          size="small"
                          value={
                            student.score
                          }
                          inputProps={{
                            min: 0,
                            max:
                              Number(
                                assessment.max_score
                              ),
                            step: "0.01",
                          }}
                          onChange={(
                            event
                          ) =>
                            updateStudent(
                              index,
                              "score",
                              event.target.value
                            )
                          }
                        />
                      </TableCell>

                      <TableCell>
                        <TextField
                          size="small"
                          fullWidth
                          value={
                            student.remarks
                          }
                          onChange={(
                            event
                          ) =>
                            updateStudent(
                              index,
                              "remarks",
                              event.target.value
                            )
                          }
                        />
                      </TableCell>
                    </TableRow>
                  )
                )}
              </TableBody>
            </Table>
          </TableContainer>

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
              disabled={saving}
              onClick={saveScores}
            >
              {saving
                ? "Saving..."
                : "Save Grades"}
            </Button>
          </Box>
        </>
      )}

      <Dialog
        open={dialogOpen}
        onClose={() =>
          !saving &&
          setDialogOpen(false)
        }
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          Create Assessment
        </DialogTitle>

        <DialogContent>
          <Stack
            spacing={2}
            sx={{ mt: 1 }}
          >
            <TextField
              label="Assessment Name"
              placeholder="Example: Quiz 1, Midterm Test"
              value={
                newAssessment.name
              }
              onChange={(event) =>
                setNewAssessment(
                  (current) => ({
                    ...current,
                    name:
                      event.target.value,
                  })
                )
              }
              fullWidth
            />

            <TextField
              label="Maximum Score"
              type="number"
              value={
                newAssessment.max_score
              }
              onChange={(event) =>
                setNewAssessment(
                  (current) => ({
                    ...current,
                    max_score:
                      event.target.value,
                  })
                )
              }
              fullWidth
            />

            <TextField
              label="Assessment Date"
              type="date"
              value={
                newAssessment.date
              }
              onChange={(event) =>
                setNewAssessment(
                  (current) => ({
                    ...current,
                    date:
                      event.target.value,
                  })
                )
              }
              InputLabelProps={{
                shrink: true,
              }}
              fullWidth
            />
          </Stack>
        </DialogContent>

        <DialogActions>
          <Button
            onClick={() =>
              setDialogOpen(false)
            }
            disabled={saving}
          >
            Cancel
          </Button>

          <Button
            variant="contained"
            onClick={
              createAssessment
            }
            disabled={saving}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

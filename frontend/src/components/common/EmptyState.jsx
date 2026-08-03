import {
  Box,
  Button,
  Stack,
  Typography,
} from "@mui/material";

import InboxIcon from "@mui/icons-material/Inbox";

export default function EmptyState({
  icon = <InboxIcon sx={{ fontSize: 80 }} />,
  title = "No records found",
  description = "There is currently no data available.",
  actionLabel = "",
  actionIcon = null,
  onAction,
}) {
  return (
    <Box
      sx={{
        py: 8,
        px: 3,
        textAlign: "center",
        border: "1px dashed #D1D5DB",
        borderRadius: 3,
        bgcolor: "#FAFAFA",
      }}
    >
      <Box
        sx={{
          color: "#9CA3AF",
          mb: 2,
        }}
      >
        {icon}
      </Box>

      <Typography
        variant="h5"
        sx={{
          fontWeight: 700,
          mb: 1,
          color: "#0B2A78",
        }}
      >
        {title}
      </Typography>

      <Typography
        variant="body1"
        color="text.secondary"
        sx={{
          maxWidth: 500,
          mx: "auto",
          mb: 3,
        }}
      >
        {description}
      </Typography>

      {actionLabel && (
        <Stack
          direction="row"
          justifyContent="center"
        >
          <Button
            variant="contained"
            startIcon={actionIcon}
            onClick={onAction}
            sx={{
              bgcolor: "#C8102E",
              textTransform: "none",
              fontWeight: 700,
              "&:hover": {
                bgcolor: "#9D0C24",
              },
            }}
          >
            {actionLabel}
          </Button>
        </Stack>
      )}
    </Box>
  );
}
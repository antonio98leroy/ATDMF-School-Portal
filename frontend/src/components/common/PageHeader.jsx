import { Box, Button, Stack, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";

export default function PageHeader({
  title,
  subtitle = "",
  actionLabel = "",
  actionIcon = <AddIcon />,
  onAction,
  secondaryLabel = "",
  secondaryIcon = null,
  onSecondaryAction,
  actionDisabled = false,
}) {
  return (
    <Stack
      direction={{
        xs: "column",
        sm: "row",
      }}
      spacing={2}
      sx={{
        alignItems: {
          xs: "stretch",
          sm: "center",
        },
        justifyContent: "space-between",
        mb: 3,
      }}
    >
      <Box>
        <Typography
          variant="h4"
          component="h1"
          sx={{
            color: "#0B2A78",
            fontWeight: 800,
            lineHeight: 1.2,
          }}
        >
          {title}
        </Typography>

        {subtitle && (
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ mt: 0.5 }}
          >
            {subtitle}
          </Typography>
        )}
      </Box>

      <Stack
        direction={{
          xs: "column",
          sm: "row",
        }}
        spacing={1}
      >
        {secondaryLabel && (
          <Button
            variant="outlined"
            startIcon={secondaryIcon}
            onClick={onSecondaryAction}
            sx={{
              borderColor: "#0B2A78",
              color: "#0B2A78",
              fontWeight: 700,
              textTransform: "none",
              "&:hover": {
                borderColor: "#071B54",
                bgcolor: "rgba(11, 42, 120, 0.05)",
              },
            }}
          >
            {secondaryLabel}
          </Button>
        )}

        {actionLabel && (
          <Button
            variant="contained"
            startIcon={actionIcon}
            onClick={onAction}
            disabled={actionDisabled}
            sx={{
              bgcolor: "#C8102E",
              fontWeight: 700,
              textTransform: "none",
              px: 2.5,
              "&:hover": {
                bgcolor: "#9D0C24",
              },
            }}
          >
            {actionLabel}
          </Button>
        )}
      </Stack>
    </Stack>
  );
}
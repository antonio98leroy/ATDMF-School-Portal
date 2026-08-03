import { Card, CardContent, Typography, Box } from "@mui/material";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";

export default function StatCard({
  title,
  value,
  icon,
  color = "#0B2A78",
  subtitle = "",
  loading = false,
}) {
  return (
    <Card
      elevation={2}
      sx={{
        borderRadius: 3,
        border: "1px solid #E5E7EB",
        height: "100%",
        transition: "0.25s",
        "&:hover": {
          transform: "translateY(-3px)",
          boxShadow: 6,
        },
      }}
    >
      <CardContent>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Box>
            <Typography
              variant="body2"
              color="text.secondary"
              gutterBottom
            >
              {title}
            </Typography>

            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                color,
              }}
            >
              {loading ? "--" : value}
            </Typography>

            {subtitle && (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mt: 1 }}
              >
                {subtitle}
              </Typography>
            )}
          </Box>

          <Box
            sx={{
              width: 60,
              height: 60,
              borderRadius: "50%",
              backgroundColor: `${color}15`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color,
            }}
          >
            {icon || <TrendingUpIcon fontSize="large" />}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
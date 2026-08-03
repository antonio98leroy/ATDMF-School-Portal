import { Login } from "@mui/icons-material";
import { AppBar, Box, Button, Toolbar, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";

export default function LandingPage() {
  const navigate = useNavigate();
  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#071B54", color: "white" }}>
      <AppBar position="absolute" elevation={0} sx={{ bgcolor: "rgba(7,27,84,.83)", backdropFilter: "blur(10px)" }}>
        <Toolbar sx={{ minHeight: { xs: 72, md: 88 } }}>
          <Box component="img" src="/atdmf-seal.jpeg" alt="ATDMF seal" sx={{ width: 58, height: 58, borderRadius: "50%", bgcolor: "white", mr: 1.5 }} />
          <Box sx={{ flexGrow: 1 }}>
            <Typography fontWeight={900}>Annie T. Doe Memorial Academy</Typography>
            <Typography variant="caption">Lower Buchanan, Grand Bassa County, Liberia</Typography>
          </Box>
          <Button variant="contained" startIcon={<Login />} onClick={() => navigate("/login")} sx={{ bgcolor: "#C8102E", fontWeight: 900 }}>Student Portal</Button>
        </Toolbar>
      </AppBar>
      <Box sx={{ minHeight: "100vh", display: "grid", gridTemplateColumns: { xs: "1fr", md: "1.1fr .9fr" } }}>
        <Box sx={{ minHeight: { xs: "58vh", md: "100vh" }, backgroundImage: "linear-gradient(90deg,rgba(7,27,84,.25),rgba(7,27,84,.75)),url('/atdmf-science.jpeg')", backgroundSize: "cover", backgroundPosition: "center", display: "flex", alignItems: "flex-end", p: { xs: 4, md: 8 }, pt: 14 }}>
          <Box sx={{ maxWidth: 800 }}>
            <Typography variant="overline" fontWeight={900} letterSpacing={3}>WELCOME TO ATDMA</Typography>
            <Typography sx={{ fontWeight: 950, lineHeight: 1.02, fontSize: { xs: "2.6rem", sm: "3.8rem", md: "5rem" } }}>Empowering Today’s Generation for a Better Tomorrow</Typography>
          </Box>
        </Box>
        <Box sx={{ minHeight: { xs: "42vh", md: "100vh" }, backgroundImage: "linear-gradient(rgba(7,27,84,.08),rgba(7,27,84,.38)),url('/atdmf-graduation.jpeg')", backgroundSize: "cover", backgroundPosition: "center" }} />
      </Box>
    </Box>
  );
}

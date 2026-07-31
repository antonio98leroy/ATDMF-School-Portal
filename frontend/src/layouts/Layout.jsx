import { useState } from "react";
import {
  AppBar,
  Avatar,
  Box,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Toolbar,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";

import {
  AccountCircle,
  Campaign,
  Dashboard,
  Groups,
  Logout,
  Menu as MenuIcon,
  MenuBook,
  Payments,
  School,
  Settings,
} from "@mui/icons-material";

import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const drawerWidth = 260;

const navigationItems = [
  {
    label: "Dashboard",
    path: "/",
    icon: <Dashboard />,
  },
  {
    label: "Students",
    path: "/students",
    icon: <School />,
  },
  {
    label: "Staff",
    path: "/staff",
    icon: <Groups />,
  },
  {
    label: "Academics",
    path: "/academics",
    icon: <MenuBook />,
  },
  {
    label: "Finance",
    path: "/finance",
    icon: <Payments />,
  },
  {
    label: "Notices",
    path: "/notices",
    icon: <Campaign />,
  },
];

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));

  const { user, logout } = useAuth();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileMenu, setProfileMenu] = useState(null);

  const handleNavigate = (path) => {
    navigate(path);
    setMobileOpen(false);
  };

  const handleLogout = () => {
    setProfileMenu(null);
    logout();
    navigate("/login");
  };

  const drawerContent = (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Box
        sx={{
          px: 2,
          py: 2.5,
          textAlign: "center",
        }}
      >
        <Box
          component="img"
          src="/atdmf-logo.jpeg"
          alt="ATDMF logo"
          sx={{
            width: 85,
            height: 85,
            objectFit: "contain",
          }}
        />

        <Typography
          variant="h6"
          sx={{
            color: "#0B2A78",
            fontWeight: 800,
            mt: 1,
          }}
        >
          ATDMF-SMIS
        </Typography>

        <Typography
          variant="caption"
          sx={{
            color: "#C8102E",
            fontWeight: 700,
          }}
        >
          School Management Portal
        </Typography>
      </Box>

      <Divider />

      <List sx={{ px: 1.5, py: 2 }}>
        {navigationItems.map((item) => {
          const selected =
            item.path === "/"
              ? location.pathname === "/"
              : location.pathname.startsWith(item.path);

          return (
            <ListItemButton
              key={item.path}
              selected={selected}
              onClick={() => handleNavigate(item.path)}
              sx={{
                borderRadius: 2,
                mb: 0.6,
                "&.Mui-selected": {
                  bgcolor: "#0B2A78",
                  color: "white",
                },
                "&.Mui-selected:hover": {
                  bgcolor: "#071B54",
                },
                "&.Mui-selected .MuiListItemIcon-root": {
                  color: "white",
                },
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 42,
                  color: selected ? "white" : "#0B2A78",
                }}
              >
                {item.icon}
              </ListItemIcon>

              <ListItemText
                primary={item.label}
                primaryTypographyProps={{
                  fontWeight: selected ? 700 : 500,
                }}
              />
            </ListItemButton>
          );
        })}
      </List>

      <Box sx={{ mt: "auto", p: 1.5 }}>
        <Divider sx={{ mb: 1.5 }} />

        <ListItemButton
          onClick={() => handleNavigate("/settings")}
          sx={{ borderRadius: 2 }}
        >
          <ListItemIcon sx={{ minWidth: 42 }}>
            <Settings />
          </ListItemIcon>
          <ListItemText primary="Settings" />
        </ListItemButton>

        <ListItemButton
          onClick={handleLogout}
          sx={{
            borderRadius: 2,
            color: "#C8102E",
          }}
        >
          <ListItemIcon
            sx={{
              minWidth: 42,
              color: "#C8102E",
            }}
          >
            <Logout />
          </ListItemIcon>

          <ListItemText primary="Logout" />
        </ListItemButton>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          bgcolor: "white",
          color: "text.primary",
          borderBottom: "1px solid #E5E7EB",
          width: {
            md: `calc(100% - ${drawerWidth}px)`,
          },
          ml: {
            md: `${drawerWidth}px`,
          },
        }}
      >
        <Toolbar>
          {!isDesktop && (
            <IconButton
              edge="start"
              onClick={() => setMobileOpen(true)}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
          )}

          <Box sx={{ flexGrow: 1 }}>
            <Typography
              variant="subtitle1"
              sx={{
                fontWeight: 800,
                color: "#0B2A78",
              }}
            >
              Annie T. Doe Memorial Foundation High School
            </Typography>

            <Typography
              variant="caption"
              color="text.secondary"
            >
              School Management Information System
            </Typography>
          </Box>

          <Tooltip title="Account menu">
            <IconButton
              onClick={(event) =>
                setProfileMenu(event.currentTarget)
              }
            >
              <Avatar
                sx={{
                  bgcolor: "#C8102E",
                  width: 40,
                  height: 40,
                }}
              >
                {user?.first_name?.[0] ||
                  user?.username?.[0] ||
                  "U"}
              </Avatar>
            </IconButton>
          </Tooltip>

          <Menu
            anchorEl={profileMenu}
            open={Boolean(profileMenu)}
            onClose={() => setProfileMenu(null)}
          >
            <MenuItem disabled>
              <Box>
                <Typography fontWeight={700}>
                  {user?.full_name ||
                    user?.username ||
                    "Portal User"}
                </Typography>

                <Typography
                  variant="caption"
                  color="text.secondary"
                >
                  {user?.role_display ||
                    user?.role ||
                    "User"}
                </Typography>
              </Box>
            </MenuItem>

            <Divider />

            <MenuItem
              onClick={() => {
                setProfileMenu(null);
                navigate("/profile");
              }}
            >
              <AccountCircle sx={{ mr: 1.5 }} />
              My Profile
            </MenuItem>

            <MenuItem onClick={handleLogout}>
              <Logout sx={{ mr: 1.5 }} />
              Logout
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Box
        component="nav"
        sx={{
          width: {
            md: drawerWidth,
          },
          flexShrink: {
            md: 0,
          },
        }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: {
              xs: "block",
              md: "none",
            },
            "& .MuiDrawer-paper": {
              width: drawerWidth,
            },
          }}
        >
          {drawerContent}
        </Drawer>

        <Drawer
          variant="permanent"
          sx={{
            display: {
              xs: "none",
              md: "block",
            },
            "& .MuiDrawer-paper": {
              width: drawerWidth,
              boxSizing: "border-box",
              borderRight: "1px solid #E5E7EB",
            },
          }}
          open
        >
          {drawerContent}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: {
            md: `calc(100% - ${drawerWidth}px)`,
          },
          bgcolor: "#F5F7FB",
          minHeight: "100vh",
          px: {
            xs: 2,
            sm: 3,
          },
          py: 3,
          mt: 8,
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
}

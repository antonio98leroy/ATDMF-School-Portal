import {
  IconButton,
  InputAdornment,
  TextField,
  Tooltip,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";

export default function SearchBar({
  value = "",
  onChange,
  onClear,
  placeholder = "Search...",
  label = "",
  fullWidth = true,
  disabled = false,
  size = "small",
}) {
  const handleChange = (event) => {
    onChange?.(event.target.value);
  };

  const handleClear = () => {
    onClear?.();

    if (!onClear) {
      onChange?.("");
    }
  };

  return (
    <TextField
      value={value}
      onChange={handleChange}
      label={label || undefined}
      placeholder={placeholder}
      fullWidth={fullWidth}
      disabled={disabled}
      size={size}
      type="search"
      slotProps={{
        htmlInput: {
          "aria-label": label || placeholder,
        },
        input: {
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon color="action" />
            </InputAdornment>
          ),
          endAdornment: value ? (
            <InputAdornment position="end">
              <Tooltip title="Clear search">
                <IconButton
                  type="button"
                  size="small"
                  onClick={handleClear}
                  edge="end"
                  aria-label="Clear search"
                >
                  <ClearIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </InputAdornment>
          ) : null,
        },
      }}
      sx={{
  "& input[type='search']::-webkit-search-cancel-button": {
    display: "none",
  },
  "& .MuiOutlinedInput-root": {
    borderRadius: 2,
    bgcolor: "#FFFFFF",
    "&:hover .MuiOutlinedInput-notchedOutline": {
      borderColor: "#0B2A78",
    },
    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
      borderColor: "#0B2A78",
          },
        },
      }}
    />
  );
}
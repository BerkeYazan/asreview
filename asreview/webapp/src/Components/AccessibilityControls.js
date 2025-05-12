import React, { useEffect } from "react";
import {
  IconButton,
  Tooltip,
  Popover,
  Box,
  Stack,
  Slider,
  Typography,
} from "@mui/material";
import { FormatSize, Fullscreen, FullscreenExit } from "@mui/icons-material";
import {
  useReviewSettings,
  useReviewSettingsDispatch,
} from "context/ReviewSettingsContext";
import { fontSizeOptions } from "globals.js";

export const FocusModeToggle = () => {
  const { focusMode } = useReviewSettings();
  const dispatchReviewSettings = useReviewSettingsDispatch();

  const toggleFocusMode = () => {
    dispatchReviewSettings({
      type: "focusMode",
      focusMode: !focusMode,
    });
  };

  useEffect(() => {
    const manageFullscreen = async () => {
      if (
        typeof window === "undefined" ||
        typeof document === "undefined" ||
        !document.documentElement
      ) {
        return;
      }

      if (focusMode) {
        if (
          document.documentElement.requestFullscreen &&
          !document.fullscreenElement
        ) {
          try {
            await document.documentElement.requestFullscreen();
          } catch (err) {
            console.error(
              `Error attempting to enable full-screen mode: ${err.message} (${err.name})`,
            );
          }
        }
      } else {
        if (document.exitFullscreen && document.fullscreenElement) {
          try {
            await document.exitFullscreen();
          } catch (err) {
            console.error(
              `Error attempting to disable full-screen mode: ${err.message} (${err.name})`,
            );
          }
        }
      }
    };

    manageFullscreen();
  }, [focusMode]);

  return (
    <Tooltip
      title={
        focusMode
          ? "Exit focus mode & fullscreen"
          : "Enter focus mode & fullscreen"
      }
    >
      <IconButton
        onClick={toggleFocusMode}
        size="small"
        aria-label={
          focusMode
            ? "Exit focus mode and fullscreen"
            : "Enter focus mode and fullscreen"
        }
      >
        {focusMode ? (
          <FullscreenExit fontSize="small" sx={{ color: "text.secondary" }} />
        ) : (
          <Fullscreen fontSize="small" sx={{ color: "text.secondary" }} />
        )}
      </IconButton>
    </Tooltip>
  );
};

export const FontSizeAdjuster = () => {
  const [anchorEl, setAnchorEl] = React.useState(null);
  const { fontSize } = useReviewSettings();
  const dispatchReviewSettings = useReviewSettingsDispatch();

  const handlePopoverOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handlePopoverClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);

  return (
    <>
      <Tooltip title="Adjust font size">
        <IconButton onClick={handlePopoverOpen} size="small">
          <FormatSize fontSize="small" sx={{ color: "text.secondary" }} />
        </IconButton>
      </Tooltip>
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handlePopoverClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "center",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "center",
        }}
      >
        <Box sx={{ p: 2, minWidth: 200 }}>
          <Typography align="center" gutterBottom>
            {fontSizeOptions[fontSize].charAt(0).toUpperCase() +
              fontSizeOptions[fontSize].slice(1)}
          </Typography>
          <Stack direction="row" spacing={2} alignItems="center">
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              A
            </Typography>
            <Slider
              value={fontSize}
              marks={true}
              step={1}
              min={0}
              max={3}
              onChange={(event) => {
                dispatchReviewSettings({
                  type: "fontSize",
                  fontSize: event.target.value,
                });
              }}
              aria-labelledby="font-size-slider"
            />
            <Typography variant="h6" sx={{ color: "text.secondary" }}>
              A
            </Typography>
          </Stack>
        </Box>
      </Popover>
    </>
  );
};

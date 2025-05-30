import React from "react";
import { Box, Stack, IconButton, Tooltip, useMediaQuery } from "@mui/material";
import {
  ChevronLeft,
  ChevronRight,
  ScreenRotationAlt as ScreenRotationAltIcon,
} from "@mui/icons-material";

import {
  FocusModeToggle,
  FontSizeAdjuster,
} from "Components/AccessibilityControls";
import ElasPuzzleIcon from "../../icons/ElasPuzzleIcon";

const AccessibilityControlsBar = ({
  orientation,
  dispatchReviewSettings,
  onToggleElasGame,
}) => {
  const [controlsVisible, setControlsVisible] = React.useState(false);
  const isMobile = useMediaQuery((theme) => theme.breakpoints.down("md"));

  return (
    <Box display="flex" alignItems="center">
      <IconButton
        onClick={() => setControlsVisible(!controlsVisible)}
        size="small"
        sx={{ ml: 1 }}
        aria-label={`${controlsVisible ? "Hide" : "Show"} review controls`}
      >
        {controlsVisible ? (
          <ChevronRight fontSize="small" sx={{ color: "text.secondary" }} />
        ) : (
          <ChevronLeft fontSize="small" sx={{ color: "text.secondary" }} />
        )}
      </IconButton>
      {controlsVisible && (
        <Stack direction="row" spacing={0.5}>
          <Tooltip
            title={
              orientation === "portrait"
                ? "Switch to landscape view"
                : "Switch to portrait view"
            }
          >
            <IconButton
              onClick={() => {
                dispatchReviewSettings({
                  type: "orientation",
                  orientation:
                    orientation === "portrait" ? "landscape" : "portrait",
                });
              }}
              size="small"
              aria-label={
                orientation === "portrait"
                  ? "Switch to landscape view"
                  : "Switch to portrait view"
              }
              sx={{ display: isMobile ? "none" : "inline-flex" }}
            >
              <ScreenRotationAltIcon
                fontSize="medium"
                sx={{ color: "text.secondary" }}
              />
            </IconButton>
          </Tooltip>
          <Box sx={{ display: isMobile ? "none" : "block" }}>
            <FocusModeToggle />
          </Box>
          <FontSizeAdjuster />
          <Tooltip title="Go on adventure with Elas">
            <IconButton
              onClick={onToggleElasGame}
              size="small"
              aria-label="Open Elas game"
            >
              <ElasPuzzleIcon
                fontSize="medium"
                sx={{ color: "text.secondary" }}
              />
            </IconButton>
          </Tooltip>
        </Stack>
      )}
    </Box>
  );
};

export default AccessibilityControlsBar;

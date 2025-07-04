import React, { useContext } from "react";
import { useQuery, useQueryClient } from "react-query";

import LibraryAddOutlinedIcon from "@mui/icons-material/LibraryAddOutlined";
import NotInterestedOutlinedIcon from "@mui/icons-material/NotInterestedOutlined";
import SearchIcon from "@mui/icons-material/Search";
import TuneIcon from "@mui/icons-material/Tune";
import {
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  IconButton,
  Popover,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";
import Grid from "@mui/material/Grid2";
import { LabelHistoryPrior } from "ProjectComponents/HistoryComponents";
import { StyledLightBulb } from "StyledComponents/StyledLightBulb";
import { ProjectAPI } from "api";
import { ProjectContext } from "context/ProjectContext";
import { projectModes } from "globals.js";
import { useToggle } from "hooks/useToggle";
import { AddPriorKnowledge } from "./SearchComponents";

const InfoPopover = ({ anchorEl, handlePopoverClose }) => {
  return (
    <Popover
      open={Boolean(anchorEl)}
      anchorEl={anchorEl}
      onClose={handlePopoverClose}
      anchorOrigin={{
        vertical: "bottom",
        horizontal: "right",
      }}
      transformOrigin={{
        vertical: "top",
        horizontal: "right",
      }}
      PaperProps={{
        sx: {
          borderRadius: 3,
          maxWidth: 350,
        },
      }}
    >
      <Box
        sx={(theme) => ({
          p: 3,
          maxHeight: "80vh",
          overflow: "auto",
          "&::-webkit-scrollbar": {
            width: "8px",
            background: "transparent",
          },
          "&::-webkit-scrollbar-thumb": {
            background: (theme) => theme.palette.grey[300],
            borderRadius: "4px",
            "&:hover": {
              background: (theme) => theme.palette.grey[400],
            },
          },
          "&::-webkit-scrollbar-track": {
            background: "transparent",
            borderRadius: "4px",
          },
          scrollbarWidth: "thin",
          scrollbarColor: (theme) => `${theme.palette.grey[300]} transparent`,
        })}
      >
        <Stack spacing={3}>
          <Box>
            <Typography variant="h6" sx={{ mb: 1 }}>
              Adding Prior Knowledge
            </Typography>
            <Typography variant="body2" align="justify">
              Prior knowledge is the labeling decisions made before ASReview, or
              manually added here. It helps the AI understand your research
              criteria from the start, making the learning process more
              efficient.
            </Typography>
          </Box>

          <Divider />

          <Box>
            <Grid container spacing={2}>
              <Grid xs={6}>
                <Box
                  sx={(theme) => ({
                    p: 2,
                    border: 1,
                    borderColor: "divider",
                    borderRadius: 2,
                    height: "100%",
                    bgcolor:
                      theme.palette.mode === "light"
                        ? "background.paper"
                        : "transparent",
                  })}
                >
                  <Stack spacing={1}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <SearchIcon sx={{ color: "text.secondary" }} />
                      <Typography variant="subtitle2">
                        Add prior knowledge
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      Search for known records and label them to kickstart the
                      AI learning process
                    </Typography>
                  </Stack>
                </Box>
              </Grid>
              <Grid xs={6}>
                <Box
                  sx={(theme) => ({
                    p: 2,
                    border: 1,
                    borderColor: "divider",
                    borderRadius: 2,
                    height: "100%",
                    bgcolor:
                      theme.palette.mode === "light"
                        ? "background.paper"
                        : "transparent",
                  })}
                >
                  <Stack spacing={1}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <LibraryAddOutlinedIcon
                        sx={{ color: "text.secondary" }}
                      />
                      <Typography variant="subtitle2">
                        Label as relevant
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      Mark papers as relevant that match your research criteria
                    </Typography>
                  </Stack>
                </Box>
              </Grid>
              <Grid xs={6}>
                <Box
                  sx={(theme) => ({
                    p: 2,
                    border: 1,
                    borderColor: "divider",
                    borderRadius: 2,
                    height: "100%",
                    bgcolor:
                      theme.palette.mode === "light"
                        ? "background.paper"
                        : "transparent",
                  })}
                >
                  <Stack spacing={1}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <NotInterestedOutlinedIcon
                        sx={{ color: "text.secondary" }}
                      />
                      <Typography variant="subtitle2">
                        Label as not relevant
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      Mark papers as not relevant to refine the AI's
                      understanding
                    </Typography>
                  </Stack>
                </Box>
              </Grid>
            </Grid>
          </Box>

          <Box>
            <Button
              href="https://asreview.readthedocs.io/en/stable/lab/project_create.html#prior-knowledge"
              target="_blank"
              rel="noopener noreferrer"
            >
              Learn more
            </Button>
          </Box>
        </Stack>
      </Box>
    </Popover>
  );
};

const PriorCardHeader = ({
  isLoading,
  isConfiguring,
  setIsConfiguring,
  handlePopoverOpen,
  getPriorStatusText,
}) => {
  return (
    <CardContent sx={{ py: 2 }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 0.5,
            flex: 1,
          }}
        >
          <Typography variant="h6" fontWeight="medium">
            Prior Knowledge
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {isLoading ? (
              <Skeleton width={120} height={20} />
            ) : (
              getPriorStatusText()
            )}
          </Typography>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <IconButton
            size="small"
            onClick={() => setIsConfiguring(!isConfiguring)}
            sx={{ color: "text.secondary" }}
          >
            <TuneIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" onClick={handlePopoverOpen}>
            <StyledLightBulb fontSize="small" />
          </IconButton>
        </Box>
      </Box>
    </CardContent>
  );
};

const PriorCard = ({ mode = projectModes.ORACLE, editable = true }) => {
  const project_id = useContext(ProjectContext);
  const queryClient = useQueryClient();

  const [isConfiguring, setIsConfiguring] = React.useState(false);
  const [openPriorSearch, setOpenPriorSearch] = React.useState(false);
  const [openPriorView, toggleOpenPriorView] = useToggle(false);
  // const [priorType, setPriorType] = React.useState("records");
  const priorType = "records";

  const { data, isLoading } = useQuery(
    ["fetchLabeledStats", { project_id: project_id }],
    ProjectAPI.fetchLabeledStats,
    {
      refetchOnWindowFocus: false,
    },
  );

  const onClosePriorSearch = () => {
    queryClient.resetQueries("fetchLabeledStats");
    setOpenPriorSearch(false);
  };

  const [anchorEl, setAnchorEl] = React.useState(null);

  const handlePopoverOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handlePopoverClose = () => {
    setAnchorEl(null);
  };

  const getPriorStatusText = () => {
    if (isLoading) return "Loading...";
    if (!data) return "None";

    const total = data.n_prior || 0;
    if (total === 0) return "None";

    const inclusions = data.n_prior_inclusions || 0;
    const exclusions = data.n_prior_exclusions || 0;

    if (inclusions > 0 && exclusions > 0) {
      return `${inclusions} relevant, ${exclusions} not relevant`;
    } else if (inclusions > 0) {
      return `${inclusions} relevant record${inclusions > 1 ? "s" : ""}`;
    } else if (exclusions > 0) {
      return `${exclusions} not relevant record${exclusions > 1 ? "s" : ""}`;
    }
    return "None";
  };

  return (
    <Card sx={{ position: "relative" }}>
      <PriorCardHeader
        isLoading={isLoading}
        isConfiguring={isConfiguring}
        setIsConfiguring={setIsConfiguring}
        handlePopoverOpen={handlePopoverOpen}
        getPriorStatusText={getPriorStatusText}
      />

      {isConfiguring && (
        <>
          {priorType === "records" && (
            <>
              <CardContent>
                {isLoading ? (
                  <Skeleton variant="rectangular" height={56} />
                ) : (
                  <>
                    <Button
                      id={"add-prior-search"}
                      onClick={() => setOpenPriorSearch(true)}
                      variant="contained"
                      disabled={!editable}
                      sx={{ mr: 2 }}
                    >
                      Add prior knowledge
                    </Button>

                    <Button
                      id={"add-prior-view"}
                      onClick={toggleOpenPriorView}
                      disabled={
                        data?.n_prior_inclusions === 0 &&
                        data?.n_prior_exclusions === 0
                      }
                    >
                      {openPriorView
                        ? "Hide records"
                        : "Show records (" + data?.n_prior + ")"}
                    </Button>
                  </>
                )}
              </CardContent>
            </>
          )}
          {priorType === "records" && openPriorView && (
            <>
              <Divider />
              <CardContent>
                <LabelHistoryPrior
                  project_id={project_id}
                  mode={mode}
                  n_prior_inclusions={data && data?.n_prior_inclusions}
                  n_prior_exclusions={data && data?.n_prior_exclusions}
                />
              </CardContent>
            </>
          )}
        </>
      )}

      <AddPriorKnowledge open={openPriorSearch} onClose={onClosePriorSearch} />

      <InfoPopover
        anchorEl={anchorEl}
        handlePopoverClose={handlePopoverClose}
      />
    </Card>
  );
};

export default PriorCard;

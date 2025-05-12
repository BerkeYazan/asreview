import React from "react";
import {
  Alert,
  Box,
  Skeleton,
  Stack,
  Typography,
  IconButton,
  Popover,
  Divider,
  Button,
  Tooltip,
} from "@mui/material";

import { ModelTraining } from "@mui/icons-material";
import { StyledLightBulb } from "StyledComponents/StyledLightBulb";

import {
  ChevronLeft,
  ChevronRight,
  ScreenRotationAlt as ScreenRotationAltIcon,
} from "@mui/icons-material";
import { useMediaQuery } from "@mui/material";
import { ProjectAPI } from "api";
import { useQuery } from "react-query";
import {
  useReviewSettings,
  useReviewSettingsDispatch,
} from "context/ReviewSettingsContext";
import {
  FocusModeToggle,
  FontSizeAdjuster,
} from "Components/AccessibilityControls";
import { ElasIcon } from "icons";

const FlowChartStep = ({
  stepNumber,
  staticTitle,
  staticExplanation,
  currentValue,
}) => {
  return (
    <Stack
      direction="column"
      alignItems="flex-start"
      spacing={1}
      sx={{ width: "100%", py: 1.25 }}
    >
      <Stack
        direction="row"
        alignItems="center"
        spacing={1.5}
        sx={{ width: "100%" }}
      >
        <Box
          sx={{
            minWidth: "24px",
            height: "24px",
            borderRadius: "50%",
            bgcolor: "primary.main",
            color: "primary.contrastText",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: "bold",
            fontSize: "0.8rem",
          }}
        >
          {stepNumber}
        </Box>
        <Typography
          variant="subtitle1"
          component="h3"
          sx={{ fontWeight: "bold", lineHeight: 1.3, flexGrow: 1 }}
        >
          {staticTitle}:
        </Typography>
        <Box
          sx={(theme) => ({
            bgcolor: theme.palette.secondary.main,
            color: theme.palette.secondary.contrastText,
            borderRadius: theme.shape.borderRadius,
            p: "6px 10px",
            minWidth: "70px",
            display: "inline-block",
            textAlign: "center",
            boxShadow: theme.shadows[1],
            lineHeight: 1.3,
            marginLeft: "auto",
          })}
        >
          <Typography variant="body2" component="p" sx={{ fontWeight: "bold" }}>
            {currentValue}
          </Typography>
        </Box>
      </Stack>
      <Typography
        variant="body2"
        sx={{ color: "text.primary", lineHeight: 1.3 }}
      >
        {staticExplanation}
      </Typography>
    </Stack>
  );
};

const ModelFlowChart = ({ record }) => {
  const { data, isLoading } = useQuery(
    ["fetchLearners"],
    ProjectAPI.fetchLearners,
    {
      refetchOnWindowFocus: false,
    },
  );

  const trainingSetValue = record.state.training_set;
  const displayTrainingSet =
    trainingSetValue > 0 ? (
      trainingSetValue
    ) : (
      <Typography component="span" sx={{ fontWeight: "bold" }}>
        0
      </Typography>
    );

  const featureExtractionName = data?.models?.feature_extractor.find(
    (fe) => fe.name === record.state.feature_extractor,
  )?.label;
  const displayFeatureExtraction = featureExtractionName || (
    <Typography
      component="span"
      sx={{ fontStyle: "italic", fontSize: "0.9rem" }}
    >
      N/A
    </Typography>
  );

  const classifierName = data?.models?.classifier.find(
    (c) => c.name === record.state.classifier,
  )?.label;
  const displayClassifier = classifierName || (
    <Typography
      component="span"
      sx={{ fontStyle: "italic", fontSize: "0.9rem" }}
    >
      N/A
    </Typography>
  );

  const queryStrategyName = data?.models?.querier.find(
    (q) => q.name === record.state.querier,
  )?.label;
  const displayQueryStrategy = queryStrategyName || (
    <Typography
      component="span"
      sx={{ fontStyle: "italic", fontSize: "0.9rem" }}
    >
      N/A
    </Typography>
  );

  const stepsData = [
    {
      stepNumber: 1,
      staticTitle: "Your Labeling Decisions",
      staticExplanation:
        "Your relevant/not relevant labeling decisions provide essential training data, continuously refining the AI's understanding of your criteria",
      currentValue: isLoading ? (
        <Skeleton width={30} height={20} sx={{ mx: "auto" }} />
      ) : (
        displayTrainingSet
      ),
    },
    {
      stepNumber: 2,
      staticTitle: "Current Feature Extractor",
      staticExplanation:
        "Processes text from labeled records, transforming it into a structured numerical format for AI analysis and learning",
      currentValue: isLoading ? (
        <Skeleton width={80} height={20} sx={{ mx: "auto" }} />
      ) : (
        displayFeatureExtraction
      ),
    },
    {
      stepNumber: 3,
      staticTitle: "Current Classifier",
      staticExplanation:
        "Trains on numerical features and your decisions to build a model that predicts relevance for unlabeled records",
      currentValue: isLoading ? (
        <Skeleton width={80} height={20} sx={{ mx: "auto" }} />
      ) : (
        displayClassifier
      ),
    },
    {
      stepNumber: 4,
      staticTitle: "Current Querier",
      staticExplanation:
        "Intelligently prioritizes unlabeled records for review using classifier predictions, or random/top-down ordering, to select the most informative items",
      currentValue: isLoading ? (
        <Skeleton width={80} height={20} sx={{ mx: "auto" }} />
      ) : (
        displayQueryStrategy
      ),
    },
  ];

  return (
    <Stack
      direction="column"
      spacing={0}
      alignItems={"stretch"}
      justifyContent="flex-start"
      sx={{ width: "100%" }}
    >
      {stepsData.map((step, index) => (
        <React.Fragment key={step.stepNumber}>
          <FlowChartStep {...step} />
          {index < stepsData.length - 1 && <Divider sx={{ my: 1.5 }} />}
        </React.Fragment>
      ))}
    </Stack>
  );
};

const RecordCardModelTraining = ({
  record,
  sx,
  onToggleElasGame,
  showControls,
}) => {
  const [anchorEl, setAnchorEl] = React.useState(null);
  const [popoverAnchorEl, setPopoverAnchorEl] = React.useState(null);
  const [controlsVisible, setControlsVisible] = React.useState(false);

  const handlePopoverOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handlePopoverClose = () => {
    setAnchorEl(null);
  };

  const handleFlowchartPopoverOpen = (event) => {
    setPopoverAnchorEl(event.currentTarget);
  };

  const handleFlowchartPopoverClose = () => {
    setPopoverAnchorEl(null);
  };

  const openPopover = Boolean(anchorEl);
  const openFlowchartPopover = Boolean(popoverAnchorEl);

  const { orientation } = useReviewSettings();
  const dispatchReviewSettings = useReviewSettingsDispatch();

  const isMobile = useMediaQuery((theme) => theme.breakpoints.down("md"));

  if (record?.error?.type !== undefined) {
    return (
      <Alert severity="error" sx={sx} icon={<ModelTraining />}>
        Model training error: {record?.error?.message}. Change model on the
        Customize tab.
      </Alert>
    );
  }
  const getAlertMessage = () => {
    if (record?.state?.querier === "top_down") {
      return record?.state?.label === 1 || record?.state?.label === 0
        ? "This record was presented in a top-down manner"
        : "This record is presented in a top-down manner";
    } else if (record?.state?.querier === "random") {
      return record?.state?.label === 1 || record?.state?.label === 0
        ? "This record was presented in a random manner"
        : "This record is presented in a random manner";
    } else if (record?.state?.querier === null) {
      return "This record was labeled either through manual search or the label was already available in the dataset";
    }
    return null;
  };

  const alertMessage = getAlertMessage();

  const renderControls = record?.state?.querier && showControls;

  return (
    <Stack spacing={1} sx={sx}>
      {alertMessage && (
        <>
          <Alert
            severity="warning"
            icon={<ModelTraining />}
            sx={{ mb: 0 }}
            action={
              renderControls && (
                <IconButton size="small" onClick={handlePopoverOpen}>
                  <StyledLightBulb fontSize="small" />
                </IconButton>
              )
            }
          >
            {alertMessage}
          </Alert>
          <Popover
            open={openPopover}
            anchorEl={anchorEl}
            onClose={handlePopoverClose}
            slotProps={{
              paper: {
                sx: (theme) => ({
                  borderRadius: 3,
                  maxWidth: 400,
                  boxShadow: theme.shadows[8],
                }),
              },
            }}
          >
            <Box sx={{ p: 2.5 }}>
              <Stack spacing={2}>
                <Typography variant="subtitle1" fontWeight="bold">
                  Model Training Indicators
                </Typography>
                <Divider />
                <Box>
                  <Alert
                    severity="warning"
                    icon={<ModelTraining />}
                    sx={{ mb: 1.5 }}
                  >
                    Record presented in a random manner
                  </Alert>
                  <Typography
                    variant="body2"
                    sx={{
                      textAlign: "justify",
                      mb: 2,
                      color: "text.secondary",
                    }}
                  >
                    This occurs regularly during the initial model training
                    phase as the model learns, or when this query strategy has
                    been explicitly chosen in <b>Customize</b>
                  </Typography>
                </Box>
                <Box>
                  <Alert
                    severity="warning"
                    icon={<ModelTraining />}
                    sx={{ mb: 1.5 }}
                  >
                    Record presented in a top-down manner
                  </Alert>
                  <Typography
                    variant="body2"
                    sx={{
                      textAlign: "justify",
                      mb: 2,
                      color: "text.secondary",
                    }}
                  >
                    This occurs only when this query strategy has been
                    explicitly chosen in <b>Customize</b>
                  </Typography>
                </Box>
                <Box>
                  <Alert
                    severity="warning"
                    icon={<ModelTraining />}
                    sx={{ mb: 1.5 }}
                  >
                    Record was labeled either through manual search or the label
                    was already available in the dataset
                  </Alert>
                  <Typography
                    variant="body2"
                    sx={{ textAlign: "justify", color: "text.secondary" }}
                  >
                    This occurs if you labeled the record yourself using the
                    <b> Prior Knowledge</b> feature, or if its label was already
                    present in the dataset when it was imported
                  </Typography>
                </Box>
                <Box
                  sx={{ display: "flex", justifyContent: "flex-start", pt: 1 }}
                >
                  <Button
                    href="https://asreview.readthedocs.io/en/latest/guides/activelearning.html"
                    target="_blank"
                    rel="noopener noreferrer"
                    size="small"
                  >
                    Learn more
                  </Button>
                </Box>
              </Stack>
            </Box>
          </Popover>
        </>
      )}

      {renderControls && (
        <Box display="flex" justifyContent="flex-end" alignItems="center">
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
                    fontSize="small"
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
                  <ElasIcon fontSize="small" sx={{ color: "text.secondary" }} />
                </IconButton>
              </Tooltip>
            </Stack>
          )}
          <Tooltip title="Show Model Info">
            <IconButton
              onClick={handleFlowchartPopoverOpen}
              size="small"
              aria-label="Show model information flowchart"
              sx={{ ml: 0.5 }}
            >
              <StyledLightBulb
                fontSize="small"
                sx={{ color: "text.secondary" }}
              />
            </IconButton>
          </Tooltip>
          <Popover
            open={openFlowchartPopover}
            anchorEl={popoverAnchorEl}
            onClose={handleFlowchartPopoverClose}
            anchorOrigin={{
              vertical: "bottom",
              horizontal: "center",
            }}
            transformOrigin={{
              vertical: "top",
              horizontal: "center",
            }}
            slotProps={{
              paper: {
                sx: (theme) => ({
                  borderRadius: 3,
                  boxShadow: theme.shadows[8],
                  maxWidth: "420px",
                  width: "calc(100% - 24px)",
                  margin: "0 12px",
                }),
              },
            }}
          >
            <Box sx={{ p: 2.5 }}>
              <Stack spacing={2}>
                <Typography
                  variant="h6"
                  gutterBottom
                  sx={{ textAlign: "center", fontWeight: "bold" }}
                >
                  Your Model Training Process
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ textAlign: "center", mb: 1, color: "text.primary" }}
                >
                  ASReview employs an active learning cycle that learns from
                  your decisions to help you find relevant records more
                  efficiently.
                </Typography>
                <ModelFlowChart record={record} />
                <Button
                  href="https://asreview.readthedocs.io/en/latest/guides/activelearning.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  size="small"
                  sx={{ mt: 1, alignSelf: "flex-start" }}
                >
                  Learn more
                </Button>
              </Stack>
            </Box>
          </Popover>
        </Box>
      )}
    </Stack>
  );
};

export default RecordCardModelTraining;

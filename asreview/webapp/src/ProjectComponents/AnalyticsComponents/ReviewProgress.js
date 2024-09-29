import React, { useMemo, useState } from "react";
import Chart from "react-apexcharts";
import {
  Card,
  CardContent,
  Typography,
  Box,
  Skeleton,
  IconButton,
  Switch,
  FormControlLabel,
  Grid,
  Stack,
  Popover,
} from "@mui/material";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import { useTheme } from "@mui/material/styles";
import { CardErrorHandler } from "Components";

const StatItem = ({ label, value, color, loading }) => (
  <Box
    sx={{
      backgroundColor: "background.paper",
      p: 1.5,
      borderRadius: 4,
      boxShadow: 3,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      width: "100%",
      mb: { xs: 1, sm: 2 },
    }}
  >
    {loading ? (
      <Skeleton width="40%" />
    ) : (
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
    )}
    {loading ? (
      <Skeleton width="20%" />
    ) : (
      <Typography variant="h6" color={color} fontWeight="bold">
        {value.toLocaleString()}
      </Typography>
    )}
  </Box>
);

export default function ReviewProgress({ progressQuery }) {
  const theme = useTheme();
  const loading = progressQuery.isLoading;

  //Prior knowledge switch state and the relevant statistics that depend on it
  const [includePriorKnowledge, setIncludePriorKnowledge] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);

  const {
    n_papers = 0,
    n_included = 0,
    n_excluded = 0,
    n_included_no_priors = 0,
    n_excluded_no_priors = 0,
  } = progressQuery.data || {};

  const donutSeries = useMemo(() => {
    const relevant = includePriorKnowledge ? n_included : n_included_no_priors;
    const irrelevant = includePriorKnowledge
      ? n_excluded
      : n_excluded_no_priors;
    const unlabeled = n_papers - relevant - irrelevant;
    return [relevant, irrelevant, unlabeled];
  }, [
    includePriorKnowledge,
    n_included,
    n_excluded,
    n_included_no_priors,
    n_excluded_no_priors,
    n_papers,
  ]);

  const relevantPercentage = useMemo(() => {
    const totalRelevantIrrelevant = includePriorKnowledge
      ? n_included + n_excluded
      : n_included_no_priors + n_excluded_no_priors;
    return n_papers > 0
      ? Math.round((totalRelevantIrrelevant / n_papers) * 100)
      : 0;
  }, [
    includePriorKnowledge,
    n_included,
    n_excluded,
    n_included_no_priors,
    n_excluded_no_priors,
    n_papers,
  ]);

  const options = useMemo(
    () => ({
      chart: {
        animations: { enabled: false },
        background: "transparent",
        type: "donut",
      },
      plotOptions: {
        pie: {
          donut: {
            size: "10%",
            labels: {
              show: false,
              total: {
                show: false,
                formatter: () => `${relevantPercentage}%`,
                style: {
                  fontSize: "28px",
                  fontWeight: "bold",
                  color: theme.palette.text.primary,
                  textAlign: "center",
                },
              },
            },
          },
        },
      },
      labels: ["Relevant", "Irrelevant", "Unlabeled"],
      colors: [
        theme.palette.mode === "light"
          ? theme.palette.primary.light
          : theme.palette.primary.main, // Relevant
        theme.palette.mode === "light"
          ? theme.palette.grey[600]
          : theme.palette.grey[600], // Irrelevant
        theme.palette.mode === "light"
          ? theme.palette.grey[400]
          : theme.palette.grey[400], // Unlabeled
      ],
      stroke: { width: 0 },
      legend: { show: false },
      tooltip: {
        enabled: true,
        y: {
          formatter: (val) => `${val} (${Math.round((val / n_papers) * 100)}%)`,
        },
      },
      theme: { mode: theme.palette.mode },
      dataLabels: { enabled: false },
    }),
    [theme, relevantPercentage, n_papers],
  );

  const handlePopoverOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handlePopoverClose = () => {
    setAnchorEl(null);
  };

  const popoverOpen = Boolean(anchorEl);

  return (
    <Card
      sx={{
        borderRadius: 4,
        boxShadow: 3,
        p: 2,
        height: { xs: "auto", sm: 300 },
        display: "flex",
        alignItems: "center",
        position: "relative",
      }}
    >
      <CardErrorHandler
        queryKey={"fetchProgress"}
        error={progressQuery?.error}
        isError={progressQuery?.isError}
      />
      <Box
        sx={{
          position: "absolute",
          top: 1,
          left: 2,
          mt: 1,
          display: "flex",
          alignItems: "center",
        }}
      >
        <FormControlLabel
          control={
            <Switch
              checked={!includePriorKnowledge}
              onChange={() => setIncludePriorKnowledge(!includePriorKnowledge)}
            />
          }
          label="Hide Prior Knowledge"
          labelPlacement="end"
          sx={{ padding: theme.spacing(2, 5) }}
          slotProps={{
            typography: {
              variant: "body2",
            },
          }}
        />
      </Box>
      <CardContent
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
          mt: 4,
          flexDirection: { xs: "column", sm: "row" },
        }}
      >
        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
            <Stack spacing={2}>
              <StatItem
                label="Total Records"
                value={n_papers}
                color="text.primary"
                loading={loading}
              />
              <StatItem
                label="Labeled Records"
                value={
                  includePriorKnowledge
                    ? n_included + n_excluded
                    : n_included_no_priors + n_excluded_no_priors
                }
                color="text.primary"
                loading={loading}
              />
            </Stack>
          </Grid>
          <Grid
            item
            xs={12}
            sm={4}
            container
            justifyContent="center"
            alignItems="center"
          >
            {loading ? (
              <Skeleton variant="circular" width={180} height={180} />
            ) : (
              <Chart
                options={options}
                series={donutSeries}
                type="donut"
                height={180}
                width={180}
              />
            )}
          </Grid>
          <Grid item xs={12} sm={4}>
            <Stack spacing={2}>
              <StatItem
                label="Relevant Records"
                value={
                  includePriorKnowledge ? n_included : n_included_no_priors
                }
                color={
                  theme.palette.mode === "light"
                    ? theme.palette.primary.light
                    : theme.palette.primary.main
                }
                loading={loading}
              />
              <StatItem
                label="Irrelevant Records"
                value={
                  includePriorKnowledge ? n_excluded : n_excluded_no_priors
                }
                color={
                  theme.palette.mode === "light"
                    ? theme.palette.grey[600]
                    : theme.palette.grey[600]
                }
                loading={loading}
              />
            </Stack>
          </Grid>
        </Grid>
        <Box
          sx={{
            position: "absolute",
            top: 20,
            right: 20,
          }}
        >
          <IconButton
            size="small"
            onClick={handlePopoverOpen}
            sx={{ color: theme.palette.text.secondary }}
          >
            <HelpOutlineIcon fontSize="small" />
          </IconButton>
          <Popover
            id="info-popover"
            open={popoverOpen}
            anchorEl={anchorEl}
            onClose={handlePopoverClose}
          >
            <Box sx={{ p: 3, maxWidth: 300 }}>
              <Typography variant="body2" gutterBottom>
                <strong>Hide Prior Knowledge</strong>
              </Typography>
              <Typography variant="body2">
                <strong>Hiding</strong> prior knowledge will only show labelings
                done using ASReview.
              </Typography>
              <Typography variant="body2">
                <strong>Showing</strong> prior knowledge will show combined
                labelings from the original dataset and those done using
                ASReview.
              </Typography>
              <Typography variant="body2" gutterBottom sx={{ mt: 2 }}>
                <strong>Statistics</strong>
              </Typography>
              <Typography variant="body2">
                <strong>Total Records:</strong> The total number of records in
                your dataset
              </Typography>
              <Typography variant="body2">
                <strong>Labeled Records:</strong> Combination of records that
                you labeled as relevant or irrelevant
              </Typography>
              <Typography variant="body2">
                <strong>Relevant Records:</strong> Records you labeled as
                relevant
              </Typography>
              <Typography variant="body2">
                <strong>Irrelevant Records:</strong> Records you labeled as
                irrelevant
              </Typography>
              <Typography variant="body2">
                <strong>Unlabeled Records:</strong> The remaining records that
                have not been labeled yet
              </Typography>
              <Box sx={{ pt: 1, textAlign: "center" }}>
                <a
                  href="https://asreview.readthedocs.io/en/latest/progress.html#analytics"
                  style={{
                    color: theme.palette.primary.main,
                  }}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Learn more
                </a>
              </Box>
            </Box>
          </Popover>
        </Box>
      </CardContent>
    </Card>
  );
}

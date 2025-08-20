import { Link as LinkIcon } from "@mui/icons-material";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Collapse,
  Divider,
  Fade,
  Grid2 as Grid,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import React from "react";

import { StyledIconButton } from "StyledComponents/StyledButton";
import { useToggle } from "hooks/useToggle";
import { DOIIcon } from "icons";
import { RecordCardLabeler, RecordCardModelTraining } from ".";
import { useQuery, useQueryClient } from "react-query";
import { ProjectAPI } from "api";

import { fontSizeOptions } from "globals.js";

const reconcileTagsWithSchema = (savedTags, currentSchema) => {
  if (!currentSchema || !Array.isArray(currentSchema)) {
    return [];
  }

  const savedTagsMap = new Map(
    (savedTags || []).map((group) => [group.id, group]),
  );

  return currentSchema.map((schemaGroup) => {
    const savedGroup = savedTagsMap.get(schemaGroup.id);

    if (!savedGroup) {
      return structuredClone(schemaGroup);
    }

    const savedValuesMap = new Map(
      savedGroup.values.map((value) => [value.id, value]),
    );

    const reconciledValues = schemaGroup.values.map((schemaValue) => {
      const savedValue = savedValuesMap.get(schemaValue.id);
      return savedValue || structuredClone(schemaValue);
    });

    return {
      ...savedGroup,
      values: reconciledValues,
    };
  });
};

function useExtensionListener(refetch, recordId) {
  React.useEffect(() => {
    const handleExtensionUpdate = () => {
      refetch();
    };

    window.addEventListener("extensionDataChanged", handleExtensionUpdate);

    const refetchFunctionName = `currentRecordRefetch_${recordId}`;
    window[refetchFunctionName] = refetch;
    window.currentRecordRefetch = refetch;

    return () => {
      window.removeEventListener("extensionDataChanged", handleExtensionUpdate);
      if (window[refetchFunctionName] === refetch) {
        window[refetchFunctionName] = null;
      }
      if (window.currentRecordRefetch === refetch) {
        window.currentRecordRefetch = null;
      }
    };
  }, [refetch, recordId]);
}

function useTagReconciliation(record, recordState) {
  const [tags, setTags] = React.useState(null);

  React.useEffect(() => {
    const savedTags =
      record.state?.tags && Array.isArray(record.state.tags)
        ? record.state.tags
        : null;

    const reconciledTags = reconcileTagsWithSchema(savedTags, record.tags_form);
    setTags(reconciledTags);
  }, [record.record_id, record.tags_form, record.state?.tags]);

  React.useEffect(() => {
    if (recordState?.result?.state?.tags) {
      setTags(recordState.result.state.tags);
    }
  }, [recordState]);

  return { tags, setTags };
}

function useExtensionSync(
  record,
  tags,
  isActiveReviewRecord,
  project_id,
  setTags,
) {
  React.useEffect(() => {
    // Add a small delay to ensure all data is ready
    const timer = setTimeout(() => {
      if (
        record &&
        window.asreviewExtensionSync?.sendRecordData &&
        (isActiveReviewRecord || window.location.pathname.includes("/review"))
      ) {
        const recordData = {
          title: record.title,
          project_id: project_id,
          record_id: record.record_id,
          tagsForm: record.tags_form,
          tagValues: tags,
          note: record.state?.note,
        };
        window.asreviewExtensionSync.sendRecordData(recordData);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [record, tags, project_id, isActiveReviewRecord]);

  const handleTagsChange = (newTags) => {
    setTags(newTags);

    if (
      window.asreviewExtensionSync?.sendTagUpdate &&
      (isActiveReviewRecord || window.location.pathname.includes("/review"))
    ) {
      window.asreviewExtensionSync.sendTagUpdate(newTags, record.state?.note);
    }
  };

  return handleTagsChange;
}

const RecordCardContent = ({
  record,
  fontSize,
  collapseAbstract,
  labelerProps,
}) => {
  const [readMoreOpen, toggleReadMore] = useToggle();

  return (
    <React.Fragment>
      <CardContent aria-label="record title abstract" sx={{ m: 1 }}>
        <Stack spacing={2}>
          {/* Show the title */}
          <Typography
            variant={"h5"}
            sx={(theme) => ({
              fontWeight: theme.typography.fontWeightMedium,
              lineHeight: 1.4,
            })}
          >
            {/* No title, inplace text */}
            {(record.title === "" || record.title === null) && (
              <Box
                className={"fontSize" + fontSizeOptions[fontSize]}
                fontStyle="italic"
              >
                No title available
              </Box>
            )}

            {!(record.title === "" || record.title === null) && (
              <Box className={"fontSize" + fontSizeOptions[fontSize]}>
                {record.title}
              </Box>
            )}
          </Typography>
          <Divider />
          <Stack direction="row" spacing={1}>
            {!(record.doi === undefined || record.doi === null) && (
              <Tooltip title="Open DOI">
                <StyledIconButton
                  className="record-card-icon"
                  href={"https://doi.org/" + record.doi}
                  target="_blank"
                  rel="noreferrer"
                >
                  <DOIIcon />
                </StyledIconButton>
              </Tooltip>
            )}
            {record.url && (
              <Tooltip title="Open URL">
                <StyledIconButton
                  className="record-card-icon"
                  href={record.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  <LinkIcon />
                </StyledIconButton>
              </Tooltip>
            )}
          </Stack>
          <Box>
            {(record.abstract === "" || record.abstract === null) && (
              <Typography
                className={"fontSize" + fontSize}
                variant="body1"
                sx={{
                  fontStyle: "italic",
                  textAlign: "justify",
                }}
              >
                No abstract available
              </Typography>
            )}

            <Typography
              className={"fontSize" + fontSizeOptions[fontSize]}
              variant="body1"
              sx={{
                whiteSpace: "pre-line",
                textAlign: "justify",
                hyphens: "auto",
                lineHeight: 1.6,
              }}
            >
              {!(record.abstract === "" || record.abstract === null) &&
              collapseAbstract &&
              record.abstract.length > 500 ? (
                <>
                  {!readMoreOpen ? (
                    <>
                      {record.abstract.substring(0, 500)}...
                      <Button
                        onClick={toggleReadMore}
                        startIcon={<ExpandMoreIcon />}
                        color="primary"
                        sx={{ textTransform: "none" }}
                      >
                        show more
                      </Button>
                    </>
                  ) : (
                    <>
                      {record.abstract}
                      <Button
                        onClick={toggleReadMore}
                        startIcon={<ExpandLessIcon />}
                        color="primary"
                        sx={{ textTransform: "none" }}
                      >
                        show less
                      </Button>
                    </>
                  )}
                </>
              ) : (
                record.abstract
              )}
            </Typography>
          </Box>
          {record.keywords && (
            <Box sx={{ pt: 1 }}>
              <Typography sx={{ color: "text.secondary", fontWeight: "bold" }}>
                {record.keywords.map((keyword, index) => (
                  <span key={index}>
                    {index > 0 && " • "}
                    {keyword}
                  </span>
                ))}
              </Typography>
            </Box>
          )}
        </Stack>
      </CardContent>
    </React.Fragment>
  );
};

const RecordCard = ({
  project_id,
  record,
  afterDecision = null,
  retrainAfterDecision = true,
  showBorder = true,
  fontSize = 1,
  modelLogLevel = "warning",
  showNotes = true,
  collapseAbstract = false,
  hotkeys = false,
  transitionType = "fade",
  transitionSpeed = { enter: 500, exit: 100 },
  landscape = false,
  changeDecision = true,
  isActiveReviewRecord = false,
}) => {
  const [open, setOpen] = React.useState(true);
  const queryClient = useQueryClient();

  const { data: recordState, refetch } = useQuery(
    ["fetchRecordById", { project_id, record_id: record.record_id }],
    ProjectAPI.fetchRecordById,
    {
      enabled: open,
    },
  );

  useExtensionListener(refetch, record.record_id);
  const { tags, setTags } = useTagReconciliation(record, recordState);
  const handleTagsChange = useExtensionSync(
    record,
    tags,
    isActiveReviewRecord,
    project_id,
    setTags,
  );

  if (!tags && record.tags_form) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight={100}
      >
        <CircularProgress />
      </Box>
    );
  }

  const labelerProps = {
    project_id: project_id,
    record_id: record.record_id,
    label: record.state?.label,
    labelFromDataset: record.included,
    onDecisionClose: (data) => {
      queryClient.invalidateQueries("fetchRecord", { project_id });
      if (transitionType) {
        setOpen(false);
      } else {
        afterDecision(data);
      }
    },
    retrainAfterDecision: retrainAfterDecision,
    note: record.state?.note,
    labelTime: record.state?.time,
    user: record.state?.user,
    showNotes: showNotes,
    tagsForm: record.tags_form,
    tagValues: tags,
    onTagChange: handleTagsChange,
    landscape: landscape,
    hotkeys: hotkeys,
    changeDecision: changeDecision,
  };

  const styledRepoCard = (
    <Box>
      <RecordCardModelTraining
        key={"record-card-model-" + project_id + "-" + record?.record_id}
        record={record}
        modelLogLevel={modelLogLevel}
        sx={{ mb: 3 }}
      />
      <Card
        elevation={showBorder ? 4 : 0}
        sx={(theme) => ({
          bgcolor: theme.palette.background.record,
          borderRadius: !showBorder ? 0 : undefined,
        })}
      >
        <Grid
          container
          columns={5}
          sx={{ alignItems: "stretch" }}
          // divider={<Divider orientation="vertical" flexItem />}
        >
          <Grid size={landscape ? 3 : 5}>
            <RecordCardContent
              record={record}
              fontSize={fontSize}
              collapseAbstract={collapseAbstract}
              labelerProps={labelerProps}
            />
          </Grid>
          <Grid size={landscape ? 2 : 5}>
            <RecordCardLabeler {...labelerProps} />
          </Grid>
        </Grid>
      </Card>
    </Box>
  );

  if (transitionType === "fade") {
    return (
      <Fade
        in={open}
        timeout={transitionSpeed}
        onExited={afterDecision}
        unmountOnExit
      >
        {styledRepoCard}
      </Fade>
    );
  } else if (transitionType === "collapse") {
    return (
      <Collapse
        in={open}
        timeout={transitionSpeed}
        onExited={afterDecision}
        unmountOnExit
      >
        {styledRepoCard}
      </Collapse>
    );
  } else {
    return styledRepoCard;
  }
};

export default RecordCard;

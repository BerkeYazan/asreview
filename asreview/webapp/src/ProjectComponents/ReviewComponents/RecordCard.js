import { Link as LinkIcon } from "@mui/icons-material";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {
  Box,
  Button,
  Card,
  CardContent,
  Collapse,
  Divider,
  Fade,
  Grid2 as Grid,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import React from "react";
import {
  useReviewSettings,
  useReviewSettingsDispatch,
} from "context/ReviewSettingsContext";
import { StyledIconButton } from "StyledComponents/StyledButton";
import { useToggle } from "hooks/useToggle";
import { DOIIcon } from "icons";
import { RecordCardLabeler, RecordCardModelTraining } from ".";

import { fontSizeOptions } from "globals.js";

const RecordCardContent = ({ record, fontSize, collapseAbstract }) => {
  const [readMoreOpen, toggleReadMore] = useToggle();

  return (
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

          {!(record.url === undefined || record.url === null) && (
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
  );
};

const ResizeHandle = ({ onMouseDown, side }) => (
  <Box
    onMouseDown={(e) => onMouseDown(e, side)}
    sx={{
      position: "absolute",
      [side]: "-10px",
      top: 0,
      bottom: 0,
      width: "20px",
      cursor: "col-resize",
      zIndex: 1,
    }}
  />
);

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
}) => {
  const [open, setOpen] = React.useState(true);
  const dispatch = useReviewSettingsDispatch();
  const { cardWidth } = useReviewSettings();
  const [isDragging, setIsDragging] = React.useState(false);
  const dragStartData = React.useRef(null);

  const handleMouseDown = (e, handle) => {
    e.preventDefault();
    setIsDragging(true);
    dragStartData.current = {
      startX: e.clientX,
      startWidth: cardWidth,
      handle: handle,
    };
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const handleMouseMove = (e) => {
    if (!dragStartData.current) return;
    const deltaX = e.clientX - dragStartData.current.startX;
    let deltaWidth = (deltaX / window.innerWidth) * 100;

    let newWidth;
    if (dragStartData.current.handle === "left") {
      newWidth = dragStartData.current.startWidth - deltaWidth * 2;
    } else {
      newWidth = dragStartData.current.startWidth + deltaWidth * 2;
    }

    if (newWidth >= 50 && newWidth <= 100) {
      dispatch({ type: "cardWidth", cardWidth: newWidth });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    dragStartData.current = null;
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
  };

  const styledRepoCard = (
    <Box sx={{ position: "relative" }}>
      <ResizeHandle onMouseDown={handleMouseDown} side="left" />
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
          userSelect: isDragging ? "none" : "auto",
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
            />
          </Grid>
          <Grid size={landscape ? 2 : 5}>
            <RecordCardLabeler
              key={
                "record-card-labeler-" +
                project_id +
                "-" +
                record?.record_id +
                "-" +
                record?.state?.note
              }
              project_id={project_id}
              record_id={record.record_id}
              label={record.state?.label}
              labelFromDataset={record.included}
              onDecisionClose={
                transitionType ? () => setOpen(false) : afterDecision
              }
              retrainAfterDecision={retrainAfterDecision}
              note={record.state?.note}
              labelTime={record.state?.time}
              user={record.state?.user}
              showNotes={showNotes}
              tagsForm={record.tags_form}
              tagValues={record.state?.tags}
              landscape={landscape}
              hotkeys={hotkeys}
              changeDecision={changeDecision}
            />
          </Grid>
        </Grid>
      </Card>
      <ResizeHandle onMouseDown={handleMouseDown} side="right" />
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

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import { Paper, IconButton } from "@mui/material";

const DraggableSectionItem = ({ id, children }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <Paper
      ref={setNodeRef}
      style={style}
      sx={{
        mb: 2,
        p: 2,
        display: "flex",
        alignItems: "center",
        gap: 1,
        cursor: "grab",
      }}
    >
      <IconButton {...attributes} {...listeners}>
        <DragIndicatorIcon />
      </IconButton>

      <div style={{ flex: 1 }}>{children}</div>
    </Paper>
  );
};

export default DraggableSectionItem;

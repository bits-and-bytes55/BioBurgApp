import React, { useEffect, useState } from "react";
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  IconButton,
  Divider,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import SaveIcon from "@mui/icons-material/Save";
import CloseIcon from "@mui/icons-material/Close";
import axios from "axios";
import toast from "react-hot-toast";
import {
  DndContext,
  closestCenter
} from "@dnd-kit/core";

import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove
} from "@dnd-kit/sortable";

import { CSS } from "@dnd-kit/utilities";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

const getAuthHeader = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem("adminToken")}` }
});
// const API_BASE = import.meta.env.VITE_API_BASE_URL;

function SortableSectionItem({
  sec,
  editingId,
  startEdit,
  deleteSection,
  editTitle,
  editSubtitle,
  setEditTitle,
  setEditSubtitle,
  saveEdit,
  cancelEdit
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: sec._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <Box
      ref={setNodeRef}
      style={style}
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 2,
        mb: 2,
        p: 2,
        borderRadius: 2,
        background: "#f9fafb",
        border: "1px solid #e5e7eb",
      }}
    >
      {/* DRAG HANDLE */}
      <IconButton {...attributes} {...listeners} sx={{ cursor: "grab" }}>
        <DragIndicatorIcon />
      </IconButton>

      {editingId === sec._id ? (
        <>
          <TextField
            size="small"
            label="Title"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
          />

          <TextField
            size="small"
            label="Subtitle"
            value={editSubtitle}
            onChange={(e) => setEditSubtitle(e.target.value)}
          />

          <IconButton color="success" onClick={() => saveEdit(sec._id)}>
            <SaveIcon />
          </IconButton>

          <IconButton onClick={cancelEdit}>
            <CloseIcon />
          </IconButton>
        </>
      ) : (
        <>
          <Box sx={{ flex: 1 }}>
            <Typography fontWeight={600}>{sec.title}</Typography>
            <Typography variant="caption" color="text.secondary">
              Key: {sec.key}
              {sec.subtitle && ` • ${sec.subtitle}`}
            </Typography>
          </Box>

          <IconButton color="primary" onClick={() => startEdit(sec)}>
            <EditIcon />
          </IconButton>

          <IconButton
            color="error"
            onClick={() => deleteSection(sec._id, sec.title)}
          >
            <DeleteIcon />
          </IconButton>
        </>
      )}
    </Box>
  );
}


export default function AddSectionForm({ onSectionCreated }) {
  /* ---------------- CREATE STATE ---------------- */
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");

  /* ---------------- LIST STATE ---------------- */
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(false);

  /* ---------------- EDIT STATE ---------------- */
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editSubtitle, setEditSubtitle] = useState("");

  /* ---------------- HELPERS ---------------- */
  const generateKey = (text) =>
    text.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9\-]/g, "");

  /* ---------------- FETCH SECTIONS ---------------- */
  const fetchSections = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}/api/sections/all`);
      if (res.data.success) {
        setSections(res.data.sections);
      }
    } catch (err) {
      console.error("Fetch sections error:", err);
      toast.error("Failed to load sections");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSections();
  }, []);

  /* ---------------- CREATE SECTION ---------------- */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error("Section title is required!");
      return;
    }

    const key = generateKey(title);

    try {
      const res = await axios.post(`${API_BASE}/api/sections/add`, {
        title,
        subtitle,
        key,
      }, getAuthHeader());

      if (res.data.success) {
        toast.success("New Section Created!");

        setTitle("");
        setSubtitle("");

        fetchSections();
        if (onSectionCreated) onSectionCreated();
      }
    } catch (err) {
      console.error("Create section error:", err);
      toast.error(err?.response?.data?.message || "Create failed");
    }
  };

  /* ---------------- EDIT SECTION ---------------- */
  const startEdit = (sec) => {
    setEditingId(sec._id);
    setEditTitle(sec.title);
    setEditSubtitle(sec.subtitle || "");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditTitle("");
    setEditSubtitle("");
  };

  const saveEdit = async (id) => {
    try {
      const res = await axios.put(
        `${API_BASE}/api/sections/update/${id}`,
        {
          title: editTitle,
          subtitle: editSubtitle,
        }, getAuthHeader());
     

      if (res.data.success) {
        toast.success("Section updated");
        cancelEdit();
        fetchSections();
        if (onSectionCreated) onSectionCreated();
      }
    } catch (err) {
      console.error("Update section error:", err);
      toast.error("Update failed");
    }
  };

  /* ---------------- DELETE SECTION ---------------- */
  const deleteSection = async (id, title) => {
    if (!window.confirm(`Delete section "${title}"?`)) return;

    try {
      const res = await axios.delete(
        `${API_BASE}/api/sections/delete/${id}`,
        getAuthHeader());

      if (res.data.success) {
        toast.success("Section deleted");
        fetchSections();
        if (onSectionCreated) onSectionCreated();
      }
    } catch (err) {
      console.error("Delete section error:", err);
      toast.error("Delete failed");
    }
  };


  const handleDragEnd = async (event) => {
  const { active, over } = event;
  if (!over || active.id === over.id) return;

  const oldIndex = sections.findIndex(s => s._id === active.id);
  const newIndex = sections.findIndex(s => s._id === over.id);

  const newOrder = arrayMove(sections, oldIndex, newIndex);
  setSections(newOrder);

  // BACKEND KO ORDER SAVE KARO
  try {
    await axios.put(`${API_BASE}/api/sections/reorder`, {
      orders: newOrder.map((sec, index) => ({
        id: sec._id,
        order: index + 1
      }))
    });

    toast.success("Section order updated");
    window.dispatchEvent(new Event("sections-updated"));
    if (onSectionCreated) onSectionCreated();
  } catch (err) {
    console.error("Reorder error:", err);
    toast.error("Failed to save order");
  }
};

  return (
    <Box>
      {/* ================= CREATE FORM ================= */}
      <Paper
        elevation={3}
        sx={{
          p: 4,
          borderRadius: 3,
          maxWidth: 600,
          mx: "auto",
          mb: 4,
        }}
      >
        <Typography variant="h5" fontWeight="bold" mb={3} textAlign="center">
          Create New Home Section
        </Typography>

        <form onSubmit={handleSubmit}>
          <TextField
            label="Section Title"
            fullWidth
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            sx={{ mb: 3 }}
          />

          <TextField
            label="Subtitle (optional)"
            fullWidth
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            sx={{ mb: 2 }}
          />

          {title && (
            <Typography sx={{ fontSize: 13, mb: 2, color: "gray" }}>
              <b>Section Key:</b> {generateKey(title)}
            </Typography>
          )}

          <Button
            variant="contained"
            type="submit"
            fullWidth
            sx={{ py: 1.2, textTransform: "none", fontSize: 16 }}
          >
            Create Section
          </Button>
        </form>
      </Paper>

      {/* ================= SECTION LIST ================= */}
      <Paper elevation={2} sx={{ p: 3, borderRadius: 3 }}>
        <Typography variant="h6" fontWeight="bold" mb={2}>
          Existing Sections ({sections.length})
        </Typography>

        <Divider sx={{ mb: 2 }} />

        {loading ? (
          <Typography>Loading...</Typography>
        ) : sections.length === 0 ? (
          <Typography color="text.secondary">
            No sections created yet.
          </Typography>
        ) : (
          <DndContext
  collisionDetection={closestCenter}
  onDragEnd={handleDragEnd}
>
  <SortableContext
    items={sections.map((s) => s._id)}
    strategy={verticalListSortingStrategy}
  >
    {sections.map((sec) => (
      <SortableSectionItem
        key={sec._id}
        sec={sec}
        editingId={editingId}
        startEdit={startEdit}
        deleteSection={deleteSection}
        editTitle={editTitle}
        editSubtitle={editSubtitle}
        setEditTitle={setEditTitle}
        setEditSubtitle={setEditSubtitle}
        saveEdit={saveEdit}
        cancelEdit={cancelEdit}
      />
    ))}
  </SortableContext>
</DndContext>

        )}
      </Paper>
    </Box>
  );
}

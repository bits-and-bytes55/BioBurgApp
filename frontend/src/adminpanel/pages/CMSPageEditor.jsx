import { useEffect, useState } from "react";
import axios from "axios";
import {
  Box,
  Button,
  Paper,
  TextField,
  Typography,
  Switch,
  FormControlLabel,
  Divider
} from "@mui/material";

import { DndContext, closestCenter } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";

import DraggableSectionItem from "../../components/DraggableSectionItem";

const BASE_API = import.meta.env.VITE_API_BASE_URL;

export default function CMSPageEditor({ page }) {
  const [pageData, setPageData] = useState(null);
  const adminToken = localStorage.getItem("adminToken");

  useEffect(() => {
    axios
      .get(`${BASE_API}/api/admin/pages/${page}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      })
      .then((res) => setPageData(res.data.page));
  }, [page]);

  /* ================= DRAG & DROP ================= */
  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = pageData.sections.findIndex(
      (s) => s.sectionKey === active.id
    );
    const newIndex = pageData.sections.findIndex(
      (s) => s.sectionKey === over.id
    );

    const reordered = arrayMove(
      pageData.sections,
      oldIndex,
      newIndex
    ).map((sec, index) => ({
      ...sec,
      order: index + 1,
    }));

    setPageData({ ...pageData, sections: reordered });
  };

  /* ================= SECTION FIELD UPDATE ================= */
  const updateSection = (key, field, value) => {
    setPageData({
      ...pageData,
      sections: pageData.sections.map((sec) =>
        sec.sectionKey === key
          ? { ...sec, [field]: value }
          : sec
      ),
    });
  };

  /* ================= SAVE ================= */
  const saveDraft = async () => {
    await axios.put(
      `${BASE_API}/api/admin/pages/${page}`,
      {
        sections: pageData.sections,
        seo: pageData.seo,
      },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    alert("Draft saved");
  };

  const publishPage = async () => {
    await axios.post(
      `${BASE_API}/api/admin/pages/${page}/publish`,
      {},
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    alert("Page published");
  };

  if (!pageData) return <p>Loading...</p>;

  return (
    <Box className="grid grid-cols-1 md:grid-cols-2 gap-6">

      {/* ================= LEFT: EDITOR ================= */}
      <Paper className="p-5">
        <Typography variant="h6" mb={2}>
          SEO Settings
        </Typography>

        <TextField
          fullWidth
          label="Meta Title"
          value={pageData.seo?.metaTitle || ""}
          onChange={(e) =>
            setPageData({
              ...pageData,
              seo: { ...pageData.seo, metaTitle: e.target.value },
            })
          }
        />

        <Typography variant="h6" mt={4} mb={2}>
          Sections (Drag & Drop + Edit)
        </Typography>

        <DndContext
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={pageData.sections.map((s) => s.sectionKey)}
            strategy={verticalListSortingStrategy}
          >
            {pageData.sections.map((sec) => (
              <DraggableSectionItem
                key={sec.sectionKey}
                id={sec.sectionKey}
              >
                <Box className="space-y-2">
                  <strong>{sec.sectionKey.toUpperCase()}</strong>

                  {/* TITLE */}
                  <TextField
                    label="Title"
                    fullWidth
                    value={sec.heading || ""}
                    onChange={(e) =>
                      updateSection(sec.sectionKey, "heading", e.target.value)
                    }
                  />

                  {/* CONTENT */}
                  <TextField
                    label="Content"
                    fullWidth
                    multiline
                    minRows={4}
                    value={sec.content || ""}
                    onChange={(e) =>
                      updateSection(sec.sectionKey, "content", e.target.value)
                    }
                  />

                  {/* ACTIVE TOGGLE */}
                  <FormControlLabel
                    control={
                      <Switch
                        checked={sec.isActive}
                        onChange={(e) =>
                          updateSection(
                            sec.sectionKey,
                            "isActive",
                            e.target.checked
                          )
                        }
                      />
                    }
                    label="Active"
                  />

                  <Divider />
                </Box>
              </DraggableSectionItem>
            ))}
          </SortableContext>
        </DndContext>

        <Box mt={3}>
          <Button onClick={saveDraft}>
            Save Draft
          </Button>

          <Button
            onClick={publishPage}
            color="success"
            sx={{ ml: 2 }}
          >
            Publish
          </Button>
        </Box>
      </Paper>

      {/* ================= RIGHT: LIVE PREVIEW ================= */}
      <Paper className="p-5 bg-gray-50">
        <Typography variant="h6" mb={2}>
          Live Preview
        </Typography>

        {pageData.sections
          .filter((sec) => sec.isActive)
          .sort((a, b) => a.order - b.order)
          .map((sec) => (
            <div key={sec.sectionKey} style={{ marginBottom: 16 }}>
              <h3>{sec.heading}</h3>
              <p style={{ whiteSpace: "pre-line" }}>
                {sec.content}
              </p>
            </div>
          ))}
      </Paper>
    </Box>
  );
}

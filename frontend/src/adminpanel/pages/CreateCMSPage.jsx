import { useState } from "react";
import axios from "axios";
import { Box, Button, Paper, TextField, Typography } from "@mui/material";
import toast from "react-hot-toast";

const BASE_API = import.meta.env.VITE_API_BASE_URL;
// const BASE_API = import.meta.env.VITE_API_BASE_URL;


export default function CreateCMSPage({ onCreated }) {
  const [pageName, setPageName] = useState("");
  const [pageSlug, setPageSlug] = useState("");
  const adminToken = localStorage.getItem("adminToken");

  const createPage = async () => {
    if (!pageName || !pageSlug) {
      toast.error("Page name & slug required");
      return;
    }

    try {
      await axios.post(
        `${BASE_API}/api/admin/pages`,
        {
          pageName,
          pageSlug,
        },
        {
          headers: { Authorization: `Bearer ${adminToken}` },
        }
      );

      toast.success("Page created");
      onCreated(); // refresh list
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Create page failed"
      );
    }
  };

  return (
    <Paper className="p-6 rounded-xl">
      <Typography variant="h6" mb={2}>
        Create New Page
      </Typography>

      <TextField
        fullWidth
        label="Page Name"
        value={pageName}
        onChange={(e) => {
          setPageName(e.target.value);
          setPageSlug(
            e.target.value
              .toLowerCase()
              .replace(/\s+/g, "-")
          );
        }}
        sx={{ mb: 2 }}
      />

      <TextField
        fullWidth
        label="Page Slug"
        value={pageSlug}
        onChange={(e) => setPageSlug(e.target.value)}
        sx={{ mb: 3 }}
      />

      <Button variant="contained" onClick={createPage}>
        Create Page
      </Button>
    </Paper>
  );
}

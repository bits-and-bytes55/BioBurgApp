import { useEffect, useState } from "react";
import axios from "axios";
import { Box, Button, Paper, Typography, TextField } from "@mui/material";
import toast from "react-hot-toast";


// const BASE_API = import.meta.env.VITE_API_BASE_URL;

const BASE_API = import.meta.env.VITE_API_BASE_URL + "/api";


export default function CMSPages({ setActiveSection }) {
  const [pages, setPages] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [pageName, setPageName] = useState("");
  const [pageSlug, setPageSlug] = useState("");

  const adminToken = localStorage.getItem("adminToken");

  const fetchPages = () => {
    axios
      .get(`${BASE_API}/api/admin/pages`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      })
      .then((res) => setPages(res.data.pages))
      .catch(() => toast.error("Failed to load pages"));
  };

  useEffect(() => {
    fetchPages();
  }, []);

  const createPage = async () => {
    if (!pageName || !pageSlug) {
      toast.error("Page name & slug required");
      return;
    }

    try {
      await axios.post(
        `${BASE_API}/api/admin/pages`,
        { pageName, pageSlug },
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );

      toast.success("Page created");
      setPageName("");
      setPageSlug("");
      setShowCreate(false);
      fetchPages();
    } catch (err) {
      toast.error(err.response?.data?.message || "Create page failed");
    }
  };

  return (
    <Box>
      {/* HEADER */}
      <Box className="flex justify-between items-center mb-4">
        <Typography variant="h6">CMS Pages</Typography>

        <Button variant="contained" onClick={() => setShowCreate(!showCreate)}>
          ➕ Create Page
        </Button>
      </Box>

      {/* CREATE PAGE FORM */}
      {showCreate && (
        <Paper className="p-5 mb-4">
          <TextField
            fullWidth
            label="Page Name"
            value={pageName}
            onChange={(e) => {
              setPageName(e.target.value);
              setPageSlug(
                e.target.value.toLowerCase().replace(/\s+/g, "-")
              );
            }}
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            label="Page Slug"
            value={pageSlug}
            onChange={(e) => setPageSlug(e.target.value)}
            sx={{ mb: 2 }}
          />

          <Button onClick={createPage}>Create</Button>
        </Paper>
      )}

      {/* PAGE LIST */}
      {pages.map((p) => (
        <Paper
          key={p.pageSlug}
          className="p-4 mb-3 flex justify-between items-center"
        >
          <Box>
            <Typography>{p.pageName}</Typography>
            <Typography variant="caption">
              /{p.pageSlug} ({p.status})
            </Typography>
          </Box>

          <Button
            variant="outlined"
            onClick={() =>
              setActiveSection(`cms-edit-${p.pageSlug}`)
            }
          >
            Edit
          </Button>
        </Paper>
      ))}
    </Box>
  );
}

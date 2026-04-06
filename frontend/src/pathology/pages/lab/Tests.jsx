import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  IconButton,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";

export default function LabTests() {
  const [tests, setTests] = useState([]);
  const [form, setForm] = useState({
    testName: "",
    price: "",
    description: "",
  });

  const token = localStorage.getItem("labToken");

  useEffect(() => {
    fetchTests();
  }, []);

  const fetchTests = async () => {
    const res = await axios.get(
      "https://bioburglifescience-1.onrender.com/api/lab-tests/my-tests",
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    setTests(res.data.data);
  };

  const addTest = async () => {
    await axios.post(
      "https://bioburglifescience-1.onrender.com/api/lab-tests/add",
      form,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    setForm({ testName: "", price: "", description: "" });
    fetchTests();
  };

  const deleteTest = async (id) => {
    await axios.delete(
      `https://bioburglifescience-1.onrender.com/api/lab-tests/${id}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    fetchTests();
  };

  return (
    <Paper sx={{ p: 4 }}>
      <Typography variant="h5" fontWeight="bold">
        Lab Tests
      </Typography>

      {/* ADD FORM */}
      <Box display="flex" gap={2} mt={3}>
        <TextField
          label="Test Name"
          value={form.testName}
          onChange={(e) => setForm({ ...form, testName: e.target.value })}
        />
        <TextField
          label="Price"
          type="number"
          value={form.price}
          onChange={(e) => setForm({ ...form, price: e.target.value })}
        />
        <TextField
          label="Description"
          value={form.description}
          onChange={(e) =>
            setForm({ ...form, description: e.target.value })
          }
        />
        <Button variant="contained" onClick={addTest}>
          Add
        </Button>
      </Box>

      {/* TABLE */}
      <Table sx={{ mt: 4 }}>
        <TableHead>
          <TableRow>
            <TableCell>Test</TableCell>
            <TableCell>Price</TableCell>
            <TableCell>Description</TableCell>
            <TableCell />
          </TableRow>
        </TableHead>
        <TableBody>
          {tests.map((t) => (
            <TableRow key={t._id}>
              <TableCell>{t.testName}</TableCell>
              <TableCell>₹{t.price}</TableCell>
              <TableCell>{t.description}</TableCell>
              <TableCell>
                <IconButton onClick={() => deleteTest(t._id)}>
                  <DeleteIcon color="error" />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Paper>
  );
}

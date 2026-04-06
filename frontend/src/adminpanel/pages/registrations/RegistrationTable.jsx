import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Paper, Table, TableHead, TableRow,
  TableCell, TableBody, Button
} from "@mui/material";

const BASE_API = import.meta.env.VITE_API_BASE_URL;

const RegistrationTable = ({ title, type }) => {
  const [rows, setRows] = useState([]);
  const token = localStorage.getItem("adminToken");

  const fetchData = async () => {
    const res = await axios.get(
      `${BASE_API}/api/admin/registrations/${type}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    setRows(res.data.data);
  };

  useEffect(() => {
    fetchData();
  }, [type]);

  const updateStatus = async (id, status) => {
    await axios.put(
      `${BASE_API}/api/admin/registrations/${type}/${id}/status`,
      { status },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    fetchData();
  };

  return (
    <Paper className="p-6 rounded-xl">
      <h2 className="text-xl font-bold mb-4">{title}</h2>

      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>Email</TableCell>
            <TableCell>Phone</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Action</TableCell>
          </TableRow>
        </TableHead>

        <TableBody>
          {rows.map(r => (
            <TableRow key={r._id}>
              <TableCell>{r.name}</TableCell>
              <TableCell>{r.email}</TableCell>
              <TableCell>{r.phone}</TableCell>
              <TableCell>{r.status}</TableCell>
              <TableCell>
                <Button size="small" onClick={() => updateStatus(r._id, "approved")}>
                  Approve
                </Button>
                <Button size="small" color="error"
                  onClick={() => updateStatus(r._id, "rejected")}>
                  Reject
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Paper>
  );
};

export default RegistrationTable;

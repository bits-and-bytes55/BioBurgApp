import { Routes, Route } from "react-router-dom";
import DoctorOverview from "../pages/DoctorOverview";
import AllDoctors from "../pages/Doctors";
import PendingDoctors from "../pages/PendingDoctors";
import ApprovedDoctors from "../pages/ApprovedDoctors";
import BlockedDoctors from "../pages/BlockedDoctors";
import Consultations from "../pages/Consultations";
import Wallet from "../pages/Wallet";

export default function AdminRoutes() {
  return (
    <Routes>
      <Route path="/" element={<DoctorOverview />} />
      <Route path="/doctors" element={<AllDoctors />} />
      <Route path="/doctors/pending" element={<PendingDoctors />} />
      <Route path="/doctors/approved" element={<ApprovedDoctors />} />
      <Route path="/doctors/blocked" element={<BlockedDoctors />} />
      <Route path="/doctors/consultations" element={<Consultations />} />
      <Route path="/wallet" element={<Wallet />} />
    </Routes>
  );
}
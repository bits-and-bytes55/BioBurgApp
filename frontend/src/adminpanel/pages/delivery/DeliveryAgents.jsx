import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import NearbyAgentsMap from "./NearbyAgents";

const API = import.meta.env.VITE_API_BASE_URL + "/api";
const api = axios.create({ baseURL: API });
api.interceptors.request.use((cfg) => {
  const t = localStorage.getItem("adminToken") || localStorage.getItem("token");
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
});

const Ic = {
  Users:   <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  Check:   <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  Clock:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  X:       <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  Ban:     <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>,
  Eye:     <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  Dollar:  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
  Truck:   <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>,
  Pin:     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
  PackLg:  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>,
  TruckLg: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>,
  Search:  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  Zap:     <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
  Arrow:   <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
  Grid:    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
  Box:     <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>,
  Mail:    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
  Draft:   <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  Info:    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
  Trash:   <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>,
  Refresh: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>,
};

const STATUS = {
  pending:   { bg:"#fefce8", color:"#854d0e", border:"#fde047", dot:"#f59e0b" },
  approved:  { bg:"#f0fdf4", color:"#166534", border:"#86efac", dot:"#22c55e" },
  rejected:  { bg:"#fef2f2", color:"#991b1b", border:"#fca5a5", dot:"#ef4444" },
  suspended: { bg:"#f8fafc", color:"#475569", border:"#cbd5e1", dot:"#94a3b8" },
  draft:     { bg:"#fff7ed", color:"#9a3412", border:"#fed7aa", dot:"#f97316" },
};

const ORDER_STATUS_COLOR = {
  PLACED:"#3b82f6", CONFIRMED:"#16a34a", PROCESSING:"#ea580c", SHIPPED:"#7c3aed",
  OUT_FOR_DELIVERY:"#0891b2", DELIVERED:"#15803d", Cancelled:"#dc2626",
};

const DRAFT_SECTIONS = [
  { key:"personal", label:"Step 1 — Personal Information", color:"#1d4ed8", bg:"#eff6ff", border:"#bfdbfe",
    fields:[{key:"name",label:"Full Name",hint:"Name doesn't match Aadhaar card"},{key:"phone",label:"Mobile Number",hint:"Invalid or unverifiable number"},{key:"email",label:"Email Address",hint:"Email is invalid or already in use"},{key:"deliveryZone",label:"Delivery Zone / Area",hint:"Zone not serviceable or too vague"}] },
  { key:"vehicle", label:"Step 2 — Vehicle & Documents", color:"#7c3aed", bg:"#f5f3ff", border:"#ddd6fe",
    fields:[{key:"vehicleType",label:"Vehicle Type",hint:"Vehicle type mismatch with documents"},{key:"vehicleNumber",label:"Vehicle Registration No.",hint:"Invalid or unclear registration number"},{key:"drivingLicence",label:"Driving Licence No.",hint:"Licence number invalid or expired"},{key:"aadhaar",label:"Aadhaar / ID Proof (doc)",hint:"Document blurry, expired or unreadable"},{key:"licenceCopy",label:"Driving Licence Copy",hint:"Document blurry, expired or unreadable"},{key:"vehicleRC",label:"Vehicle RC Document",hint:"RC doesn't match vehicle number"},{key:"passportPhoto",label:"Passport Photo",hint:"Photo unclear or not recent"}] },
  { key:"bank", label:"Step 3 — Bank & Payment", color:"#0d9488", bg:"#f0fdfa", border:"#99f6e4",
    fields:[{key:"bankName",label:"Bank Name",hint:"Bank name missing or incorrect"},{key:"accountNumber",label:"Account Number",hint:"Invalid account number format"},{key:"ifscCode",label:"IFSC Code",hint:"IFSC code invalid or not found"},{key:"upiId",label:"UPI ID",hint:"UPI ID format incorrect"},{key:"upiQrImage",label:"UPI QR Code Image",hint:"QR code image missing or unreadable"}] },
];

export default function DeliveryAgents() {
  const [agents,       setAgents]       = useState([]);
  const [stats,        setStats]        = useState(null);
  const [filter,       setFilter]       = useState("all");
  const [search,       setSearch]       = useState("");
  const [page,         setPage]         = useState(1);
  const [total,        setTotal]        = useState(0);
  const [counts,       setCounts]       = useState({});
  const [loading,      setLoading]      = useState(false);
  const [selected,     setSelected]     = useState(null);
  const [modal,        setModal]        = useState(null);
  const [form,         setForm]         = useState({});
  const [toast,        setToast]        = useState(null);
  const [onlineAgents, setOnlineAgents] = useState([]);
  const [assignStep,   setAssignStep]   = useState(1);
  const [assignData,   setAssignData]   = useState({ agentId:"", orderId:"", orderType:"", location:"" });
  const [nearbyMap,    setNearbyMap]    = useState(false);
  const [orders,        setOrders]        = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [orderSearch,   setOrderSearch]   = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [draftFields,   setDraftFields]   = useState({});
  const [draftNote,     setDraftNote]     = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState("");

  const showToast = (msg, type="success") => { setToast({msg,type}); setTimeout(()=>setToast(null),3800); };

  const fetchAgents = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit:15 };
      if (filter !== "all") params.status = filter;
      if (search) params.search = search;
      const { data } = await api.get("/delivery/admin/agents", { params });
      if (data.success) { setAgents(data.agents||data.data||[]); setTotal(data.total||0); setCounts(data.counts||{}); }
    } catch { showToast("Failed to fetch agents","error"); }
    finally { setLoading(false); }
  }, [filter, search, page]);

  const fetchStats  = useCallback(async () => { try { const {data}=await api.get("/delivery/admin/agents/stats");  if(data.success) setStats(data.stats);           } catch  { /* silent */ } }, []);
  const fetchOnline = useCallback(async () => { try { const {data}=await api.get("/delivery/admin/agents/online"); if(data.success) setOnlineAgents(data.agents||[]); } catch  { /* silent */ } }, []);
  const fetchOrders = useCallback(async () => {
    setOrdersLoading(true);
    try { const {data}=await api.get("/orders/admin/all"); const list=data.orders||data||[]; setOrders(list.filter(o=>!["DELIVERED","Cancelled"].includes(o.orderStatus))); }
    catch { showToast("Failed to fetch orders","error"); }
    finally { setOrdersLoading(false); }
  }, []);

  useEffect(() => { fetchAgents(); fetchStats(); fetchOnline(); }, [fetchAgents, fetchStats, fetchOnline]);
  useEffect(() => { const iv=setInterval(()=>{fetchOnline();fetchStats();},10000); return()=>clearInterval(iv); }, [fetchOnline,fetchStats]);

  const doApprove    = async () => { try { const{data}=await api.patch(`/delivery/admin/agents/${selected._id}/approve`,form); if(data.success){showToast(`${selected.name} approved!`);closeModal();fetchAgents();fetchStats();}} catch(e){showToast(e.response?.data?.message||"Failed","error");} };
  const doReject     = async () => { try { const{data}=await api.patch(`/delivery/admin/agents/${selected._id}/reject`,{reason:form.reason}); if(data.success){showToast(`${selected.name} rejected`);closeModal();fetchAgents();fetchStats();}} catch(e){showToast(e.response?.data?.message||"Failed","error");} };
  const doSuspend    = async () => { try { const{data}=await api.patch(`/delivery/admin/agents/${selected._id}/suspend`,{reason:form.reason}); if(data.success){showToast(`${selected.name} suspended`);closeModal();fetchAgents();fetchStats();}} catch(e){showToast(e.response?.data?.message||"Failed","error");} };
  const doReactivate = async (a) => { try { const{data}=await api.patch(`/delivery/admin/agents/${a._id}/reactivate`); if(data.success){showToast(`${a.name} reactivated!`);fetchAgents();fetchStats();}} catch(e){showToast(e.response?.data?.message||"Failed","error");} };
  const doCommission = async () => { try { const{data}=await api.patch(`/delivery/admin/agents/${selected._id}/commission`,form); if(data.success){showToast("Commission updated");closeModal();fetchAgents();}} catch(e){showToast(e.response?.data?.message||"Error","error");} };
  const doAssign     = async () => { try { const{data}=await api.patch(`/orders/${assignData.orderId}/assign-agent`,{agentId:assignData.agentId,orderType:assignData.orderType,location:assignData.location}); if(data.success){showToast(data.message||"Assigned!");closeModal();fetchAgents();}} catch(e){showToast(e.response?.data?.message||"Error","error");} };
  const doDelete     = async () => { try { const{data}=await api.delete(`/delivery/admin/agents/${selected._id}`); if(data.success){showToast(`${selected.name} deleted`);closeModal();fetchAgents();fetchStats();}} catch(e){showToast(e.response?.data?.message||"Failed","error");} };
  const doDraft      = async () => {
    const flagged = Object.entries(draftFields).filter(([,v])=>v).map(([k])=>k);
    if(!flagged.length){showToast("Select at least one field","error");return;}
    try { const{data}=await api.patch(`/delivery/admin/agents/${selected._id}/draft`,{fieldsToRevise:flagged,adminNote:draftNote.trim()||null}); if(data.success){showToast(`Draft sent — ${flagged.length} field(s) flagged`);closeModal();fetchAgents();fetchStats();}} catch(e){showToast(e.response?.data?.message||"Failed","error");}
  };

  const openModal = (type, agent) => {
    setSelected(agent); setForm({}); setModal(type);
    if(type==="assign"){setAssignStep(1);setAssignData({agentId:"",orderId:"",orderType:"",location:""});setSelectedOrder(null);setOrderSearch("");fetchOrders();}
    if(type==="draft"){setDraftFields({});setDraftNote("");}
    if(type==="delete"){setDeleteConfirm("");}
  };
  const closeModal = () => { setModal(null); setSelected(null); setForm({}); };
  const toggleDraftField = (key) => setDraftFields(p=>({...p,[key]:!p[key]}));
  const toggleSection    = (section) => { const allOn=section.fields.every(f=>draftFields[f.key]); const u={}; section.fields.forEach(f=>{u[f.key]=!allOn;}); setDraftFields(p=>({...p,...u})); };
  const flaggedCount = Object.values(draftFields).filter(Boolean).length;
  const filteredOrders = orders.filter(o => { const q=orderSearch.toLowerCase(); if(!q) return true; return o._id?.toLowerCase().includes(q)||o.address?.fullName?.toLowerCase().includes(q)||o.userId?.name?.toLowerCase().includes(q); });

  const TABS = [
    {key:"all",label:"All",count:total},{key:"pending",label:"Pending",count:counts.pending||0},
    {key:"approved",label:"Approved",count:counts.approved||0},{key:"rejected",label:"Rejected",count:counts.rejected||0},
    {key:"suspended",label:"Suspended",count:counts.suspended||0},{key:"draft",label:"Draft",count:counts.draft||0},
  ];
  const SCFG = stats ? [
    {icon:Ic.Grid,label:"Total",val:stats.total,color:"#1e293b",bg:"#f8fafc",bd:"#e2e8f0"},
    {icon:Ic.Check,label:"Approved",val:stats.approved,color:"#166534",bg:"#f0fdf4",bd:"#bbf7d0"},
    {icon:Ic.Clock,label:"Pending",val:stats.pending,color:"#92400e",bg:"#fefce8",bd:"#fde68a"},
    {icon:Ic.X,label:"Rejected",val:stats.rejected,color:"#991b1b",bg:"#fef2f2",bd:"#fecaca"},
    {icon:Ic.Ban,label:"Suspended",val:stats.suspended,color:"#475569",bg:"#f8fafc",bd:"#e2e8f0"},
    {icon:Ic.Users,label:"Online",val:stats.online,color:"#065f46",bg:"#ecfdf5",bd:"#a7f3d0"},
    {icon:Ic.Box,label:"Deliveries",val:stats.totalDeliveries,color:"#1d4ed8",bg:"#eff6ff",bd:"#bfdbfe"},
    {icon:Ic.Draft,label:"Drafts",val:stats.draft||0,color:"#9a3412",bg:"#fff7ed",bd:"#fed7aa"},
  ] : [];

  return (
    <div style={{ minHeight:"100vh", background:"#f8fafc", fontFamily:"'DM Sans',sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&family=DM+Mono:wght@400;500&display=swap');
        .da *{box-sizing:border-box}
        .da-toast{position:fixed;top:14px;right:14px;left:14px;max-width:380px;margin:0 auto;z-index:9999;display:flex;align-items:center;gap:8px;padding:11px 16px;border-radius:10px;font-size:13px;font-weight:600;box-shadow:0 8px 28px rgba(0,0,0,.18);animation:slideIn .3s ease}
        .t-ok{background:#0f172a;color:#fff}.t-err{background:#dc2626;color:#fff}
        @keyframes slideIn{from{opacity:0;transform:translateY(-12px)}to{opacity:1;transform:translateY(0)}}
        /* Stats */
        .da-stat{background:#fff;border-radius:12px;padding:14px 16px;transition:box-shadow .2s}
        .da-stat:hover{box-shadow:0 4px 18px rgba(0,0,0,.07)}
        .da-sg{display:grid;grid-template-columns:repeat(8,1fr);gap:10px;margin-bottom:20px}
        @media(max-width:1200px){.da-sg{grid-template-columns:repeat(4,1fr)}}
        @media(max-width:640px){.da-sg{grid-template-columns:repeat(2,1fr);gap:8px}}
        /* Table */
        .da-tbl{width:100%;border-collapse:collapse}
        .da-tbl th{text-align:left;font-size:10px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.08em;padding:10px 12px;background:#f8fafc;border-bottom:1px solid #f1f5f9;white-space:nowrap}
        .da-tbl td{padding:11px 12px;border-bottom:1px solid #f8fafc;vertical-align:middle}
        .da-tbl tr:last-child td{border-bottom:none}
        .da-tbl tbody tr:hover{background:#fafbfc}
        /* Hide columns responsively */
        @media(max-width:1100px){.col-vehicle{display:none}}
        @media(max-width:900px){.col-email{display:none}.col-commission{display:none}}
        @media(max-width:700px){.col-phone{display:none}.col-online{display:none}}
        /* Badges */
        .da-pill{display:inline-flex;align-items:center;gap:5px;padding:3px 8px;border-radius:6px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;border:1px solid;white-space:nowrap}
        .da-pill-dot{width:5px;height:5px;border-radius:50%;flex-shrink:0}
        /* Action buttons */
        .da-act{display:inline-flex;align-items:center;gap:4px;padding:4px 7px;border-radius:6px;font-size:11px;font-weight:600;border:1px solid transparent;cursor:pointer;transition:all .15s;white-space:nowrap;background:none;font-family:inherit}
        .da-act:hover{opacity:.8;transform:translateY(-1px)}
        .av{background:#f0f9ff;color:#0369a1;border-color:#bae6fd}
        .aa{background:#f0fdf4;color:#15803d;border-color:#86efac}
        .ar{background:#fef2f2;color:#dc2626;border-color:#fca5a5}
        .as{background:#f8fafc;color:#475569;border-color:#cbd5e1}
        .are{background:#ecfdf5;color:#0d9488;border-color:#99f6e4}
        .ac{background:#fffbeb;color:#b45309;border-color:#fcd34d}
        .aap{background:#dcfce7;color:#15803d;border-color:#4ade80}
        .adr{background:#fff7ed;color:#c2410c;border-color:#fdba74}
        .adl{background:#fff1f2;color:#be123c;border-color:#fda4af}
        /* Tabs */
        .da-tab{display:flex;align-items:center;gap:5px;padding:9px 10px;border:none;background:none;cursor:pointer;font-size:12px;font-weight:600;color:#94a3b8;border-bottom:2px solid transparent;margin-bottom:-1px;transition:all .15s;white-space:nowrap;font-family:inherit}
        .da-tab:hover{color:#475569}
        .da-tab.on{color:#0f172a;border-bottom-color:#0f172a}
        .da-tbadge{font-size:10px;font-weight:700;padding:1px 5px;border-radius:99px;background:#f1f5f9;color:#64748b}
        .da-tab.on .da-tbadge{background:#0f172a;color:#fff}
        /* Modal */
        .da-overlay{position:fixed;inset:0;background:rgba(15,23,42,.5);z-index:1000;display:flex;align-items:center;justify-content:center;padding:12px;backdrop-filter:blur(3px)}
        .da-modal{background:#fff;border-radius:16px;width:100%;max-width:500px;max-height:92vh;overflow-y:auto;box-shadow:0 28px 72px rgba(0,0,0,.2)}
        .da-modal-lg{max-width:600px}
        @media(max-width:640px){.da-modal,.da-modal-lg{max-width:100%;border-radius:16px 16px 0 0;max-height:88vh;margin-top:auto;align-self:flex-end}}
        .da-mhd{padding:20px 20px 0;display:flex;align-items:flex-start;justify-content:space-between}
        .da-mtitle{font-size:15px;font-weight:700;color:#0f172a;letter-spacing:-.3px}
        .da-msub{font-size:12px;color:#94a3b8;margin-top:2px}
        .da-mclose{width:28px;height:28px;border:none;background:#f1f5f9;border-radius:7px;cursor:pointer;display:flex;align-items:center;justify-content:center;color:#64748b;transition:all .15s;flex-shrink:0}
        .da-mclose:hover{background:#e2e8f0}
        .da-mbody{padding:16px 20px}
        .da-mfooter{padding:0 20px 18px;display:flex;gap:8px}
        .da-field{margin-bottom:12px}
        .da-label{display:block;font-size:10px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.08em;margin-bottom:5px}
        .da-input{width:100%;border:1px solid #e2e8f0;border-radius:8px;padding:9px 12px;font-size:13px;color:#0f172a;font-family:inherit;outline:none;transition:border .2s;background:#fff}
        .da-input:focus{border-color:#64748b}
        .da-sel{width:100%;border:1px solid #e2e8f0;border-radius:8px;padding:9px 12px;font-size:13px;color:#0f172a;font-family:inherit;outline:none;background:#fff;cursor:pointer}
        .da-ta{width:100%;border:1px solid #e2e8f0;border-radius:8px;padding:9px 12px;font-size:13px;color:#0f172a;font-family:inherit;outline:none;resize:none;transition:border .2s}
        .da-ta:focus{border-color:#64748b}
        .da-btn{flex:1;padding:10px 12px;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;border:none;font-family:inherit;transition:all .18s;display:flex;align-items:center;justify-content:center;gap:6px}
        .bc{background:#f1f5f9;color:#475569;border:1px solid #e2e8f0}.bc:hover{background:#e2e8f0}
        .bp{background:#0f172a;color:#fff}.bp:hover{background:#1e293b}
        .bg{background:#15803d;color:#fff}.bg:hover{background:#166534}
        .br{background:#dc2626;color:#fff}.br:hover{background:#b91c1c}
        .bsl{background:#475569;color:#fff}.bsl:hover{background:#334155}
        .ba{background:#d97706;color:#fff}.ba:hover{background:#b45309}
        .bt{background:#0d9488;color:#fff}.bt:hover{background:#0f766e}
        .bdr{background:#ea580c;color:#fff}.bdr:hover{background:#c2410c}
        .bdl{background:#be123c;color:#fff}.bdl:hover{background:#9f1239}
        .da-btn:disabled{opacity:.4;cursor:not-allowed}
        .da-del-input{width:100%;border:2px solid #fda4af;border-radius:8px;padding:9px 12px;font-size:13px;color:#0f172a;font-family:inherit;outline:none;transition:border .2s;background:#fff1f2;font-weight:600}
        .da-del-input:focus{border-color:#be123c}
        /* Step wizard */
        .da-steps{display:flex;align-items:center;margin-bottom:18px}
        .da-sn{width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;flex-shrink:0;transition:all .25s}
        .sd{background:#0f172a;color:#fff}.sa{background:#0f172a;color:#fff;box-shadow:0 0 0 3px rgba(15,23,42,.12)}.sp{background:#f1f5f9;color:#94a3b8}
        .da-sl{font-size:11px;font-weight:600;color:#94a3b8;white-space:nowrap}.da-sl.on{color:#0f172a}
        .da-sline{flex:1;height:1px;background:#e2e8f0;margin:0 8px}.da-sline.d{background:#0f172a}
        .da-otype{border:2px solid #e2e8f0;border-radius:12px;padding:16px;cursor:pointer;transition:all .18s;text-align:center;background:#fff}
        .da-otype:hover{border-color:#94a3b8}.da-otype.sel{border-color:#0f172a;background:#fafafa}
        .da-oi{width:44px;height:44px;border-radius:11px;margin:0 auto 10px;display:flex;align-items:center;justify-content:center}
        .da-ot{font-size:13px;font-weight:700;color:#0f172a}.da-od{font-size:11px;color:#94a3b8;margin-top:2px}
        .da-sum{background:#f8fafc;border:1px solid #e8edf2;border-radius:10px;padding:12px 14px}
        .da-note{background:#f0f9ff;border:1px solid #bae6fd;border-radius:8px;padding:9px 12px;font-size:12px;color:#0369a1;font-weight:500;margin-bottom:14px}
        .da-note-g{background:#f0fdf4;border:1px solid #bbf7d0;color:#166534}
        .da-note-w{background:#fffbeb;border:1px solid #fde68a;color:#92400e}
        .da-note-o{background:#fff7ed;border:1px solid #fed7aa;color:#9a3412}
        /* Online dot */
        .don{width:8px;height:8px;border-radius:50%;background:#22c55e;display:inline-block;box-shadow:0 0 0 2px #dcfce7;animation:pls 2s infinite}
        .doff{width:8px;height:8px;border-radius:50%;background:#e2e8f0;display:inline-block}
        @keyframes pls{0%,100%{opacity:1}50%{opacity:.4}}
        .da-pgb{padding:6px 11px;border:1px solid #e2e8f0;border-radius:7px;font-size:12px;font-weight:600;cursor:pointer;background:#fff;color:#475569;font-family:inherit;transition:all .15s}
        .da-pgb:hover:not(:disabled){background:#f8fafc}.da-pgb:disabled{opacity:.4;cursor:not-allowed}
        /* View modal rows */
        .da-vrow{display:flex;justify-content:space-between;align-items:center;padding:7px 0;border-bottom:1px solid #f8fafc}
        .da-vrow:last-child{border-bottom:none}
        .da-vk{font-size:11px;color:#64748b;font-weight:500}
        .da-vv{font-size:12px;color:#0f172a;font-weight:600;text-align:right;max-width:60%;word-break:break-word}
        .da-vsec{font-size:10px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.1em;margin:12px 0 6px}
        .da-dl{font-size:12px;color:#0d9488;font-weight:600;text-decoration:none;display:flex;align-items:center;gap:4px}
        .da-iwr{position:relative}.da-ii{position:absolute;left:10px;top:50%;transform:translateY(-50%);color:#94a3b8;display:flex;pointer-events:none}.da-ipl{padding-left:32px!important}
        .da-oc{background:#f0fdf4;border:1px solid #dcfce7;border-radius:10px;padding:12px 14px}
        /* Draft */
        .df-section{border:1px solid #e8edf2;border-radius:12px;overflow:hidden;margin-bottom:9px}
        .df-sec-hd{display:flex;align-items:center;justify-content:space-between;padding:9px 13px;cursor:pointer;user-select:none;transition:background .15s}
        .df-sec-hd:hover{background:#f8fafc}
        .df-sec-title{font-size:12px;font-weight:700;color:#0f172a;display:flex;align-items:center;gap:7px}
        .df-sec-badge{font-size:10px;font-weight:700;padding:2px 7px;border-radius:99px;color:#fff}
        .df-sec-toggle{font-size:11px;font-weight:600;color:#94a3b8;text-decoration:underline;cursor:pointer;white-space:nowrap}
        .df-fields{padding:4px 13px 11px}
        .df-field-row{display:flex;align-items:flex-start;gap:9px;padding:7px 0;border-bottom:1px solid #f8fafc;cursor:pointer}
        .df-field-row:last-child{border-bottom:none}
        .df-cb{width:16px;height:16px;border-radius:4px;border:1.5px solid #cbd5e1;flex-shrink:0;display:flex;align-items:center;justify-content:center;transition:all .15s;margin-top:1px;background:#fff}
        .df-cb.on{border-color:#ea580c;background:#ea580c}
        .df-label{font-size:13px;font-weight:600;color:#334155;line-height:1.3}
        .df-hint{font-size:11px;color:#94a3b8;margin-top:1px}
        .df-counter{display:inline-flex;align-items:center;gap:5px;background:#fff7ed;border:1px solid #fed7aa;border-radius:7px;padding:4px 10px;font-size:12px;font-weight:700;color:#c2410c}
        /* Order picker */
        .op-search{width:100%;border:1px solid #e2e8f0;border-radius:8px;padding:8px 10px 8px 32px;font-size:12px;color:#0f172a;font-family:inherit;outline:none;background:#f8fafc}
        .op-search:focus{border-color:#64748b;background:#fff}
        .op-list{max-height:220px;overflow-y:auto;border:1px solid #e8edf2;border-radius:10px;margin-top:7px}
        .op-item{display:flex;align-items:center;gap:10px;padding:10px 12px;border-bottom:1px solid #f1f5f9;cursor:pointer;transition:background .12s}
        .op-item:last-child{border-bottom:none}.op-item:hover{background:#f8fafc}
        .op-item.sel{background:#eff6ff;border-left:3px solid #3b82f6}
        .op-id{font-family:'DM Mono',monospace;font-size:11px;font-weight:600;color:#0d9488;white-space:nowrap}
        .op-name{font-size:12px;font-weight:600;color:#0f172a}
        .op-meta{font-size:11px;color:#94a3b8;margin-top:1px}
        .op-badge{font-size:9px;font-weight:700;padding:2px 6px;border-radius:4px;text-transform:uppercase;letter-spacing:.04em;border:1px solid;white-space:nowrap}
        .op-empty{text-align:center;padding:24px;font-size:12px;color:#94a3b8}
        .op-selected-card{background:#eff6ff;border:1.5px solid #bfdbfe;border-radius:10px;padding:10px 13px;margin-top:7px;display:flex;align-items:center;gap:10px}
        /* Header responsive */
        .da-header{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:20px;flex-wrap:wrap;gap:12px}
        .da-header-btns{display:flex;gap:8px;flex-wrap:wrap}
        @media(max-width:600px){
          .da-header{flex-direction:column}
          .da-header-btns{width:100%}
          .da-header-btn{flex:1;justify-content:center}
        }
        /* Online agents grid */
        .da-online-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}
        @media(max-width:900px){.da-online-grid{grid-template-columns:repeat(2,1fr)}}
        @media(max-width:480px){.da-online-grid{grid-template-columns:1fr 1fr}}
        /* Table wrap */
        @media(max-width:480px){
          .da-tbl th,.da-tbl td{padding:9px 8px;font-size:12px}
          .da-act{padding:3px 6px;font-size:10px}
        }
      `}</style>

      {toast && (
        <div className={`da-toast ${toast.type==="error"?"t-err":"t-ok"}`}>
          <span style={{display:"flex"}}>{toast.type==="error"?Ic.X:Ic.Check}</span>{toast.msg}
        </div>
      )}

      <div className="da" style={{ maxWidth:1400, margin:"0 auto", padding:"20px 16px" }}>
        {/* Header */}
        <div className="da-header">
          <div>
            <div style={{fontSize:21,fontWeight:800,color:"#0f172a",letterSpacing:"-.4px"}}>Agent Management</div>
            <div style={{fontSize:13,color:"#94a3b8",marginTop:3}}>Approve, reject, authorize and manage delivery agents</div>
          </div>
          <div className="da-header-btns">
            <div style={{display:"flex",alignItems:"center",gap:7,padding:"8px 14px",borderRadius:8,border:"1px solid #e2e8f0",background:"#fff",fontSize:12,fontWeight:600,color:"#334155"}}>
              <span className={onlineAgents.length>0?"don":"doff"}/>{onlineAgents.length} Online
            </div>
            <button className="da-header-btn" onClick={()=>setNearbyMap(true)}
              style={{display:"flex",alignItems:"center",gap:7,padding:"8px 14px",borderRadius:8,border:"1.5px solid #0d9488",background:"#f0fdfa",color:"#0d9488",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit",transition:"all .15s"}}
              onMouseEnter={e=>{e.currentTarget.style.background="#0d9488";e.currentTarget.style.color="#fff"}}
              onMouseLeave={e=>{e.currentTarget.style.background="#f0fdfa";e.currentTarget.style.color="#0d9488"}}>
              Nearby Radar
            </button>
            <button className="da-header-btn" onClick={()=>openModal("assign",null)}
              style={{display:"flex",alignItems:"center",gap:7,padding:"8px 14px",borderRadius:8,border:"none",background:"#0f172a",color:"#fff",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>
              <span style={{display:"flex"}}>{Ic.Truck}</span>Assign Order
            </button>
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div className="da-sg">
            {SCFG.map(s=>(
              <div key={s.label} className="da-stat" style={{border:`1px solid ${s.bd}`}}>
                <div style={{width:28,height:28,borderRadius:7,background:s.bg,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:8}}>
                  <span style={{color:s.color,display:"flex"}}>{s.icon}</span>
                </div>
                <div style={{fontSize:20,fontWeight:700,color:s.color,letterSpacing:"-.5px",lineHeight:1}}>{s.val??0}</div>
                <div style={{fontSize:10,color:"#94a3b8",fontWeight:500,textTransform:"uppercase",letterSpacing:".06em",marginTop:3}}>{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Table card */}
        <div style={{background:"#fff",border:"1px solid #e8edf2",borderRadius:14,overflow:"hidden",marginBottom:18}}>
          {/* Tabs + search */}
          <div style={{display:"flex",alignItems:"center",borderBottom:"1px solid #f1f5f9",padding:"0 14px",gap:2,overflowX:"auto"}}>
            {TABS.map(t=>(
              <button key={t.key} className={`da-tab ${filter===t.key?"on":""}`} onClick={()=>{setFilter(t.key);setPage(1);}}>
                {t.label}<span className="da-tbadge">{t.count}</span>
              </button>
            ))}
            <div style={{marginLeft:"auto",padding:"8px 0",flexShrink:0}}>
              <div style={{position:"relative",display:"flex",alignItems:"center"}}>
                <span style={{position:"absolute",left:8,color:"#94a3b8",display:"flex"}}>{Ic.Search}</span>
                <input value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}} placeholder="Search…"
                  style={{border:"1px solid #e2e8f0",borderRadius:8,padding:"6px 8px 6px 26px",fontSize:12,width:160,outline:"none",fontFamily:"inherit",color:"#334155",background:"#f8fafc"}}/>
              </div>
            </div>
          </div>

          <div style={{overflowX:"auto"}}>
            <table className="da-tbl">
              <thead>
                <tr>
                  <th>Agent ID</th>
                  <th>Name <span className="col-email">& Email</span></th>
                  <th className="col-phone">Phone</th>
                  <th className="col-vehicle">Vehicle</th>
                  <th>Status</th>
                  <th className="col-online">Online</th>
                  <th className="col-commission">Commission</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading && <tr><td colSpan={8} style={{textAlign:"center",padding:"44px",fontSize:13,color:"#94a3b8"}}>Loading agents…</td></tr>}
                {!loading && agents.length===0 && <tr><td colSpan={8} style={{textAlign:"center",padding:"44px",fontSize:13,color:"#94a3b8"}}>No agents found</td></tr>}
                {!loading && agents.map(a=>{
                  const s=STATUS[a.status]||STATUS.pending;
                  const isOn=a.availability==="online"&&a.status==="approved";
                  return (
                    <tr key={a._id}>
                      <td><span style={{fontFamily:"'DM Mono',monospace",fontSize:11,fontWeight:500,color:"#0d9488"}}>{a.agentId||a._id?.slice(-6)}</span></td>
                      <td>
                        <div style={{fontSize:13,fontWeight:600,color:"#0f172a"}}>{a.name}</div>
                        <div className="col-email" style={{fontSize:11,color:"#94a3b8",marginTop:1}}>{a.email}</div>
                        {a.status==="draft" && <span style={{display:"inline-block",background:"#fff7ed",border:"1px solid #fed7aa",borderRadius:4,padding:"1px 6px",fontSize:9,fontWeight:700,color:"#c2410c",marginTop:2}}>DRAFT</span>}
                      </td>
                      <td className="col-phone" style={{fontSize:12,color:"#475569"}}>{a.phone}</td>
                      <td className="col-vehicle">
                        <div style={{fontSize:12,color:"#334155",fontWeight:500,textTransform:"capitalize"}}>{a.vehicleType}</div>
                        <div style={{fontSize:11,color:"#94a3b8",fontFamily:"'DM Mono',monospace"}}>{a.vehicleNumber||a.vehicleReg||"—"}</div>
                      </td>
                      <td><span className="da-pill" style={{background:s.bg,color:s.color,borderColor:s.border}}><span className="da-pill-dot" style={{background:s.dot}}/>{a.status}</span></td>
                      <td className="col-online" style={{textAlign:"center"}}><span className={isOn?"don":"doff"}/></td>
                      <td className="col-commission" style={{textAlign:"center"}}>
                        <div style={{fontSize:13,fontWeight:700,color:"#0d9488"}}>{a.commission??7}%</div>
                        <div style={{fontSize:10,color:"#94a3b8"}}>₹{a.incentive??400}</div>
                      </td>
                      <td>
                        <div style={{display:"flex",gap:3,flexWrap:"wrap"}}>
                          <button className="da-act av" onClick={()=>openModal("view",a)}><span style={{display:"flex"}}>{Ic.Eye}</span>View</button>
                          {(a.status==="pending"||a.status==="rejected"||a.status==="draft") && <button className={`da-act ${a.status==="rejected"?"aap":"aa"}`} onClick={()=>openModal("approve",a)}><span style={{display:"flex"}}>{Ic.Check}</span>{a.status==="rejected"?"Re-Approve":"Approve"}</button>}
                          {(a.status==="pending"||a.status==="draft") && <button className="da-act adr" onClick={()=>openModal("draft",a)}><span style={{display:"flex"}}>{Ic.Draft}</span>Draft</button>}
                          {(a.status==="pending"||a.status==="approved") && <button className="da-act ar" onClick={()=>openModal("reject",a)}><span style={{display:"flex"}}>{Ic.X}</span>Reject</button>}
                          {a.status==="approved" && <button className="da-act as" onClick={()=>openModal("suspend",a)}><span style={{display:"flex"}}>{Ic.Ban}</span>Suspend</button>}
                          {a.status==="suspended" && <button className="da-act are" onClick={()=>doReactivate(a)}><span style={{display:"flex"}}>{Ic.Zap}</span>Reactivate</button>}
                          {a.status==="approved" && <button className="da-act ac" onClick={()=>{setSelected(a);setForm({commission:a.commission,incentive:a.incentive,incentiveDeliveryTarget:a.incentiveDeliveryTarget});setModal("commission");}}><span style={{display:"flex"}}>{Ic.Dollar}</span>Commission</button>}
                          <button className="da-act adl" onClick={()=>openModal("delete",a)}><span style={{display:"flex"}}>{Ic.Trash}</span>Delete</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {total>15 && (
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"11px 14px",borderTop:"1px solid #f1f5f9",flexWrap:"wrap",gap:8}}>
              <span style={{fontSize:12,color:"#94a3b8"}}>Showing {((page-1)*15)+1}–{Math.min(page*15,total)} of {total}</span>
              <div style={{display:"flex",gap:6}}>
                <button className="da-pgb" disabled={page===1} onClick={()=>setPage(p=>p-1)}>Previous</button>
                <button className="da-pgb" disabled={page*15>=total} onClick={()=>setPage(p=>p+1)}>Next</button>
              </div>
            </div>
          )}
        </div>

        {/* Online agents */}
        {onlineAgents.length>0 && (
          <div style={{background:"#fff",border:"1px solid #dcfce7",borderRadius:14,padding:"16px 18px"}}>
            <div style={{display:"flex",alignItems:"center",gap:8,fontSize:13,fontWeight:700,color:"#0f172a",marginBottom:12}}>
              <span className="don"/>Live Online Agents ({onlineAgents.length})
            </div>
            <div className="da-online-grid">
              {onlineAgents.map(a=>(
                <div key={a._id} className="da-oc">
                  <div style={{fontSize:12,fontWeight:700,color:"#0f172a",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{a.name}</div>
                  <div style={{fontSize:11,color:"#64748b",marginTop:2,fontFamily:"'DM Mono',monospace"}}>{a.agentId}</div>
                  <div style={{fontSize:11,fontWeight:600,marginTop:5,color:a.currentOrder?"#b45309":"#15803d"}}>{a.currentOrder?"On delivery":"Available"}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {nearbyMap && <NearbyAgentsMap onClose={()=>setNearbyMap(false)}/>}

      {/* Modals */}
      {modal && (
        <div className="da-overlay" onClick={e=>e.target===e.currentTarget&&closeModal()}>
          <div className={`da-modal ${(modal==="draft"||modal==="assign")?"da-modal-lg":""}`}>
            {modal==="view" && selected && <ViewModal agent={selected} onClose={closeModal}/>}

            {modal==="approve" && selected && <>
              <div className="da-mhd"><div><div className="da-mtitle">{selected.status==="rejected"?"Re-Approve Agent":"Approve Agent"}</div><div className="da-msub">{selected.name} · {selected.agentId}</div></div><button className="da-mclose" onClick={closeModal}><span style={{display:"flex"}}>{Ic.X}</span></button></div>
              <div className="da-mbody">
                <div className={`da-note ${selected.status==="rejected"?"da-note-g":""}`}>
                  <span style={{display:"flex",alignItems:"center",gap:6,fontWeight:700}}><span style={{display:"flex"}}>{Ic.Mail}</span>Agent will receive an approval email &amp; SMS notification.{selected.status==="rejected"&&<><br/><span style={{fontSize:11,opacity:.8}}>Previously rejected — approving restores full access.</span></>}</span>
                </div>
                <Fi label="Commission % per delivery" type="number" placeholder="7" value={form.commission??selected.commission??7} set={v=>setForm(p=>({...p,commission:v}))}/>
                <Fi label="Monthly incentive bonus (₹)" type="number" placeholder="400" value={form.incentive??selected.incentive??400} set={v=>setForm(p=>({...p,incentive:v}))}/>
                <Fi label="Target deliveries for bonus" type="number" placeholder="100" value={form.incentiveDeliveryTarget??selected.incentiveDeliveryTarget??100} set={v=>setForm(p=>({...p,incentiveDeliveryTarget:v}))}/>
              </div>
              <div className="da-mfooter"><button className="da-btn bc" onClick={closeModal}>Cancel</button><button className="da-btn bg" onClick={doApprove}><span style={{display:"flex"}}>{Ic.Check}</span>{selected.status==="rejected"?"Re-Approve & Notify":"Approve & Notify"}</button></div>
            </>}

            {modal==="reject" && selected && <>
              <div className="da-mhd"><div><div className="da-mtitle">Reject Application</div><div className="da-msub">{selected.name}</div></div><button className="da-mclose" onClick={closeModal}><span style={{display:"flex"}}>{Ic.X}</span></button></div>
              <div className="da-mbody"><div className="da-note" style={{background:"#fef2f2",borderColor:"#fca5a5",color:"#991b1b"}}><span style={{display:"flex",alignItems:"center",gap:6,fontWeight:700}}><span style={{display:"flex"}}>{Ic.Mail}</span>Agent will receive a rejection email &amp; SMS.</span></div><Ta label="Reason for rejection" placeholder="e.g. Incomplete documents…" value={form.reason||""} set={v=>setForm(p=>({...p,reason:v}))}/></div>
              <div className="da-mfooter"><button className="da-btn bc" onClick={closeModal}>Cancel</button><button className="da-btn br" onClick={doReject}><span style={{display:"flex"}}>{Ic.X}</span>Reject &amp; Notify</button></div>
            </>}

            {modal==="suspend" && selected && <>
              <div className="da-mhd"><div><div className="da-mtitle">Suspend Agent</div><div className="da-msub">{selected.name}</div></div><button className="da-mclose" onClick={closeModal}><span style={{display:"flex"}}>{Ic.X}</span></button></div>
              <div className="da-mbody"><div className="da-note da-note-w">Agent will be taken offline and blocked from logging in until reactivated.</div><Ta label="Reason for suspension" placeholder="e.g. Repeated complaints…" value={form.reason||""} set={v=>setForm(p=>({...p,reason:v}))}/></div>
              <div className="da-mfooter"><button className="da-btn bc" onClick={closeModal}>Cancel</button><button className="da-btn bsl" onClick={doSuspend}><span style={{display:"flex"}}>{Ic.Ban}</span>Suspend Agent</button></div>
            </>}

            {modal==="commission" && selected && <>
              <div className="da-mhd"><div><div className="da-mtitle">Update Commission</div><div className="da-msub">{selected.name}</div></div><button className="da-mclose" onClick={closeModal}><span style={{display:"flex"}}>{Ic.X}</span></button></div>
              <div className="da-mbody">
                <Fi label="Commission % per delivery" type="number" value={form.commission??selected.commission??7} set={v=>setForm(p=>({...p,commission:v}))}/>
                <Fi label="Monthly incentive bonus (₹)" type="number" value={form.incentive??selected.incentive??400} set={v=>setForm(p=>({...p,incentive:v}))}/>
                <Fi label="Target deliveries for bonus" type="number" value={form.incentiveDeliveryTarget??selected.incentiveDeliveryTarget??100} set={v=>setForm(p=>({...p,incentiveDeliveryTarget:v}))}/>
              </div>
              <div className="da-mfooter"><button className="da-btn bc" onClick={closeModal}>Cancel</button><button className="da-btn ba" onClick={doCommission}>Save Changes</button></div>
            </>}

            {modal==="draft" && selected && <>
              <div className="da-mhd"><div><div className="da-mtitle">Draft &amp; Notify</div><div className="da-msub">{selected.name} · {selected.agentId}</div></div><button className="da-mclose" onClick={closeModal}><span style={{display:"flex"}}>{Ic.X}</span></button></div>
              <div className="da-mbody">
                <div className="da-note da-note-o" style={{marginBottom:12}}><div style={{display:"flex",alignItems:"center",gap:6,fontWeight:700,marginBottom:4}}><span style={{display:"flex"}}>{Ic.Info}</span>How Draft &amp; Notify works</div><div style={{fontSize:11,lineHeight:1.55,opacity:.9}}>Tick the fields that need to be re-filled. The agent will get an <strong>Email &amp; SMS</strong>. When they re-open their form, <strong>other fields stay pre-filled</strong>.</div></div>
                {flaggedCount>0 && <div style={{marginBottom:10}}><span className="df-counter"><span style={{display:"flex"}}>{Ic.Draft}</span>{flaggedCount} field{flaggedCount>1?"s":""} flagged</span></div>}
                {DRAFT_SECTIONS.map(section=>{
                  const sc=section.fields.filter(f=>draftFields[f.key]).length;
                  const allOn=section.fields.every(f=>draftFields[f.key]);
                  return (
                    <div key={section.key} className="df-section">
                      <div className="df-sec-hd" style={{background:sc>0?section.bg:"#fff",borderBottom:sc>0?`1px solid ${section.border}`:"1px solid #f1f5f9"}}>
                        <div className="df-sec-title"><div style={{width:8,height:8,borderRadius:"50%",background:section.color,flexShrink:0}}/><span style={{color:section.color}}>{section.label}</span>{sc>0&&<span className="df-sec-badge" style={{background:section.color}}>{sc}</span>}</div>
                        <span className="df-sec-toggle" style={{color:section.color}} onClick={()=>toggleSection(section)}>{allOn?"Deselect all":"Select all"}</span>
                      </div>
                      <div className="df-fields">{section.fields.map(field=>{const isOn=!!draftFields[field.key];return(<div key={field.key} className="df-field-row" onClick={()=>toggleDraftField(field.key)}><div className={`df-cb ${isOn?"on":""}`}>{isOn&&<span style={{display:"flex",color:"#fff"}}><svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg></span>}</div><div><div className="df-label" style={{color:isOn?"#0f172a":"#334155"}}>{field.label}</div><div className="df-hint">{field.hint}</div></div></div>);})}</div>
                    </div>
                  );
                })}
                <div style={{marginTop:12}}><label className="da-label">Additional note (optional)</label><textarea className="da-ta" rows={2} placeholder="e.g. Please re-upload a clearer photo…" value={draftNote} onChange={e=>setDraftNote(e.target.value)}/></div>
                {flaggedCount>0 && <div style={{background:"#f8fafc",border:"1px solid #e2e8f0",borderRadius:10,padding:"10px 13px",marginTop:10,fontSize:12,color:"#475569",lineHeight:1.5}}><strong style={{color:"#0f172a"}}>{selected.name}</strong>, please re-fill: <strong style={{color:"#c2410c"}}>{Object.entries(draftFields).filter(([,v])=>v).map(([k])=>{for(const sec of DRAFT_SECTIONS){const f=sec.fields.find(f=>f.key===k);if(f)return f.label;}return k;}).join(", ")}</strong>.{draftNote&&<> "{draftNote}"</>}</div>}
              </div>
              <div className="da-mfooter"><button className="da-btn bc" onClick={closeModal}>Cancel</button><button className="da-btn bdr" disabled={flaggedCount===0} onClick={doDraft}><span style={{display:"flex"}}>{Ic.Draft}</span>Send Draft &amp; Notify ({flaggedCount})</button></div>
            </>}

            {modal==="delete" && selected && <>
              <div className="da-mhd"><div><div className="da-mtitle" style={{color:"#be123c"}}>Delete Application</div><div className="da-msub">{selected.name} · {selected.agentId}</div></div><button className="da-mclose" onClick={closeModal}><span style={{display:"flex"}}>{Ic.X}</span></button></div>
              <div className="da-mbody">
                <div style={{background:"#fff1f2",border:"1px solid #fda4af",borderRadius:10,padding:"12px 14px",marginBottom:16}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,fontWeight:700,color:"#be123c",fontSize:13,marginBottom:5}}><span style={{display:"flex"}}>{Ic.Trash}</span>This action is permanent and cannot be undone</div>
                  <div style={{fontSize:12,color:"#9f1239",lineHeight:1.6}}>Deleting will permanently remove all personal details, documents, bank info, and delivery history.</div>
                </div>
                <div style={{background:"#f8fafc",border:"1px solid #e2e8f0",borderRadius:10,padding:"10px 13px",marginBottom:14}}>{[["Name",selected.name],["Email",selected.email],["Phone",selected.phone],["Status",selected.status],["Agent ID",selected.agentId]].map(([k,v])=><div key={k} style={{display:"flex",justifyContent:"space-between",fontSize:12,padding:"3px 0",borderBottom:"1px solid #f1f5f9"}}><span style={{color:"#64748b"}}>{k}</span><span style={{color:"#0f172a",fontWeight:600}}>{v||"—"}</span></div>)}</div>
                <div className="da-field"><label className="da-label" style={{color:"#be123c"}}>Type <strong style={{fontFamily:"'DM Mono',monospace"}}>{selected.name}</strong> to confirm</label><input className="da-del-input" placeholder={`Type "${selected.name}" to confirm…`} value={deleteConfirm} onChange={e=>setDeleteConfirm(e.target.value)} autoComplete="off"/>{deleteConfirm.length>0&&deleteConfirm!==selected.name&&<div style={{fontSize:11,color:"#be123c",marginTop:4,fontWeight:600}}>Name doesn't match.</div>}</div>
              </div>
              <div className="da-mfooter"><button className="da-btn bc" onClick={closeModal}>Cancel</button><button className="da-btn bdl" disabled={deleteConfirm!==selected.name} onClick={doDelete}><span style={{display:"flex"}}>{Ic.Trash}</span>Delete Permanently</button></div>
            </>}

            {modal==="assign" && <>
              <div className="da-mhd"><div><div className="da-mtitle">Assign Order</div><div className="da-msub">{assignStep===1?"Step 1 — Select agent & order":assignStep===2?"Step 2 — Choose task type":"Step 3 — Set location & confirm"}</div></div><button className="da-mclose" onClick={closeModal}><span style={{display:"flex"}}>{Ic.X}</span></button></div>
              <div className="da-mbody">
                <div className="da-steps">
                  {[{n:1,l:"Agent & Order"},{n:2,l:"Order Type"},{n:3,l:"Location"}].map((s,i,arr)=>(
                    <div key={s.n} style={{display:"flex",alignItems:"center",flex:i<arr.length-1?1:"none"}}>
                      <div style={{display:"flex",alignItems:"center",gap:6}}>
                        <div className={`da-sn ${assignStep>s.n?"sd":assignStep===s.n?"sa":"sp"}`}>{assignStep>s.n?<span style={{display:"flex"}}>{Ic.Check}</span>:s.n}</div>
                        <span className={`da-sl ${assignStep===s.n?"on":""}`}>{s.l}</span>
                      </div>
                      {i<arr.length-1&&<div className={`da-sline ${assignStep>s.n?"d":""}`}/>}
                    </div>
                  ))}
                </div>
                {assignStep===1 && <>
                  <div className="da-field"><label className="da-label">Select Online Agent</label>
                    <select className="da-sel" value={assignData.agentId} onChange={e=>setAssignData(p=>({...p,agentId:e.target.value}))}>
                      <option value="">— Choose an available agent —</option>
                      {onlineAgents.filter(a=>!a.currentOrder).map(a=><option key={a._id} value={a._id}>{a.name} · {a.agentId}</option>)}
                    </select>
                    {onlineAgents.filter(a=>!a.currentOrder).length===0&&<div style={{fontSize:12,color:"#b45309",marginTop:5}}>No available agents online right now.</div>}
                  </div>
                  <div className="da-field" style={{marginBottom:0}}>
                    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:5}}>
                      <label className="da-label" style={{marginBottom:0}}>Select Order</label>
                      <button onClick={fetchOrders} style={{display:"flex",alignItems:"center",gap:4,border:"none",background:"none",fontSize:11,color:"#0369a1",cursor:"pointer",fontFamily:"inherit",fontWeight:600,padding:0}}><span style={{display:"flex"}}>{Ic.Refresh}</span>Refresh</button>
                    </div>
                    <div style={{position:"relative"}}><span style={{position:"absolute",left:9,top:"50%",transform:"translateY(-50%)",color:"#94a3b8",display:"flex",pointerEvents:"none"}}>{Ic.Search}</span><input className="op-search" placeholder="Search orders…" value={orderSearch} onChange={e=>setOrderSearch(e.target.value)}/></div>
                    <div className="op-list">
                      {ordersLoading ? <div className="op-empty">Loading orders…</div> : filteredOrders.length===0 ? <div className="op-empty">{orders.length===0?"No active orders":"No orders match"}</div> :
                        filteredOrders.map(o=>{
                          const isSel=assignData.orderId===o._id;
                          const cn=o.address?.fullName||o.userId?.name||o.userId?.email||"Customer";
                          const sc=ORDER_STATUS_COLOR[o.orderStatus]||"#64748b";
                          return (
                            <div key={o._id} className={`op-item ${isSel?"sel":""}`} onClick={()=>{setAssignData(p=>({...p,orderId:o._id,location:[o.address?.addressLine,o.address?.city,o.address?.state,o.address?.pincode].filter(Boolean).join(", ")}));setSelectedOrder(o);}}>
                              <div style={{flex:1,minWidth:0}}>
                                <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:2}}><span className="op-id">#{o._id?.slice(-8).toUpperCase()}</span><span className="op-badge" style={{color:sc,borderColor:sc,background:`${sc}15`}}>{o.orderStatus}</span></div>
                                <div className="op-name">{cn}</div>
                                <div className="op-meta">{o.items?.length||0} item(s) · {o.address?.city||"—"}</div>
                              </div>
                              <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:4,flexShrink:0}}>
                                <span style={{fontSize:12,fontWeight:700,color:"#1e293b"}}>₹{o.totalAmount?.toFixed(2)||"—"}</span>
                                {isSel&&<span style={{display:"flex",color:"#3b82f6"}}>{Ic.Check}</span>}
                              </div>
                            </div>
                          );
                        })
                      }
                    </div>
                    {selectedOrder && <div className="op-selected-card"><span style={{display:"flex",color:"#3b82f6"}}>{Ic.Check}</span><div style={{flex:1}}><div style={{fontSize:12,fontWeight:700,color:"#1d4ed8"}}>#{selectedOrder._id?.slice(-8).toUpperCase()} selected</div><div style={{fontSize:11,color:"#64748b",marginTop:1}}>{selectedOrder.address?.fullName||selectedOrder.userId?.name||"—"} · ₹{selectedOrder.totalAmount?.toFixed(2)||"—"}</div></div><button onClick={()=>{setSelectedOrder(null);setAssignData(p=>({...p,orderId:"",location:""}));}} style={{border:"none",background:"none",cursor:"pointer",color:"#94a3b8",display:"flex",padding:2}}>{Ic.X}</button></div>}
                  </div>
                </>}
                {assignStep===2 && <>
                  <div style={{fontSize:13,color:"#64748b",marginBottom:14,fontWeight:500}}>What type of task should the agent perform?</div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                    {[{key:"pickup",title:"Pickup",desc:"Agent collects item from a location",icon:Ic.PackLg,ic:"#166534",ib:"#f0fdf4"},{key:"delivery",title:"Delivery",desc:"Agent delivers item to customer",icon:Ic.TruckLg,ic:"#1d4ed8",ib:"#eff6ff"}].map(t=>(
                      <div key={t.key} className={`da-otype ${assignData.orderType===t.key?"sel":""}`} onClick={()=>setAssignData(p=>({...p,orderType:t.key}))}>
                        <div className="da-oi" style={{background:assignData.orderType===t.key?t.ib:"#f8fafc"}}><span style={{display:"flex",color:assignData.orderType===t.key?t.ic:"#94a3b8"}}>{t.icon}</span></div>
                        <div className="da-ot">{t.title}</div><div className="da-od">{t.desc}</div>
                      </div>
                    ))}
                  </div>
                </>}
                {assignStep===3 && <>
                  <div className="da-note">This address will be shown on the agent's dashboard for navigation.</div>
                  <div className="da-field"><label className="da-label">{assignData.orderType==="pickup"?"Pickup Location":"Delivery Location"}</label>
                    <div className="da-iwr"><span className="da-ii">{Ic.Pin}</span><input className="da-input da-ipl" placeholder="e.g. 45B Vaishali Nagar, Jaipur" value={assignData.location} onChange={e=>setAssignData(p=>({...p,location:e.target.value}))}/></div>
                  </div>
                  <div className="da-sum">
                    <div style={{fontSize:10,fontWeight:700,color:"#94a3b8",textTransform:"uppercase",letterSpacing:".08em",marginBottom:10}}>Assignment Summary</div>
                    {[["Agent",onlineAgents.find(a=>a._id===assignData.agentId)?.name||"—"],["Order ID",`#${selectedOrder?._id?.slice(-8).toUpperCase()||"—"}`],["Customer",selectedOrder?.address?.fullName||selectedOrder?.userId?.name||"—"],["Amount",selectedOrder?`₹${selectedOrder.totalAmount?.toFixed(2)}`:"—"],["Task",assignData.orderType==="pickup"?"Pickup":"Delivery"],["Location",assignData.location||"—"]].map(([k,v])=>(
                      <div key={k} style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:6}}><span style={{color:"#64748b",fontWeight:500}}>{k}</span><span style={{color:"#0f172a",fontWeight:600,textAlign:"right",maxWidth:"58%",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{v}</span></div>
                    ))}
                  </div>
                </>}
              </div>
              <div className="da-mfooter">
                {assignStep>1?<button className="da-btn bc" onClick={()=>setAssignStep(s=>s-1)}>Back</button>:<button className="da-btn bc" onClick={closeModal}>Cancel</button>}
                {assignStep<3?<button className="da-btn bp" disabled={(assignStep===1&&(!assignData.agentId||!assignData.orderId))||(assignStep===2&&!assignData.orderType)} onClick={()=>setAssignStep(s=>s+1)}>Continue <span style={{display:"flex"}}>{Ic.Arrow}</span></button>:<button className="da-btn bt" disabled={!assignData.location.trim()} onClick={doAssign}>Confirm &amp; Assign</button>}
              </div>
            </>}
          </div>
        </div>
      )}
    </div>
  );
}

function ViewModal({ agent:a, onClose }) {
  const s=STATUS[a.status]||STATUS.pending;
  const VR=({l,v})=><div className="da-vrow"><span className="da-vk">{l}</span><span className="da-vv">{v||"—"}</span></div>;
  const ALL_FIELDS={};
  DRAFT_SECTIONS.forEach(sec=>sec.fields.forEach(f=>{ALL_FIELDS[f.key]=f.label;}));
  return (
    <>
      <div className="da-mhd"><div><div style={{display:"flex",alignItems:"center",gap:9}}><div className="da-mtitle">{a.name}</div><span className="da-pill" style={{background:s.bg,color:s.color,borderColor:s.border}}><span className="da-pill-dot" style={{background:s.dot}}/>{a.status}</span></div><div style={{fontFamily:"'DM Mono',monospace",fontSize:11,color:"#0d9488",fontWeight:600,marginTop:3}}>{a.agentId}</div></div>
        <button className="da-mclose" onClick={onClose}><span style={{display:"flex"}}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></span></button></div>
      <div className="da-mbody">
        {a.status==="draft"&&a.fieldsToRevise?.length>0&&<><div className="da-vsec">Pending Revision</div><div style={{background:"#fff7ed",border:"1px solid #fed7aa",borderRadius:8,padding:"10px 13px",marginBottom:4}}><div style={{fontSize:11,fontWeight:700,color:"#9a3412",marginBottom:6}}>Agent must re-fill:</div><div style={{display:"flex",flexWrap:"wrap",gap:5}}>{a.fieldsToRevise.map(k=><span key={k} style={{background:"#fef3c7",border:"1px solid #fcd34d",borderRadius:5,padding:"2px 8px",fontSize:11,fontWeight:600,color:"#92400e"}}>{ALL_FIELDS[k]||k}</span>)}</div>{a.draftNote&&<div style={{fontSize:11,color:"#9a3412",marginTop:7,fontStyle:"italic"}}>Admin note: "{a.draftNote}"</div>}</div></>}
        <div className="da-vsec">Personal</div>
        <VR l="Phone" v={a.phone}/><VR l="Email" v={a.email}/><VR l="Joined" v={new Date(a.createdAt).toLocaleDateString("en-IN",{dateStyle:"medium"})}/>
        <div className="da-vsec">Vehicle</div>
        <VR l="Type" v={a.vehicleType}/><VR l="Registration" v={a.vehicleNumber||a.vehicleReg}/><VR l="Licence" v={a.drivingLicence}/><VR l="PAN" v={a.panCard}/>
        <div className="da-vsec">Bank & Payment</div>
        <VR l="Bank" v={a.bankDetails?.bankName}/><VR l="Account" v={a.bankDetails?.accountNumber?"••••"+a.bankDetails.accountNumber.slice(-4):null}/><VR l="IFSC" v={a.bankDetails?.ifscCode}/><VR l="UPI ID" v={a.upiId}/>
        <div className="da-vsec">Commission</div>
        <VR l="Per Delivery" v={`${a.commission??7}%`}/><VR l="Monthly Bonus" v={`₹${a.incentive??400}`}/><VR l="Target" v={`${a.incentiveDeliveryTarget??100} deliveries`}/>
        {a.rejectionReason&&<><div className="da-vsec">Rejection Info</div><div style={{background:"#fef2f2",border:"1px solid #fca5a5",borderRadius:8,padding:"10px 13px"}}><span style={{fontSize:12,fontWeight:600,color:"#991b1b"}}>Reason: {a.rejectionReason}</span></div></>}
        <div className="da-vsec">Documents</div>
        {[["Aadhaar / ID Proof",a.documents?.aadhaar],["Driving Licence Copy",a.documents?.licenceCopy],["Vehicle RC",a.documents?.vehicleRC],["Passport Photo",a.documents?.passportPhoto],["UPI QR Code",a.documents?.upiQrImage]].map(([l,url])=>(
          <div key={l} className="da-vrow"><span className="da-vk">{l}</span>{url?<a href={url} target="_blank" rel="noreferrer" className="da-dl"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>View</a>:<span style={{fontSize:11,color:"#cbd5e1"}}>Not uploaded</span>}</div>
        ))}
        {a.approvalNote&&<div style={{background:"#fefce8",border:"1px solid #fde047",borderRadius:8,padding:"10px 13px",marginTop:12}}><span style={{fontSize:12,fontWeight:600,color:"#854d0e"}}>Admin Note: {a.approvalNote}</span></div>}
      </div>
      <div className="da-mfooter"><button className="da-btn bc" style={{flex:"none",padding:"9px 20px"}} onClick={onClose}>Close</button></div>
    </>
  );
}

const Fi = ({label,set,...p}) => <div className="da-field"><label className="da-label">{label}</label><input className="da-input" {...p} onChange={e=>set(e.target.value)}/></div>;
const Ta = ({label,set,...p}) => <div className="da-field"><label className="da-label">{label}</label><textarea className="da-ta" rows={3} {...p} onChange={e=>set(e.target.value)}/></div>;
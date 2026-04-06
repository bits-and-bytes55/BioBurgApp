import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { BASE_API, C, GS } from "./_pharmacySharedUtils";
import { PageHeader, SearchBar, RejectModal, DetailModal, PharmacyTable } from "./_pharmacyShared";

export default function PharmacyAllPharmacies(){
  const [pharmacies,setPharmacies]=useState([]);
  const [loading,setLoading]=useState(true);
  const [lastSync,setLastSync]=useState(null);
  const [search,setSearch]=useState("");
  const [sort,setSort]=useState("newest");
  const [expandedId,setExpandedId]=useState(null);
  const [actionLoading,setActionLoading]=useState(null);
  const [rejectTarget,setRejectTarget]=useState(null);
  const [detailTarget,setDetailTarget]=useState(null);
  const token=localStorage.getItem("adminToken");

  const fetchData=useCallback(async(silent=false)=>{
    if(!silent)setLoading(true);
    try{
      const res=await axios.get(`${BASE_API}/api/pharmacy/all`,{headers:{Authorization:`Bearer ${token}`}});
      setPharmacies(res.data.pharmacies||[]);setLastSync(new Date());
    }catch{if(!silent)toast.error("Failed to load pharmacies");}
    finally{setLoading(false);}
  },[token]);

  useEffect(()=>{fetchData();const iv=setInterval(()=>fetchData(true),30000);return()=>clearInterval(iv);},[fetchData]);

  const handleApprove=async(id,name)=>{
    setActionLoading(id+"-approve");
    try{
      await axios.patch(`${BASE_API}/api/pharmacy/approve/${id}`,{},{headers:{Authorization:`Bearer ${token}`}});
      toast.success(`${name} approved`);fetchData(true);
    }catch(err){toast.error(err?.response?.data?.message||"Failed");}
    finally{setActionLoading(null);}
  };
  const handleRejectConfirm=async(reason)=>{
    if(!rejectTarget)return;setActionLoading(rejectTarget._id+"-reject");
    try{
      await axios.patch(`${BASE_API}/api/pharmacy/reject/${rejectTarget._id}`,{reason},{headers:{Authorization:`Bearer ${token}`}});
      toast.success(`${rejectTarget.facilityName} rejected`);setRejectTarget(null);fetchData(true);
    }catch(err){toast.error(err?.response?.data?.message||"Failed");}
    finally{setActionLoading(null);}
  };

  const filtered=pharmacies
    .filter(p=>{
      const q=search.toLowerCase();
      return!q||p.facilityName?.toLowerCase().includes(q)||p.email?.toLowerCase().includes(q)||p.city?.toLowerCase().includes(q)||p.licenseNumber?.toLowerCase().includes(q)||p.drugLicenseNumber?.toLowerCase().includes(q)||p.contactPerson?.toLowerCase().includes(q)||p.state?.toLowerCase().includes(q);
    })
    .sort((a,b)=>{
      if(sort==="newest") return new Date(b.createdAt)-new Date(a.createdAt);
      if(sort==="oldest") return new Date(a.createdAt)-new Date(b.createdAt);
      if(sort==="name")   return(a.facilityName||"").localeCompare(b.facilityName||"");
      return 0;
    });

  return(
    <div style={{fontFamily:"'Inter','Segoe UI',system-ui,sans-serif"}}>
      <style>{GS}</style>
      <PageHeader title="Pharmacy Zone — All Pharmacies" sub={`${pharmacies.length} pharmacies registered on platform`} lastSync={lastSync} onRefresh={()=>fetchData()}/>

      <div style={{background:"#fff",borderRadius:14,padding:"10px 14px",border:`1px solid ${C.border}`,boxShadow:"0 1px 3px rgba(0,0,0,0.04)",marginBottom:20,display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"}}>
        <SearchBar value={search} onChange={setSearch} placeholder="Search name, email, city, state, license number..."/>
        <select value={sort} onChange={e=>setSort(e.target.value)}
          style={{padding:"8px 12px",borderRadius:9,border:`1.5px solid ${C.border2}`,fontSize:13,background:C.bg,color:"#334155",fontFamily:"inherit",cursor:"pointer",outline:"none"}}>
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="name">Name A–Z</option>
        </select>
        <span style={{fontSize:12.5,color:"#cbd5e1",whiteSpace:"nowrap",marginLeft:"auto"}}>{filtered.length} of {pharmacies.length} records</span>
      </div>

      <PharmacyTable pharmacies={filtered} loading={loading} expandedId={expandedId} setExpandedId={setExpandedId}
        onDetail={setDetailTarget} onApprove={handleApprove} onReject={setRejectTarget} actionLoading={actionLoading}
        emptyMsg="No pharmacies match your search"/>

      {detailTarget&&<DetailModal pharmacy={detailTarget} onClose={()=>setDetailTarget(null)} onApprove={handleApprove} onReject={p=>{setDetailTarget(null);setRejectTarget(p);}}/>}
      {rejectTarget&&<RejectModal pharmacy={rejectTarget} onConfirm={handleRejectConfirm} onCancel={()=>setRejectTarget(null)} loading={!!actionLoading}/>}
    </div>
  );
}
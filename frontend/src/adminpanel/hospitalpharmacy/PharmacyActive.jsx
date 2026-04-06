import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { BASE_API, C, GS } from "./_pharmacySharedUtils";
import { PageHeader, SearchBar, RejectModal, DetailModal, PharmacyTable } from "./_pharmacyShared";

export default function PharmacyActive(){
  const [pharmacies,setPharmacies]=useState([]);
  const [loading,setLoading]=useState(true);
  const [lastSync,setLastSync]=useState(null);
  const [search,setSearch]=useState("");
  const [expandedId,setExpandedId]=useState(null);
  const [actionLoading,setActionLoading]=useState(null);
  const [rejectTarget,setRejectTarget]=useState(null);
  const [detailTarget,setDetailTarget]=useState(null);
  const token=localStorage.getItem("adminToken");

  const fetchData=useCallback(async(silent=false)=>{
    if(!silent)setLoading(true);
    try{
      const res=await axios.get(`${BASE_API}/api/pharmacy/all`,{headers:{Authorization:`Bearer ${token}`}});
      setPharmacies((res.data.pharmacies||[]).filter(p=>p.status==="approved"));setLastSync(new Date());
    }catch{if(!silent)toast.error("Failed to load pharmacies");}
    finally{setLoading(false);}
  },[token]);

  useEffect(()=>{fetchData();const iv=setInterval(()=>fetchData(true),30000);return()=>clearInterval(iv);},[fetchData]);

  const handleRejectConfirm=async(reason)=>{
    if(!rejectTarget)return;setActionLoading(rejectTarget._id+"-reject");
    try{
      await axios.patch(`${BASE_API}/api/pharmacy/reject/${rejectTarget._id}`,{reason},{headers:{Authorization:`Bearer ${token}`}});
      toast.success(`${rejectTarget.facilityName} rejected`);setRejectTarget(null);fetchData(true);
    }catch(err){toast.error(err?.response?.data?.message||"Failed");}
    finally{setActionLoading(null);}
  };

  const filtered=pharmacies.filter(p=>{
    const q=search.toLowerCase();
    return!q||p.facilityName?.toLowerCase().includes(q)||p.email?.toLowerCase().includes(q)||p.city?.toLowerCase().includes(q)||p.state?.toLowerCase().includes(q)||p.licenseNumber?.toLowerCase().includes(q);
  });

  // Quick stats from real data
  const [totalOrders, setTotalOrders] = useState("—");
useEffect(()=>{
  axios.get(`${BASE_API}/api/hospital/orders`,{headers:{Authorization:`Bearer ${token}`}})
    .then(res=>{const all=Array.isArray(res.data)?res.data:(res.data.orders||[]);setTotalOrders(all.length);})
    .catch(()=>{});
},[token]);

  return(
    <div style={{fontFamily:"'Inter','Segoe UI',system-ui,sans-serif"}}>
      <style>{GS}</style>
      <PageHeader title="Pharmacy Zone — Active Pharmacies" sub="All approved pharmacies currently live on the platform" lastSync={lastSync} onRefresh={()=>fetchData()}/>

      {/* Quick stats */}
      <div style={{display:"flex",gap:14,marginBottom:22}}>
        {[
          ["Active Pharmacies",pharmacies.length,C.green],
          ["Total Orders", totalOrders, C.primary],
          ["States Covered",Object.keys(pharmacies.reduce((a,p)=>{if(p.state)a[p.state]=1;return a},{})).length,C.violet||"#7c3aed"],
        ].map(([l,v,c])=>(
          <div key={l} style={{background:"#fff",borderRadius:12,padding:"18px 22px",border:`1px solid ${C.border}`,borderTop:`3px solid ${c}`,flex:1,boxShadow:"0 1px 3px rgba(0,0,0,0.05)"}}>
            <div style={{fontSize:30,fontWeight:800,color:C.text,letterSpacing:"-1.5px",lineHeight:1}}>{v}</div>
            <div style={{fontSize:10.5,color:C.muted,marginTop:5,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.07em"}}>{l}</div>
          </div>
        ))}
      </div>

      <div style={{background:"#fff",borderRadius:14,padding:"10px 14px",border:`1px solid ${C.border}`,boxShadow:"0 1px 3px rgba(0,0,0,0.04)",marginBottom:20,display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"}}>
        <SearchBar value={search} onChange={setSearch} placeholder="Search active pharmacies..."/>
        <span style={{fontSize:12.5,color:"#cbd5e1",marginLeft:"auto"}}>{filtered.length} active</span>
      </div>

      <PharmacyTable pharmacies={filtered} loading={loading} expandedId={expandedId} setExpandedId={setExpandedId}
        onDetail={setDetailTarget} onApprove={()=>{}} onReject={setRejectTarget} actionLoading={actionLoading}
        emptyMsg="No active pharmacies match your search"/>

      {detailTarget&&<DetailModal pharmacy={detailTarget} onClose={()=>setDetailTarget(null)} onApprove={()=>{}} onReject={p=>{setDetailTarget(null);setRejectTarget(p);}}/>}
      {rejectTarget&&<RejectModal pharmacy={rejectTarget} onConfirm={handleRejectConfirm} onCancel={()=>setRejectTarget(null)} loading={!!actionLoading}/>}
    </div>
  );
}
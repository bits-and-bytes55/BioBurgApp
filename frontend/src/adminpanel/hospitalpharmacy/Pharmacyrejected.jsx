import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { BASE_API, C, GS } from "./_pharmacySharedUtils";
import { PageHeader, SearchBar, RejectModal, DetailModal, PharmacyTable } from "./_pharmacyShared";

export default function PharmacyRejected(){
  const [pharmacies,setPharmacies]=useState([]);
  const [loading,setLoading]=useState(true);
  const [lastSync,setLastSync]=useState(null);
  const [search,setSearch]=useState("");
  const [actionLoading,setActionLoading]=useState(null);
  const [detailTarget,setDetailTarget]=useState(null);
  const token=localStorage.getItem("adminToken");

  const fetchData=useCallback(async(silent=false)=>{
    if(!silent)setLoading(true);
    try{
      const res=await axios.get(`${BASE_API}/api/pharmacy/all`,{headers:{Authorization:`Bearer ${token}`}});
      setPharmacies((res.data.pharmacies||[]).filter(p=>p.status==="rejected"));setLastSync(new Date());
    }catch{if(!silent)toast.error("Failed to load pharmacies");}
    finally{setLoading(false);}
  },[token]);

  useEffect(()=>{fetchData();const iv=setInterval(()=>fetchData(true),30000);return()=>clearInterval(iv);},[fetchData]);

  const handleApprove=async(id,name)=>{
    setActionLoading(id+"-approve");
    try{
      await axios.patch(`${BASE_API}/api/pharmacy/approve/${id}`,{},{headers:{Authorization:`Bearer ${token}`}});
      toast.success(`${name} re-approved`);fetchData(true);
    }catch(err){toast.error(err?.response?.data?.message||"Failed");}
    finally{setActionLoading(null);}
  };

  const filtered=pharmacies.filter(p=>{
    const q=search.toLowerCase();
    return!q||p.facilityName?.toLowerCase().includes(q)||p.email?.toLowerCase().includes(q)||p.city?.toLowerCase().includes(q)||p.state?.toLowerCase().includes(q)||p.licenseNumber?.toLowerCase().includes(q)||p.drugLicenseNumber?.toLowerCase().includes(q);
  });

  if(loading)return(
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:14,padding:"80px 0"}}>
      <style>{GS}</style>
      <div style={{width:36,height:36,border:`3px solid ${C.border2}`,borderTopColor:C.primary,borderRadius:"50%",animation:"ph-spin 0.9s linear infinite"}}/>
      <div style={{fontSize:13,color:C.muted}}>Loading rejected pharmacies...</div>
    </div>
  );

  return(
    <div style={{fontFamily:"'Inter','Segoe UI',system-ui,sans-serif"}}>
      <style>{GS}</style>
      <PageHeader title="Pharmacy Zone — Rejected Pharmacies" sub="Pharmacies that have been denied platform access" lastSync={lastSync} onRefresh={()=>fetchData()}/>

      <div style={{background:"#fff",borderRadius:14,padding:"10px 14px",border:`1px solid ${C.border}`,boxShadow:"0 1px 3px rgba(0,0,0,0.04)",marginBottom:20,display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"}}>
        <SearchBar value={search} onChange={setSearch} placeholder="Search rejected pharmacies..."/>
        <span style={{fontSize:12.5,color:"#cbd5e1",marginLeft:"auto"}}>{filtered.length} rejected</span>
      </div>

      {filtered.length===0?(
        <div style={{background:"#fff",borderRadius:14,padding:"64px 24px",border:`1px solid ${C.border}`,textAlign:"center"}}>
          <div style={{fontSize:13,fontWeight:600,color:"#cbd5e1"}}>No rejected pharmacies{search?" matching your search":""}</div>
        </div>
      ):(
        <div style={{background:"#fff",borderRadius:14,border:`1px solid ${C.border}`,boxShadow:"0 1px 3px rgba(0,0,0,0.05)",overflow:"hidden"}}>
          <div style={{overflowX:"auto"}}>
            <table style={{width:"100%",borderCollapse:"collapse",minWidth:820}}>
              <thead>
                <tr style={{background:C.bg,borderBottom:`1.5px solid ${C.border2}`}}>
                  {["Pharmacy","Contact","Location","License No.","Rejected On","Rejection Reason","Action"].map(c=>(
                    <th key={c} style={{padding:"12px 16px",textAlign:"left",fontSize:10.5,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.07em",whiteSpace:"nowrap"}}>{c}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((p,i)=>(
                  <tr key={p._id} style={{borderBottom:i<filtered.length-1?`1px solid ${C.border}`:"none",background:"#fff"}}
                    onMouseEnter={e=>e.currentTarget.style.background="#fafafa"}
                    onMouseLeave={e=>e.currentTarget.style.background="#fff"}>
                    <td style={{padding:"14px 16px",cursor:"pointer"}} onClick={()=>setDetailTarget(p)}>
                      <div style={{fontWeight:700,color:C.text,fontSize:14}}>{p.facilityName}</div>
                      <div style={{color:C.muted,fontSize:12,marginTop:2}}>{p.email}</div>
                    </td>
                    <td style={{padding:"14px 16px"}}>
                      <div style={{fontSize:13,color:"#334155"}}>{p.contactPerson||"—"}</div>
                      <div style={{fontSize:12,color:C.muted,marginTop:1}}>{p.phone||""}</div>
                    </td>
                    <td style={{padding:"14px 16px"}}>
                      <div style={{fontSize:13,color:"#334155"}}>{p.city||"—"}</div>
                      <div style={{fontSize:12,color:C.muted,marginTop:1}}>{p.state||""}</div>
                    </td>
                    <td style={{padding:"14px 16px",fontSize:12.5,color:C.slate,fontFamily:"ui-monospace,monospace"}}>{p.licenseNumber||p.drugLicenseNumber||"—"}</td>
                    <td style={{padding:"14px 16px",fontSize:12,color:C.muted,whiteSpace:"nowrap"}}>
                      {p.updatedAt?new Date(p.updatedAt).toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"}):"—"}
                    </td>
                    <td style={{padding:"14px 16px",maxWidth:220}}>
                      {p.rejectionReason?(
                        <div style={{fontSize:12.5,color:"#7f1d1d",background:C.redLight,border:`1px solid ${C.redBorder}`,borderRadius:7,padding:"5px 10px",lineHeight:1.5}}>{p.rejectionReason}</div>
                      ):(
                        <span style={{fontSize:12,color:C.muted,fontStyle:"italic"}}>No reason provided</span>
                      )}
                    </td>
                    <td style={{padding:"14px 16px"}}>
                      <button onClick={()=>handleApprove(p._id,p.facilityName)} disabled={actionLoading===p._id+"-approve"}
                        style={{padding:"7px 16px",borderRadius:8,border:"none",background:C.green,color:"#fff",fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:"inherit",whiteSpace:"nowrap",opacity:actionLoading===p._id+"-approve"?0.7:1}}>
                        {actionLoading===p._id+"-approve"?"...":"Re-approve"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {detailTarget&&<DetailModal pharmacy={detailTarget} onClose={()=>setDetailTarget(null)} onApprove={handleApprove} onReject={()=>{}}/>}
    </div>
  );
}
import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { BASE_API, C, GS } from "./_pharmacySharedUtils";
import { PageHeader, SearchBar, RejectModal, DetailModal, PharmacyTable } from "./_pharmacyShared";

export default function PharmacyPending(){
  const [pharmacies,setPharmacies]=useState([]);
  const [loading,setLoading]=useState(true);
  const [lastSync,setLastSync]=useState(null);
  const [search,setSearch]=useState("");
  const [actionLoading,setActionLoading]=useState(null);
  const [rejectTarget,setRejectTarget]=useState(null);
  const [detailTarget,setDetailTarget]=useState(null);
  const token=localStorage.getItem("adminToken");

  const fetchData=useCallback(async(silent=false)=>{
    if(!silent)setLoading(true);
    try{
      const res=await axios.get(`${BASE_API}/api/pharmacy/all`,{headers:{Authorization:`Bearer ${token}`}});
      setPharmacies((res.data.pharmacies||[]).filter(p=>p.status==="pending"));setLastSync(new Date());
    }catch{if(!silent)toast.error("Failed to load pharmacies");}
    finally{setLoading(false);}
  },[token]);

  useEffect(()=>{fetchData();const iv=setInterval(()=>fetchData(true),30000);return()=>clearInterval(iv);},[fetchData]);

  const handleApprove=async(id,name)=>{
    setActionLoading(id);
    try{
      await axios.patch(`${BASE_API}/api/pharmacy/approve/${id}`,{},{headers:{Authorization:`Bearer ${token}`}});
      toast.success(`${name} approved`);fetchData(true);
    }catch(err){toast.error(err?.response?.data?.message||"Failed");}
    finally{setActionLoading(null);}
  };
  const handleRejectConfirm=async(reason)=>{
    if(!rejectTarget)return;setActionLoading(rejectTarget._id);
    try{
      await axios.patch(`${BASE_API}/api/pharmacy/reject/${rejectTarget._id}`,{reason},{headers:{Authorization:`Bearer ${token}`}});
      toast.success(`${rejectTarget.facilityName} rejected`);setRejectTarget(null);fetchData(true);
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
      <div style={{fontSize:13,color:C.muted}}>Loading pending pharmacies...</div>
    </div>
  );

  const DetailView=({p,onClose})=>{
    if(!p)return null;
    const fields=[["Contact Person",p.contactPerson],["Phone",p.phone],["City",p.city],["State",p.state],["Pin Code",p.pinCode],["License No.",p.licenseNumber||p.drugLicenseNumber],["GST No.",p.gstNumber],["PAN No.",p.panNumber],["Facility Type",p.facilityType],["Est. Year",p.establishedYear]].filter(([,v])=>v);
    return(
      <div style={{position:"fixed",inset:0,background:"rgba(15,23,42,0.55)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:9999,padding:24,backdropFilter:"blur(2px)"}} onClick={onClose}>
        <div style={{background:"#fff",borderRadius:20,width:"100%",maxWidth:620,boxShadow:"0 30px 80px rgba(0,0,0,0.25)",overflow:"hidden",maxHeight:"90vh",display:"flex",flexDirection:"column"}} onClick={e=>e.stopPropagation()}>
          <div style={{background:`linear-gradient(135deg,${C.primary},${C.primaryDark})`,padding:"28px 32px",flexShrink:0}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
              <div>
                <h2 style={{margin:0,fontSize:22,fontWeight:800,color:"#fff"}}>{p.facilityName}</h2>
                <p style={{margin:"5px 0 0",fontSize:13,color:"rgba(255,255,255,0.65)"}}>{p.email}</p>
              </div>
              <button onClick={onClose} style={{background:"rgba(255,255,255,0.15)",border:"none",color:"#fff",width:34,height:34,borderRadius:9,cursor:"pointer",fontSize:16,display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
            </div>
            <div style={{marginTop:14}}><StatusBadge status="pending"/></div>
          </div>
          <div style={{padding:"28px 32px",overflowY:"auto",flex:1}}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"18px 32px"}}>
              {fields.map(([label,val])=>(
                <div key={label}>
                  <div style={{fontSize:10.5,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:3}}>{label}</div>
                  <div style={{fontSize:14,color:"#1e293b",fontWeight:500}}>{val}</div>
                </div>
              ))}
            </div>
            {p.address&&<div style={{marginTop:20,paddingTop:20,borderTop:`1px solid ${C.border}`}}>
              <div style={{fontSize:10.5,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:4}}>Address</div>
              <div style={{fontSize:13.5,color:"#334155",lineHeight:1.6}}>{p.address}</div>
            </div>}
          </div>
          <div style={{padding:"16px 32px 28px",display:"flex",gap:10,borderTop:`1px solid ${C.border}`,flexShrink:0}}>
            <button onClick={onClose} style={{flex:1,padding:"11px",borderRadius:9,border:`1.5px solid ${C.border2}`,background:C.bg,fontWeight:600,fontSize:13,cursor:"pointer",fontFamily:"inherit",color:C.slate}}>Close</button>
            <button onClick={()=>{handleApprove(p._id,p.facilityName);onClose();}} disabled={actionLoading===p._id}
              style={{flex:1,padding:"11px",borderRadius:9,border:"none",background:C.green,color:"#fff",fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"inherit",opacity:actionLoading===p._id?0.7:1}}>
              {actionLoading===p._id?"Approving...":"Approve Pharmacy"}
            </button>
            <button onClick={()=>{onClose();setRejectTarget(p);}}
              style={{flex:1,padding:"11px",borderRadius:9,border:"none",background:C.red,color:"#fff",fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>Reject</button>
          </div>
        </div>
      </div>
    );
  };

  return(
    <div style={{fontFamily:"'Inter','Segoe UI',system-ui,sans-serif"}}>
      <style>{GS}</style>
      <PageHeader title="Pharmacy Zone — Pending Approvals" sub="Pharmacies waiting for admin review and verification" lastSync={lastSync} onRefresh={()=>fetchData()}/>

      {/* Search + count */}
      <div style={{display:"flex",gap:12,alignItems:"center",marginBottom:22,flexWrap:"wrap"}}>
        <div style={{position:"relative",flex:1,minWidth:220}}>
          <span style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",color:"#cbd5e1",fontSize:15}}>⌕</span>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search pending pharmacies..."
            style={{width:"100%",padding:"9px 12px 9px 32px",borderRadius:9,border:`1.5px solid ${C.border2}`,fontSize:13,outline:"none",background:"#fff",boxSizing:"border-box",fontFamily:"inherit",color:"#334155"}}
            onFocus={e=>e.target.style.borderColor=C.primary} onBlur={e=>e.target.style.borderColor=C.border2}/>
        </div>
        <span style={{background:C.amberLight,color:"#92400e",border:`1px solid ${C.amberBorder}`,borderRadius:99,padding:"5px 14px",fontSize:12.5,fontWeight:700}}>{filtered.length} pending</span>
      </div>

      {filtered.length===0&&(
        <div style={{background:"#fff",borderRadius:14,padding:"64px 24px",border:`1px solid ${C.border}`,textAlign:"center"}}>
          <div style={{width:52,height:52,borderRadius:"50%",background:C.greenLight,border:`2px solid ${C.greenBorder}`,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px",fontSize:24}}>✓</div>
          <div style={{fontSize:16,fontWeight:700,color:C.text}}>All caught up!</div>
          <div style={{fontSize:13,color:C.muted,marginTop:6}}>No pharmacies pending review{search?" matching your search":" right now"}.</div>
        </div>
      )}

      {filtered.length>0&&(
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(340px,1fr))",gap:18}}>
          {filtered.map(p=>(
            <div key={p._id} style={{background:"#fff",borderRadius:16,border:`1px solid ${C.border}`,boxShadow:"0 2px 8px rgba(0,0,0,0.06)",overflow:"hidden",display:"flex",flexDirection:"column",animation:"ph-slide 0.3s ease both"}}>
              {/* header */}
              <div style={{background:"linear-gradient(135deg,#fffbeb,#fffde7)",borderBottom:`1px solid ${C.amberBorder}`,padding:"18px 20px"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                  <div style={{flex:1}}>
                    <div style={{fontWeight:800,fontSize:15,color:C.text,lineHeight:1.3}}>{p.facilityName}</div>
                    <div style={{fontSize:12,color:C.slate,marginTop:3}}>{p.city}{p.state?`, ${p.state}`:""}</div>
                  </div>
                  <StatusBadge status="pending"/>
                </div>
              </div>
              {/* body */}
              <div style={{padding:"16px 20px",flex:1}}>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px 16px"}}>
                  {[
                    ["Contact",p.contactPerson||"—"],
                    ["Phone",p.phone||"—"],
                    ["License",p.licenseNumber||p.drugLicenseNumber||"—"],
                    ["Type",p.facilityType||"Pharmacy"],
                    ["GST",p.gstNumber||"—"],
                    ["Est. Year",p.establishedYear||"—"],
                  ].map(([label,val])=>(
                    <div key={label}>
                      <div style={{fontSize:9.5,color:C.muted,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:2}}>{label}</div>
                      <div style={{fontSize:13,color:"#334155",fontWeight:500}}>{val}</div>
                    </div>
                  ))}
                </div>
                <div style={{marginTop:12,paddingTop:12,borderTop:`1px solid ${C.border}`}}>
                  <div style={{fontSize:9.5,color:C.muted,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:3}}>Email</div>
                  <div style={{fontSize:12.5,color:C.primary,fontWeight:500}}>{p.email}</div>
                </div>
                <div style={{marginTop:10,fontSize:11.5,color:C.muted}}>
                  Submitted: {p.createdAt?new Date(p.createdAt).toLocaleDateString("en-IN",{day:"2-digit",month:"long",year:"numeric"}):"—"}
                </div>
              </div>
              {/* footer */}
              <div style={{padding:"14px 20px",borderTop:`1px solid ${C.border}`,display:"flex",gap:8,background:C.bg}}>
                <button onClick={()=>setDetailTarget(p)}
                  style={{flex:1,padding:"9px",borderRadius:9,border:`1.5px solid ${C.border2}`,background:"#fff",color:C.slate,fontWeight:600,fontSize:12.5,cursor:"pointer",fontFamily:"inherit"}}>
                  View Details
                </button>
                <button onClick={()=>handleApprove(p._id,p.facilityName)} disabled={actionLoading===p._id}
                  style={{flex:1,padding:"9px",borderRadius:9,border:"none",background:C.green,color:"#fff",fontWeight:700,fontSize:12.5,cursor:"pointer",fontFamily:"inherit",opacity:actionLoading===p._id?0.7:1}}>
                  {actionLoading===p._id?"Approving...":"Approve"}
                </button>
                <button onClick={()=>setRejectTarget(p)}
                  style={{flex:1,padding:"9px",borderRadius:9,border:`1.5px solid ${C.redBorder}`,background:C.redLight,color:"#be123c",fontWeight:700,fontSize:12.5,cursor:"pointer",fontFamily:"inherit"}}>
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {detailTarget&&<DetailView p={detailTarget} onClose={()=>setDetailTarget(null)}/>}
      {rejectTarget&&<RejectModal pharmacy={rejectTarget} onConfirm={handleRejectConfirm} onCancel={()=>setRejectTarget(null)} loading={!!actionLoading}/>}
    </div>
  );
}
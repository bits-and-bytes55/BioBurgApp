import { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";

const BASE_API = import.meta.env.VITE_API_BASE_URL;
const SERVICE_ARMS = ["Any","Army","Navy","Air Force"];
const JOB_TYPES = ["Full-Time","Part-Time","Contract","Consultant"];

const EMPTY = { title:"",department:"",location:"",salary:"",jobType:"Full-Time",serviceArm:"Any",minRank:"",minServiceYears:"",description:"",responsibilities:"",preferredSkills:"",status:"active" };

const useWidth = () => {
  const [w,setW] = useState(window.innerWidth);
  useEffect(()=>{ const h=()=>setW(window.innerWidth); window.addEventListener("resize",h); return()=>window.removeEventListener("resize",h); },[]);
  return w;
};

export default function ManageExServiceJobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const w = useWidth(); const isMobile = w < 640;
  const token = localStorage.getItem("adminToken");
  const headers = { Authorization:`Bearer ${token}` };

  const fetch = async () => {
    setLoading(true);
    try { const r = await axios.get(`${BASE_API}/api/exservice-jobs`,{headers}); setJobs(r.data.jobs??[]); }
    catch { toast.error("Failed to load jobs"); }
    finally { setLoading(false); }
  };
  useEffect(()=>{ fetch(); },[]);

  const handleChange = e => setForm(p=>({...p,[e.target.name]:e.target.value}));

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.title.trim()) { toast.error("Job title is required"); return; }
    setSaving(true);
    try {
      if (editing) { await axios.put(`${BASE_API}/api/exservice-jobs/${editing._id}`,form,{headers}); toast.success("Job updated"); }
      else { await axios.post(`${BASE_API}/api/exservice-jobs`,form,{headers}); toast.success("Job created"); }
      setShowForm(false); setEditing(null); setForm(EMPTY); fetch();
    } catch { toast.error("Save failed"); }
    finally { setSaving(false); }
  };

  const handleEdit = job => { setEditing(job); setForm({...job}); setShowForm(true); };
  const handleDelete = async id => {
    if (!confirm("Delete this job posting?")) return;
    try { await axios.delete(`${BASE_API}/api/exservice-jobs/${id}`,{headers}); toast.success("Deleted"); fetch(); }
    catch { toast.error("Delete failed"); }
  };

  const filtered = jobs.filter(j => !search || j.title?.toLowerCase().includes(search.toLowerCase()) || j.department?.toLowerCase().includes(search.toLowerCase()));

  const STATUS_COLORS = { active:{bg:"#f0fdf4",color:"#15803d"}, inactive:{bg:"#f1f5f9",color:"#64748b"} };
  const ARM_COLORS = { Army:{bg:"#fef9c3",color:"#854d0e"}, Navy:{bg:"#eff6ff",color:"#1d4ed8"}, "Air Force":{bg:"#f5f3ff",color:"#6d28d9"}, Any:{bg:"#f1f5f9",color:"#475569"} };

  return (
    <div style={s.page}>
      <Styles/>
      <div style={s.header}>
        <div>
          <p style={s.label}>Jobs & ExService Zone</p>
          <h1 style={{...s.title,fontSize:isMobile?18:24}}>Manage Ex-Servicemen Jobs</h1>
          <p style={s.sub}>Post and manage job opportunities for veterans</p>
        </div>
        <button onClick={()=>{setEditing(null);setForm(EMPTY);setShowForm(true);}} style={s.btnPrimary}>+ Post Job</button>
      </div>

      {/* Stats */}
      <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr 1fr":"repeat(4,1fr)",gap:12,marginBottom:24}}>
        {[
          {label:"Total Postings",val:jobs.length,color:"#0077a3"},
          {label:"Active",val:jobs.filter(j=>j.status==="active").length,color:"#15803d"},
          {label:"Inactive",val:jobs.filter(j=>j.status==="inactive").length,color:"#64748b"},
          {label:"Army / Navy / AF",val:`${jobs.filter(j=>j.serviceArm==="Army").length} / ${jobs.filter(j=>j.serviceArm==="Navy").length} / ${jobs.filter(j=>j.serviceArm==="Air Force").length}`,color:"#7c3aed"},
        ].map(c=>(
          <div key={c.label} style={s.statCard}>
            <p style={{fontSize:isMobile?18:22,fontWeight:700,color:c.color,margin:"0 0 4px"}}>{c.val}</p>
            <p style={{fontSize:11,color:"#64748b",margin:0}}>{c.label}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div style={{display:"flex",gap:12,marginBottom:20,flexWrap:"wrap"}}>
        <input type="text" placeholder="Search by title or department..." value={search} onChange={e=>setSearch(e.target.value)} style={{...s.input,flex:1,minWidth:200}}/>
        <span style={{fontSize:13,color:"#94a3b8",alignSelf:"center"}}>{filtered.length} posting{filtered.length!==1?"s":""}</span>
      </div>

      {/* Job Cards */}
      {loading ? <div style={s.empty}>Loading...</div>
      : filtered.length===0 ? <div style={s.empty}>No job postings found.</div>
      : (
        <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":w<1024?"1fr 1fr":"repeat(auto-fill,minmax(360px,1fr))",gap:16}}>
          {filtered.map(job=>{
            const sc = STATUS_COLORS[job.status]||STATUS_COLORS.active;
            const ac = ARM_COLORS[job.serviceArm]||ARM_COLORS.Any;
            return (
              <div key={job._id} style={s.card}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14,gap:10}}>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:6}}>
                      <span style={{...s.chip,background:sc.bg,color:sc.color}}>{job.status}</span>
                      <span style={{...s.chip,background:ac.bg,color:ac.color}}>{job.serviceArm}</span>
                    </div>
                    <h3 style={{fontSize:15,fontWeight:700,color:"#0f172a",margin:0,lineHeight:1.3}}>{job.title}</h3>
                    {job.department&&<p style={{fontSize:12,color:"#64748b",margin:"3px 0 0"}}>{job.department}</p>}
                  </div>
                  <div style={{display:"flex",gap:6,flexShrink:0}}>
                    <button onClick={()=>handleEdit(job)} style={s.btnEdit}>Edit</button>
                    <button onClick={()=>handleDelete(job._id)} style={s.btnDel}>Del</button>
                  </div>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
                  {[["Location",job.location],["Salary",job.salary],["Type",job.jobType],["Min. Service",job.minServiceYears?`${job.minServiceYears} yrs`:"—"]].filter(([,v])=>v).map(([l,v])=>(
                    <div key={l} style={{background:"#f8fafc",borderRadius:8,padding:"8px 12px"}}>
                      <p style={{fontSize:10,fontWeight:600,color:"#94a3b8",textTransform:"uppercase",letterSpacing:"0.06em",margin:0}}>{l}</p>
                      <p style={{fontSize:13,fontWeight:500,color:"#1e293b",margin:"2px 0 0"}}>{v}</p>
                    </div>
                  ))}
                </div>
                {job.description&&<p style={{fontSize:13,color:"#475569",lineHeight:1.6,margin:0,display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden"}}>{job.description}</p>}
              </div>
            );
          })}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div style={s.overlay} onClick={e=>{if(e.target===e.currentTarget){setShowForm(false);setEditing(null);}}}>
          <div style={{...s.modal,width:isMobile?"95vw":600,maxHeight:"90vh",overflowY:"auto"}}>
            <div style={s.modalHead}>
              <h2 style={{fontSize:17,fontWeight:700,color:"#0f172a",margin:0}}>{editing?"Edit Job Posting":"New Ex-Service Job"}</h2>
              <button onClick={()=>{setShowForm(false);setEditing(null);}} style={s.closeBtn}>✕</button>
            </div>
            <form onSubmit={handleSubmit} style={{display:"flex",flexDirection:"column",gap:16,padding:24}}>
              <G2 mobile={isMobile}>
                <F label="Job Title *" name="title" value={form.title} onChange={handleChange} placeholder="e.g. Security Manager"/>
                <F label="Department" name="department" value={form.department} onChange={handleChange} placeholder="e.g. Operations"/>
              </G2>
              <G2 mobile={isMobile}>
                <F label="Location" name="location" value={form.location} onChange={handleChange} placeholder="e.g. Delhi"/>
                <F label="Salary / CTC" name="salary" value={form.salary} onChange={handleChange} placeholder="e.g. ₹6–9 LPA"/>
              </G2>
              <G2 mobile={isMobile}>
                <Sel label="Job Type" name="jobType" value={form.jobType} onChange={handleChange} opts={JOB_TYPES}/>
                <Sel label="Service Arm" name="serviceArm" value={form.serviceArm} onChange={handleChange} opts={SERVICE_ARMS}/>
              </G2>
              <G2 mobile={isMobile}>
                <F label="Minimum Rank" name="minRank" value={form.minRank} onChange={handleChange} placeholder="e.g. Havildar / Lieutenant"/>
                <F label="Min. Years of Service" name="minServiceYears" type="number" value={form.minServiceYears} onChange={handleChange} placeholder="e.g. 5"/>
              </G2>
              <div style={{display:"flex",flexDirection:"column",gap:6}}>
                <label style={s.fl}>Job Description</label>
                <textarea name="description" value={form.description} onChange={handleChange} rows={3} placeholder="Overview of the role..." style={s.ta}/>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:6}}>
                <label style={s.fl}>Key Responsibilities</label>
                <textarea name="responsibilities" value={form.responsibilities} onChange={handleChange} rows={3} placeholder="Duties and responsibilities..." style={s.ta}/>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:6}}>
                <label style={s.fl}>Preferred Skills / Trades</label>
                <textarea name="preferredSkills" value={form.preferredSkills} onChange={handleChange} rows={2} placeholder="e.g. Combat engineering, Logistics, Medical Corps..." style={s.ta}/>
              </div>
              <Sel label="Status" name="status" value={form.status} onChange={handleChange} opts={["active","inactive"]}/>
              <div style={{display:"flex",gap:12,justifyContent:"flex-end",paddingTop:8}}>
                <button type="button" onClick={()=>{setShowForm(false);setEditing(null);}} style={s.btnGhost}>Cancel</button>
                <button type="submit" disabled={saving} style={{...s.btnPrimary,opacity:saving?0.7:1}}>{saving?"Saving...":editing?"Update Job":"Create Job"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const Styles=()=><style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}input:focus,select:focus,textarea:focus{outline:none;border-color:#0077a3!important;box-shadow:0 0 0 3px rgba(0,119,163,0.1)!important;}`}</style>;
const G2=({children,mobile})=><div style={{display:"grid",gridTemplateColumns:mobile?"1fr":"1fr 1fr",gap:16}}>{children}</div>;
const F=({label,name,value,onChange,placeholder,type="text"})=>(
  <div style={{display:"flex",flexDirection:"column",gap:6}}>
    <label style={s.fl}>{label}</label>
    <input type={type} name={name} value={value} onChange={onChange} placeholder={placeholder} style={s.input}/>
  </div>
);
const Sel=({label,name,value,onChange,opts})=>(
  <div style={{display:"flex",flexDirection:"column",gap:6}}>
    <label style={s.fl}>{label}</label>
    <select name={name} value={value} onChange={onChange} style={s.input}>
      {opts.map(o=><option key={o} value={o}>{o}</option>)}
    </select>
  </div>
);

const s={
  page:{fontFamily:"'Inter','Segoe UI',sans-serif",padding:0},
  header:{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:24,gap:12,flexWrap:"wrap"},
  label:{fontSize:12,fontWeight:600,color:"#0077a3",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:4},
  title:{fontWeight:700,color:"#0f172a"},
  sub:{fontSize:13,color:"#64748b",marginTop:4},
  statCard:{background:"#fff",border:"1px solid #e2e8f0",borderRadius:10,padding:"14px 16px",textAlign:"center"},
  card:{background:"#fff",border:"1px solid #e2e8f0",borderRadius:12,padding:18,animation:"fadeUp 0.4s ease both"},
  chip:{fontSize:11,fontWeight:600,padding:"3px 9px",borderRadius:20,textTransform:"capitalize"},
  overlay:{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:16},
  modal:{background:"#fff",borderRadius:14,width:"100%",boxShadow:"0 20px 60px rgba(0,0,0,0.2)"},
  modalHead:{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"18px 24px",borderBottom:"1px solid #eef1f5"},
  closeBtn:{background:"none",border:"none",fontSize:18,cursor:"pointer",color:"#64748b"},
  fl:{fontSize:13,fontWeight:500,color:"#374151"},
  input:{width:"100%",padding:"10px 14px",border:"1px solid #dde3ea",borderRadius:8,fontSize:14,color:"#1e293b",background:"#fff",transition:"all 0.2s",appearance:"none",fontFamily:"inherit"},
  ta:{width:"100%",padding:"10px 14px",border:"1px solid #dde3ea",borderRadius:8,fontSize:14,color:"#1e293b",lineHeight:1.7,resize:"vertical",fontFamily:"inherit"},
  btnPrimary:{background:"#0077a3",color:"#fff",border:"none",borderRadius:8,padding:"10px 22px",fontSize:14,fontWeight:600,cursor:"pointer"},
  btnGhost:{background:"#f1f5f9",color:"#374151",border:"none",borderRadius:8,padding:"10px 22px",fontSize:14,fontWeight:600,cursor:"pointer"},
  btnEdit:{background:"#eff6ff",color:"#1d4ed8",border:"1px solid #bfdbfe",borderRadius:6,padding:"5px 12px",fontSize:12,fontWeight:600,cursor:"pointer"},
  btnDel:{background:"#fff1f2",color:"#be123c",border:"1px solid #fecdd3",borderRadius:6,padding:"5px 10px",fontSize:12,fontWeight:600,cursor:"pointer"},
  empty:{textAlign:"center",padding:"48px 20px",color:"#94a3b8",fontSize:14},
};
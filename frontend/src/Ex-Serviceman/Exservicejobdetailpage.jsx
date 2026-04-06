import { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

const BASE_API = import.meta.env.VITE_API_BASE_URL;
const SERVICE_ARMS = ["Army","Navy","Air Force"];
const DISCHARGE_TYPES = ["Honourable Discharge","Medical Discharge","VRS (Voluntary Retirement)","Compulsory Retirement","Other"];
const QUALIFICATIONS = ["High School","Diploma","B.Tech / B.E","BCA","BBA","B.Sc","B.Com","MBA","MCA","M.Tech","Other"];
const NOTICE_OPTIONS = ["Immediate","15 days","1 month","2 months","3 months"];
const GENDER_OPTIONS = ["Male","Female","Other","Prefer not to say"];
const YEARS_SERVICE = ["1–3 years","3–5 years","5–10 years","10–15 years","15–20 years","20+ years"];

const EMPTY = { fullName:"",email:"",phone:"",dateOfBirth:"",gender:"",address:"",city:"",state:"",pinCode:"",serviceArm:"",rank:"",serviceNumber:"",yearsOfService:"",dischargeType:"",serviceRecord:"",medals:"",civilianQualification:"",fieldOfStudy:"",civilianExperience:"",currentJobTitle:"",skills:"",expectedSalary:"",noticePeriod:"",preferredLocation:"",linkedIn:"",coverLetter:"" };

const STEPS = [{num:"01",title:"Personal Information"},{num:"02",title:"Military Service"},{num:"03",title:"Civilian Details"},{num:"04",title:"Your Application"}];

const useWidth=()=>{ const [w,setW]=useState(window.innerWidth); useEffect(()=>{const h=()=>setW(window.innerWidth);window.addEventListener("resize",h);return()=>window.removeEventListener("resize",h);},[]);return w; };

export default function ExServiceJobDetailPage() {
  const {id} = useParams(); const navigate = useNavigate();
  const [job, setJob] = useState(null); const [jobLoading, setJobLoading] = useState(true);
  const [form, setForm] = useState(EMPTY); const [resume, setResume] = useState(null);
  const [submitting, setSubmitting] = useState(false); const [submitted, setSubmitted] = useState(false);
  const [step, setStep] = useState(0);
  const w = useWidth(); const isMobile=w<640;

  useEffect(()=>{
    axios.get(`${BASE_API}/api/exservice-jobs/public/${id}`)
      .then(r=>setJob(r.data.job))
      .catch(()=>toast.error("Job not found"))
      .finally(()=>setJobLoading(false));
  },[id]);

  const handleChange = e => setForm(p=>({...p,[e.target.name]:e.target.value}));

  const validate = () => {
    if(step===0 && (!form.fullName.trim()||!form.email.trim()||!form.phone.trim())) { toast.error("Please fill all required fields."); return false; }
    if(step===1 && !form.serviceArm) { toast.error("Please select your Service Arm."); return false; }
    return true;
  };

  const next = () => { if(validate()) setStep(s=>Math.min(s+1,3)); };
  const back = () => setStep(s=>Math.max(s-1,0));

  const handleSubmit = async () => {
    if(!form.fullName||!form.email||!form.phone) { toast.error("Required fields missing."); return; }
    const fd = new FormData();
    Object.entries(form).forEach(([k,v])=>fd.append(k,v));
    fd.append("applyingFor",job.title);
    if(resume) fd.append("resume",resume);
    setSubmitting(true);
    try {
      await axios.post(`${BASE_API}/api/exservice-jobs/apply`,fd,{headers:{"Content-Type":"multipart/form-data"}});
      setSubmitted(true);
    } catch(err) { toast.error(err.response?.data?.message||"Submission failed."); }
    finally { setSubmitting(false); }
  };

  if(submitted) return (
    <div style={{fontFamily:"'DM Sans',sans-serif",background:"#f1f4f8",minHeight:"100vh"}}><Fonts/>
      <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",padding:"40px 20px"}}>
        <div style={{background:"#fff",borderRadius:16,padding:isMobile?"32px 24px":"52px 48px",maxWidth:540,width:"100%",boxShadow:"0 8px 40px rgba(0,0,0,0.08)"}}>
          <div style={{width:40,height:4,background:"#0077a3",borderRadius:4,marginBottom:28}}/>
          <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:26,fontWeight:700,color:"#0f172a",marginBottom:12}}>Application Received</h2>
          <p style={{fontSize:15,color:"#64748b",lineHeight:1.8,marginBottom:28}}>Thank you, <strong>{form.fullName}</strong>. Your application for <strong>{job?.title}</strong> has been submitted. We will contact you at <strong>{form.email}</strong>.</p>
          <div style={{background:"#f8fafc",borderRadius:10,padding:"18px 20px",borderLeft:"3px solid #0077a3",marginBottom:28}}>
            {[["Position",job?.title],["Service Arm",form.serviceArm||"—"],["Rank",form.rank||"—"],["Contact",form.email]].map(([l,v])=>(
              <div key={l} style={{display:"flex",justifyContent:"space-between",padding:"5px 0",borderBottom:"1px solid #f1f5f9"}}>
                <span style={{fontSize:11,fontWeight:700,color:"#94a3b8",textTransform:"uppercase",letterSpacing:"0.06em"}}>{l}</span>
                <span style={{fontSize:13,fontWeight:500,color:"#1e293b"}}>{v}</span>
              </div>
            ))}
          </div>
          <div style={{display:"flex",gap:12}}>
            <button onClick={()=>navigate("/exservice/jobs")} style={{background:"#0077a3",color:"#fff",border:"none",borderRadius:8,padding:"11px 24px",fontSize:14,fontWeight:600,cursor:"pointer"}}>More Jobs</button>
            <button onClick={()=>navigate("/")} style={{background:"#f1f5f9",color:"#374151",border:"none",borderRadius:8,padding:"11px 24px",fontSize:14,fontWeight:600,cursor:"pointer"}}>Return Home</button>
          </div>
        </div>
      </div>
    </div>
  );

  if(jobLoading) return <div style={{fontFamily:"'DM Sans',sans-serif",display:"flex",alignItems:"center",justifyContent:"center",minHeight:"100vh"}}><Fonts/><div style={{width:36,height:36,border:"3px solid #e2e8f0",borderTop:"3px solid #0077a3",borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/></div>;
  if(!job) return <div style={{fontFamily:"'DM Sans',sans-serif",display:"flex",alignItems:"center",justifyContent:"center",minHeight:"100vh",flexDirection:"column",gap:16}}><Fonts/><p style={{color:"#64748b"}}>Position no longer available.</p><button onClick={()=>navigate("/exservice/jobs")} style={{background:"#0077a3",color:"#fff",border:"none",borderRadius:8,padding:"11px 24px",fontSize:14,fontWeight:600,cursor:"pointer"}}>View All Jobs</button></div>;

  const ARM_COLORS={Army:{bg:"#fef9c3",color:"#854d0e"},Navy:{bg:"#eff6ff",color:"#1d4ed8"},"Air Force":{bg:"#f5f3ff",color:"#6d28d9"},Any:{bg:"#f1f5f9",color:"#475569"}};
  const ac=ARM_COLORS[job.serviceArm]||ARM_COLORS.Any;

  return (
    <div style={{fontFamily:"'DM Sans',sans-serif",background:"#f1f4f8",minHeight:"100vh"}}><Fonts/>
      <div style={{background:"#fff",borderBottom:"1px solid #e5eaef",padding:isMobile?"12px 16px":"14px 48px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <button onClick={()=>navigate("/exservice/jobs")} style={{background:"none",border:"none",fontSize:14,fontWeight:500,color:"#0077a3",cursor:"pointer"}}>← All Openings</button>
        <span style={{fontSize:13,color:"#94a3b8"}}>{job.serviceArm} · {job.jobType}</span>
      </div>

      <div style={{maxWidth:1200,margin:"0 auto",padding:isMobile?"20px 16px 60px":"36px 48px 80px",display:"grid",gridTemplateColumns:isMobile?"1fr":"320px 1fr",gap:24,alignItems:"start"}}>

        {/* Left: Job Info */}
        <aside style={{position:isMobile?"static":"sticky",top:28}}>
          <div style={{background:"#fff",borderRadius:14,overflow:"hidden",boxShadow:"0 2px 20px rgba(0,0,0,0.07)"}}>
            <div style={{height:5,background:"linear-gradient(90deg,#1a1a2e,#0f3460,#0077a3)"}}/>
            <div style={{padding:"26px 26px 32px"}}>
              <div style={{display:"flex",gap:7,flexWrap:"wrap",marginBottom:10}}>
                <span style={{fontSize:11,fontWeight:700,padding:"3px 10px",borderRadius:20,background:ac.bg,color:ac.color}}>{job.serviceArm}</span>
                <span style={{fontSize:11,fontWeight:700,padding:"3px 10px",borderRadius:20,background:"#f1f5f9",color:"#475569"}}>{job.jobType}</span>
              </div>
              <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:22,fontWeight:700,color:"#0f172a",lineHeight:1.28,margin:"0 0 6px"}}>{job.title}</h1>
              {job.department&&<p style={{fontSize:13,color:"#64748b",margin:0}}>{job.department}</p>}
              <div style={{height:1,background:"#eef1f5",margin:"20px 0"}}/>
              <div style={{display:"flex",flexDirection:"column",gap:11}}>
                {[["Location",job.location],["Salary / CTC",job.salary],["Min. Rank",job.minRank],["Min. Service",job.minServiceYears?`${job.minServiceYears} yrs`:null],["Employment",job.jobType]].filter(([,v])=>v).map(([l,v])=>(
                  <div key={l} style={{display:"flex",justifyContent:"space-between",alignItems:"baseline"}}>
                    <span style={{fontSize:11,fontWeight:600,color:"#9eaab5",textTransform:"uppercase",letterSpacing:"0.07em"}}>{l}</span>
                    <span style={{fontSize:13,fontWeight:500,color:"#1e293b",textAlign:"right"}}>{v}</span>
                  </div>
                ))}
              </div>
              {(job.description||job.responsibilities||job.preferredSkills)&&<><div style={{height:1,background:"#eef1f5",margin:"20px 0"}}/>
                {job.description&&<><p style={{fontSize:11,fontWeight:700,color:"#9eaab5",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:8}}>About This Role</p><p style={{fontSize:13,color:"#475569",lineHeight:1.8,whiteSpace:"pre-wrap",marginBottom:14}}>{job.description}</p></>}
                {job.preferredSkills&&<><p style={{fontSize:11,fontWeight:700,color:"#9eaab5",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:8}}>Preferred Skills / Trades</p><p style={{fontSize:13,color:"#475569",lineHeight:1.8}}>{job.preferredSkills}</p></>}
              </>}
            </div>
          </div>
        </aside>

        {/* Right: Stepped Form */}
        <main>
          {/* Form header */}
          <div style={{background:"#fff",borderRadius:14,padding:isMobile?"18px":"22px 28px",marginBottom:16,boxShadow:"0 2px 20px rgba(0,0,0,0.06)",display:"flex",justifyContent:"space-between",alignItems:isMobile?"flex-start":"center",gap:12,flexWrap:"wrap"}}>
            <div>
              <p style={{fontSize:11,fontWeight:700,color:"#9eaab5",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:5}}>Applying for</p>
              <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:isMobile?17:20,fontWeight:700,color:"#0f172a",margin:0}}>{job.title}</h2>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:0}}>
              {STEPS.map((_,i)=>(
                <div key={i} style={{display:"flex",alignItems:"center"}}>
                  <div style={{width:26,height:26,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,background:step>i?"#0077a3":step===i?"#0077a3":"#e2e8f0",color:step>=i?"#fff":"#94a3b8",boxShadow:step===i?"0 0 0 3px rgba(0,119,163,0.2)":"none",transition:"all 0.3s",flexShrink:0}}>{step>i?"✓":i+1}</div>
                  {i<3&&<div style={{width:16,height:2,background:step>i?"#0077a3":"#e2e8f0",transition:"background 0.3s"}}/>}
                </div>
              ))}
            </div>
          </div>

          {/* Step card */}
          <div style={{background:"#fff",borderRadius:14,overflow:"hidden",boxShadow:"0 2px 20px rgba(0,0,0,0.06)"}}>
            <div style={{padding:"16px 28px",borderBottom:"1px solid #eef1f5",display:"flex",alignItems:"center",justifyContent:"space-between",background:"#fbfcfd"}}>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <span style={{fontSize:10,fontWeight:700,color:"#0077a3",background:"#e4f2f8",padding:"3px 10px",borderRadius:20,letterSpacing:"0.08em"}}>{STEPS[step].num}</span>
                <h3 style={{fontSize:14,fontWeight:600,color:"#1e293b",margin:0}}>{STEPS[step].title}</h3>
              </div>
              <span style={{fontSize:12,color:"#94a3b8"}}>Step {step+1} of 4</span>
            </div>

            <div style={{padding:isMobile?"20px 20px":"26px 28px",display:"flex",flexDirection:"column",gap:20}}>

              {/* STEP 0: Personal */}
              {step===0&&<>
                <G2 m={isMobile}><F label="Full Name *" name="fullName" value={form.fullName} onChange={handleChange} placeholder="As per service/government ID"/><F label="Email Address *" name="email" type="email" value={form.email} onChange={handleChange} placeholder="your@email.com"/></G2>
                <G2 m={isMobile}><F label="Mobile Number *" name="phone" value={form.phone} onChange={handleChange} placeholder="10-digit number"/><F label="Date of Birth" name="dateOfBirth" type="date" value={form.dateOfBirth} onChange={handleChange}/></G2>
                <G1><Sel label="Gender" name="gender" value={form.gender} onChange={handleChange} opts={GENDER_OPTIONS}/></G1>
              </>}

              {/* STEP 1: Military Service */}
              {step===1&&<>
                <G2 m={isMobile}><Sel label="Service Arm *" name="serviceArm" value={form.serviceArm} onChange={handleChange} opts={SERVICE_ARMS}/><F label="Rank" name="rank" value={form.rank} onChange={handleChange} placeholder="e.g. Subedar Major, Wing Commander"/></G2>
                <G2 m={isMobile}><F label="Service Number" name="serviceNumber" value={form.serviceNumber} onChange={handleChange} placeholder="Your official service number"/><Sel label="Years of Service" name="yearsOfService" value={form.yearsOfService} onChange={handleChange} opts={YEARS_SERVICE}/></G2>
                <G2 m={isMobile}><Sel label="Discharge Type" name="dischargeType" value={form.dischargeType} onChange={handleChange} opts={DISCHARGE_TYPES}/><F label="Medals / Awards" name="medals" value={form.medals} onChange={handleChange} placeholder="e.g. Sena Medal, Commendation Card"/></G2>
                <G1><TA label="Service Record Summary" name="serviceRecord" value={form.serviceRecord} onChange={handleChange} placeholder="Briefly describe your postings, roles, and key responsibilities during service..." rows={4}/></G1>
                <G2 m={isMobile}><F label="Address" name="address" value={form.address} onChange={handleChange} placeholder="Street, Area"/><F label="City" name="city" value={form.city} onChange={handleChange} placeholder="City"/></G2>
                <G2 m={isMobile}><F label="State" name="state" value={form.state} onChange={handleChange} placeholder="State"/><F label="PIN Code" name="pinCode" value={form.pinCode} onChange={handleChange} placeholder="6-digit PIN"/></G2>
              </>}

              {/* STEP 2: Civilian Details */}
              {step===2&&<>
                <G2 m={isMobile}><Sel label="Civilian Qualification" name="civilianQualification" value={form.civilianQualification} onChange={handleChange} opts={QUALIFICATIONS}/><F label="Field of Study" name="fieldOfStudy" value={form.fieldOfStudy} onChange={handleChange} placeholder="e.g. Engineering, Management"/></G2>
                <G2 m={isMobile}><F label="Civilian Experience (if any)" name="civilianExperience" value={form.civilianExperience} onChange={handleChange} placeholder="e.g. 2 years in security sector"/><F label="Current Job Title" name="currentJobTitle" value={form.currentJobTitle} onChange={handleChange} placeholder="e.g. Security Consultant"/></G2>
                <G2 m={isMobile}><F label="Expected Salary" name="expectedSalary" value={form.expectedSalary} onChange={handleChange} placeholder="e.g. ₹6–10 LPA"/><Sel label="Notice Period" name="noticePeriod" value={form.noticePeriod} onChange={handleChange} opts={NOTICE_OPTIONS}/></G2>
                <G2 m={isMobile}><F label="Preferred Location" name="preferredLocation" value={form.preferredLocation} onChange={handleChange} placeholder="e.g. Delhi, Pune, Remote"/><F label="LinkedIn Profile" name="linkedIn" value={form.linkedIn} onChange={handleChange} placeholder="linkedin.com/in/yourname"/></G2>
                <G1><F label="Key Skills / Trades" name="skills" value={form.skills} onChange={handleChange} placeholder="e.g. Leadership, Logistics, Cyber Security, Medical Corps, Signals"/></G1>
              </>}

              {/* STEP 3: Application */}
              {step===3&&<>
                <G1><TA label="Cover Letter" name="coverLetter" value={form.coverLetter} onChange={handleChange} placeholder="Describe how your military experience makes you the right candidate for this role..." rows={7} hint="Tell us about your service highlights and how they apply to this position."/></G1>
                <G1>
                  <div style={{display:"flex",flexDirection:"column",gap:7}}>
                    <label style={{fontSize:13,fontWeight:500,color:"#374151"}}>Resume / CV</label>
                    <p style={{fontSize:12,color:"#94a3b8",marginTop:-2}}>PDF, DOC, DOCX — Maximum 5 MB</p>
                    <label style={{cursor:"pointer"}}>
                      <input type="file" accept=".pdf,.doc,.docx" onChange={e=>setResume(e.target.files[0])} style={{display:"none"}}/>
                      <div style={{border:`1.5px dashed ${resume?"#0077a3":"#cdd5de"}`,borderRadius:10,padding:"28px 24px",textAlign:"center",background:resume?"#f0f9ff":"#fafbfc",transition:"all 0.2s"}}>
                        {resume ? <><p style={{fontSize:14,fontWeight:500,color:"#0077a3",marginBottom:4}}>{resume.name}</p><p style={{fontSize:12,color:"#94a3b8"}}>Click to replace</p></>
                               : <><p style={{fontSize:14,fontWeight:500,color:"#374151",marginBottom:4}}>Click to upload your resume</p><p style={{fontSize:12,color:"#94a3b8"}}>PDF, DOC, DOCX — Max 5 MB</p></>}
                      </div>
                    </label>
                  </div>
                </G1>
                <G1>
                  <p style={{fontSize:13,color:"#64748b",lineHeight:1.75,paddingLeft:12,borderLeft:"3px solid #e2e8f0"}}>By submitting this application, I confirm that all information is accurate and I consent to BioBurg processing my data for recruitment purposes.</p>
                </G1>
              </>}
            </div>

            {/* Nav buttons */}
            <div style={{padding:"18px 28px",borderTop:"1px solid #eef1f5",display:"flex",justifyContent:"space-between",alignItems:"center",background:"#fbfcfd"}}>
              <div>{step>0&&<button onClick={back} style={{background:"none",border:"1px solid #dde3ea",borderRadius:8,padding:"9px 20px",fontSize:14,fontWeight:600,color:"#64748b",cursor:"pointer"}}>← Back</button>}</div>
              <div style={{display:"flex",alignItems:"center",gap:12}}>
                <span style={{fontSize:13,color:"#94a3b8"}}>{step+1} / 4</span>
                {step<3
                  ? <button onClick={next} style={{background:"#0077a3",color:"#fff",border:"none",borderRadius:8,padding:"10px 26px",fontSize:14,fontWeight:600,cursor:"pointer"}}>Continue →</button>
                  : <button onClick={handleSubmit} disabled={submitting} style={{background:"#0077a3",color:"#fff",border:"none",borderRadius:8,padding:"10px 26px",fontSize:14,fontWeight:600,cursor:"pointer",opacity:submitting?0.7:1,minWidth:180}}>{submitting?"Submitting...":"Submit Application"}</button>
                }
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

const Fonts=()=><style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=DM+Sans:wght@300;400;500;600&display=swap');*{box-sizing:border-box;margin:0;padding:0;}@keyframes spin{to{transform:rotate(360deg)}}input:focus,select:focus,textarea:focus{outline:none;border-color:#0077a3!important;box-shadow:0 0 0 3px rgba(0,119,163,0.1)!important;}input::placeholder,textarea::placeholder{color:#b8c5cf;font-size:13px;}`}</style>;
const G1=({children})=><div style={{display:"grid",gridTemplateColumns:"1fr",gap:20}}>{children}</div>;
const G2=({children,m})=><div style={{display:"grid",gridTemplateColumns:m?"1fr":"1fr 1fr",gap:20}}>{children}</div>;
const F=({label,name,value,onChange,placeholder,type="text"})=>(
  <div style={{display:"flex",flexDirection:"column",gap:7}}>
    <label style={{fontSize:13,fontWeight:500,color:"#374151"}}>{label}</label>
    <input type={type} name={name} value={value} onChange={onChange} placeholder={placeholder} style={{width:"100%",padding:"11px 15px",border:"1px solid #dde3ea",borderRadius:8,fontSize:14,color:"#1e293b",background:"#fff",transition:"all 0.2s",appearance:"none",fontFamily:"inherit"}}/>
  </div>
);
const Sel=({label,name,value,onChange,opts})=>(
  <div style={{display:"flex",flexDirection:"column",gap:7}}>
    <label style={{fontSize:13,fontWeight:500,color:"#374151"}}>{label}</label>
    <select name={name} value={value} onChange={onChange} style={{width:"100%",padding:"11px 15px",border:"1px solid #dde3ea",borderRadius:8,fontSize:14,color:"#1e293b",background:"#fff",transition:"all 0.2s",appearance:"none",fontFamily:"inherit"}}>
      <option value="">Select an option</option>
      {opts.map(o=><option key={o} value={o}>{o}</option>)}
    </select>
  </div>
);
const TA=({label,name,value,onChange,placeholder,rows=4,hint})=>(
  <div style={{display:"flex",flexDirection:"column",gap:7}}>
    <label style={{fontSize:13,fontWeight:500,color:"#374151"}}>{label}</label>
    {hint&&<p style={{fontSize:12,color:"#94a3b8",marginTop:-2}}>{hint}</p>}
    <textarea name={name} value={value} onChange={onChange} placeholder={placeholder} rows={rows} style={{width:"100%",padding:"13px 15px",border:"1px solid #dde3ea",borderRadius:8,fontSize:14,color:"#1e293b",lineHeight:1.75,resize:"vertical",fontFamily:"inherit"}}/>
  </div>
);
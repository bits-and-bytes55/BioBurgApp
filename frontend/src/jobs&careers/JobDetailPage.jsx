import { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

const BASE_API = import.meta.env.VITE_API_BASE_URL;
const QUALIFICATIONS = ["High School","Diploma","B.Tech / B.E","BCA","BBA","B.Sc","B.Com","MBA","MCA","M.Tech","M.Sc","Ph.D","ITI","Other"];
const EXPERIENCE_OPTIONS = ["Fresher","Less than 1 year","1–2 years","2–4 years","4–6 years","6–10 years","10+ years"];
const NOTICE_OPTIONS = ["Immediate","15 days","1 month","2 months","3 months"];
const GENDER_OPTIONS = ["Male","Female","Other","Prefer not to say"];
const EMPTY_FORM = {
  fullName:"",email:"",phone:"",dateOfBirth:"",gender:"",
  address:"",city:"",state:"",pinCode:"",
  qualification:"",fieldOfStudy:"",workExperience:"",currentJobTitle:"",
  skills:"",preferredLocation:"",expectedSalary:"",noticePeriod:"",linkedIn:"",
  coverLetter:"",
};

const STEPS = [
  { num:"01", title:"Personal Information" },
  { num:"02", title:"Address Details" },
  { num:"03", title:"Professional Background" },
  { num:"04", title:"Your Application" },
];

export default function JobDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [jobLoading, setJobLoading] = useState(true);
  const [form, setForm] = useState(EMPTY_FORM);
  const [resume, setResume] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [step, setStep] = useState(0); // 0-3

  useEffect(() => {
    axios.get(`${BASE_API}/api/jobs-manage/public/${id}`)
      .then(res => setJob(res.data.job))
      .catch(() => toast.error("Job not found"))
      .finally(() => setJobLoading(false));
  }, [id]);

  const handleChange = e => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const validateStep = () => {
    if (step === 0) {
      if (!form.fullName.trim()) { toast.error("Full name is required."); return false; }
      if (!form.email.trim()) { toast.error("Email is required."); return false; }
      if (!form.phone.trim()) { toast.error("Mobile number is required."); return false; }
    }
    return true;
  };

  const next = () => { if (validateStep()) setStep(s => Math.min(s + 1, 3)); };
  const back = () => setStep(s => Math.max(s - 1, 0));

  const handleSubmit = async () => {
    if (!form.fullName || !form.email || !form.phone) { toast.error("Please fill all required fields."); return; }
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    fd.append("applyingFor", job.title);
    if (resume) fd.append("resume", resume);
    setSubmitting(true);
    try {
      await axios.post(`${BASE_API}/api/jobs-careers/register`, fd, { headers: { "Content-Type": "multipart/form-data" } });
      setSubmitted(true);
    } catch (err) {
      toast.error(err.response?.data?.message || "Submission failed.");
    } finally { setSubmitting(false); }
  };

  // ── Success ──
  if (submitted) return (
    <div style={s.page}><Fonts />
      <div style={s.successPage}>
        <div style={s.successBox}>
          <div style={s.accentBar} />
          <h2 style={s.successH}>Application Received</h2>
          <p style={s.successSub}>Thank you, <strong>{form.fullName}</strong>. Your application for <strong>{job?.title}</strong> has been submitted. Our team will contact you at <strong>{form.email}</strong> shortly.</p>
          <div style={s.successMeta}>
            {[["Position",job?.title],["Department",job?.department||"—"],["Email",form.email]].map(([l,v])=>(
              <div key={l} style={s.successRow}><span style={s.successKey}>{l}</span><span style={s.successVal}>{v}</span></div>
            ))}
          </div>
          <div style={{display:"flex",gap:12,marginTop:32}}>
            <button onClick={()=>navigate("/careers")} style={s.btnPrimary}>Browse More Jobs</button>
            <button onClick={()=>navigate("/")} style={s.btnGhost}>Return Home</button>
          </div>
        </div>
      </div>
    </div>
  );

  if (jobLoading) return <div style={s.page}><Fonts /><div style={s.center}><div style={s.spinner}/></div></div>;
  if (!job) return (
    <div style={s.page}><Fonts />
      <div style={s.center}>
        <p style={{color:"#64748b",marginBottom:16}}>Position no longer available.</p>
        <button onClick={()=>navigate("/careers")} style={s.btnPrimary}>View All Openings</button>
      </div>
    </div>
  );

  return (
    <div style={s.page}><Fonts />

      {/* Nav */}
      <div style={s.nav}>
        <button onClick={()=>navigate("/careers")} style={s.navBack}>← All Openings</button>
        <span style={s.navCrumb}>{job.department && `${job.department} · `}{job.jobType}</span>
      </div>

      <div style={s.layout}>

        {/* LEFT: Job Info */}
        <aside style={s.left}>
          <div style={s.jobCard}>
            <div style={s.accentBar}/>
            <div style={s.jobBody}>
              <p style={s.jobTypeLbl}>{job.jobType}</p>
              <h1 style={s.jobTitle}>{job.title}</h1>
              {job.department && <p style={s.jobDept}>{job.department}</p>}
              <div style={s.divider}/>
              <div style={s.metaList}>
                {[["Location",job.location],["Experience",job.experience],["Salary / CTC",job.salary],["Employment",job.jobType]].filter(([,v])=>v).map(([l,v])=>(
                  <div key={l} style={s.metaRow}><span style={s.metaKey}>{l}</span><span style={s.metaVal}>{v}</span></div>
                ))}
              </div>
              {job.description && <>
                <div style={s.divider}/>
                <p style={s.aboutLbl}>About This Role</p>
                <p style={s.aboutTxt}>{job.description}</p>
              </>}
            </div>
          </div>
        </aside>

        {/* RIGHT: Stepped Form */}
        <main style={s.right}>

          {/* Step Header */}
          <div style={s.formBar}>
            <div>
              <p style={s.applyLbl}>Applying for</p>
              <h2 style={s.applyTitle}>{job.title}</h2>
            </div>
            {/* Step Tracker */}
            <div style={s.stepTrack}>
              {STEPS.map((st, i) => (
                <div key={i} style={{display:"flex",alignItems:"center",gap:0}}>
                  <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
                    <div style={{
                      ...s.stepCircle,
                      background: step > i ? "#0077a3" : step === i ? "#0077a3" : "#e2e8f0",
                      color: step >= i ? "#fff" : "#94a3b8",
                      boxShadow: step === i ? "0 0 0 3px rgba(0,119,163,0.2)" : "none",
                    }}>{step > i ? "✓" : i+1}</div>
                    <span style={{fontSize:10,fontWeight:600,color:step>=i?"#0077a3":"#94a3b8",whiteSpace:"nowrap",maxWidth:64,textAlign:"center",lineHeight:1.3}}>{st.title.split(" ")[0]}</span>
                  </div>
                  {i < 3 && <div style={{width:40,height:2,background:step>i?"#0077a3":"#e2e8f0",margin:"0 4px",marginBottom:18,transition:"background 0.3s"}}/>}
                </div>
              ))}
            </div>
          </div>

          {/* Form Card */}
          <div style={s.formCard}>
            <div style={s.formCardHead}>
              <span style={s.stepNum}>{STEPS[step].num}</span>
              <h3 style={s.stepTitle}>{STEPS[step].title}</h3>
              <span style={s.stepOf}>Step {step+1} of 4</span>
            </div>

            <div style={s.formBody}>

              {/* STEP 0: Personal */}
              {step === 0 && (
                <div style={s.fields}>
                  <G2>
                    <F label="Full Name" name="fullName" value={form.fullName} onChange={handleChange} placeholder="As per government ID" required/>
                    <F label="Email Address" name="email" type="email" value={form.email} onChange={handleChange} placeholder="your@email.com" required/>
                  </G2>
                  <G2>
                    <F label="Mobile Number" name="phone" value={form.phone} onChange={handleChange} placeholder="10-digit number" required/>
                    <F label="Date of Birth" name="dateOfBirth" type="date" value={form.dateOfBirth} onChange={handleChange}/>
                  </G2>
                  <G1>
                    <Sel label="Gender" name="gender" value={form.gender} onChange={handleChange} opts={GENDER_OPTIONS}/>
                  </G1>
                </div>
              )}

              {/* STEP 1: Address */}
              {step === 1 && (
                <div style={s.fields}>
                  <G1>
                    <F label="Street Address" name="address" value={form.address} onChange={handleChange} placeholder="House / Flat, Street, Area"/>
                  </G1>
                  <G3>
                    <F label="City" name="city" value={form.city} onChange={handleChange} placeholder="City"/>
                    <F label="State" name="state" value={form.state} onChange={handleChange} placeholder="State"/>
                    <F label="PIN Code" name="pinCode" value={form.pinCode} onChange={handleChange} placeholder="6-digit PIN"/>
                  </G3>
                </div>
              )}

              {/* STEP 2: Professional */}
              {step === 2 && (
                <div style={s.fields}>
                  <G2>
                    <Sel label="Highest Qualification" name="qualification" value={form.qualification} onChange={handleChange} opts={QUALIFICATIONS}/>
                    <F label="Field of Study" name="fieldOfStudy" value={form.fieldOfStudy} onChange={handleChange} placeholder="e.g. Computer Science"/>
                  </G2>
                  <G2>
                    <Sel label="Total Work Experience" name="workExperience" value={form.workExperience} onChange={handleChange} opts={EXPERIENCE_OPTIONS}/>
                    <F label="Current / Last Job Title" name="currentJobTitle" value={form.currentJobTitle} onChange={handleChange} placeholder="e.g. Sales Executive"/>
                  </G2>
                  <G2>
                    <F label="Expected Salary (per annum)" name="expectedSalary" value={form.expectedSalary} onChange={handleChange} placeholder="e.g. ₹5–8 LPA"/>
                    <Sel label="Notice Period" name="noticePeriod" value={form.noticePeriod} onChange={handleChange} opts={NOTICE_OPTIONS}/>
                  </G2>
                  <G2>
                    <F label="Preferred Work Location" name="preferredLocation" value={form.preferredLocation} onChange={handleChange} placeholder="e.g. Jaipur, Remote"/>
                    <F label="LinkedIn Profile URL" name="linkedIn" value={form.linkedIn} onChange={handleChange} placeholder="linkedin.com/in/yourname"/>
                  </G2>
                  <G1>
                    <F label="Key Skills" name="skills" value={form.skills} onChange={handleChange} placeholder="e.g. Sales, Communication, Tally, MS Excel"/>
                  </G1>
                </div>
              )}

              {/* STEP 3: Application */}
              {step === 3 && (
                <div style={s.fields}>
                  <G1>
                    <div style={s.fw}>
                      <label style={s.fl}>Cover Letter</label>
                      <p style={s.fhint}>Tell us why you are the right person for this role.</p>
                      <textarea name="coverLetter" value={form.coverLetter} onChange={handleChange}
                        placeholder="Briefly describe your relevant experience, key strengths, and what draws you to this opportunity..."
                        rows={7} style={s.ta}/>
                    </div>
                  </G1>
                  <G1>
                    <div style={s.fw}>
                      <label style={s.fl}>Resume / CV</label>
                      <p style={s.fhint}>Accepted formats: PDF, DOC, DOCX — Maximum size 5 MB</p>
                      <label style={{cursor:"pointer"}}>
                        <input type="file" accept=".pdf,.doc,.docx" onChange={e=>setResume(e.target.files[0])} style={{display:"none"}}/>
                        <div style={{...s.resumeBox, borderColor:resume?"#0077a3":"#cdd5de", background:resume?"#f0f9ff":"#fafbfc"}}>
                          {resume
                            ? <><p style={{...s.resumeMain,color:"#0077a3"}}>{resume.name}</p><p style={s.resumeSub}>Click to replace this file</p></>
                            : <><p style={s.resumeMain}>Click to upload your resume</p><p style={s.resumeSub}>PDF, DOC, DOCX — Maximum 5 MB</p></>
                          }
                        </div>
                      </label>
                    </div>
                  </G1>
                  <G1>
                    <p style={{fontSize:13,color:"#64748b",lineHeight:1.75,paddingLeft:14,borderLeft:"3px solid #e2e8f0"}}>
                      By submitting this application, I confirm that all information provided is accurate and complete. I consent to BioBurg storing and processing my data for recruitment purposes.
                    </p>
                  </G1>
                </div>
              )}
            </div>

            {/* Navigation Buttons */}
            <div style={s.navBtns}>
              <div>
                {step > 0 && (
                  <button onClick={back} style={s.btnBack}>← Back</button>
                )}
              </div>
              <div style={{display:"flex",alignItems:"center",gap:12}}>
                <span style={{fontSize:13,color:"#94a3b8"}}>{step+1} / 4</span>
                {step < 3
                  ? <button onClick={next} style={s.btnNext}>Continue →</button>
                  : <button onClick={handleSubmit} disabled={submitting} style={{...s.btnNext,opacity:submitting?0.7:1,minWidth:180}}>
                      {submitting ? "Submitting..." : "Submit Application"}
                    </button>
                }
              </div>
            </div>
          </div>

        </main>
      </div>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────
const Fonts = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=DM+Sans:wght@300;400;500;600&display=swap');
    *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
    @keyframes fadeUp { from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)} }
    @keyframes slideIn { from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:translateX(0)} }
    @keyframes spin { to{transform:rotate(360deg)} }
    input,select,textarea,button { font-family:'DM Sans',sans-serif; }
    input:focus,select:focus,textarea:focus { outline:none; border-color:#0077a3 !important; box-shadow:0 0 0 3px rgba(0,119,163,0.1) !important; }
    input::placeholder,textarea::placeholder { color:#b8c5cf; font-size:13px; }
  `}</style>
);

const G1 = ({children}) => <div style={{display:"grid",gridTemplateColumns:"1fr",gap:20}}>{children}</div>;
const G2 = ({children}) => <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>{children}</div>;
const G3 = ({children}) => <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:20}}>{children}</div>;

const F = ({label,name,value,onChange,placeholder,type="text",required}) => (
  <div style={s.fw}>
    <label style={s.fl}>{label}{required&&<span style={{color:"#ef4444"}}> *</span>}</label>
    <input type={type} name={name} value={value} onChange={onChange} placeholder={placeholder} required={required} style={s.fi}/>
  </div>
);

const Sel = ({label,name,value,onChange,opts}) => (
  <div style={s.fw}>
    <label style={s.fl}>{label}</label>
    <select name={name} value={value} onChange={onChange} style={s.fi}>
      <option value="">Select an option</option>
      {opts.map(o=><option key={o} value={o}>{o}</option>)}
    </select>
  </div>
);

const s = {
  page:{fontFamily:"'DM Sans',sans-serif",background:"#f1f4f8",minHeight:"100vh"},
  center:{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:"60vh",gap:16},
  spinner:{width:36,height:36,border:"3px solid #e2e8f0",borderTop:"3px solid #0077a3",borderRadius:"50%",animation:"spin 0.8s linear infinite"},

  nav:{background:"#fff",borderBottom:"1px solid #e5eaef",padding:"14px 48px",display:"flex",justifyContent:"space-between",alignItems:"center"},
  navBack:{background:"none",border:"none",fontSize:14,fontWeight:500,color:"#0077a3",cursor:"pointer"},
  navCrumb:{fontSize:13,color:"#94a3b8"},

  layout:{maxWidth:1280,margin:"0 auto",padding:"36px 48px 80px",display:"grid",gridTemplateColumns:"340px 1fr",gap:28,alignItems:"start"},

  left:{position:"sticky",top:28},
  jobCard:{background:"#fff",borderRadius:14,overflow:"hidden",boxShadow:"0 2px 20px rgba(0,0,0,0.07)",animation:"fadeUp 0.5s ease both"},
  accentBar:{height:5,background:"linear-gradient(90deg,#002d42,#0077a3,#00afd4)"},
  jobBody:{padding:"28px 28px 34px"},
  jobTypeLbl:{fontSize:11,fontWeight:700,color:"#0077a3",textTransform:"uppercase",letterSpacing:"0.14em",marginBottom:10},
  jobTitle:{fontFamily:"'Playfair Display',serif",fontSize:22,fontWeight:700,color:"#0f172a",lineHeight:1.28,marginBottom:6},
  jobDept:{fontSize:14,color:"#64748b"},
  divider:{height:1,background:"#eef1f5",margin:"20px 0"},
  metaList:{display:"flex",flexDirection:"column",gap:12},
  metaRow:{display:"flex",justifyContent:"space-between",alignItems:"baseline",gap:8},
  metaKey:{fontSize:11,fontWeight:600,color:"#9eaab5",textTransform:"uppercase",letterSpacing:"0.08em"},
  metaVal:{fontSize:14,fontWeight:500,color:"#1e293b",textAlign:"right"},
  aboutLbl:{fontSize:11,fontWeight:700,color:"#9eaab5",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:10},
  aboutTxt:{fontSize:14,color:"#475569",lineHeight:1.85,whiteSpace:"pre-wrap"},

  right:{animation:"fadeUp 0.5s ease 0.1s both"},
  formBar:{background:"#fff",borderRadius:14,padding:"22px 28px",marginBottom:18,boxShadow:"0 2px 20px rgba(0,0,0,0.06)",display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:20,flexWrap:"wrap"},
  applyLbl:{fontSize:11,fontWeight:700,color:"#9eaab5",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:5},
  applyTitle:{fontFamily:"'Playfair Display',serif",fontSize:20,fontWeight:700,color:"#0f172a"},
  stepTrack:{display:"flex",alignItems:"flex-start",gap:0},
  stepCircle:{width:30,height:30,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,transition:"all 0.3s",flexShrink:0},

  formCard:{background:"#fff",borderRadius:14,overflow:"hidden",boxShadow:"0 2px 20px rgba(0,0,0,0.06)"},
  formCardHead:{padding:"18px 32px",borderBottom:"1px solid #eef1f5",display:"flex",alignItems:"center",gap:12,background:"#fbfcfd"},
  stepNum:{fontSize:10,fontWeight:700,color:"#0077a3",letterSpacing:"0.08em",background:"#e4f2f8",padding:"3px 10px",borderRadius:20},
  stepTitle:{fontSize:15,fontWeight:600,color:"#1e293b",flex:1},
  stepOf:{fontSize:12,color:"#94a3b8",fontWeight:500},

  formBody:{padding:"28px 32px",minHeight:320,animation:"slideIn 0.3s ease both"},
  fields:{display:"flex",flexDirection:"column",gap:22},

  fw:{display:"flex",flexDirection:"column",gap:7},
  fl:{fontSize:13,fontWeight:500,color:"#374151"},
  fhint:{fontSize:12,color:"#94a3b8",lineHeight:1.5,marginTop:-2},
  fi:{width:"100%",padding:"11px 15px",border:"1px solid #dde3ea",borderRadius:8,fontSize:14,color:"#1e293b",background:"#fff",transition:"all 0.2s",appearance:"none"},
  ta:{width:"100%",padding:"13px 15px",border:"1px solid #dde3ea",borderRadius:8,fontSize:14,color:"#1e293b",lineHeight:1.75,resize:"vertical",transition:"all 0.2s",fontFamily:"'DM Sans',sans-serif"},

  resumeBox:{border:"1.5px dashed",borderRadius:10,padding:"30px 24px",textAlign:"center",transition:"all 0.2s",marginTop:4},
  resumeMain:{fontSize:14,fontWeight:500,color:"#374151",marginBottom:5},
  resumeSub:{fontSize:12,color:"#94a3b8"},

  navBtns:{padding:"20px 32px",borderTop:"1px solid #eef1f5",display:"flex",justifyContent:"space-between",alignItems:"center",background:"#fbfcfd"},
  btnBack:{background:"none",border:"1px solid #dde3ea",borderRadius:8,padding:"10px 22px",fontSize:14,fontWeight:600,color:"#64748b",cursor:"pointer"},
  btnNext:{background:"#0077a3",color:"#fff",border:"none",borderRadius:8,padding:"11px 28px",fontSize:14,fontWeight:600,cursor:"pointer",transition:"background 0.2s"},

  btnPrimary:{background:"#0077a3",color:"#fff",border:"none",borderRadius:8,padding:"12px 28px",fontSize:14,fontWeight:600,cursor:"pointer"},
  btnGhost:{background:"#f1f5f9",color:"#374151",border:"none",borderRadius:8,padding:"12px 28px",fontSize:14,fontWeight:600,cursor:"pointer"},

  successPage:{minHeight:"80vh",display:"flex",alignItems:"center",justifyContent:"center",padding:"40px 24px"},
  successBox:{background:"#fff",borderRadius:16,padding:"52px 48px",maxWidth:540,width:"100%",boxShadow:"0 8px 40px rgba(0,0,0,0.08)",animation:"fadeUp 0.5s ease both"},
  successH:{fontFamily:"'Playfair Display',serif",fontSize:28,fontWeight:700,color:"#0f172a",marginBottom:14,marginTop:20},
  successSub:{fontSize:15,color:"#64748b",lineHeight:1.8,marginBottom:28},
  successMeta:{background:"#f8fafc",borderRadius:10,padding:"20px 24px",display:"flex",flexDirection:"column",gap:14,borderLeft:"3px solid #0077a3"},
  successRow:{display:"flex",justifyContent:"space-between",alignItems:"center",gap:12},
  successKey:{fontSize:11,fontWeight:700,color:"#94a3b8",textTransform:"uppercase",letterSpacing:"0.08em"},
  successVal:{fontSize:14,fontWeight:500,color:"#1e293b",textAlign:"right"},
};
import { useState, useEffect, useRef } from “react”;
import { supabase } from “./supabase”;

const LIGHT = {
primary:”#1B4332”,primaryLight:”#2D6A4F”,accent:”#F4A261”,
bg:”#F5F5F7”,card:”#FFFFFF”,text:”#1A1A1A”,muted:”#6B6B6B”,border:”#E8E8E8”,
success:”#10B981”,warning:”#F59E0B”,danger:”#EF4444”,info:”#3B82F6”,
navBg:“rgba(255,255,255,0.95)”,headerBg:”#1B4332”,headerText:”#fff”,inputBg:”#F5F5F7”
};
const DARK = {
primary:”#52B788”,primaryLight:”#74C69D”,accent:”#F4A261”,
bg:”#0A0A0A”,card:”#1A1A1A”,text:”#F5F5F7”,muted:”#888”,border:”#2A2A2A”,
success:”#10B981”,warning:”#F59E0B”,danger:”#EF4444”,info:”#3B82F6”,
navBg:“rgba(26,26,26,0.95)”,headerBg:”#0A0A0A”,headerText:”#F5F5F7”,inputBg:”#1A1A1A”
};

const FACULTIES = {
“Communication & Information Sciences”: [“Computer Science”,“Information Technology”,“Library & Information Science”,“Telecommunication Science”],
“Engineering & Technology”: [“Civil Engineering”,“Electrical Engineering”,“Mechanical Engineering”,“Chemical Engineering”,“Materials Science”],
“Sciences”: [“Biochemistry”,“Chemistry”,“Computer Science”,“Mathematics”,“Microbiology”,“Physics”,“Statistics”],
“Social Sciences”: [“Accounting”,“Banking & Finance”,“Business Administration”,“Economics”,“Political Science”,“Sociology”],
“Arts”: [“Arabic”,“English”,“French”,“History”,“Islamic Studies”,“Yoruba”],
“Education”: [“Educational Technology”,“Guidance & Counselling”,“Science Education”,“Social Studies Education”],
“Law”: [“Law”],
“Medicine & Health Sciences”: [“Medicine”,“Nursing”,“Pharmacy”,“Dentistry”],
“Agriculture”: [“Agricultural Economics”,“Agronomy”,“Animal Science”,“Soil Science”],
};

const LEVELS = [“100”,“200”,“300”,“400”,“500”];
const SEMESTERS = [“Harmattan”,“Rain”];

const gradeOf = pct => {
if(pct>=70) return {letter:“A”,gp:5.0,color:”#10B981”};
if(pct>=60) return {letter:“B”,gp:4.0,color:”#3B82F6”};
if(pct>=50) return {letter:“C”,gp:3.0,color:”#F59E0B”};
if(pct>=45) return {letter:“D”,gp:2.0,color:”#F97316”};
if(pct>=40) return {letter:“E”,gp:1.0,color:”#EF4444”};
return {letter:“F”,gp:0.0,color:”#DC2626”};
};

const Ic = ({ n, s=20, c=“currentColor”, w=1.8 }) => {
const icons = {
home:<><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></>,
book:<><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></>,
send:<><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></>,
more:<><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></>,
chevronR:<polyline points="9 18 15 12 9 6"/>,
chevronL:<polyline points="15 18 9 12 15 6"/>,
upload:<><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3"/></>,
file:<><path d="M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9z"/><polyline points="13 2 13 9 20 9"/></>,
video:<><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></>,
phone:<path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 014.38 10a19.79 19.79 0 01-3.07-8.67A2 2 0 013.28 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L7.91 7.91a16 16 0 006.29 6.29l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/>,
sun:<><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/></>,
moon:<path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>,
logout:<><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></>,
settings:<><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></>,
user:<><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></>,
camera:<><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></>,
calendar:<><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>,
users:<><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></>,
chart:<><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></>,
lock:<><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></>,
check:<polyline points="20 6 9 17 4 12"/>,
x:<><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>,
bell:<><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></>,
clip:<><path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></>,
mic:<><path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/><path d="M19 10v2a7 7 0 01-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></>,
videoOff:<><path d="M16 16v1a2 2 0 01-2 2H3a2 2 0 01-2-2V7a2 2 0 012-2h2m5.66 0H14a2 2 0 012 2v3.34l1 1L23 7v10"/><line x1="1" y1="1" x2="23" y2="23"/></>,
micOff:<><line x1="1" y1="1" x2="23" y2="23"/><path d="M9 9v3a3 3 0 005.12 2.12M15 9.34V4a3 3 0 00-5.94-.6"/><path d="M17 16.95A7 7 0 015 12v-2m14 0v2a7 7 0 01-.11 1.23"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></>,
phoneOff:<><path d="M10.68 13.31a16 16 0 003.41 2.6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.42 19.42 0 01-3.33-2.67m-2.67-3.34a19.79 19.79 0 01-3.07-8.63A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91"/><line x1="23" y1="1" x2="1" y2="23"/></>,
plus:<><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>,
search:<><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>,
alert:<><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></>,
};
return <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round">{icons[n]}</svg>;
};

const Spinner = () => (

  <div style={{display:"flex",alignItems:"center",justifyContent:"center",padding:60}}>
    <div style={{width:32,height:32,border:"3px solid #E8E8E8",borderTop:"3px solid #1B4332",borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>
    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
  </div>
);

const Badge = ({text,bg,color}) => (
<span style={{background:bg,color,padding:“3px 10px”,borderRadius:20,fontSize:11,fontWeight:700}}>{text}</span>
);

// ============================================================
// AUTH
// ============================================================
function Auth({onLogin}) {
const [mode,setMode] = useState(“login”);
const [step,setStep] = useState(1);
const [name,setName] = useState(””);
const [email,setEmail] = useState(””);
const [password,setPassword] = useState(””);
const [role,setRole] = useState(“student”);
const [matric,setMatric] = useState(””);
const [staffId,setStaffId] = useState(””);
const [faculty,setFaculty] = useState(””);
const [department,setDepartment] = useState(””);
const [level,setLevel] = useState(“400”);
const [semester,setSemester] = useState(“Harmattan”);
const [error,setError] = useState(””);
const [message,setMessage] = useState(””);
const [loading,setLoading] = useState(false);

const inp = {width:“100%”,border:“1.5px solid #E8E8E8”,borderRadius:12,padding:“13px 16px”,fontSize:15,marginTop:8,boxSizing:“border-box”,background:”#F5F5F7”,color:”#1A1A1A”,outline:“none”,fontFamily:“Inter,sans-serif”};

const handleLogin = async () => {
if(!email||!password) return setError(“Please fill in all fields.”);
setLoading(true); setError(””);
const {data,error:e} = await supabase.auth.signInWithPassword({email,password});
if(e){setError(e.message);setLoading(false);return;}
const {data:profile} = await supabase.from(“profiles”).select(”*”).eq(“id”,data.user.id).single();
onLogin(profile);
setLoading(false);
};

const handleSignup = async () => {
if(!name||!email||!password) return setError(“Please fill in all fields.”);
if(password.length<6) return setError(“Password must be at least 6 characters.”);
if(role===“student”&&(!faculty||!department||!level)) return setError(“Please fill in all fields.”);
setLoading(true); setError(””);
try {
const res = await fetch(`${import.meta.env.VITE_API_URL}/api/signup`,{
method:“POST”,headers:{“Content-Type”:“application/json”},
body:JSON.stringify({
name,email,password,role,
matric:role===“student”?matric:null,
staff_id:role===“lecturer”?staffId:null,
faculty,department,
level:role===“student”?`${level} Level`:null,
semester:role===“student”?semester:null,
})
});
const result = await res.json();
if(result.error){setError(result.error);setLoading(false);return;}
setMessage(“Account created. You can now sign in.”);
setMode(“login”);setStep(1);
} catch(err){setError(“Something went wrong. Please try again.”);}
setLoading(false);
};

const nextStep = () => {
if(!name||!email||!password) return setError(“Please fill in all fields.”);
if(password.length<6) return setError(“Password must be at least 6 characters.”);
setError(””);setStep(2);
};

return (
<div style={{minHeight:“100vh”,background:“linear-gradient(160deg,#1B4332 0%,#2D6A4F 60%,#F4A261 100%)”,display:“flex”,flexDirection:“column”,alignItems:“center”,justifyContent:“center”,padding:24,overflowY:“auto”}}>
<style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}`}</style>
<div style={{animation:“fadeIn 0.5s ease”,width:“100%”,maxWidth:400,paddingBottom:40}}>
<div style={{marginBottom:28,textAlign:“center”}}>
<div style={{width:64,height:64,background:”#F4A261”,borderRadius:18,display:“flex”,alignItems:“center”,justifyContent:“center”,margin:“0 auto 12px”,boxShadow:“0 8px 32px rgba(244,162,97,0.4)”}}>
<Ic n="book" s={30} c="#fff" w={2}/>
</div>
<div style={{color:”#fff”,fontSize:26,fontWeight:800,letterSpacing:-0.5}}>UniLearn</div>
<div style={{color:“rgba(255,255,255,0.6)”,fontSize:13,marginTop:4}}>University of Ilorin</div>
</div>
<div style={{background:”#fff”,borderRadius:24,padding:24,boxShadow:“0 20px 60px rgba(0,0,0,0.15)”}}>
<div style={{display:“flex”,background:”#F5F5F7”,borderRadius:12,padding:4,marginBottom:20}}>
{[“login”,“signup”].map(m=>(
<button key={m} onClick={()=>{setMode(m);setError(””);setMessage(””);setStep(1);}}
style={{flex:1,padding:“10px 0”,borderRadius:10,border:“none”,background:mode===m?”#1B4332”:“transparent”,color:mode===m?”#fff”:”#6B6B6B”,fontWeight:600,cursor:“pointer”,fontSize:13,fontFamily:“Inter,sans-serif”,transition:“all 0.2s”}}>
{m===“login”?“Sign In”:“Create Account”}
</button>
))}
</div>
{error&&<div style={{background:”#FEE2E2”,color:”#EF4444”,padding:“12px 16px”,borderRadius:10,marginBottom:16,fontSize:13}}>{error}</div>}
{message&&<div style={{background:”#D1FAE5”,color:”#10B981”,padding:“12px 16px”,borderRadius:10,marginBottom:16,fontSize:13}}>{message}</div>}

```
      {mode==="login"&&<>
        <div style={{marginBottom:16}}><label style={{fontSize:12,fontWeight:600,color:"#6B6B6B"}}>Email</label><input style={inp} type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@gmail.com"/></div>
        <div style={{marginBottom:24}}><label style={{fontSize:12,fontWeight:600,color:"#6B6B6B"}}>Password</label><input style={inp} type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••"/></div>
        <button onClick={handleLogin} disabled={loading}
          style={{background:"#1B4332",color:"#fff",border:"none",borderRadius:12,padding:"15px 0",width:"100%",fontSize:15,fontWeight:700,cursor:"pointer",opacity:loading?0.7:1,fontFamily:"Inter,sans-serif"}}>
          {loading?"Please wait...":"Sign In"}
        </button>
      </>}

      {mode==="signup"&&step===1&&<>
        <div style={{fontSize:13,fontWeight:700,color:"#1B4332",marginBottom:16}}>Step 1 of 2 — Basic Information</div>
        <div style={{marginBottom:12}}><label style={{fontSize:12,fontWeight:600,color:"#6B6B6B"}}>Full Name</label><input style={inp} type="text" value={name} onChange={e=>setName(e.target.value)} placeholder="Your full name"/></div>
        <div style={{marginBottom:12}}><label style={{fontSize:12,fontWeight:600,color:"#6B6B6B"}}>Email</label><input style={inp} type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@gmail.com"/></div>
        <div style={{marginBottom:16}}><label style={{fontSize:12,fontWeight:600,color:"#6B6B6B"}}>Password</label><input style={inp} type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Min. 6 characters"/></div>
        <div style={{marginBottom:20}}><label style={{fontSize:12,fontWeight:600,color:"#6B6B6B"}}>I am a</label>
          <div style={{display:"flex",gap:8,marginTop:8}}>
            {["student","lecturer"].map(r=>(
              <button key={r} onClick={()=>setRole(r)} style={{flex:1,padding:"12px 0",borderRadius:12,border:`2px solid ${role===r?"#1B4332":"#E8E8E8"}`,background:role===r?"#1B433218":"#fff",color:role===r?"#1B4332":"#6B6B6B",fontWeight:700,cursor:"pointer",fontSize:14,fontFamily:"Inter,sans-serif",textTransform:"capitalize"}}>
                {r==="student"?"🎓 Student":"👨‍🏫 Lecturer"}
              </button>
            ))}
          </div>
        </div>
        <button onClick={nextStep} style={{background:"#1B4332",color:"#fff",border:"none",borderRadius:12,padding:"15px 0",width:"100%",fontSize:15,fontWeight:700,cursor:"pointer",fontFamily:"Inter,sans-serif"}}>
          Next →
        </button>
      </>}

      {mode==="signup"&&step===2&&<>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
          <button onClick={()=>{setStep(1);setError("");}} style={{background:"none",border:"none",cursor:"pointer",padding:4,display:"flex"}}><Ic n="chevronL" s={20} c="#1B4332"/></button>
          <div style={{fontSize:13,fontWeight:700,color:"#1B4332"}}>Step 2 of 2 — Academic Details</div>
        </div>
        <div style={{marginBottom:12}}><label style={{fontSize:12,fontWeight:600,color:"#6B6B6B"}}>Faculty</label>
          <select style={inp} value={faculty} onChange={e=>{setFaculty(e.target.value);setDepartment("");}}>
            <option value="">Select faculty</option>
            {Object.keys(FACULTIES).map(f=><option key={f} value={f}>{f}</option>)}
          </select>
        </div>
        {faculty&&<div style={{marginBottom:12}}><label style={{fontSize:12,fontWeight:600,color:"#6B6B6B"}}>Department</label>
          <select style={inp} value={department} onChange={e=>setDepartment(e.target.value)}>
            <option value="">Select department</option>
            {FACULTIES[faculty].map(d=><option key={d} value={d}>{d}</option>)}
          </select>
        </div>}
        {role==="student"&&<>
          <div style={{marginBottom:12}}><label style={{fontSize:12,fontWeight:600,color:"#6B6B6B"}}>Matric Number</label><input style={inp} type="text" value={matric} onChange={e=>setMatric(e.target.value)} placeholder="e.g. 21/52HL089"/></div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
            <div><label style={{fontSize:12,fontWeight:600,color:"#6B6B6B"}}>Level</label>
              <select style={inp} value={level} onChange={e=>setLevel(e.target.value)}>
                {LEVELS.map(l=><option key={l} value={l}>{l} Level</option>)}
              </select>
            </div>
            <div><label style={{fontSize:12,fontWeight:600,color:"#6B6B6B"}}>Semester</label>
              <select style={inp} value={semester} onChange={e=>setSemester(e.target.value)}>
                {SEMESTERS.map(s=><option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
        </>}
        {role==="lecturer"&&<div style={{marginBottom:12}}><label style={{fontSize:12,fontWeight:600,color:"#6B6B6B"}}>Staff ID</label><input style={inp} type="text" value={staffId} onChange={e=>setStaffId(e.target.value)} placeholder="e.g. UNILORIN/STAFF/001"/></div>}
        <div style={{marginBottom:20}}/>
        <button onClick={handleSignup} disabled={loading}
          style={{background:"#1B4332",color:"#fff",border:"none",borderRadius:12,padding:"15px 0",width:"100%",fontSize:15,fontWeight:700,cursor:"pointer",opacity:loading?0.7:1,fontFamily:"Inter,sans-serif"}}>
          {loading?"Creating account...":"Create Account"}
        </button>
      </>}
    </div>
  </div>
</div>
```

);
}

// ============================================================
// COURSE ENROLLMENT SCREEN
// ============================================================
function CourseEnrollment({user,onDone}) {
const [courses,setCourses] = useState([]);
const [selected,setSelected] = useState([]);
const [loading,setLoading] = useState(true);
const [saving,setSaving] = useState(false);
const [search,setSearch] = useState(””);

useEffect(()=>{
const load = async()=>{
let query = supabase.from(“courses”).select(”*”);
if(user.faculty) query = query.eq(“faculty”,user.faculty);
if(user.level) query = query.eq(“level”,parseInt(user.level));
if(user.semester) query = query.eq(“semester”,user.semester);
const {data} = await query.order(“code”);
if(!data||data.length===0){
const {data:all} = await supabase.from(“courses”).select(”*”).order(“code”);
setCourses(all||[]);
} else {
setCourses(data||[]);
}
setLoading(false);
};
load();
},[]);

const toggle = (id) => {
setSelected(prev=>prev.includes(id)?prev.filter(x=>x!==id):[…prev,id]);
};

const save = async() => {
if(selected.length===0) return;
setSaving(true);
const rows = selected.map(courseId=>({student_id:user.id,course_id:courseId}));
await supabase.from(“enrollments”).upsert(rows,{onConflict:“student_id,course_id”});
setSaving(false);
onDone();
};

const filtered = courses.filter(c=>
!search||c.code.toLowerCase().includes(search.toLowerCase())||c.title.toLowerCase().includes(search.toLowerCase())
);

return (
<div style={{minHeight:“100vh”,background:”#F5F5F7”,fontFamily:“Inter,sans-serif”}}>
<div style={{background:”#1B4332”,color:”#fff”,padding:“20px 20px 16px”,position:“sticky”,top:0,zIndex:100}}>
<div style={{fontSize:20,fontWeight:800,letterSpacing:-0.3}}>Select Your Courses</div>
<div style={{fontSize:13,opacity:0.7,marginTop:4}}>Choose the courses you are registered for this semester</div>
<div style={{display:“flex”,alignItems:“center”,gap:10,background:“rgba(255,255,255,0.15)”,borderRadius:12,padding:“10px 14px”,marginTop:12}}>
<Ic n="search" s={16} c="rgba(255,255,255,0.7)"/>
<input value={search} onChange={e=>setSearch(e.target.value)} placeholder=“Search courses…”
style={{flex:1,border:“none”,background:“transparent”,fontSize:14,color:”#fff”,outline:“none”,fontFamily:“Inter,sans-serif”}}/>
</div>
</div>
<div style={{padding:“16px 20px”,paddingBottom:120}}>
{loading?<Spinner/>:<>
{filtered.length===0&&<div style={{textAlign:“center”,color:”#888”,padding:“40px 0”,fontSize:14}}>No courses found for your selection.</div>}
<div style={{fontSize:12,color:”#888”,marginBottom:12}}>{selected.length} course{selected.length!==1?“s”:””} selected</div>
{filtered.map(c=>{
const isSelected=selected.includes(c.id);
return(
<div key={c.id} onClick={()=>toggle(c.id)}
style={{background:”#fff”,borderRadius:16,padding:16,marginBottom:10,border:`2px solid ${isSelected?c.color:"#E8E8E8"}`,display:“flex”,alignItems:“center”,gap:14,cursor:“pointer”,transition:“all 0.15s”}}>
<div style={{width:44,height:44,background:c.color+“18”,borderRadius:12,display:“flex”,alignItems:“center”,justifyContent:“center”,flexShrink:0}}>
<Ic n="book" s={20} c={c.color}/>
</div>
<div style={{flex:1}}>
<div style={{fontWeight:700,fontSize:14,color:”#1A1A1A”}}>{c.code}</div>
<div style={{fontSize:12,color:”#888”,marginTop:2}}>{c.title}</div>
<div style={{fontSize:11,color:”#888”,marginTop:2}}>{c.department} · {c.level} Level · {c.units} units</div>
</div>
<div style={{width:24,height:24,borderRadius:“50%”,border:`2px solid ${isSelected?c.color:"#E8E8E8"}`,background:isSelected?c.color:“transparent”,display:“flex”,alignItems:“center”,justifyContent:“center”,flexShrink:0,transition:“all 0.15s”}}>
{isSelected&&<Ic n="check" s={14} c="#fff" w={2.5}/>}
</div>
</div>
);
})}
</>}
</div>
<div style={{position:“fixed”,bottom:0,left:“50%”,transform:“translateX(-50%)”,width:“100%”,maxWidth:480,background:”#fff”,borderTop:“1px solid #E8E8E8”,padding:“16px 20px 32px”}}>
<button onClick={save} disabled={selected.length===0||saving}
style={{background:selected.length>0?”#1B4332”:”#E8E8E8”,color:selected.length>0?”#fff”:”#888”,border:“none”,borderRadius:14,padding:“16px 0”,width:“100%”,fontSize:15,fontWeight:700,cursor:selected.length>0?“pointer”:“default”,fontFamily:“Inter,sans-serif”,transition:“all 0.2s”}}>
{saving?“Saving…”:`Continue with ${selected.length} course${selected.length!==1?"s":""}`}
</button>
<button onClick={onDone} style={{background:“none”,border:“none”,color:”#888”,fontSize:13,cursor:“pointer”,width:“100%”,marginTop:10,fontFamily:“Inter,sans-serif”}}>
Skip for now
</button>
</div>
</div>
);
}

// ============================================================
// CALL SCREEN
// ============================================================
function CallScreen({callType,onClose}) {
const [status,setStatus] = useState(“connecting”);
const [muted,setMuted] = useState(false);
const [camOff,setCamOff] = useState(false);
const [elapsed,setElapsed] = useState(0);
const [roomUrl,setRoomUrl] = useState(null);

useEffect(()=>{
const createRoom = async()=>{
try {
const res = await fetch(`${import.meta.env.VITE_API_URL}/api/call/create`,{
method:“POST”,headers:{“Content-Type”:“application/json”},
body:JSON.stringify({callType})
});
const data = await res.json();
if(data.url){setRoomUrl(data.url);setStatus(“active”);}
else setStatus(“error”);
} catch{setStatus(“error”);}
};
createRoom();
},[]);

useEffect(()=>{
if(status!==“active”) return;
const t = setInterval(()=>setElapsed(e=>e+1),1000);
return ()=>clearInterval(t);
},[status]);

const fmt = s=>`${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;

if(roomUrl) return (
<div style={{position:“fixed”,inset:0,background:”#000”,zIndex:999,display:“flex”,flexDirection:“column”}}>
<div style={{display:“flex”,alignItems:“center”,padding:“14px 18px”,background:“rgba(0,0,0,0.9)”}}>
<div style={{flex:1,color:”#fff”,fontWeight:600,fontSize:14}}>{callType===“video”?“Video Call”:“Voice Call”} · {fmt(elapsed)}</div>
<button onClick={onClose} style={{background:”#EF4444”,border:“none”,borderRadius:10,padding:“8px 20px”,color:”#fff”,fontWeight:700,cursor:“pointer”,fontSize:14}}>End Call</button>
</div>
<iframe src={roomUrl} style={{flex:1,border:“none”}} allow=“camera; microphone; fullscreen; display-capture”/>
</div>
);

return (
<div style={{position:“fixed”,inset:0,background:”#0D1B2A”,zIndex:999,display:“flex”,flexDirection:“column”,alignItems:“center”,justifyContent:“center”,gap:32}}>
<style>{`@keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.05)}}`}</style>
<div style={{textAlign:“center”}}>
<div style={{fontSize:12,color:”#94A3B8”,letterSpacing:2,textTransform:“uppercase”,marginBottom:8}}>{callType===“video”?“Video Call”:“Voice Call”}</div>
<div style={{fontSize:22,color:”#fff”,fontWeight:700}}>{status===“connecting”?“Connecting…”:“Connected”}</div>
{status===“error”&&<div style={{fontSize:14,color:”#EF4444”,marginTop:8}}>Failed to connect. Try again.</div>}
</div>
<div style={{width:110,height:110,borderRadius:“50%”,background:“linear-gradient(135deg,#1B4332,#F4A261)”,display:“flex”,alignItems:“center”,justifyContent:“center”,animation:“pulse 2s ease infinite”}}>
<Ic n={callType===“video”?“video”:“phone”} s={44} c=”#fff” w={2}/>
</div>
<div style={{display:“flex”,gap:16}}>
{callType===“video”&&<button onClick={()=>setCamOff(!camOff)} style={{width:56,height:56,borderRadius:“50%”,background:camOff?”#EF4444”:“rgba(255,255,255,0.15)”,border:“none”,cursor:“pointer”,display:“flex”,alignItems:“center”,justifyContent:“center”}}>
<Ic n={camOff?“videoOff”:“video”} s={22} c=”#fff”/>
</button>}
<button onClick={()=>setMuted(!muted)} style={{width:56,height:56,borderRadius:“50%”,background:muted?”#EF4444”:“rgba(255,255,255,0.15)”,border:“none”,cursor:“pointer”,display:“flex”,alignItems:“center”,justifyContent:“center”}}>
<Ic n={muted?“micOff”:“mic”} s={22} c=”#fff”/>
</button>
<button onClick={onClose} style={{width:56,height:56,borderRadius:“50%”,background:”#EF4444”,border:“none”,cursor:“pointer”,display:“flex”,alignItems:“center”,justifyContent:“center”}}>
<Ic n="phoneOff" s={22} c="#fff"/>
</button>
</div>
</div>
);
}

// ============================================================
// LECTURER APP
// ============================================================
function LecturerApp({user,setUser,dark,setDark,C,onCall,onLogout}) {
const [tab,setTab] = useState(“home”);
const [courses,setCourses] = useState([]);
const [selected,setSelected] = useState(null);
const [activeTab,setActiveTab] = useState(“materials”);
const [materials,setMaterials] = useState([]);
const [assignments,setAssignments] = useState([]);
const [quizzes,setQuizzes] = useState([]);
const [students,setStudents] = useState([]);
const [grades,setGrades] = useState([]);
const [submissions,setSubmissions] = useState([]);
const [loading,setLoading] = useState(true);
const [uploading,setUploading] = useState(false);
const [message,setMessage] = useState(””);
const [error,setError] = useState(””);
const [showForm,setShowForm] = useState(false);
const [announcements,setAnnouncements] = useState([]);
const [aForm,setAForm] = useState({title:””,description:””,due_date:””,max_score:20});
const [annForm,setAnnForm] = useState({title:””,body:””,priority:“normal”});
const [qForm,setQForm] = useState({title:””,duration_minutes:15,questions:[]});
const [newQ,setNewQ] = useState({q:””,options:[””,””,””,””],answer:0});
const [gradeForm,setGradeForm] = useState({});
const [selAssignment,setSelAssignment] = useState(null);
const [gradeSubForm,setGradeSubForm] = useState({score:””,feedback:””});

useEffect(()=>{
supabase.from(“courses”).select(”*”).then(({data})=>{setCourses(data||[]);setLoading(false);});
supabase.from(“announcements”).select(”*”).order(“created_at”,{ascending:false}).then(({data})=>setAnnouncements(data||[]));
},[]);

useEffect(()=>{if(selected) loadData();},[selected,activeTab]);

const loadData = async()=>{
if(activeTab===“materials”){const {data}=await supabase.from(“materials”).select(”*”).eq(“course_id”,selected.id).order(“created_at”,{ascending:false});setMaterials(data||[]);}
if(activeTab===“assignments”){const {data}=await supabase.from(“assignments”).select(”*”).eq(“course_id”,selected.id);setAssignments(data||[]);}
if(activeTab===“quizzes”){const {data}=await supabase.from(“quizzes”).select(”*”).eq(“course_id”,selected.id);setQuizzes(data||[]);}
if(activeTab===“grades”){
const {data:g}=await supabase.from(“grades”).select(”*, profiles(name,matric)”).eq(“course_id”,selected.id);
setGrades(g||[]);
// Get enrolled students for this course
const {data:e}=await supabase.from(“enrollments”).select(”*, profiles(*)”).eq(“course_id”,selected.id);
setStudents((e||[]).map(x=>x.profiles));
}
};

const loadSubmissions = async(assignmentId)=>{
const {data}=await supabase.from(“submissions”).select(”*, profiles(name,matric)”).eq(“assignment_id”,assignmentId);
setSubmissions(data||[]);
};

const handleUpload = async(e)=>{
const file=e.target.files[0];if(!file)return;
setUploading(true);setMessage(””);setError(””);
const filePath=`materials/${selected.id}/${Date.now()}_${file.name}`;
const {error:ue}=await supabase.storage.from(“unilearn”).upload(filePath,file);
if(ue){setError(“Upload failed: “+ue.message);setUploading(false);return;}
const {data:urlData}=supabase.storage.from(“unilearn”).getPublicUrl(filePath);
await supabase.from(“materials”).insert({
course_id:selected.id,title:file.name,
type:file.name.match(/.pdf$/i)?“PDF”:file.name.match(/.(mp4|mov)$/i)?“Video”:file.name.match(/.(ppt|pptx)$/i)?“Slides”:“Document”,
file_path:urlData.publicUrl,file_size:`${(file.size/1024/1024).toFixed(1)} MB`,uploaded_by:user.id
});
setMessage(“Uploaded successfully!”);loadData();setUploading(false);
};

const createAssignment = async()=>{
if(!aForm.title||!aForm.due_date)return setError(“Fill in title and due date.”);
await supabase.from(“assignments”).insert({course_id:selected.id,…aForm,max_score:+aForm.max_score,created_by:user.id});
setMessage(“Assignment created!”);setAForm({title:””,description:””,due_date:””,max_score:20});setShowForm(false);loadData();
};

const addQuestion = ()=>{
if(!newQ.q) return setError(“Enter a question.”);
setQForm({…qForm,questions:[…qForm.questions,{…newQ}]});
setNewQ({q:””,options:[””,””,””,””],answer:0});setError(””);
};

const createQuiz = async()=>{
if(!qForm.title||qForm.questions.length===0)return setError(“Add a title and at least one question.”);
await supabase.from(“quizzes”).insert({course_id:selected.id,…qForm,created_by:user.id});
setMessage(“Quiz created!”);setQForm({title:””,duration_minutes:15,questions:[]});setShowForm(false);loadData();
};

const saveGrades = async(studentId)=>{
const g=gradeForm[studentId];if(!g)return;
await supabase.from(“grades”).upsert({student_id:studentId,course_id:selected.id,ca1:+g.ca1||0,ca2:+g.ca2||0,midterm:+g.midterm||0,exam:g.exam?+g.exam:null,updated_by:user.id});
setMessage(“Grades saved!”);
};

const gradeSubmission = async(subId)=>{
await supabase.from(“submissions”).update({score:+gradeSubForm.score,feedback:gradeSubForm.feedback,graded_at:new Date().toISOString(),graded_by:user.id}).eq(“id”,subId);
setMessage(“Submission graded!”);setGradeSubForm({score:””,feedback:””});
loadSubmissions(selAssignment.id);
};

const postAnnouncement = async()=>{
if(!annForm.title||!annForm.body)return setError(“Fill in all fields.”);
await supabase.from(“announcements”).insert({…annForm,author_id:user.id});
setMessage(“Announcement posted!”);setAnnForm({title:””,body:””,priority:“normal”});setShowForm(false);
supabase.from(“announcements”).select(”*”).order(“created_at”,{ascending:false}).then(({data})=>setAnnouncements(data||[]));
};

const inp={width:“100%”,border:`1.5px solid ${C.border}`,borderRadius:12,padding:“12px 16px”,fontSize:14,marginTop:6,boxSizing:“border-box”,background:C.inputBg,color:C.text,outline:“none”,fontFamily:“Inter,sans-serif”};
const NAV=[{id:“home”,icon:“home”,label:“Home”},{id:“courses”,icon:“book”,label:“Courses”},{id:“announce”,icon:“bell”,label:“Announce”},{id:“more”,icon:“more”,label:“More”}];

if(selAssignment) return (
<div style={{fontFamily:“Inter,sans-serif”,background:C.bg,minHeight:“100vh”,maxWidth:480,margin:“0 auto”}}>
<div style={{background:C.headerBg,color:C.headerText,padding:“14px 20px”,display:“flex”,alignItems:“center”,gap:12,position:“sticky”,top:0,zIndex:100}}>
<button onClick={()=>{setSelAssignment(null);setSubmissions([]);}} style={{background:“none”,border:“none”,cursor:“pointer”,padding:4,display:“flex”}}><Ic n="chevronL" s={22} c={C.headerText}/></button>
<div style={{flex:1,fontWeight:800,fontSize:16}}>Submissions — {selAssignment.title}</div>
</div>
<div style={{padding:20}}>
{message&&<div style={{background:”#D1FAE5”,color:”#10B981”,padding:“12px 16px”,borderRadius:12,marginBottom:16,fontSize:13}}>{message}</div>}
<div style={{background:C.card,borderRadius:14,padding:14,marginBottom:16,border:`1px solid ${C.border}`}}>
<div style={{fontWeight:700,color:C.text}}>{submissions.length} submission{submissions.length!==1?“s”:””}</div>
<div style={{fontSize:12,color:C.muted,marginTop:2}}>Max score: {selAssignment.max_score} marks</div>
</div>
{submissions.length===0?<div style={{textAlign:“center”,color:C.muted,padding:“40px 0”,fontSize:14}}>No submissions yet.</div>:
submissions.map(s=>(
<div key={s.id} style={{background:C.card,borderRadius:16,padding:16,marginBottom:12,border:`1px solid ${C.border}`}}>
<div style={{fontWeight:700,fontSize:14,color:C.text}}>{s.profiles?.name}</div>
<div style={{fontSize:12,color:C.muted,marginTop:2}}>Matric: {s.profiles?.matric} · {new Date(s.submitted_at).toLocaleDateString()}</div>
{s.file_path&&<a href={s.file_path} target=”_blank” rel=“noreferrer” style={{display:“inline-flex”,alignItems:“center”,gap:6,background:C.primary+“18”,color:C.primary,borderRadius:10,padding:“8px 14px”,fontSize:12,fontWeight:700,textDecoration:“none”,marginTop:8}}>
<Ic n="file" s={14} c={C.primary}/>View File
</a>}
{s.score!==null?
<div style={{marginTop:10,background:”#D1FAE5”,borderRadius:10,padding:“10px 14px”}}>
<div style={{fontWeight:700,color:”#10B981”}}>Graded: {s.score}/{selAssignment.max_score}</div>
{s.feedback&&<div style={{fontSize:12,color:”#065F46”,marginTop:4}}>{s.feedback}</div>}
</div>:
<div style={{marginTop:10}}>
<div style={{display:“grid”,gridTemplateColumns:“1fr 1fr”,gap:8,marginBottom:8}}>
<div><label style={{fontSize:11,fontWeight:600,color:C.muted}}>Score (/{selAssignment.max_score})</label>
<input type=“number” min=“0” max={selAssignment.max_score} value={gradeSubForm.score} onChange={e=>setGradeSubForm({…gradeSubForm,score:e.target.value})} style={{…inp,marginTop:4}}/></div>
<div><label style={{fontSize:11,fontWeight:600,color:C.muted}}>Feedback</label>
<input value={gradeSubForm.feedback} onChange={e=>setGradeSubForm({…gradeSubForm,feedback:e.target.value})} style={{…inp,marginTop:4}} placeholder=“Optional”/></div>
</div>
<button onClick={()=>gradeSubmission(s.id)} style={{background:C.success,color:”#fff”,border:“none”,borderRadius:10,padding:“10px 0”,width:“100%”,fontSize:13,fontWeight:700,cursor:“pointer”}}>Grade</button>
</div>
}
</div>
))}
</div>
</div>
);

if(selected) return (
<div style={{fontFamily:“Inter,sans-serif”,background:C.bg,minHeight:“100vh”,maxWidth:480,margin:“0 auto”}}>
<style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
<div style={{background:C.headerBg,color:C.headerText,padding:“14px 20px”,display:“flex”,alignItems:“center”,gap:12,position:“sticky”,top:0,zIndex:100}}>
<button onClick={()=>{setSelected(null);setMessage(””);setError(””);setShowForm(false);}} style={{background:“none”,border:“none”,cursor:“pointer”,padding:4,display:“flex”}}><Ic n="chevronL" s={22} c={C.headerText}/></button>
<div style={{flex:1}}><div style={{fontWeight:800,fontSize:16}}>{selected.code}</div><div style={{fontSize:11,opacity:0.7}}>{selected.title}</div></div>
<button onClick={()=>setDark(!dark)} style={{background:“none”,border:“none”,cursor:“pointer”,padding:4,display:“flex”}}><Ic n={dark?“sun”:“moon”} s={20} c={C.headerText}/></button>
</div>
<div style={{padding:“20px”,paddingBottom:40}}>
<div style={{display:“flex”,gap:6,marginBottom:20,overflowX:“auto”,paddingBottom:4}}>
{[[“materials”,“file”,“Materials”],[“assignments”,“clip”,“Tasks”],[“quizzes”,“chart”,“Quizzes”],[“grades”,“users”,“Grades”]].map(([t,icon,label])=>(
<button key={t} onClick={()=>{setActiveTab(t);setShowForm(false);setMessage(””);setError(””);}}
style={{display:“flex”,flexDirection:“column”,alignItems:“center”,gap:4,padding:“10px 14px”,borderRadius:14,border:`1px solid ${activeTab===t?"transparent":C.border}`,background:activeTab===t?C.primary:C.card,color:activeTab===t?”#fff”:C.muted,fontWeight:600,fontSize:11,cursor:“pointer”,whiteSpace:“nowrap”,flexShrink:0}}>
<Ic n={icon} s={16} c={activeTab===t?”#fff”:C.muted}/>{label}
</button>
))}
</div>
{message&&<div style={{background:”#D1FAE5”,color:”#10B981”,padding:“12px 16px”,borderRadius:12,marginBottom:16,fontSize:13,display:“flex”,alignItems:“center”,gap:8}}><Ic n="check" s={16} c="#10B981"/>{message}</div>}
{error&&<div style={{background:”#FEE2E2”,color:”#EF4444”,padding:“12px 16px”,borderRadius:12,marginBottom:16,fontSize:13}}>{error}</div>}

```
    {activeTab==="materials"&&<div>
      <label style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8,background:C.primary,color:"#fff",borderRadius:14,padding:"14px 0",fontWeight:700,fontSize:14,cursor:"pointer",marginBottom:20}}>
        <Ic n="upload" s={18} c="#fff"/>{uploading?"Uploading...":"Upload Material"}
        <input type="file" style={{display:"none"}} onChange={handleUpload} accept=".pdf,.doc,.docx,.ppt,.pptx,.mp4" disabled={uploading}/>
      </label>
      {materials.length===0?<div style={{textAlign:"center",color:C.muted,padding:"40px 0",fontSize:14}}>No materials yet.</div>:
      materials.map(m=>(
        <div key={m.id} style={{background:C.card,borderRadius:16,padding:16,marginBottom:10,border:`1px solid ${C.border}`,display:"flex",alignItems:"center",gap:12}}>
          <div style={{width:44,height:44,background:m.type==="PDF"?"#EF444418":"#3B82F618",borderRadius:12,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
            <Ic n="file" s={20} c={m.type==="PDF"?"#EF4444":"#3B82F6"}/>
          </div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontWeight:600,fontSize:13,color:C.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{m.title}</div>
            <div style={{fontSize:11,color:C.muted,marginTop:2}}>{m.type} · {m.file_size}</div>
          </div>
          <a href={m.file_path} target="_blank" rel="noreferrer" style={{background:C.primary+"18",color:C.primary,borderRadius:10,padding:"8px 14px",fontSize:12,fontWeight:700,textDecoration:"none"}}>View</a>
        </div>
      ))}
    </div>}

    {activeTab==="assignments"&&<div>
      <button onClick={()=>setShowForm(!showForm)} style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8,background:C.primary,color:"#fff",border:"none",borderRadius:14,padding:"14px 0",width:"100%",fontWeight:700,fontSize:14,cursor:"pointer",marginBottom:20}}>
        <Ic n="plus" s={18} c="#fff"/>{showForm?"Cancel":"Create Assignment"}
      </button>
      {showForm&&<div style={{background:C.card,borderRadius:16,padding:20,marginBottom:20,border:`1px solid ${C.border}`}}>
        <div style={{marginBottom:12}}><label style={{fontSize:12,fontWeight:600,color:C.muted}}>Title *</label><input style={inp} value={aForm.title} onChange={e=>setAForm({...aForm,title:e.target.value})} placeholder="Assignment title"/></div>
        <div style={{marginBottom:12}}><label style={{fontSize:12,fontWeight:600,color:C.muted}}>Description</label><textarea style={{...inp,height:80,resize:"vertical"}} value={aForm.description} onChange={e=>setAForm({...aForm,description:e.target.value})} placeholder="Assignment description"/></div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16}}>
          <div><label style={{fontSize:12,fontWeight:600,color:C.muted}}>Due Date *</label><input style={inp} type="date" value={aForm.due_date} onChange={e=>setAForm({...aForm,due_date:e.target.value})}/></div>
          <div><label style={{fontSize:12,fontWeight:600,color:C.muted}}>Max Score</label><input style={inp} type="number" value={aForm.max_score} onChange={e=>setAForm({...aForm,max_score:e.target.value})}/></div>
        </div>
        <button onClick={createAssignment} style={{background:C.success,color:"#fff",border:"none",borderRadius:12,padding:"13px 0",width:"100%",fontSize:14,fontWeight:700,cursor:"pointer"}}>Create</button>
      </div>}
      {assignments.map(a=>{
        const days=Math.ceil((new Date(a.due_date)-new Date())/86400000);
        return(
          <div key={a.id} style={{background:C.card,borderRadius:16,padding:16,marginBottom:12,border:`1px solid ${C.border}`,borderLeft:`4px solid ${days<0?"#EF4444":days<3?"#F59E0B":"#10B981"}`}}>
            <div style={{fontWeight:700,fontSize:14,color:C.text,marginBottom:6}}>{a.title}</div>
            <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:12}}>
              <Badge text={`Due: ${a.due_date}`} bg={C.bg} color={C.muted}/>
              <Badge text={`${a.max_score} marks`} bg="#EFF6FF" color="#3B82F6"/>
            </div>
            <button onClick={async()=>{setSelAssignment(a);await loadSubmissions(a.id);}} style={{background:C.primary+"18",color:C.primary,border:"none",borderRadius:10,padding:"8px 16px",fontSize:12,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",gap:6}}>
              <Ic n="users" s={14} c={C.primary}/>View Submissions
            </button>
          </div>
        );
      })}
    </div>}

    {activeTab==="quizzes"&&<div>
      <button onClick={()=>setShowForm(!showForm)} style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8,background:C.primary,color:"#fff",border:"none",borderRadius:14,padding:"14px 0",width:"100%",fontWeight:700,fontSize:14,cursor:"pointer",marginBottom:20}}>
        <Ic n="plus" s={18} c="#fff"/>{showForm?"Cancel":"Create Quiz"}
      </button>
      {showForm&&<div style={{background:C.card,borderRadius:16,padding:20,marginBottom:20,border:`1px solid ${C.border}`}}>
        <div style={{marginBottom:12}}><label style={{fontSize:12,fontWeight:600,color:C.muted}}>Quiz Title</label><input style={inp} value={qForm.title} onChange={e=>setQForm({...qForm,title:e.target.value})} placeholder="Quiz title"/></div>
        <div style={{marginBottom:16}}><label style={{fontSize:12,fontWeight:600,color:C.muted}}>Duration (minutes)</label><input style={inp} type="number" value={qForm.duration_minutes} onChange={e=>setQForm({...qForm,duration_minutes:+e.target.value})}/></div>
        <div style={{fontWeight:700,fontSize:13,color:C.text,marginBottom:12}}>Questions ({qForm.questions.length})</div>
        {qForm.questions.map((q,i)=>(
          <div key={i} style={{background:C.bg,borderRadius:12,padding:12,marginBottom:10,border:`1px solid ${C.border}`}}>
            <div style={{fontSize:13,fontWeight:600,color:C.text}}>Q{i+1}. {q.q}</div>
            {q.options.map((o,oi)=><div key={oi} style={{fontSize:12,color:oi===q.answer?C.primary:C.muted,marginTop:4}}>{oi===q.answer?"✓ ":""}{o}</div>)}
          </div>
        ))}
        <div style={{background:C.bg,borderRadius:12,padding:14,border:`1px solid ${C.border}`,marginBottom:12}}>
          <div style={{fontSize:12,fontWeight:700,color:C.muted,marginBottom:8}}>Add Question</div>
          <input style={{...inp,marginBottom:8}} value={newQ.q} onChange={e=>setNewQ({...newQ,q:e.target.value})} placeholder="Question text"/>
          {newQ.options.map((o,i)=>(
            <div key={i} style={{display:"flex",gap:8,marginBottom:6,alignItems:"center"}}>
              <input type="radio" checked={newQ.answer===i} onChange={()=>setNewQ({...newQ,answer:i})}/>
              <input style={{...inp,marginTop:0,flex:1}} value={o} onChange={e=>{const opts=[...newQ.options];opts[i]=e.target.value;setNewQ({...newQ,options:opts});}} placeholder={`Option ${i+1}`}/>
            </div>
          ))}
          <button onClick={addQuestion} style={{background:C.info,color:"#fff",border:"none",borderRadius:10,padding:"10px 0",width:"100%",fontSize:13,fontWeight:700,cursor:"pointer",marginTop:8}}>Add Question</button>
        </div>
        <button onClick={createQuiz} style={{background:C.success,color:"#fff",border:"none",borderRadius:12,padding:"13px 0",width:"100%",fontSize:14,fontWeight:700,cursor:"pointer"}}>Save Quiz</button>
      </div>}
      {quizzes.map(q=>(
        <div key={q.id} style={{background:C.card,borderRadius:16,padding:16,marginBottom:10,border:`1px solid ${C.border}`}}>
          <div style={{fontWeight:700,fontSize:14,color:C.text}}>{q.title}</div>
          <div style={{fontSize:12,color:C.muted,marginTop:4}}>{q.questions?.length||0} questions · {q.duration_minutes} mins</div>
        </div>
      ))}
    </div>}

    {activeTab==="grades"&&<div>
      {students.length===0?<div style={{textAlign:"center",color:C.muted,padding:"40px 0",fontSize:14}}>No enrolled students yet.</div>:
      students.filter(Boolean).map(s=>{
        const existing=grades.find(g=>g.student_id===s.id);
        const gf=gradeForm[s.id]||{ca1:existing?.ca1||"",ca2:existing?.ca2||"",midterm:existing?.midterm||"",exam:existing?.exam||""};
        return(
          <div key={s.id} style={{background:C.card,borderRadius:16,padding:16,marginBottom:12,border:`1px solid ${C.border}`}}>
            <div style={{fontWeight:700,fontSize:14,color:C.text}}>{s.name}</div>
            <div style={{fontSize:12,color:C.muted,marginBottom:12}}>Matric: {s.matric}</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:8,marginBottom:12}}>
              {[["CA1",20,"ca1"],["CA2",20,"ca2"],["Mid",30,"midterm"],["Exam",60,"exam"]].map(([l,max,key])=>(
                <div key={key}>
                  <div style={{fontSize:10,fontWeight:700,color:C.muted,marginBottom:4}}>{l}/{max}</div>
                  <input type="number" min="0" max={max} value={gf[key]} onChange={e=>setGradeForm({...gradeForm,[s.id]:{...gf,[key]:e.target.value}})}
                    style={{width:"100%",border:`1.5px solid ${C.border}`,borderRadius:8,padding:"8px",fontSize:14,fontWeight:700,textAlign:"center",background:C.inputBg,color:C.text,outline:"none",boxSizing:"border-box"}}/>
                </div>
              ))}
            </div>
            <button onClick={()=>saveGrades(s.id)} style={{background:C.primary,color:"#fff",border:"none",borderRadius:10,padding:"10px 0",width:"100%",fontSize:13,fontWeight:700,cursor:"pointer"}}>Save Grades</button>
          </div>
        );
      })}
    </div>}
  </div>
</div>
```

);

return (
<div style={{fontFamily:“Inter,sans-serif”,background:C.bg,minHeight:“100vh”,maxWidth:480,margin:“0 auto”,position:“relative”}}>
<style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}@keyframes spin{to{transform:rotate(360deg)}}*{-webkit-tap-highlight-color:transparent;}::-webkit-scrollbar{display:none;}`}</style>
<div style={{background:C.headerBg,color:C.headerText,padding:“14px 20px”,display:“flex”,justifyContent:“space-between”,alignItems:“center”,position:“sticky”,top:0,zIndex:100}}>
<div style={{fontSize:18,fontWeight:800}}>UniLearn</div>
<button onClick={()=>setDark(!dark)} style={{background:“none”,border:“none”,cursor:“pointer”,padding:4,display:“flex”}}><Ic n={dark?“sun”:“moon”} s={20} c={C.headerText}/></button>
</div>
<div style={{padding:“20px”,paddingBottom:100}}>
{tab===“home”&&<div style={{animation:“fadeIn 0.4s ease”}}>
<div style={{background:`linear-gradient(135deg,${C.primary},${C.primaryLight})`,borderRadius:20,padding:24,marginBottom:20,color:”#fff”,position:“relative”,overflow:“hidden”}}>
<div style={{position:“absolute”,top:-20,right:-20,width:120,height:120,borderRadius:“50%”,background:“rgba(255,255,255,0.05)”}}/>
<div style={{fontSize:12,opacity:0.65,letterSpacing:0.5}}>FACULTY OF {user?.faculty?.toUpperCase()||“COMMUNICATION & INFORMATION SCIENCES”}</div>
<div style={{fontSize:26,fontWeight:800,marginTop:8,letterSpacing:-0.5}}>{user?.name}</div>
<div style={{fontSize:13,opacity:0.7,marginTop:4}}>Lecturer · {user?.department}</div>
<div style={{display:“flex”,gap:10,marginTop:16}}>
<div style={{background:“rgba(255,255,255,0.15)”,borderRadius:10,padding:“6px 14px”,fontSize:12,fontWeight:600}}>{courses.length} Courses</div>
</div>
</div>
<div style={{fontSize:12,fontWeight:700,marginBottom:12,color:C.muted,letterSpacing:0.8}}>MANAGE COURSES</div>
{courses.map((c,i)=>(
<div key={c.id} onClick={()=>{setSelected(c);setActiveTab(“materials”);}}
style={{background:C.card,borderRadius:16,padding:16,marginBottom:10,border:`1px solid ${C.border}`,display:“flex”,alignItems:“center”,gap:14,cursor:“pointer”,animation:`fadeIn 0.4s ease ${i*0.05}s both`}}>
<div style={{width:48,height:48,background:c.color+“18”,borderRadius:14,display:“flex”,alignItems:“center”,justifyContent:“center”,flexShrink:0}}>
<Ic n="book" s={22} c={c.color}/>
</div>
<div style={{flex:1}}>
<div style={{fontWeight:700,fontSize:14,color:C.text}}>{c.code}</div>
<div style={{fontSize:12,color:C.muted,marginTop:3}}>{c.title}</div>
<div style={{fontSize:11,color:C.muted,marginTop:2}}>{c.level} Level · {c.units} units</div>
</div>
<Ic n="chevronR" s={16} c={C.muted}/>
</div>
))}
</div>}

```
    {tab==="courses"&&<div>
      <div style={{fontSize:22,fontWeight:800,marginBottom:20,color:C.text}}>All Courses</div>
      {courses.map(c=>(
        <div key={c.id} onClick={()=>{setSelected(c);setActiveTab("materials");setTab("home");}}
          style={{background:C.card,borderRadius:16,padding:16,marginBottom:10,border:`1px solid ${C.border}`,display:"flex",alignItems:"center",gap:14,cursor:"pointer"}}>
          <div style={{width:48,height:48,background:c.color+"18",borderRadius:14,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
            <Ic n="book" s={22} c={c.color}/>
          </div>
          <div style={{flex:1}}>
            <div style={{fontWeight:700,fontSize:14,color:C.text}}>{c.code}</div>
            <div style={{fontSize:12,color:C.muted}}>{c.title}</div>
            <div style={{fontSize:11,color:C.muted}}>{c.department} · {c.level} Level</div>
          </div>
          <Ic n="chevronR" s={16} c={C.muted}/>
        </div>
      ))}
    </div>}

    {tab==="announce"&&<div>
      <div style={{fontSize:22,fontWeight:800,marginBottom:20,color:C.text}}>Announcements</div>
      {message&&<div style={{background:"#D1FAE5",color:"#10B981",padding:"12px 16px",borderRadius:12,marginBottom:16,fontSize:13}}>{message}</div>}
      {error&&<div style={{background:"#FEE2E2",color:"#EF4444",padding:"12px 16px",borderRadius:12,marginBottom:16,fontSize:13}}>{error}</div>}
      <button onClick={()=>setShowForm(!showForm)} style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8,background:C.primary,color:"#fff",border:"none",borderRadius:14,padding:"14px 0",width:"100%",fontWeight:700,fontSize:14,cursor:"pointer",marginBottom:20}}>
        <Ic n="plus" s={18} c="#fff"/>{showForm?"Cancel":"Post Announcement"}
      </button>
      {showForm&&<div style={{background:C.card,borderRadius:16,padding:20,marginBottom:20,border:`1px solid ${C.border}`}}>
        <div style={{marginBottom:12}}><label style={{fontSize:12,fontWeight:600,color:C.muted}}>Title</label><input style={inp} value={annForm.title} onChange={e=>setAnnForm({...annForm,title:e.target.value})} placeholder="Announcement title"/></div>
        <div style={{marginBottom:12}}><label style={{fontSize:12,fontWeight:600,color:C.muted}}>Body</label><textarea style={{...inp,height:100,resize:"vertical"}} value={annForm.body} onChange={e=>setAnnForm({...annForm,body:e.target.value})} placeholder="Details"/></div>
        <div style={{marginBottom:16}}><label style={{fontSize:12,fontWeight:600,color:C.muted}}>Priority</label>
          <select style={inp} value={annForm.priority} onChange={e=>setAnnForm({...annForm,priority:e.target.value})}>
            <option value="normal">Normal</option><option value="high">High (Urgent)</option><option value="low">Low</option>
          </select>
        </div>
        <button onClick={postAnnouncement} style={{background:C.success,color:"#fff",border:"none",borderRadius:12,padding:"13px 0",width:"100%",fontSize:14,fontWeight:700,cursor:"pointer"}}>Post</button>
      </div>}
      {announcements.map(a=>(
        <div key={a.id} style={{background:C.card,borderRadius:16,padding:16,marginBottom:10,border:`1px solid ${C.border}`,borderLeft:`4px solid ${a.priority==="high"?"#EF4444":"#F59E0B"}`}}>
          <div style={{fontWeight:700,fontSize:14,color:C.text,marginBottom:6}}>{a.title}</div>
          <div style={{fontSize:13,color:C.muted,lineHeight:1.6}}>{a.body}</div>
        </div>
      ))}
    </div>}

    {tab==="more"&&<div>
      <div style={{fontSize:22,fontWeight:800,marginBottom:20,color:C.text}}>More</div>
      <div style={{background:C.card,borderRadius:20,padding:20,marginBottom:20,border:`1px solid ${C.border}`,display:"flex",alignItems:"center",gap:16}}>
        <div style={{width:56,height:56,borderRadius:"50%",background:`linear-gradient(135deg,${C.primary},${C.primaryLight})`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
          <Ic n="user" s={26} c="#fff"/>
        </div>
        <div style={{flex:1}}>
          <div style={{fontWeight:800,fontSize:16,color:C.text}}>{user?.name}</div>
          <div style={{fontSize:12,color:C.muted,marginTop:2}}>{user?.email}</div>
          <div style={{fontSize:12,color:C.muted}}>Lecturer · {user?.department}</div>
        </div>
      </div>
      <div style={{background:C.card,borderRadius:16,padding:16,marginBottom:10,border:`1px solid ${C.border}`,display:"flex",alignItems:"center",gap:14}}>
        <div style={{width:44,height:44,background:C.primary+"18",borderRadius:12,display:"flex",alignItems:"center",justifyContent:"center"}}><Ic n={dark?"sun":"moon"} s={20} c={C.primary}/></div>
        <div style={{flex:1}}><div style={{fontWeight:700,fontSize:14,color:C.text}}>{dark?"Light Mode":"Dark Mode"}</div></div>
        <div onClick={()=>setDark(!dark)} style={{width:50,height:28,borderRadius:14,background:dark?C.primary:"#E8E8E8",cursor:"pointer",position:"relative",transition:"background 0.3s",flexShrink:0}}>
          <div style={{position:"absolute",top:4,left:dark?26:4,width:20,height:20,borderRadius:"50%",background:"#fff",transition:"left 0.3s"}}/>
        </div>
      </div>
      <button onClick={onLogout} style={{background:"#FEE2E2",color:"#EF4444",border:"none",borderRadius:14,padding:"16px 0",width:"100%",fontSize:15,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8,marginTop:8}}>
        <Ic n="logout" s={18} c="#EF4444"/>Sign Out
      </button>
    </div>}
  </div>
  <nav style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:480,background:C.navBg,borderTop:`1px solid ${C.border}`,display:"flex",padding:"8px 0 20px",backdropFilter:"blur(20px)"}}>
    {NAV.map(t=>(
      <button key={t.id} onClick={()=>setTab(t.id)} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4,background:"none",border:"none",cursor:"pointer",padding:"6px 0"}}>
        <div style={{width:36,height:36,borderRadius:10,background:tab===t.id?C.primary+"18":"transparent",display:"flex",alignItems:"center",justifyContent:"center"}}>
          <Ic n={t.icon} s={22} c={tab===t.id?C.primary:C.muted} w={tab===t.id?2.2:1.6}/>
        </div>
        <span style={{fontSize:10,fontWeight:tab===t.id?700:500,color:tab===t.id?C.primary:C.muted}}>{t.label}</span>
      </button>
    ))}
  </nav>
</div>
```

);
}

// ============================================================
// COURSE DISCUSSION
// ============================================================
function CourseDiscussion({course,user,C,onCall}) {
const [posts,setPosts] = useState([]);
const [newPost,setNewPost] = useState(””);
const [replies,setReplies] = useState({});
const [expanded,setExpanded] = useState({});
const [replyPosts,setReplyPosts] = useState({});
const [loading,setLoading] = useState(true);

useEffect(()=>{loadPosts();},[]);

const loadPosts = async()=>{
const {data}=await supabase.from(“forum_posts”).select(”*, profiles(name,role)”).eq(“course_id”,course.id).is(“parent_id”,null).order(“created_at”,{ascending:false});
setPosts(data||[]);setLoading(false);
};

const loadReplies = async(postId)=>{
const {data}=await supabase.from(“forum_posts”).select(”*, profiles(name,role)”).eq(“parent_id”,postId).order(“created_at”,{ascending:true});
setReplyPosts(prev=>({…prev,[postId]:data||[]}));
};

const postMessage = async()=>{
if(!newPost.trim()) return;
await supabase.from(“forum_posts”).insert({course_id:course.id,author_id:user.id,content:newPost});
setNewPost(””);loadPosts();
};

const postReply = async(parentId)=>{
const text=replies[parentId];if(!text?.trim()) return;
await supabase.from(“forum_posts”).insert({course_id:course.id,author_id:user.id,content:text,parent_id:parentId});
setReplies({…replies,[parentId]:””});loadReplies(parentId);
};

const toggleExpand = async(postId)=>{
const next=!expanded[postId];
setExpanded({…expanded,[postId]:next});
if(next) loadReplies(postId);
};

return (
<div>
<div style={{display:“flex”,alignItems:“center”,gap:10,marginBottom:16}}>
<div style={{flex:1,fontWeight:700,fontSize:15,color:C.text}}>Discussion</div>
<button onClick={()=>onCall(“video”)} style={{background:”#1B433218”,border:“none”,borderRadius:10,padding:“8px 12px”,cursor:“pointer”,display:“flex”,alignItems:“center”,gap:6}}>
<Ic n="video" s={16} c="#1B4332"/><span style={{fontSize:12,fontWeight:600,color:”#1B4332”}}>Video</span>
</button>
<button onClick={()=>onCall(“voice”)} style={{background:”#F4A26118”,border:“none”,borderRadius:10,padding:“8px 12px”,cursor:“pointer”,display:“flex”,alignItems:“center”,gap:6}}>
<Ic n="phone" s={16} c="#F4A261"/><span style={{fontSize:12,fontWeight:600,color:”#F4A261”}}>Voice</span>
</button>
</div>
<div style={{background:C.card,borderRadius:16,padding:16,marginBottom:16,border:`1px solid ${C.border}`}}>
<textarea value={newPost} onChange={e=>setNewPost(e.target.value)} placeholder=“Ask a question or start a discussion…”
style={{width:“100%”,border:“none”,background:“transparent”,fontSize:14,color:C.text,resize:“none”,outline:“none”,height:80,fontFamily:“Inter,sans-serif”,lineHeight:1.6}}/>
<div style={{display:“flex”,justifyContent:“flex-end”}}>
<button onClick={postMessage} style={{background:”#1B4332”,color:”#fff”,border:“none”,borderRadius:10,padding:“8px 20px”,fontSize:13,fontWeight:700,cursor:“pointer”,display:“flex”,alignItems:“center”,gap:6}}>
<Ic n="send" s={14} c="#fff"/>Post
</button>
</div>
</div>
{loading?<Spinner/>:posts.length===0?<div style={{textAlign:“center”,color:C.muted,padding:“30px 0”,fontSize:14}}>No discussions yet. Start one!</div>:
posts.map(p=>(
<div key={p.id} style={{background:C.card,borderRadius:16,padding:16,marginBottom:12,border:`1px solid ${C.border}`}}>
<div style={{display:“flex”,gap:10,marginBottom:10}}>
<div style={{width:36,height:36,borderRadius:“50%”,background:p.profiles?.role===“lecturer”?”#1B433220”:”#3B82F620”,display:“flex”,alignItems:“center”,justifyContent:“center”,flexShrink:0}}>
<Ic n=“user” s={16} c={p.profiles?.role===“lecturer”?”#1B4332”:”#3B82F6”}/>
</div>
<div style={{flex:1}}>
<div style={{display:“flex”,alignItems:“center”,gap:8,flexWrap:“wrap”}}>
<span style={{fontWeight:700,fontSize:13,color:C.text}}>{p.profiles?.name}</span>
<Badge text={p.profiles?.role} bg={p.profiles?.role===“lecturer”?”#1B433220”:”#3B82F620”} color={p.profiles?.role===“lecturer”?”#1B4332”:”#3B82F6”}/>
<span style={{fontSize:11,color:C.muted,marginLeft:“auto”}}>{new Date(p.created_at).toLocaleDateString()}</span>
</div>
<div style={{fontSize:14,lineHeight:1.6,marginTop:6,color:C.text}}>{p.content}</div>
<button onClick={()=>toggleExpand(p.id)} style={{background:“none”,border:“none”,color:C.primary,fontSize:12,fontWeight:600,cursor:“pointer”,marginTop:8,padding:0}}>
{expanded[p.id]?“Hide replies”:“View replies”}
</button>
</div>
</div>
{expanded[p.id]&&<div style={{paddingLeft:46}}>
{(replyPosts[p.id]||[]).map((r,i)=>(
<div key={i} style={{marginBottom:10,paddingLeft:12,borderLeft:`2px solid ${C.border}`}}>
<div style={{display:“flex”,gap:6,alignItems:“center”,marginBottom:4}}>
<span style={{fontWeight:700,fontSize:12,color:C.text}}>{r.profiles?.name}</span>
<Badge text={r.profiles?.role} bg={r.profiles?.role===“lecturer”?”#1B433220”:”#3B82F620”} color={r.profiles?.role===“lecturer”?”#1B4332”:”#3B82F6”}/>
</div>
<div style={{fontSize:13,lineHeight:1.6,color:C.text}}>{r.content}</div>
</div>
))}
<div style={{display:“flex”,gap:8,marginTop:10}}>
<input value={replies[p.id]||””} onChange={e=>setReplies({…replies,[p.id]:e.target.value})} placeholder=“Write a reply…”
style={{flex:1,border:`1px solid ${C.border}`,borderRadius:10,padding:“8px 12px”,fontSize:13,background:C.bg,color:C.text,outline:“none”,fontFamily:“Inter,sans-serif”}}/>
<button onClick={()=>postReply(p.id)} style={{background:C.primary,border:“none”,borderRadius:10,padding:“8px 14px”,cursor:“pointer”}}>
<Ic n="send" s={14} c="#fff"/>
</button>
</div>
</div>}
</div>
))}
</div>
);
}

// ============================================================
// STUDENT COURSES (enrollment-based)
// ============================================================
function Courses({user,C,onCall}) {
const [courses,setCourses] = useState([]);
const [allCourses,setAllCourses] = useState([]);
const [search,setSearch] = useState(””);
const [selected,setSelected] = useState(null);
const [activeTab,setActiveTab] = useState(“materials”);
const [materials,setMaterials] = useState([]);
const [assignments,setAssignments] = useState([]);
const [quizzes,setQuizzes] = useState([]);
const [attempts,setAttempts] = useState([]);
const [loading,setLoading] = useState(true);
const [uploading,setUploading] = useState(false);
const [message,setMessage] = useState(””);
const [activeQuiz,setActiveQuiz] = useState(null);
const [answers,setAnswers] = useState({});
const [quizResult,setQuizResult] = useState(null);
const [timeLeft,setTimeLeft] = useState(0);
const [selAssignment,setSelAssignment] = useState(null);
const [subFile,setSubFile] = useState(null);
const [submitting,setSubmitting] = useState(false);
const [mySubmissions,setMySubmissions] = useState({});
const [showEnroll,setShowEnroll] = useState(false);
const fRef = useRef();

useEffect(()=>{loadCourses();},[]);

const loadCourses = async()=>{
const {data:enrollments}=await supabase.from(“enrollments”).select(”*, courses(*)”).eq(“student_id”,user.id);
const enrolled=(enrollments||[]).map(e=>e.courses).filter(Boolean);
setCourses(enrolled);
const {data:all}=await supabase.from(“courses”).select(”*”).order(“code”);
setAllCourses(all||[]);
setLoading(false);
};

const filtered = courses.filter(c=>
!search||c.code.toLowerCase().includes(search.toLowerCase())||c.title.toLowerCase().includes(search.toLowerCase())
);

useEffect(()=>{if(selected) loadData();},[selected,activeTab]);

useEffect(()=>{
if(!activeQuiz||quizResult) return;
setTimeLeft(activeQuiz.duration_minutes*60);
const t=setInterval(()=>setTimeLeft(p=>{if(p<=1){submitQuiz();clearInterval(t);return 0;}return p-1;}),1000);
return ()=>clearInterval(t);
},[activeQuiz]);

const loadData = async()=>{
if(activeTab===“materials”){const {data}=await supabase.from(“materials”).select(”*”).eq(“course_id”,selected.id).order(“created_at”,{ascending:false});setMaterials(data||[]);}
if(activeTab===“assignments”){
const {data:a}=await supabase.from(“assignments”).select(”*”).eq(“course_id”,selected.id).order(“due_date”);
setAssignments(a||[]);
const ids=(a||[]).map(x=>x.id);
if(ids.length>0){const {data:s}=await supabase.from(“submissions”).select(”*”).eq(“student_id”,user.id).in(“assignment_id”,ids);
const map={};(s||[]).forEach(x=>{map[x.assignment_id]=x;});setMySubmissions(map);}
}
if(activeTab===“quizzes”){
const {data:q}=await supabase.from(“quizzes”).select(”*”).eq(“course_id”,selected.id);setQuizzes(q||[]);
const {data:att}=await supabase.from(“quiz_attempts”).select(”*”).eq(“student_id”,user.id);setAttempts(att||[]);
}
};

const handleUpload = async(e)=>{
const file=e.target.files[0];if(!file) return;
setUploading(true);setMessage(””);
const filePath=`materials/${selected.id}/${Date.now()}_${file.name}`;
const {error:ue}=await supabase.storage.from(“unilearn”).upload(filePath,file);
if(ue){setMessage(“Upload failed.”);setUploading(false);return;}
const {data:urlData}=supabase.storage.from(“unilearn”).getPublicUrl(filePath);
await supabase.from(“materials”).insert({
course_id:selected.id,title:file.name,
type:file.name.match(/.pdf$/i)?“PDF”:file.name.match(/.(mp4|mov)$/i)?“Video”:file.name.match(/.(ppt|pptx)$/i)?“Slides”:“Document”,
file_path:urlData.publicUrl,file_size:`${(file.size/1024/1024).toFixed(1)} MB`,uploaded_by:user.id
});
setMessage(“Uploaded!”);loadData();setUploading(false);
};

const submitAssignment = async()=>{
if(!subFile) return;
setSubmitting(true);
const filePath=`submissions/${selAssignment.id}/${user.id}_${Date.now()}_${subFile.name}`;
const {error:ue}=await supabase.storage.from(“unilearn”).upload(filePath,subFile);
if(ue){setMessage(“Upload failed.”);setSubmitting(false);return;}
const {data:urlData}=supabase.storage.from(“unilearn”).getPublicUrl(filePath);
await supabase.from(“submissions”).upsert({assignment_id:selAssignment.id,student_id:user.id,file_path:urlData.publicUrl,file_name:subFile.name});
setMessage(“Submitted successfully!”);setSubFile(null);setSelAssignment(null);loadData();setSubmitting(false);
};

const submitQuiz = async()=>{
let score=0;
activeQuiz.questions.forEach((q,i)=>{if(answers[i]===q.answer)score++;});
await supabase.from(“quiz_attempts”).upsert({quiz_id:activeQuiz.id,student_id:user.id,score,total:activeQuiz.questions.length});
setQuizResult({score,total:activeQuiz.questions.length});
};

const enrollInCourse = async(courseId)=>{
await supabase.from(“enrollments”).upsert({student_id:user.id,course_id:courseId},{onConflict:“student_id,course_id”});
loadCourses();
};

const unenroll = async(courseId)=>{
await supabase.from(“enrollments”).delete().eq(“student_id”,user.id).eq(“course_id”,courseId);
loadCourses();
};

const fmt=s=>`${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;

// Assignment submission screen
if(selAssignment) return (
<div>
<div style={{display:“flex”,alignItems:“center”,gap:12,marginBottom:20}}>
<button onClick={()=>{setSelAssignment(null);setSubFile(null);}} style={{background:“none”,border:“none”,cursor:“pointer”,padding:4}}><Ic n="chevronL" s={22} c={C.text}/></button>
<div style={{flex:1,fontWeight:800,fontSize:16,color:C.text}}>{selAssignment.title}</div>
</div>
{message&&<div style={{background:”#D1FAE5”,color:”#10B981”,padding:“12px 16px”,borderRadius:12,marginBottom:16,fontSize:13}}>{message}</div>}
<div style={{background:C.card,borderRadius:16,padding:16,marginBottom:16,border:`1px solid ${C.border}`}}>
<div style={{fontSize:13,color:C.text,lineHeight:1.7,marginBottom:12}}>{selAssignment.description}</div>
<div style={{display:“flex”,gap:8,flexWrap:“wrap”}}>
<Badge text={`Due: ${selAssignment.due_date}`} bg={C.bg} color={C.muted}/>
<Badge text={`${selAssignment.max_score} marks`} bg=”#EFF6FF” color=”#3B82F6”/>
</div>
</div>
{mySubmissions[selAssignment.id]?(
<div style={{background:”#D1FAE5”,borderRadius:16,padding:20,border:“1px solid #A7F3D0”}}>
<div style={{fontWeight:700,fontSize:15,color:”#065F46”,marginBottom:8}}>✓ Submitted</div>
<div style={{fontSize:13,color:”#065F46”}}>File: {mySubmissions[selAssignment.id].file_name}</div>
{mySubmissions[selAssignment.id].score!==null&&<div style={{marginTop:12,background:”#fff”,borderRadius:10,padding:12}}>
<div style={{fontWeight:700,color:”#10B981”,fontSize:16}}>Score: {mySubmissions[selAssignment.id].score}/{selAssignment.max_score}</div>
{mySubmissions[selAssignment.id].feedback&&<div style={{fontSize:13,color:”#6B6B6B”,marginTop:4}}>{mySubmissions[selAssignment.id].feedback}</div>}
</div>}
{mySubmissions[selAssignment.id].score===null&&<div style={{fontSize:12,color:”#065F46”,marginTop:8}}>Awaiting grade from lecturer.</div>}
</div>
):(
<div style={{background:C.card,borderRadius:16,padding:20,border:`1px solid ${C.border}`}}>
<div style={{fontWeight:700,fontSize:15,color:C.text,marginBottom:16}}>Submit Assignment</div>
<input ref={fRef} type=“file” style={{display:“none”}} onChange={e=>setSubFile(e.target.files[0])} accept=”.pdf,.doc,.docx,.zip”/>
{subFile?(
<div style={{background:C.bg,borderRadius:12,padding:12,marginBottom:16,display:“flex”,alignItems:“center”,gap:10}}>
<Ic n="file" s={22} c={C.primary}/>
<div style={{flex:1}}>
<div style={{fontWeight:600,fontSize:13,color:C.text}}>{subFile.name}</div>
<div style={{fontSize:11,color:C.muted}}>{(subFile.size/1024/1024).toFixed(1)} MB</div>
</div>
<button onClick={()=>setSubFile(null)} style={{background:“none”,border:“none”,cursor:“pointer”}}><Ic n="x" s={16} c={C.muted}/></button>
</div>
):(
<button onClick={()=>fRef.current.click()} style={{display:“flex”,flexDirection:“column”,alignItems:“center”,justifyContent:“center”,gap:8,width:“100%”,background:C.bg,border:`2px dashed ${C.border}`,borderRadius:14,padding:“32px 0”,cursor:“pointer”,marginBottom:16}}>
<Ic n="upload" s={28} c={C.muted}/>
<div style={{fontSize:13,fontWeight:600,color:C.muted}}>Tap to choose file</div>
<div style={{fontSize:11,color:C.muted}}>PDF, DOC, ZIP accepted</div>
</button>
)}
<button onClick={submitAssignment} disabled={!subFile||submitting} style={{background:subFile?C.primary:C.muted,color:”#fff”,border:“none”,borderRadius:12,padding:“14px 0”,width:“100%”,fontSize:14,fontWeight:700,cursor:“pointer”,opacity:submitting?0.7:1}}>
{submitting?“Submitting…”:subFile?“Submit Assignment”:“Choose a File First”}
</button>
</div>
)}
</div>
);

// Quiz screen
if(activeQuiz&&!quizResult) return (
<div>
<div style={{display:“flex”,alignItems:“center”,gap:12,marginBottom:16}}>
<button onClick={()=>setActiveQuiz(null)} style={{background:“none”,border:“none”,cursor:“pointer”,padding:4}}><Ic n="chevronL" s={22} c={C.text}/></button>
<div style={{flex:1,fontWeight:700,fontSize:16,color:C.text}}>{activeQuiz.title}</div>
<div style={{background:timeLeft<60?”#FEE2E2”:”#D1FAE5”,color:timeLeft<60?”#EF4444”:”#10B981”,padding:“6px 14px”,borderRadius:20,fontWeight:800,fontSize:14}}>{fmt(timeLeft)}</div>
</div>
<div style={{background:C.card,borderRadius:12,padding:“8px 14px”,marginBottom:16,border:`1px solid ${C.border}`}}>
<div style={{background:C.border,borderRadius:10,height:6,overflow:“hidden”}}>
<div style={{background:C.primary,height:“100%”,width:`${(Object.keys(answers).length/activeQuiz.questions.length)*100}%`,transition:“width 0.3s”,borderRadius:10}}/>
</div>
<div style={{fontSize:11,color:C.muted,marginTop:6,textAlign:“center”}}>{Object.keys(answers).length} of {activeQuiz.questions.length} answered</div>
</div>
{activeQuiz.questions.map((q,qi)=>(
<div key={qi} style={{background:C.card,borderRadius:16,padding:20,marginBottom:14,border:`1px solid ${C.border}`}}>
<div style={{fontWeight:600,fontSize:14,marginBottom:16,lineHeight:1.5,color:C.text}}>Q{qi+1}. {q.q}</div>
{q.options.map((opt,oi)=>(
<div key={oi} onClick={()=>setAnswers({…answers,[qi]:oi})}
style={{display:“flex”,alignItems:“center”,gap:12,padding:“12px 16px”,borderRadius:12,marginBottom:8,border:`2px solid ${answers[qi]===oi?C.primary:C.border}`,background:answers[qi]===oi?C.primary+“10”:C.bg,cursor:“pointer”,transition:“all 0.15s”}}>
<div style={{width:20,height:20,borderRadius:“50%”,border:`2px solid ${answers[qi]===oi?C.primary:"#ccc"}`,display:“flex”,alignItems:“center”,justifyContent:“center”,flexShrink:0}}>
{answers[qi]===oi&&<div style={{width:10,height:10,borderRadius:“50%”,background:C.primary}}/>}
</div>
<span style={{fontSize:14,color:C.text}}>{opt}</span>
</div>
))}
</div>
))}
<button onClick={submitQuiz} style={{background:C.primary,color:”#fff”,border:“none”,borderRadius:14,padding:“16px 0”,width:“100%”,fontSize:15,fontWeight:700,cursor:“pointer”}}>Submit Quiz</button>
</div>
);

// Quiz result
if(quizResult){
const pct=Math.round((quizResult.score/quizResult.total)*100);
const g=gradeOf(pct);
return(
<div style={{textAlign:“center”,paddingTop:40}}>
<div style={{fontSize:72,marginBottom:16}}>{pct===100?“🏆”:pct>=70?“🎉”:pct>=50?“👍”:“📚”}</div>
<div style={{fontSize:56,fontWeight:900,color:g.color,letterSpacing:-2}}>{pct}%</div>
<div style={{fontSize:18,color:C.muted,marginTop:8}}>{quizResult.score} of {quizResult.total} correct · Grade {g.letter}</div>
<div style={{background:C.card,borderRadius:20,padding:24,margin:“24px 0”,border:`1px solid ${C.border}`}}>
<div style={{background:C.border,borderRadius:20,height:12,overflow:“hidden”,marginBottom:12}}>
<div style={{background:g.color,height:“100%”,width:`${pct}%`,borderRadius:20,transition:“width 1s ease”}}/>
</div>
<div style={{fontSize:14,color:C.muted}}>{pct===100?“Perfect! Outstanding 🌟”:pct>=70?“Great job! 💪”:pct>=50?“You passed 📖”:“Keep studying! 💡”}</div>
</div>
<button onClick={()=>{setQuizResult(null);setActiveQuiz(null);setAnswers({});}}
style={{background:C.primary,color:”#fff”,border:“none”,borderRadius:14,padding:“16px 32px”,fontSize:15,fontWeight:700,cursor:“pointer”}}>Done</button>
</div>
);
}

if(loading) return <Spinner/>;

// Add courses modal
if(showEnroll) return (
<div>
<div style={{display:“flex”,alignItems:“center”,gap:12,marginBottom:20}}>
<button onClick={()=>setShowEnroll(false)} style={{background:“none”,border:“none”,cursor:“pointer”,padding:4}}><Ic n="chevronL" s={22} c={C.text}/></button>
<div style={{flex:1,fontSize:20,fontWeight:800,color:C.text}}>Add Courses</div>
</div>
<div style={{display:“flex”,alignItems:“center”,gap:10,background:C.card,borderRadius:14,padding:“10px 16px”,marginBottom:16,border:`1px solid ${C.border}`}}>
<Ic n="search" s={18} c={C.muted}/>
<input value={search} onChange={e=>setSearch(e.target.value)} placeholder=“Search all courses…”
style={{flex:1,border:“none”,background:“transparent”,fontSize:14,color:C.text,outline:“none”,fontFamily:“Inter,sans-serif”}}/>
</div>
{allCourses.filter(c=>!search||c.code.toLowerCase().includes(search.toLowerCase())||c.title.toLowerCase().includes(search.toLowerCase())).map(c=>{
const enrolled=courses.find(x=>x.id===c.id);
return(
<div key={c.id} style={{background:C.card,borderRadius:16,padding:16,marginBottom:10,border:`2px solid ${enrolled?c.color:C.border}`,display:“flex”,alignItems:“center”,gap:12}}>
<div style={{width:44,height:44,background:c.color+“18”,borderRadius:12,display:“flex”,alignItems:“center”,justifyContent:“center”,flexShrink:0}}>
<Ic n="book" s={20} c={c.color}/>
</div>
<div style={{flex:1}}>
<div style={{fontWeight:700,fontSize:14,color:C.text}}>{c.code}</div>
<div style={{fontSize:12,color:C.muted}}>{c.title}</div>
<div style={{fontSize:11,color:C.muted}}>{c.department} · {c.level} Level · {c.units}u</div>
</div>
<button onClick={()=>enrolled?unenroll(c.id):enrollInCourse(c.id)}
style={{background:enrolled?”#FEE2E2”:C.primary,color:enrolled?”#EF4444”:”#fff”,border:“none”,borderRadius:10,padding:“8px 14px”,fontSize:12,fontWeight:700,cursor:“pointer”,flexShrink:0}}>
{enrolled?“Remove”:“Add”}
</button>
</div>
);
})}
</div>
);

// Course detail
if(selected) return (
<div>
<div style={{display:“flex”,alignItems:“center”,gap:12,marginBottom:20}}>
<button onClick={()=>{setSelected(null);setMessage(””);}} style={{background:“none”,border:“none”,cursor:“pointer”,padding:4}}><Ic n="chevronL" s={22} c={C.text}/></button>
<div style={{flex:1}}>
<div style={{fontWeight:800,fontSize:17,color:C.text}}>{selected.code}</div>
<div style={{fontSize:12,color:C.muted,marginTop:2}}>{selected.title}</div>
</div>
<Badge text={`${selected.units}u`} bg={selected.color+“18”} color={selected.color}/>
</div>
<div style={{display:“flex”,gap:6,marginBottom:20,overflowX:“auto”,paddingBottom:4}}>
{[[“materials”,“file”,“Materials”],[“assignments”,“clip”,“Tasks”],[“quizzes”,“chart”,“Quizzes”],[“discussion”,“send”,“Discussion”]].map(([t,icon,label])=>(
<button key={t} onClick={()=>setActiveTab(t)}
style={{display:“flex”,flexDirection:“column”,alignItems:“center”,gap:4,padding:“10px 16px”,borderRadius:14,border:`1px solid ${activeTab===t?"transparent":C.border}`,background:activeTab===t?C.primary:C.card,color:activeTab===t?”#fff”:C.muted,fontWeight:600,fontSize:11,cursor:“pointer”,whiteSpace:“nowrap”,flexShrink:0}}>
<Ic n={icon} s={16} c={activeTab===t?”#fff”:C.muted}/>{label}
</button>
))}
</div>
{message&&<div style={{background:”#D1FAE5”,color:”#10B981”,padding:“12px 16px”,borderRadius:10,marginBottom:16,fontSize:13,display:“flex”,alignItems:“center”,gap:8}}><Ic n="check" s={16} c="#10B981"/>{message}</div>}

```
  {activeTab==="materials"&&<div>
    <label style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8,background:C.primary,color:"#fff",borderRadius:14,padding:"14px 0",fontWeight:700,fontSize:14,cursor:"pointer",marginBottom:20}}>
      <Ic n="upload" s={18} c="#fff"/>{uploading?"Uploading...":"Upload Material"}
      <input type="file" style={{display:"none"}} onChange={handleUpload} accept=".pdf,.doc,.docx,.ppt,.pptx,.mp4" disabled={uploading}/>
    </label>
    {materials.length===0?<div style={{textAlign:"center",color:C.muted,padding:"40px 0",fontSize:14}}>No materials yet.</div>:
    materials.map(m=>(
      <div key={m.id} style={{background:C.card,borderRadius:16,padding:16,marginBottom:10,border:`1px solid ${C.border}`,display:"flex",alignItems:"center",gap:12}}>
        <div style={{width:44,height:44,background:m.type==="PDF"?"#EF444418":m.type==="Video"?"#3B82F618":"#F59E0B18",borderRadius:12,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
          <Ic n="file" s={20} c={m.type==="PDF"?"#EF4444":m.type==="Video"?"#3B82F6":"#F59E0B"}/>
        </div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontWeight:600,fontSize:13,color:C.text,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{m.title}</div>
          <div style={{fontSize:11,color:C.muted,marginTop:2}}>{m.type} · {m.file_size}</div>
        </div>
        <a href={m.file_path} target="_blank" rel="noreferrer" style={{background:C.primary+"18",color:C.primary,borderRadius:10,padding:"8px 14px",fontSize:12,fontWeight:700,textDecoration:"none",flexShrink:0}}>View</a>
      </div>
    ))}
  </div>}

  {activeTab==="assignments"&&<div>
    {assignments.length===0?<div style={{textAlign:"center",color:C.muted,padding:"40px 0",fontSize:14}}>No assignments yet.</div>:
    assignments.map(a=>{
      const days=Math.ceil((new Date(a.due_date)-new Date())/86400000);
      const overdue=days<0;
      const mySub=mySubmissions[a.id];
      return(
        <div key={a.id} onClick={()=>setSelAssignment(a)} style={{background:C.card,borderRadius:16,padding:16,marginBottom:12,border:`1px solid ${C.border}`,borderLeft:`4px solid ${mySub?"#10B981":overdue?"#EF4444":days<3?"#F59E0B":"#10B981"}`,cursor:"pointer"}}>
          <div style={{fontWeight:700,fontSize:14,color:C.text,marginBottom:8}}>{a.title}</div>
          <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
            {mySub?<Badge text={mySub.score!==null?`Graded: ${mySub.score}/${a.max_score}`:"Submitted"} bg={mySub.score!==null?"#D1FAE5":"#EFF6FF"} color={mySub.score!==null?"#10B981":"#3B82F6"}/>:
            <Badge text={overdue?"Overdue":`${days}d left`} bg={overdue?"#FEE2E2":days<3?"#FEF3C7":"#D1FAE5"} color={overdue?"#EF4444":days<3?"#F59E0B":"#10B981"}/>}
            <Badge text={`${a.max_score} marks`} bg="#EFF6FF" color="#3B82F6"/>
            <div style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:4,color:C.muted,fontSize:12}}>
              <span>{mySub?"View":"Submit"}</span><Ic n="chevronR" s={14} c={C.muted}/>
            </div>
          </div>
        </div>
      );
    })}
  </div>}

  {activeTab==="quizzes"&&<div>
    {quizzes.length===0?<div style={{textAlign:"center",color:C.muted,padding:"40px 0",fontSize:14}}>No quizzes yet.</div>:
    quizzes.map(q=>{
      const attempt=attempts.find(a=>a.quiz_id===q.id);
      const pct=attempt?Math.round((attempt.score/attempt.total)*100):null;
      const g=pct!==null?gradeOf(pct):null;
      return(
        <div key={q.id} style={{background:C.card,borderRadius:16,padding:16,marginBottom:10,border:`1px solid ${C.border}`}}>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <div style={{width:44,height:44,background:"#8B5CF618",borderRadius:12,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
              <Ic n="chart" s={20} c="#8B5CF6"/>
            </div>
            <div style={{flex:1}}>
              <div style={{fontWeight:700,fontSize:14,color:C.text}}>{q.title}</div>
              <div style={{fontSize:12,color:C.muted,marginTop:4}}>{q.questions?.length||0} questions · {q.duration_minutes} mins</div>
              {attempt&&<div style={{marginTop:6,display:"flex",gap:6}}>
                <Badge text={`${attempt.score}/${attempt.total} · ${pct}%`} bg={g.color+"20"} color={g.color}/>
                <Badge text={`Grade ${g.letter}`} bg={g.color+"20"} color={g.color}/>
              </div>}
            </div>
            {attempt?<Badge text="Done" bg="#D1FAE5" color="#10B981"/>:
              <button onClick={()=>{setActiveQuiz(q);setAnswers({});setQuizResult(null);}}
                style={{background:C.primary,color:"#fff",border:"none",borderRadius:10,padding:"8px 16px",fontSize:13,fontWeight:700,cursor:"pointer",flexShrink:0}}>Start</button>
            }
          </div>
        </div>
      );
    })}
  </div>}

  {activeTab==="discussion"&&<CourseDiscussion course={selected} user={user} C={C} onCall={onCall}/>}
</div>
```

);

// Courses list
return (
<div>
<div style={{display:“flex”,alignItems:“center”,marginBottom:16}}>
<div style={{fontSize:22,fontWeight:800,color:C.text,flex:1,letterSpacing:-0.5}}>My Courses</div>
<button onClick={()=>{setShowEnroll(true);setSearch(””);}} style={{background:C.primary,color:”#fff”,border:“none”,borderRadius:10,padding:“8px 14px”,fontSize:12,fontWeight:700,cursor:“pointer”,display:“flex”,alignItems:“center”,gap:6}}>
<Ic n="plus" s={14} c="#fff"/>Add
</button>
</div>
<div style={{display:“flex”,alignItems:“center”,gap:10,background:C.card,borderRadius:14,padding:“10px 16px”,marginBottom:20,border:`1px solid ${C.border}`}}>
<Ic n="search" s={18} c={C.muted}/>
<input value={search} onChange={e=>setSearch(e.target.value)} placeholder=“Search your courses…”
style={{flex:1,border:“none”,background:“transparent”,fontSize:14,color:C.text,outline:“none”,fontFamily:“Inter,sans-serif”}}/>
{search&&<button onClick={()=>setSearch(””)} style={{background:“none”,border:“none”,cursor:“pointer”,padding:0}}><Ic n="x" s={16} c={C.muted}/></button>}
</div>
{courses.length===0?
<div style={{textAlign:“center”,padding:“60px 20px”}}>
<div style={{fontSize:48,marginBottom:16}}>📚</div>
<div style={{fontWeight:700,fontSize:18,color:C.text,marginBottom:8}}>No courses yet</div>
<div style={{color:C.muted,fontSize:14,marginBottom:24}}>Add your registered courses to get started</div>
<button onClick={()=>setShowEnroll(true)} style={{background:C.primary,color:”#fff”,border:“none”,borderRadius:14,padding:“14px 32px”,fontSize:15,fontWeight:700,cursor:“pointer”}}>Add Courses</button>
</div>:
filtered.map((c,i)=>(
<div key={c.id} onClick={()=>setSelected(c)}
style={{background:C.card,borderRadius:16,padding:16,marginBottom:10,border:`1px solid ${C.border}`,display:“flex”,alignItems:“center”,gap:14,cursor:“pointer”,animation:`fadeIn 0.4s ease ${i*0.05}s both`}}>
<div style={{width:48,height:48,background:c.color+“18”,borderRadius:14,display:“flex”,alignItems:“center”,justifyContent:“center”,flexShrink:0}}>
<Ic n="book" s={22} c={c.color}/>
</div>
<div style={{flex:1}}>
<div style={{fontWeight:700,fontSize:14,color:C.text}}>{c.code}</div>
<div style={{fontSize:12,color:C.muted,marginTop:3}}>{c.title}</div>
</div>
<div style={{display:“flex”,flexDirection:“column”,alignItems:“flex-end”,gap:4}}>
<Badge text={`${c.units}u`} bg={c.color+“18”} color={c.color}/>
<Ic n="chevronR" s={16} c={C.muted}/>
</div>
</div>
))}
</div>
);
}

// ============================================================
// DASHBOARD
// ============================================================
function Dashboard({user,C,setTab}) {
const [announcements,setAnnouncements] = useState([]);
const [enrolledCourses,setEnrolledCourses] = useState([]);
const [loading,setLoading] = useState(true);
const [greeting,setGreeting] = useState(””);
const [upcomingDeadlines,setUpcomingDeadlines] = useState([]);

useEffect(()=>{
const h=new Date().getHours();
setGreeting(h<12?“Good morning”:h<17?“Good afternoon”:“Good evening”);
const load=async()=>{
const {data:ann}=await supabase.from(“announcements”).select(”*”).order(“created_at”,{ascending:false}).limit(5);
const {data:enr}=await supabase.from(“enrollments”).select(”*, courses(*)”).eq(“student_id”,user.id);
const enrolled=(enr||[]).map(e=>e.courses).filter(Boolean);
setEnrolledCourses(enrolled);
if(enrolled.length>0){
const ids=enrolled.map(c=>c.id);
const {data:asgn}=await supabase.from(“assignments”).select(”*, courses(code,color)”).in(“course_id”,ids).order(“due_date”);
const upcoming=(asgn||[]).filter(a=>{
const days=Math.ceil((new Date(a.due_date)-new Date())/86400000);
return days>=0&&days<=7;
});
setUpcomingDeadlines(upcoming);
}
setAnnouncements(ann||[]);
setLoading(false);
};
load();
},[]);

if(loading) return <Spinner/>;

return (
<div style={{animation:“fadeIn 0.4s ease”}}>
<div style={{background:`linear-gradient(135deg,${C.primary},${C.primaryLight})`,borderRadius:20,padding:24,marginBottom:20,color:”#fff”,position:“relative”,overflow:“hidden”}}>
<div style={{position:“absolute”,top:-20,right:-20,width:120,height:120,borderRadius:“50%”,background:“rgba(255,255,255,0.05)”}}/>
<div style={{fontSize:12,opacity:0.65,fontWeight:500,letterSpacing:0.5}}>FACULTY OF {user?.faculty?.toUpperCase()||“COMMUNICATION & INFORMATION SCIENCES”}</div>
<div style={{fontSize:13,opacity:0.8,marginTop:4}}>{greeting} 👋</div>
<div style={{fontSize:26,fontWeight:800,marginTop:4,letterSpacing:-0.5}}>{user?.name}</div>
<div style={{fontSize:13,opacity:0.7,marginTop:4}}>{user?.department} · {user?.level}</div>
<div style={{display:“flex”,gap:10,marginTop:16,flexWrap:“wrap”}}>
<div style={{background:“rgba(255,255,255,0.15)”,borderRadius:10,padding:“6px 14px”,fontSize:12,fontWeight:600}}>{enrolledCourses.length} Courses</div>
<div style={{background:“rgba(255,255,255,0.15)”,borderRadius:10,padding:“6px 14px”,fontSize:12,fontWeight:600}}>{user?.semester||“Harmattan”} Semester</div>
<div style={{background:“rgba(255,255,255,0.15)”,borderRadius:10,padding:“6px 14px”,fontSize:12,fontWeight:600}}>2024/2025</div>
</div>
</div>

```
  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:24}}>
    {[
      {l:"My Courses",v:enrolledCourses.length,color:"#3B82F6",bg:"#EFF6FF",icon:"book",tab:"courses"},
      {l:"Timetable",v:"View",color:"#10B981",bg:"#D1FAE5",icon:"calendar",tab:"timetable"},
      {l:"Grades",v:"CGPA",color:"#F59E0B",bg:"#FEF3C7",icon:"chart",tab:"grades"},
      {l:"Attendance",v:"Track",color:"#EF4444",bg:"#FEE2E2",icon:"users",tab:"attendance"},
    ].map((s,i)=>(
      <div key={i} onClick={()=>s.tab&&setTab(s.tab)} style={{background:C.card,borderRadius:16,padding:16,border:`1px solid ${C.border}`,cursor:"pointer"}}>
        <div style={{width:36,height:36,background:s.bg,borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:10}}>
          <Ic n={s.icon} s={18} c={s.color}/>
        </div>
        <div style={{fontSize:22,fontWeight:800,color:s.color}}>{s.v}</div>
        <div style={{fontSize:12,color:C.muted,marginTop:2}}>{s.l}</div>
      </div>
    ))}
  </div>

  {enrolledCourses.length===0&&(
    <div style={{background:C.card,borderRadius:16,padding:24,marginBottom:20,border:`1px solid ${C.border}`,textAlign:"center"}}>
      <div style={{fontSize:40,marginBottom:12}}>📚</div>
      <div style={{fontWeight:700,fontSize:16,color:C.text,marginBottom:8}}>Add your courses</div>
      <div style={{color:C.muted,fontSize:13,marginBottom:16}}>Go to the Courses tab to add the courses you are registered for this semester.</div>
      <button onClick={()=>setTab("courses")} style={{background:C.primary,color:"#fff",border:"none",borderRadius:12,padding:"12px 24px",fontSize:14,fontWeight:700,cursor:"pointer"}}>Add Courses</button>
    </div>
  )}

  {upcomingDeadlines.length>0&&<>
    <div style={{fontSize:12,fontWeight:700,marginBottom:12,color:C.muted,letterSpacing:0.8}}>⏰ UPCOMING DEADLINES</div>
    {upcomingDeadlines.map(a=>{
      const days=Math.ceil((new Date(a.due_date)-new Date())/86400000);
      return(
        <div key={a.id} onClick={()=>setTab("courses")} style={{background:C.card,borderRadius:14,padding:14,marginBottom:8,border:`1px solid ${C.border}`,borderLeft:`4px solid ${days<=2?"#EF4444":"#F59E0B"}`,display:"flex",alignItems:"center",gap:12,cursor:"pointer"}}>
          <div style={{width:36,height:36,background:(a.courses?.color||"#999")+"18",borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
            <Ic n="clip" s={16} c={a.courses?.color||"#999"}/>
          </div>
          <div style={{flex:1}}>
            <div style={{fontWeight:600,fontSize:13,color:C.text}}>{a.title}</div>
            <div style={{fontSize:11,color:C.muted,marginTop:2}}>{a.courses?.code} · Due {a.due_date}</div>
          </div>
          <Badge text={days===0?"Today":`${days}d`} bg={days<=2?"#FEE2E2":"#FEF3C7"} color={days<=2?"#EF4444":"#F59E0B"}/>
        </div>
      );
    })}
  </>}

  {announcements.length>0&&<>
    <div style={{fontSize:12,fontWeight:700,marginBottom:12,color:C.muted,letterSpacing:0.8,marginTop:20}}>ANNOUNCEMENTS</div>
    {announcements.map((a,i)=>(
      <div key={a.id} style={{background:C.card,borderRadius:16,padding:16,marginBottom:10,border:`1px solid ${C.border}`,borderLeft:`4px solid ${a.priority==="high"?"#EF4444":"#F59E0B"}`}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
          <div style={{fontWeight:700,fontSize:14,color:C.text,flex:1}}>{a.title}</div>
          {a.priority==="high"&&<Badge text="Urgent" bg="#FEE2E2" color="#EF4444"/>}
        </div>
        <div style={{fontSize:13,color:C.muted,lineHeight:1.6}}>{a.body}</div>
      </div>
    ))}
  </>}

  {enrolledCourses.length>0&&<>
    <div style={{fontSize:12,fontWeight:700,marginBottom:12,color:C.muted,letterSpacing:0.8,marginTop:24}}>YOUR COURSES</div>
    {enrolledCourses.map((c,i)=>(
      <div key={c.id} onClick={()=>setTab("courses")} style={{background:C.card,borderRadius:16,padding:16,marginBottom:10,border:`1px solid ${C.border}`,display:"flex",alignItems:"center",gap:14,cursor:"pointer"}}>
        <div style={{width:44,height:44,background:c.color+"18",borderRadius:12,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
          <Ic n="book" s={20} c={c.color}/>
        </div>
        <div style={{flex:1}}>
          <div style={{fontWeight:700,fontSize:14,color:C.text}}>{c.code}</div>
          <div style={{fontSize:12,color:C.muted,marginTop:2}}>{c.title}</div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <Badge text={`${c.units}u`} bg={c.color+"18"} color={c.color}/>
          <Ic n="chevronR" s={16} c={C.muted}/>
        </div>
      </div>
    ))}
  </>}
</div>
```

);
}

// ============================================================
// TIMETABLE
// ============================================================
function Timetable({user,C}) {
const [slots,setSlots] = useState([]);
const [loading,setLoading] = useState(true);
const days=[“Monday”,“Tuesday”,“Wednesday”,“Thursday”,“Friday”];
const today=[“Sunday”,“Monday”,“Tuesday”,“Wednesday”,“Thursday”,“Friday”,“Saturday”][new Date().getDay()];

useEffect(()=>{
const load = async()=>{
// Get enrolled course IDs
const {data:enr}=await supabase.from(“enrollments”).select(“course_id”).eq(“student_id”,user.id);
const ids=(enr||[]).map(e=>e.course_id);
if(ids.length>0){
const {data}=await supabase.from(“timetable”).select(”*, courses(code,title,color)”).in(“course_id”,ids).order(“start_time”);
setSlots(data||[]);
}
setLoading(false);
};
load();
},[]);

if(loading) return <Spinner/>;

return (
<div>
<div style={{fontSize:22,fontWeight:800,marginBottom:4,color:C.text,letterSpacing:-0.5}}>Timetable</div>
<div style={{fontSize:13,color:C.muted,marginBottom:20}}>2024/2025 · {user?.semester||“Harmattan”} Semester</div>
{slots.length===0&&<div style={{textAlign:“center”,color:C.muted,padding:“40px 0”,fontSize:14}}>Add your courses to see your timetable.</div>}
{days.map(day=>{
const daySlots=slots.filter(s=>s.day===day);
const isToday=day===today;
if(slots.length>0||daySlots.length>0) return(
<div key={day} style={{marginBottom:20}}>
<div style={{display:“flex”,alignItems:“center”,gap:10,marginBottom:10}}>
<div style={{fontWeight:700,fontSize:14,color:isToday?C.primary:C.text}}>{day}</div>
{isToday&&<Badge text="Today" bg={C.primary} color="#fff"/>}
</div>
{daySlots.length===0?
<div style={{background:C.card,borderRadius:12,padding:“14px 16px”,border:`1px solid ${C.border}`,color:C.muted,fontSize:13}}>No classes</div>:
daySlots.map((slot,i)=>(
<div key={i} style={{background:C.card,borderRadius:14,padding:16,marginBottom:8,border:`1px solid ${C.border}`,borderLeft:`4px solid ${slot.courses?.color||C.primary}`,display:“flex”,alignItems:“center”,gap:14}}>
<div style={{textAlign:“center”,minWidth:60}}>
<div style={{fontSize:13,fontWeight:700,color:C.primary}}>{slot.start_time}</div>
<div style={{fontSize:11,color:C.muted,marginTop:2}}>{slot.end_time}</div>
</div>
<div style={{flex:1}}>
<div style={{fontWeight:700,fontSize:14,color:C.text}}>{slot.courses?.code}</div>
<div style={{fontSize:12,color:C.muted,marginTop:2}}>{slot.courses?.title}</div>
<div style={{fontSize:11,color:C.muted,marginTop:2}}>📍 {slot.venue}</div>
</div>
</div>
))
}
</div>
);
return null;
})}
</div>
);
}

// ============================================================
// GRADES
// ============================================================
function Grades({user,C}) {
const [grades,setGrades] = useState([]);
const [courses,setCourses] = useState([]);
const [loading,setLoading] = useState(true);
const [animCGPA,setAnimCGPA] = useState(0);

useEffect(()=>{
const load=async()=>{
const {data:g}=await supabase.from(“grades”).select(”*”).eq(“student_id”,user.id);
const {data:enr}=await supabase.from(“enrollments”).select(”*, courses(*)”).eq(“student_id”,user.id);
const enrolled=(enr||[]).map(e=>e.courses).filter(Boolean);
setGrades(g||[]);setCourses(enrolled);setLoading(false);
};
load();
},[]);

const calc=g=>g.exam!==null?(g.ca1||0)+(g.ca2||0)+(g.midterm||0)+g.exam:null;
const graded=grades.filter(g=>calc(g)!==null);
const cgpa=graded.length>0?graded.reduce((s,g)=>{
const t=calc(g);const {gp}=gradeOf(t);
const c=courses.find(c=>c.id===g.course_id);
return s+(gp*(c?.units||3));
},0)/graded.reduce((s,g)=>{const c=courses.find(c=>c.id===g.course_id);return s+(c?.units||3);},0):0;

useEffect(()=>{
if(loading) return;
let start=0;const target=cgpa;const step=target/60;
const timer=setInterval(()=>{
start+=step;
if(start>=target){setAnimCGPA(target);clearInterval(timer);}
else setAnimCGPA(start);
},1500/60);
return ()=>clearInterval(timer);
},[loading,cgpa]);

const cgpaClass=cgpa>=4.5?“First Class Honours”:cgpa>=3.5?“Second Class Upper”:cgpa>=2.5?“Second Class Lower”:cgpa>=1.5?“Third Class”:“Pass”;

if(loading) return <Spinner/>;

return (
<div>
<div style={{fontSize:22,fontWeight:800,marginBottom:4,color:C.text,letterSpacing:-0.5}}>Grade Sheet</div>
<div style={{fontSize:13,color:C.muted,marginBottom:20}}>2024/2025 · {user?.semester||“Harmattan”} Semester</div>
<div style={{background:`linear-gradient(135deg,${C.primary},${C.primaryLight})`,borderRadius:20,padding:28,marginBottom:24,color:”#fff”,textAlign:“center”,position:“relative”,overflow:“hidden”}}>
<div style={{position:“absolute”,top:-30,right:-30,width:150,height:150,borderRadius:“50%”,background:“rgba(255,255,255,0.05)”}}/>
<div style={{fontSize:13,opacity:0.7,fontWeight:500,letterSpacing:0.5}}>CURRENT CGPA</div>
<div style={{fontSize:72,fontWeight:900,letterSpacing:-3,marginTop:8,lineHeight:1}}>{animCGPA.toFixed(2)}</div>
<div style={{fontSize:16,opacity:0.85,marginTop:8,fontWeight:600}}>{cgpaClass}</div>
<div style={{background:“rgba(255,255,255,0.15)”,borderRadius:20,height:8,marginTop:20,overflow:“hidden”}}>
<div style={{background:“rgba(255,255,255,0.9)”,height:“100%”,width:`${(cgpa/5)*100}%`,borderRadius:20,transition:“width 1.5s ease”}}/>
</div>
<div style={{display:“flex”,justifyContent:“space-between”,fontSize:11,opacity:0.6,marginTop:6}}>
<span>0.0</span><span>2.5</span><span>5.0</span>
</div>
</div>
{grades.length===0&&<div style={{textAlign:“center”,color:C.muted,padding:“40px 0”,fontSize:14}}>No grades available yet.</div>}
{grades.map(g=>{
const total=calc(g);
const grade=total!==null?gradeOf(total):null;
const course=courses.find(c=>c.id===g.course_id);
return(
<div key={g.id} style={{background:C.card,borderRadius:16,padding:16,marginBottom:12,border:`1px solid ${C.border}`}}>
<div style={{display:“flex”,alignItems:“flex-start”,justifyContent:“space-between”,marginBottom:12}}>
<div>
<div style={{fontWeight:700,fontSize:14,color:C.text}}>{course?.code}</div>
<div style={{fontSize:12,color:C.muted,marginTop:2}}>{course?.title}</div>
</div>
<div style={{display:“flex”,alignItems:“center”,gap:8}}>
{grade&&<div style={{width:40,height:40,borderRadius:“50%”,background:grade.color+“18”,display:“flex”,alignItems:“center”,justifyContent:“center”}}>
<span style={{fontWeight:900,fontSize:16,color:grade.color}}>{grade.letter}</span>
</div>}
{grade&&<div style={{textAlign:“right”}}>
<div style={{fontWeight:800,fontSize:18,color:grade.color}}>{total}/100</div>
<div style={{fontSize:11,color:C.muted}}>GP: {grade.gp.toFixed(1)}</div>
</div>}
</div>
</div>
<div style={{display:“grid”,gridTemplateColumns:“1fr 1fr 1fr 1fr”,gap:8,marginBottom:12}}>
{[[“CA1”,g.ca1,20],[“CA2”,g.ca2,20],[“Mid”,g.midterm,30],[“Exam”,g.exam,60]].map(([l,v,max])=>(
<div key={l} style={{background:C.bg,borderRadius:10,padding:“10px 8px”,textAlign:“center”}}>
<div style={{fontSize:10,color:C.muted,fontWeight:700}}>{l}/{max}</div>
<div style={{fontSize:20,fontWeight:800,color:v!==null?C.text:C.border,marginTop:4}}>{v!==null?v:”—”}</div>
</div>
))}
</div>
{total!==null&&<div style={{background:C.border,borderRadius:10,height:6,overflow:“hidden”}}>
<div style={{background:grade?.color,height:“100%”,width:`${total}%`,borderRadius:10,transition:“width 1s ease”}}/>
</div>}
</div>
);
})}
</div>
);
}

// ============================================================
// ATTENDANCE
// ============================================================
function Attendance({user,C}) {
const [courses,setCourses] = useState([]);
const [records,setRecords] = useState([]);
const [sessions,setSessions] = useState([]);
const [loading,setLoading] = useState(true);

useEffect(()=>{
const load=async()=>{
const {data:enr}=await supabase.from(“enrollments”).select(”*, courses(*)”).eq(“student_id”,user.id);
const enrolled=(enr||[]).map(e=>e.courses).filter(Boolean);
const {data:s}=await supabase.from(“attendance_sessions”).select(”*”);
const {data:r}=await supabase.from(“attendance_records”).select(”*”).eq(“student_id”,user.id);
setCourses(enrolled);setSessions(s||[]);setRecords(r||[]);setLoading(false);
};
load();
},[]);

if(loading) return <Spinner/>;

return (
<div>
<div style={{fontSize:22,fontWeight:800,marginBottom:4,color:C.text,letterSpacing:-0.5}}>Attendance</div>
<div style={{fontSize:13,color:C.muted,marginBottom:20}}>Your attendance record this semester</div>
{courses.length===0&&<div style={{textAlign:“center”,color:C.muted,padding:“40px 0”,fontSize:14}}>Add your courses to track attendance.</div>}
{courses.map(c=>{
const courseSessions=sessions.filter(s=>s.course_id===c.id);
const attended=records.filter(r=>courseSessions.find(s=>s.id===r.session_id)&&r.present).length;
const total=courseSessions.length||1;
const pct=Math.round((attended/total)*100);
return(
<div key={c.id} style={{background:C.card,borderRadius:16,padding:16,marginBottom:12,border:`1px solid ${C.border}`}}>
<div style={{display:“flex”,justifyContent:“space-between”,alignItems:“flex-start”,marginBottom:12}}>
<div>
<div style={{fontWeight:700,fontSize:14,color:C.text}}>{c.code}</div>
<div style={{fontSize:12,color:C.muted,marginTop:2}}>{c.title}</div>
</div>
<div style={{textAlign:“right”}}>
<div style={{fontSize:28,fontWeight:900,color:pct<75?”#EF4444”:”#10B981”}}>{pct}%</div>
<div style={{fontSize:11,color:C.muted}}>{attended}/{total} classes</div>
</div>
</div>
<div style={{background:C.border,borderRadius:10,height:8,overflow:“hidden”}}>
<div style={{background:pct<75?”#EF4444”:”#10B981”,height:“100%”,width:`${pct}%`,borderRadius:10,transition:“width 1s ease”}}/>
</div>
{pct<75&&<div style={{fontSize:12,color:”#EF4444”,marginTop:8,fontWeight:600}}>⚠️ Below 75% — attendance at risk</div>}
</div>
);
})}
<div style={{background:”#FEF3C7”,borderRadius:14,padding:16,border:“1px solid #FDE68A”,marginTop:8}}>
<div style={{fontWeight:700,fontSize:13,color:”#92400E”,marginBottom:4}}>University Attendance Policy</div>
<div style={{fontSize:12,color:”#92400E”,lineHeight:1.6}}>Students must maintain a minimum of 75% attendance in all courses to be eligible to sit for end-of-semester examinations.</div>
</div>
</div>
);
}

// ============================================================
// SETTINGS
// ============================================================
function Settings({user,setUser,C,onLogout}) {
const [name,setName] = useState(user?.name||””);
const [newPw,setNewPw] = useState(””);
const [confirmPw,setConfirmPw] = useState(””);
const [message,setMessage] = useState(””);
const [error,setError] = useState(””);
const [loading,setLoading] = useState(false);
const [avatarUrl,setAvatarUrl] = useState(user?.avatar_url||””);
const [uploadingAvatar,setUploadingAvatar] = useState(false);

const inp={width:“100%”,border:`1.5px solid ${C.border}`,borderRadius:12,padding:“13px 16px”,fontSize:15,marginTop:8,boxSizing:“border-box”,background:C.inputBg,color:C.text,outline:“none”,fontFamily:“Inter,sans-serif”};

const saveName=async()=>{
setLoading(true);setError(””);setMessage(””);
const {error:e}=await supabase.from(“profiles”).update({name}).eq(“id”,user.id);
if(e){setError(e.message);}else{setUser({…user,name});setMessage(“Name updated!”);}
setLoading(false);
};

const changePassword=async()=>{
if(!newPw||!confirmPw) return setError(“Fill in all password fields.”);
if(newPw!==confirmPw) return setError(“Passwords do not match.”);
if(newPw.length<6) return setError(“Password must be at least 6 characters.”);
setLoading(true);setError(””);setMessage(””);
const {error:e}=await supabase.auth.updateUser({password:newPw});
if(e){setError(e.message);}else{setMessage(“Password changed!”);setNewPw(””);setConfirmPw(””);}
setLoading(false);
};

const uploadAvatar=async(e)=>{
const file=e.target.files[0];if(!file) return;
setUploadingAvatar(true);
const filePath=`avatars/${user.id}/${Date.now()}.${file.name.split(".").pop()}`;
const {error:ue}=await supabase.storage.from(“unilearn”).upload(filePath,file,{upsert:true});
if(ue){setError(“Avatar upload failed.”);setUploadingAvatar(false);return;}
const {data:urlData}=supabase.storage.from(“unilearn”).getPublicUrl(filePath);
await supabase.from(“profiles”).update({avatar_url:urlData.publicUrl}).eq(“id”,user.id);
setAvatarUrl(urlData.publicUrl);
setUser({…user,avatar_url:urlData.publicUrl});
setUploadingAvatar(false);setMessage(“Profile picture updated!”);
};

return (
<div>
<div style={{fontSize:22,fontWeight:800,marginBottom:20,color:C.text,letterSpacing:-0.5}}>Settings</div>
<div style={{background:C.card,borderRadius:20,padding:24,marginBottom:16,border:`1px solid ${C.border}`,textAlign:“center”}}>
<div style={{position:“relative”,width:96,height:96,margin:“0 auto 16px”}}>
<div style={{width:96,height:96,borderRadius:“50%”,background:`linear-gradient(135deg,${C.primary},${C.primaryLight})`,display:“flex”,alignItems:“center”,justifyContent:“center”,overflow:“hidden”}}>
{avatarUrl?<img src={avatarUrl} alt=“avatar” style={{width:“100%”,height:“100%”,objectFit:“cover”}}/>:<Ic n="user" s={40} c="#fff"/>}
</div>
<label style={{position:“absolute”,bottom:0,right:0,background:C.accent,borderRadius:“50%”,width:32,height:32,display:“flex”,alignItems:“center”,justifyContent:“center”,cursor:“pointer”}}>
<Ic n="camera" s={14} c="#fff"/>
<input type=“file” style={{display:“none”}} accept=“image/*” onChange={uploadAvatar} disabled={uploadingAvatar}/>
</label>
</div>
<div style={{fontWeight:800,fontSize:18,color:C.text}}>{user?.name}</div>
<div style={{fontSize:13,color:C.muted,marginTop:4}}>{user?.email}</div>
<div style={{fontSize:12,color:C.muted,marginTop:2}}>{user?.role} · {user?.department} · {user?.level}</div>
{user?.matric&&<div style={{fontSize:12,color:C.muted}}>Matric: {user?.matric}</div>}
{user?.faculty&&<div style={{fontSize:12,color:C.muted}}>Faculty of {user?.faculty}</div>}
{uploadingAvatar&&<div style={{fontSize:12,color:C.primary,marginTop:8}}>Uploading…</div>}
</div>
{message&&<div style={{background:”#D1FAE5”,color:”#10B981”,padding:“12px 16px”,borderRadius:12,marginBottom:16,fontSize:13,display:“flex”,alignItems:“center”,gap:8}}><Ic n="check" s={16} c="#10B981"/>{message}</div>}
{error&&<div style={{background:”#FEE2E2”,color:”#EF4444”,padding:“12px 16px”,borderRadius:12,marginBottom:16,fontSize:13}}>{error}</div>}
<div style={{background:C.card,borderRadius:16,padding:20,marginBottom:16,border:`1px solid ${C.border}`}}>
<div style={{fontWeight:700,fontSize:15,color:C.text,marginBottom:16,display:“flex”,alignItems:“center”,gap:8}}><Ic n="user" s={18} c={C.primary}/>Edit Profile</div>
<div style={{marginBottom:16}}><label style={{fontSize:12,fontWeight:600,color:C.muted}}>Full Name</label><input style={inp} type=“text” value={name} onChange={e=>setName(e.target.value)}/></div>
<button onClick={saveName} disabled={loading} style={{background:C.primary,color:”#fff”,border:“none”,borderRadius:12,padding:“13px 0”,width:“100%”,fontSize:14,fontWeight:700,cursor:“pointer”,opacity:loading?0.7:1}}>
{loading?“Saving…”:“Save Changes”}
</button>
</div>
<div style={{background:C.card,borderRadius:16,padding:20,marginBottom:16,border:`1px solid ${C.border}`}}>
<div style={{fontWeight:700,fontSize:15,color:C.text,marginBottom:16,display:“flex”,alignItems:“center”,gap:8}}><Ic n="lock" s={18} c={C.primary}/>Change Password</div>
<div style={{marginBottom:12}}><label style={{fontSize:12,fontWeight:600,color:C.muted}}>New Password</label><input style={inp} type=“password” value={newPw} onChange={e=>setNewPw(e.target.value)} placeholder=”••••••••”/></div>
<div style={{marginBottom:16}}><label style={{fontSize:12,fontWeight:600,color:C.muted}}>Confirm Password</label><input style={inp} type=“password” value={confirmPw} onChange={e=>setConfirmPw(e.target.value)} placeholder=”••••••••”/></div>
<button onClick={changePassword} disabled={loading} style={{background:C.primary,color:”#fff”,border:“none”,borderRadius:12,padding:“13px 0”,width:“100%”,fontSize:14,fontWeight:700,cursor:“pointer”,opacity:loading?0.7:1}}>
{loading?“Updating…”:“Change Password”}
</button>
</div>
<button onClick={onLogout} style={{background:”#FEE2E2”,color:”#EF4444”,border:“none”,borderRadius:14,padding:“16px 0”,width:“100%”,fontSize:15,fontWeight:700,cursor:“pointer”,display:“flex”,alignItems:“center”,justifyContent:“center”,gap:8}}>
<Ic n="logout" s={18} c="#EF4444"/>Sign Out
</button>
</div>
);
}

// ============================================================
// MORE
// ============================================================
function More({user,dark,setDark,setTab,onLogout,C}) {
const items=[
{label:“Timetable”,icon:“calendar”,tab:“timetable”,desc:“Weekly class schedule”},
{label:“Attendance”,icon:“users”,tab:“attendance”,desc:“Track your attendance”},
{label:“Grades”,icon:“chart”,tab:“grades”,desc:“Academic performance & CGPA”},
{label:“Settings”,icon:“settings”,tab:“settings”,desc:“Profile, password & preferences”},
];
return (
<div>
<div style={{background:C.card,borderRadius:20,padding:20,marginBottom:20,border:`1px solid ${C.border}`,display:“flex”,alignItems:“center”,gap:16}}>
<div style={{width:56,height:56,borderRadius:“50%”,background:`linear-gradient(135deg,${C.primary},${C.primaryLight})`,display:“flex”,alignItems:“center”,justifyContent:“center”,overflow:“hidden”,flexShrink:0}}>
{user?.avatar_url?<img src={user.avatar_url} alt=“avatar” style={{width:“100%”,height:“100%”,objectFit:“cover”}}/>:<Ic n="user" s={26} c="#fff"/>}
</div>
<div style={{flex:1}}>
<div style={{fontWeight:800,fontSize:16,color:C.text}}>{user?.name}</div>
<div style={{fontSize:12,color:C.muted,marginTop:2}}>{user?.email}</div>
<div style={{fontSize:12,color:C.muted}}>{user?.department} · {user?.level}</div>
{user?.matric&&<div style={{fontSize:12,color:C.muted}}>Matric: {user?.matric}</div>}
</div>
</div>
{items.map(it=>(
<div key={it.tab} onClick={()=>setTab(it.tab)} style={{background:C.card,borderRadius:16,padding:16,marginBottom:10,border:`1px solid ${C.border}`,display:“flex”,alignItems:“center”,gap:14,cursor:“pointer”}}>
<div style={{width:44,height:44,background:C.primary+“18”,borderRadius:12,display:“flex”,alignItems:“center”,justifyContent:“center”}}>
<Ic n={it.icon} s={20} c={C.primary}/>
</div>
<div style={{flex:1}}>
<div style={{fontWeight:700,fontSize:14,color:C.text}}>{it.label}</div>
<div style={{fontSize:12,color:C.muted,marginTop:2}}>{it.desc}</div>
</div>
<Ic n="chevronR" s={18} c={C.muted}/>
</div>
))}
<div style={{background:C.card,borderRadius:16,padding:16,marginBottom:16,border:`1px solid ${C.border}`,display:“flex”,alignItems:“center”,gap:14}}>
<div style={{width:44,height:44,background:C.primary+“18”,borderRadius:12,display:“flex”,alignItems:“center”,justifyContent:“center”}}>
<Ic n={dark?“sun”:“moon”} s={20} c={C.primary}/>
</div>
<div style={{flex:1}}><div style={{fontWeight:700,fontSize:14,color:C.text}}>{dark?“Light Mode”:“Dark Mode”}</div></div>
<div onClick={()=>setDark(!dark)} style={{width:50,height:28,borderRadius:14,background:dark?C.primary:”#E8E8E8”,cursor:“pointer”,position:“relative”,transition:“background 0.3s”,flexShrink:0}}>
<div style={{position:“absolute”,top:4,left:dark?26:4,width:20,height:20,borderRadius:“50%”,background:”#fff”,transition:“left 0.3s”}}/>
</div>
</div>
</div>
);
}

// ============================================================
// MAIN APP
// ============================================================
export default function App() {
const [user,setUser] = useState(null);
const [tab,setTab] = useState(“home”);
const [dark,setDark] = useState(false);
const [loading,setLoading] = useState(true);
const [callType,setCallType] = useState(null);
const [showEnrollment,setShowEnrollment] = useState(false);
const C=dark?DARK:LIGHT;

useEffect(()=>{
supabase.auth.getSession().then(async({data:{session}})=>{
if(session){
const {data:profile}=await supabase.from(“profiles”).select(”*”).eq(“id”,session.user.id).single();
setUser(profile);
// Check if student needs to enroll in courses
if(profile?.role===“student”){
const {data:enr}=await supabase.from(“enrollments”).select(“id”).eq(“student_id”,profile.id).limit(1);
if(!enr||enr.length===0) setShowEnrollment(true);
}
}
setLoading(false);
});
const {data:{subscription}}=supabase.auth.onAuthStateChange(async(event,session)=>{
if(session){
const {data:profile}=await supabase.from(“profiles”).select(”*”).eq(“id”,session.user.id).single();
setUser(profile);
} else setUser(null);
});
return ()=>subscription.unsubscribe();
},[]);

const handleLogout = async () => {
try { await supabase.auth.signOut(); }
catch(err){ console.log(err); }
finally { setUser(null); setTab(“home”); setShowEnrollment(false); }
};

const NAV=[
{id:“home”,icon:“home”,label:“Home”},
{id:“courses”,icon:“book”,label:“Courses”},
{id:“grades”,icon:“chart”,label:“Grades”},
{id:“more”,icon:“more”,label:“More”},
];

const EXTRAS=[“timetable”,“attendance”,“settings”];

if(loading) return (
<div style={{minHeight:“100vh”,display:“flex”,alignItems:“center”,justifyContent:“center”,background:”#1B4332”}}>
<div style={{textAlign:“center”}}>
<div style={{width:72,height:72,background:”#F4A261”,borderRadius:20,display:“flex”,alignItems:“center”,justifyContent:“center”,margin:“0 auto 16px”}}>
<Ic n="book" s={34} c="#fff" w={2}/>
</div>
<div style={{color:”#fff”,fontSize:20,fontWeight:800,fontFamily:“Inter,sans-serif”}}>UniLearn</div>
<div style={{color:“rgba(255,255,255,0.5)”,fontSize:13,marginTop:8,fontFamily:“Inter,sans-serif”}}>Loading…</div>
<div style={{width:32,height:32,border:“3px solid rgba(255,255,255,0.2)”,borderTop:“3px solid #F4A261”,borderRadius:“50%”,animation:“spin 0.8s linear infinite”,margin:“20px auto 0”}}/>
<style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
</div>
</div>
);

if(!user) return <Auth onLogin={async(profile)=>{
setUser(profile);
if(profile?.role===“student”){
const {data:enr}=await supabase.from(“enrollments”).select(“id”).eq(“student_id”,profile.id).limit(1);
if(!enr||enr.length===0) setShowEnrollment(true);
}
}}/>;

if(callType) return <CallScreen callType={callType} onClose={()=>setCallType(null)}/>;

if(user?.role===“lecturer”) return <LecturerApp user={user} setUser={setUser} dark={dark} setDark={setDark} C={C} onCall={setCallType} onLogout={handleLogout}/>;

if(showEnrollment) return <CourseEnrollment user={user} onDone={()=>setShowEnrollment(false)}/>;

return (
<div style={{fontFamily:”‘Inter’,sans-serif”,background:C.bg,minHeight:“100vh”,maxWidth:480,margin:“0 auto”,position:“relative”}}>
<style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}@keyframes spin{to{transform:rotate(360deg)}}*{-webkit-tap-highlight-color:transparent;}::-webkit-scrollbar{display:none;}`}</style>
<div style={{background:C.headerBg,color:C.headerText,padding:“14px 20px”,display:“flex”,justifyContent:“space-between”,alignItems:“center”,position:“sticky”,top:0,zIndex:100}}>
<div style={{display:“flex”,alignItems:“center”,gap:10}}>
{EXTRAS.includes(tab)&&<button onClick={()=>setTab(“more”)} style={{background:“none”,border:“none”,cursor:“pointer”,padding:4,display:“flex”}}><Ic n="chevronL" s={22} c={C.headerText}/></button>}
<div style={{fontSize:18,fontWeight:800,letterSpacing:-0.3}}>UniLearn</div>
</div>
<div style={{display:“flex”,alignItems:“center”,gap:12}}>
<button onClick={()=>setDark(!dark)} style={{background:“none”,border:“none”,cursor:“pointer”,padding:4,display:“flex”}}>
<Ic n={dark?“sun”:“moon”} s={20} c={C.headerText}/>
</button>
{user?.avatar_url&&<div style={{width:32,height:32,borderRadius:“50%”,overflow:“hidden”,cursor:“pointer”}} onClick={()=>setTab(“settings”)}>
<img src={user.avatar_url} alt=“avatar” style={{width:“100%”,height:“100%”,objectFit:“cover”}}/>
</div>}
</div>
</div>
<div style={{padding:“20px 20px”,paddingBottom:100}}>
{tab===“home”&&<Dashboard user={user} C={C} setTab={setTab}/>}
{tab===“courses”&&<Courses user={user} C={C} onCall={setCallType}/>}
{tab===“grades”&&<Grades user={user} C={C}/>}
{tab===“more”&&<More user={user} dark={dark} setDark={setDark} setTab={setTab} onLogout={handleLogout} C={C}/>}
{tab===“timetable”&&<Timetable user={user} C={C}/>}
{tab===“attendance”&&<Attendance user={user} C={C}/>}
{tab===“settings”&&<Settings user={user} setUser={setUser} C={C} onLogout={handleLogout}/>}
</div>
{!EXTRAS.includes(tab)&&(
<nav style={{position:“fixed”,bottom:0,left:“50%”,transform:“translateX(-50%)”,width:“100%”,maxWidth:480,background:C.navBg,borderTop:`1px solid ${C.border}`,display:“flex”,padding:“8px 0 20px”,backdropFilter:“blur(20px)”}}>
{NAV.map(t=>(
<button key={t.id} onClick={()=>setTab(t.id)} style={{flex:1,display:“flex”,flexDirection:“column”,alignItems:“center”,gap:4,background:“none”,border:“none”,cursor:“pointer”,padding:“6px 0”}}>
<div style={{width:36,height:36,borderRadius:10,background:tab===t.id?C.primary+“18”:“transparent”,display:“flex”,alignItems:“center”,justifyContent:“center”,transition:“all 0.2s”}}>
<Ic n={t.icon} s={22} c={tab===t.id?C.primary:C.muted} w={tab===t.id?2.2:1.6}/>
</div>
<span style={{fontSize:10,fontWeight:tab===t.id?700:500,color:tab===t.id?C.primary:C.muted}}>{t.label}</span>
</button>
))}
</nav>
)}
</div>
);
}

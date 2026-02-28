import { useState, useRef, useCallback } from "react";

type Page = "setup" | "plan";

interface FormData {
  name: string;
  university: string;
  major: string;
  doubleMajor: string;
  minors: string[];
  credits: string;
}

interface Course {
  id: string;
  name: string;
  credits: number;
  grade: string;
}

interface YearData {
  id: string;
  label: string;
  courses: Course[];
}

const MAJORS = ["Computer Science","Mathematics","Biology","Psychology","English","History","Physics","Chemistry","Business Administration","Engineering","Nursing","Education","Political Science","Sociology","Economics"];
const MINORS = ["Mathematics","Statistics","Data Science","Philosophy","Art","Music","Spanish","Communications","Environmental Science"];

const GRADE_POINTS: Record<string, number> = {
  "A+": 4.0,"A": 4.0,"A-": 3.7,
  "B+": 3.3,"B": 3.0,"B-": 2.7,
  "C+": 2.3,"C": 2.0,"C-": 1.7,
  "D+": 1.3,"D": 1.0,"D-": 0.7,
  "F": 0.0,
};
const GRADE_OPTIONS = ["","A+","A","A-","B+","B","B-","C+","C","C-","D+","D","D-","F"];

function makeId() { return Math.random().toString(36).slice(2, 9); }

const INITIAL_YEARS: YearData[] = [
  { id: "y1", label: "Year 1", courses: [
    { id: makeId(), name: "ENGL 015 - Rhetoric & Comp", credits: 3, grade: "" },
    { id: makeId(), name: "MATH 140 - Calculus I", credits: 4, grade: "" },
    { id: makeId(), name: "CMPSC 101 - Intro to CS", credits: 3, grade: "" },
    { id: makeId(), name: "General Ed: Arts", credits: 3, grade: "" },
  ]},
  { id: "y2", label: "Year 2", courses: [
    { id: makeId(), name: "MATH 230 - Calculus & Vector Analysis", credits: 4, grade: "" },
    { id: makeId(), name: "CMPSC 221 - Object-Oriented Prog", credits: 3, grade: "" },
    { id: makeId(), name: "CMPSC 360 - Discrete Math", credits: 3, grade: "" },
    { id: makeId(), name: "STAT 318 - Statistics", credits: 3, grade: "" },
  ]},
  { id: "y3", label: "Year 3", courses: [
    { id: makeId(), name: "CMPSC 431W - Database Mgmt", credits: 3, grade: "" },
    { id: makeId(), name: "CMPSC 461 - Prog Lang Concepts", credits: 3, grade: "" },
    { id: makeId(), name: "CMPSC 473 - Software Eng", credits: 3, grade: "" },
    { id: makeId(), name: "CMPSC 441 - Artificial Intel", credits: 3, grade: "" },
  ]},
  { id: "y4", label: "Year 4", courses: [
    { id: makeId(), name: "CMPSC 483W - Senior Design I", credits: 3, grade: "" },
    { id: makeId(), name: "CMPSC 445 - Machine Learning", credits: 3, grade: "" },
    { id: makeId(), name: "CMPSC 484 - Senior Design II", credits: 3, grade: "" },
    { id: makeId(), name: "Free Elective", credits: 3, grade: "" },
  ]},
];

// ── Aurora ───────────────────────────────────────────────────────────────────
function AuroraBg() {
  return (
    <>
      <style>{`
        .aurora-root { position:fixed;inset:0;z-index:0;background:#08010f;overflow:hidden;pointer-events:none; }
        .b { position:absolute;border-radius:50%;filter:blur(100px); }
        .b1{width:75vw;height:65vh;background:radial-gradient(ellipse,rgba(255,30,180,0.7) 0%,transparent 70%);top:-20%;left:-15%;animation:b1m 14s ease-in-out infinite alternate;}
        .b2{width:80vw;height:60vh;background:radial-gradient(ellipse,rgba(100,0,255,0.75) 0%,transparent 70%);top:5%;left:15%;animation:b2m 17s ease-in-out infinite alternate;}
        .b3{width:65vw;height:55vh;background:radial-gradient(ellipse,rgba(150,0,255,0.65) 0%,transparent 70%);top:0;right:-10%;animation:b3m 12s ease-in-out infinite alternate;}
        .b4{width:55vw;height:45vh;background:radial-gradient(ellipse,rgba(255,0,140,0.55) 0%,transparent 70%);bottom:-5%;right:0%;animation:b4m 20s ease-in-out infinite alternate;}
        .b5{width:60vw;height:50vh;background:radial-gradient(ellipse,rgba(30,0,200,0.6) 0%,transparent 70%);bottom:-10%;left:5%;animation:b5m 15s ease-in-out infinite alternate;}
        @keyframes b1m{0%{transform:translate(0,0) scale(1)}50%{transform:translate(12vw,10vh) scale(1.2)}100%{transform:translate(-5vw,5vh) scale(0.9)}}
        @keyframes b2m{0%{transform:translate(0,0) scale(1.1)}50%{transform:translate(-10vw,8vh) scale(0.95)}100%{transform:translate(8vw,-6vh) scale(1.15)}}
        @keyframes b3m{0%{transform:translate(0,0) scale(1)}50%{transform:translate(-8vw,12vh) scale(1.1)}100%{transform:translate(5vw,-4vh) scale(0.92)}}
        @keyframes b4m{0%{transform:translate(0,0) scale(0.9)}50%{transform:translate(-12vw,-8vh) scale(1.1)}100%{transform:translate(6vw,6vh) scale(1)}}
        @keyframes b5m{0%{transform:translate(0,0) scale(1.05)}50%{transform:translate(10vw,-10vh) scale(0.92)}100%{transform:translate(-6vw,5vh) scale(1.08)}}
        .aurora-vignette{position:absolute;inset:0;background:radial-gradient(ellipse 100% 100% at 50% 50%,transparent 40%,rgba(4,0,10,0.55) 100%);}
      `}</style>
      <div className="aurora-root">
        <div className="b b1"/><div className="b b2"/><div className="b b3"/>
        <div className="b b4"/><div className="b b5"/>
        <div className="aurora-vignette"/>
      </div>
    </>
  );
}

function CircularLogo() {
  const text = "UNI PATH · UNI PATH · ";
  const chars = text.split("");
  const step = 360 / chars.length;
  return (
    <div style={{position:"relative",width:76,height:76,flexShrink:0}}>
      <style>{`@keyframes spin-logo{to{transform:rotate(360deg)}}`}</style>
      <div style={{position:"absolute",inset:0,transformOrigin:"center",animation:"spin-logo 20s linear infinite"}}>
        {chars.map((ch,i)=>{
          const angle=step*i-90, r=angle*Math.PI/180;
          const x=38+28*Math.cos(r)-4.5, y=38+28*Math.sin(r)-4.5;
          return <span key={i} style={{position:"absolute",left:x,top:y,fontSize:8,fontFamily:"Montserrat,sans-serif",fontWeight:700,color:"rgba(255,255,255,0.75)",lineHeight:1,transform:`rotate(${angle+90}deg)`,transformOrigin:"center",display:"block",width:9,textAlign:"center"}}>{ch}</span>;
        })}
      </div>
    </div>
  );
}

function GradientTitle({children}: {children: React.ReactNode}) {
  return (
    <>
      <style>{`
        @keyframes gs{0%,100%{background-position:0% 50%}50%{background-position:100% 50%}}
        .gt{background:linear-gradient(90deg,#bf00ff,#ff2dce,#c084fc,#ff66b8,#7c3aed,#bf00ff);background-size:300% 300%;-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;animation:gs 5s ease infinite;font-family:Montserrat,sans-serif;font-weight:900;font-size:30px;line-height:1.15;letter-spacing:-0.02em;display:inline-block;}
      `}</style>
      <span className="gt">{children}</span>
    </>
  );
}

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800;900&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
  body{background:#08010f;}
  .inp{width:100%;background:rgba(255,255,255,0.07);border:1.5px solid rgba(255,255,255,0.13);border-radius:12px;color:#fff;font-family:Montserrat,sans-serif;font-size:15px;font-weight:500;padding:13px 16px;outline:none;appearance:none;transition:border-color .2s,background .2s;}
  .inp:focus{border-color:rgba(192,84,252,0.8);background:rgba(255,255,255,0.11);}
  .inp::placeholder{color:rgba(255,255,255,0.22);}
  .inp option{background:#1a0a2e;color:#fff;}
  select.inp{background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' fill='none'%3E%3Cpath d='M1 1l5 5 5-5' stroke='rgba(255,255,255,.4)' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 14px center;padding-right:40px;cursor:pointer;}
  .lbl{font-size:11px;font-weight:700;color:rgba(255,255,255,0.42);letter-spacing:.08em;text-transform:uppercase;margin-bottom:8px;display:flex;align-items:center;justify-content:space-between;}
  .field{margin-bottom:20px;}
  .submit-btn{width:100%;padding:15px;border:none;border-radius:13px;background:linear-gradient(135deg,#7c00ff 0%,#d400b8 100%);color:#fff;font-family:Montserrat,sans-serif;font-size:15px;font-weight:800;cursor:pointer;letter-spacing:.04em;margin-top:6px;transition:opacity .2s,transform .15s;box-shadow:0 4px 28px rgba(160,0,255,0.45);}
  .submit-btn:hover{opacity:.88;transform:translateY(-1px);}
  .add-btn{background:none;border:none;color:#c084fc;font-family:Montserrat,sans-serif;font-size:12px;font-weight:700;cursor:pointer;padding:0;}
  .rm-btn{background:none;border:none;color:rgba(255,255,255,0.28);font-size:22px;cursor:pointer;line-height:1;padding:0 4px;transition:color .2s;}
  .rm-btn:hover{color:rgba(255,255,255,.7);}
  @keyframes fadeIn{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
  .fadein{animation:fadeIn .5s ease both;}
  @keyframes dot-pulse{0%,100%{opacity:1}50%{opacity:.15}}
  .dot{width:8px;height:8px;border-radius:50%;background:#c084fc;display:inline-block;animation:dot-pulse 1.2s ease infinite;}
  .dot:nth-child(2){animation-delay:.2s}.dot:nth-child(3){animation-delay:.4s}
`;

// ── Setup Page ────────────────────────────────────────────────────────────────
function SetupPage({ onSubmit }: { onSubmit: (f: FormData) => void }) {
  const [form, setForm] = useState<FormData>({name:"",university:"",major:"Computer Science",doubleMajor:"",minors:["Mathematics"],credits:""});
  const set = <K extends keyof FormData>(k:K,v:FormData[K]) => setForm(f=>({...f,[k]:v}));

  return (
    <>
      <style>{CSS}</style>
      <AuroraBg/>
      <div style={{position:"fixed",inset:0,zIndex:1,background:"rgba(4,0,12,0.38)"}}/>
      <div className="fadein" style={{position:"relative",zIndex:2,maxWidth:460,margin:"0 auto",padding:"44px 24px 72px",fontFamily:"Montserrat,sans-serif",color:"#fff",minHeight:"100vh"}}>
        <div style={{marginBottom:38}}>
          <CircularLogo/>
          <div style={{marginTop:20}}>
            <GradientTitle>Welcome to UniPath!</GradientTitle>
            <p style={{color:"rgba(255,255,255,0.4)",fontSize:14,marginTop:8,fontWeight:500}}>Plan your academic journey</p>
          </div>
        </div>
        <div className="field"><div className="lbl">Full Name</div><input className="inp" placeholder="Enter your name" value={form.name} onChange={e=>set("name",e.target.value)}/></div>
        <div className="field"><div className="lbl">University</div><input className="inp" placeholder="Enter your university" value={form.university} onChange={e=>set("university",e.target.value)}/></div>
        <div className="field"><div className="lbl">Major</div><select className="inp" value={form.major} onChange={e=>set("major",e.target.value)}>{MAJORS.map(m=><option key={m}>{m}</option>)}</select></div>
        <div className="field">
          <div className="lbl">Double Major <span style={{color:"rgba(255,255,255,0.2)",fontWeight:400,fontSize:10,textTransform:"none",letterSpacing:0}}>Optional</span></div>
          <select className="inp" value={form.doubleMajor} onChange={e=>set("doubleMajor",e.target.value)}><option value="">No double major</option>{MAJORS.filter(m=>m!==form.major).map(m=><option key={m}>{m}</option>)}</select>
        </div>
        <div className="field">
          <div className="lbl">
            <span>Minor(s) <span style={{color:"rgba(255,255,255,0.2)",fontWeight:400,fontSize:10,textTransform:"none",letterSpacing:0}}>Optional</span></span>
            {form.minors.length<3&&<button className="add-btn" onClick={()=>set("minors",[...form.minors,"Statistics"])}>+ Add</button>}
          </div>
          {form.minors.map((mn,i)=>(
            <div key={i} style={{display:"flex",gap:8,marginBottom:8,alignItems:"center"}}>
              <select className="inp" value={mn} style={{flex:1}} onChange={e=>{const m=[...form.minors];m[i]=e.target.value;set("minors",m);}}>
                {MINORS.map(m=><option key={m}>{m}</option>)}
              </select>
              {form.minors.length>1&&<button className="rm-btn" onClick={()=>set("minors",form.minors.filter((_,j)=>j!==i))}>×</button>}
            </div>
          ))}
        </div>
        <div className="field"><div className="lbl">Credits Completed <span style={{color:"rgba(255,255,255,0.2)",fontWeight:400,fontSize:10,textTransform:"none",letterSpacing:0}}>Optional</span></div><input className="inp" type="number" placeholder="e.g. 67" value={form.credits} onChange={e=>set("credits",e.target.value)}/></div>
        <button className="submit-btn" onClick={()=>onSubmit(form)}>Generate My Academic Plan →</button>
      </div>
    </>
  );
}

// ── Course Card ───────────────────────────────────────────────────────────────
function CourseCard({
  course, onRemove, onUpdate, onDragStart, onDragEnd, isDragging
}: {
  course: Course;
  onRemove: () => void;
  onUpdate: (c: Course) => void;
  onDragStart: () => void;
  onDragEnd: () => void;
  isDragging: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(course.name);
  const [editCredits, setEditCredits] = useState(String(course.credits));

  const gradeColor = course.grade
    ? GRADE_POINTS[course.grade] >= 3.0 ? "#4ade80"
    : GRADE_POINTS[course.grade] >= 2.0 ? "#facc15"
    : "#f87171"
    : "rgba(255,255,255,0.3)";

  return (
    <div
      draggable
      onDragStart={e => { e.dataTransfer.effectAllowed = "move"; onDragStart(); }}
      onDragEnd={onDragEnd}
      style={{
        background: isDragging ? "rgba(192,84,252,0.18)" : "rgba(255,255,255,0.07)",
        border: `1.5px solid ${isDragging ? "rgba(192,84,252,0.6)" : "rgba(255,255,255,0.12)"}`,
        borderRadius: 12, padding: "10px 12px",
        cursor: "grab", userSelect: "none",
        transition: "all .15s",
        opacity: isDragging ? 0.5 : 1,
        marginBottom: 8,
      }}
    >
      {editing ? (
        <div style={{display:"flex",flexDirection:"column",gap:6}}>
          <input
            value={editName}
            onChange={e=>setEditName(e.target.value)}
            style={{background:"rgba(255,255,255,0.1)",border:"1px solid rgba(255,255,255,0.2)",borderRadius:8,color:"#fff",fontFamily:"Montserrat,sans-serif",fontSize:12,fontWeight:600,padding:"6px 8px",outline:"none"}}
          />
          <div style={{display:"flex",gap:6,alignItems:"center"}}>
            <input
              type="number" min={1} max={6} value={editCredits}
              onChange={e=>setEditCredits(e.target.value)}
              style={{background:"rgba(255,255,255,0.1)",border:"1px solid rgba(255,255,255,0.2)",borderRadius:8,color:"#fff",fontFamily:"Montserrat,sans-serif",fontSize:12,fontWeight:600,padding:"6px 8px",outline:"none",width:60}}
            />
            <span style={{fontSize:11,color:"rgba(255,255,255,0.4)",fontWeight:600}}>credits</span>
            <button onClick={()=>{onUpdate({...course,name:editName,credits:parseInt(editCredits)||3});setEditing(false);}} style={{marginLeft:"auto",background:"rgba(192,84,252,0.25)",border:"1px solid rgba(192,84,252,0.5)",borderRadius:7,color:"#c084fc",fontFamily:"Montserrat,sans-serif",fontSize:11,fontWeight:700,padding:"5px 10px",cursor:"pointer"}}>Save</button>
            <button onClick={()=>setEditing(false)} style={{background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.15)",borderRadius:7,color:"rgba(255,255,255,0.5)",fontFamily:"Montserrat,sans-serif",fontSize:11,fontWeight:700,padding:"5px 10px",cursor:"pointer"}}>Cancel</button>
          </div>
        </div>
      ) : (
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          {/* Drag handle */}
          <div style={{display:"flex",flexDirection:"column",gap:3,flexShrink:0,opacity:0.3}}>
            {[0,1,2].map(i=><div key={i} style={{width:14,height:1.5,background:"#fff",borderRadius:2}}/>)}
          </div>

          {/* Course name */}
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:12,fontWeight:700,color:"#fff",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{course.name}</div>
            <div style={{fontSize:10,color:"rgba(255,255,255,0.38)",fontWeight:600,marginTop:2}}>{course.credits} cr</div>
          </div>

          {/* Grade picker */}
          <select
            value={course.grade}
            onChange={e=>onUpdate({...course,grade:e.target.value})}
            onClick={e=>e.stopPropagation()}
            style={{
              background:"rgba(255,255,255,0.06)",
              border:`1.5px solid ${course.grade ? gradeColor+"66" : "rgba(255,255,255,0.12)"}`,
              borderRadius:8, color: course.grade ? gradeColor : "rgba(255,255,255,0.35)",
              fontFamily:"Montserrat,sans-serif", fontSize:11, fontWeight:700,
              padding:"4px 6px", cursor:"pointer", outline:"none", appearance:"none",
              width:48, textAlign:"center",
            }}
          >
            {GRADE_OPTIONS.map(g=><option key={g} value={g} style={{background:"#1a0a2e",color:"#fff"}}>{g||"—"}</option>)}
          </select>

          {/* Edit btn */}
          <button
            onClick={e=>{e.stopPropagation();setEditing(true);setEditName(course.name);setEditCredits(String(course.credits));}}
            style={{background:"none",border:"none",color:"rgba(255,255,255,0.3)",cursor:"pointer",fontSize:14,padding:"2px 4px",lineHeight:1,transition:"color .15s",flexShrink:0}}
            title="Edit"
          >✏️</button>

          {/* Remove btn */}
          <button
            onClick={e=>{e.stopPropagation();onRemove();}}
            style={{background:"none",border:"none",color:"rgba(255,100,100,0.45)",cursor:"pointer",fontSize:15,padding:"2px 4px",lineHeight:1,transition:"color .15s",flexShrink:0}}
            title="Remove"
          >×</button>
        </div>
      )}
    </div>
  );
}

// ── Year Box ─────────────────────────────────────────────────────────────────
function YearBox({
  year, onUpdate, onAddCourse,
  draggingId, setDraggingId, dragSource, setDragSource,
  onDropCourse,
}: {
  year: YearData;
  onUpdate: (y: YearData) => void;
  onAddCourse: () => void;
  draggingId: string | null;
  setDraggingId: (id: string | null) => void;
  dragSource: string | null;
  setDragSource: (id: string | null) => void;
  onDropCourse: (courseId: string, fromYearId: string, toYearId: string) => void;
}) {
  const [dragOver, setDragOver] = useState(false);
  const totalCredits = year.courses.reduce((s,c)=>s+c.credits,0);

  return (
    <div
      onDragOver={e=>{e.preventDefault();setDragOver(true);}}
      onDragLeave={()=>setDragOver(false)}
      onDrop={e=>{
        e.preventDefault(); setDragOver(false);
        if (draggingId && dragSource) onDropCourse(draggingId, dragSource, year.id);
      }}
      style={{
        background: dragOver ? "rgba(192,84,252,0.1)" : "rgba(255,255,255,0.04)",
        border: `1.5px solid ${dragOver ? "rgba(192,84,252,0.5)" : "rgba(255,255,255,0.1)"}`,
        borderRadius: 18, overflow: "hidden",
        backdropFilter: "blur(14px)",
        transition: "all .15s",
        flex: "1 1 260px", minWidth: 240,
      }}
    >
      {/* Year header */}
      <div style={{padding:"14px 16px 10px",borderBottom:"1px solid rgba(255,255,255,0.07)",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div>
          <div style={{fontSize:14,fontWeight:800,color:"#fff",letterSpacing:"-0.01em"}}>{year.label}</div>
          <div style={{fontSize:10,color:"rgba(255,255,255,0.35)",fontWeight:600,marginTop:2}}>{totalCredits} credits · {year.courses.length} courses</div>
        </div>
        <button
          onClick={onAddCourse}
          style={{background:"rgba(192,84,252,0.18)",border:"1.5px solid rgba(192,84,252,0.35)",borderRadius:8,color:"#c084fc",fontFamily:"Montserrat,sans-serif",fontSize:11,fontWeight:700,padding:"5px 10px",cursor:"pointer",letterSpacing:".03em"}}
        >+ Add</button>
      </div>

      {/* Courses */}
      <div style={{padding:"10px 12px"}}>
        {year.courses.length === 0 && (
          <div style={{textAlign:"center",padding:"24px 0",color:"rgba(255,255,255,0.2)",fontSize:12,fontWeight:600}}>Drop courses here</div>
        )}
        {year.courses.map(course=>(
          <CourseCard
            key={course.id}
            course={course}
            isDragging={draggingId === course.id}
            onDragStart={()=>{setDraggingId(course.id);setDragSource(year.id);}}
            onDragEnd={()=>{setDraggingId(null);setDragSource(null);}}
            onRemove={()=>onUpdate({...year,courses:year.courses.filter(c=>c.id!==course.id)})}
            onUpdate={updated=>onUpdate({...year,courses:year.courses.map(c=>c.id===updated.id?updated:c)})}
          />
        ))}
      </div>
    </div>
  );
}

// ── Plan Page ─────────────────────────────────────────────────────────────────
function PlanPage({ form, onBack }: { form: FormData; onBack: () => void }) {
  const [years, setYears] = useState<YearData[]>(INITIAL_YEARS);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragSource, setDragSource] = useState<string | null>(null);

  const updateYear = useCallback((updated: YearData) => {
    setYears(ys => ys.map(y => y.id === updated.id ? updated : y));
  }, []);

  const addCourse = useCallback((yearId: string) => {
    const newCourse: Course = { id: makeId(), name: "New Course", credits: 3, grade: "" };
    setYears(ys => ys.map(y => y.id === yearId ? { ...y, courses: [...y.courses, newCourse] } : y));
  }, []);

  const dropCourse = useCallback((courseId: string, fromYearId: string, toYearId: string) => {
    if (fromYearId === toYearId) return;
    setYears(ys => {
      const fromYear = ys.find(y => y.id === fromYearId);
      const course = fromYear?.courses.find(c => c.id === courseId);
      if (!course) return ys;
      return ys.map(y => {
        if (y.id === fromYearId) return { ...y, courses: y.courses.filter(c => c.id !== courseId) };
        if (y.id === toYearId)   return { ...y, courses: [...y.courses, course] };
        return y;
      });
    });
  }, []);

  // Stats
  const allCourses = years.flatMap(y => y.courses);
  const gradedCourses = allCourses.filter(c => c.grade && c.grade in GRADE_POINTS);
  const totalCreditsCompleted = gradedCourses.reduce((s, c) => s + c.credits, 0);
  const totalCreditsPlanned = allCourses.reduce((s, c) => s + c.credits, 0);
  const gpaPoints = gradedCourses.reduce((s, c) => s + GRADE_POINTS[c.grade] * c.credits, 0);
  const gpa = totalCreditsCompleted > 0 ? (gpaPoints / totalCreditsCompleted).toFixed(2) : "—";
  const creditsRemaining = Math.max(0, 120 - totalCreditsCompleted - (parseInt(form.credits) || 0));

  const gpaColor = gpa === "—" ? "rgba(255,255,255,0.6)"
    : parseFloat(gpa) >= 3.5 ? "#4ade80"
    : parseFloat(gpa) >= 3.0 ? "#a3e635"
    : parseFloat(gpa) >= 2.5 ? "#facc15"
    : "#f87171";

  return (
    <>
      <style>{CSS + `
        ::-webkit-scrollbar{width:6px;height:6px;}
        ::-webkit-scrollbar-track{background:transparent;}
        ::-webkit-scrollbar-thumb{background:rgba(192,84,252,0.3);border-radius:3px;}
      `}</style>

      <div style={{position:"fixed",inset:0,zIndex:0,background:"#08010f"}}>
        <div style={{position:"absolute",inset:0,background:"radial-gradient(ellipse 80% 60% at 20% 20%,rgba(100,0,255,0.38) 0%,transparent 60%),radial-gradient(ellipse 70% 50% at 80% 80%,rgba(200,0,160,0.28) 0%,transparent 60%)"}}/>
      </div>
      <div style={{position:"fixed",inset:0,zIndex:1,background:"rgba(4,0,12,0.55)"}}/>

      <div style={{position:"relative",zIndex:2,fontFamily:"Montserrat,sans-serif",color:"#fff",minHeight:"100vh",display:"flex",flexDirection:"column"}}>

        {/* Header */}
        <div style={{position:"sticky",top:0,zIndex:10,background:"rgba(6,0,14,0.85)",backdropFilter:"blur(20px)",borderBottom:"1px solid rgba(255,255,255,0.08)",padding:"14px 24px",display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,flexWrap:"wrap"}}>
          <div style={{display:"flex",alignItems:"center",gap:14}}>
            <button onClick={onBack} style={{background:"rgba(255,255,255,0.07)",border:"1.5px solid rgba(255,255,255,0.14)",borderRadius:10,color:"rgba(255,255,255,0.65)",padding:"8px 16px",cursor:"pointer",fontFamily:"Montserrat,sans-serif",fontSize:12,fontWeight:700,letterSpacing:".04em"}}>← Back</button>
            <div>
              <div style={{fontSize:15,fontWeight:800,letterSpacing:"-0.01em"}}>Your Academic Plan</div>
              <div style={{fontSize:11,color:"rgba(255,255,255,0.38)",fontWeight:600}}>{form.university||"University"}</div>
            </div>
          </div>

          {/* Stats bar */}
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            {[
              {l:"Major", v:form.major, color:"rgba(255,255,255,0.85)"},
              {l:"Credits Done", v:String(totalCreditsCompleted + (parseInt(form.credits)||0)), color:"rgba(255,255,255,0.85)"},
              {l:"Credits Left", v:String(creditsRemaining), color:"rgba(255,255,255,0.85)"},
              {l:"Planned", v:String(totalCreditsPlanned)+" cr", color:"rgba(255,255,255,0.85)"},
              {l:"GPA", v:gpa, color:gpaColor},
            ].map(s=>(
              <div key={s.l} style={{background:"rgba(255,255,255,0.06)",border:"1.5px solid rgba(255,255,255,0.1)",borderRadius:10,padding:"7px 12px",flexShrink:0,backdropFilter:"blur(8px)"}}>
                <div style={{fontSize:9,color:"rgba(255,255,255,0.36)",fontWeight:700,textTransform:"uppercase",letterSpacing:".08em",marginBottom:3}}>{s.l}</div>
                <div style={{fontSize:13,fontWeight:800,color:s.color,fontFamily:"Montserrat,sans-serif"}}>{s.v}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Year grid */}
        <div style={{padding:"20px 24px 48px",flex:1,overflowY:"auto"}}>
          <div style={{display:"flex",gap:16,flexWrap:"wrap",alignItems:"flex-start"}}>
            {years.map(year=>(
              <YearBox
                key={year.id}
                year={year}
                onUpdate={updateYear}
                onAddCourse={()=>addCourse(year.id)}
                draggingId={draggingId}
                setDraggingId={setDraggingId}
                dragSource={dragSource}
                setDragSource={setDragSource}
                onDropCourse={dropCourse}
              />
            ))}
          </div>

          {/* Legend */}
          <div style={{marginTop:24,display:"flex",gap:16,flexWrap:"wrap",opacity:0.5}}>
            {[{c:"#4ade80",l:"A / 4.0 GPA"},{c:"#facc15",l:"B / 3.0 GPA"},{c:"#f87171",l:"C or below"}].map(g=>(
              <div key={g.l} style={{display:"flex",alignItems:"center",gap:6,fontSize:11,fontWeight:600,color:"rgba(255,255,255,0.6)"}}>
                <div style={{width:8,height:8,borderRadius:"50%",background:g.c}}/>
                {g.l}
              </div>
            ))}
            <div style={{fontSize:11,fontWeight:600,color:"rgba(255,255,255,0.4)"}}>• Drag courses between years to rearrange</div>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Root ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState<Page>("setup");
  const [formData, setFormData] = useState<FormData | null>(null);

  if (page === "plan" && formData) {
    return <PlanPage form={formData} onBack={()=>setPage("setup")}/>;
  }
  return <SetupPage onSubmit={d=>{setFormData(d);setPage("plan");}}/>;
}

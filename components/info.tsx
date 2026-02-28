"use client";

import { useState, useCallback } from "react";
import { generatePlan } from "@/lib/planner/generate-plan";
import type { CourseCatalog, SemesterPlan, ScheduledCourse } from "@/lib/planner/types";
import { AVAILABLE_MAJORS, AVAILABLE_MINORS, MAJOR_JSON_MAP, MINOR_JSON_MAP } from "@/lib/config";
import csMajor from "@/data/penn-state/computer-science-major.json";
import mathMinor from "@/data/penn-state/math-minor.json";

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

interface SemesterData {
  label: string;
  courses: Course[];
}

interface YearData {
  id: string;
  label: string;
  fall: SemesterData;
  spring: SemesterData;
  yearIndex: number;
}

const MAJORS = AVAILABLE_MAJORS.map((m) => m.label);
const MINORS = AVAILABLE_MINORS.map((m) => m.label);

const CATALOGS: Record<string, CourseCatalog> = {
  "computer-science-major": csMajor as CourseCatalog,
  "math-minor": mathMinor as CourseCatalog,
};

const GRADE_POINTS: Record<string, number> = {
  "A+": 4.0,"A": 4.0,"A-": 3.7,
  "B+": 3.3,"B": 3.0,"B-": 2.7,
  "C+": 2.3,"C": 2.0,"C-": 1.7,
  "D+": 1.3,"D": 1.0,"D-": 0.7,
  "F": 0.0,
};
const GRADE_OPTIONS = ["","A+","A","A-","B+","B","B-","C+","C","C-","D+","D","D-","F"];

function makeId() { return Math.random().toString(36).slice(2, 9); }

function planToYearData(semesters: SemesterPlan[]): YearData[] {
  const years: YearData[] = [];
  for (let y = 0; y < 4; y++) {
    const fall = semesters[y * 2];
    const spring = semesters[y * 2 + 1];
    years.push({
      id: `y${y + 1}`,
      label: `Year ${y + 1}`,
      yearIndex: y,
      fall: {
        label: "Fall",
        courses: (fall?.courses ?? []).map((c) => ({
          id: c.id,
          name: c.name,
          credits: c.credits,
          grade: c.grade,
        })),
      },
      spring: {
        label: "Spring",
        courses: (spring?.courses ?? []).map((c) => ({
          id: c.id,
          name: c.name,
          credits: c.credits,
          grade: c.grade,
        })),
      },
    });
  }
  return years;
}

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
  const [form, setForm] = useState<FormData>({name:"",university:"",major:"Computer Science",doubleMajor:"",minors:[],credits:""});
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
            {form.minors.length<3&&<button className="add-btn" onClick={()=>set("minors",[...form.minors,MINORS[0]||"Mathematics"])}>+ Add</button>}
          </div>
          {form.minors.map((mn,i)=>(
            <div key={i} style={{display:"flex",gap:8,marginBottom:8,alignItems:"center"}}>
              <select className="inp" value={mn} style={{flex:1}} onChange={e=>{const v=e.target.value;if(v) {const m=[...form.minors];m[i]=v;set("minors",m);} else set("minors",form.minors.filter((_,j)=>j!==i));}}>
                <option value="">No minor</option>
                {MINORS.map(m=><option key={m}>{m}</option>)}
              </select>
              {form.minors.length>1&&<button className="rm-btn" onClick={()=>set("minors",form.minors.filter((_,j)=>j!==i))}>×</button>}
            </div>
          ))}
          {form.minors.length===0&&<div style={{marginBottom:8}}><select className="inp" value="" onChange={e=>{if(e.target.value)set("minors",[e.target.value]);}}><option value="">Select a minor (optional)</option>{MINORS.map(m=><option key={m}>{m}</option>)}</select></div>}
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

        {/* Remove btn */}
        <button
          onClick={e=>{e.stopPropagation();onRemove();}}
          style={{background:"none",border:"none",color:"rgba(255,100,100,0.45)",cursor:"pointer",fontSize:15,padding:"2px 4px",lineHeight:1,transition:"color .15s",flexShrink:0}}
          title="Remove"
        >×</button>
      </div>
    </div>
  );
}

const YEAR_GRADIENT = [
  "rgba(34, 197, 94, 0.25)",   // Year 1: green (easy)
  "rgba(163, 230, 53, 0.2)",   // Year 2: lime
  "rgba(250, 204, 21, 0.2)",   // Year 3: yellow
  "rgba(248, 113, 113, 0.2)",  // Year 4: red (hard)
];
const YEAR_BORDER = [
  "rgba(34, 197, 94, 0.5)",
  "rgba(163, 230, 53, 0.45)",
  "rgba(250, 204, 21, 0.45)",
  "rgba(248, 113, 113, 0.5)",
];

function SemesterSection({
  sem, year, semesterKey, onUpdate, onAddCourse, draggingId, setDraggingId, dragSource, setDragSource, onDropCourse,
}: {
  sem: SemesterData;
  year: YearData;
  semesterKey: "fall" | "spring";
  onUpdate: (y: YearData) => void;
  onAddCourse: (yearId: string, sk: "fall" | "spring") => void;
  draggingId: string | null;
  setDraggingId: (id: string | null) => void;
  dragSource: string | null;
  setDragSource: (id: string | null) => void;
  onDropCourse: (courseId: string, from: string, to: string) => void;
}) {
  const [dragOver, setDragOver] = useState(false);
  const targetId = `${year.id}-${semesterKey}`;
  const totalCredits = sem.courses.reduce((s, c) => s + c.credits, 0);

  const updateSemester = (courses: Course[]) => {
    onUpdate({
      ...year,
      [semesterKey]: { ...sem, courses },
    });
  };

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        if (draggingId && dragSource) onDropCourse(draggingId, dragSource, targetId);
      }}
      style={{
        background: dragOver ? "rgba(192,84,252,0.12)" : "rgba(255,255,255,0.03)",
        border: `1px solid ${dragOver ? "rgba(192,84,252,0.5)" : "rgba(255,255,255,0.08)"}`,
        borderRadius: 12,
        marginBottom: 10,
        padding: "10px 12px",
        transition: "all .15s",
      }}
    >
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
        <span style={{fontSize:11,fontWeight:700,color:"rgba(255,255,255,0.5)",textTransform:"uppercase",letterSpacing:".06em"}}>{sem.label}</span>
        <span style={{fontSize:10,color:"rgba(255,255,255,0.35)",fontWeight:600}}>{totalCredits} cr</span>
      </div>
      {sem.courses.length === 0 && (
        <div style={{textAlign:"center",padding:"16px 0",color:"rgba(255,255,255,0.18)",fontSize:11,fontWeight:600}}>Drop courses here</div>
      )}
      {sem.courses.map((course) => (
        <CourseCard
          key={course.id}
          course={course}
          isDragging={draggingId === course.id}
          onDragStart={() => { setDraggingId(course.id); setDragSource(targetId); }}
          onDragEnd={() => { setDraggingId(null); setDragSource(null); }}
          onRemove={() => updateSemester(sem.courses.filter((c) => c.id !== course.id))}
          onUpdate={(updated) => updateSemester(sem.courses.map((c) => (c.id === updated.id ? updated : c)))}
        />
      ))}
      <button
        onClick={() => onAddCourse(year.id, semesterKey)}
        style={{width:"100%",marginTop:6,background:"rgba(192,84,252,0.12)",border:"1px dashed rgba(192,84,252,0.35)",borderRadius:8,color:"#c084fc",fontFamily:"Montserrat,sans-serif",fontSize:10,fontWeight:700,padding:"6px",cursor:"pointer",letterSpacing:".03em"}}
      >+ Add course</button>
    </div>
  );
}

function YearBox({
  year, onUpdate, onAddCourse,
  draggingId, setDraggingId, dragSource, setDragSource,
  onDropCourse,
}: {
  year: YearData;
  onUpdate: (y: YearData) => void;
  onAddCourse: (yearId: string, semesterKey: "fall" | "spring") => void;
  draggingId: string | null;
  setDraggingId: (id: string | null) => void;
  dragSource: string | null;
  setDragSource: (id: string | null) => void;
  onDropCourse: (courseId: string, from: string, to: string) => void;
}) {
  const totalCredits = year.fall.courses.reduce((s, c) => s + c.credits, 0) + year.spring.courses.reduce((s, c) => s + c.credits, 0);
  const bgColor = YEAR_GRADIENT[year.yearIndex] ?? YEAR_GRADIENT[0];
  const borderColor = YEAR_BORDER[year.yearIndex] ?? YEAR_BORDER[0];

  return (
    <div
      style={{
        background: bgColor,
        border: `1.5px solid ${borderColor}`,
        borderRadius: 18,
        overflow: "hidden",
        backdropFilter: "blur(14px)",
        transition: "all .15s",
        flex: "1 1 280px",
        minWidth: 260,
      }}
    >
      <div style={{padding:"14px 16px 10px",borderBottom:"1px solid rgba(255,255,255,0.1)",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div>
          <div style={{fontSize:14,fontWeight:800,color:"#fff",letterSpacing:"-0.01em"}}>{year.label}</div>
          <div style={{fontSize:10,color:"rgba(255,255,255,0.4)",fontWeight:600,marginTop:2}}>{totalCredits} credits total</div>
        </div>
      </div>
      <div style={{padding:"12px"}}>
        <SemesterSection
          sem={year.fall}
          year={year}
          semesterKey="fall"
          onUpdate={onUpdate}
          onAddCourse={onAddCourse}
          draggingId={draggingId}
          setDraggingId={setDraggingId}
          dragSource={dragSource}
          setDragSource={setDragSource}
          onDropCourse={onDropCourse}
        />
        <SemesterSection
          sem={year.spring}
          year={year}
          semesterKey="spring"
          onUpdate={onUpdate}
          onAddCourse={onAddCourse}
          draggingId={draggingId}
          setDraggingId={setDraggingId}
          dragSource={dragSource}
          setDragSource={setDragSource}
          onDropCourse={onDropCourse}
        />
      </div>
    </div>
  );
}

// ── Plan Page ─────────────────────────────────────────────────────────────────
function PlanPage({ form, onBack }: { form: FormData; onBack: () => void }) {
  const majorKey = MAJOR_JSON_MAP[form.major];
  const minorKey = form.minors[0] ? MINOR_JSON_MAP[form.minors[0]] : undefined;
  const majorCatalog = majorKey ? CATALOGS[majorKey] : {};
  const minorCatalog = minorKey ? CATALOGS[minorKey] : {};
  const getInitialYears = useCallback(() => {
    if (!majorKey) {
      return [1, 2, 3, 4].map((n) => ({
        id: `y${n}`,
        label: `Year ${n}`,
        yearIndex: n - 1,
        fall: { label: "Fall", courses: [] },
        spring: { label: "Spring", courses: [] },
      }));
    }
    const plan = generatePlan(
      majorCatalog,
      minorCatalog,
      form.major,
      form.minors[0] || undefined,
      parseInt(form.credits) || 0
    );
    return planToYearData(plan);
  }, [majorKey, form.major, form.minors, form.credits]);

  const [years, setYears] = useState<YearData[]>(getInitialYears);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragSource, setDragSource] = useState<string | null>(null);

  const updateYear = useCallback((updated: YearData) => {
    setYears(ys => ys.map(y => y.id === updated.id ? updated : y));
  }, []);

  const addCourse = useCallback((yearId: string, semesterKey: "fall" | "spring") => {
    const newCourse: Course = { id: makeId(), name: "New Course", credits: 3, grade: "" };
    setYears((ys) =>
      ys.map((y) =>
        y.id === yearId
          ? { ...y, [semesterKey]: { ...y[semesterKey], courses: [...y[semesterKey].courses, newCourse] } }
          : y
      )
    );
  }, []);

  const dropCourse = useCallback((courseId: string, from: string, to: string) => {
    if (from === to) return;
    const [fromYearId, fromSem] = from.includes("-") ? from.split("-") : [from, "fall"];
    const [toYearId, toSem] = to.includes("-") ? to.split("-") : [to, "fall"];
    const fromSemKey = fromSem === "spring" ? "spring" : "fall";
    const toSemKey = toSem === "spring" ? "spring" : "fall";
    setYears((ys) => {
      const fromYear = ys.find((y) => y.id === fromYearId);
      const course = fromYear?.[fromSemKey]?.courses?.find((c) => c.id === courseId);
      if (!course) return ys;
      return ys.map((y) => {
        if (y.id === fromYearId)
          return { ...y, [fromSemKey]: { ...y[fromSemKey], courses: y[fromSemKey].courses.filter((c) => c.id !== courseId) } };
        if (y.id === toYearId)
          return { ...y, [toSemKey]: { ...y[toSemKey], courses: [...y[toSemKey].courses, course] } };
        return y;
      });
    });
  }, []);

  // Stats
  const allCourses = years.flatMap((y) => [...y.fall.courses, ...y.spring.courses]);
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
              ...(form.minors[0] ? [{l:"Minor", v:form.minors[0], color:"rgba(255,255,255,0.85)"}] : []),
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
            {years.map((year) => (
              <YearBox
                key={year.id}
                year={year}
                onUpdate={updateYear}
                onAddCourse={addCourse}
                draggingId={draggingId}
                setDraggingId={setDraggingId}
                dragSource={dragSource}
                setDragSource={setDragSource}
                onDropCourse={dropCourse}
              />
            ))}
          </div>

          {/* Legend */}
          <div style={{marginTop:24,display:"flex",gap:20,flexWrap:"wrap",alignItems:"center"}}>
            <div style={{display:"flex",alignItems:"center",gap:6,fontSize:11,fontWeight:600,color:"rgba(255,255,255,0.6)"}}>
              <span style={{color:"rgba(255,255,255,0.4)"}}>Difficulty:</span>
              <div style={{display:"flex",alignItems:"center",gap:4}}><div style={{width:10,height:10,borderRadius:4,background:YEAR_GRADIENT[0],border:`1px solid ${YEAR_BORDER[0]}`}}/></div>
              <div style={{display:"flex",alignItems:"center",gap:4}}><div style={{width:10,height:10,borderRadius:4,background:YEAR_GRADIENT[1],border:`1px solid ${YEAR_BORDER[1]}`}}/></div>
              <div style={{display:"flex",alignItems:"center",gap:4}}><div style={{width:10,height:10,borderRadius:4,background:YEAR_GRADIENT[2],border:`1px solid ${YEAR_BORDER[2]}`}}/></div>
              <div style={{display:"flex",alignItems:"center",gap:4}}><div style={{width:10,height:10,borderRadius:4,background:YEAR_GRADIENT[3],border:`1px solid ${YEAR_BORDER[3]}`}}/></div>
              <span style={{fontSize:10,color:"rgba(255,255,255,0.35)"}}>Y1→Y4 (easy→hard)</span>
            </div>
            <div style={{width:1,height:16,background:"rgba(255,255,255,0.15)"}}/>
            {[{c:"#4ade80",l:"A / 4.0 GPA"},{c:"#facc15",l:"B / 3.0 GPA"},{c:"#f87171",l:"C or below"}].map((g) => (
              <div key={g.l} style={{display:"flex",alignItems:"center",gap:6,fontSize:11,fontWeight:600,color:"rgba(255,255,255,0.6)"}}>
                <div style={{width:8,height:8,borderRadius:"50%",background:g.c}}/>
                {g.l}
              </div>
            ))}
            <div style={{fontSize:11,fontWeight:600,color:"rgba(255,255,255,0.4)"}}>• Drag courses between semesters to rearrange</div>
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

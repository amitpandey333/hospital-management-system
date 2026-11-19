import { useEffect, useState } from 'react';
import { Activity, CalendarDays, LayoutDashboard, Users, Stethoscope, Plus, RefreshCw, Trash2, CheckCircle2 } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000/api';
async function api(path, options={}) {
  const res = await fetch(`${API}${path}`, {headers:{'Content-Type':'application/json'}, ...options});
  const data = await res.json().catch(()=>({}));
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}
const blankPatient = {full_name:'',phone:'',gender:'',date_of_birth:'',email:'',address:''};
const blankDoctor = {full_name:'',phone:'',email:'',specialization:'',department_id:'1'};
const blankAppt = {patient_id:'',doctor_id:'',appointment_date:'',appointment_time:'09:00',reason:''};

export default function App() {
  const [page,setPage]=useState('Dashboard');
  const [stats,setStats]=useState({patients:0,doctors:0,appointments:0,today_appointments:0});
  const [patients,setPatients]=useState([]), [doctors,setDoctors]=useState([]), [appointments,setAppointments]=useState([]);
  const [patient,setPatient]=useState(blankPatient), [doctor,setDoctor]=useState(blankDoctor), [appt,setAppt]=useState(blankAppt);
  const [message,setMessage]=useState(''), [error,setError]=useState('');
  async function refresh() {
    try {
      const [s,p,d,a]=await Promise.all([api('/dashboard'),api('/patients'),api('/doctors'),api('/appointments')]);
      setStats(s);setPatients(p);setDoctors(d);setAppointments(a);setError('');
    } catch(e) {setError(e.message);}
  }
  useEffect(()=>{refresh();},[]);
  async function perform(fn,success) {setError('');setMessage('');try{await fn();setMessage(success);await refresh();}catch(e){setError(e.message);}}
  const nav=[['Dashboard',LayoutDashboard],['Patients',Users],['Doctors',Stethoscope],['Appointments',CalendarDays]];
  return <div className="shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-icon"><Activity/></div><div><b>CarePoint</b><small>Hospital Management</small></div></div>
      <div className="nav-label">WORKSPACE</div>
      {nav.map(([name,Icon])=><button key={name} className={`nav ${page===name?'active':''}`} onClick={()=>setPage(name)}><Icon size={18}/>{name}</button>)}
      <div className="side-foot">● &nbsp;Local development system</div>
    </aside>
    <main className="main">
      <header className="top"><div><span className="eyebrow">HOSPITAL OPERATIONS</span><h1>{page}</h1></div><button className="refresh" onClick={refresh}><RefreshCw size={15}/> Refresh</button></header>
      {message&&<div className="notice success"><CheckCircle2 size={16}/>{message}</div>}
      {error&&<div className="notice error">{error}</div>}
      {page==='Dashboard'&&<section>
        <p className="muted">A quick overview of hospital activity and records.</p>
        <div className="stats">{[['Total Patients',stats.patients,Users],['Total Doctors',stats.doctors,Stethoscope],['Appointments',stats.appointments,CalendarDays],["Today's Appointments",stats.today_appointments,Activity]].map(([label,value,Icon])=><div className="stat" key={label}><div className="stat-icon"><Icon/></div><div><span>{label}</span><strong>{value}</strong></div></div>)}</div>
        <div className="panel welcome"><span className="eyebrow">CAREPOINT OVERVIEW</span><h2>Organised care starts here.</h2><p>Manage patient records, doctor information and appointment schedules from one workspace.</p></div>
        <div className="panel"><div className="panel-title"><h3>Recent appointments</h3><button className="link" onClick={()=>setPage('Appointments')}>View all</button></div><AppointmentTable rows={appointments.slice(0,5)} update={(id,status)=>perform(()=>api(`/appointments/${id}`,{method:'PUT',body:JSON.stringify({status})}),'Appointment updated')}/></div>
      </section>}
      {page==='Patients'&&<section className="content-grid">
        <div className="panel form-panel"><h3><Plus size={18}/> Add patient</h3><form onSubmit={e=>{e.preventDefault();perform(()=>api('/patients',{method:'POST',body:JSON.stringify(patient)}),'Patient added');setPatient(blankPatient);}}>
          <Field label="Full name" value={patient.full_name} change={v=>setPatient({...patient,full_name:v})} required/>
          <Field label="Phone" value={patient.phone} change={v=>setPatient({...patient,phone:v})} required/>
          <label>Gender<select required value={patient.gender} onChange={e=>setPatient({...patient,gender:e.target.value})}><option value="">Select gender</option><option>Female</option><option>Male</option><option>Other</option></select></label>
          <label>Date of birth<input type="date" value={patient.date_of_birth} onChange={e=>setPatient({...patient,date_of_birth:e.target.value})}/></label>
          <Field label="Email" value={patient.email} change={v=>setPatient({...patient,email:v})}/>
          <label>Address<textarea rows="2" value={patient.address} onChange={e=>setPatient({...patient,address:e.target.value})}/></label>
          <button className="primary">Save patient</button>
        </form></div>
        <div className="panel"><div className="panel-title"><h3>Patient records</h3><span className="count">{patients.length} records</span></div><div className="table-wrap"><table><thead><tr><th>Name</th><th>Phone</th><th>Gender</th><th>Email</th><th></th></tr></thead><tbody>
          {patients.map(p=><tr key={p.patient_id}><td><b>{p.full_name}</b><small>Patient #{p.patient_id}</small></td><td>{p.phone}</td><td>{p.gender}</td><td>{p.email||'—'}</td><td><Delete onClick={()=>{if(confirm('Delete this patient?'))perform(()=>api(`/patients/${p.patient_id}`,{method:'DELETE'}),'Patient deleted')}}/></td></tr>)}
          {!patients.length&&<Empty cols="5"/>}
        </tbody></table></div></div>
      </section>}
      {page==='Doctors'&&<section className="content-grid">
        <div className="panel form-panel"><h3><Plus size={18}/> Add doctor</h3><form onSubmit={e=>{e.preventDefault();perform(()=>api('/doctors',{method:'POST',body:JSON.stringify(doctor)}),'Doctor added');setDoctor(blankDoctor);}}>
          <Field label="Doctor name" value={doctor.full_name} change={v=>setDoctor({...doctor,full_name:v})} required/>
          <Field label="Phone" value={doctor.phone} change={v=>setDoctor({...doctor,phone:v})} required/>
          <Field label="Email" value={doctor.email} change={v=>setDoctor({...doctor,email:v})}/>
          <Field label="Specialization" value={doctor.specialization} change={v=>setDoctor({...doctor,specialization:v})} required/>
          <label>Department<select value={doctor.department_id} onChange={e=>setDoctor({...doctor,department_id:e.target.value})}><option value="1">Cardiology</option><option value="2">Neurology</option><option value="3">Orthopedics</option><option value="4">General Medicine</option></select></label>
          <button className="primary">Save doctor</button>
        </form></div>
        <div className="panel"><div className="panel-title"><h3>Doctor directory</h3><span className="count">{doctors.length} records</span></div><div className="table-wrap"><table><thead><tr><th>Name</th><th>Specialization</th><th>Department</th><th>Phone</th><th></th></tr></thead><tbody>
          {doctors.map(d=><tr key={d.doctor_id}><td><b>{d.full_name}</b><small>Doctor #{d.doctor_id}</small></td><td>{d.specialization}</td><td>{d.department_name}</td><td>{d.phone}</td><td><Delete onClick={()=>{if(confirm('Delete this doctor?'))perform(()=>api(`/doctors/${d.doctor_id}`,{method:'DELETE'}),'Doctor deleted')}}/></td></tr>)}
          {!doctors.length&&<Empty cols="5"/>}
        </tbody></table></div></div>
      </section>}
      {page==='Appointments'&&<section>
        <div className="panel form-panel"><h3><Plus size={18}/> Schedule appointment</h3><form className="appt-form" onSubmit={e=>{e.preventDefault();perform(()=>api('/appointments',{method:'POST',body:JSON.stringify(appt)}),'Appointment scheduled');setAppt(blankAppt);}}>
          <label>Patient<select required value={appt.patient_id} onChange={e=>setAppt({...appt,patient_id:e.target.value})}><option value="">Select patient</option>{patients.map(p=><option key={p.patient_id} value={p.patient_id}>{p.full_name}</option>)}</select></label>
          <label>Doctor<select required value={appt.doctor_id} onChange={e=>setAppt({...appt,doctor_id:e.target.value})}><option value="">Select doctor</option>{doctors.map(d=><option key={d.doctor_id} value={d.doctor_id}>{d.full_name}</option>)}</select></label>
          <label>Date<input required type="date" value={appt.appointment_date} onChange={e=>setAppt({...appt,appointment_date:e.target.value})}/></label>
          <label>Time<input required type="time" value={appt.appointment_time} onChange={e=>setAppt({...appt,appointment_time:e.target.value})}/></label>
          <label className="reason">Reason<input value={appt.reason} onChange={e=>setAppt({...appt,reason:e.target.value})} placeholder="Reason for visit"/></label>
          <button className="primary">Schedule</button>
        </form></div>
        <div className="panel"><div className="panel-title"><h3>Appointment schedule</h3><span className="count">{appointments.length} records</span></div><AppointmentTable rows={appointments} update={(id,status)=>perform(()=>api(`/appointments/${id}`,{method:'PUT',body:JSON.stringify({status})}),'Appointment updated')} remove={id=>{if(confirm('Delete appointment?'))perform(()=>api(`/appointments/${id}`,{method:'DELETE'}),'Appointment deleted')}}/></div>
      </section>}
      <footer>CarePoint · MCA DBMS Project · React + Flask + MySQL</footer>
    </main>
  </div>;
}
function Field({label,value,change,required=false}){return <label>{label}<input required={required} value={value} onChange={e=>change(e.target.value)}/></label>}
function Delete({onClick}){return <button type="button" className="delete" onClick={onClick} title="Delete"><Trash2 size={15}/></button>}
function Empty({cols}){return <tr><td colSpan={cols} className="empty">No records yet. Add a record to get started.</td></tr>}
function AppointmentTable({rows,update,remove=()=>{}}){return <div className="table-wrap"><table><thead><tr><th>Patient</th><th>Doctor</th><th>Date & time</th><th>Reason</th><th>Status</th><th></th></tr></thead><tbody>
{rows.map(a=><tr key={a.appointment_id}><td><b>{a.patient_name}</b><small>#{a.patient_id}</small></td><td>{a.doctor_name}</td><td>{String(a.appointment_date).slice(0,10)}<small>{String(a.appointment_time).slice(0,5)}</small></td><td>{a.reason||'—'}</td><td><select className="status" value={a.status} onChange={e=>update(a.appointment_id,e.target.value)}><option>Scheduled</option><option>Completed</option><option>Cancelled</option></select></td><td><Delete onClick={()=>remove(a.appointment_id)}/></td></tr>)}
{!rows.length&&<Empty cols="6"/>}</tbody></table></div>}

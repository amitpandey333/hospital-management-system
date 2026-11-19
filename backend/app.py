from flask import Flask, jsonify, request
from flask_cors import CORS
from mysql.connector import Error
from db import fetch_all, fetch_one, execute

app = Flask(__name__)

# MySQL returns DATE as datetime.date and TIME as datetime.timedelta.
# Flask's default JSON encoder cannot serialise timedelta and formats dates as
# "Thu, 19 Nov 2026 ...", so convert them to ISO-style strings.
from flask.json.provider import DefaultJSONProvider
import datetime as _dt

class AppJSONProvider(DefaultJSONProvider):
    @staticmethod
    def default(o):
        if isinstance(o, _dt.timedelta):
            total = int(o.total_seconds())
            return f"{total // 3600:02d}:{(total % 3600) // 60:02d}:{total % 60:02d}"
        if isinstance(o, _dt.datetime):
            return o.isoformat(sep=" ")
        if isinstance(o, _dt.date):
            return o.isoformat()
        return DefaultJSONProvider.default(o)

app.json = AppJSONProvider(app)
CORS(app, resources={r"/api/*": {"origins": "*"}})

def fail(message, status=400):
    return jsonify({"error": str(message)}), status

def required_text(data, key, label, max_len=150, required=True):
    value = data.get(key)
    if value is None:
        if required:
            raise ValueError(f"{label} is required")
        return None
    value = str(value).strip()
    if required and not value:
        raise ValueError(f"{label} is required")
    if len(value) > max_len:
        raise ValueError(f"{label} must be at most {max_len} characters")
    return value or None

def integer(data, key, label):
    try:
        return int(data.get(key))
    except (TypeError, ValueError):
        raise ValueError(f"{label} must be a valid integer")

@app.get("/api/health")
def health():
    try:
        return jsonify({"status": "ok", "database": bool(fetch_one("SELECT 1 AS ok")["ok"])})
    except Error as exc:
        return fail(f"Database connection failed: {exc}", 503)

@app.get("/api/dashboard")
def dashboard():
    try:
        return jsonify({
            "patients": fetch_one("SELECT COUNT(*) AS n FROM patients")["n"],
            "doctors": fetch_one("SELECT COUNT(*) AS n FROM doctors")["n"],
            "appointments": fetch_one("SELECT COUNT(*) AS n FROM appointments")["n"],
            "today_appointments": fetch_one("SELECT COUNT(*) AS n FROM appointments WHERE appointment_date=CURDATE()")["n"],
        })
    except Error as exc:
        return fail(exc, 500)

@app.get("/api/patients")
def patients_list():
    try:
        return jsonify(fetch_all("SELECT * FROM patients ORDER BY patient_id DESC"))
    except Error as exc:
        return fail(exc, 500)

@app.post("/api/patients")
def patients_create():
    data = request.get_json(silent=True) or {}
    try:
        values = (
            required_text(data, "full_name", "Full name"),
            required_text(data, "phone", "Phone", 20),
            required_text(data, "gender", "Gender", 20),
            data.get("date_of_birth") or None,
            required_text(data, "email", "Email", 120, False),
            required_text(data, "address", "Address", 500, False),
        )
        new_id = execute(
            "INSERT INTO patients(full_name,phone,gender,date_of_birth,email,address) VALUES(%s,%s,%s,%s,%s,%s)",
            values,
        )
        return jsonify({"message": "Patient created", "patient_id": new_id}), 201
    except ValueError as exc:
        return fail(exc)
    except Error as exc:
        return fail(exc)

@app.get("/api/patients/<int:item_id>")
def patients_get(item_id):
    try:
        row = fetch_one("SELECT * FROM patients WHERE patient_id=%s", (item_id,))
        return (jsonify(row), 200) if row else fail("Patient not found", 404)
    except Error as exc:
        return fail(exc, 500)

@app.put("/api/patients/<int:item_id>")
def patients_update(item_id):
    data = request.get_json(silent=True) or {}
    try:
        values = (
            required_text(data, "full_name", "Full name"),
            required_text(data, "phone", "Phone", 20),
            required_text(data, "gender", "Gender", 20),
            data.get("date_of_birth") or None,
            required_text(data, "email", "Email", 120, False),
            required_text(data, "address", "Address", 500, False),
            item_id,
        )
        execute("UPDATE patients SET full_name=%s,phone=%s,gender=%s,date_of_birth=%s,email=%s,address=%s WHERE patient_id=%s", values)
        row = fetch_one("SELECT * FROM patients WHERE patient_id=%s", (item_id,))
        return (jsonify(row), 200) if row else fail("Patient not found", 404)
    except ValueError as exc:
        return fail(exc)
    except Error as exc:
        return fail(exc)

@app.delete("/api/patients/<int:item_id>")
def patients_delete(item_id):
    try:
        execute("DELETE FROM patients WHERE patient_id=%s", (item_id,))
        return jsonify({"message": "Patient deleted"})
    except Error:
        return fail("Cannot delete patient while appointments are linked to it.", 409)

@app.get("/api/doctors")
def doctors_list():
    try:
        return jsonify(fetch_all("""SELECT d.doctor_id,d.full_name,d.phone,d.email,d.specialization,
            d.department_id,dep.department_name FROM doctors d
            LEFT JOIN departments dep ON dep.department_id=d.department_id
            ORDER BY d.doctor_id DESC"""))
    except Error as exc:
        return fail(exc, 500)

@app.post("/api/doctors")
def doctors_create():
    data = request.get_json(silent=True) or {}
    try:
        values = (
            required_text(data, "full_name", "Doctor name"),
            required_text(data, "phone", "Phone", 20),
            required_text(data, "email", "Email", 120, False),
            required_text(data, "specialization", "Specialization", 120),
            integer(data, "department_id", "Department"),
        )
        new_id = execute("INSERT INTO doctors(full_name,phone,email,specialization,department_id) VALUES(%s,%s,%s,%s,%s)", values)
        return jsonify({"message": "Doctor created", "doctor_id": new_id}), 201
    except ValueError as exc:
        return fail(exc)
    except Error as exc:
        return fail(exc)

@app.put("/api/doctors/<int:item_id>")
def doctors_update(item_id):
    data = request.get_json(silent=True) or {}
    try:
        values = (
            required_text(data, "full_name", "Doctor name"),
            required_text(data, "phone", "Phone", 20),
            required_text(data, "email", "Email", 120, False),
            required_text(data, "specialization", "Specialization", 120),
            integer(data, "department_id", "Department"),
            item_id,
        )
        execute("UPDATE doctors SET full_name=%s,phone=%s,email=%s,specialization=%s,department_id=%s WHERE doctor_id=%s", values)
        row = fetch_one("SELECT * FROM doctors WHERE doctor_id=%s", (item_id,))
        return (jsonify(row), 200) if row else fail("Doctor not found", 404)
    except ValueError as exc:
        return fail(exc)
    except Error as exc:
        return fail(exc)

@app.delete("/api/doctors/<int:item_id>")
def doctors_delete(item_id):
    try:
        execute("DELETE FROM doctors WHERE doctor_id=%s", (item_id,))
        return jsonify({"message": "Doctor deleted"})
    except Error:
        return fail("Cannot delete doctor while appointments are linked to it.", 409)

APPOINTMENT_QUERY = """SELECT a.appointment_id,a.patient_id,p.full_name AS patient_name,
    a.doctor_id,d.full_name AS doctor_name,a.appointment_date,a.appointment_time,
    a.reason,a.status FROM appointments a
    JOIN patients p ON p.patient_id=a.patient_id
    JOIN doctors d ON d.doctor_id=a.doctor_id"""

@app.get("/api/appointments")
def appointments_list():
    try:
        return jsonify(fetch_all(APPOINTMENT_QUERY + " ORDER BY a.appointment_date DESC,a.appointment_time DESC"))
    except Error as exc:
        return fail(exc, 500)

@app.post("/api/appointments")
def appointments_create():
    data = request.get_json(silent=True) or {}
    try:
        values = (
            integer(data, "patient_id", "Patient"),
            integer(data, "doctor_id", "Doctor"),
            required_text(data, "appointment_date", "Appointment date", 10),
            required_text(data, "appointment_time", "Appointment time", 8),
            required_text(data, "reason", "Reason", 500, False),
        )
        new_id = execute("""INSERT INTO appointments(patient_id,doctor_id,appointment_date,appointment_time,reason)
            VALUES(%s,%s,%s,%s,%s)""", values)
        return jsonify({"message": "Appointment scheduled", "appointment_id": new_id}), 201
    except ValueError as exc:
        return fail(exc)
    except Error as exc:
        return fail(exc)

@app.put("/api/appointments/<int:item_id>")
def appointments_update(item_id):
    data = request.get_json(silent=True) or {}
    status = data.get("status")
    if status not in ("Scheduled", "Completed", "Cancelled"):
        return fail("Status must be Scheduled, Completed or Cancelled")
    try:
        execute("UPDATE appointments SET status=%s WHERE appointment_id=%s", (status, item_id))
        row = fetch_one("SELECT * FROM appointments WHERE appointment_id=%s", (item_id,))
        return (jsonify(row), 200) if row else fail("Appointment not found", 404)
    except Error as exc:
        return fail(exc)

@app.delete("/api/appointments/<int:item_id>")
def appointments_delete(item_id):
    try:
        execute("DELETE FROM appointments WHERE appointment_id=%s", (item_id,))
        return jsonify({"message": "Appointment deleted"})
    except Error as exc:
        return fail(exc)

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)

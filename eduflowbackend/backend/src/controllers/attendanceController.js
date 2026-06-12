const pool = require('../config/db');

// POST /api/attendance — teacher marks attendance for a class
// Body: { classId, date, records: [{ studentId, status }] }
const markAttendance = async (req, res) => {
  const { classId, date, records } = req.body;

  if (!classId || !date || !records || records.length === 0) {
    return res.status(400).json({ error: 'classId, date, and records are required.' });
  }

  try {
    // Use a transaction — either ALL records are saved or NONE
    // This prevents partial attendance (e.g. 20/30 students saved if server crashes)
    const client = await pool.connect();

    try {
      await client.query('BEGIN'); // start transaction

      for (const record of records) {
        // INSERT OR UPDATE — if attendance already marked, update it
        await client.query(
          `INSERT INTO attendance (class_id, student_id, date, status, marked_by)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (class_id, student_id, date)
           DO UPDATE SET status = EXCLUDED.status`,
          [classId, record.studentId, date, record.status, req.user.id]
        );
      }

      await client.query('COMMIT'); // save all changes
      res.json({ message: 'Attendance marked successfully.' });

    } catch (err) {
      await client.query('ROLLBACK'); // undo everything if any error
      throw err;
    } finally {
      client.release(); // always return connection to pool
    }

  } catch (err) {
    console.error('Attendance error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
};

// GET /api/attendance/:classId?date=YYYY-MM-DD — get attendance for a class on a date
const getAttendance = async (req, res) => {
  const { classId } = req.params;
  const { date } = req.query;

  try {
    const result = await pool.query(
      `SELECT a.*, u.name AS student_name
       FROM attendance a
       JOIN users u ON a.student_id = u.id
       WHERE a.class_id = $1 AND a.date = $2
       ORDER BY u.name`,
      [classId, date]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('Get attendance error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
};

// GET /api/attendance/student/:studentId/class/:classId — student's attendance summary
const getStudentAttendance = async (req, res) => {
  const { studentId, classId } = req.params;

  try {
    const result = await pool.query(
      `SELECT
         COUNT(*) FILTER (WHERE status = 'present') AS present_count,
         COUNT(*) FILTER (WHERE status = 'absent') AS absent_count,
         COUNT(*) FILTER (WHERE status = 'late') AS late_count,
         COUNT(*) AS total_days,
         ROUND(
           COUNT(*) FILTER (WHERE status = 'present') * 100.0 / NULLIF(COUNT(*), 0), 2
         ) AS attendance_percentage
       FROM attendance
       WHERE student_id = $1 AND class_id = $2`,
      [studentId, classId]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Student attendance error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
};

module.exports = { markAttendance, getAttendance, getStudentAttendance };

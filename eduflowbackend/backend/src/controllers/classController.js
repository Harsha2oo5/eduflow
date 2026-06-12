const pool = require('../config/db');
const crypto = require('crypto');

// Generate a random 6-character join code like "AB12CD"
const generateJoinCode = () => {
  return crypto.randomBytes(3).toString('hex').toUpperCase();
};

// POST /api/classes — teacher creates a class
const createClass = async (req, res) => {
  const { name, subject } = req.body;

  if (!name) return res.status(400).json({ error: 'Class name is required.' });

  try {
    let joinCode;
    let isUnique = false;

    // Keep generating until we get a unique code (extremely rare collision)
    while (!isUnique) {
      joinCode = generateJoinCode();
      const existing = await pool.query('SELECT id FROM classes WHERE join_code = $1', [joinCode]);
      if (existing.rows.length === 0) isUnique = true;
    }

    const result = await pool.query(
      'INSERT INTO classes (name, subject, teacher_id, join_code) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, subject, req.user.id, joinCode]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create class error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
};

// GET /api/classes — get all classes for the logged-in user
const getMyClasses = async (req, res) => {
  try {
    let result;

    if (req.user.role === 'teacher') {
      // Teacher sees classes they created
      result = await pool.query(
        `SELECT c.*, COUNT(ce.student_id) AS student_count
         FROM classes c
         LEFT JOIN class_enrollments ce ON c.id = ce.class_id
         WHERE c.teacher_id = $1
         GROUP BY c.id
         ORDER BY c.created_at DESC`,
        [req.user.id]
      );
    } else {
      // Student sees classes they've enrolled in
      result = await pool.query(
        `SELECT c.*, u.name AS teacher_name
         FROM classes c
         JOIN class_enrollments ce ON c.id = ce.class_id
         JOIN users u ON c.teacher_id = u.id
         WHERE ce.student_id = $1
         ORDER BY ce.enrolled_at DESC`,
        [req.user.id]
      );
    }

    res.json(result.rows);
  } catch (err) {
    console.error('Get classes error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
};

// POST /api/classes/join — student joins a class using join code
const joinClass = async (req, res) => {
  const { joinCode } = req.body;

  if (!joinCode) return res.status(400).json({ error: 'Join code is required.' });

  try {
    // Find the class with this join code
    const classResult = await pool.query(
      'SELECT * FROM classes WHERE join_code = $1',
      [joinCode.toUpperCase()]
    );

    if (classResult.rows.length === 0) {
      return res.status(404).json({ error: 'Invalid join code.' });
    }

    const classData = classResult.rows[0];

    // Check if student is already enrolled
    const enrolled = await pool.query(
      'SELECT id FROM class_enrollments WHERE class_id = $1 AND student_id = $2',
      [classData.id, req.user.id]
    );

    if (enrolled.rows.length > 0) {
      return res.status(409).json({ error: 'You are already enrolled in this class.' });
    }

    // Enroll the student
    await pool.query(
      'INSERT INTO class_enrollments (class_id, student_id) VALUES ($1, $2)',
      [classData.id, req.user.id]
    );

    res.json({ message: `Successfully joined ${classData.name}!`, class: classData });
  } catch (err) {
    console.error('Join class error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
};

// GET /api/classes/:id — get a single class with its students
const getClassById = async (req, res) => {
  const { id } = req.params;

  try {
    const classResult = await pool.query(
      'SELECT c.*, u.name AS teacher_name FROM classes c JOIN users u ON c.teacher_id = u.id WHERE c.id = $1',
      [id]
    );

    if (classResult.rows.length === 0) {
      return res.status(404).json({ error: 'Class not found.' });
    }

    // Get enrolled students
    const students = await pool.query(
      `SELECT u.id, u.name, u.email, ce.enrolled_at
       FROM users u
       JOIN class_enrollments ce ON u.id = ce.student_id
       WHERE ce.class_id = $1`,
      [id]
    );

    res.json({ ...classResult.rows[0], students: students.rows });
  } catch (err) {
    console.error('Get class error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
};

module.exports = { createClass, getMyClasses, joinClass, getClassById };

const PDFDocument = require('pdfkit');
const prisma = require('../db');

const GPA_POINTS = { A: 4.0, B: 3.0, C: 2.0, D: 1.0, F: 0.0 };
const SEMESTER_ORDER = ['Semester 1', 'Semester 2', 'Summer'];

function getLetterGrade(score, maxScore = 100) {
  const pct = maxScore > 0 ? (score / maxScore) * 100 : 0;
  if (pct >= 90) return 'A';
  if (pct >= 75) return 'B';
  if (pct >= 60) return 'C';
  if (pct >= 50) return 'D';
  return 'F';
}

function calcGpa(gradeRows) {
  let totalPoints = 0;
  let totalCredits = 0;
  for (const g of gradeRows) {
    const letter = g.grade || getLetterGrade(g.score, g.maxScore);
    const points = GPA_POINTS[letter] ?? 0;
    const credits = g.course?.credits ?? 3;
    totalPoints += points * credits;
    totalCredits += credits;
  }
  return { totalPoints, totalCredits, gpa: totalCredits > 0 ? +(totalPoints / totalCredits).toFixed(2) : 0 };
}

function determineStanding(cumulativeGpa) {
  if (cumulativeGpa >= 2.0) return 'good standing';
  if (cumulativeGpa >= 1.5) return 'probation';
  return 'suspension';
}

const COL_1 = 50;
const COL_2 = 120;
const COL_3 = 360;
const COL_4 = 410;
const COL_5 = 460;
const PAGE_WIDTH = 612;
const RIGHT_MARGIN = 50;
const TABLE_TOP = 230;
const ROW_HEIGHT = 20;

async function generateTranscriptPdf(studentId) {
  const [student, grades] = await Promise.all([
    prisma.student.findUnique({
      where: { id: studentId },
      include: { faculty: { select: { name: true } } },
    }),
    prisma.grade.findMany({
      where: { studentId, status: 'approved' },
      include: { course: { select: { name: true, credits: true } } },
      orderBy: { semester: 'asc' },
    }),
  ]);

  if (!student) throw new Error('Student not found');

  const semesters = [...new Set(grades.map((g) => g.semester).filter(Boolean))];
  semesters.sort((a, b) => SEMESTER_ORDER.indexOf(a) - SEMESTER_ORDER.indexOf(b));

  const semesterGpas = {};
  for (const sem of semesters) {
    const semGrades = grades.filter((g) => g.semester === sem);
    semesterGpas[sem] = calcGpa(semGrades).gpa;
  }

  const { gpa: cumulativeGpa, totalCredits, totalPoints } = calcGpa(grades);
  const academicStanding = determineStanding(cumulativeGpa);

  const doc = new PDFDocument({ margin: 50, size: 'A4' });
  const buffers = [];

  doc.on('data', (chunk) => buffers.push(chunk));

  // ── Header ──
  doc.fontSize(20).font('Helvetica-Bold').text(
    process.env.APP_NAME || 'Greenfield Academy',
    { align: 'center' }
  );
  doc.fontSize(14).font('Helvetica').text('Official Academic Transcript', { align: 'center' });
  doc.moveDown(0.5);
  doc.moveTo(50, doc.y).lineTo(PAGE_WIDTH - 50, doc.y).stroke();
  doc.moveDown(0.5);

  // ── Student Info ──
  const infoY = doc.y;
  doc.fontSize(10).font('Helvetica');

  const infoLeft = [
    `Student Name:  ${student.firstName} ${student.lastName}`,
    `Student ID:    ${student.studentNumber || 'N/A'}`,
    `Email:         ${student.email}`,
    `Year:          ${student.year || 'N/A'}`,
    `Department:    ${student.department || 'N/A'}`,
    `Faculty:       ${student.faculty?.name || 'N/A'}`,
  ];

  const infoRight = [
    `Date Issued:   ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`,
    `Status:        ${student.status}`,
  ];

  const maxLines = Math.max(infoLeft.length, infoRight.length);
  for (let i = 0; i < maxLines; i++) {
    const left = infoLeft[i] || '';
    const right = infoRight[i] || '';
    doc.text(left, COL_1, doc.y, { continued: true });
    doc.text(right, { align: 'right' });
  }

  doc.moveDown(0.5);

  // ── GPA Summary ──
  const gpaY = doc.y;
  doc.roundedRect(50, gpaY, PAGE_WIDTH - 100, 54, 4).fill('#f3f4f6');
  doc.fill('#000');

  const standingLabel = academicStanding === 'good standing' ? 'Good Standing' : academicStanding === 'probation' ? 'Probation' : 'Suspension';
  const gpaText = `Cumulative GPA: ${cumulativeGpa.toFixed(2)}`;
  const creditText = `Total Credits: ${totalCredits}`;
  const pointsText = `Grade Points: ${totalPoints.toFixed(1)}`;
  const standText = `Standing: ${standingLabel}`;

  doc.fontSize(11).font('Helvetica-Bold').text(gpaText, 65, gpaY + 8);
  doc.font('Helvetica').text(creditText, COL_2 + 30, gpaY + 8);
  doc.font('Helvetica-Bold').text(standText, { align: 'right' }).font('Helvetica');
  doc.fontSize(10).text(pointsText, 65, gpaY + 28);

  doc.y = gpaY + 70;

  // ── Semester Tables ──
  for (const sem of semesters) {
    const semGrades = grades.filter((g) => g.semester === sem);
    if (semGrades.length === 0) continue;

    // Check page break (need at least semGrades.length * ROW_HEIGHT + 80 pixels)
    if (doc.y > 620) {
      doc.addPage();
    }

    doc.fontSize(12).font('Helvetica-Bold').text(`${sem}`, COL_1, doc.y);
    doc.font('Helvetica').text(`GPA: ${semesterGpas[sem].toFixed(2)}`, { align: 'right' });
    doc.moveDown(0.3);

    // Table header
    const tableY = doc.y;
    const colWidths = [210, 55, 50, 50, 110];
    const headers = ['Subject', 'Score', 'Max', '%', 'Grade'];
    const colXs = [COL_1, 260, 315, 365, 415];

    doc.rect(COL_1, tableY, PAGE_WIDTH - 100, ROW_HEIGHT).fill('#1f2937');
    doc.fill('#fff').fontSize(9).font('Helvetica-Bold');
    headers.forEach((h, i) => doc.text(h, colXs[i] + 4, tableY + 5, { width: colWidths[i] }));
    doc.fill('#000');

    // Table rows
    let rowY = tableY + ROW_HEIGHT;
    doc.fontSize(9).font('Helvetica');
    for (const g of semGrades) {
      // Alternate row background
      if (semGrades.indexOf(g) % 2 === 1) {
        doc.rect(COL_1, rowY, PAGE_WIDTH - 100, ROW_HEIGHT).fill('#f9fafb');
        doc.fill('#000');
      }

      const pct = Math.round((g.score / g.maxScore) * 100);
      const courseName = g.course?.name || g.subject || 'Unknown';

      doc.text(courseName, colXs[0] + 4, rowY + 5, { width: colWidths[0] });
      doc.text(String(g.score), colXs[1] + 4, rowY + 5, { width: colWidths[1] });
      doc.text(String(g.maxScore), colXs[2] + 4, rowY + 5, { width: colWidths[2] });
      doc.text(`${pct}%`, colXs[3] + 4, rowY + 5, { width: colWidths[3] });
      doc.text(g.grade || getLetterGrade(g.score, g.maxScore), colXs[4] + 4, rowY + 5, { width: colWidths[4] });

      rowY += ROW_HEIGHT;
    }

    // Draw borders
    doc.rect(COL_1, tableY, PAGE_WIDTH - 100, rowY - tableY).stroke();

    doc.y = rowY + 16;
  }

  // ── Footer ──
  doc.moveDown(2);
  doc.moveTo(50, doc.y).lineTo(PAGE_WIDTH - 50, doc.y).stroke();
  doc.moveDown(0.5);
  doc.fontSize(8).fillColor('#6b7280').text(
    `This is an official document generated by ${process.env.APP_NAME || 'Greenfield Academy'} on ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}.`,
    { align: 'center' }
  );

  doc.end();

  return new Promise((resolve) => {
    doc.on('end', () => resolve(Buffer.concat(buffers)));
  });
}

module.exports = { generateTranscriptPdf };

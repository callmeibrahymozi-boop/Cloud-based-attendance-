import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { CourseReportMeta, CourseReportStudent } from '../types';

export interface InstitutionalReportSummary {
  generated_at: string;
  institution: string;
  total_students: number;
  total_lecturers: number;
  total_courses: number;
  total_records: number;
  present_percentage: number;
  late_percentage: number;
  absent_percentage: number;
  overall_attendance_rate: number;
}

export interface InstitutionalReportCourse {
  course_id: string;
  course_code: string;
  course_title: string;
  department: string;
  lecturer_name: string;
  enrolled_count: number;
  classes_held: number;
  total_records: number;
  present_count: number;
  late_count: number;
  absent_count: number;
  attendance_rate: number;
}

/**
 * Generates and triggers download of a professional Institutional Attendance Audit PDF
 */
export function generateInstitutionalReportPDF(
  summary: InstitutionalReportSummary,
  courses: InstitutionalReportCourse[],
  deptFilter?: string
) {
  // Use Landscape for wide multi-column institutional tables
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Top Institutional Blue Banner
  doc.setFillColor(30, 58, 138); // Blue 900
  doc.rect(0, 0, pageWidth, 24, 'F');

  // Accent Gold/Yellow Stripe
  doc.setFillColor(245, 158, 11);
  doc.rect(0, 24, pageWidth, 1.5, 'F');

  // Institution Title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text((summary.institution || 'EDUTRACK CLOUD ATTENDANCE MANAGEMENT SYSTEM').toUpperCase(), 14, 11);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(
    'OFFICE OF ACADEMIC AFFAIRS & REGISTRY • INSTITUTIONAL ATTENDANCE AUDIT & COMPLIANCE REPORT',
    14,
    18
  );

  // Subheader / Report Meta Block
  doc.setTextColor(51, 65, 85);
  doc.setFontSize(8.5);
  const genDate = new Date(summary.generated_at).toLocaleString();
  const filterText = deptFilter ? `Filtered by Department: ${deptFilter}` : 'Scope: All Institutional Departments';
  doc.text(`Generated: ${genDate}  |  ${filterText}  |  Session: 2025/2026 (First Semester)`, 14, 32);

  // KPI Summary Boxes
  const kpiY = 36;
  const kpiBoxWidth = (pageWidth - 28 - 15) / 4;
  const kpiBoxHeight = 16;

  const kpis = [
    { label: 'Overall Attendance', value: `${summary.overall_attendance_rate}%`, sub: 'All verified records' },
    { label: 'On-Time Present', value: `${summary.present_percentage}%`, sub: 'Marked on-time' },
    { label: 'Late Arrival Rate', value: `${summary.late_percentage}%`, sub: 'Tardy roll-call entries' },
    { label: 'Absenteeism Rate', value: `${summary.absent_percentage}%`, sub: 'Unexcused missed classes' },
  ];

  kpis.forEach((kpi, i) => {
    const x = 14 + i * (kpiBoxWidth + 5);
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(x, kpiY, kpiBoxWidth, kpiBoxHeight, 2, 2, 'FD');

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 116, 139);
    doc.text(kpi.label.toUpperCase(), x + 4, kpiY + 5);

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 58, 138);
    doc.text(kpi.value, x + 4, kpiY + 11);

    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184);
    doc.text(kpi.sub, x + 4, kpiY + 14.5);
  });

  // Table Data Preparation
  const tableRows = courses.map((c, index) => [
    (index + 1).toString(),
    c.course_code,
    c.course_title,
    c.department,
    c.lecturer_name,
    c.enrolled_count.toString(),
    c.classes_held.toString(),
    c.present_count.toString(),
    c.late_count.toString(),
    c.absent_count.toString(),
    `${c.attendance_rate}%`,
    c.attendance_rate >= 75 ? 'Optimal' : 'Low Warning',
  ]);

  // Generate Table using autoTable
  autoTable(doc, {
    startY: 56,
    head: [
      [
        '#',
        'Code',
        'Course Title',
        'Department',
        'Assigned Lecturer',
        'Enrolled',
        'Held',
        'Present',
        'Late',
        'Absent',
        'Rate',
        'Compliance',
      ],
    ],
    body: tableRows,
    theme: 'grid',
    headStyles: {
      fillColor: [30, 58, 138],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'left',
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    styles: {
      fontSize: 7.5,
      cellPadding: 2,
      textColor: [30, 41, 59],
      valign: 'middle',
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 8 },
      1: { fontStyle: 'bold', cellWidth: 18 },
      2: { cellWidth: 46 },
      3: { cellWidth: 36 },
      4: { cellWidth: 36 },
      5: { halign: 'center', cellWidth: 16 },
      6: { halign: 'center', cellWidth: 14 },
      7: { halign: 'center', cellWidth: 15 },
      8: { halign: 'center', cellWidth: 14 },
      9: { halign: 'center', cellWidth: 14 },
      10: { halign: 'right', fontStyle: 'bold', cellWidth: 16 },
      11: { halign: 'center', fontStyle: 'bold', cellWidth: 22 },
    },
    didParseCell: (data) => {
      // Color-code compliance column
      if (data.section === 'body' && data.column.index === 11) {
        if (data.cell.raw === 'Optimal') {
          data.cell.styles.textColor = [16, 185, 129]; // Emerald 600
        } else {
          data.cell.styles.textColor = [225, 29, 72]; // Rose 600
        }
      }
      if (data.section === 'body' && data.column.index === 10) {
        const rateVal = parseFloat(String(data.cell.raw));
        if (rateVal >= 75) {
          data.cell.styles.textColor = [5, 150, 105];
        } else {
          data.cell.styles.textColor = [225, 29, 72];
        }
      }
    },
  });

  // Footer & Sign-off Section
  const finalY = (doc as any).lastAutoTable.finalY + 8;
  const footerY = Math.min(finalY, pageHeight - 32);

  if (footerY + 24 < pageHeight) {
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.4);

    // Left Signature
    doc.line(14, footerY + 16, 75, footerY + 16);
    doc.setFontSize(7);
    doc.setTextColor(71, 85, 105);
    doc.text('HOD / Dean of Academic Affairs', 14, footerY + 20);

    // Right Signature
    doc.line(pageWidth - 75, footerY + 16, pageWidth - 14, footerY + 16);
    doc.text('Institutional Registrar / Stamp & Date', pageWidth - 75, footerY + 20);
  }

  // Bottom Notice
  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184);
  doc.text(
    `Official computer-generated institutional document from EduTrack Cloud. Generated on ${new Date().toUTCString()}.`,
    14,
    pageHeight - 6
  );
  doc.text(
    `Page ${doc.getNumberOfPages()}`,
    pageWidth - 24,
    pageHeight - 6
  );

  const cleanFilename = `Institutional_Attendance_Report_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(cleanFilename);
}

/**
 * Generates and triggers download of a professional Course Attendance Register & Report PDF
 */
export function generateCourseAttendanceReportPDF(
  meta: CourseReportMeta,
  students: CourseReportStudent[]
) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Header Blue Bar
  doc.setFillColor(30, 58, 138); // Blue 900
  doc.rect(0, 0, pageWidth, 25, 'F');

  // Accent Gold Stripe
  doc.setFillColor(245, 158, 11);
  doc.rect(0, 25, pageWidth, 1.5, 'F');

  // Header Text
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text(meta.institution.toUpperCase(), 14, 11);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('OFFICIAL COURSE ATTENDANCE REGISTER & EXAM ELIGIBILITY REPORT', 14, 18);

  // Course Details Banner
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(`${meta.course_code}: ${meta.course_title}`, 14, 33);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(
    `Lecturer: ${meta.lecturer_name}  |  Department: ${meta.department}  |  Credit Units: ${meta.credit_unit}`,
    14,
    38
  );
  doc.text(
    `Academic Session: ${meta.session}  |  Semester: ${meta.semester}  |  Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`,
    14,
    43
  );

  // Summary Metrics Bar
  const kpiY = 47;
  const kpiWidth = (pageWidth - 28 - 9) / 4;
  const kpiHeight = 15;

  const kpis = [
    { label: 'Lectures Held', val: meta.total_classes_held.toString(), sub: 'Recorded sessions' },
    { label: 'Avg Attendance', val: `${meta.average_attendance}%`, sub: `Req. ${meta.min_required_percentage}%` },
    { label: 'Eligible for Exam', val: meta.eligible_count.toString(), sub: 'Met threshold' },
    { label: 'Students at Risk', val: meta.at_risk_count.toString(), sub: 'Ineligible warning' },
  ];

  kpis.forEach((kpi, i) => {
    const x = 14 + i * (kpiWidth + 3);
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(x, kpiY, kpiWidth, kpiHeight, 1.5, 1.5, 'FD');

    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 116, 139);
    doc.text(kpi.label.toUpperCase(), x + 3, kpiY + 4.5);

    doc.setFontSize(10.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 58, 138);
    doc.text(kpi.val, x + 3, kpiY + 10);

    doc.setFontSize(6);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184);
    doc.text(kpi.sub, x + 3, kpiY + 13.5);
  });

  // Table Data
  const tableRows = students.map((s, idx) => [
    (idx + 1).toString(),
    s.matric_no,
    s.full_name,
    s.department,
    s.total_recorded.toString(),
    s.present_count.toString(),
    s.late_count.toString(),
    s.absent_count.toString(),
    `${s.percentage}%`,
    s.exam_status,
  ]);

  autoTable(doc, {
    startY: 66,
    head: [['#', 'Matric No', 'Student Name', 'Department', 'Total', 'Present', 'Late', 'Absent', 'Rate', 'Exam Status']],
    body: tableRows,
    theme: 'grid',
    headStyles: {
      fillColor: [30, 58, 138],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'left',
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    styles: {
      fontSize: 7.5,
      cellPadding: 2,
      textColor: [30, 41, 59],
      valign: 'middle',
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 7 },
      1: { fontStyle: 'bold', cellWidth: 24 },
      2: { cellWidth: 38 },
      3: { cellWidth: 34 },
      4: { halign: 'center', cellWidth: 12 },
      5: { halign: 'center', cellWidth: 13 },
      6: { halign: 'center', cellWidth: 12 },
      7: { halign: 'center', cellWidth: 12 },
      8: { halign: 'right', fontStyle: 'bold', cellWidth: 14 },
      9: { halign: 'center', fontStyle: 'bold', cellWidth: 16 },
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 9) {
        if (data.cell.raw === 'Eligible') {
          data.cell.styles.textColor = [16, 185, 129]; // Emerald 600
        } else if (data.cell.raw === 'Warning') {
          data.cell.styles.textColor = [217, 119, 6]; // Amber 600
        } else {
          data.cell.styles.textColor = [225, 29, 72]; // Rose 600
        }
      }
      if (data.section === 'body' && data.column.index === 8) {
        const pct = parseFloat(String(data.cell.raw));
        if (pct >= meta.min_required_percentage) {
          data.cell.styles.textColor = [5, 150, 105];
        } else {
          data.cell.styles.textColor = [225, 29, 72];
        }
      }
    },
  });

  const finalY = (doc as any).lastAutoTable.finalY + 8;
  const footerY = Math.min(finalY, pageHeight - 30);

  if (footerY + 20 < pageHeight) {
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.4);

    doc.line(14, footerY + 14, 65, footerY + 14);
    doc.setFontSize(7);
    doc.setTextColor(71, 85, 105);
    doc.text('Course Lecturer Signature & Date', 14, footerY + 18);

    doc.line(pageWidth - 65, footerY + 14, pageWidth - 14, footerY + 14);
    doc.text('Head of Department Stamp & Approval', pageWidth - 65, footerY + 18);
  }

  // Page Numbers & Verification Notice
  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184);
  doc.text(
    `Official computer-generated course attendance report from EduTrack Cloud. Minimum examination eligibility threshold: ${meta.min_required_percentage}%.`,
    14,
    pageHeight - 6
  );
  doc.text(`Page ${doc.getNumberOfPages()}`, pageWidth - 20, pageHeight - 6);

  const cleanFilename = `${meta.course_code}_Attendance_Report_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(cleanFilename);
}

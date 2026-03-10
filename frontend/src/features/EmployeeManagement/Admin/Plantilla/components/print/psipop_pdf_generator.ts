import jsPDF from 'jspdf';
import autoTable, { UserOptions, RowInput } from 'jspdf-autotable';
import { Position } from '@/api/plantillaApi';

export interface PSIPOPConfig {
  departmentGocc?: string;
  bureauAgency?: string;
  preparedBy?: string;
  preparedByTitle?: string;
  approvedBy?: string;
  approvedByTitle?: string;
  fiscalYear?: string;
}

// Extend jsPDF type to include lastAutoTable
interface jsPDFWithAutoTable extends jsPDF {
  lastAutoTable: {
    finalY: number;
  };
}

export const generatePSIPOPPDF = (positions: Position[], config: PSIPOPConfig = {}) => {
  try {
    const doc = new jsPDF({ orientation: 'landscape', format: 'legal' }) as jsPDFWithAutoTable;
    const departmentName = config.departmentGocc || 'All Departments';

    // Header
    doc.setFontSize(10);
    doc.text('CSC Form No. 1', 14, 10);
    doc.setFontSize(8);
    doc.text('(Revised 2018)', 14, 14);

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Republic of the Philippines', 178, 15, { align: 'center' });
    doc.text('Civil Service Commission', 178, 20, { align: 'center' });
    doc.setFontSize(14);
    doc.text('PLANTILLA OF PERSONNEL', 178, 26, { align: 'center' });
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`for the Fiscal Year ${new Date().getFullYear()}`, 178, 32, { align: 'center' });

    // Agency Info Box
    doc.setLineWidth(0.5);
    doc.rect(14, 38, 330, 15);
    doc.line(178, 38, 178, 53);
    
    doc.setFontSize(9);
    doc.text(`(1) Department/GOCC: ${departmentName}`, 16, 48);
    doc.text(`(2) Bureau/Agency/Subsidiary: ${config.bureauAgency || 'LGU Ligao'}`, 180, 48);

    // Table
    const tableHead: RowInput[] = [
        [
            { content: 'ITEM\nNo.', rowSpan: 2 },
            { content: 'Position Title', rowSpan: 2 },
            { content: 'SG', rowSpan: 2 },
            { content: 'Annual Salary', colSpan: 2, styles: { halign: 'center' } },
            { content: 'S\nT\nE\nP', rowSpan: 2 },
            { content: 'Area', colSpan: 3, styles: { halign: 'center' } },
            { content: 'Name of Incumbents', colSpan: 3, styles: { halign: 'center' } },
            { content: 'Date of Birth\n(mm/dd/yyyy)', rowSpan: 2 },
            { content: 'Date of\nOriginal\nAppointment', rowSpan: 2 },
            { content: 'Date of Last\nPromotion', rowSpan: 2 },
            { content: 'S\nT\nA\nT\nU\nS', rowSpan: 2 }
        ],
        [
            'Authorized', 'Actual',
            'Code', 'Type', 'Lvl',
            'Last Name', 'First Name', 'Mid Name'
        ]
    ];

    const tableBody: RowInput[] = positions.map(pos => {
        const annualSalary = pos.monthlySalary ? (Number(pos.monthlySalary) * 12) : 0;
        const actualSalary = pos.isVacant ? 0 : annualSalary;
        
        let lastName = '', firstName = '', middleName = '';
        if (pos.incumbent_name) {
            const nameParts = pos.incumbent_name.split(',').map(s => s.trim());
            if (nameParts.length > 0) lastName = nameParts[0];
            if (nameParts.length > 1) {
                const firstParts = nameParts[1].split(' ');
                firstName = firstParts[0]; 
                if (firstParts.length > 1) middleName = firstParts.slice(1).join(' ');
            }
        }

        const formatDate = (d?: string) => d ? new Date(d).toLocaleDateString() : '';

        return [
            pos.itemNumber || '',
            pos.positionTitle || '',
            String(pos.salaryGrade || ''),
            annualSalary > 0 ? annualSalary.toLocaleString('en-PH', { minimumFractionDigits: 2 }) : '-',
            actualSalary > 0 ? actualSalary.toLocaleString('en-PH', { minimumFractionDigits: 2 }) : '-',
            String(pos.stepIncrement || ''),
            pos.area_code || '',
            pos.area_type || '',
            pos.area_level || '',
            lastName,
            firstName,
            middleName,
            formatDate(pos.birthDate),
            formatDate(pos.original_appointment_date),
            formatDate(pos.last_promotion_date),
            pos.isVacant ? 'Vacant' : (pos.status || 'Filled').substring(0, 1)
        ];
    });

    autoTable(doc, {
      head: tableHead,
      body: tableBody,
      startY: 55,
      theme: 'grid',
      styles: { fontSize: 7, cellPadding: 1, valign: 'middle' },
      headStyles: { fillColor: [220, 220, 220], textColor: 20, lineColor: 10, lineWidth: 0.1, halign: 'center' },
      columnStyles: {
          0: { cellWidth: 15, fontStyle: 'bold', halign: 'center' }, // Item No
          1: { cellWidth: 35 }, // Title
          2: { cellWidth: 8, halign: 'center' }, // SG
          3: { cellWidth: 20, halign: 'right' }, // Auth
          4: { cellWidth: 20, halign: 'right' }, // Actual
          5: { cellWidth: 8, halign: 'center' }, // Step
          6: { cellWidth: 10 }, // Code
          7: { cellWidth: 10 }, // Type
          8: { cellWidth: 10 }, // Lvl
          // Names
          9: { cellWidth: 25 },
          10: { cellWidth: 25 },
          11: { cellWidth: 25 }, 
          // Dates
          12: { cellWidth: 18, halign: 'center' },
          13: { cellWidth: 18, halign: 'center' },
          14: { cellWidth: 18, halign: 'center' },
          15: { cellWidth: 12, halign: 'center' } // Status
      },
      didParseCell: (data) => {
          if (data.section === 'body' && data.column.index === 15) {
               if (data.cell.raw === 'Vacant') {
                   data.cell.styles.fillColor = [255, 255, 153];
               }
          }
      }
    });

    // Footer
    const finalY = doc.lastAutoTable.finalY + 10;
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text(`(19) Total Number of Position Items:  ${positions.length}`, 14, finalY);

    doc.setFont('helvetica', 'normal');
    const certText = "I certify to the correctness of the entries and that above Position Items are duly approved and authorized by the agency and in compliance to existing rules and regulations. I further certify that employees whose names appears above are the incumbents of the position:";
    const splitCert = doc.splitTextToSize(certText, 330);
    doc.text(splitCert, 14, finalY + 10);

    // Signatures
    const sigY = finalY + 30;
    
    // Left
    doc.text('Prepared by:', 14, sigY);
    doc.line(14, sigY + 15, 80, sigY + 15);
    doc.setFont('helvetica', 'bold');
    doc.text(config.preparedBy || 'HR Officer', 47, sigY + 14, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.text(config.preparedByTitle || 'HRMO', 47, sigY + 19, { align: 'center' });
    doc.line(14, sigY + 28, 50, sigY + 28);
    doc.text('Date', 20, sigY + 32);

    // Right
    doc.text('APPROVED BY:', 250, sigY);
    doc.line(250, sigY + 15, 320, sigY + 15);
    doc.setFont('helvetica', 'bold');
    doc.text(config.approvedBy || 'City Mayor', 285, sigY + 14, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.text(config.approvedByTitle || 'City Mayor', 285, sigY + 19, { align: 'center' });
    doc.line(250, sigY + 28, 290, sigY + 28);
    doc.text('Date', 260, sigY + 32);

    doc.save(`PSIPOP_${new Date().toISOString().split('T')[0]}.pdf`);
  } catch (error) {
    console.error('Failed to generate PSIPOP PDF:', error);
    throw error;
  }
};

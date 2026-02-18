
import jsPDF from 'jspdf';
import autoTable, { RowInput } from 'jspdf-autotable';
import { Form9Data } from '@/schemas/compliance';

// Extend jsPDF type to include lastAutoTable
interface jsPDFWithAutoTable extends jsPDF {
  lastAutoTable: {
    finalY: number;
  };
}

export const generateForm9PDF = (data: Form9Data) => {
  try {
    const doc = new jsPDF({ orientation: 'landscape', format: 'legal' }) as jsPDFWithAutoTable;

    // Header (fixed indices from previous view_file were slightly off in my mind, re-applying correctly)
    doc.setFontSize(10);
    doc.text('Republic of the Philippines', 14, 10);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(data.header.agencyName || 'AGENCY NAME', 14, 16);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Request for Publication of Vacant Positions', 14, 22);

    doc.text(`To: CIVIL SERVICE COMMISSION (CSC)`, 14, 32);
    doc.setFontSize(9);
    const introText = `We hereby request the publication in the CSC Job Portal of the following vacant positions, which are authorized to be filled at the ${data.header.agencyName}:`;
    const splitIntro = doc.splitTextToSize(introText, 250);
    doc.text(splitIntro, 14, 38);

    // Signatory (Right aligned roughly)
    const dateStr = `Date: ${data.header.date}`;
    doc.text(data.header.signatoryName, 280, 25, { align: 'right' });
    doc.text(data.header.signatoryTitle, 280, 29, { align: 'right' });
    doc.text(dateStr, 280, 33, { align: 'right' });

    // Table
    const head: RowInput[] = [
        [
            { content: 'No.', rowSpan: 2 },
            { content: 'Position Title', rowSpan: 2 },
            { content: 'Plantilla Item No.', rowSpan: 2 },
            { content: 'SG', rowSpan: 2 },
            { content: 'Monthly Salary', rowSpan: 2 },
            { content: 'Qualification Standards', colSpan: 5, styles: { halign: 'center' } },
            { content: 'Place of Assignment', rowSpan: 2 }
        ],
        ['Education', 'Training', 'Experience', 'Eligibility', 'Competency']
    ];

    const body: RowInput[] = data.positions.map(pos => [
        String(pos.no),
        pos.positionTitle,
        pos.plantillaItemNo,
        pos.salaryGrade,
        pos.monthlySalary,
        pos.education,
        pos.training,
        pos.experience,
        pos.eligibility,
        pos.competency,
        pos.placeOfAssignment
    ]);

    autoTable(doc, {
        head: head,
        body: body,
        startY: 45,
        theme: 'grid',
        styles: { fontSize: 7, cellPadding: 1 },
        headStyles: { fillColor: [220, 220, 220], textColor: 20, lineColor: 10, lineWidth: 0.1 },
        columnStyles: {
            0: { cellWidth: 10 },
            1: { cellWidth: 40 },
            2: { cellWidth: 20 },
            3: { cellWidth: 10 },
            4: { cellWidth: 20 },
            // QS
            5: { cellWidth: 35 }, // Edu
            6: { cellWidth: 25 }, // Train
            7: { cellWidth: 25 }, // Exp
            8: { cellWidth: 35 }, // Elig
            9: { cellWidth: 25 }, // Comp
            10: { cellWidth: 30 } // Place
        }
    });

    // Footer / Requirements
    const finalY = doc.lastAutoTable.finalY + 10;
    
    doc.setFontSize(8);
    doc.text(`Interested and qualified applicants should signify their interest in writing. Attach the following documents to the application letter and send to the address below not later than ${data.header.deadlineDate}.`, 14, finalY);

    doc.text("1. Fully accomplished Personal Data Sheet (PDS) with Work Experience Sheet (CS Form No. 212, Revised 2017);", 14, finalY + 5);
    doc.text("2. Performance rating in the last rating period (if applicable);", 14, finalY + 9);
    doc.text("3. Photocopy of certificate of eligibility/rating/license; and", 14, finalY + 13);
    doc.text("4. Photocopy of Transcript of Records.", 14, finalY + 17);

    doc.text("QUALIFIED APPLICANTS are advised to hand in or send through courier/email their application to:", 14, finalY + 25);

    doc.setFont('helvetica', 'bold');
    doc.text(data.header.signatoryName, 20, finalY + 32);
    doc.setFont('helvetica', 'normal');
    doc.text(data.header.signatoryTitle, 20, finalY + 36);
    doc.text(data.header.officeAddress, 20, finalY + 40);
    doc.text(data.header.contactInfo, 20, finalY + 44);

    doc.setFont('helvetica', 'bold');
    doc.text("APPLICATIONS WITH INCOMPLETE DOCUMENTS SHALL NOT BE ENTERTAINED.", 14, finalY + 52, { align: 'left' });

    doc.save(`CSForm9_Publication_${new Date().toISOString().split('T')[0]}.pdf`);
  } catch (error) {
    console.error('Failed to generate Form 9 PDF:', error);
    throw error;
  }
};

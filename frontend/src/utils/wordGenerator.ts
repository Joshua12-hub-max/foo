import { Document, Packer, Paragraph, Table, TableCell, TableRow, TextRun, AlignmentType, WidthType, BorderStyle, HeadingLevel, ImageRun } from 'docx';
import { saveAs } from 'file-saver';
import { Job } from '@/types';

export const generateJobVacancyWord = async (job: Job) => {
  // Helper for employment status check
  const isJobOrder = job.employmentType?.toLowerCase().includes('job order');
  const isContract = job.employmentType?.toLowerCase().includes('contract') || job.employmentType?.toLowerCase().includes('service');

  // Styles for the document
  const tableHeaderStyle = {
    bold: true,
    size: 24, // 12pt
    font: "Times New Roman"
  };

  const tableCellStyle = {
    size: 24, // 12pt
    font: "Times New Roman"
  };

  const borderStyle = {
    style: BorderStyle.SINGLE,
    size: 1,
    color: "000000",
  };

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          // Header Section (using text approximation for simplicity/reliability without image assets for now)
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
                new TextRun({ text: "Republic of the Philippines", size: 20, italics: true, font: "Times New Roman" }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
                new TextRun({ text: "CITY GOVERNMENT OF MEYCAUAYAN", size: 28, bold: true, font: "Times New Roman" }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
                new TextRun({ text: "MacArthur Highway, Saluysoy, City of Meycauayan, Bulacan", size: 20, font: "Times New Roman" }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
                 new TextRun({ text: "044-919-8020 local 501", size: 20, font: "Times New Roman" }),
            ],
          }),
          new Paragraph({
             alignment: AlignmentType.CENTER,
             children: [
                 new TextRun({ text: "email: chrmomeyc.jobs@gmail.com", size: 20, underline: {}, color: "0000FF", font: "Times New Roman" }),
             ],
             spacing: { after: 300 }
           }),

           // Office Header
           new Paragraph({
               alignment: AlignmentType.CENTER,
               children: [
                   new TextRun({ text: "OFFICE OF THE CITY HUMAN RESOURCE MANAGEMENT OFFICER", size: 24, bold: true, font: "Times New Roman" })
               ],
               border: {
                   top: borderStyle,
                   bottom: borderStyle
               },
               spacing: { after: 200 }
           }),
           
           new Paragraph({
               alignment: AlignmentType.CENTER,
               children: [
                   new TextRun({ text: "JOB VACANCIES ANNOUNCEMENT", size: 28, bold: true, underline: { type: "single" }, font: "Times New Roman" })
               ],
               spacing: { after: 300 }
           }),


          // Job Details Table
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: "POSITION TITLE", ...tableHeaderStyle })] })],
                    shading: { fill: "E0E0E0" },
                    width: { size: 25, type: WidthType.PERCENTAGE },
                  }),
                  new TableCell({
                    columnSpan: 3,
                    children: [new Paragraph({ children: [new TextRun({ text: (job.title || "").toUpperCase(), ...tableCellStyle, bold: true })] })],
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: "OFFICE", ...tableHeaderStyle })] })],
                    shading: { fill: "E0E0E0" },
                  }),
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: (job.department || "").toUpperCase(), ...tableCellStyle })] })],
                  }),
                ],
              }),
               new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: "EMPLOYMENT STATUS", ...tableHeaderStyle })] })],
                    shading: { fill: "E0E0E0" },
                  }),
                  new TableCell({
                    columnSpan: 3,
                    children: [new Paragraph({ children: [new TextRun({ text: `${isJobOrder ? '[/] ' : '[ ] '}Job Order      ${isContract ? '[/] ' : '[ ] '}Contract of Service`, ...tableCellStyle })] })],
                  }),
                ],
              }),
               new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: "WORK LOCATION", ...tableHeaderStyle })] })],
                    shading: { fill: "E0E0E0" },
                  }),
                  new TableCell({
                    columnSpan: 3,
                    children: [new Paragraph({ children: [new TextRun({ text: (job.location || "").toUpperCase(), ...tableCellStyle })] })],
                  }),
                ],
              }),
            ],
          }),

          new Paragraph({ text: "", spacing: { after: 200 } }), // Spacer

           // Qualification Requirements Table


           new Paragraph({ text: "", spacing: { after: 200 } }), // Spacer

           // Job Description
           new Table({
               width: { size: 100, type: WidthType.PERCENTAGE },
               rows: [
                   new TableRow({
                       children: [
                           new TableCell({
                               width: { size: 100, type: WidthType.PERCENTAGE },
                               children: [
                                   new Paragraph({ 
                                       alignment: AlignmentType.CENTER,
                                       children: [new TextRun({ text: "JOB DESCRIPTION", ...tableHeaderStyle })],
                                       shading: { fill: "E0E0E0" },
                                       border: { bottom: borderStyle }
                                   }),
                                   new Paragraph({
                                       children: [new TextRun({ text: job.jobDescription || "", ...tableCellStyle })],
                                       spacing: { before: 100, after: 100 }
                                   })
                               ]
                           })
                       ]
                   })
               ]
           }),

           new Paragraph({ text: "", spacing: { after: 200 } }), // Spacer

           // Detailed Requirements box
           new Table({
               width: { size: 100, type: WidthType.PERCENTAGE },
               rows: [
                   new TableRow({
                       children: [
                           new TableCell({
                               width: { size: 100, type: WidthType.PERCENTAGE },
                               children: [
                                   new Paragraph({ 
                                       alignment: AlignmentType.CENTER,
                                       children: [new TextRun({ text: "REQUIREMENTS", ...tableHeaderStyle, underline: {} })],
                                       spacing: { after: 200 }
                                   }),
                                   new Paragraph({
                                       children: [new TextRun({ text: job.requirements || "Requirements not specified.", ...tableCellStyle })],
                                       spacing: { before: 100, after: 100 }
                                   })
                               ]
                           })
                       ]
                   })
               ]
           }),

           new Paragraph({ text: "", spacing: { after: 400 } }), // Spacer

           // Footer
           new Paragraph({
               alignment: AlignmentType.CENTER,
               children: [new TextRun({ text: "Submit your application and complete requirements to the:", size: 24, font: "Times New Roman" })]
           }),
           new Paragraph({
               alignment: AlignmentType.CENTER,
               children: [new TextRun({ text: "OFFICE OF THE CITY HUMAN RESOURCE MANAGEMENT OFFICER", size: 24, bold: true, font: "Times New Roman" })]
           }),
           new Paragraph({
               alignment: AlignmentType.CENTER,
               children: [new TextRun({ text: "City Government of Meycauayan", size: 24, bold: true, font: "Times New Roman" })]
           }),
           new Paragraph({
               alignment: AlignmentType.CENTER,
               children: [new TextRun({ text: "5th Floor, New Meycauayan City Hall, McArthur Highway,", size: 24, bold: true, font: "Times New Roman" })]
           }),
           new Paragraph({
               alignment: AlignmentType.CENTER,
               children: [new TextRun({ text: "Saluysoy, City of Meycauayan, Bulacan", size: 24, bold: true, font: "Times New Roman" })],
               spacing: { after: 200 }
           }),
           
           new Paragraph({
               alignment: AlignmentType.CENTER,
               children: [
                   new TextRun({ text: "or email at ", size: 24, font: "Times New Roman" }),
                   new TextRun({ text: job.applicationEmail, size: 24, bold: true, underline: {}, color: "0000FF", font: "Times New Roman" }),
                   new TextRun({ text: " with the subject line : [POSITION APPLIED - APPLICANT'S NAME]", size: 24, font: "Times New Roman" })
               ],
               spacing: { after: 200 }
           }),

           new Paragraph({
               alignment: AlignmentType.CENTER,
               children: [new TextRun({ text: "APPLICATIONS WITH INCOMPLETE DOCUMENTS SHALL NOT BE ENTERTAINED.", size: 24, bold: true, font: "Times New Roman" })],
               spacing: { after: 200 }
           }),

           new Paragraph({
               alignment: AlignmentType.CENTER,
               children: [new TextRun({ text: "For inquiries, contact 044-919-8020 local 501 and look for [Recruitment Staff/FSB Secretariat/HRMPSB Secretariat].", size: 24, font: "Times New Roman" })],
               spacing: { after: 200 }
           }),

            new Paragraph({
               alignment: AlignmentType.CENTER,
               children: [new TextRun({ text: "Deadline for Submission: ____________________________", size: 24, bold: true, font: "Times New Roman" })],
               spacing: { after: 400 }
           }),

           new Paragraph({
               alignment: AlignmentType.CENTER,
               children: [new TextRun({ text: "This Office upholds equal opportunity employment and highly encourages qualified women, persons with disabilities (PWDs), members of indigenous groups and other marginalized sectors to apply.", size: 20, font: "Times New Roman" })],
               spacing: { after: 200 }
           }),

            new Paragraph({
               alignment: AlignmentType.CENTER,
               children: [new TextRun({ text: "WE LOOK FORWARD TO YOUR APPLICATION!", size: 24, bold: true, font: "Times New Roman" })],
               spacing: { after: 200 }
           }),

           // Controlled Copy Footer
            new Paragraph({
               alignment: AlignmentType.JUSTIFIED,
               children: [new TextRun({ text: "This document is a Controlled Copy issued by the City Government of Meycauayan to the particular recipient. Any and all reproduction thereof without the necessary authority and security mark or seal shall be considered UNCONTROLLED COPIES. The Document Control Procedure of the City Government of Meycauayan shall apply. If you come into possession of this document by mistake or accident, kindly return the same. Any unauthorized or illegal use hereof shall be punishable by the Revised Penal Code and other applicable laws of the Philippines.", size: 16, italics: true, color: "808080", font: "Times New Roman" })],
               border: { top: borderStyle, bottom: borderStyle, left: borderStyle, right: borderStyle },
               indent: { left: 100, right: 100 },
               spacing: { before: 200 }
           }),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `Job_Vacancy_${job.title.replace(/\s+/g, '_')}.docx`);
};

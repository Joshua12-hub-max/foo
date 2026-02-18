import 'jspdf';

/**
 * Type augmentation for jsPDF to include jspdf-autotable plugin properties.
 * The `lastAutoTable` property is added by the jspdf-autotable plugin after
 * calling `autoTable()`.
 */
declare module 'jspdf' {
  interface jsPDF {
    lastAutoTable: {
      finalY: number;
    };
  }
}

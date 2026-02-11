import { Position } from '@/api/plantillaApi';

export const generateCSCCompliantReport = (positions: Position[], departmentName: string = 'All Departments') => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr;
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        const yyyy = d.getFullYear();
        return `${mm}/${dd}/${yyyy}`;
    } catch {
        return dateStr;
    }
  };

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Plantilla of Personnel - ${departmentName}</title>
      <style>
        @media print {
          @page { size: landscape; margin: 0.5cm; }
          body { -webkit-print-color-adjust: exact; }
        }
        body {
          font-family: 'Times New Roman', serif;
          font-size: 8pt;
          margin: 0;
        }
        .header {
          text-align: center;
          margin-bottom: 20px;
        }
        .header h1, .header h2, .header h3 {
          margin: 2px 0;
          font-weight: bold;
        }
        .header h1 { font-size: 14pt; }
        .header h2 { font-size: 11pt; }
        .header h3 { font-size: 9pt; }
        
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
          table-layout: fixed;
        }
        th, td {
          border: 1px solid #000;
          padding: 3px;
          vertical-align: middle;
          overflow: hidden;
          text-overflow: ellipsis;
          word-wrap: break-word;
        }
        th {
          background-color: #e0e0e0;
          text-align: center;
          font-weight: bold;
          font-size: 7.5pt;
        }
        td {
          font-size: 8pt;
        }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .text-left { text-align: left; }
        .text-bold { font-weight: bold; }
        .vacant { background-color: #FFFF99 !important; -webkit-print-color-adjust: exact; }

        /* Column Widths */
        .col-item { width: 5%; }
        .col-title { width: 14%; }
        .col-sg { width: 3%; }
        .col-salary { width: 7%; }
        .col-step { width: 3%; }
        .col-area { width: 4%; }
        .col-name { width: 8%; } 
        .col-date { width: 6%; }
        .col-status { width: 4%; }
        
        .footer {
          margin-top: 40px;
          display: flex;
          justify-content: space-between;
          page-break-inside: avoid;
        }
        .signature-group {
            text-align: center;
            width: 30%;
        }
        .signature-line {
            border-bottom: 1px solid #000;
            width: 100%;
            margin-bottom: 5px;
            font-weight: bold;
        }
      </style>
    </head>
    <body>
      <div style="font-size: 8pt; font-style: italic;">CSC Form No. 1<br>(Revised 2018)</div>
      <div class="header">
        <h3>Republic of the Philippines</h3>
        <h3>Civil Service Commission</h3>
        <h1>Plantilla of Personnel</h1>
        <h3>for the Fiscal Year ${new Date().getFullYear()}</h3>
      </div>

      <div style="display: flex; border: 1px solid black; border-bottom: none; font-size: 9pt;">
        <div style="flex: 1; padding: 5px; border-right: 1px solid black;">
          <strong>(1) Department/GOCC:</strong> ${departmentName}
        </div>
        <div style="flex: 1; padding: 5px;">
          <strong>(2) Bureau/Agency/Subsidiary:</strong> LGU Ligao
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th rowspan="2" class="col-item">ITEM<br>No.</th>
            <th rowspan="2" class="col-title">Position Title</th>
            <th rowspan="2" class="col-sg">SG</th>
            <th colspan="2" class="col-salary">Annual Salary</th>
            <th rowspan="2" class="col-step">S<br>T<br>E<br>P</th>
            <th colspan="3" class="col-area">Area</th>
            <th colspan="3" class="col-name">Name of Incumbents</th>
            <th rowspan="2" class="col-date">Date of Birth<br>(mm/dd/yyyy)</th>
            <th rowspan="2" class="col-date">Date of<br>Original<br>Appointment<br>(mm/dd/yyyy)</th>
            <th rowspan="2" class="col-date">Date of Last<br>Promotion<br>(mm/dd/yyyy)</th>
            <th rowspan="2" class="col-status">S<br>T<br>A<br>T<br>U<br>S</th>
          </tr>
          <tr>
            <th class="col-salary">Authorized</th>
            <th class="col-salary">Actual</th>
            <th class="col-area">C<br>O<br>D<br>E</th>
            <th class="col-area">T<br>Y<br>P<br>E</th>
            <th class="col-area">L<br>E<br>V<br>E<br>L</th>
            <th class="col-name">Last Name</th>
            <th class="col-name">First Name</th>
            <th class="col-name">Middle Name</th>
          </tr>
          <tr style="height: 15px;">
             <th>(3)</th>
             <th>(4)</th>
             <th>(5)</th>
             <th>(6)</th>
             <th>(7)</th>
             <th>(8)</th>
             <th>(9)</th>
             <th>(10)</th>
             <th>(11)</th>
             <th>(12)</th>
             <th>(13)</th>
             <th>(14)</th>
             <th>(15)</th>
             <th>(16)</th>
             <th>(17)</th>
             <th>(18)</th>
          </tr>
        </thead>
        <tbody>
          ${positions.map(pos => {
             // Logic: If vacant, actual salary is empty/null. 
             const monthly = parseFloat(String(pos.monthly_salary || 0));
             const annualSalary = monthly * 12;
             const actualSalary = pos.is_vacant ? 0 : annualSalary;
             
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

             // Status Logic: V for Vacant, P for Permanent/Filled, or specific status code
             let statusDisplay = '';
             if (pos.is_vacant) {
                 statusDisplay = 'V';
             } else {
                 statusDisplay = pos.status === 'Active' ? 'P' : (pos.status?.substring(0, 2).toUpperCase() || 'P');
             }

             const vacantClass = pos.is_vacant ? 'vacant' : '';

             return `
            <tr class="${vacantClass}">
              <td class="text-center text-bold">${pos.item_number || ''}</td>
              <td class="text-left">${pos.position_title || ''}</td>
              <td class="text-center">${pos.salary_grade || ''}</td>
              <td class="text-right">${annualSalary > 0 ? annualSalary.toLocaleString('en-PH', { minimumFractionDigits: 2 }) : '-'}</td>
              <td class="text-right">${actualSalary > 0 ? actualSalary.toLocaleString('en-PH', { minimumFractionDigits: 2 }) : '-'}</td>
              <td class="text-center">${pos.step_increment || ''}</td>
              <td class="text-center">${pos.area_code || ''}</td>
              <td class="text-center">${pos.area_type || ''}</td>
              <td class="text-center">${pos.area_level || ''}</td>
              
              <td class="text-left">${lastName}</td>
              <td class="text-left">${firstName}</td>
              <td class="text-left">${middleName}</td>
              
              <td class="text-center">${formatDate(pos.birth_date)}</td>
              <td class="text-center">${formatDate(pos.original_appointment_date)}</td>
              <td class="text-center">${formatDate(pos.last_promotion_date)}</td>
              
              <td class="text-center text-bold">${statusDisplay}</td>
            </tr>
          `}).join('')}
        </tbody>
      </table>

      <div class="footer">
        <div style="width: 100%;">
            <p style="margin-bottom: 20px;"><strong>(19) Total Number of Position Items:</strong> <u>&nbsp; ${positions.length} &nbsp;</u></p>
            
            <p style="margin-bottom: 40px; text-align: justify;">I certify to the correctness of the entries and that above Position Items are duly approved and authorized by the agency and in compliance to existing rules and regulations. I further certify that employees whose names appears above are the incumbents of the position:</p>

            <div style="display: flex; justify-content: space-between; align-items: flex-end;">
                <div class="signature-group">
                    <p style="text-align: left; font-size: 8pt;">Prepared by:</p>
                    <br><br>
                    <div class="signature-line"></div>
                    <p>Human Resource Management Officer</p>
                    <div style="margin-top: 10px; border-top: 1px solid black; width: 50%; margin-left: auto; margin-right: auto;"></div>
                    <p>Date</p>
                </div>
                
                <div class="signature-group">
                    <p style="margin-bottom: 30px; font-weight: bold;">APPROVED BY:</p>
                    <div class="signature-line">MAXIMILLIAN O. SZE</div>
                    <p>City Mayor</p>
                    <div style="margin-top: 10px; border-top: 1px solid black; width: 50%; margin-left: auto; margin-right: auto;"></div>
                    <p>Date</p>
                </div>
            </div>
        </div>
      </div>
      
      <script>
        setTimeout(function() { window.print(); }, 500);
      </script>
    </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
};

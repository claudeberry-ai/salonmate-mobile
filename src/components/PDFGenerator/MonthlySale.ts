import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { printToFileAsync } from 'expo-print';

export const generateSalesReportPDF = async (
  salesData: any[],
  month: number,
  year: number,
  salonName: string
) => {
  try {
    // Helper function to get month name
    const getMonthName = (month: number) => {
      const months = [
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'July',
        'August',
        'September',
        'October',
        'November',
        'December',
      ];
      return months[month - 1];
    };

    // Calculate totals for the report
    const totalSales = salesData.length;
    const totalRevenue = salesData.reduce((sum, sale) => sum + sale.netAmount, 0);
    const totalServices = salesData.reduce((sum, sale) => {
      // Count services by splitting the servicesWithStaff string
      return sum + (sale.servicesWithStaff ? sale.servicesWithStaff.split(',').length : 0);
    }, 0);

    // HTML content for PDF
    const html = `
      <html>
        <head>
          <style>
            @page {
              margin-top: 15mm;
              margin-right: 10mm;
              margin-bottom: 15mm;
              margin-left: 10mm;
            }
            body { 
              font-family: 'Helvetica Neue', Arial, sans-serif; 
              margin: 0; 
              padding: 0;
              color: #333;
              line-height: 1.5;
            }
            .header { 
              text-align: center; 
              margin-bottom: 20px;
              padding-bottom: 15px;
              border-bottom: 2px solid #4f46e5;
            }
            .footer { 
              text-align: center; 
              margin-top: 30px;
              padding-top: 15px;
              border-top: 1px solid #e5e7eb;
              font-size: 11px;
              color: #6b7280;
            }
            .title { 
              font-size: 22px; 
              font-weight: bold; 
              color: #4f46e5; 
              margin-bottom: 5px; 
            }
            .subtitle { 
              font-size: 16px; 
              color: #6b7280; 
              margin-bottom: 5px;
            }
            .report-period {
              font-size: 14px;
              color: #6b7280;
              margin-bottom: 20px;
            }
            .summary-cards {
              display: flex;
              justify-content: space-between;
              margin-bottom: 25px;
              gap: 15px;
            }
            .summary-card {
              flex: 1;
              background-color: #f8fafc;
              border-radius: 8px;
              padding: 15px;
              text-align: center;
              box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            }
            .summary-title {
              font-size: 14px;
              color: #64748b;
              margin-bottom: 5px;
            }
            .summary-value {
              font-size: 20px;
              font-weight: bold;
              color: #4f46e5;
            }
            .section-title {
              font-size: 18px;
              font-weight: bold;
              color: #4f46e5;
              margin: 25px 0 15px 0;
              padding-bottom: 5px;
              border-bottom: 1px solid #e5e7eb;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
              font-size: 14px;
            }
            th {
              background-color: #f1f5f9;
              text-align: left;
              padding: 10px 12px;
              font-weight: 600;
              color: #4f46e5;
              border-bottom: 2px solid #e5e7eb;
            }
            td {
              padding: 10px 12px;
              border-bottom: 1px solid #e5e7eb;
              vertical-align: top;
            }
            tr:last-child td {
              border-bottom: none;
            }
            .sale-id {
              font-weight: 600;
              color: #1e293b;
            }
            .sale-date {
              color: #000000;
              white-space: nowrap;
            }
            .sale-amount {
              font-weight: 600;
              color: #000000;
              text-align: center;
            }
            .staff-name {
              color: #000000;
              font-size: 13px;
            }
            .bill-name {
              font-weight: 600;
            }
            .no-bill-name {
              color: #505a68;
              font-style: italic;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">${salonName}</div>
            <div class="subtitle">Sales Report</div>
            <div class="report-period">${getMonthName(month)} ${year}</div>
          </div>
          
          <div class="summary-cards">
            <div class="summary-card">
              <div class="summary-title">Total Sales</div>
              <div class="summary-value">${totalSales}</div>
            </div>
            <div class="summary-card">
              <div class="summary-title">Total Revenue</div>
              <div class="summary-value">₹${totalRevenue.toLocaleString()}</div>
            </div>
            <div class="summary-card">
              <div class="summary-title">Services Provided</div>
              <div class="summary-value">${totalServices}</div>
            </div>
          </div>
          
          <div class="section-title">Sales Details</div>
          <table>
            <thead>
              <tr>
                <th>Sale #</th>
                <th>Date</th>
                <th>Customer</th>
                <th>Services (Staff)</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              ${salesData
                .map(
                  (sale) => `
                <tr>
                  <td class="sale-id">${sale.saleNum}</td>
                  <td class="sale-date">${sale.saleDate}</td>
                  <td>
                    ${
                      sale.billName
                        ? `<span class="bill-name">${sale.billName}</span>`
                        : `<span class="no-bill-name">Walk-in</span>`
                    }
                    <div class="staff-name">Entered by: ${sale.enteredBy}</div>
                  </td>
                  <td>${sale.servicesWithStaff.replace(/, /g, '<br>')}</td>
                  <td class="sale-amount">₹${sale.netAmount}</td>
                </tr>
              `
                )
                .join('')}
            </tbody>
          </table>
          
          <div class="footer">
            Report generated on ${new Date().toLocaleDateString('en-IN')} | Salonmate
          </div>
        </body>
      </html>
    `;

    // Generate and share PDF
    const { uri } = await printToFileAsync({
      html,
      width: 794, // A4 width in pixels (210mm)
      height: 1123, // A4 height in pixels (297mm)
    });

    const newUri = `${FileSystem.cacheDirectory}revenue_report_${getMonthName(month)}_${year}.pdf`;

    await FileSystem.moveAsync({
      from: uri,
      to: newUri,
    });

    await Sharing.shareAsync(newUri, {
      mimeType: 'application/pdf',
      dialogTitle: `Revenue Report - ${getMonthName(month)} ${year}`,
    });

    return newUri;
  } catch (error) {
    console.error('Error generating sales PDF:', error);
    throw error;
  }
};

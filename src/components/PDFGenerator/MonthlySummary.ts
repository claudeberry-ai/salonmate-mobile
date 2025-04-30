import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { printToFileAsync } from 'expo-print';
// import { ReportData } from './types'; // Your existing types

export const generateMonthlyReportPDF = async (
  reportData: any,
  month: number,
  year: number,
  salonName: string,
  LineChartUri: string,
  PieChartUri: string
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

    // Calculate percentage changes
    const calculateChange = (current: number, previous: number) => {
      const amount = current - previous;
      const percentage = previous !== 0 ? (amount / previous) * 100 : 0;
      return {
        amount,
        percentage,
        isPositive: amount >= 0,
      };
    };

    const revenueChange = calculateChange(reportData.revenue.current, reportData.revenue.previous);
    const expenseChange = calculateChange(reportData.expense.current, reportData.expense.previous);
    const servicesChange = calculateChange(
      reportData.services.current,
      reportData.services.previous
    );
    const netCurrent = reportData.revenue.current - reportData.expense.current;
    const netPrevious = reportData.revenue.previous - reportData.expense.previous;
    const netChange = calculateChange(netCurrent, netPrevious);

    // HTML content for PDF
    const html = `
      <html>
        <head>
          <style>
            @page {
              margin-top: 20mm;
              margin-right: 15mm;
              margin-bottom: 20mm;
              margin-left: 15mm;
            }
            body { 
              font-family: Arial, sans-serif; 
              margin: 0; 
              padding: 0;
              color: #333;
            }
            .header { 
              text-align: center; 
              margin-bottom: 20px;
              padding-bottom: 15px;
              border-bottom: 2px solid #10B981;
            }
            .footer { 
              text-align: center; 
              margin-top: 20px;
              padding-top: 15px;
              border-top: 1px solid #ddd;
              font-size: 12px;
              color: #666;
            }
            .title { 
              font-size: 24px; 
              font-weight: bold; 
              color: #10B981; 
              margin-bottom: 5px; 
            }
            .subtitle { 
              font-size: 16px; 
              color: #666; 
              margin-bottom: 10px;
            }
            .report-period {
              font-size: 14px;
              color: #666;
              margin-bottom: 20px;
            }
            .section { 
              margin-bottom: 25px;
              page-break-inside: avoid;
            }
            .section-title { 
              font-size: 18px; 
              font-weight: bold; 
              color: #10B981; 
              margin-bottom: 15px;
              padding-bottom: 5px;
              border-bottom: 1px solid #e0e0e0;
            }
            .metric-card {
              background-color: #f8faf9;
              border-radius: 8px;
              padding: 15px;
              margin-bottom: 15px;
              border-left: 4px solid #10B981;
            }
            .metric-title {
              font-size: 14px;
              color: #666;
              margin-bottom: 5px;
            }
            .metric-value {
              font-size: 22px;
              font-weight: bold;
              color: #10B981;
              margin-bottom: 5px;
            }
            .metric-change {
              font-size: 12px;
              display: flex;
              align-items: center;
            }
            .positive {
              color: #10B981;
            }
            .negative {
              color: #EF4444;
            }
            .chart-container {
              margin: 20px 0;
              height: 250px;
              background-color: #f9f9f9;
              border-radius: 8px;
              display: flex;
              justify-content: center;
              align-items: center;
              color: #666;
              font-style: italic;
            }
            .two-column {
              display: flex;
              gap: 20px;
            }
            .column {
              flex: 1;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 15px;
            }
            th {
              background-color: #e8f5e9;
              text-align: left;
              padding: 10px;
              font-weight: bold;
              color: #2e7d32;
            }
            td {
              padding: 10px;
              border-bottom: 1px solid #e0e0e0;
            }
            .progress-bar {
              height: 8px;
              background-color: #e0e0e0;
              border-radius: 4px;
              margin-top: 5px;
              overflow: hidden;
            }
            .progress {
              height: 100%;
              background-color: #10B981;
              border-radius: 4px;
            }
            .category-item {
              display: flex;
              justify-content: space-between;
              margin-bottom: 10px;
              padding-bottom: 10px;
              border-bottom: 1px dashed #e0e0e0;
            }
            .category-name {
              font-weight: bold;
              margin-right: 10px;
            }
            .category-value {
              color: #10B981;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">${salonName}</div>
            <div class="subtitle">Monthly Performance Report</div>
            <div class="report-period">${getMonthName(month)} ${year}</div>
          </div>
          
          <div class="section">
            <div class="section-title">Key Metrics</div>
            
            <div class="two-column">
              <div class="column">
                <div class="metric-card">
                  <div class="metric-title">Revenue</div>
                  <div class="metric-value">₹${reportData.revenue.current.toLocaleString()}</div>
                  <div class="metric-change ${revenueChange.isPositive ? 'positive' : 'negative'}">
                    ${revenueChange.isPositive ? '▲' : '▼'} 
                    ₹${Math.abs(revenueChange.amount).toLocaleString()} 
                    (${Math.abs(revenueChange.percentage).toFixed(1)}%)
                  </div>
                </div>
                
                <div class="metric-card">
                  <div class="metric-title">Services</div>
                  <div class="metric-value">${reportData.services.current.toLocaleString()}</div>
                  <div class="metric-change ${servicesChange.isPositive ? 'positive' : 'negative'}">
                    ${servicesChange.isPositive ? '▲' : '▼'} 
                    ${Math.abs(servicesChange.amount).toLocaleString()} 
                    (${Math.abs(servicesChange.percentage).toFixed(1)}%)
                  </div>
                </div>
              </div>
              
              <div class="column">
                <div class="metric-card">
                  <div class="metric-title">Expenses</div>
                  <div class="metric-value">₹${reportData.expense.current.toLocaleString()}</div>
                  <div class="metric-change ${expenseChange.isPositive ? 'negative' : 'positive'}">
                    ${expenseChange.isPositive ? '▲' : '▼'} 
                    ₹${Math.abs(expenseChange.amount).toLocaleString()} 
                    (${Math.abs(expenseChange.percentage).toFixed(1)}%)
                  </div>
                </div>
                
                <div class="metric-card">
                  <div class="metric-title">Net Profit</div>
                  <div class="metric-value">₹${netCurrent.toLocaleString()}</div>
                  <div class="metric-change ${netChange.isPositive ? 'positive' : 'negative'}">
                    ${netChange.isPositive ? '▲' : '▼'} 
                    ₹${Math.abs(netChange.amount).toLocaleString()} 
                    (${Math.abs(netChange.percentage).toFixed(1)}%)
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div class="section">
            <div class="section-title">Revenue Trend</div>
            <div class="chart-container">
${LineChartUri ? `<img src="${LineChartUri}" style="width: 100%; max-width: 400px ;max-height: 230px;" />` : ''}            </div>
          </div>
          
          <div class="two-column">
            <div class="column">
              <div class="section">
                <div class="section-title">Expense Breakdown</div>
                <div class="chart-container">
                ${PieChartUri ? `<img src="${PieChartUri}" style="width: 100%; max-width: 400px;max-height: 230px;" />` : ''}            </div>

                </div>
                <table>
                  <thead>
                    <tr>
                      <th>Category</th>
                      <th>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${reportData.expense.categories
                      .map(
                        (cat: { name: any; amount: { toLocaleString: () => any } }) => `
                      <tr>
                        <td>${cat.name}</td>
                        <td>₹${cat.amount.toLocaleString()}</td>
                      </tr>
                    `
                      )
                      .join('')}
                  </tbody>
                </table>
              </div>
            </div>
            
            <div class="column">
              <div class="section">
                <div class="section-title">Popular Services</div>
                <table>
                  <thead>
                    <tr>
                      <th>Service</th>
                      <th>Count</th>
                      <th>%</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${reportData.services.popularServices
                      .map(
                        (service: { name: any; count: number }) => `
                      <tr>
                        <td>${service.name}</td>
                        <td>${service.count}</td>
                        <td>
                          <div>${((service.count / reportData.services.current) * 100).toFixed(1)}%</div>
                          <div class="progress-bar">
                            <div class="progress" style="width: ${(service.count / reportData.services.current) * 100}%"></div>
                          </div>
                        </td>
                      </tr>
                    `
                      )
                      .join('')}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          
          <div class="section">
            <div class="section-title">Customer Categories</div>
            <div class="two-column">
              ${reportData.customerCategories
                .map(
                  (category: { category: any; total: any }) => `
                <div class="category-item">
                  <span class="category-name">${category.category}</span>
                  <span class="category-value">${category.total}</span>
                </div>
              `
                )
                .join('')}
            </div>
          </div>
          
          <div class="footer">
            Report generated on ${new Date().toLocaleDateString()} | Salonmate
          </div>
        </body>
      </html>
    `;

    // Generate and share PDF
    const { uri } = await printToFileAsync({ html });

    const newUri = `${FileSystem.cacheDirectory}monthly_report_${getMonthName(month)}_${year}.pdf`;

    await FileSystem.moveAsync({
      from: uri,
      to: newUri,
    });

    await Sharing.shareAsync(newUri, {
      mimeType: 'application/pdf',
      dialogTitle: 'Monthly Report',
    });

    return newUri;
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};

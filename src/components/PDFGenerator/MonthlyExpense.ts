import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { printToFileAsync } from 'expo-print';

type CategoryBreakdown = {
  [category: string]: number;
};

// Color mapping for different categories
const getCategoryColor = (category: string) => {
  const colors: Record<string, string> = {
    'Purchase': '#3B82F6',    // Blue
    'Staff Salary': '#ba7815', // Red
    'Other': '#387963',   
  };
  return colors[category] || '#64748B'; // Default gray
};

export const generateExpenseReportPDF = async (
  expenseData: any[],
  month: number,
  year: number,
  salonName: string
) => {
  try {
    const getMonthName = (month: number) => {
      const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      return months[month - 1];
    };

    const totalExpenses = expenseData.reduce((sum, expense) => sum + expense.expenseAmount, 0);
    const totalTransactions = expenseData.length;

    const categoryBreakdown: CategoryBreakdown = expenseData.reduce(
      (acc: CategoryBreakdown, expense) => {
        if (!acc[expense.Category]) {
          acc[expense.Category] = 0;
        }
        acc[expense.Category] += expense.expenseAmount;
        return acc;
      },
      {} as CategoryBreakdown
    );

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
              border-bottom: 2px solid #ef4444;
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
              color: #ef4444; 
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
              background-color: #fef2f2;
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
              color: #ef4444;
            }
            .section-title {
              font-size: 18px;
              font-weight: bold;
              color: #ef4444;
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
              background-color: #fee2e2;
              text-align: left;
              padding: 10px 12px;
              font-weight: 600;
              color: #dc2626;
              border-bottom: 2px solid #e5e7eb;
            }
            td {
              padding: 10px 12px;
              border-bottom: 1px solid #e5e7eb;
              vertical-align: top;
              color: #000000; /* Black text for all cells */
            }
            tr:last-child td {
              border-bottom: none;
            }
            .sl-no {
              text-align: center;
              color: #64748b;
            }
            .expense-date {
              white-space: nowrap;
            }
            .expense-amount {
              font-weight: 600;
              color: #ef4444;
              text-align: center;
            }
            .entered-by {
              font-size: 13px;
            }
            .category-text {
              font-weight: 500;
            }
            .category-item {
              display: flex;
              justify-content: space-between;
              margin-bottom: 8px;
              padding-bottom: 8px;
              border-bottom: 1px dashed #e5e7eb;
            }
            .category-name {
              font-weight: 600;
            }
            .category-value {
              font-weight: 600;
              color: #ef4444;
            }
            .progress-bar {
              height: 6px;
              background-color: #e5e7eb;
              border-radius: 3px;
              margin-top: 5px;
              overflow: hidden;
            }
            .progress {
              height: 100%;
              background-color: #ef4444;
              border-radius: 3px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">${salonName}</div>
            <div class="subtitle">Expense Report</div>
            <div class="report-period">${getMonthName(month)} ${year}</div>
          </div>
          
          <div class="summary-cards">
            <div class="summary-card">
              <div class="summary-title">Total Expenses</div>
              <div class="summary-value">₹${totalExpenses.toLocaleString()}</div>
            </div>
            <div class="summary-card">
              <div class="summary-title">Transactions</div>
              <div class="summary-value">${totalTransactions}</div>
            </div>
          </div>
          
          <div class="section-title">Expense Breakdown by Category</div>
          <div>
            ${Object.entries(categoryBreakdown)
              .map(
                ([category, amount]) => `
              <div class="category-item">
                <span class="category-name">${category}</span>
                <span class="category-value">₹${amount.toLocaleString()}</span>
              </div>
              <div class="progress-bar">
                <div class="progress" style="width: ${(amount / totalExpenses) * 100}%"></div>
              </div>
            `
              )
              .join('')}
          </div>
          
          <div class="section-title">Expense Details</div>
          <table>
            <thead>
              <tr>
                <th>Sl No</th>
                <th>Date</th>
                <th>Category</th>
                <th>Entered By</th>
                <th>Description</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              ${expenseData
                .map(
                  (expense, index) => `
                <tr>
                  <td class="sl-no">${index + 1}</td>
                  <td class="expense-date">${expense.expenseDate}</td>
                  <td class="category-text" style="color: ${getCategoryColor(expense.Category)}">
                    ${expense.Category}
                  </td>
                  <td class="entered-by">${expense.enteredBy}</td>
                  <td>${expense.expenseDesc || '-'}</td>
                  <td class="expense-amount">₹${expense.expenseAmount}</td>
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

    const { uri } = await printToFileAsync({
      html,
      width: 794,
      height: 1123,
    });

    const newUri = `${FileSystem.cacheDirectory}expense_report_${getMonthName(month)}_${year}.pdf`;

    await FileSystem.moveAsync({
      from: uri,
      to: newUri,
    });

    await Sharing.shareAsync(newUri, {
      mimeType: 'application/pdf',
      dialogTitle: `Expense Report - ${getMonthName(month)} ${year}`,
    });

    return newUri;
  } catch (error) {
    console.error('Error generating expense PDF:', error);
    throw error;
  }
};
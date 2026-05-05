/**
 * Export utility functions for generating reports
 */

/**
 * Export data to CSV format
 */
export function exportToCSV(data: any[], filename: string): void {
  if (data.length === 0) {
    console.warn('No data to export');
    return;
  }

  // Get headers from first object
  const headers = Object.keys(data[0]);
  
  // Create CSV content
  const csvContent = [
    headers.join(','),
    ...data.map(row =>
      headers.map(header => {
        const value = row[header];
        // Escape values that contain commas
        if (typeof value === 'string' && value.includes(',')) {
          return `"${value}"`;
        }
        return value;
      }).join(',')
    ),
  ].join('\n');

  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Export data to JSON format
 */
export function exportToJSON(data: any, filename: string): void {
  const jsonContent = JSON.stringify(data, null, 2);
  
  const blob = new Blob([jsonContent], { type: 'application/json' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.json`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Print current page
 */
export function printPage(): void {
  window.print();
}

/**
 * Format data for applicants report
 */
export function formatApplicantsReport(applications: any[]) {
  return applications.map(app => ({
    'Applicant Name': app.applicantName,
    'Score': app.score,
    'Academic Level': app.academicLevel,
    'Years of Service': app.yearsOfService,
    'Job Responsibility': app.jobResponsibility,
    'Marital Status': app.maritalStatus,
    'Application Date': app.applicationDate,
    'Status': app.status,
  }));
}

/**
 * Format data for residents report
 */
export function formatResidentsReport(residents: any[]) {
  return residents.map(res => ({
    'Resident Name': res.residentName,
    'Block': res.blockName,
    'House Number': res.houseNumber,
    'Move-in Date': res.moveInDate,
    'Status': res.residenceStatus,
  }));
}

/**
 * Format data for payments report
 */
export function formatPaymentsReport(payments: any[]) {
  return payments.map(pay => ({
    'Resident Name': pay.residentName,
    'Month': pay.month,
    'Amount (Birr)': pay.amount,
    'Payment Date': pay.paymentDate,
    'Status': pay.paymentStatus,
  }));
}

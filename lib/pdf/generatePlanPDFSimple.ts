import PDFDocument from 'pdfkit';
import { Readable } from 'stream';

interface PlanData {
  salary: string;
  city: string;
  startDate: string;
  debtMonthly?: string;
  takeHomeMonthly: number;
  takeHomeAnnual: number;
  rentRange: string;
  rentRangeLow: number;
  rentRangeHigh: number;
  daysUntilStart: number;
  upfrontCashLow?: number;
  upfrontCashHigh?: number;
  budgetBreakdown?: {
    needs: number;
    wants: number;
    savings: number;
  };
  taxBreakdown?: {
    grossAnnual: number;
    federalTaxAnnual: number;
    stateTaxAnnual: number;
    ficaTaxAnnual: number;
    totalTaxAnnual: number;
    netIncomeAnnual: number;
  };
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(dateString: string): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

/**
 * Generate PDF using pdfkit (works in Next.js API routes)
 */
export async function generatePlanPDFBuffer(planData: PlanData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    let doc: PDFKit.PDFDocument;
    
    try {
      doc = new PDFDocument({
        size: 'A4',
        margins: { top: 40, bottom: 40, left: 40, right: 40 },
        font: 'Times-Roman', // Explicitly set default font to avoid Helvetica
      });
    } catch (initError) {
      console.error('[PDF Generation] PDFDocument initialization error:', initError);
      reject(new Error('Failed to initialize PDF document: ' + (initError instanceof Error ? initError.message : String(initError))));
      return;
    }

    const buffers: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => buffers.push(chunk));
    doc.on('end', () => {
      const pdfBuffer = Buffer.concat(buffers);
      resolve(pdfBuffer);
    });
    doc.on('error', (error: Error) => {
      console.error('[PDF Generation] PDFDocument error event:', error);
      reject(error);
    });

    try {
      // Explicitly set the default font to Times-Roman to avoid Helvetica
      doc.font('Times-Roman');

      // Header - use built-in fonts that don't require external files
      doc.fontSize(24).font('Times-Bold').text('Your Personal Rent Plan', { align: 'left' });
      doc.moveDown(0.5);
      doc.fontSize(12).font('Times-Roman').fillColor('#6b7280').text(`Generated on ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`);
      doc.moveDown(2);

      // Take-Home Pay
      doc.fontSize(16).font('Times-Bold').fillColor('#111827').text('Your Real Monthly Take-Home');
      doc.moveDown(0.5);
      doc.fontSize(20).font('Times-Bold').fillColor('#111827').text(formatCurrency(planData.takeHomeMonthly));
      doc.fontSize(11).font('Times-Roman').fillColor('#6b7280').text(`${formatCurrency(planData.takeHomeAnnual)} annually`);
      doc.moveDown(1);
      
      // Tax Breakdown Section
      if (planData.taxBreakdown) {
        doc.fontSize(12).font('Times-Bold').fillColor('#111827').text('Gross to Take-Home Breakdown');
        doc.moveDown(0.5);
        
        // Gross income
        doc.fontSize(11).font('Times-Roman').fillColor('#111827').text(`Gross annual income: ${formatCurrency(planData.taxBreakdown.grossAnnual)}`, { indent: 5 });
        doc.moveDown(0.3);
        
        // Deductions
        doc.fontSize(10).font('Times-Roman').fillColor('#6b7280').text(`Federal tax: -${formatCurrency(planData.taxBreakdown.federalTaxAnnual)}`, { indent: 5 });
        doc.moveDown(0.3);
        doc.fontSize(10).font('Times-Roman').fillColor('#6b7280').text(`State tax: -${formatCurrency(planData.taxBreakdown.stateTaxAnnual)}`, { indent: 5 });
        doc.moveDown(0.3);
        doc.fontSize(10).font('Times-Roman').fillColor('#6b7280').text(`FICA (Social Security + Medicare): -${formatCurrency(planData.taxBreakdown.ficaTaxAnnual)}`, { indent: 5 });
        doc.moveDown(0.3);
        
        // Total taxes
        doc.fontSize(10).font('Times-Bold').fillColor('#111827').text(`Total taxes: -${formatCurrency(planData.taxBreakdown.totalTaxAnnual)}`, { indent: 5 });
        doc.moveDown(0.5);
        
        // Net income
        doc.fontSize(11).font('Times-Bold').fillColor('#111827').text(`Take-home (annual): ${formatCurrency(planData.taxBreakdown.netIncomeAnnual)}`, { indent: 5 });
      } else {
        // Fallback if tax breakdown not available
        doc.fontSize(11).font('Times-Roman').fillColor('#6b7280').text(`Gross annual income: ${formatCurrency(parseFloat(planData.salary))}`);
      }
      doc.moveDown(2);

      // Safe Rent Range
      doc.fontSize(16).font('Times-Bold').fillColor('#111827').text('Safe Rent Range');
      doc.moveDown(0.5);
      doc.fontSize(18).font('Times-Bold').fillColor('#111827').text(planData.rentRange);
      doc.fontSize(10).font('Times-Roman').fillColor('#6b7280').text('Based on your take-home pay and early-career flexibility.');
      const debtText = planData.debtMonthly ? ` (adjusted for $${planData.debtMonthly}/mo debt)` : '';
      doc.fontSize(10).font('Times-Roman').fillColor('#6b7280').text(`Calculated as 28–35% of take-home pay${debtText}.`);
      doc.moveDown(2);

      // Upfront Cash Needed
      if (planData.upfrontCashLow && planData.upfrontCashHigh) {
        doc.fontSize(16).font('Times-Bold').fillColor('#111827').text('Upfront Cash Needed Before Your First Paycheck');
        doc.moveDown(0.5);
        doc.fontSize(18).font('Times-Bold').fillColor('#111827').text(`${formatCurrency(planData.upfrontCashLow)}–${formatCurrency(planData.upfrontCashHigh)}`);
        doc.fontSize(10).font('Times-Roman').fillColor('#6b7280').text('Estimate based on start date and typical move-in timing.');
        doc.moveDown(0.5);
        doc.fontSize(11).font('Times-Roman').fillColor('#6b7280').text(`Security deposit (1× rent): ${formatCurrency(planData.rentRangeLow)}–${formatCurrency(planData.rentRangeHigh)}`);
        doc.fontSize(11).font('Times-Roman').fillColor('#6b7280').text(`First month's rent: ${formatCurrency(planData.rentRangeLow)}–${formatCurrency(planData.rentRangeHigh)}`);
        const gapLivingCosts = (planData.takeHomeMonthly * 0.35) * (14 / 30);
        doc.fontSize(11).font('Times-Roman').fillColor('#6b7280').text(`Gap living costs (14 days): ${formatCurrency(gapLivingCosts)}`);
        doc.fontSize(11).font('Times-Roman').fillColor('#6b7280').text(`Moving/setup costs: ${formatCurrency(600)}`);
        doc.moveDown(2);
      }

      // Budget Breakdown
      if (planData.budgetBreakdown) {
        doc.fontSize(16).font('Times-Bold').fillColor('#111827').text('Suggested Monthly Breakdown');
        doc.moveDown(0.5);
        doc.fontSize(11).font('Times-Roman').fillColor('#6b7280').text(`Needs (50%): ${formatCurrency(planData.budgetBreakdown.needs)}`);
        doc.fontSize(11).font('Times-Roman').fillColor('#6b7280').text(`Wants (30%): ${formatCurrency(planData.budgetBreakdown.wants)}`);
        doc.fontSize(11).font('Times-Roman').fillColor('#6b7280').text(`Savings (20%): ${formatCurrency(planData.budgetBreakdown.savings)}`);
        doc.moveDown(2);
      }

      // Job Details
      doc.fontSize(16).font('Times-Bold').fillColor('#111827').text('Job Details');
      doc.moveDown(0.5);
      doc.fontSize(11).font('Times-Roman').fillColor('#6b7280').text(`City: ${planData.city}`);
      const formattedStartDate = formatDate(planData.startDate);
      if (formattedStartDate) {
        doc.fontSize(11).font('Times-Roman').fillColor('#6b7280').text(`Start date: ${formattedStartDate}`);
      }
      doc.fontSize(11).font('Times-Roman').fillColor('#6b7280').text(`Days until start: ${planData.daysUntilStart} ${planData.daysUntilStart === 1 ? 'day' : 'days'}`);
      doc.moveDown(3);

      // Footer
      doc.fontSize(9).font('Times-Roman').fillColor('#6b7280').text('This is an educational estimate — not financial advice.', { align: 'center' });
      doc.fontSize(9).font('Times-Roman').fillColor('#6b7280').text('Generated by WeLeap • weleap.ai', { align: 'center' });

      // End the document to trigger the 'end' event
      doc.end();
    } catch (error) {
      console.error('[PDF Generation] Error during PDF content generation:', error);
      console.error('[PDF Generation] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      reject(error instanceof Error ? error : new Error('Unknown error in PDF generation'));
    }
  });
}

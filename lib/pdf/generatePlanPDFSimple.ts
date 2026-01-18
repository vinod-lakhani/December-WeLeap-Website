import PDFDocument from 'pdfkit';
import { Readable } from 'stream';
import path from 'path';
import fs from 'fs';

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
 * Generate Day 1 Playbook PDF using pdfkit
 */
export async function generatePlanPDFBuffer(planData: PlanData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    let doc: PDFKit.PDFDocument;
    
    try {
      doc = new PDFDocument({
        size: 'LETTER', // US Letter 8.5x11
        margins: { top: 40, bottom: 40, left: 50, right: 50 },
        font: 'Times-Roman',
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
      doc.font('Times-Roman');
      const pageWidth = doc.page.width - 100; // Account for margins
      const generatedDate = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
      
      // ========== HEADER ==========
      // Left: WeLeap logo image
      try {
        const logoPath = path.join(process.cwd(), 'public', 'images', 'weleap-logo.png');
        if (fs.existsSync(logoPath)) {
          // Size logo appropriately for header (bigger)
          doc.image(logoPath, 50, 45, { width: 50, height: 50, fit: [50, 50] });
        }
      } catch (logoError) {
        // Fallback to text if logo not found
        doc.fontSize(10).font('Times-Roman').fillColor('#6b7280').text('WeLeap', 50, 50);
      }
      
      // Center: Title
      doc.fontSize(20).font('Times-Bold').fillColor('#111827').text('Your Day 1 Playbook', { align: 'center', y: 48 });
      doc.fontSize(8).font('Times-Roman').fillColor('#6b7280').text('Built from your salary, rent, and start date', { align: 'center', y: 66 });
      
      // Meta (right side)
      const metaX = pageWidth + 50 - 120;
      doc.fontSize(8).font('Times-Roman').fillColor('#6b7280').text(`Generated: ${generatedDate}`, metaX, 50, { width: 120, align: 'right' });
      doc.fontSize(8).font('Times-Roman').fillColor('#6b7280').text(`Location: ${planData.city}`, metaX, 62, { width: 120, align: 'right' });
      
      let yPos = 85;
      
      // ========== SECTION A: YOUR REAL MONTHLY TAKE-HOME ==========
      doc.fontSize(14).font('Times-Bold').fillColor('#111827').text('Your Real Monthly Take-Home', 50, yPos);
      yPos += 18;
      
      // BIG NUMBER (largest on page)
      doc.fontSize(30).font('Times-Bold').fillColor('#111827').text(formatCurrency(planData.takeHomeMonthly), 50, yPos);
      yPos += 35;
      
      // Supporting line
      doc.fontSize(9).font('Times-Roman').fillColor('#6b7280').text('That\'s what actually lands in your account after taxes.', 50, yPos);
      yPos += 18;
      
      // 3 MINI CARDS (side by side)
      if (planData.taxBreakdown) {
        const cardWidth = (pageWidth - 40) / 3;
        const cardHeight = 50;
        const cardSpacing = 15;
        
        // Card 1: Gross Salary
        doc.rect(50, yPos, cardWidth, cardHeight).stroke('#D1D5DB');
        doc.fontSize(9).font('Times-Roman').fillColor('#6b7280').text('Gross Salary', 55, yPos + 5);
        doc.fontSize(12).font('Times-Bold').fillColor('#111827').text(formatCurrency(planData.taxBreakdown.grossAnnual), 55, yPos + 20);
        doc.fontSize(8).font('Times-Roman').fillColor('#6b7280').text('/ year', 55, yPos + 35);
        
        // Card 2: Estimated Total Taxes
        doc.rect(50 + cardWidth + cardSpacing, yPos, cardWidth, cardHeight).stroke('#D1D5DB');
        doc.fontSize(9).font('Times-Roman').fillColor('#6b7280').text('Estimated Total Taxes', 55 + cardWidth + cardSpacing, yPos + 5);
        doc.fontSize(12).font('Times-Bold').fillColor('#dc2626').text(`-${formatCurrency(planData.taxBreakdown.totalTaxAnnual)}`, 55 + cardWidth + cardSpacing, yPos + 20);
        doc.fontSize(8).font('Times-Roman').fillColor('#6b7280').text('/ year', 55 + cardWidth + cardSpacing, yPos + 35);
        
        // Card 3: Take-Home (Annual)
        doc.rect(50 + (cardWidth + cardSpacing) * 2, yPos, cardWidth, cardHeight).stroke('#D1D5DB');
        doc.fontSize(9).font('Times-Roman').fillColor('#6b7280').text('Take-Home (Annual)', 55 + (cardWidth + cardSpacing) * 2, yPos + 5);
        doc.fontSize(12).font('Times-Bold').fillColor('#111827').text(formatCurrency(planData.takeHomeAnnual), 55 + (cardWidth + cardSpacing) * 2, yPos + 20);
        doc.fontSize(8).font('Times-Roman').fillColor('#6b7280').text('/ year', 55 + (cardWidth + cardSpacing) * 2, yPos + 35);
        
        yPos += cardHeight + 10;
        
        // Tax breakdown details (small, collapsible-style)
        doc.fontSize(7).font('Times-Roman').fillColor('#6b7280').text('How we estimated taxes:', 50, yPos);
        yPos += 10;
        doc.fontSize(6).font('Times-Roman').fillColor('#6b7280').text(`Federal: -${formatCurrency(planData.taxBreakdown.federalTaxAnnual)}`, 60, yPos);
        doc.fontSize(6).font('Times-Roman').fillColor('#6b7280').text(`State: -${formatCurrency(planData.taxBreakdown.stateTaxAnnual)}`, 60 + 130, yPos);
        doc.fontSize(6).font('Times-Roman').fillColor('#6b7280').text(`FICA: -${formatCurrency(planData.taxBreakdown.ficaTaxAnnual)}`, 60 + 260, yPos);
        yPos += 12;
        doc.fontSize(6).font('Times-Italic').fillColor('#9ca3af').text('Estimate only — real withholding varies.', 60, yPos);
        yPos += 18;
      } else {
        // Fallback if no tax breakdown
        doc.fontSize(10).font('Times-Roman').fillColor('#6b7280').text(`Gross annual income: ${formatCurrency(parseFloat(planData.salary))}`, 50, yPos);
        yPos += 20;
      }
      
      // ========== SECTION B: RENT REALITY CHECK ==========
      doc.fontSize(14).font('Times-Bold').fillColor('#111827').text('Rent Reality Check', 50, yPos);
      yPos += 18;
      
      // Calculate rent percentages
      const rentPctLow = Math.round((planData.rentRangeLow / planData.takeHomeMonthly) * 100);
      const rentPctHigh = Math.round((planData.rentRangeHigh / planData.takeHomeMonthly) * 100);
      
      // Left: Highlight Box with rent range
      const highlightBoxWidth = 190;
      const highlightBoxHeight = 60;
      doc.rect(50, yPos, highlightBoxWidth, highlightBoxHeight).fillAndStroke('#f9fafb', '#D1D5DB');
      doc.fontSize(9).font('Times-Roman').fillColor('#6b7280').text('Comfortable Rent Range', 55, yPos + 5);
      doc.fontSize(18).font('Times-Bold').fillColor('#111827').text(`${formatCurrency(planData.rentRangeLow)}–${formatCurrency(planData.rentRangeHigh)}`, 55, yPos + 20);
      doc.fontSize(8).font('Times-Roman').fillColor('#6b7280').text(`~${rentPctLow}–${rentPctHigh}% of take-home`, 55, yPos + 45);
      
      // Right: Micro-visual bar chart
      const barX = 50 + highlightBoxWidth + 30;
      const barY = yPos + 10;
      const barWidth = 250;
      const barHeight = 20;
      
      // Background bar (100%)
      doc.rect(barX, barY, barWidth, barHeight).fillAndStroke('#e5e7eb', '#D1D5DB');
      
      // Rent band (28-35% or calculated range)
      const rentBandStart = (rentPctLow / 100) * barWidth;
      const rentBandWidth = ((rentPctHigh - rentPctLow) / 100) * barWidth;
      doc.rect(barX + rentBandStart, barY, rentBandWidth, barHeight).fill('#3F6B42');
      
      // Labels
      doc.fontSize(8).font('Times-Roman').fillColor('#111827').text('Take-home = 100%', barX, barY - 12);
      doc.fontSize(7).font('Times-Roman').fillColor('#6b7280').text('Rent band: 28–35% of take-home', barX, barY + barHeight + 5);
      doc.fontSize(7).font('Times-Italic').fillColor('#6b7280').text('Keeps housing within an early-career safe band.', barX, barY + barHeight + 15);
      
      yPos += highlightBoxHeight + 8;
      doc.fontSize(8).font('Times-Roman').fillColor('#6b7280').text('If your rent is above this range, you\'ll likely feel tighter on savings and flexibility.', 50, yPos);
      yPos += 20;
      
      // ========== SECTION C: BEFORE FIRST PAYCHECK (HIGHLIGHTED PANEL) ==========
      if (planData.upfrontCashLow && planData.upfrontCashHigh) {
        // Full-width highlighted panel with border
        const panelY = yPos;
        const panelHeight = 110;
        
        doc.rect(50, panelY, pageWidth, panelHeight).fillAndStroke('#fef3c7', '#d97706');
        doc.fontSize(14).font('Times-Bold').fillColor('#111827').text('Cash Needed Before Your First Paycheck', 55, panelY + 8);
        
        // BIG NUMBER
        doc.fontSize(28).font('Times-Bold').fillColor('#111827').text(`${formatCurrency(planData.upfrontCashLow)}–${formatCurrency(planData.upfrontCashHigh)}`, 55, panelY + 28);
        
        // Subhead
        doc.fontSize(8).font('Times-Roman').fillColor('#6b7280').text('This is why the first few weeks can feel tight — even with a good salary.', 55, panelY + 55);
        
        // 2-column breakdown
        const col1X = 55;
        const col2X = 55 + (pageWidth / 2);
        const breakdownY = panelY + 70;
        
        const gapLivingCosts = (planData.takeHomeMonthly * 0.35) * (14 / 30);
        const moveSetupCost = 600;
        
        doc.fontSize(8).font('Times-Roman').fillColor('#6b7280').text(`Security deposit (1× rent): ${formatCurrency(planData.rentRangeLow)}–${formatCurrency(planData.rentRangeHigh)}`, col1X, breakdownY);
        doc.fontSize(8).font('Times-Roman').fillColor('#6b7280').text(`First month's rent: ${formatCurrency(planData.rentRangeLow)}–${formatCurrency(planData.rentRangeHigh)}`, col1X, breakdownY + 12);
        
        doc.fontSize(8).font('Times-Roman').fillColor('#6b7280').text(`Gap living costs (14 days): ${formatCurrency(gapLivingCosts)}`, col2X, breakdownY);
        doc.fontSize(8).font('Times-Roman').fillColor('#6b7280').text(`Moving/setup basics: ${formatCurrency(moveSetupCost)}`, col2X, breakdownY + 12);
        
        // Quick Tip
        doc.fontSize(6).font('Times-Italic').fillColor('#6b7280').text('Tip: Plan this as "startup cash," not a monthly expense.', 55, panelY + panelHeight - 12);
        
        yPos = panelY + panelHeight + 15;
      }
      
      // ========== SECTION D: STARTING STRUCTURE ==========
      if (planData.budgetBreakdown) {
        doc.fontSize(14).font('Times-Bold').fillColor('#111827').text('A Simple Starting Structure (First 90 Days)', 50, yPos);
        yPos += 18;
        
        // 3-column breakdown with bars
        const structColWidth = pageWidth / 3;
        const structBarWidth = structColWidth - 40;
        
        // Needs (50%)
        doc.fontSize(10).font('Times-Bold').fillColor('#111827').text('Needs (baseline):', 50, yPos);
        doc.fontSize(9).font('Times-Roman').fillColor('#6b7280').text('50%', 50, yPos + 12);
        doc.rect(50, yPos + 20, structBarWidth, 12).fill('#ef4444');
        doc.fontSize(11).font('Times-Bold').fillColor('#111827').text(`${formatCurrency(planData.budgetBreakdown.needs)}`, 50, yPos + 37);
        
        // Wants (30%)
        doc.fontSize(10).font('Times-Bold').fillColor('#111827').text('Wants (baseline):', 50 + structColWidth, yPos);
        doc.fontSize(9).font('Times-Roman').fillColor('#6b7280').text('30%', 50 + structColWidth, yPos + 12);
        doc.rect(50 + structColWidth, yPos + 20, structBarWidth * 0.6, 12).fill('#f59e0b');
        doc.fontSize(11).font('Times-Bold').fillColor('#111827').text(`${formatCurrency(planData.budgetBreakdown.wants)}`, 50 + structColWidth, yPos + 37);
        
        // Savings (20%)
        doc.fontSize(10).font('Times-Bold').fillColor('#111827').text('Savings (baseline):', 50 + structColWidth * 2, yPos);
        doc.fontSize(9).font('Times-Roman').fillColor('#6b7280').text('20%', 50 + structColWidth * 2, yPos + 12);
        doc.rect(50 + structColWidth * 2, yPos + 20, structBarWidth * 0.4, 12).fill('#10b981');
        doc.fontSize(11).font('Times-Bold').fillColor('#111827').text(`${formatCurrency(planData.budgetBreakdown.savings)}`, 50 + structColWidth * 2, yPos + 37);
        
        yPos += 55;
        doc.fontSize(7).font('Times-Roman').fillColor('#6b7280').text('This isn\'t a rule — it\'s a baseline to keep you steady while everything is new.', 50, yPos);
        doc.fontSize(6).font('Times-Italic').fillColor('#9ca3af').text('Small, consistent moves beat perfect planning.', 50, yPos + 10);
        yPos += 22;
      }
      
      // ========== SECTION E: YOUR CONTEXT (QUIET) ==========
      // Removed "Your Details" section to create more space
      
      // ========== SECTION F: WELEAP HANDOFF ==========
      doc.fontSize(14).font('Times-Bold').fillColor('#111827').text('What Happens Next (If You Use WeLeap)', 50, yPos);
      yPos += 18;
      
      doc.fontSize(9).font('Times-Roman').fillColor('#374151').text('This playbook is a snapshot. WeLeap turns it into a live feed that helps you stay on track as real life hits.', 50, yPos, { width: pageWidth });
      yPos += 18;
      
      // Bullets
      doc.fontSize(8).font('Times-Roman').fillColor('#374151').text('• Detects key moments (paychecks, rent payments)', 55, yPos);
      yPos += 12;
      doc.fontSize(8).font('Times-Roman').fillColor('#374151').text('• Flags risks early (low balance, spending spikes)', 55, yPos);
      yPos += 12;
      doc.fontSize(8).font('Times-Roman').fillColor('#374151').text('• Surfaces one clear next move at a time ("Leaps")', 55, yPos);
      yPos += 25;
      
      // ========== FOOTER ==========
      // Footer positioned absolutely at the bottom of the page (accounting for bottom margin of 40)
      const pageHeight = doc.page.height;
      const bottomMargin = 40;
      const footerY = pageHeight - bottomMargin - 20; // Position footer 20pt from bottom
      
      doc.fontSize(7).font('Times-Roman').fillColor('#9ca3af').text('Educational estimate — not financial advice. Numbers may vary based on withholding, benefits, and timing.', { 
        align: 'center', 
        y: footerY, 
        width: pageWidth 
      });
      doc.fontSize(7).font('Times-Roman').fillColor('#9ca3af').text('Generated by WeLeap • weleap.ai', { 
        align: 'center', 
        y: footerY + 10 
      });

      // End the document
      doc.end();
    } catch (error) {
      console.error('[PDF Generation] Error during PDF content generation:', error);
      console.error('[PDF Generation] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      reject(error instanceof Error ? error : new Error('Unknown error in PDF generation'));
    }
  });
}

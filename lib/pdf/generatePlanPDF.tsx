import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';

// Define styles for the PDF
const styles = StyleSheet.create({
  page: {
    padding: 40,
    backgroundColor: '#ffffff',
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
    borderBottom: '1px solid #d1d5db',
    paddingBottom: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    fontSize: 11,
  },
  label: {
    color: '#6b7280',
  },
  value: {
    color: '#111827',
    fontWeight: 'bold',
  },
  largeValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  rangeValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  helperText: {
    fontSize: 9,
    color: '#6b7280',
    marginTop: 4,
    marginBottom: 12,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    fontSize: 9,
    color: '#6b7280',
    textAlign: 'center',
    borderTop: '1px solid #d1d5db',
    paddingTop: 8,
  },
});

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
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatCurrencyRange(low: number, high: number): string {
  return `${formatCurrency(low)}–${formatCurrency(high)}`;
}

function formatDate(dateString: string): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

export function PlanPDF({ planData }: { planData: PlanData }) {
  // Guard against null/undefined planData
  if (!planData) {
    throw new Error('planData is required');
  }
  
  const formattedStartDate = formatDate(planData.startDate || '');
  
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Your Personal Rent Plan</Text>
          <Text style={styles.subtitle}>Generated on {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</Text>
        </View>

        {/* Take-Home Pay */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Real Monthly Take-Home</Text>
          <Text style={styles.largeValue}>{formatCurrency(planData.takeHomeMonthly)}</Text>
          <Text style={styles.helperText}>{formatCurrency(planData.takeHomeAnnual)} annually</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Gross annual income:</Text>
            <Text style={styles.value}>{formatCurrency(parseFloat(planData.salary))}</Text>
          </View>
        </View>

        {/* Safe Rent Range */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Safe Rent Range</Text>
          <Text style={styles.rangeValue}>{planData.rentRange}</Text>
          <Text style={styles.helperText}>Based on your take-home pay and early-career flexibility.</Text>
          <Text style={styles.helperText}>Calculated as 28–35% of take-home pay{planData.debtMonthly ? ` (adjusted for $${planData.debtMonthly}/mo debt)` : ''}.</Text>
        </View>

        {/* Upfront Cash Needed */}
        {planData.upfrontCashLow && planData.upfrontCashHigh && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Upfront Cash Needed Before Your First Paycheck</Text>
            <Text style={styles.rangeValue}>{formatCurrencyRange(planData.upfrontCashLow, planData.upfrontCashHigh)}</Text>
            <Text style={styles.helperText}>Estimate based on start date and typical move-in timing.</Text>
            <View style={[styles.row, { marginTop: 8 }]}>
              <Text style={styles.label}>Security deposit (1× rent):</Text>
              <Text style={styles.value}>{formatCurrencyRange(planData.rentRangeLow, planData.rentRangeHigh)}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>First month's rent:</Text>
              <Text style={styles.value}>{formatCurrencyRange(planData.rentRangeLow, planData.rentRangeHigh)}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Gap living costs (14 days):</Text>
              <Text style={styles.value}>{formatCurrency((planData.takeHomeMonthly * 0.35) * (14 / 30))}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Moving/setup costs:</Text>
              <Text style={styles.value}>{formatCurrency(600)}</Text>
            </View>
          </View>
        )}

        {/* Budget Breakdown */}
        {planData.budgetBreakdown && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Suggested Monthly Breakdown</Text>
            <View style={styles.row}>
              <Text style={styles.label}>Needs (50%):</Text>
              <Text style={styles.value}>{formatCurrency(planData.budgetBreakdown.needs)}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Wants (30%):</Text>
              <Text style={styles.value}>{formatCurrency(planData.budgetBreakdown.wants)}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Savings (20%):</Text>
              <Text style={styles.value}>{formatCurrency(planData.budgetBreakdown.savings)}</Text>
            </View>
          </View>
        )}

        {/* Job Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Job Details</Text>
          <View style={styles.row}>
            <Text style={styles.label}>City:</Text>
            <Text style={styles.value}>{planData.city}</Text>
          </View>
          {formattedStartDate && (
            <View style={styles.row}>
              <Text style={styles.label}>Start date:</Text>
              <Text style={styles.value}>{formattedStartDate}</Text>
            </View>
          )}
          {planData.daysUntilStart !== undefined && (
            <View style={styles.row}>
              <Text style={styles.label}>Days until start:</Text>
              <Text style={styles.value}>{planData.daysUntilStart} {planData.daysUntilStart === 1 ? 'day' : 'days'}</Text>
            </View>
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>This is an educational estimate — not financial advice.</Text>
          <Text>Generated by WeLeap • weleap.ai</Text>
        </View>
      </Page>
    </Document>
  );
}

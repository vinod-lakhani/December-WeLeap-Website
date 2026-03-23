/**
 * Credit Card Payoff Calculator
 *
 * Formulas:
 * - Monthly interest = balance × (APR / 100 / 12)
 * - Min payment = max($25, (balance × 0.01) + interest), capped at balance + interest
 * - New balance = balance + interest - payment
 * - Extra payment: avalanche (highest balance first)
 */

const FIXED_MIN = 25;
const MAX_MONTHS = 600;

export interface CreditCard {
  id: string;
  name: string;
  balance: number;
  apr: number;
}

export interface PayoffResult {
  months: number;
  totalPaid: number;
  totalInterest: number;
  debtFreeDate: Date;
  balanceHistory: { month: number; balance: number }[];
}

export interface ScenarioResult {
  months: number;
  totalPaid: number;
  totalInterest: number;
  debtFreeDate: Date;
  balanceHistory: { month: number; totalBalance: number }[];
}

function monthlyInterest(balance: number, apr: number): number {
  return balance * (apr / 100 / 12);
}

function minPayment(balance: number, apr: number): number {
  if (balance <= 0) return 0;
  const interest = monthlyInterest(balance, apr);
  const calculated = Math.max(FIXED_MIN, balance * 0.01 + interest);
  return Math.min(balance + interest, calculated);
}

export function runPayoffScenario(
  cards: CreditCard[],
  extraMonthly: number
): ScenarioResult {
  const validCards = cards.filter((c) => c.balance > 0.01);
  if (validCards.length === 0) {
    const today = new Date();
    return {
      months: 0,
      totalPaid: 0,
      totalInterest: 0,
      debtFreeDate: today,
      balanceHistory: [{ month: 0, totalBalance: 0 }],
    };
  }

  const balances = new Map<string, number>();
  validCards.forEach((c) => balances.set(c.id, c.balance));

  const history: { month: number; totalBalance: number }[] = [];
  let totalPaid = 0;
  let month = 0;

  const getTotalBalance = () =>
    Array.from(balances.values()).reduce((a, b) => a + b, 0);

  // Record initial state
  history.push({ month: 0, totalBalance: getTotalBalance() });

  while (month < MAX_MONTHS) {
    const totalBalance = getTotalBalance();

    if (totalBalance <= 0.01) {
      history.push({ month: month + 1, totalBalance: 0 });
      break;
    }

    let remainingExtra = extraMonthly;
    const payments = new Map<string, number>();

    // Calculate min payment per card
    for (const card of validCards) {
      const bal = balances.get(card.id) ?? 0;
      if (bal <= 0) continue;
      const pay = minPayment(bal, card.apr);
      payments.set(card.id, pay);
    }

    // Apply extra to highest balance (avalanche)
    if (remainingExtra > 0) {
      const sorted = [...validCards].sort(
        (a, b) => (balances.get(b.id) ?? 0) - (balances.get(a.id) ?? 0)
      );
      for (const card of sorted) {
        if (remainingExtra <= 0) break;
        const bal = balances.get(card.id) ?? 0;
        if (bal <= 0) continue;
        const interest = monthlyInterest(bal, card.apr);
        const maxExtra = Math.max(0, bal + interest - (payments.get(card.id) ?? 0));
        const extraToApply = Math.min(remainingExtra, maxExtra);
        if (extraToApply > 0) {
          payments.set(
            card.id,
            (payments.get(card.id) ?? 0) + extraToApply
          );
          remainingExtra -= extraToApply;
        }
      }
    }

    // Apply payments
    for (const card of validCards) {
      const bal = balances.get(card.id) ?? 0;
      if (bal <= 0) continue;
      const interest = monthlyInterest(bal, card.apr);
      const pay = Math.min(bal + interest, payments.get(card.id) ?? 0);
      const newBal = Math.max(0, bal + interest - pay);
      balances.set(card.id, newBal);
      totalPaid += pay;
    }

    month++;
    history.push({ month, totalBalance: getTotalBalance() });
  }

  const originalBalance = validCards.reduce((a, c) => a + c.balance, 0);
  const totalInterest = totalPaid - originalBalance;
  const debtFreeDate = new Date();
  debtFreeDate.setMonth(debtFreeDate.getMonth() + month);

  return {
    months: month,
    totalPaid,
    totalInterest,
    debtFreeDate,
    balanceHistory: history,
  };
}

export function getMinTotalPayment(cards: CreditCard[]): number {
  return cards
    .filter((c) => c.balance > 0)
    .reduce((sum, c) => sum + minPayment(c.balance, c.apr), 0);
}

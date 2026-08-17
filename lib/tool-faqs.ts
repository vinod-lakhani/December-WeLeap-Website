/**
 * Question-and-answer copy for the calculator routes.
 *
 * One registry rather than JSX scattered across seven pages, for one specific
 * reason: `faqSchema` in lib/structured-data.ts reads this exact array, and the
 * page renders this exact array. FAQPage markup that describes questions a
 * visitor cannot see is a manual-action risk, and the only reliable way to stop
 * that happening is to make the schema and the DOM read from the same object.
 *
 * Rules for anything added here:
 *
 *  - The question has to be one people actually ask, phrased the way they ask
 *    it ("how long will it take to pay off my credit card", not "credit card
 *    amortisation explained"). Questions invented to farm schema are worse than
 *    no schema.
 *  - The answer has to stand alone. An answer engine will lift this paragraph
 *    with no page around it, so "as explained above" and "this tool" without an
 *    antecedent both fail.
 *  - Every number has to come from the calculator on that page or from a stated
 *    convention. Figures below that read like results — the 230 months, the
 *    $182,996 — were produced by running this repo's own calculation modules,
 *    not estimated.
 *  - No personalised advice. These describe how a calculation works and what
 *    the convention is; they do not tell a named person what to do.
 */

export interface FaqItem {
  q: string
  a: string
}

export const TOOL_FAQS: Record<string, readonly FaqItem[]> = {
  '/how-much-rent-can-i-afford': [
    {
      q: 'How much rent can I afford on my salary?',
      a: 'A common starting point is the 30% rule: keep rent at or under 30% of income. The version worth using applies it to take-home pay rather than gross salary, because rent is paid out of what lands in your account, not out of what the offer letter says. On a $70,000 salary, gross-based maths allows about $1,750 a month; take-home-based maths usually lands nearer $1,300–$1,450 depending on your state. This calculator does the second one.',
    },
    {
      q: 'Is the 30% rule on gross or net income?',
      a: 'The 30% rule is conventionally quoted on gross income, and that is the version most rent calculators and many landlords use. It is a convention rather than a law or a lender requirement, and it predates the tax and student-loan picture most people under 35 are actually in. Applying 30% to take-home pay is the stricter and more realistic reading, and it is the one this calculator uses.',
    },
    {
      q: 'How much cash do I need upfront to move into an apartment?',
      a: 'Most US leases ask for first month\'s rent plus a security deposit before you get keys, and many ask for last month\'s rent as well. That means the cash you need on day one is typically two to three times the monthly rent, before you have bought a single piece of furniture. This calculator shows that upfront number next to the monthly one, because the monthly figure is the one people can afford and the upfront figure is the one that catches them out.',
    },
    {
      q: 'Should I count my bonus when working out what rent I can afford?',
      a: 'Rent is a fixed monthly obligation and a bonus is not a fixed monthly payment, so sizing rent against a bonus means committing guaranteed money against money that is discretionary for your employer. The usual approach is to size rent against base salary alone and treat any bonus as a separate decision once it actually arrives.',
    },
  ],

  '/offer': [
    {
      q: 'How do I know if a job offer is good?',
      a: 'A good offer has to clear three separate bars, and the number in the letter only speaks to one of them. Is it competitive for that role, level and location — a market-rate question that needs benchmark data from a site collecting reported salaries. Is the whole package bigger or smaller than the headline — base salary is usually only 70% to 90% of what an offer is worth, with the rest in the bonus target, the employer 401(k) match, health and HSA contributions, equity and paid time off. And what does it leave you each month where the job actually is, after that state\'s income tax and that city\'s rent. This calculator answers the second and third questions; it does not benchmark your offer against what other people in the same role are paid.',
    },
    {
      q: 'What is total compensation?',
      a: 'Total compensation is everything an employer gives you for the year, not just the salary line. It normally means base salary plus target bonus, the employer 401(k) match you would receive if you contribute enough to capture it, employer contributions to health cover or an HSA, and the annual vesting value of any equity — minus what you pay for benefits. Paid time off above the market norm has a dollar value too, though it is usually quoted separately. The gap between total compensation and base salary is the part of an offer people most often fail to price and most often fail to negotiate.',
    },
    {
      q: 'How do I work out what a job offer is actually worth?',
      a: 'Base salary is usually somewhere between 70% and 90% of what an offer is worth, so comparing two offers on base alone compares the wrong number. The full package is base salary, bonus target, employer 401(k) match, health and HSA contributions, equity, and paid time off — plus the cost of living where the job is. This calculator takes those seven inputs and turns them into one annual figure and one monthly take-home figure.',
    },
    {
      q: 'How much of my salary will I actually take home?',
      a: 'Take-home pay is your salary minus federal income tax, state income tax, and FICA — Social Security at 6.2% of wages up to an annual cap, plus Medicare at 1.45% with no cap. For most salaries in the $60,000–$150,000 range that lands somewhere between roughly 65% and 78% of gross, with the spread driven mostly by state: nine states levy no tax on wage income at all, while California and New York sit at the other end. This calculator estimates all three components for the state you pick.',
    },
    {
      q: 'Is an employer 401(k) match really worth that much?',
      a: 'A dollar-for-dollar match up to 5% of salary is a 5% raise you only receive if you contribute, and it is an immediate 100% return on the money you put in — nothing else in a normal financial life pays that. On an $80,000 salary a 5% match is $4,000 a year. Contributing below the match cap is the one situation where the money left on the table is unambiguous, which is why this calculator prices the match separately rather than folding it into a total.',
    },
    {
      q: 'How do I compare two job offers in different cities?',
      a: 'Convert both offers to monthly take-home pay in their own state, then subtract a realistic rent for each city — the same job at the same salary leaves very different amounts depending on where it is. A $120,000 offer in a state with no income tax and $1,800 rent leaves substantially more each month than $135,000 in a high-tax state with $3,200 rent. This calculator puts market rent for the city next to the take-home figure so the comparison is made on what is left over, not on the headline.',
    },
    {
      q: 'Should I count equity as part of my salary?',
      a: 'Equity is compensation, but it is not the same kind of compensation as salary: it vests over time, is usually forfeited if you leave early, and in a private company it cannot be sold until an exit that may never happen. The common approach is to value public-company RSUs at their current grant value divided over the vesting schedule, and to treat private-company options as upside rather than income you can spend. This calculator shows equity as a separate line so it never quietly inflates the number you plan your rent against.',
    },
  ],

  '/smart-purchase-check': [
    {
      q: 'Is 0% financing actually free?',
      a: 'A genuine 0% offer costs nothing in interest, so the money question is what the cash it frees up is doing instead. If that cash sits in a checking account, splitting the payment gains you nothing and adds four payment dates you have to not miss. If it is finishing an emergency fund or covering a deposit you need next month, the 0% offer is doing real work. The cost of 0% financing is not interest — it is the late fee and the credit damage if one payment slips.',
    },
    {
      q: 'Should I pay cash or use buy now, pay later?',
      a: 'Pay cash when you can afford the purchase outright and the money would otherwise sit idle, because the simpler option is the one you will not mishandle. Split the payment when the cash it preserves has a specific job in the next few months and the plan is genuinely interest-free. Financing a purchase to earn a few dollars of savings interest is technically correct and practically pointless. This calculator compares cash, pay-in-4, monthly financing and waiting, and will recommend waiting when none of the three funding options fits.',
    },
    {
      q: 'Does buy now, pay later affect your credit score?',
      a: 'It depends on the provider and the plan. Some pay-in-4 providers report nothing to the credit bureaus, some report only missed payments, and longer monthly plans are more likely to be reported as instalment loans and to involve a hard credit check. Because the treatment varies by provider and has been changing, check the specific plan\'s terms rather than assuming — and note that a missed payment is the case that reliably causes damage across all of them.',
    },
    {
      q: 'How do I know if I can afford something?',
      a: 'Affording something is not the same as having the money in your account today. The test that matters is whether the purchase still leaves your essential expenses covered, your existing commitments paid, and whatever you were saving toward still on track. A purchase you can technically cover but that empties the buffer you rely on is a purchase you cannot afford yet — which is why "wait" is a real answer here and not a polite decline.',
    },
  ],

  '/credit-card-payoff': [
    {
      q: 'How long will it take to pay off my credit card?',
      a: 'On minimum payments alone it takes far longer than most people expect. Running $5,000 at 22% APR through this calculator, with the typical minimum of 1% of the balance plus that month\'s interest, gives about 230 months — roughly 19 years — and about $8,100 in interest. Adding $100 a month on top cuts it to about 40 months and around $1,767 in interest. The extra payment, not the balance, is what decides the timeline.',
    },
    {
      q: 'Why does my credit card balance barely go down?',
      a: 'Because a minimum payment is designed to cover that month\'s interest plus about 1% of the balance, so most of what you pay is rent on the debt rather than repayment of it. At 22% APR a $5,000 balance accrues roughly $92 in interest in the first month, and a minimum payment of about $142 puts only $50 against the balance. Anything you pay above the minimum goes entirely to principal, which is why small extra payments have a disproportionate effect.',
    },
    {
      q: 'Is it better to pay off the smallest balance or the highest interest rate first?',
      a: 'Paying the highest APR first — the avalanche method — costs the least in total interest, and is the mathematically optimal order. Paying the smallest balance first — the snowball method — clears individual cards sooner and is easier for many people to stick with. Across typical balances the difference between the two is usually tens or low hundreds of dollars, so the method you actually keep doing beats the one that is optimal on paper. This calculator applies your extra payment to your largest balance first.',
    },
    {
      q: 'Is a balance transfer worth it?',
      a: 'A 0% balance transfer stops interest accruing for the promotional period, typically 12 to 21 months, in exchange for a transfer fee of usually 3% to 5% of the amount moved. It is worth it when you will clear most of the balance inside the promotional window, because the fee is a one-off and the interest you avoid is recurring. It backfires when the balance is still there when the promotional rate ends and the card reverts to a standard APR, or when the cleared card gets used again.',
    },
    {
      q: 'What happens to that money once the card is paid off?',
      a: 'The payment does not disappear — it becomes the largest reliable monthly surplus most people ever get, arriving all at once. The moment a card clears is the single easiest time to redirect money, because the cash flow is already gone from your budget and nothing feels lost. This calculator shows the freed-up payment as its own figure for that reason.',
    },
  ],

  '/emergency-fund-target': [
    {
      q: 'How much should I have in my emergency fund?',
      a: 'The conventional answer is three to six months of expenses, but that range is wide enough to be useless on its own and the right end of it depends on how predictable your income is. A salaried employee with stable pay and no dependants sits near the bottom of the range; someone freelancing, or supporting other people, or spending most of their income on essentials, sits near the top. This calculator starts everyone at three months and adjusts up from there based on income stability, expense pressure, dependants and credit card debt, then caps the answer at six months.',
    },
    {
      q: 'Is three months of expenses enough?',
      a: 'Three months is enough for most people with a stable salary, no dependants, and essential expenses well under two-thirds of their income — it covers the common shocks, which are a car repair or a medical bill rather than a year of unemployment. It is not enough if your income varies month to month, if other people depend on it, or if your essentials already consume most of what you earn, because those are exactly the situations where a gap takes longest to close.',
    },
    {
      q: 'Should my emergency fund cover my income or my expenses?',
      a: 'Expenses, and specifically essential expenses — rent, utilities, groceries, insurance, minimum debt payments and transport. Sizing the fund against income means saving for a version of your life that includes discretionary spending you would cut immediately in an actual emergency, which usually inflates the target by a third or more and makes it feel unreachable.',
    },
    {
      q: 'Should I build an emergency fund or pay off debt first?',
      a: 'The sequence most planning frameworks use is a small starter buffer first, then high-interest debt, then the rest of the fund. The reasoning is that a 22% credit card costs more than almost any savings account pays, so debt should win — but with no buffer at all, the next unexpected expense goes straight back on the card and the balance never falls. A one-month cushion is usually enough to break that loop.',
    },
    {
      q: 'Where should I keep my emergency fund?',
      a: 'Somewhere you can reach within a day or two and where the balance does not move — that generally means a savings account separate from the one you spend from, not an investment account. The purpose of this money is availability rather than return, and money invested in the market can be worth less exactly when you need it, because job losses and market falls tend to arrive together.',
    },
  ],

  '/net-worth-impact': [
    {
      q: 'What is $150 a month actually worth over 30 years?',
      a: 'Invested consistently at a 7% real return, $150 a month comes to roughly $1,859 after one year, about $25,963 after ten years, and about $182,996 after thirty — of which around $128,000 is growth rather than the $54,000 you paid in. The gap between the ten-year and thirty-year figures is the entire argument for starting early: the last decade contributes more than the first two combined. These are this calculator\'s own figures and they assume the contribution never stops and the return is smooth, which no real market is.',
    },
    {
      q: 'Why do you use 7%?',
      a: '7% is used here as a long-run real (inflation-adjusted) return for a diversified stock portfolio, which is the convention most retirement projections use. It is a planning assumption, not a prediction and not a product: no single year looks like 7%, and any thirty-year window can land meaningfully above or below it. Treat the output as a sense of scale rather than a number to plan a specific date around.',
    },
    {
      q: 'What about market crashes?',
      a: 'This calculator smooths growth into one steady rate, so it does not show the drawdowns a real thirty-year period contains — and every thirty-year period contains several. What it is useful for is direction and magnitude: whether a change is worth thousands or hundreds of thousands. What it cannot tell you is what your balance will be on a particular date, because sequence of returns matters enormously and is unknowable in advance.',
    },
    {
      q: 'Is it better to invest, save cash, or pay off debt?',
      a: 'It depends on the rate attached to each. Paying off a balance at 22% APR is a guaranteed 22% return, which beats an expected 7% from investing; cash held in an account earning nothing loses value to inflation but is the only option that is available instantly. This calculator models all three separately — compound growth for investing, no growth for cash, and interest avoided for debt — so the same monthly amount can be compared across them.',
    },
    {
      q: 'Is this financial advice?',
      a: 'No. This is an educational calculator that shows how one monthly change compounds over time using figures you enter yourself. WeLeap is not a registered investment adviser and does not provide personalised investment advice. For guidance specific to your situation, speak to a licensed financial professional.',
    },
  ],

  '/allocator': [
    {
      q: 'What order should I put my money in?',
      a: 'The widely used ordering is: contribute enough to your 401(k) to capture the full employer match, build a small emergency buffer, clear high-interest debt, then fill tax-advantaged accounts such as an HSA and the rest of your retirement contribution, and invest the remainder. The logic is rate of return: an employer match is an immediate 100% return, a 22% credit card is a guaranteed 22%, and the stock market historically returns around 7% real — so the order follows the numbers rather than preference. This tool applies that ordering to your salary, state and current contributions.',
    },
    {
      q: 'How much of my paycheck should go to savings?',
      a: 'Rather than a fixed percentage, the more useful figure is your monthly surplus — take-home pay after tax and contributions, minus essential expenses — because that is the money actually available to direct. This tool works out that surplus, then routes 40% of it toward your safety buffer until the buffer is funded, 40% of what remains to high-interest debt while any exists, and splits the rest between retirement and general investing. Percentages of gross salary ignore the fact that two people on the same salary in different states and different rents have very different amounts to work with.',
    },
    {
      q: 'How much should I contribute to my 401(k)?',
      a: 'At minimum, enough to receive your full employer match — contributing below the match cap forfeits money your employer has already budgeted for you. Beyond that the answer is bounded by the IRS employee deferral limit, which this tool applies at the 2025 figure of $23,500. Between those two points the right number depends on what else your money has to do, which is what this tool is working out.',
    },
    {
      q: 'What is an HSA and should I use one?',
      a: 'A Health Savings Account is available if you are enrolled in a qualifying high-deductible health plan, and it is the only US account that is untaxed on the way in, untaxed while it grows, and untaxed on the way out when used for qualified medical expenses. That triple treatment is why it sits high in the ordering — above general investing and, for many people, above additional retirement contributions beyond the match. The 2025 contribution limits this tool uses are $4,300 for self-only coverage and $8,550 for family coverage.',
    },
    {
      q: 'Does WeLeap move my money for me?',
      a: 'No. WeLeap shows the move and the arithmetic behind it, and you decide whether it happens — nothing is automatic and nothing is executed on your behalf. WeLeap connects to accounts through Plaid with read-only access and is not a registered investment adviser.',
    },
  ],
}

/** FAQ content for a route, or undefined where the page has none. */
export function faqsByHref(href: string): readonly FaqItem[] | undefined {
  return TOOL_FAQS[href]
}

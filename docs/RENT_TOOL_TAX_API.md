# Rent Tool — Tax API Documentation

The Rent Tool uses an external API to calculate federal, state, and FICA taxes for take-home pay estimates. This document describes the API integration and configuration for the team.

---

## Overview

- **Provider:** [API Ninjas](https://api-ninjas.com/)
- **API:** Income Tax Calculator
- **Purpose:** Calculate accurate take-home pay (net income after taxes) for the rent range calculator
- **Location in codebase:** `app/api/tax/route.ts`

---

## API Details

### Endpoint

```
GET https://api.api-ninjas.com/v1/incometaxcalculator
```

### Authentication

- **Header:** `X-Api-Key: YOUR_API_KEY`
- **Required:** Yes (without it, we fall back to an internal estimate)

### Query Parameters (used by Rent Tool)

| Parameter   | Required | Description                                      |
|------------|----------|--------------------------------------------------|
| `country`  | Yes      | 2-letter country code. We use `US`.              |
| `region`   | Yes      | State code (e.g., `CA`, `NY`, `TX`).            |
| `income`   | Yes      | Annual gross income in USD.                     |

### Optional Parameters (not currently used)

- `tax_year` — Tax year (YYYY). Defaults to latest if omitted.
- `filing_status` — `single`, `married`, `married_separate`, `head_of_household`. API defaults if omitted.
- `deductions` — Total tax deductions.
- `credits` — Total tax credits.

### Response Fields (used by Rent Tool)

| Field                 | Description                          |
|-----------------------|--------------------------------------|
| `region_taxes_owed`   | State tax amount                     |
| `fica_total`          | FICA (Social Security + Medicare)     |
| `fica_social_security`| Social Security portion              |
| `fica_medicare`       | Medicare portion                     |
| `total_taxes_owed`    | Total tax liability                  |
| `income_after_tax`    | Net take-home (annual)               |

### Sample Request

```bash
curl -X GET "https://api.api-ninjas.com/v1/incometaxcalculator?country=US&region=CA&income=75000" \
  -H "X-Api-Key: YOUR_API_KEY"
```

### Rate Limits & Pricing

- Check [API Ninjas pricing](https://api-ninjas.com/pricing) for current limits.
- Free tier: 10,000 requests/month.
- Rent Tool calls this API once per user calculation.

---

## API Key Configuration

### Environment Variable

| Variable        | Description                    | Example (do not commit) |
|-----------------|--------------------------------|-------------------------|
| `API_NINJAS_KEY`| Your API Ninjas API key        | `abc123...`             |

### How to Set Up

1. **Get an API key**
   - Sign up at [api-ninjas.com](https://api-ninjas.com/)
   - Go to [API Keys](https://api-ninjas.com/profile) to create or copy your key

2. **Add to environment**
   - **Local:** Add to `.env.local` in the project root:
     ```
     API_NINJAS_KEY=your_api_key_here
     ```
   - **Vercel/Production:** Add `API_NINJAS_KEY` in Project Settings → Environment Variables

3. **Security**
   - Never commit `.env.local` or the API key to git (`.env.local` is in `.gitignore`)
   - Share the key only via secure channels (e.g., 1Password, Vercel env vars)

### Fallback Behavior

If `API_NINJAS_KEY` is not set or the API request fails (timeout, error, rate limit):

- The Rent Tool uses an internal **fallback tax calculator** in `app/api/tax/route.ts`
- Fallback uses simplified federal brackets and state rates
- Response includes `taxSource: 'fallback'` vs `taxSource: 'api_ninjas'` so you can monitor usage

---

## Internal API Route

The Rent Tool calls our own route, which then calls API Ninjas:

**POST** `/api/tax`

**Request body:**
```json
{
  "salaryAnnual": 75000,
  "state": "CA"
}
```

**Response:**
```json
{
  "federalTaxAnnual": 12000,
  "stateTaxAnnual": 6750,
  "ficaTaxAnnual": 5738,
  "totalTaxAnnual": 24488,
  "netIncomeAnnual": 50512,
  "taxSource": "api_ninjas"
}
```

---

## References

- [API Ninjas Income Tax Calculator](https://api-ninjas.com/api/incometaxcalculator)
- [API Ninjas Dashboard](https://api-ninjas.com/profile)
- Internal route: `app/api/tax/route.ts`

/**
 * State Property Tax Data for All 50 States + DC
 *
 * Effective tax rates: Census ACS 2024 1-year aggregate ratio (B25090 / B25082) for all 50 states + DC.
 * Exemption rules: verified against state statutes and DOR pages (August 2026; re-audited October 7, 2026).
 * Earlier builds cited Veterans United's summary page; it is no longer the source of any figure here.
 *
 * Each entry contains:
 *   - name: Full state name
 *   - avgPropertyTaxRate: Average effective property tax rate (decimal)
 *   - veteranExemption: Object with tiers (ordered highest minRating first) and defaultDescription
 *
 * Exemption tier types:
 *   "full"            — 100% of property tax eliminated
 *   "fixed_amount"    — Dollar amount deducted from assessed value
 *   "fixed_tax_credit" — Dollar amount deducted from the tax bill
 *   "percentage"      — Decimal (0.5 = 50%) of assessed value that is exempt
 *   "none"            — No exemption
 *
 * Optional tier fields:
 *   prorated: true    — Value is prorated by (disabilityRating / 100)
 *
 * Flagged states needing user verification are marked with:
 *   flagged: true + flagNote: "reason"
 */

export const stateTaxData = {
  "AL": {
    name: "Alabama",
    avgPropertyTaxRate: 0.0037,
    assessmentRatio: 0.1,
    veteranExemption: {
      tiers: [
        { minRating: 100, requiresPT: true, type: "full", description: "Full ad valorem exemption on the homestead, up to 160 acres, with no income or value cap (Ala. Code 40-9-21)" }
      ],
      defaultDescription: "No veteran property tax exemption below 100% P&T"
    }
  },

  "AK": {
    name: "Alaska",
    avgPropertyTaxRate: 0.009,
    assessmentRatio: 1,
    veteranExemption: {
      tiers: [
        { minRating: 50, requiresPT: false, type: "fixed_amount", basis: "assessed", value: 150000, description: "First $150,000 of assessed value exempt" }
      ],
      defaultDescription: "No veteran exemption below 50%"
    }
  },

  "AZ": {
    name: "Arizona",
    avgPropertyTaxRate: 0.0043,
    assessmentRatio: 0.1,
    veteranExemption: {
      tiers: [
        { minRating: 100, requiresPT: false, type: "full", description: "Primary residence fully exempt from property tax at a 100% service-connected rating, with no income or value test (A.R.S. 42-11111(C): HB 2792, Laws 2026 ch. 2, effective February 12, 2026 for tax years beginning after December 31, 2025, refined by HB 2120, Laws 2026 ch. 82; TDIU qualifies; the surviving spouse keeps it until remarriage)" },
        { minRating: 10, requiresPT: false, type: "fixed_amount", basis: "assessed", value: 4873, prorated: true, description: "Up to $4,873 of assessed value exempt (2026), prorated by VA disability rating. Household income must be under $39,865 ($47,826 with minor children or dependents; VA disability income is excluded from the test) and total assessed value of all property under $36,865. A.R.S. 42-11111, opened to all rating levels by Prop 130 (2022). Amounts index annually." }
      ],
      defaultDescription: "No veteran exemption below 10%"
    }
  },

  "AR": {
    name: "Arkansas",
    avgPropertyTaxRate: 0.0054,
    assessmentRatio: 0.2,
    veteranExemption: {
      tiers: [
        { minRating: 100, requiresPT: true, type: "full", description: "Full exemption on the homestead (dwelling plus up to 40 contiguous non-commercial acres) and on personal property. Also qualifies at any rating via SMC for loss or loss of use of a limb, or total blindness (ACA 26-3-306)" }
      ],
      defaultDescription: "No veteran exemption below 100% P&T"
    }
  },

  "CA": {
    name: "California",
    avgPropertyTaxRate: 0.0069,
    assessmentRatio: 1,
    veteranExemption: {
      tiers: [
        { minRating: 100, requiresPT: false, type: "fixed_amount", basis: "assessed", value: 180671, description: "$180,671 off assessed value (2026); rises to $271,009 if household income is $81,131 or less. Includes veterans compensated at 100% through TDIU. CPI-indexed annually (R&TC 205.5)" }
      ],
      defaultDescription: "No veteran exemption below 100%"
    }
  },

  "CO": {
    name: "Colorado",
    avgPropertyTaxRate: 0.0052,
    assessmentRatio: 0.0695,  // blended school/local residential rate (SB24-233); exemption is on actual value so ratio is inert
    veteranExemption: {
      tiers: [
        { minRating: 100, requiresPT: true, type: "fixed_amount", basis: "market", value: 100000, description: "50% of the first $200,000 of actual value is exempt, so up to $100,000. Requires 100% permanent and total; veterans rated individually unemployable (TDIU) qualify beginning tax year 2025 under Amendment G (2024)" }
      ],
      defaultDescription: "No veteran exemption below 100% P&T"
    }
  },

  "CT": {
    name: "Connecticut",
    avgPropertyTaxRate: 0.0136,
    assessmentRatio: 0.7,
    veteranExemption: {
      tiers: [
        { minRating: 100, requiresPT: true, type: "full", description: "Full exemption on the dwelling you occupy at a 100% service-connected P&T rating (CGS 12-81(83), PA 24-46). PA 25-168 excludes rental or commercial portions and makes a TDIU-based exemption and up to 2 acres of lot municipal options, so ask your assessor" }
      ],
      defaultDescription: "Some towns offer small exemptions for qualifying veterans"
    }
  },

  "DE": {
    name: "Delaware",
    avgPropertyTaxRate: 0.0051,
    assessmentRatio: 1,
    veteranExemption: {
      tiers: [
        { minRating: 100, requiresPT: false, type: "full", description: "Tax credit against 100% of non-vocational school district property tax (3-year DE residency required)" }
      ],
      defaultDescription: "No veteran exemption below 100%"
    }
  },

  "FL": {
    name: "Florida",
    avgPropertyTaxRate: 0.0076,
    assessmentRatio: 1,
    veteranExemption: {
      tiers: [
        { minRating: 100, requiresPT: true, type: "full", description: "Full exemption on primary residence (100% P&T)" },
        { minRating: 10, requiresPT: false, type: "fixed_amount", basis: "assessed", value: 5000, description: "$5,000 deduction from assessed value" }
      ],
      defaultDescription: "No veteran exemption at 0%"
    }
  },

  "GA": {
    name: "Georgia",
    avgPropertyTaxRate: 0.0077,
    assessmentRatio: 0.4,
    veteranExemption: {
      tiers: [
        { minRating: 100, requiresPT: false, type: "fixed_amount", basis: "assessed", value: 126526, description: "$126,526 of assessed value exempt (2026). Indexed annually to the federal specially adapted housing amount under 38 U.S.C. 2102. Qualifies at 100% total disability, TDIU paid at the 100% rate, or service-connected loss of limbs or blindness (O.C.G.A. 48-5-48)" }
      ],
      defaultDescription: "No veteran exemption below 100%"
    }
  },

  "HI": {
    name: "Hawaii",
    avgPropertyTaxRate: 0.0031,
    assessmentRatio: 1,
    flagged: true,
    flagNote: "Property tax is entirely county-run in Hawaii; all four counties assess at 100% of market value. Every county gives a totally disabled veteran a FULL exemption, leaving only the county minimum tax ($150-$300). Thresholds differ: Honolulu and Hawaii County at 100%, Kauai at 80%+, Maui at 70%+ ('severely disabled' per MCC 3.48.475). Corrected 2026-08-03: an earlier note claimed Kauai gave $50,000 off assessed value below 80% — that figure is not the veteran benefit and has been removed.",
    sources: [
      { label: "Kauai County", url: "https://www.kauai.gov/Government/Departments-Agencies/Department-of-Finance/Real-Property-Assessment-Division/Exemptions" },
      { label: "Maui County", url: "https://www.mauicounty.gov/1888/Real-Property-Tax-Exemptions" },
      { label: "Honolulu County", url: "https://realproperty.honolulu.gov/" },
      { label: "Hawaii County", url: "https://www.hawaiipropertytax.com/" }
    ],
    veteranExemption: {
      tiers: [
        { minRating: 100, requiresPT: false, type: "full", description: "Full exemption on primary residence (all counties; minimum tax $150–$300 may still apply)" },
        { minRating: 80, requiresPT: false, type: "full", description: "Full exemption in Kauai County (min $150 tax); verify eligibility in other counties" },
        { minRating: 70, requiresPT: false, type: "full", description: "Full exemption in Maui County (min $150 tax; 'severely disabled' per MCC 3.48.475); other counties require higher rating" }
      ],
      defaultDescription: "No county veteran exemption below the thresholds listed (Honolulu and Hawaii County 100%, Kauai 80%, Maui 70%)"
    }
  },

  "ID": {
    name: "Idaho",
    avgPropertyTaxRate: 0.0043,
    assessmentRatio: 1,
    veteranExemption: {
      tiers: [
        { minRating: 100, requiresPT: false, type: "fixed_tax_credit", value: 1500, description: "$1,500 property tax reduction (must own and occupy before April 15)" }
      ],
      defaultDescription: "No veteran exemption below 100%"
    }
  },

  "IL": {
    name: "Illinois",
    avgPropertyTaxRate: 0.0179,
    assessmentRatio: 0.3333,  // 33 1/3% statutory; Cook assesses at 10% then equalizes to the same level
    veteranExemption: {
      tiers: [
        { minRating: 70, requiresPT: false, type: "fixed_amount", basis: "assessed", value: 250000, description: "First $250,000 of equalized assessed value exempt (35 ILCS 200/15-169(b-3.1)(3)); at the 33.33% assessment level that covers roughly $750,000 of market value" },
        { minRating: 50, requiresPT: false, type: "fixed_amount", basis: "assessed", value: 5000, description: "$5,000 off EAV" },
        { minRating: 30, requiresPT: false, type: "fixed_amount", basis: "assessed", value: 2500, description: "$2,500 off EAV" }
      ],
      defaultDescription: "No veteran exemption below 30%"
    }
  },

  "IN": {
    name: "Indiana",
    avgPropertyTaxRate: 0.0076,
    assessmentRatio: 1,
    flagNote: "OVERHAULED by HEA 1210-2026 (signed 3/12/2026, retroactive to 1/1/2026, applies 2026 pay 2027). The old deduction tiers ($24,960 / $14,000 / $38,960 combined, home under $240K) are gone. IC 6-1.1-12-14 now exempts 100% of assessed value for totally disabled veterans with the $240,000 cap REMOVED; IC 6-1.1-12-13's $24,960 deduction is repealed and replaced by a flat $350 credit. Note the 2025 whiplash before this: SEA 1-2025 eliminated the deductions, HEA 1427-2025 reinstated them retroactively, and then HEA 1210-2026 replaced them.",
    sources: [
      { label: "IN DVA Property Tax Deduction", url: "https://www.in.gov/dva/divisions/training-and-services/disabled-veteran-property-tax-deduction/" },
      { label: "DLGF memo on 2026 legislation", url: "https://www.in.gov/dlgf/files/2026-memos/260527-Cockerill-Memo-Legislation-Affecting-Deductions,-Credits,-and-Exemptions.pdf" }
    ],
    veteranExemption: {
      tiers: [
        { minRating: 100, requiresPT: false, type: "full", description: "Full exemption: IC 6-1.1-12-14 now deducts 100% of assessed value for totally disabled veterans, and the old $240,000 home-value cap was removed (HEA 1210-2026, effective for the 2026 assessment date). Requires one year of Indiana residency and use as your principal residence. You cannot combine this with the flat credits below" },
        { minRating: 10, requiresPT: false, type: "fixed_tax_credit", value: 350, description: "$350 flat property tax credit for a wartime veteran with a 10%+ service-connected disability and an honorable discharge (IC 6-1.1-51.3-6), replacing the repealed $24,960 deduction. Veterans 62+ with a 10%+ rating get a separate $250 credit (IC 6-1.1-51.3-5); the two credits stack to $600, but neither can be combined with the full exemption above" }
      ],
      defaultDescription: "No veteran benefit without a service-connected disability rating"
    }
  },

  "IA": {
    name: "Iowa",
    avgPropertyTaxRate: 0.0125,
    assessmentRatio: 0.4743,  // annual rollback order sets taxable value; AY2024 residential rollback 47.4316% — refresh yearly
    veteranExemption: {
      tiers: [
        { minRating: 100, requiresPT: true, type: "full", description: "Full exemption on homestead (≤40 acres rural or ≤½ acre urban)" }
      ],
      defaultDescription: "Small general veteran credit available (not disability-specific)"
    }
  },

  "KS": {
    name: "Kansas",
    avgPropertyTaxRate: 0.012,
    assessmentRatio: 0.115,
    veteranExemption: {
      tiers: [
        { minRating: 50, requiresPT: false, type: "fixed_tax_credit", value: 700, description: "Two income-limited refunds, and you may claim only one. K-40SVR (HB 2239, 2022) refunds all property tax growth above your base-year tax — base year is the year before your first claim, floor 2021 — for a 50%+ permanent service-connected disability, household income of $58,041 or less (2025, indexed), and a home valued at $350,000 or less in the base year. The general K-40H Homestead Refund pays up to $700 for household income of $43,389 or less. We model the $700 because K-40SVR's value depends entirely on how much your assessment has grown since your base year, which we can't know — for long-time owners it is usually the larger of the two" }
      ],
      defaultDescription: "No veteran-specific property tax relief below 50%"
    }
  },

  "KY": {
    name: "Kentucky",
    avgPropertyTaxRate: 0.0072,
    assessmentRatio: 1,
    veteranExemption: {
      tiers: [
        { minRating: 100, requiresPT: false, type: "fixed_amount", basis: "assessed", value: 49100, description: "$49,100 off assessed value for the 2025-2026 assessment periods, indexed every two years. Worth knowing: Kentucky has no dedicated disabled-veteran exemption — a 100% totally disabled veteran claims the same homestead exemption as any 65-year-old, and only one exemption applies per residence, so being both doesn't double it. Kentucky assesses at full fair cash value, so this comes straight off your home's value (KRS 132.810). Several veteran-specific exemption bills were filed in 2025 and 2026; every one died in committee, despite sites reporting otherwise" }
      ],
      defaultDescription: "No veteran exemption below 100% (Kentucky's homestead exemption requires age 65+ or total disability)"
    }
  },

  "LA": {
    name: "Louisiana",
    avgPropertyTaxRate: 0.0056,
    assessmentRatio: 0.1,
    veteranExemption: {
      tiers: [
        { minRating: 100, requiresPT: false, type: "full", description: "100% service-connected disability or 100% unemployability: full exemption from ad valorem tax on the homestead (La. Const. Amendment 2 of 2022, effective 1/1/2023)" },
        { minRating: 70, requiresPT: false, type: "fixed_amount", basis: "market", value: 120000, description: "70-99%: first $120,000 of fair market value exempt — a $4,500 assessed-value exemption stacked on the standard $7,500 homestead exemption" },
        { minRating: 50, requiresPT: false, type: "fixed_amount", basis: "market", value: 100000, description: "50-69%: first $100,000 of fair market value exempt — a $2,500 assessed-value exemption stacked on the standard homestead exemption" }
      ],
      defaultDescription: "Standard homestead exemption only below 50%"
    }
  },

  "ME": {
    name: "Maine",
    avgPropertyTaxRate: 0.009,
    assessmentRatio: 1,
    flagged: true,
    flagNote: "Corrected 2026-08-03: we previously gave every 100% veteran the $50,000 amount, but that tier requires a 38 U.S.C. 2101 specially adapted housing GRANT — it is not a disability-rating tier. The correct default is $6,000. Amounts are stated in JUST VALUE and each municipality multiplies by its certified ratio (36 M.R.S. 653(1)(K)); that conversion makes the benefit ratio-invariant, so basis stays market and the ratio must NOT be applied again here — doing both is the classic double-discount bug. Maine towns declare ratios from 50% to 112% (2024 mean ~90%, median 100%). MAJOR PENDING CHANGE: P.L. 2025 c. 650 Pt. M (signed 4/10/2026) discontinues 36 M.R.S. 653/654-A/683 and replaces them with a disability-tiered 683-A for property tax years beginning on or after April 1, 2027 — a 100% rating then gets $50,000 stacked on the $25,000 homestead exemption, roughly $316/yr to $765/yr. Revisit this entry before April 2027.",
    veteranExemption: {
      tiers: [
        { minRating: 0, requiresPT: false, type: "fixed_amount", basis: "market", value: 6000, description: "$6,000 of just value exempt for a veteran receiving compensation for total disability (TDIU counts), or a war-period veteran age 62 or older. A separate $50,000 exemption exists but requires a federal specially adapted housing grant under 38 U.S.C. 2101 — it is not tied to your rating percentage. Maine's own homestead exemption ($25,000) stacks on top of this. Apply once by April 1; no annual refiling (36 M.R.S. 653)" }
      ],
      defaultDescription: "$6,000 exemption available to qualifying veterans"
    }
  },

  "MD": {
    name: "Maryland",
    avgPropertyTaxRate: 0.009,
    assessmentRatio: 1,
    veteranExemption: {
      tiers: [
        { minRating: 100, requiresPT: false, type: "full", description: "Full exemption on primary residence (apply by September for following year)" }
      ],
      defaultDescription: "No veteran exemption below 100%"
    }
  },

  "MA": {
    name: "Massachusetts",
    avgPropertyTaxRate: 0.0095,
    assessmentRatio: 1,
    flagged: true,
    flagNote: "Clause 22 exemptions are written as EITHER a valuation amount OR a dollar-of-tax amount, whichever abates more — and at MA residential rates the dollar leg always wins, so they are modeled as flat credits off the bill. Corrected 2026-08-03: we previously gave every 100% veteran the $1,500 Clause 22C amount, but 22C requires VA specially adapted housing assistance. The correct default for a plain 100% rating is Clause 22E at $1,000. Massachusetts does NOT fully exempt 100% P&T veterans — total exemptions are limited to 22D (surviving spouse of a service-connected death), 22F (paraplegic or 100% service-connected blindness), and 22H (Gold Star parents).",
    sources: [
      { label: "MA DOR Property Tax Exemptions", url: "https://www.mass.gov/info-details/local-property-tax-exemptions-for-veterans" },
      { label: "MGL c.59 s.5 (statutory text)", url: "https://malegislature.gov/Laws/GeneralLaws/PartI/TitleIX/Chapter59/Section5" }
    ],
    veteranExemption: {
      tiers: [
        { minRating: 100, requiresPT: false, type: "fixed_tax_credit", value: 1000, description: "$1,000 off your tax bill for a 100% service-connected rating (Clause 22E), requiring annual recertification that the rating hasn't dropped. Larger amounts exist for narrower circumstances: $1,500 if you received VA specially adapted housing assistance (22C), and a TOTAL exemption if you are paraplegic or rated 100% for service-connected blindness (22F). A city or town that adopted HERO Act Clause 22J may add up to 100% more, and Clause 22I indexes the amounts to CPI — so check your municipality, since neither is automatic" },
        { minRating: 10, requiresPT: false, type: "fixed_tax_credit", value: 400, description: "$400 off your tax bill for a 10%+ rating or a Purple Heart (Clause 22). Higher tiers apply for loss or loss of use of a limb, loss of sight, POW status, or valor decorations ($750 under 22A; $1,250 under 22B)" }
      ],
      defaultDescription: "No veteran exemption at 0%"
    }
  },

  "MI": {
    name: "Michigan",
    avgPropertyTaxRate: 0.0113,
    assessmentRatio: 0.5,
    veteranExemption: {
      tiers: [
        { minRating: 100, requiresPT: true, type: "full", description: "Full exemption on the homestead for veterans rated 100% permanently and totally disabled, rated individually unemployable (TDIU), or holding a VA certificate for specially adapted housing. One filing with your local assessor — since 2023 PA 150, exemptions on taxes levied on or after 1/1/2025 carry forward with no annual reapplication until you rescind them. Unremarried surviving spouses continue to qualify (MCL 211.7b)" }
      ],
      defaultDescription: "No veteran exemption below 100% P&T"
    }
  },

  "MN": {
    name: "Minnesota",
    avgPropertyTaxRate: 0.0099,
    assessmentRatio: 1,
    veteranExemption: {
      tiers: [
        { minRating: 100, requiresPT: true, type: "fixed_amount", basis: "market", value: 300000, description: "$300,000 off market value (P&T)" },
        { minRating: 70, requiresPT: false, type: "fixed_amount", basis: "market", value: 150000, description: "$150,000 off market value" }
      ],
      defaultDescription: "No veteran exemption below 70%"
    }
  },

  "MS": {
    name: "Mississippi",
    avgPropertyTaxRate: 0.0054,
    assessmentRatio: 0.1,
    veteranExemption: {
      tiers: [
        { minRating: 100, requiresPT: false, type: "full", description: "Exempt from all ad valorem taxes on the homestead, with no dollar cap (DOR Tier 3, Total Exemption). Requires an honorable discharge and a service-connected total disability — a separate VA permanent-and-total designation is not the test. Unremarried surviving spouses qualify" }
      ],
      defaultDescription: "Standard homestead exemption only below total disability"
    }
  },

  "MO": {
    name: "Missouri",
    avgPropertyTaxRate: 0.0085,
    assessmentRatio: 0.19,
    veteranExemption: {
      tiers: [
        { minRating: 100, requiresPT: false, type: "fixed_tax_credit", value: 1550, description: "Missouri Property Tax Credit (the 'circuit breaker') — up to $1,550 for owner-occupants, $1,055 for renters, for veterans with a 100% service-connected disability, former POWs rated 100%, and other claimants who are 100% disabled or 65+. Income-limited to roughly $41,000 for owners and $38,200 for renters. Raised from $1,100 by HB 594 (2025), effective tax year 2026; indexes for inflation from 2027. Note: the Department of Revenue's public page may still display the older $1,100 figure" }
      ],
      defaultDescription: "No veteran-specific credit below 100%"
    }
  },

  "MT": {
    name: "Montana",
    avgPropertyTaxRate: 0.0059,
    assessmentRatio: 1,  // assessed equals market; burden comes from the class-four rate, exemption modeled as percentage
    flagged: true,
    flagNote: "100% disability required. Tax reduction is income-based (not a flat exemption). Single: 100% reduction if income ≤$48,152, 80% if ≤$52,968, 70% if ≤$57,781, 50% if ≤$62,598. Married/HoH caps at $72,229. Must occupy home 7+ months/year.",
    sources: [
      { label: "MT Revenue Property Tax Help", url: "https://mtrevenue.gov/property/property-tax-help/" },
      { label: "MCA 15-6-211 (Statute)", url: "https://leg.mt.gov/bills/mca/title_0150/chapter_0060/part_0020/section_0110/0150-0060-0020-0110.html" }
    ],
    veteranExemption: {
      tiers: [
        { minRating: 100, requiresPT: false, type: "percentage", value: 1.0, description: "50%–100% tax reduction based on income (100% reduction if single income ≤$48,152; see flag note for full tiers)" }
      ],
      defaultDescription: "No veteran exemption below 100%"
    }
  },

  "NE": {
    name: "Nebraska",
    avgPropertyTaxRate: 0.0138,
    assessmentRatio: 1,
    veteranExemption: {
      tiers: [
        { minRating: 100, requiresPT: false, type: "full", description: "100% exemption — no income or home value limits (Category 4V; file Form 458, refile every 5 years)" }
      ],
      defaultDescription: "No veteran-specific exemption below 100% (general homestead exemption may apply based on income)"
    }
  },

  "NV": {
    name: "Nevada",
    avgPropertyTaxRate: 0.005,
    assessmentRatio: 0.35,
    veteranExemption: {
      tiers: [
        { minRating: 100, requiresPT: false, type: "fixed_amount", basis: "assessed", value: 35400, description: "$35,400 of assessed value exempt for FY2025-26 (roughly $101,000 of taxable value). Requires a permanent service-connected disability. CPI-indexed each fiscal year; may be claimed in only one county (NRS 361.091)" },
        { minRating: 80, requiresPT: false, type: "fixed_amount", basis: "assessed", value: 26550, description: "$26,550 of assessed value exempt for FY2025-26 (80-99% permanent service-connected disability). CPI-indexed annually" },
        { minRating: 60, requiresPT: false, type: "fixed_amount", basis: "assessed", value: 17700, description: "$17,700 of assessed value exempt for FY2025-26 (60-79% permanent service-connected disability). CPI-indexed annually" }
      ],
      defaultDescription: "No veteran exemption below 60%"
    }
  },

  "NH": {
    name: "New Hampshire",
    avgPropertyTaxRate: 0.0135,
    assessmentRatio: 1,
    flagged: true,
    flagNote: "RSA 72:36-a: full exemption for blind/paraplegic/double amputee veterans with VA-assisted specially adapted homestead. RSA 72:35: $700 standard credit for total & permanent disability; towns may adopt $701–$5,000 instead. Credit applies to principal residence only.",
    sources: [
      { label: "Concord NH Disabled Veterans Credit", url: "https://www.concordnh.gov/1084/Disabled-Veterans-Credit" },
      { label: "NH RSA 72:35 (Statute)", url: "https://www.gencourt.state.nh.us/rsa/html/V/72/72-35.htm" }
    ],
    veteranExemption: {
      tiers: [
        { minRating: 100, requiresPT: true, type: "fixed_tax_credit", value: 700, description: "RSA 72:35 credit for service-connected total disability: $700 standard, and a city or town may adopt an optional credit anywhere from $701 up to $5,000 (ceiling raised from $4,000 in 2025). Cannot be combined with the RSA 72:28 veterans' credit. Requires one year of NH residency before April 1. Separately, RSA 72:36-a grants a COMPLETE exemption — but only to a veteran who is a double amputee or paraplegic from a service-connected injury, or blind at 5/200 or less, AND who owns a specially adapted homestead acquired with VA assistance. We model the credit because it is the one nearly every totally disabled veteran actually gets" }
      ],
      defaultDescription: "Standard veterans' tax credit only below total disability"
    }
  },

  "NJ": {
    name: "New Jersey",
    avgPropertyTaxRate: 0.0168,
    assessmentRatio: 0.9,
    veteranExemption: {
      tiers: [
        { minRating: 100, requiresPT: true, type: "full", description: "Full exemption on the primary residence for honorably discharged veterans with active duty service certified by VA as 100% permanently and totally disabled. Wartime service is NOT required — that limitation was removed by the constitutional amendment effective 12/4/2020. Extends to unremarried surviving spouses. File Form D.V.S.S.E. with your local assessor" },
        { minRating: 0, requiresPT: false, type: "fixed_tax_credit", value: 250, description: "$250 annual deduction off the tax bill for any honorably discharged veteran with active duty service — no disability rating needed. Peacetime service has qualified since 12/4/2020" }
      ],
      defaultDescription: "No exemption without active duty service"
    }
  },

  "NM": {
    name: "New Mexico",
    avgPropertyTaxRate: 0.0061,
    assessmentRatio: 0.3333,
    veteranExemption: {
      tiers: [
        { minRating: 10, requiresPT: false, type: "percentage", value: 1.0, prorated: true, description: "Primary residence exempt in proportion to your VA disability rating — a 100% rating means fully exempt. Created by 2024 Amendment 1 and implemented by HB 47 (2025); first applies to tax year 2026" },
        { minRating: 0, requiresPT: false, type: "fixed_amount", basis: "taxable", value: 10000, description: "All honorably discharged veterans: $10,000 off taxable value, raised from $4,000 by 2024 Amendment 2 effective tax year 2025. Indexed annually for inflation" }
      ],
      defaultDescription: "Veteran exemption requires honorable discharge"
    }
  },

  "NY": {
    name: "New York",
    avgPropertyTaxRate: 0.0123,
    assessmentRatio: 0.7,  // statewide typical; NYC Class 1 is ~0.06 and is a real outlier
    flagged: true,
    flagNote: "The full primary-residence exemption for P&T veterans (RPTL 458-a(11)) is a local option each town and school district must adopt: S1183 / L.2025 ch.672 created it, L.2026 ch.77 (Feb 13, 2026) made it mandatory, and the 2026-27 budget (L.2026 ch.59 Part EE) returned it to local option (NYS Tax Dept, Oct 6, 2026: 'Municipalities may choose whether they offer these exemptions'). Modeled as if adopted; confirm with your assessor. It first applies to rolls with taxable status dates on/after Oct 1, 2026, so for most March 1 towns the first bills are the 2027-28 school tax and 2028 town/county. Below 100% P&T, the Alternative Veterans' Exemption (RPTL §458-a) provides: 15% off assessed value for wartime service (cap $12K), +10% for combat zone (cap $8K), +half of disability rating off assessed value (cap $40K base, up to $250K in high-appreciation areas). All caps vary by municipality. Must apply by March 1.",
    sources: [
      { label: "NY Tax Dept Veterans' Exemptions (incl. RPTL 458-a(11))", url: "https://www.tax.ny.gov/pit/property/exemption/vetexempt.htm" },
      { label: "NY Tax Dept Alt Veterans' Exemption", url: "https://www.tax.ny.gov/pit/property/exemption/altvetexempt.htm" }
    ],
    veteranExemption: {
      tiers: [
        { minRating: 100, requiresPT: true, type: "full", description: "Primary residence fully exempt from taxation, special district charges and special ad valorem levies for veterans VA-rated permanently and totally disabled from military service. Added as a local option by L.2025 ch.672, made mandatory by L.2026 ch.77, then returned to a LOCAL OPTION by the 2026-27 budget (L.2026 ch.59 Part EE); modeled as if your town adopted it. First applies to assessment rolls with taxable status dates on or after 10/1/2026 — for most towns that is the 2027 roll. Whether TDIU-based P&T qualifies is not yet resolved in state guidance (RPTL 458-a(11))" },
        { minRating: 10, requiresPT: false, type: "fixed_amount", basis: "assessed", value: 40000, prorated: true, description: "Alternative Veterans Exemption, disability portion: assessed value reduced by half your VA disability rating, basic maximum $40,000. Localities may set maximums from $20,000 to $250,000, so check yours (RPTL 458-a)" }
      ],
      defaultDescription: "Alternative Veterans Exemption may still apply for wartime or combat service"
    }
  },

  "NC": {
    name: "North Carolina",
    avgPropertyTaxRate: 0.0062,
    assessmentRatio: 1,
    veteranExemption: {
      tiers: [
        { minRating: 100, requiresPT: true, type: "fixed_amount", basis: "market", value: 45000, description: "First $45,000 of appraised value excluded. Requires a service-connected permanent and total disability, or receipt of 38 U.S.C. 2101 specially adapted housing benefits — the housing path qualifies without a 100% rating (G.S. 105-277.1C). Bills to raise this to $61,000 and beyond were introduced in 2025 but never ratified, despite what many sites claim" }
      ],
      defaultDescription: "No veteran exclusion below 100% P&T"
    }
  },

  "ND": {
    name: "North Dakota",
    avgPropertyTaxRate: 0.0094,
    assessmentRatio: 0.045,  // two-step: 50% assessed x 9% = 4.5% taxable; $9,000 taxable = $200,000 true and full
    veteranExemption: {
      tiers: [
        { minRating: 50, requiresPT: false, type: "fixed_amount", basis: "taxable", value: 9000, prorated: true, description: "Credit against the first $9,000 of taxable valuation of the homestead — equivalent to $200,000 of true and full value — multiplied by your disability rating. A 100% rating gets the full $9,000, 90% gets $8,100, and so on down to 50%. Stacks with the primary residence credit (N.D.C.C. 57-02-08.8)" }
      ],
      defaultDescription: "No veteran credit below 50%"
    }
  },

  "OH": {
    name: "Ohio",
    avgPropertyTaxRate: 0.0128,
    assessmentRatio: 0.35,
    veteranExemption: {
      tiers: [
        { minRating: 100, requiresPT: false, type: "fixed_amount", basis: "market", value: 59400, description: "Enhanced homestead exemption: $59,400 of market value exempt (tax year 2026, payable 2027; $58,000 was tax year 2025; indexed annually, certified each December 1). Requires a VA total disability rating OR total disability based on individual unemployability. No income test and no age test (R.C. 323.151(F))" }
      ],
      defaultDescription: "Standard homestead exemption may apply at 65+ or with disability"
    }
  },

  "OK": {
    name: "Oklahoma",
    avgPropertyTaxRate: 0.0078,
    assessmentRatio: 0.11,
    veteranExemption: {
      tiers: [
        { minRating: 100, requiresPT: true, type: "full", description: "Full exemption from ad valorem tax on the entire fair cash value of the homestead, with no dollar cap, for veterans certified by VA at 100% permanent service-connected disability. Continues for life while owned and occupied; surviving spouse may continue it. Claimed on OTC Form 998" }
      ],
      defaultDescription: "No veteran property tax exemption below 100% permanent"
    }
  },

  "OR": {
    name: "Oregon",
    avgPropertyTaxRate: 0.0079,
    assessmentRatio: 0.526,  // official DOR FY2024-25 statewide AV/RMV ratio (Measure 50 MAV drifts below market); varies sharply by county
    veteranExemption: {
      tiers: [
        { minRating: 40, requiresPT: false, type: "fixed_amount", basis: "assessed", value: 32512, description: "$32,512 of assessed value exempt for tax year 2026-27 for a 40%+ service-connected disability. Increases 3% annually (ORS 307.250)" },
        { minRating: 0, requiresPT: false, type: "fixed_amount", basis: "assessed", value: 27092, description: "$27,092 of assessed value exempt for 2026-27 for a non-service-connected 40%+ disabled veteran or qualifying surviving spouse. Applications due January 1 through April 1" }
      ],
      defaultDescription: "No veteran exemption below 40% disability"
    }
  },

  "PA": {
    name: "Pennsylvania",
    avgPropertyTaxRate: 0.0114,
    assessmentRatio: 0.383,  // median county common level ratio (range 0.056 to 1.00); inert here since PA grants a full exemption
    veteranExemption: {
      tiers: [
        { minRating: 100, requiresPT: true, type: "full", description: "Full real estate tax exemption on the principal dwelling for wartime-service veterans with 100% P&T service-connected disability, TDIU, service-connected blindness, paraplegia, or loss of two or more limbs. Requires a State Veterans' Commission finding of financial need — need is presumed at gross annual income of $114,637 or less (effective 1/1/2025), and exceeding it is not automatically disqualifying. Renewed every 5 years" }
      ],
      defaultDescription: "No veteran exemption without wartime service and total disability"
    }
  },

  "RI": {
    name: "Rhode Island",
    avgPropertyTaxRate: 0.01,
    assessmentRatio: 1,
    flagged: true,
    flagNote: "RIGL 44-3-4: 7 exemption categories, ALL amounts set by each municipality (no statewide standard). Full exemption only for specially adapted housing (VA-assisted, permanently disabled). Totally disabled (100%) credit varies wildly: $90–$250,000 across 36 municipalities (median $10,000). See RI Municipal Finance Veterans-Senior-Exemptions-Report for your town's amount.",
    sources: [
      { label: "RI Veterans Property Tax Exemptions", url: "https://vets.ri.gov/i-am-find-your-benefits/world-war-ii-korean-war-veteran/property-tax-exemptions" },
      { label: "RI Municipal Finance Exemptions Report", url: "https://municipalfinance.ri.gov/sites/g/files/xkgbur546/files/documents/data/exemptions/Veterans-Senior-Exemptions-Report.pdf" }
    ],
    veteranExemption: {
      tiers: [
        { minRating: 100, requiresPT: false, type: "fixed_amount", basis: "assessed", value: 10000, description: "Totally disabled service-connected veterans: $10,000 exemption off assessed value as the statutory baseline. Each city and town sets its own amount by ordinance, ranging from about $11,000 to $250,000 — verify locally, because the local figure is usually higher. Separately, RIGL 44-3-4 grants a TOTAL exemption on a homestead acquired with VA specially adapted housing assistance; we model the baseline exemption because it applies far more broadly" }
      ],
      defaultDescription: "Municipal veteran exemptions may still apply at lower ratings"
    }
  },

  "SC": {
    name: "South Carolina",
    avgPropertyTaxRate: 0.0044,
    assessmentRatio: 0.04,  // lowest ratio in the nation; exemption is full so no live error, but any future dollar tier needs care
    veteranExemption: {
      tiers: [
        { minRating: 100, requiresPT: true, type: "full", description: "Full exemption on home and up to 5 acres; also covers up to 2 vehicles" }
      ],
      defaultDescription: "No veteran exemption below 100% P&T"
    }
  },

  "SD": {
    name: "South Dakota",
    avgPropertyTaxRate: 0.01,
    assessmentRatio: 0.85,
    veteranExemption: {
      tiers: [
        { minRating: 100, requiresPT: true, type: "fixed_amount", basis: "market", value: 200000, description: "Up to $200,000 of the full and true value of an owner-occupied dwelling is exempt for a veteran rated permanently and totally disabled from a service-connected disability. Surviving unremarried spouse may continue it. Apply with the county director of equalization by November 1 (SDCL 10-4-40)" }
      ],
      defaultDescription: "No veteran exemption below 100% P&T"
    }
  },

  "TN": {
    name: "Tennessee",
    avgPropertyTaxRate: 0.0046,
    assessmentRatio: 0.25,
    veteranExemption: {
      tiers: [
        { minRating: 100, requiresPT: true, type: "fixed_amount", basis: "market", value: 175000, description: "Property tax relief calculated on the first $175,000 of market value. Four qualifying paths: service-connected paraplegia, permanent paralysis of both legs, loss or loss of use of two or more limbs, or legal blindness; a VA permanent and total rating; 100% P&T from former POW status; or as the surviving spouse of a qualifying veteran. No income limit for the veteran category. TDIU qualifies only where VA rates it permanent and total" }
      ],
      defaultDescription: "No veteran relief below total disability"
    }
  },

  "TX": {
    name: "Texas",
    avgPropertyTaxRate: 0.0124,
    assessmentRatio: 1,
    veteranExemption: {
      tiers: [
        { minRating: 100, requiresPT: false, type: "full", description: "Full exemption on homestead (100% or TDIU)" },
        { minRating: 70, requiresPT: false, type: "fixed_amount", basis: "assessed", value: 12000, description: "$12,000 off assessed value" },
        { minRating: 50, requiresPT: false, type: "fixed_amount", basis: "assessed", value: 10000, description: "$10,000 off assessed value" },
        { minRating: 30, requiresPT: false, type: "fixed_amount", basis: "assessed", value: 7500, description: "$7,500 off assessed value" },
        { minRating: 10, requiresPT: false, type: "fixed_amount", basis: "assessed", value: 5000, description: "$5,000 off assessed value" }
      ],
      defaultDescription: "No veteran exemption at 0%"
    }
  },

  "UT": {
    name: "Utah",
    avgPropertyTaxRate: 0.0045,
    assessmentRatio: 0.55,
    veteranExemption: {
      tiers: [
        { minRating: 10, requiresPT: false, type: "fixed_amount", basis: "taxable", value: 535459, prorated: true, description: "Up to $535,459 of taxable value exempt, prorated by VA disability rating (10% minimum). Utah taxes primary residential property at 55% of market value, so the cap reaches much further than it looks. CPI-indexed annually under Utah Code 59-2-1903 — verify the current-year figure with the Tax Commission" }
      ],
      defaultDescription: "No veteran exemption below 10%"
    }
  },

  "VT": {
    name: "Vermont",
    avgPropertyTaxRate: 0.014,
    assessmentRatio: 1,
    veteranExemption: {
      tiers: [
        { minRating: 50, requiresPT: false, type: "fixed_amount", basis: "market", value: 10000, description: "Statutory minimum $10,000 of appraised value exempt for veterans receiving disability compensation at 50% or higher, or a VA non-service-connected disability pension, or permanent medical retirement. Towns may vote to raise this up to $40,000, but most sit at or near the $10,000 floor — check your town. Worth knowing: the base $10,000 comes off both the municipal AND education grand lists, while any town-voted increase above it applies to the municipal list only, so a $40,000 town exemption is not worth four times the base. Apply to the Vermont Office of Veterans Affairs before May 1 of the first year claimed (32 V.S.A. 3802(11))" }
      ],
      defaultDescription: "No veteran exemption below 50%"
    }
  },

  "VA": {
    name: "Virginia",
    avgPropertyTaxRate: 0.0075,
    assessmentRatio: 1,
    veteranExemption: {
      tiers: [
        { minRating: 100, requiresPT: true, type: "full", description: "Full exemption from real property tax on the principal residence of a veteran VA-rated 100% service-connected permanent and total, plus the land it sits on up to one acre — and more than one acre where the locality allows a larger exemption for other programs. TDIU qualifies if rated permanent and total. There is no filing deadline in state law; file the affidavit under Va. Code 58.1-3219.6 with your commissioner of the revenue. Since 7/1/2019 a surviving spouse may move within Virginia and keep it" }
      ],
      defaultDescription: "No veteran exemption below 100% P&T"
    }
  },

  "WA": {
    name: "Washington",
    avgPropertyTaxRate: 0.0074,
    assessmentRatio: 1,
    flagged: true,
    flagNote: "Income-based program (not a flat exemption). Currently 80%+ disability required; HB 1106 (signed May 2025) lowers to 40%+ for taxes due 2027. Relief = frozen assessed value + exemption from excess/regular levies depending on income tier. Tiers and income limits vary by county. VA disability comp excluded from income calculation. SB5398 (tiered flat exemptions + full at 100%) still in committee — not law.",
    sources: [
      { label: "WA DVA Property Tax Relief", url: "https://www.dva.wa.gov/veterans-their-families/veterans-benefits/housing-resources/property-tax-relief" },
      { label: "WA DOR Property Tax Exemption", url: "https://dor.wa.gov/taxes-rates/property-tax/property-tax-exemptions-and-deferrals" }
    ],
    veteranExemption: {
      tiers: [
        { minRating: 80, requiresPT: false, type: "percentage", value: 0.30, description: "Income-qualified relief, not a flat exemption. The rating is a gate: 80% combined service-connected for taxes collected in 2026, dropping to 40% for taxes levied for collection in 2027 and thereafter (EHB 1106, Ch. 200, Laws of 2025). A VA total disability rating qualifies at any evaluation percentage, so a 100% P&T veteran is in regardless. Every applicant must ALSO meet a county-specific combined-disposable-income threshold, though VA compensation and DIC are excluded from that income. The benefit is a freeze of your assessed value, exemption from excess and state levies, and a regular-levy exemption that varies by income tier. Check your county assessor for local limits (RCW 84.36.381)" }
      ],
      defaultDescription: "No veteran relief below the current rating threshold"
    }
  },

  "WV": {
    name: "West Virginia",
    avgPropertyTaxRate: 0.0048,
    assessmentRatio: 0.6,
    veteranExemption: {
      tiers: [
        { minRating: 90, requiresPT: true, type: "full", description: "Refundable credit equal to the full West Virginia ad valorem real property tax you actually paid on time on your homestead during the tax year, with no cap — economically the same as a full exemption, which is how we model it. Requires at least 90% AND a total-and-permanent finding due solely to service-connected disabilities. Because it reimburses tax already paid, you must pay the county sheriff first and claim it on Form DV-1 with your state income tax return (W. Va. Code 11-13MM)" }
      ],
      defaultDescription: "No veteran credit below 90% total and permanent"
    }
  },

  "WI": {
    name: "Wisconsin",
    avgPropertyTaxRate: 0.0119,
    assessmentRatio: 0.9,
    veteranExemption: {
      tiers: [
        { minRating: 100, requiresPT: false, type: "full", description: "Refundable credit for 100% of the property taxes paid on your principal dwelling plus up to one acre — economically the same as a full exemption, which is how we model it. Both a 100% service-connected rating and individual unemployability (TDIU) qualify. You must have been a Wisconsin resident when you entered active duty, or a resident for any consecutive 5-year period after entry, and a resident now" }
      ],
      defaultDescription: "No veteran credit below 100% or TDIU"
    }
  },

  "WY": {
    name: "Wyoming",
    avgPropertyTaxRate: 0.0058,
    assessmentRatio: 0.095,  // 2024 Amendment A created a separate residential class; 9.5% ratio unchanged
    veteranExemption: {
      tiers: [
        { minRating: 0, requiresPT: false, type: "fixed_amount", basis: "assessed", value: 6000, description: "$6,000 off assessed value — and because Wyoming assesses residential property at 9.5% of market value, that is roughly $63,000 of market value. Two qualifying paths: honorable wartime service or an expeditionary/campaign medal, OR any compensable service-connected disability, which waives the wartime requirement. Three years of Wyoming residency required; apply to the county assessor by the fourth Monday in May. Flat amount, no disability add-on (Wyo. Stat. 39-13-105)" }
      ],
      defaultDescription: "Requires wartime service or a compensable service-connected disability"
    }
  },

  "DC": {
    name: "District of Columbia",
    avgPropertyTaxRate: 0.0063,
    assessmentRatio: 1,
    veteranExemption: {
      tiers: [
        { minRating: 100, requiresPT: true, type: "fixed_amount", basis: "assessed", value: 445000, description: "Reduces assessed value by $445,000 for a veteran VA-classified as total and permanent from a service-connected or service-aggravated condition, or paid at the 100% rate for unemployability. Household federal AGI must be under $163,500 for tax year 2026, tested on the 2024 income year and indexed annually. Must be DC-domiciled, hold at least 50% ownership by deed, occupy it as your principal residence, and the property must have five or fewer units. File Oct 1 - Mar 31 for the full year; Apr 1 - Sep 30 gets half" }
      ],
      defaultDescription: "No veteran exemption below 100% total and permanent"
    }
  },

  // --- U.S. Territories ---

  "PR": {
    name: "Puerto Rico",
    avgPropertyTaxRate: 0.0081,
    assessmentRatio: 1,
    flagged: true,
    flagNote: "UNVERIFIED in the Aug 2026 audit. Census ACS publishes no B25090/B25082 for PR in the form used for the 50 states; the figure that does compute (0.0010) is low-confidence against this 0.0081, so the rate was left untouched. Exemption tiers are pre-audit and were not re-checked against current Puerto Rico law.",
    veteranExemption: {
      tiers: [
        { minRating: 100, requiresPT: false, type: "full", description: "Full exemption on primary residence (≤1,000 sq m urban / 1 cuerda rural)" },
        { minRating: 50, requiresPT: false, type: "fixed_amount", basis: "market", value: 50000, description: "$50,000 off appraised value" },
        { minRating: 0, requiresPT: false, type: "fixed_amount", basis: "market", value: 5000, description: "$5,000 off appraised value (all qualifying veterans)" }
      ],
      defaultDescription: "$5,000 exemption available to all qualifying veterans"
    }
  },

  "GU": {
    name: "Guam",
    avgPropertyTaxRate: 0.0050,
    assessmentRatio: 1,
    flagged: true,
    flagNote: "UNVERIFIED in the Aug 2026 audit. Census ACS publishes no property-tax aggregates for Guam, so the rate was left untouched and the exemption tier is pre-audit.",
    veteranExemption: {
      tiers: [
        { minRating: 100, requiresPT: false, type: "full", description: "Full exemption on primary residence (100% disabled or TDIU)" }
      ],
      defaultDescription: "No veteran exemption below 100%"
    }
  },

  "VI": {
    name: "U.S. Virgin Islands",
    avgPropertyTaxRate: 0.0125,
    assessmentRatio: 1,
    flagged: true,
    flagNote: "UNVERIFIED in the Aug 2026 audit. Census ACS publishes no property-tax aggregates for the USVI, so the rate was left untouched and the exemption tiers are pre-audit.",
    veteranExemption: {
      tiers: [
        { minRating: 100, requiresPT: true, type: "full", description: "Full exemption (100% total & permanent)" },
        { minRating: 0, requiresPT: false, type: "fixed_tax_credit", value: 650, description: "$650 tax credit (income <$30K individual / <$50K household)" }
      ],
      defaultDescription: "$650 tax credit available to qualifying veterans (income limits apply)"
    }
  },

  "AS": {
    name: "American Samoa",
    avgPropertyTaxRate: 0.0050,
    assessmentRatio: 1,
    flagged: true,
    flagNote: "UNVERIFIED in the Aug 2026 audit. Census ACS publishes no property-tax aggregates for American Samoa. Carries no exemption program, so the practical risk is limited to the rate itself.",
    veteranExemption: {
      tiers: [],
      defaultDescription: "No veteran property tax exemption program in American Samoa"
    }
  }
};

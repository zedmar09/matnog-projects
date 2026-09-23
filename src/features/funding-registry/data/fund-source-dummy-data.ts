import type { FundFiscalProfile, FundRegistryActivity, FundSource } from "../types/fund-source";

type FundSeed = Omit<FundSource, "id" | "createdAt" | "updatedAt"> & {
  financials: [number, number, number, number];
};

const seeds: FundSeed[] = [
  {
    code: "GF-MAT",
    name: "Municipal General Fund",
    category: "General Fund",
    ownership: "Municipal",
    barangay: null,
    managingOffice: "Municipal Treasurer's Office",
    legalBasis: "FY 2026 General Appropriations Ordinance",
    purpose: "Finance core municipal services, operations, and authorized local programs.",
    restrictions: "Use is subject to the approved annual budget and applicable local budgeting rules.",
    active: true,
    financials: [128_000_000, 12_400_000, 76_800_000, 59_500_000],
  },
  {
    code: "20DF-MAT",
    name: "20% Municipal Development Fund",
    category: "Development Fund",
    ownership: "Municipal",
    barangay: null,
    managingOffice: "Municipal Planning and Development Office",
    legalBasis: "Local Government Code and FY 2026 AIP",
    purpose: "Support priority socioeconomic and infrastructure development projects in the AIP.",
    restrictions: "Projects must be development-oriented, AIP-linked, and eligible under current DILG-DBM guidance.",
    active: true,
    financials: [42_500_000, 4_250_000, 21_900_000, 15_300_000],
  },
  {
    code: "LDRRMF",
    name: "Local Disaster Risk Reduction and Management Fund",
    category: "DRRM Fund",
    ownership: "Municipal",
    barangay: null,
    managingOffice: "Municipal DRRM Office",
    legalBasis: "RA 10121 and FY 2026 DRRM Investment Plan",
    purpose: "Fund disaster prevention, mitigation, preparedness, response, rehabilitation, and recovery.",
    restrictions: "At least 30% is reserved as Quick Response Fund; remaining use must follow the approved LDRRM plan.",
    active: true,
    financials: [18_600_000, 2_100_000, 9_800_000, 7_250_000],
  },
  {
    code: "GAD-2026",
    name: "Gender and Development Allocation",
    category: "GAD",
    ownership: "Municipal",
    barangay: null,
    managingOffice: "GAD Focal Point System",
    legalBasis: "Magna Carta of Women and approved GAD Plan and Budget",
    purpose: "Address identified gender issues through approved GAD programs, activities, and projects.",
    restrictions: "Expenditures must respond to an identified gender issue and appear in the approved GAD plan.",
    active: true,
    financials: [9_400_000, 940_000, 5_100_000, 3_900_000],
  },
  {
    code: "SEF-MAT",
    name: "Special Education Fund",
    category: "Special Education Fund",
    ownership: "Municipal",
    barangay: null,
    managingOffice: "Local School Board",
    legalBasis: "Local Government Code provisions on the Special Education Fund",
    purpose:
      "Support public school facilities, operations, and education priorities approved by the Local School Board.",
    restrictions: "Use is limited to legally authorized education expenditures and Local School Board priorities.",
    active: true,
    financials: [16_800_000, 1_400_000, 8_600_000, 7_100_000],
  },
  {
    code: "SC-PWD",
    name: "Senior Citizen and PWD Program Fund",
    category: "Sectoral Appropriation",
    ownership: "Municipal",
    barangay: null,
    managingOffice: "Municipal Social Welfare and Development Office",
    legalBasis: "FY 2026 Social Protection Appropriation",
    purpose: "Deliver accessible services and support for senior citizens and persons with disabilities.",
    restrictions: "Beneficiaries and activities must fall within the approved sectoral program.",
    active: true,
    financials: [5_200_000, 0, 3_100_000, 3_100_000],
  },
  {
    code: "TF-PORT",
    name: "Matnog Port Community Trust Fund",
    category: "Trust Fund",
    ownership: "Municipal",
    barangay: null,
    managingOffice: "Municipal Treasurer's Office",
    legalBasis: "Trust agreement and Sangguniang Bayan Resolution 2025-118",
    purpose: "Finance agreed community improvements in port-affected areas.",
    restrictions: "Use is limited to purposes and geographic areas defined in the trust agreement.",
    active: false,
    financials: [11_000_000, 0, 4_000_000, 4_000_000],
  },
  {
    code: "PGA-COAST",
    name: "Provincial Coastal Resilience Grant",
    category: "External Grant",
    ownership: "Municipal",
    barangay: null,
    managingOffice: "Municipal Engineering Office",
    legalBasis: "Provincial Grant Agreement PGA-SOR-2026-14",
    purpose: "Co-finance coastal protection and climate-resilience investments.",
    restrictions: "Eligible only for approved coastal packages with counterpart and milestone reporting.",
    active: true,
    financials: [24_000_000, 3_500_000, 12_000_000, 8_000_000],
  },
  {
    code: "DBP-WATER",
    name: "Municipal Water Systems Development Loan",
    category: "Loan",
    ownership: "Municipal",
    barangay: null,
    managingOffice: "Local Finance Committee",
    legalBasis: "Development loan agreement and borrowing ordinance",
    purpose: "Finance multi-year water system expansion and rehabilitation.",
    restrictions: "Drawdowns require lender clearance, approved procurement milestones, and debt-service compliance.",
    active: true,
    financials: [35_000_000, 5_000_000, 13_500_000, 9_500_000],
  },
  {
    code: "BDF-BARIIS",
    name: "Barangay Bariis Development Fund",
    category: "Development Fund",
    ownership: "Barangay",
    barangay: "Bariis",
    managingOffice: "Barangay Bariis",
    legalBasis: "Barangay Bariis FY 2026 Appropriation Ordinance",
    purpose: "Implement approved barangay development projects aligned with the BDP and AIP.",
    restrictions: "Use is limited to Barangay Bariis projects included in its approved development plan.",
    active: true,
    financials: [3_800_000, 380_000, 1_900_000, 1_250_000],
  },
  {
    code: "BDF-LAJONG",
    name: "Barangay Lajong Development Fund",
    category: "Development Fund",
    ownership: "Barangay",
    barangay: "Lajong",
    managingOffice: "Barangay Lajong",
    legalBasis: "Barangay Lajong FY 2026 Appropriation Ordinance",
    purpose: "Implement approved barangay development projects aligned with the BDP and AIP.",
    restrictions: "Use is limited to Barangay Lajong projects included in its approved development plan.",
    active: true,
    financials: [3_450_000, 0, 1_720_000, 1_720_000],
  },
  {
    code: "BDF-POB",
    name: "Barangay Poblacion Development Fund",
    category: "Development Fund",
    ownership: "Barangay",
    barangay: "Poblacion",
    managingOffice: "Barangay Poblacion",
    legalBasis: "Barangay Poblacion FY 2026 Appropriation Ordinance",
    purpose: "Implement approved barangay development projects aligned with the BDP and AIP.",
    restrictions: "Use is limited to Barangay Poblacion projects included in its approved development plan.",
    active: false,
    financials: [3_200_000, 0, 2_400_000, 2_400_000],
  },
];

export function createFundRegistryDummyData(): {
  sources: FundSource[];
  profiles: FundFiscalProfile[];
  activities: FundRegistryActivity[];
} {
  const sources = seeds.map(({ financials: _financials, ...source }, index) => ({
    ...source,
    id: `fund-${String(index + 1).padStart(3, "0")}`,
    createdAt: "2025-10-15",
    updatedAt: index % 3 === 0 ? "2026-09-21" : "2026-09-18",
  }));
  const profiles = sources.flatMap((source, index) => {
    const current = seeds[index].financials;
    return [
      {
        id: `profile-${source.id}-2026`,
        fundSourceId: source.id,
        fiscalYear: "2026",
        appropriation: current[0],
        commitments: current[1],
        obligations: current[2],
        disbursements: current[3],
        updatedAt: "2026-09-21",
      },
      {
        id: `profile-${source.id}-2025`,
        fundSourceId: source.id,
        fiscalYear: "2025",
        appropriation: Math.round(current[0] * 0.9),
        commitments: 0,
        obligations: Math.round(current[0] * 0.72),
        disbursements: Math.round(current[0] * 0.7),
        updatedAt: "2025-12-28",
      },
    ];
  });
  const activities = sources.flatMap((source, index) => [
    {
      id: `fund-activity-${index + 1}-1`,
      fundSourceId: source.id,
      date: source.updatedAt,
      action: source.active ? "Fiscal profile updated" : "Fund source deactivated",
      actor: index % 2 ? "Municipal Budget Office" : "Municipal Treasurer's Office",
      note: !source.active
        ? "Source retained for historical reporting after year-end close."
        : "FY 2026 financial profile validated against the approved appropriation.",
    },
    {
      id: `fund-activity-${index + 1}-2`,
      fundSourceId: source.id,
      date: source.createdAt,
      action: "Fund source registered",
      actor: "Municipal Budget Office",
      note: "Governance and legal-basis details recorded in the registry.",
    },
  ]);
  return { sources, profiles, activities };
}

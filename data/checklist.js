// VR&E Approval Prep — evidence checklist. `showIf(state)` decides whether an item appears.
// The ticked count feeds readiness element 7 and the letter's supporting-documents list.

export const CHECKLIST = [
  { id: 'rating',        label: 'Your full rating decision (the narrative pages with the findings, not just the award letter)', letterName: 'rating decision', showIf: () => true },
  { id: 'records',       label: 'Medical records or provider statements that document your functional limits', letterName: 'medical records documenting my functional limits', showIf: () => true },
  { id: 'postings',      label: 'Three current job postings for your target role that show the education required', letterName: 'three current job postings', showIf: () => true },
  { id: 'onet',          label: 'The O*NET or BLS page for your target occupation (typical education for entry)', letterName: 'O*NET occupation summary', showIf: () => true },
  { id: 'resume',        label: 'Your resume', letterName: 'resume', showIf: () => true },
  { id: 'transcripts',   label: 'Transcripts from any prior education or training', letterName: 'transcripts', showIf: () => true },
  { id: 'admission',     label: 'Admission or enrollment letter for the program', letterName: 'admission or enrollment verification', showIf: () => true },
  { id: 'schoolsupport', label: "The school's written description of its disability and veteran support, or your accommodation letter", letterName: 'documentation of school accommodations and support', showIf: () => true },
  { id: 'costsheet',     label: 'Program cost sheet for every year of the plan (tuition, fees, books, supplies)', letterName: 'program cost sheet for the full plan', showIf: () => true },
  { id: 'weams',         label: 'GI Bill Comparison Tool printout showing the school and the program are VA-approved (the counselor verifies the same thing in WEAMS)', letterName: 'VA approval printout for the school and program', showIf: () => true },
  { id: 'invoices',      label: 'Invoices and payment records for terms you already completed', letterName: 'invoices for completed terms', showIf: s => s.enrolled },
  { id: 'curriculum',    label: 'Degree plan or curriculum showing the courses that remain', letterName: 'degree plan showing remaining courses', showIf: s => s.enrolled },
  { id: 'altcost',       label: "The cheaper alternative's cost and what it offers (or doesn't) for your needs", letterName: 'cost and support comparison with the lower-cost alternative', showIf: s => s.cost > 50000 || s.mode === 'cost' },
];

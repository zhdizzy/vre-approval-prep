// VR&E Approval Prep — target occupations for the letter's vocational-goal section.
// O*NET-SOC codes (2019 taxonomy) link to onetonline.org/link/summary/<code>; a wrong code shows
// itself the moment the link is opened, so every entry is checkable by the veteran.
// GS series are federal job series (OPM). Free text is always allowed; this list is a helper.
// Verified 10/1/26: all 78 O*NET codes against onetonline.org (code resolves, title matches) and all 21 GS
// series against the USAJOBS/OPM occupational-series codelist (data.usajobs.gov/api/codelist/occupationalseries).

export const OCCUPATIONS = [
  // Business, finance, analysis
  { title: 'Management Analyst', code: '13-1111.00', system: 'ONET' },
  { title: 'Project Management Specialist', code: '13-1082.00', system: 'ONET' },
  { title: 'Logistician', code: '13-1081.00', system: 'ONET' },
  { title: 'Human Resources Specialist', code: '13-1071.00', system: 'ONET' },
  { title: 'Training and Development Specialist', code: '13-1151.00', system: 'ONET' },
  { title: 'Compliance Officer', code: '13-1041.00', system: 'ONET' },
  { title: 'Accountant or Auditor', code: '13-2011.00', system: 'ONET' },
  { title: 'Financial and Investment Analyst', code: '13-2051.00', system: 'ONET' },
  { title: 'Personal Financial Advisor', code: '13-2052.00', system: 'ONET' },
  { title: 'Loan Officer', code: '13-2072.00', system: 'ONET' },
  { title: 'Market Research Analyst', code: '13-1161.00', system: 'ONET' },
  { title: 'Cost Estimator', code: '13-1051.00', system: 'ONET' },
  { title: 'Claims Adjuster or Examiner', code: '13-1031.00', system: 'ONET' },
  { title: 'Financial Manager', code: '11-3031.00', system: 'ONET' },
  { title: 'General and Operations Manager', code: '11-1021.00', system: 'ONET' },
  { title: 'Administrative Services Manager', code: '11-3012.00', system: 'ONET' },
  { title: 'Facilities Manager', code: '11-3013.00', system: 'ONET' },
  { title: 'Transportation, Storage, and Distribution Manager', code: '11-3071.00', system: 'ONET' },
  { title: 'Marketing Manager', code: '11-2021.00', system: 'ONET' },
  { title: 'Construction Manager', code: '11-9021.00', system: 'ONET' },
  { title: 'Social and Community Service Manager', code: '11-9151.00', system: 'ONET' },
  { title: 'Medical and Health Services Manager', code: '11-9111.00', system: 'ONET' },
  // Technology
  { title: 'Software Developer', code: '15-1252.00', system: 'ONET' },
  { title: 'Information Security Analyst', code: '15-1212.00', system: 'ONET' },
  { title: 'Computer Systems Analyst', code: '15-1211.00', system: 'ONET' },
  { title: 'Network and Computer Systems Administrator', code: '15-1244.00', system: 'ONET' },
  { title: 'Computer Network Architect', code: '15-1241.00', system: 'ONET' },
  { title: 'Database Administrator', code: '15-1242.00', system: 'ONET' },
  { title: 'Data Scientist', code: '15-2051.00', system: 'ONET' },
  { title: 'Operations Research Analyst', code: '15-2031.00', system: 'ONET' },
  { title: 'Computer User Support Specialist', code: '15-1232.00', system: 'ONET' },
  { title: 'Web Developer', code: '15-1254.00', system: 'ONET' },
  { title: 'Computer and Information Systems Manager', code: '11-3021.00', system: 'ONET' },
  // Healthcare
  { title: 'Registered Nurse', code: '29-1141.00', system: 'ONET' },
  { title: 'Nurse Practitioner', code: '29-1171.00', system: 'ONET' },
  { title: 'Physician Assistant', code: '29-1071.00', system: 'ONET' },
  { title: 'Physical Therapist', code: '29-1123.00', system: 'ONET' },
  { title: 'Occupational Therapist', code: '29-1122.00', system: 'ONET' },
  { title: 'Speech-Language Pathologist', code: '29-1127.00', system: 'ONET' },
  { title: 'Dietitian or Nutritionist', code: '29-1031.00', system: 'ONET' },
  { title: 'Pharmacist', code: '29-1051.00', system: 'ONET' },
  { title: 'Dental Hygienist', code: '29-1292.00', system: 'ONET' },
  { title: 'Radiologic Technologist', code: '29-2034.00', system: 'ONET' },
  { title: 'Diagnostic Medical Sonographer', code: '29-2032.00', system: 'ONET' },
  { title: 'Licensed Practical Nurse', code: '29-2061.00', system: 'ONET' },
  { title: 'Paramedic', code: '29-2043.00', system: 'ONET' },
  { title: 'Surgical Technologist', code: '29-2055.00', system: 'ONET' },
  // Counseling, social work, education
  { title: 'Mental Health Counselor', code: '21-1014.00', system: 'ONET' },
  { title: 'Substance Abuse and Behavioral Disorder Counselor', code: '21-1011.00', system: 'ONET' },
  { title: 'Healthcare Social Worker', code: '21-1022.00', system: 'ONET' },
  { title: 'Mental Health and Substance Abuse Social Worker', code: '21-1023.00', system: 'ONET' },
  { title: 'Child, Family, and School Social Worker', code: '21-1021.00', system: 'ONET' },
  { title: 'Educational, Guidance, and Career Counselor', code: '21-1012.00', system: 'ONET' },
  { title: 'Clinical and Counseling Psychologist', code: '19-3033.00', system: 'ONET' },
  { title: 'Elementary School Teacher', code: '25-2021.00', system: 'ONET' },
  { title: 'Secondary School Teacher', code: '25-2031.00', system: 'ONET' },
  { title: 'Instructional Coordinator', code: '25-9031.00', system: 'ONET' },
  // Law, public affairs
  { title: 'Lawyer', code: '23-1011.00', system: 'ONET' },
  { title: 'Paralegal or Legal Assistant', code: '23-2011.00', system: 'ONET' },
  { title: 'Public Relations Specialist', code: '27-3031.00', system: 'ONET' },
  { title: 'Technical Writer', code: '27-3042.00', system: 'ONET' },
  { title: 'Graphic Designer', code: '27-1024.00', system: 'ONET' },
  // Engineering, architecture, science
  { title: 'Civil Engineer', code: '17-2051.00', system: 'ONET' },
  { title: 'Electrical Engineer', code: '17-2071.00', system: 'ONET' },
  { title: 'Mechanical Engineer', code: '17-2141.00', system: 'ONET' },
  { title: 'Industrial Engineer', code: '17-2112.00', system: 'ONET' },
  { title: 'Aerospace Engineer', code: '17-2011.00', system: 'ONET' },
  { title: 'Architect', code: '17-1011.00', system: 'ONET' },
  { title: 'Architectural or Civil Drafter', code: '17-3011.00', system: 'ONET' },
  { title: 'Environmental Scientist', code: '19-2041.00', system: 'ONET' },
  // Trades
  { title: 'Electrician', code: '47-2111.00', system: 'ONET' },
  { title: 'Plumber, Pipefitter, or Steamfitter', code: '47-2152.00', system: 'ONET' },
  { title: 'HVAC Mechanic or Installer', code: '49-9021.00', system: 'ONET' },
  { title: 'Automotive Service Technician', code: '49-3023.00', system: 'ONET' },
  { title: 'Aircraft Mechanic or Service Technician', code: '49-3011.00', system: 'ONET' },
  { title: 'Welder, Cutter, Solderer, or Brazer', code: '51-4121.00', system: 'ONET' },
  { title: 'Heavy and Tractor-Trailer Truck Driver', code: '53-3032.00', system: 'ONET' },
  { title: 'Commercial Pilot', code: '53-2012.00', system: 'ONET' },
  // Federal job series (OPM)
  { title: 'Management and Program Analyst (federal)', code: 'GS-0343', system: 'GS' },
  { title: 'Miscellaneous Administration and Program (federal)', code: 'GS-0301', system: 'GS' },
  { title: 'General Business and Industry (federal)', code: 'GS-1101', system: 'GS' },
  { title: 'Contracting (federal)', code: 'GS-1102', system: 'GS' },
  { title: 'Financial Administration and Program (federal)', code: 'GS-0501', system: 'GS' },
  { title: 'Accounting (federal)', code: 'GS-0510', system: 'GS' },
  { title: 'Budget Analysis (federal)', code: 'GS-0560', system: 'GS' },
  { title: 'Information Technology Management (federal)', code: 'GS-2210', system: 'GS' },
  { title: 'Human Resources Management (federal)', code: 'GS-0201', system: 'GS' },
  { title: 'Security Administration (federal)', code: 'GS-0080', system: 'GS' },
  { title: 'Intelligence (federal)', code: 'GS-0132', system: 'GS' },
  { title: 'Social Work (federal)', code: 'GS-0185', system: 'GS' },
  { title: 'Nurse (federal)', code: 'GS-0610', system: 'GS' },
  { title: 'Veterans Claims Examining (federal)', code: 'GS-0996', system: 'GS' },
  { title: 'Contact Representative (federal)', code: 'GS-0962', system: 'GS' },
  { title: 'Safety and Occupational Health Management (federal)', code: 'GS-0018', system: 'GS' },
  { title: 'General Engineering (federal)', code: 'GS-0801', system: 'GS' },
  { title: 'Civil Engineering (federal)', code: 'GS-0810', system: 'GS' },
  { title: 'Public Affairs (federal)', code: 'GS-1035', system: 'GS' },
  { title: 'Realty (federal)', code: 'GS-1170', system: 'GS' },
  { title: 'Housing Management (federal)', code: 'GS-1173', system: 'GS' },
];

export function occupationUrl(o) {
  if (!o) return null;
  if (o.system === 'ONET') return `https://www.onetonline.org/link/summary/${o.code}`;
  if (o.system === 'GS') return 'https://www.opm.gov/policy-data-oversight/classification-qualifications/general-schedule-qualification-standards/';
  return null;
}

export function findOccupation(title) {
  const t = (title || '').trim().toLowerCase();
  if (!t) return null;
  return OCCUPATIONS.find(o => o.title.toLowerCase() === t) || OCCUPATIONS.find(o => o.code.toLowerCase() === t) || null;
}

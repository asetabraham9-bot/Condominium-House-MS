/**
 * Utility functions for calculating applicant scores based on CHMS criteria
 * 
 * Scoring System:
 * - Academic Level & Job Responsibility: 60%
 * - Marital Status: 10%
 * - Years of Service: 15%
 * - Disability: 15%
 * 
 * Total: 100%
 */

export interface ApplicantData {
  academicLevel: string;
  yearsOfService: number;
  jobResponsibility: string;
  maritalStatus: string;
  childrenCount: number;
  isDisabled: boolean;
  gender?: string;
}

const ACADEMIC_SCORES: Record<string, number> = {
  'Professor': 45,
  'Assistant Professor': 40,
  'PhD': 35,
  'Masters': 30,
  'Bachelor': 25,
  'Diploma': 20,
  'Certificate': 15,
};

const JOB_SCORES: Record<string, number> = {
  'Dean': 15,
  'Department Head': 13,
  'Lecturer': 11,
  'Assistant Lecturer': 9,
  'Other': 7,
};

/**
 * Calculate academic level score (max 45 points)
 */
export function calculateAcademicScore(academicLevel: string): number {
  return ACADEMIC_SCORES[academicLevel] || 0;
}

/**
 * Calculate job responsibility score (max 15 points)
 */
export function calculateJobScore(jobResponsibility: string): number {
  return JOB_SCORES[jobResponsibility] || 0;
}

/**
 * Calculate marital status score (max 10 points)
 */
export function calculateMaritalScore(maritalStatus: string, childrenCount: number): number {
  switch (maritalStatus) {
    case 'Single':
      return 1;
    case 'Married':
      return Math.min(3 + childrenCount, 10);
    case 'Divorced':
    case 'Widowed':
      return Math.min(1 + childrenCount, 10);
    default:
      return 0;
  }
}

/**
 * Calculate years of service score (max 15 points)
 * 1 point per year, capped at 15
 */
export function calculateServiceScore(years: number): number {
  return Math.min(years, 15);
}

/**
 * Calculate disability score (15 points)
 */
export function calculateDisabilityScore(isDisabled: boolean): number {
  return isDisabled ? 15 : 0;
}

/**
 * Calculate total applicant score
 */
export function calculateTotalScore(applicant: ApplicantData): number {
  const academicScore = calculateAcademicScore(applicant.academicLevel);
  const jobScore = calculateJobScore(applicant.jobResponsibility);
  const maritalScore = calculateMaritalScore(applicant.maritalStatus, applicant.childrenCount);
  const serviceScore = calculateServiceScore(applicant.yearsOfService);
  const disabilityScore = calculateDisabilityScore(applicant.isDisabled);

  return Math.round(academicScore + jobScore + maritalScore + serviceScore + disabilityScore);
}

/**
 * Get score breakdown for display purposes
 */
export function getScoreBreakdown(applicant: ApplicantData) {
  return {
    academic: {
      value: calculateAcademicScore(applicant.academicLevel),
      max: 45,
      percentage: '45%',
    },
    job: {
      value: calculateJobScore(applicant.jobResponsibility),
      max: 15,
      percentage: '15%',
    },
    marital: {
      value: calculateMaritalScore(applicant.maritalStatus, applicant.childrenCount),
      max: 10,
      percentage: '10%',
    },
    service: {
      value: calculateServiceScore(applicant.yearsOfService),
      max: 15,
      percentage: '15%',
    },
    disability: {
      value: calculateDisabilityScore(applicant.isDisabled),
      max: 15,
      percentage: '15%',
    },
    total: calculateTotalScore(applicant),
  };
}

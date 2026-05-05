/**
 * Utility functions for calculating applicant scores based on OCHMS criteria
 * 
 * Scoring System:
 * - Academic Level: 50%
 * - Years of Service: 25%
 * - Job Responsibility: 15%
 * - Marital Status: 10%
 * - Disability Bonus (Female): +10%
 */

export interface ApplicantData {
  academicLevel: string;
  yearsOfService: number;
  jobResponsibility: string;
  maritalStatus: string;
  isDisabled: boolean;
  gender?: string;
}

const ACADEMIC_SCORES: Record<string, number> = {
  'Bachelor': 25,
  'Masters': 35,
  'PhD': 45,
  'Professor': 50,
};

const JOB_SCORES: Record<string, number> = {
  'Lecturer': 10,
  'Assistant Lecturer': 8,
  'Senior Lecturer': 12,
  'Department Head': 14,
  'Dean': 15,
};

const MARITAL_SCORES: Record<string, number> = {
  'Single': 5,
  'Married': 10,
  'Divorced': 7,
  'Widowed': 7,
};

/**
 * Calculate academic level score (max 50 points)
 */
export function calculateAcademicScore(academicLevel: string): number {
  return ACADEMIC_SCORES[academicLevel] || 0;
}

/**
 * Calculate years of service score (max 25 points)
 * 2.5 points per year, capped at 25 points (10+ years)
 */
export function calculateServiceScore(years: number): number {
  return Math.min(years * 2.5, 25);
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
export function calculateMaritalScore(maritalStatus: string): number {
  return MARITAL_SCORES[maritalStatus] || 0;
}

/**
 * Calculate disability bonus (10 points for female staff)
 */
export function calculateDisabilityBonus(isDisabled: boolean, gender?: string): number {
  return isDisabled && gender === 'Female' ? 10 : 0;
}

/**
 * Calculate total applicant score
 */
export function calculateTotalScore(applicant: ApplicantData): number {
  const academicScore = calculateAcademicScore(applicant.academicLevel);
  const serviceScore = calculateServiceScore(applicant.yearsOfService);
  const jobScore = calculateJobScore(applicant.jobResponsibility);
  const maritalScore = calculateMaritalScore(applicant.maritalStatus);
  const disabilityBonus = calculateDisabilityBonus(applicant.isDisabled, applicant.gender);

  return Math.round(academicScore + serviceScore + jobScore + maritalScore + disabilityBonus);
}

/**
 * Get score breakdown for display purposes
 */
export function getScoreBreakdown(applicant: ApplicantData) {
  return {
    academic: {
      value: calculateAcademicScore(applicant.academicLevel),
      max: 50,
      percentage: '50%',
    },
    service: {
      value: calculateServiceScore(applicant.yearsOfService),
      max: 25,
      percentage: '25%',
    },
    job: {
      value: calculateJobScore(applicant.jobResponsibility),
      max: 15,
      percentage: '15%',
    },
    marital: {
      value: calculateMaritalScore(applicant.maritalStatus),
      max: 10,
      percentage: '10%',
    },
    disability: {
      value: calculateDisabilityBonus(applicant.isDisabled, applicant.gender),
      max: 10,
      percentage: '+10%',
    },
    total: calculateTotalScore(applicant),
  };
}

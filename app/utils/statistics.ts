/**
 * Statistics and analytics utility functions
 */

import { Application, Resident, Payment, House, Block } from '../context/DataContext';

/**
 * Calculate application statistics
 */
export function getApplicationStats(applications: Application[]) {
  const total = applications.length;
  const pending = applications.filter(a => a.status === 'pending').length;
  const inLottery = applications.filter(a => a.status === 'lottery').length;
  const approved = applications.filter(a => a.status === 'approved').length;
  const rejected = applications.filter(a => a.status === 'rejected').length;

  return {
    total,
    pending,
    inLottery,
    approved,
    rejected,
    averageScore: total > 0 
      ? Math.round(applications.reduce((sum, a) => sum + a.score, 0) / total)
      : 0,
  };
}

/**
 * Calculate resident statistics
 */
export function getResidentStats(residents: Resident[]) {
  const total = residents.length;
  const active = residents.filter(r => r.residenceStatus === 'active').length;
  const left = residents.filter(r => r.residenceStatus === 'left').length;

  return {
    total,
    active,
    left,
    occupancyRate: total > 0 ? Math.round((active / total) * 100) : 0,
  };
}

/**
 * Calculate payment statistics
 */
export function getPaymentStats(payments: Payment[]) {
  const total = payments.length;
  const verified = payments.filter(p => p.paymentStatus === 'verified').length;
  const pending = payments.filter(p => p.paymentStatus === 'pending').length;
  const rejected = payments.filter(p => p.paymentStatus === 'rejected').length;
  
  const totalRevenue = payments
    .filter(p => p.paymentStatus === 'verified')
    .reduce((sum, p) => sum + p.amount, 0);

  return {
    total,
    verified,
    pending,
    rejected,
    totalRevenue,
    averagePayment: verified > 0 ? Math.round(totalRevenue / verified) : 0,
  };
}

/**
 * Calculate housing statistics
 */
export function getHousingStats(houses: House[], blocks: Block[]) {
  const totalHouses = houses.length;
  const occupied = houses.filter(h => h.status === 'occupied').length;
  const available = houses.filter(h => h.status === 'available').length;
  
  const studioCount = houses.filter(h => h.houseType === 'studio').length;
  const oneBedroomCount = houses.filter(h => h.houseType === 'one_bedroom').length;
  const twoBedroomCount = houses.filter(h => h.houseType === 'two_bedroom').length;

  return {
    totalBlocks: blocks.length,
    totalHouses,
    occupied,
    available,
    occupancyRate: totalHouses > 0 ? Math.round((occupied / totalHouses) * 100) : 0,
    houseTypes: {
      studio: studioCount,
      oneBedroom: oneBedroomCount,
      twoBedroom: twoBedroomCount,
    },
  };
}

/**
 * Get monthly payment summary
 */
export function getMonthlyPaymentSummary(payments: Payment[]) {
  const monthlyData: { [key: string]: { count: number; total: number } } = {};

  payments
    .filter(p => p.paymentStatus === 'verified')
    .forEach(payment => {
      if (!monthlyData[payment.month]) {
        monthlyData[payment.month] = { count: 0, total: 0 };
      }
      monthlyData[payment.month].count++;
      monthlyData[payment.month].total += payment.amount;
    });

  return Object.entries(monthlyData)
    .map(([month, data]) => ({
      month,
      count: data.count,
      total: data.total,
    }))
    .sort((a, b) => a.month.localeCompare(b.month));
}

/**
 * Get applicant distribution by academic level
 */
export function getAcademicLevelDistribution(applications: Application[]) {
  const distribution: { [key: string]: number } = {};

  applications.forEach(app => {
    distribution[app.academicLevel] = (distribution[app.academicLevel] || 0) + 1;
  });

  return Object.entries(distribution).map(([level, count]) => ({
    level,
    count,
    percentage: Math.round((count / applications.length) * 100),
  }));
}

/**
 * Get score distribution ranges
 */
export function getScoreDistribution(applications: Application[]) {
  const ranges = [
    { min: 0, max: 25, label: '0-25' },
    { min: 26, max: 50, label: '26-50' },
    { min: 51, max: 75, label: '51-75' },
    { min: 76, max: 100, label: '76-100' },
  ];

  return ranges.map(range => ({
    label: range.label,
    count: applications.filter(
      a => a.score >= range.min && a.score <= range.max
    ).length,
  }));
}

/**
 * Get top applicants by score
 */
export function getTopApplicants(applications: Application[], limit: number = 10) {
  return [...applications]
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((app, index) => ({
      rank: index + 1,
      ...app,
    }));
}

import type { HousingCycle } from '../context/DataContext';

export interface HouseOfferingOption {
  houseType: string;
  campusId: string;
  campusName: string;
  label: string;
  value: string;
}

export function getHouseOfferingOptions(
  cycle: HousingCycle | undefined,
  fallbackCampusId?: string,
  fallbackCampusName?: string
): HouseOfferingOption[] {
  if (!cycle) return [];

  if (cycle.houseConfigurations?.length) {
    return cycle.houseConfigurations.map((hc) => ({
      houseType: hc.houseType,
      campusId: hc.campusId,
      campusName: hc.campusName ?? 'Unknown campus',
      label: `${hc.houseType} — ${hc.campusName ?? 'Unknown campus'} (${hc.monthlyPayment.toLocaleString()} ETB/mo)`,
      value: `${hc.houseType}|${hc.campusId}`,
    }));
  }

  if (cycle.houseType) {
    const campusId = cycle.campusId ?? fallbackCampusId ?? '';
    const campusName = cycle.campusName ?? fallbackCampusName ?? 'Campus';
    return [
      {
        houseType: cycle.houseType,
        campusId,
        campusName,
        label: `${cycle.houseType} — ${campusName}`,
        value: `${cycle.houseType}|${campusId}`,
      },
    ];
  }

  const defaultTypes = ['Studio', 'One Bedroom', 'Two Bedroom', 'Three Bedroom'];
  const campusId = fallbackCampusId ?? '';
  const campusName = fallbackCampusName ?? 'Your campus';
  return defaultTypes.map((type) => ({
    houseType: type,
    campusId,
    campusName,
    label: campusId ? `${type} — ${campusName}` : type,
    value: `${type}|${campusId}`,
  }));
}

export function parseOfferingValue(value: string): { houseType: string; preferredCampusId: string } {
  const [houseType, preferredCampusId = ''] = value.split('|');
  return { houseType, preferredCampusId };
}

export function houseTypesMatch(
  appliedType: string | null | undefined,
  inventoryType: string | null | undefined
): boolean {
  if (!appliedType || !inventoryType) return false;
  const normalize = (raw: string) => raw.toLowerCase().replace(/[\s_]+/g, '');
  const applied = normalize(appliedType);
  const inventory = normalize(inventoryType);
  return applied === inventory || applied.includes(inventory) || inventory.includes(applied);
}

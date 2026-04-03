import { useMemo } from 'react';
import sipaData from '../data/sipa_employment.json';
import fiscalData from '../data/dnap_fiscal.json';
import exportsByCategory from '../data/exports_by_category.json';
import exportsByDestination from '../data/exports_by_destination.json';

function matchProvince(arr, name, field = 'province') {
  if (!name) return null;
  const n = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const isCABA = n.includes('ciudad') || n === 'caba' || n === 'c.a.b.a.';
  return arr.find(item => {
    const d = (item[field] || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const dIsCABA = d.includes('ciudad') || d === 'caba';
    if (isCABA) return dIsCABA;
    if (dIsCABA) return false;
    return d === n || d.includes(n) || n.includes(d);
  });
}

export function getAllSipa() {
  return sipaData.provinces;
}

export function getAllFiscal() {
  return fiscalData.provinces;
}

export function getAllExports() {
  return exportsByCategory;
}

export function useEconomyData(provinceName) {
  return useMemo(() => {
    if (!provinceName) return { sipa: null, fiscal: null, exports: null, exportDest: null };

    const sipa = matchProvince(sipaData.provinces, provinceName);
    const fiscal = matchProvince(fiscalData.provinces, provinceName);

    const exports = exportsByCategory.filter(r => {
      const rn = r.province.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const pn = provinceName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const isCABA = pn.includes('ciudad') || pn === 'caba';
      const rIsCABA = rn.includes('ciudad') || rn === 'caba';
      if (isCABA) return rIsCABA;
      if (rIsCABA) return false;
      return rn === pn || rn.includes(pn) || pn.includes(rn);
    });

    const exportDest = exportsByDestination.filter(r => {
      const rn = r.province.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const pn = provinceName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const isCABA = pn.includes('ciudad') || pn === 'caba';
      const rIsCABA = rn.includes('ciudad') || rn === 'caba';
      if (isCABA) return rIsCABA;
      if (rIsCABA) return false;
      return rn === pn || rn.includes(pn) || pn.includes(rn);
    });

    return { sipa, fiscal, exports, exportDest };
  }, [provinceName]);
}

export { sipaData, fiscalData };

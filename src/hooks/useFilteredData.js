import { useMemo } from 'react';
import { useScope } from './useScope';

export function useFilteredData(data, facilityIdKey = 'facilityId') {
  const { isInScope } = useScope();

  return useMemo(() => {
    if (!Array.isArray(data)) return [];
    return data.filter(item => {
      const fid = item[facilityIdKey];
      // Items with no facility ID or 'all' scope are always visible
      if (!fid || fid === 'all') return true;
      return isInScope(fid);
    });
  }, [data, facilityIdKey, isInScope]);
}

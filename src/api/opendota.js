const OPENDOTA_API_URL = 'https://api.opendota.com/api';

let itemConstantsCache = null;

export const getItemConstants = async () => {
  if (itemConstantsCache) return itemConstantsCache;
  try {
    const res = await fetch(`${OPENDOTA_API_URL}/constants/items`);
    if (!res.ok) throw new Error("Failed to fetch item constants");
    const data = await res.json();
    itemConstantsCache = data;
    return data;
  } catch (err) {
    console.error(err);
    return null;
  }
};

export const getHeroItemPopularity = async (heroId) => {
  try {
    const res = await fetch(`${OPENDOTA_API_URL}/heroes/${heroId}/itemPopularity`);
    if (!res.ok) throw new Error("Failed to fetch hero popular items");
    return await res.json();
  } catch (err) {
    console.error(err);
    return null;
  }
};

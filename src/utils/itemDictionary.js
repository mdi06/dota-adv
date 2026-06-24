let itemDictionary = null;

export const fetchItemDictionary = async () => {
  if (itemDictionary) return itemDictionary;

  try {
    const response = await fetch('https://raw.githubusercontent.com/odota/dotaconstants/master/build/items.json');
    if (!response.ok) throw new Error('Failed to fetch items');
    
    const itemsData = await response.json();
    
    const map = {};
    for (const [name, details] of Object.entries(itemsData)) {
      if (details && details.id) {
        map[details.id] = name;
      }
    }
    
    itemDictionary = map;
    return itemDictionary;
  } catch (error) {
    console.error("Error fetching item dictionary:", error);
    return {};
  }
};

export const getItemNameById = (id) => {
  if (!itemDictionary) return null;
  return itemDictionary[id] || null;
};

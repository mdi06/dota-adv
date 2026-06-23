// A mapping of common spoken slang/misheard words to official hero names
const HERO_ALIASES = {
  "am": "Anti-Mage",
  "anti mage": "Anti-Mage",
  "blood sucker": "Bloodseeker",
  "cm": "Crystal Maiden",
  "crystal made in": "Crystal Maiden",
  "furion": "Nature's Prophet",
  "nature's profit": "Nature's Prophet",
  "np": "Nature's Prophet",
  "naix": "Lifestealer",
  "life stealer": "Lifestealer",
  "potm": "Mirana",
  "qop": "Queen of Pain",
  "queen of pain": "Queen of Pain",
  "sk": "Sand King",
  "wk": "Wraith King",
  "ck": "Chaos Knight",
  "dk": "Dragon Knight",
  "ta": "Templar Assassin",
  "pa": "Phantom Assassin",
  "pl": "Phantom Lancer",
  "od": "Outworld Destroyer",
  "outworld devourer": "Outworld Destroyer",
  "bs": "Bloodseeker",
  "sb": "Spirit Breaker",
  "space cow": "Spirit Breaker",
  "void": "Faceless Void",
  "faceless": "Faceless Void",
  "es": "Earthshaker", // or Earth Spirit, Ember Spirit... we'll default to Earthshaker
  "earth shaker": "Earthshaker",
  "lc": "Legion Commander",
  "bb": "Bristleback",
  "wr": "Windranger",
  "wind runner": "Windranger",
  "necro": "Necrophos",
  "witch doctor": "Witch Doctor",
  "wd": "Witch Doctor",
  "ss": "Shadow Shaman",
  "rhasta": "Shadow Shaman",
  "bara": "Spirit Breaker",
  "magina": "Anti-Mage",
  "centaur": "Centaur Warrunner",
  "clock": "Clockwerk",
  "doom bringer": "Doom",
  "treant": "Treant Protector",
  "io": "Io",
  "wisp": "Io",
  "cent": "Centaur Warrunner",
  "timber": "Timbersaw",
  "bristle": "Bristleback",
  "tusk": "Tusk",
  "legion": "Legion Commander",
  "monkey": "Monkey King",
  "mk": "Monkey King",
  "vladimir": "Abaddon", 
  "abba": "Abaddon",
  "under lord": "Underlord",
  "pit lord": "Underlord"
};

// Normalize text for comparison
const normalize = (text) => text.toLowerCase().replace(/[^a-z0-9 ]/g, "").trim();

export const parseVoiceCommand = (transcript, heroes) => {
  // Normalize by removing punctuation but keeping spaces to avoid false positives like "legIOn"
  const normText = transcript.toLowerCase().replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
  const squishedText = transcript.toLowerCase().replace(/[^a-z0-9]/g, "");
  
  let team = 'dire'; // Default to enemy team for quick push-to-talk

  if (normText.includes("we picked") || normText.includes("radiant picked") || normText.includes("i picked") || normText.includes("we got")) {
    team = 'radiant';
  }

  // 1. Check Aliases
  for (const [alias, officialName] of Object.entries(HERO_ALIASES)) {
    // If the alias is at least 3 letters, we can squish to match things like "antimage"
    if (alias.length >= 3) {
       const squishedAlias = alias.replace(/[^a-z0-9]/g, "");
       if (squishedText.includes(squishedAlias)) {
         const match = heroes.find(h => h.localized_name === officialName);
         if (match) return { team, hero: match };
       }
    } else {
       // For short aliases like "am", "io", "cm", strictly check word boundaries
       const regex = new RegExp(`\\b${alias}\\b`, 'i');
       if (regex.test(normText)) {
         const match = heroes.find(h => h.localized_name === officialName);
         if (match) return { team, hero: match };
       }
    }
  }

  // 2. Check Official Hero Names
  // Sort by length descending so "Phantom Assassin" matches before "Phantom Lancer" (if they say both?)
  // Actually, so "Earth Spirit" is checked before "Earthshaker" isn't relevant, but "Troll Warlord" before "Troll"
  const sortedHeroes = [...heroes].sort((a, b) => b.localized_name.length - a.localized_name.length);
  
  for (const h of sortedHeroes) {
    const nameNorm = h.localized_name.toLowerCase().replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
    if (normText.includes(nameNorm)) {
      return { team, hero: h };
    }
    
    // Fallback: squished check for long names (to catch "antimage" instead of "anti mage")
    if (h.localized_name.length > 5) {
      const nameSquish = h.localized_name.toLowerCase().replace(/[^a-z0-9]/g, "");
      if (squishedText.includes(nameSquish)) {
        return { team, hero: h };
      }
    }
  }

  return null;
};

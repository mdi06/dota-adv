const STRATZ_API_URL = 'http://localhost:3001/api/stratz';

const query = `
  query {
    heroStats {
      itemBuilds(heroId: 1) {
        matchCount
        winCount
        item0Id
        item1Id
        item2Id
        item3Id
        item4Id
        item5Id
      }
    }
  }
`;

async function run() {
  const response = await fetch(STRATZ_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query })
  });
  
  const text = await response.text();
  console.log('STATUS:', response.status);
  console.log('BODY:', text.substring(0, 500));
}

run();

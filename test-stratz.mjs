const STRATZ_API_URL = 'https://api.stratz.com/graphql';
const apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJTdWJqZWN0IjoiNzliMjJkM2ItNzkzZi00ZGExLWJiYmItYmQxMTY0MzcyZDQ2IiwiU3RlYW1JZCI6IjE3NDU5MzYxNSIsIkFQSVVzZXIiOiJ0cnVlIiwibmJmIjoxNzgyMTI1ODU2LCJleHAiOjE4MTM2NjE4NTYsImlhdCI6MTc4MjEyNTg1NiwiaXNzIjoiaHR0cHM6Ly9hcGkuc3RyYXR6LmNvbSJ9.T6G_qd_6ZDV2W_8Sx7nUL3ZNaD6UDi0tG6Lq2HXtCew';

const query = `
  query {
    __schema {
      queryType {
        fields {
          name
        }
      }
    }
  }
`;

async function run() {
  const response = await fetch(STRATZ_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    },
    body: JSON.stringify({ query })
  });
  
  const text = await response.text();
  console.log('STATUS:', response.status);
  console.log('BODY:', text.substring(0, 500));
}

run();

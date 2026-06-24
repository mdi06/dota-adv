const url = 'https://api.stratz.com/graphql';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJTdWJqZWN0IjoiNzliMjJkM2ItNzkzZi00ZGExLWJiYmItYmQxMTY0MzcyZDQ2IiwiU3RlYW1JZCI6IjE3NDU5MzYxNSIsIkFQSVVzZXIiOiJ0cnVlIiwibmJmIjoxNzgyMTI1ODU2LCJleHAiOjE4MTM2NjE4NTYsImlhdCI6MTc4MjEyNTg1NiwiaXNzIjoiaHR0cHM6Ly9hcGkuc3RyYXR6LmNvbSJ9.T6G_qd_6ZDV2W_8Sx7nUL3ZNaD6UDi0tG6Lq2HXtCew';

const query = `
query {
  __type(name: "HeroDryadType") {
    name
  }
}
`;

fetch(url, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${key}`,
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  },
  body: JSON.stringify({ query })
})
.then(r => r.text())
.then(d => console.log(d.substring(0, 500)))
.catch(e => console.error(e));

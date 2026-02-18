
import http from 'http';

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/plantilla?is_vacant=true',
  method: 'GET',
};

const req = http.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      if (json.success && json.positions) {
        console.log('Total Vacant Positions:', json.positions.length);
        console.table(json.positions.map(p => ({
          'Item No': p.item_number,
          'Position': p.position_title,
          'Department': p.department,
          'Salary Grade': p.salary_grade,
          'Monthly Salary': p.monthly_salary
        })));
      } else {
        console.log('Failed to fetch:', json);
      }
    } catch (e) {
      console.error('Error parsing response:', e);
      console.log('Raw data:', data);
    }
  });
});

req.on('error', (error) => {
  console.error('Error:', error);
});

req.end();

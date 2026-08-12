import axios from 'axios';
import https from 'https';

const agent = new https.Agent({ rejectUnauthorized: false });

const API_URL = 'https://www.djsiseol.or.kr/res/rest/facilities/place_time_state_list';

// Test 1: Call API directly WITHOUT session cookie (pure axios)
console.log('=== TEST 1: Direct axios call (no session) ===');
try {
  const res = await axios.post(API_URL, 
    new URLSearchParams({
      company_code: 'DJSISEOL11',
      group_cd: '',
      part_code: '01',
      place_code: '1',
      base_date: '20260813',
      rent_type: '1001',
      mem_no: ''
    }).toString(),
    {
      httpsAgent: agent,
      timeout: 8000,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://www.djsiseol.or.kr/res/www/121',
        'Origin': 'https://www.djsiseol.or.kr'
      }
    }
  );
  console.log('Status:', res.status);
  console.log('Content-Type:', res.headers['content-type']);
  console.log('Response (first 1000):', JSON.stringify(res.data).substring(0, 1000));
  
  if (Array.isArray(res.data)) {
    console.log('\nTotal slots returned:', res.data.length);
    console.log('All unique use_yn values:', [...new Set(res.data.map(d => d.use_yn))]);
    console.log('First slot:', JSON.stringify(res.data[0], null, 2));
  }
} catch(e) {
  console.log('ERROR:', e.response?.status, e.message.substring(0, 200));
}

// Test 2: Call for Aug 31 (예약가능 date) to see what available slot looks like
console.log('\n=== TEST 2: Aug 31 court 4 (예약가능 date) ===');
try {
  const res = await axios.post(API_URL,
    new URLSearchParams({
      company_code: 'DJSISEOL11',
      group_cd: '',
      part_code: '01',
      place_code: '4',
      base_date: '20260831',
      rent_type: '1001',
      mem_no: ''
    }).toString(),
    {
      httpsAgent: agent,
      timeout: 8000,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://www.djsiseol.or.kr/res/www/121',
        'Origin': 'https://www.djsiseol.or.kr'
      }
    }
  );
  console.log('Status:', res.status);
  if (Array.isArray(res.data)) {
    console.log('Slots returned:', res.data.length);
    console.log('use_yn values:', res.data.map(d => `${d.start_time}~${d.end_time}:${d.use_yn}`));
    const unique = [...new Set(res.data.map(d => d.use_yn))];
    console.log('Unique use_yn:', unique);
    // Show any slot that is NOT "E"
    const interesting = res.data.filter(d => d.use_yn !== 'E');
    if (interesting.length > 0) {
      console.log('⭐ Non-E slots (available?):');
      interesting.forEach(s => console.log(JSON.stringify(s, null, 2)));
    }
  }
} catch(e) {
  console.log('ERROR:', e.response?.status, e.message.substring(0, 200));
}

// Test 3: month state list (checks date-level availability)
console.log('\n=== TEST 3: place_month_state_list ===');
try {
  const res = await axios.post(
    'https://www.djsiseol.or.kr/res/rest/facilities/place_month_state_list',
    new URLSearchParams({
      company_code: 'DJSISEOL11',
      group_cd: '',
      part_code: '01',
      place_code: '1',
      base_date: '20260813',
      rent_type: '1001',
      mem_no: ''
    }).toString(),
    {
      httpsAgent: agent, timeout: 8000,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://www.djsiseol.or.kr/res/www/121',
        'Origin': 'https://www.djsiseol.or.kr'
      }
    }
  );
  console.log('Status:', res.status);
  if (Array.isArray(res.data)) {
    console.log('Sample:', JSON.stringify(res.data.slice(0, 3), null, 2));
    // Find dates that are NOT fully reserved
    const available = res.data.filter(d => d.state_cd !== '20' && d.state_cd !== undefined);
    console.log('Non-마감 dates:', available);
  } else {
    console.log('Response:', JSON.stringify(res.data).substring(0, 500));
  }
} catch(e) {
  console.log('ERROR:', e.response?.status, e.message.substring(0, 200));
}

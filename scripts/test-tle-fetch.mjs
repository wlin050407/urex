const CELESTRAK_URL = 'https://celestrak.org/NORAD/elements/gp.php?CATNR=56309&FORMAT=TLE';

async function testTLEFetch() {
  try {
    console.log('Testing TLE fetch for NORAD 56309...');
    const response = await fetch(CELESTRAK_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; SatelliteApp/1.0)',
        'Accept': 'text/plain',
      },
      mode: 'cors'
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const text = await response.text();
    console.log('Raw response:');
    console.log(text);
    
    const lines = text.trim().split('\n');
    console.log(`Lines count: ${lines.length}`);
    
    if (lines.length >= 3) {
      console.log('Name:', lines[0].trim());
      console.log('Line1:', lines[1].trim());
      console.log('Line2:', lines[2].trim());
    } else {
      console.error('Unexpected response format');
    }
    
  } catch (error) {
    console.error('TLE fetch failed:', error);
  }
}

testTLEFetch();

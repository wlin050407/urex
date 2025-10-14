const CELESTRAK_GP_URL = 'https://celestrak.org/NORAD/elements/gp.php?CATNR=56309&FORMAT=TLE';

async function ensureFetch() {
  if (typeof fetch !== 'undefined') return fetch;
  const mod = await import('node-fetch');
  return mod.default;
}

async function main() {
  try {
    const f = await ensureFetch();
    const res = await f(CELESTRAK_GP_URL);
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} ${res.statusText}`);
    }
    const text = (await res.text()).trim();
    console.log('TLE for NORAD 56309:');
    console.log(text);

    const lines = text.split('\n');
    if (lines.length >= 3) {
      const [name, line1, line2] = lines;
      console.log('\nParsed:');
      console.log('Name  :', name.trim());
      console.log('Line1 :', line1.trim());
      console.log('Line2 :', line2.trim());
    }
  } catch (err) {
    console.error('Failed to fetch/print TLE for 56309:', err);
    process.exitCode = 1;
  }
}

main();



import * as THREE from "three";

const DEG = Math.PI / 180;

const jd  = (d: Date) => d.getTime() / 86400000 + 2440587.5;
const T   = (J: number) => (J - 2451545.0) / 36525;
const sod = (d: Date) =>
  d.getUTCHours() * 3600 +
  d.getUTCMinutes() * 60 +
  d.getUTCSeconds() +
  d.getUTCMilliseconds() / 1000;

// mean obliquity (of date)
export function obliquityOfDate(t: number) {
  const epsDeg =
    (23 + 26/60 + 21.448/3600) -
    (46.8150/3600) * t -
    (0.00059/3600) * t * t +
    (0.001813/3600) * t * t * t;
  return epsDeg * DEG;
}

// true ecliptic longitude (for realistic seasons)
export function trueEclipticLongitude(date: Date) {
  const J = jd(date), t = T(J);
  let L0 = 280.46646 + 36000.76983 * t + 0.0003032 * t * t; L0 = ((L0 % 360) + 360) % 360;
  const M  = 357.52911 + 35999.05029 * t - 0.0001537 * t * t;
  const Mr = M * DEG;
  const C = (1.914602 - 0.004817 * t - 0.000014 * t * t) * Math.sin(Mr)
          + (0.019993 - 0.000101 * t)                * Math.sin(2 * Mr)
          + 0.000290                                  * Math.sin(3 * Mr);
  return (L0 + C) * DEG;
}

// Greenwich Mean Sidereal Time (radians)
export function gmst(date: Date) {
  const J = jd(date), t = T(J);
  let th = 280.46061837
         + 360.98564736629 * (J - 2451545.0)
         + 0.000387933 * t * t
         - (t * t * t) / 38710000;
  th = ((th % 360) + 360) % 360;
  return th * DEG;
}

/**
 * STRICT 24H SUN in ECI:
 * - Declination from the true Sun (realistic seasons)
 * - Hour angle advances exactly 360° per UTC day (no equation-of-time drift)
 * - phaseRad = -π makes Greenwich transit ≈ 12:00 UTC
 */
export function sunECI_mean(date: Date, phaseRad = -Math.PI): THREE.Vector3 {
  const t    = T(jd(date));
  const eps  = obliquityOfDate(t);
  const lam  = trueEclipticLongitude(date);
  const delt = Math.asin(Math.sin(eps) * Math.sin(lam)); // declination

  const theta  = gmst(date);         // GMST
  const u      = sod(date) / 86400;  // UTC fraction of day
  const Hmean  = 2 * Math.PI * u + phaseRad;      // mean hour angle
  const alpha  = theta - Hmean;      // choose RA so H = theta - alpha = Hmean

  return new THREE.Vector3(
    Math.cos(delt) * Math.cos(alpha),
    Math.cos(delt) * Math.sin(alpha),
    Math.sin(delt)
  ).normalize();
}

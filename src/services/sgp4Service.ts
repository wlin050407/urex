/**
 * SGP4 propagation service using satellite.js
 * Flow: TLE -> SGP4 -> ECI/ECF/Geodetic
 */

import * as satellite from 'satellite.js';
import { TLEData, getTargetSatelliteTLE, TARGET_NORAD_ID } from './celestrakService';

export interface EciState {
  positionKm: [number, number, number];
  velocityKmPerSec: [number, number, number];
  timestamp: Date;
}

export interface EcfState {
  positionKm: [number, number, number];
  velocityKmPerSec?: [number, number, number];
  timestamp: Date;
}

export interface GeodeticState {
  latitudeDeg: number;
  longitudeDeg: number;
  altitudeKm: number;
  timestamp: Date;
}

/**
 * Create satrec from TLE
 */
export function createSatrecFromTLE(tle: Pick<TLEData, 'line1' | 'line2'>) {
  return satellite.twoline2satrec(tle.line1, tle.line2);
}

/**
 * Propagate to a time, returning ECI position/velocity (km, km/s)
 */
export function propagateECI(tle: Pick<TLEData, 'line1' | 'line2'>, when: Date): EciState {
  const satrec = createSatrecFromTLE(tle);
  const pv = satellite.propagate(satrec, when);

  if (!pv || !pv.position || !pv.velocity) {
    throw new Error('Propagation failed: empty position/velocity');
  }

  const { x: xKm, y: yKm, z: zKm } = pv.position;
  const { x: vxKmS, y: vyKmS, z: vzKmS } = pv.velocity;

  return {
    positionKm: [xKm, yKm, zKm],
    velocityKmPerSec: [vxKmS, vyKmS, vzKmS],
    timestamp: when
  };
}

/**
 * Convert ECI to ECF at a given time
 */
export function eciToEcf(eci: EciState): EcfState {
  const gmst = satellite.gstime(eci.timestamp);
  const ecf = satellite.eciToEcf({ x: eci.positionKm[0], y: eci.positionKm[1], z: eci.positionKm[2] }, gmst);

  return {
    positionKm: [ecf.x, ecf.y, ecf.z],
    timestamp: eci.timestamp
  };
}

/**
 * Convert ECF to geodetic (lat, lon in degrees; alt in km)
 */
export function ecfToGeodetic(ecf: EcfState): GeodeticState {
  const gmst = satellite.gstime(ecf.timestamp);
  // satellite.ecefToGeodetic expects ECEF (meters) normally, but satellite.js ECF/ECI are in km.
  // Its TypeScript types accept km; the implementation uses WGS84 constants in km as well.
  const geodetic = satellite.eciToGeodetic({ x: ecf.positionKm[0], y: ecf.positionKm[1], z: ecf.positionKm[2] }, gmst);

  return {
    latitudeDeg: satellite.degreesLat(geodetic.latitude),
    longitudeDeg: satellite.degreesLong(geodetic.longitude),
    altitudeKm: geodetic.height,
    timestamp: ecf.timestamp
  };
}

/**
 * Convenience: TLE -> geodetic position at time
 */
export function tleToGeodetic(tle: Pick<TLEData, 'line1' | 'line2'>, when: Date): { eci: EciState; ecf: EcfState; geo: GeodeticState } {
  const eci = propagateECI(tle, when);
  const ecf = eciToEcf(eci);
  const geo = ecfToGeodetic(ecf);
  return { eci, ecf, geo };
}

/**
 * Fetch TLE for target NORAD and return current geodetic position
 */
export async function getCurrentTargetGeodetic(): Promise<{ noradId: string; geo: GeodeticState } | null> {
  const tle = await getTargetSatelliteTLE();
  if (!tle) return null;
  const now = new Date();
  const { geo } = tleToGeodetic(tle, now);
  return { noradId: TARGET_NORAD_ID, geo };
}

export default {
  createSatrecFromTLE,
  propagateECI,
  eciToEcf,
  ecfToGeodetic,
  tleToGeodetic,
  getCurrentTargetGeodetic
};



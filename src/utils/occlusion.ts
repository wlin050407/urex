import * as THREE from 'three'

/**
 * Check if the line segment from camera to target intersects a sphere centered at origin
 * with given radius. If it does, the target is occluded by the sphere (Earth).
 */
export function isOccludedByEarth(
  cameraPos: THREE.Vector3,
  targetPos: THREE.Vector3,
  earthRadius: number
): boolean {
  // Ray: P(t) = C + t*(S - C), t in [0,1]
  const C = cameraPos
  const S = targetPos
  const d = new THREE.Vector3().subVectors(S, C)

  // Sphere at origin: |P(t)|^2 = R^2
  // Solve |C + t d|^2 = R^2 => (d·d)t^2 + 2(C·d)t + (C·C - R^2) = 0
  const a = d.dot(d)
  const b = 2 * C.dot(d)
  const c = C.dot(C) - earthRadius * earthRadius

  // Discriminant
  const D = b * b - 4 * a * c
  if (D < 0) return false // no intersection

  const sqrtD = Math.sqrt(D)
  const t1 = (-b - sqrtD) / (2 * a)
  const t2 = (-b + sqrtD) / (2 * a)

  // Intersection occurs on segment if either t in [0,1]
  const intersectsSegment = (t1 >= 0 && t1 <= 1) || (t2 >= 0 && t2 <= 1)
  return intersectsSegment
}




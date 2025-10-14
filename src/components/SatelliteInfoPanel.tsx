import React, { useState, useEffect, useMemo } from 'react'
import { useAppStore } from '../store/appStore'
import { useTranslation } from '../i18n/useTranslation'
import { getFamousSatellitesTLE, TLEData } from '../services/celestrakService'
import * as satellite from 'satellite.js'

// Satellite data interface matching the spec
interface SatelliteData {
  id: string
  name: string
  altitudeKm: number
  inclinationDeg: number
  eccentricity: number
  orbitPeriodMin: number
  meanMotion: number
  velocityKmPerSec: number
  latDeg: number
  lonDeg: number
  modelUrl?: string | null
  status?: 'online' | 'offline'
}

// Globe icon component for model placeholder
const GlobeIcon: React.FC<{ size?: number }> = ({ size = 80 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
)

// Star icon component for favorites
const StarIcon: React.FC<{ filled?: boolean; onClick?: () => void; size?: number }> = ({ 
  filled = false, 
  onClick, 
  size = 16 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill={filled ? '#fbbf24' : 'none'} 
    stroke={filled ? '#fbbf24' : '#9ca3af'}
    strokeWidth="2"
    onClick={onClick}
    style={{ cursor: 'pointer', transition: 'all 0.2s ease' }}
  >
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>
)

const SatelliteInfoPanel: React.FC = () => {
  const { t } = useTranslation()
  const { 
    selectedSatellite,
    setSelectedSatellite,
    favoriteSatellites,
    toggleFavorite,
    setFocusedSatellite,
    setFollowedSatellite,
    followedSatellite,
    toggleOrbitVisibility,
    visibleOrbits,
    getCurrentEffectiveTime
  } = useAppStore()

  const [searchQuery, setSearchQuery] = useState('')
  const [satellites, setSatellites] = useState<Record<string, SatelliteData>>({})
  const [tleData, setTleData] = useState<Record<string, TLEData>>({})
  const [loading, setLoading] = useState(true)

  // Fetch satellite TLE data
  useEffect(() => {
    const fetchSatelliteData = async () => {
      setLoading(true)
      try {
        const tleResults = await getFamousSatellitesTLE()
        setTleData(tleResults as Record<string, TLEData>)
        
        // Convert TLE data to satellite data
        const satelliteData: Record<string, SatelliteData> = {}
        Object.entries(tleResults).forEach(([key, tle]) => {
          if (tle) {
            satelliteData[key] = convertTLEToSatelliteData(tle)
          }
        })
        setSatellites(satelliteData)
      } catch (error) {
        console.error('Failed to fetch satellite data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchSatelliteData()
    // Refresh every 5 minutes
    const interval = setInterval(fetchSatelliteData, 300000)
    return () => clearInterval(interval)
  }, [])

  // Update real-time positions
  useEffect(() => {
    if (Object.keys(tleData).length === 0) return

    const updatePositions = () => {
      const currentTime = getCurrentEffectiveTime()
      const updatedSatellites: Record<string, SatelliteData> = {}

      Object.entries(tleData).forEach(([key, tle]) => {
        if (tle) {
          const satData = calculateRealTimeData(tle, currentTime)
          updatedSatellites[key] = satData
        }
      })

      setSatellites(updatedSatellites)
    }

    updatePositions()
    // Update every second
    const interval = setInterval(updatePositions, 1000)
    return () => clearInterval(interval)
  }, [tleData, getCurrentEffectiveTime])

  // Convert TLE to satellite data
  const convertTLEToSatelliteData = (tle: TLEData): SatelliteData => {
    const periodMin = (1440 / tle.meanMotion) // Minutes per orbit
    const altitudeKm = calculateAltitude(tle.meanMotion)
    
    return {
      id: tle.satelliteId,
      name: tle.name,
      altitudeKm,
      inclinationDeg: tle.inclination,
      eccentricity: tle.eccentricity,
      orbitPeriodMin: periodMin,
      meanMotion: tle.meanMotion,
      velocityKmPerSec: 0,
      latDeg: 0,
      lonDeg: 0,
      status: 'online',
      modelUrl: null
    }
  }

  // Calculate altitude from mean motion
  const calculateAltitude = (meanMotion: number): number => {
    const EARTH_RADIUS = 6378.137 // km
    const MU = 398600.4418 // km^3/s^2
    const period = (86400 / meanMotion) // seconds per orbit
    const a = Math.pow((MU * Math.pow(period / (2 * Math.PI), 2)), 1/3)
    return a - EARTH_RADIUS
  }

  // Calculate real-time position data
  const calculateRealTimeData = (tle: TLEData, time: Date): SatelliteData => {
    try {
      const satrec = satellite.twoline2satrec(tle.line1, tle.line2)
      const positionAndVelocity = satellite.propagate(satrec, time)

      if (positionAndVelocity.position && typeof positionAndVelocity.position !== 'boolean') {
        const positionEci = positionAndVelocity.position
        const gmst = satellite.gstime(time)
        const positionGd = satellite.eciToGeodetic(positionEci, gmst)

        let velocity = 0
        if (positionAndVelocity.velocity && typeof positionAndVelocity.velocity !== 'boolean') {
          const vel = positionAndVelocity.velocity
          velocity = Math.sqrt(vel.x * vel.x + vel.y * vel.y + vel.z * vel.z)
        }

        return {
          id: tle.satelliteId,
          name: tle.name,
          altitudeKm: positionGd.height,
          inclinationDeg: tle.inclination,
          eccentricity: tle.eccentricity,
          orbitPeriodMin: 1440 / tle.meanMotion,
          meanMotion: tle.meanMotion,
          velocityKmPerSec: velocity,
          latDeg: positionGd.latitude * (180 / Math.PI),
          lonDeg: positionGd.longitude * (180 / Math.PI),
          status: 'online',
          modelUrl: null
        }
      }
    } catch (error) {
      console.error('Error calculating real-time data:', error)
    }

    return convertTLEToSatelliteData(tle)
  }

  // Filter satellites based on search query
  const filteredSatellites = useMemo(() => {
    const query = searchQuery.toLowerCase().trim()
    if (!query) return Object.entries(satellites)

    return Object.entries(satellites).filter(([key, sat]) => 
      sat.name.toLowerCase().includes(query) ||
      sat.id.toLowerCase().includes(query) ||
      key.toLowerCase().includes(query)
    )
  }, [satellites, searchQuery])

  // Get favorite satellites
  const favoriteSatellitesList = useMemo(() => {
    return favoriteSatellites
      .map(id => {
        const entry = Object.entries(satellites).find(([key, sat]) => 
          sat.id === id || key === id
        )
        return entry ? { key: entry[0], data: entry[1] } : null
      })
      .filter(Boolean) as { key: string; data: SatelliteData }[]
  }, [favoriteSatellites, satellites])

  // Get selected satellite data
  const selectedSatData = useMemo(() => {
    if (!selectedSatellite) return null
    const entry = Object.entries(satellites).find(([key, sat]) => 
      sat.id === selectedSatellite || key === selectedSatellite
    )
    return entry ? { key: entry[0], data: entry[1] } : null
  }, [selectedSatellite, satellites])

  // Check if satellite is favorited
  const isFavorited = (id: string) => {
    return favoriteSatellites.includes(id)
  }

  // Handle satellite selection
  const handleSelectSatellite = (key: string, sat: SatelliteData) => {
    setSelectedSatellite(key)
  }

  // Handle focus action
  const handleFocus = () => {
    if (selectedSatellite) {
      setFocusedSatellite(selectedSatellite)
      // TODO: Implement actual camera focus logic in 3D scene
      console.log('Focus on satellite:', selectedSatellite)
    }
  }

  // Handle follow action
  const handleFollow = () => {
    if (selectedSatellite) {
      const isCurrentlyFollowing = followedSatellite === selectedSatellite
      setFollowedSatellite(isCurrentlyFollowing ? null : selectedSatellite)
      // TODO: Implement actual camera follow logic in 3D scene
      console.log('Follow satellite:', selectedSatellite, !isCurrentlyFollowing)
    }
  }

  // Handle toggle orbit
  const handleToggleOrbit = () => {
    if (selectedSatellite) {
      toggleOrbitVisibility(selectedSatellite)
      console.log('Toggle orbit for:', selectedSatellite)
    }
  }

  return (
    <div className="satellite-info-panel-new">
      {/* Header */}
      <div className="panel-header-new">
        <h3>{t.satelliteInfo}</h3>
      </div>

      <div className="panel-content-new">
        {/* Search Bar Section */}
        <div className="search-bar-section">
          <h4 className="section-title">{t.searchSatellites}</h4>
          <input
            type="text"
            className="satellite-search-input"
            placeholder={t.searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Favorites Section - Always visible with title */}
        <div className="favorites-section">
          <h4>{t.favorite}</h4>
          {favoriteSatellitesList.length > 0 ? (
            <div className="favorites-list">
              {favoriteSatellitesList.map(({ key, data }) => (
                <div
                  key={key}
                  className={`satellite-item ${selectedSatellite === key ? 'selected' : ''}`}
                  onClick={() => handleSelectSatellite(key, data)}
                >
                  <span className="satellite-name">{data.name}</span>
                  <StarIcon
                    filled={true}
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleFavorite(key)
                    }}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="no-favorites-state">{t.noFavorites}</div>
          )}
        </div>

        {/* Satellite List - Quick Select */}
        <div className="satellite-list-section">
          <h4>{t.quickSelect}</h4>
          {loading ? (
            <div className="loading-state">{t.loading}</div>
          ) : filteredSatellites.length === 0 ? (
            <div className="no-results">{t.noResults}</div>
          ) : (
            <div className="satellite-list">
              {filteredSatellites.map(([key, sat]) => (
                <div
                  key={key}
                  className={`satellite-item ${selectedSatellite === key ? 'selected' : ''}`}
                  onClick={() => handleSelectSatellite(key, sat)}
                >
                  <span className="satellite-name">{sat.name}</span>
                  <StarIcon
                    filled={isFavorited(key)}
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleFavorite(key)
                    }}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Satellite Details */}
        {selectedSatData && (
          <div className="satellite-details-section">
            <div className="details-header">
              <h3>{selectedSatData.data.name}</h3>
              <span className={`status-badge ${selectedSatData.data.status}`}>
                {selectedSatData.data.status === 'online' ? t.online : t.offline}
              </span>
            </div>

            {/* Model Preview */}
            <div className="model-preview-container">
              <div className="model-preview-label">{t.modelPreview}</div>
              <div className="model-preview-box">
                {selectedSatData.data.modelUrl ? (
                  <div className="model-3d-viewer">
                    {/* TODO: Integrate 3D model viewer */}
                    <div>{t.noModel}</div>
                  </div>
                ) : (
                  <div className="model-placeholder">
                    <GlobeIcon size={60} />
                    <div className="placeholder-text">{t.noModel}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Orbital Parameters */}
            <div className="parameters-section">
              <h4>{t.orbitalParameters}</h4>
              <div className="parameters-grid">
                <div className="param-item">
                  <span className="param-label">{t.altitudeKm}</span>
                  <span className="param-value">{selectedSatData.data.altitudeKm.toFixed(2)}</span>
                </div>
                <div className="param-item">
                  <span className="param-label">{t.inclinationDeg}</span>
                  <span className="param-value">{selectedSatData.data.inclinationDeg.toFixed(2)}</span>
                </div>
                <div className="param-item">
                  <span className="param-label">{t.eccentricityValue}</span>
                  <span className="param-value">{selectedSatData.data.eccentricity.toFixed(6)}</span>
                </div>
                <div className="param-item">
                  <span className="param-label">{t.orbitPeriodMin}</span>
                  <span className="param-value">{selectedSatData.data.orbitPeriodMin.toFixed(2)}</span>
                </div>
                <div className="param-item">
                  <span className="param-label">{t.meanMotionRevDay}</span>
                  <span className="param-value">{selectedSatData.data.meanMotion.toFixed(4)}</span>
                </div>
              </div>
            </div>

            {/* Real-time Data */}
            <div className="parameters-section">
              <h4>{t.realTimeData}</h4>
              <div className="parameters-grid">
                <div className="param-item">
                  <span className="param-label">{t.velocityKmSec}</span>
                  <span className="param-value">{selectedSatData.data.velocityKmPerSec.toFixed(2)}</span>
                </div>
                <div className="param-item">
                  <span className="param-label">{t.latitude}</span>
                  <span className="param-value">{selectedSatData.data.latDeg.toFixed(4)}</span>
                </div>
                <div className="param-item">
                  <span className="param-label">{t.longitude}</span>
                  <span className="param-value">{selectedSatData.data.lonDeg.toFixed(4)}</span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="quick-actions-section">
              <h4>{t.quickActions}</h4>
              <div className="action-buttons">
                <button className="action-btn focus-btn" onClick={handleFocus}>
                  {t.focus}
                </button>
                <button 
                  className={`action-btn follow-btn ${followedSatellite === selectedSatellite ? 'active' : ''}`}
                  onClick={handleFollow}
                >
                  {followedSatellite === selectedSatellite ? '✓ ' : ''}{t.follow}
                </button>
                <button 
                  className={`action-btn orbit-btn ${visibleOrbits.includes(selectedSatellite) ? 'active' : ''}`}
                  onClick={handleToggleOrbit}
                >
                  {t.toggleOrbit}
                </button>
              </div>
            </div>
          </div>
        )}

        {!selectedSatData && !loading && (
          <div className="no-selection-state">
            <GlobeIcon size={100} />
            <p>{t.noSatelliteSelected}</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default SatelliteInfoPanel

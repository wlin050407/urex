import React, { useState } from 'react'
import { useAppStore } from '../store/appStore'
import { useTranslation } from '../i18n/useTranslation'

const GroundStationPanel: React.FC = () => {
  const { t } = useTranslation()
  const { selectedGroundStation, setSelectedGroundStation } = useAppStore()
  const [command, setCommand] = useState('')
  
  const groundStations = [
    { id: 'singapore', name: t.singaporeStation, status: 'active', lat: 1.3521, lng: 103.8198 },
    { id: 'kennedy', name: t.kennedyStation, status: 'active', lat: 28.5721, lng: -80.6041 },
    { id: 'beijing', name: t.beijingStation, status: 'active', lat: 39.9042, lng: 116.4074 },
  ]

  const telemetryData = [
    { parameter: t.powerVoltage, value: '28.4V', status: t.normal },
    { parameter: t.temperature, value: '23.5°C', status: t.normal },
    { parameter: t.signalStrength, value: '-85dBm', status: t.good },
    { parameter: t.dataRate, value: '2.048 Mbps', status: t.normal }
  ]

  const handleSendCommand = () => {
    if (command.trim() && selectedGroundStation) {
      alert(`${t.commandSent}:\n${command}`)
      setCommand('')
    }
  }

  const selectedStationData = groundStations.find(s => s.id === selectedGroundStation)

  return (
    <>
      <div className="control-group">
        <label>{t.selectGroundStation}</label>
        <select 
          value={selectedGroundStation || ''}
          onChange={(e) => {
            setSelectedGroundStation(e.target.value)
          }}
        >
          <option value="">{t.pleaseSelectGroundStation}</option>
          {groundStations.map((station) => (
            <option key={station.id} value={station.id}>{station.name}</option>
          ))}
        </select>
      </div>

      {selectedStationData && (
        <>
          <div className="control-group">
            <label>{t.groundStationStatus}</label>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span 
                className={`status-indicator status-${
                  selectedStationData.status === 'active' ? 'online' : 'offline'
                }`}
              />
              {selectedStationData.status === 'active' ? t.active.toUpperCase() : t.inactive.toUpperCase()}
            </div>
          </div>

          <div className="control-group">
            <label>{t.positionInfo}</label>
            <div style={{ fontSize: '12px' }}>
              {t.stationLongitude}: {selectedStationData.lng.toFixed(4)}{t.degrees}<br/>
              {t.stationLatitude}: {selectedStationData.lat.toFixed(4)}{t.degrees}<br/>
              {t.stationAltitude}: 15m
            </div>
          </div>

          <div className="control-group">
            <label>{t.nextPass}</label>
            <div style={{ fontSize: '12px' }}>
              {t.passTime}: {new Date(Date.now() + 2 * 60 * 60 * 1000).toLocaleString()}<br/>
              {t.duration}: 10{t.minutes}<br/>
              {t.maxElevation}: 45{t.degrees}
            </div>
          </div>
        </>
      )}

      {selectedGroundStation && (
        <>
          <div className="control-group">
            <label>{t.telemetryData}</label>
            <table className="data-table">
              <thead>
                <tr>
                  <th>{t.parameter}</th>
                  <th>{t.value}</th>
                  <th>{t.status}</th>
                </tr>
              </thead>
              <tbody>
                {telemetryData.map((data, index) => (
                  <tr key={index}>
                    <td>{data.parameter}</td>
                    <td>{data.value}</td>
                    <td style={{ 
                      color: data.status === t.normal ? '#10b981' : 
                             data.status === t.good ? '#3b82f6' : '#f59e0b'
                    }}>
                      {data.status}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="control-group">
            <label>{t.sendCommand}</label>
            <textarea
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              placeholder={t.enterCommand}
              style={{
                width: '100%',
                height: 60,
                padding: '8px',
                fontSize: '12px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '4px',
                color: '#fff',
                resize: 'vertical'
              }}
            />
            <button
              onClick={handleSendCommand}
              disabled={!command.trim()}
              style={{
                width: '100%',
                marginTop: '8px',
                padding: '8px 12px',
                fontSize: '12px',
                background: command.trim() ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.05)',
                color: command.trim() ? '#3b82f6' : '#6b7280',
                border: '1px solid rgba(59,130,246,0.3)',
                borderRadius: '4px',
                cursor: command.trim() ? 'pointer' : 'not-allowed'
              }}
            >
              {t.sendCommand}
            </button>
          </div>
        </>
      )}
    </>
  )
}

export default GroundStationPanel

'use client'

import { GoogleMap, MarkerF, LoadScript } from '@react-google-maps/api'

interface NodeLocationMapProps {
  lat: number
  lng: number
}

const containerStyle = {
  width: '100%',
  height: '100%',
  borderRadius: '0.5rem'
}

// Replace with your Google Maps API key
const GOOGLE_MAPS_API_KEY = 'YOUR_API_KEY'

export function NodeLocationMap({ lat, lng }: NodeLocationMapProps) {
  const center = {
    lat: lat,
    lng: lng
  }

  return (
    <LoadScript googleMapsApiKey={GOOGLE_MAPS_API_KEY}>
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={center}
        zoom={13}
        options={{
          styles: [
            {
              featureType: 'all',
              elementType: 'all',
              stylers: [{ saturation: -100 }]
            }
          ]
        }}
      >
        <MarkerF position={center} />
      </GoogleMap>
    </LoadScript>
  )
}

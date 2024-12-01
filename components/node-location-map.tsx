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

if (!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
  throw new Error('NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is not set')
}

export function NodeLocationMap({ lat, lng }: NodeLocationMapProps) {
  const center = {
    lat: lat,
    lng: lng
  }

  return (
    <LoadScript googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!}>
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

'use client'

import { GoogleMap, MarkerF, useLoadScript } from '@react-google-maps/api'

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
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!
  })

  const center = {
    lat: lat,
    lng: lng
  }

  if (!isLoaded) return <div>Loading...</div>

  return (
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
  )
}

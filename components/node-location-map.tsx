'use client'

import { GoogleMap, MarkerF, useLoadScript } from '@react-google-maps/api'

interface NodeLocationMapProps {
  lat: number
  lng: number
}

const containerStyle = {
  width: '100%',
  height: '100%'
}

export function NodeLocationMap({ lat, lng }: NodeLocationMapProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

  const { isLoaded } = useLoadScript({
    googleMapsApiKey: apiKey || ''
  })

  if (!apiKey) {
    return (
      <div className="h-full w-full flex items-center justify-center text-xs text-muted-foreground p-4 text-center">
        Map unavailable — NEXT_PUBLIC_GOOGLE_MAPS_API_KEY not configured.
      </div>
    )
  }

  if (!isLoaded) {
    return (
      <div className="h-full w-full flex items-center justify-center text-xs text-muted-foreground">
        Loading map…
      </div>
    )
  }

  const center = { lat, lng }

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={center}
      zoom={11}
      options={{
        disableDefaultUI: true,
        zoomControl: true,
        styles: [
          { featureType: 'all', elementType: 'all', stylers: [{ saturation: -100 }] }
        ]
      }}
    >
      <MarkerF position={center} />
    </GoogleMap>
  )
}

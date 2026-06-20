import React, { useRef, useEffect } from 'react';
import { StyleSheet, View, useColorScheme } from 'react-native';
import { WebView } from 'react-native-webview';

interface MapReport {
  _id?: string;
  id: string;
  category: string;
  title: string;
  location: string;
  status: string;
  latitude: number;
  longitude: number;
}

interface LeafletMobileMapProps {
  reports?: MapReport[];
  onMarkerClick?: (report: any) => void;
  onMapClick?: (coords: { latitude: number; longitude: number }) => void;
  pinCoordinates?: { latitude: number; longitude: number } | null;
  initialCenter?: { latitude: number; longitude: number };
  zoom?: number;
}

export default function LeafletMobileMap({
  reports = [],
  onMarkerClick,
  onMapClick,
  pinCoordinates,
  initialCenter = { latitude: -8.8159, longitude: 13.2922 },
  zoom = 12
}: LeafletMobileMapProps) {
  const webViewRef = useRef<WebView>(null);
  const scheme = useColorScheme();

  const leafletHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <style>
        html, body, #map { height: 100%; width: 100%; margin: 0; padding: 0; background: #000; }
        .custom-pin {
          width: 14px;
          height: 14px;
          border-radius: 50%;
          border: 2px solid white;
          box-shadow: 0 0 6px rgba(0,0,0,0.6);
        }
        .pin-marker {
          width: 24px;
          height: 24px;
          border-radius: 50% 50% 50% 0;
          background: #E53935;
          position: absolute;
          transform: rotate(-45deg);
          left: 50%;
          top: 50%;
          margin: -20px 0 0 -12px;
          border: 2px solid #FFF;
          box-shadow: 0 0 8px rgba(0,0,0,0.5);
        }
        .pin-marker::after {
          content: '';
          width: 10px;
          height: 10px;
          margin: 7px 0 0 7px;
          background: #FFF;
          position: absolute;
          border-radius: 50%;
        }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        const map = L.map('map', { zoomControl: false }).setView([${initialCenter.latitude}, ${initialCenter.longitude}], ${zoom});
        
        const darkTiles = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
          maxZoom: 20,
          attribution: '&copy; OpenStreetMap &copy; CARTO'
        });
        const lightTiles = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '&copy; OpenStreetMap'
        });
        
        let activeTileLayer = ${scheme === 'dark' ? 'darkTiles' : 'lightTiles'};
        activeTileLayer.addTo(map);

        let markers = {};
        let pinMarker = null;

        // Custom div icon for reports
        function getReportIcon(color) {
          return L.divIcon({
            className: 'custom-pin-container',
            html: '<div class="custom-pin" style="background-color: ' + color + ';"></div>',
            iconSize: [14, 14],
            iconAnchor: [7, 7]
          });
        }

        // Handle Map Taps for picking coordinates
        map.on('click', function(e) {
          const lat = e.latlng.lat;
          const lng = e.latlng.lng;
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'MAP_TAP',
            latitude: lat,
            longitude: lng
          }));
        });

        // Communication listener
        window.addEventListener('message', function(event) {
          try {
            const data = JSON.parse(event.data);
            
            if (data.type === 'SET_REPORTS') {
              // Clear old markers
              for (let id in markers) {
                map.removeLayer(markers[id]);
              }
              markers = {};

              // Add new markers
              data.reports.forEach(function(report) {
                if (!report.latitude || !report.longitude) return;
                
                let color = '#7F8C8D';
                const primaryCat = report.category ? report.category.split(',')[0].trim() : '';
                if (primaryCat === 'Lixo') color = '#A0522D';
                else if (primaryCat === 'Buracos') color = '#E65100';
                else if (primaryCat === 'Água' || primaryCat === 'Agua') color = '#007AFF';
                else if (primaryCat === 'Energia') color = '#FFD700';
                else if (primaryCat === 'Segurança' || primaryCat === 'Segurana') color = '#E53935';
                else if (primaryCat === 'Causas Sociais') color = '#9C27B0';
                else if (primaryCat === 'Outro') color = '#009688';
                
                const marker = L.marker([report.latitude, report.longitude], {
                  icon: getReportIcon(color)
                }).addTo(map);

                marker.on('click', function() {
                  window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'MARKER_CLICK',
                    report: report
                  }));
                });

                markers[report._id || report.id] = marker;
              });
            }

            if (data.type === 'SET_PIN') {
              if (pinMarker) {
                map.removeLayer(pinMarker);
              }
              if (data.latitude && data.longitude) {
                const pinIcon = L.divIcon({
                  className: 'custom-pin-marker',
                  html: '<div class="pin-marker"></div>',
                  iconSize: [24, 24],
                  iconAnchor: [12, 24]
                });
                pinMarker = L.marker([data.latitude, data.longitude], { icon: pinIcon }).addTo(map);
                map.setView([data.latitude, data.longitude], map.getZoom());
              }
            }

            if (data.type === 'PAN_TO') {
              map.setView([data.latitude, data.longitude], data.zoom || map.getZoom());
            }

            if (data.type === 'SET_THEME') {
              map.removeLayer(activeTileLayer);
              activeTileLayer = data.theme === 'dark' ? darkTiles : lightTiles;
              activeTileLayer.addTo(map);
            }
          } catch(e) {
            // fail silently
          }
        });
      </script>
    </body>
    </html>
  `;

  // Send updates to WebView once loaded
  useEffect(() => {
    if (webViewRef.current) {
      webViewRef.current.postMessage(JSON.stringify({
        type: 'SET_THEME',
        theme: scheme
      }));
    }
  }, [scheme]);

  useEffect(() => {
    if (webViewRef.current && reports.length > 0) {
      webViewRef.current.postMessage(JSON.stringify({
        type: 'SET_REPORTS',
        reports
      }));
    }
  }, [reports]);

  useEffect(() => {
    if (webViewRef.current && pinCoordinates) {
      webViewRef.current.postMessage(JSON.stringify({
        type: 'SET_PIN',
        latitude: pinCoordinates.latitude,
        longitude: pinCoordinates.longitude
      }));
    }
  }, [pinCoordinates]);

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'MARKER_CLICK' && onMarkerClick) {
        onMarkerClick(data.report);
      }
      if (data.type === 'MAP_TAP' && onMapClick) {
        onMapClick({ latitude: data.latitude, longitude: data.longitude });
      }
      if (data.type === 'MAP_READY') {
        // Feed initial data
        if (reports.length > 0) {
          webViewRef.current?.postMessage(JSON.stringify({ type: 'SET_REPORTS', reports }));
        }
        if (pinCoordinates) {
          webViewRef.current?.postMessage(JSON.stringify({
            type: 'SET_PIN',
            latitude: pinCoordinates.latitude,
            longitude: pinCoordinates.longitude
          }));
        }
      }
    } catch (e) {
      console.log('Error parsing WebView message:', e);
    }
  };

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        source={{ html: leafletHtml }}
        style={styles.webview}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        onMessage={handleMessage}
        originWhitelist={['*']}
        scrollEnabled={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
  webview: {
    flex: 1,
    backgroundColor: '#000',
  },
});

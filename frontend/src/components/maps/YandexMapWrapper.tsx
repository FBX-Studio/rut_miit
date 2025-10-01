'use client';

import React, { useEffect, useRef, useState } from 'react';

interface YandexMapWrapperProps {
  center: [number, number];
  zoom: number;
  routes?: Array<{
    geometry: [number, number][];
    color?: string;
    width?: number;
  }>;
  markers?: Array<{
    coordinates: [number, number];
    icon?: string;
    color?: string;
    hint?: string;
    balloonContent?: string;
  }>;
  showTraffic?: boolean;
  className?: string;
  onRouteBuilt?: (geometry: [number, number][]) => void;
}

declare global {
  interface Window {
    ymaps: any;
  }
}

const YandexMapWrapper: React.FC<YandexMapWrapperProps> = ({
  center,
  zoom,
  routes = [],
  markers = [],
  showTraffic = true,
  className = '',
  onRouteBuilt
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (typeof window.ymaps !== 'undefined') {
      window.ymaps.ready(() => {
        setIsLoaded(true);
      });
      return;
    }

    const existingScript = document.querySelector('script[src*="api-maps.yandex.ru"]');
    if (existingScript) {
      existingScript.addEventListener('load', () => {
        window.ymaps.ready(() => {
          setIsLoaded(true);
        });
      });
      return;
    }

    const script = document.createElement('script');
    script.src = `https://api-maps.yandex.ru/2.1/?apikey=${process.env.NEXT_PUBLIC_YANDEX_MAPS_API_KEY}&lang=ru_RU&load=package.full`;
    script.async = true;
    script.onload = () => {
      window.ymaps.ready(() => {
        setIsLoaded(true);
      });
    };
    document.body.appendChild(script);
  }, []);

  useEffect(() => {
    if (!isLoaded || !mapRef.current || mapInstanceRef.current) return;

    const map = new window.ymaps.Map(mapRef.current, {
      center,
      zoom,
      controls: ['zoomControl', 'geolocationControl']
    });

    mapInstanceRef.current = map;

    if (showTraffic) {
      const trafficControl = new window.ymaps.control.TrafficControl({ 
        state: { 
          providerKey: 'traffic#actual',
          trafficShown: true 
        }
      });
      map.controls.add(trafficControl);
    }

    return () => {
      if (mapInstanceRef.current) {
        try {
          if (typeof mapInstanceRef.current.destroy === 'function') {
            mapInstanceRef.current.destroy();
          }
        } catch (error) {
          console.warn('Error destroying map:', error);
        }
        mapInstanceRef.current = null;
      }
    };
  }, [isLoaded, center, zoom, showTraffic]);

  useEffect(() => {
    if (!mapInstanceRef.current || !isLoaded) return;

    const map = mapInstanceRef.current;
    
    map.geoObjects.removeAll();

    routes.forEach(route => {
      if (route.geometry.length > 1) {
        if (route.geometry.length < 20) {
          const multiRoute = new window.ymaps.multiRouter.MultiRoute({
            referencePoints: route.geometry,
            params: {
              routingMode: 'auto'
            }
          }, {
            boundsAutoApply: false,
            wayPointVisible: false,
            pinVisible: false
          });
          
          multiRoute.model.events.once('requestsuccess', () => {
            const routes = multiRoute.getRoutes();
            if (routes.getLength() > 0) {
              const activeRoute = routes.get(0);
              
              activeRoute.getPaths().each((path: any) => {
                path.options.set({
                  strokeColor: route.color || '0066ffff',
                  strokeWidth: route.width || 4,
                  strokeOpacity: 0.85
                });
              });
              
              if (onRouteBuilt) {
                const geometry: [number, number][] = [];
                activeRoute.getPaths().each((path: any) => {
                  const segments = path.getSegments();
                  segments.forEach((segment: any) => {
                    const coords = segment.getCoordinates();
                    coords.forEach((coord: number[]) => {
                      geometry.push([coord[0], coord[1]] as [number, number]);
                    });
                  });
                });
                
                if (geometry.length > 0) {
                  console.log('Extracted route geometry with', geometry.length, 'points for simulation');
                  onRouteBuilt(geometry);
                }
              }
            }
          });
          
          map.geoObjects.add(multiRoute);
          console.log('Route built via multiRouter with', route.geometry.length, 'points');
        } else {
          const polyline = new window.ymaps.Polyline(
            route.geometry,
            {},
            {
              strokeColor: route.color || '#0066FF',
              strokeWidth: route.width || 4,
              strokeOpacity: 0.85
            }
          );
          map.geoObjects.add(polyline);
          console.log('Route rendered as Polyline with', route.geometry.length, 'points');
        }
      }
    });

    markers.forEach(marker => {
      const placemark = new window.ymaps.Placemark(
        marker.coordinates,
        {
          hintContent: marker.hint || '',
          balloonContent: marker.balloonContent || ''
        },
        {
          preset: marker.icon || 'islands#blueDotIcon',
          iconColor: marker.color || '#0066FF'
        }
      );
      map.geoObjects.add(placemark);
    });
  }, [routes, markers, isLoaded]);

  useEffect(() => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.setCenter(center, zoom, { duration: 300 });
  }, [center, zoom]);

  if (!isLoaded) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 dark:bg-gray-800 ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Загрузка карты...</p>
        </div>
      </div>
    );
  }

  return <div ref={mapRef} className={className} style={{ width: '100%', height: '100%' }} />;
};

export default YandexMapWrapper;

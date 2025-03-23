import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapPin, Search, Info, X, Loader, ExternalLink } from 'lucide-react';
import policeJurisdiction from '../layers/PoliceJurisdiction_5.json'
import BBMPInformation from '../layers/BBMPInformation_11.json'
import Constituencies from '../layers/Constituencies_3.json'
import RevenueOffices from '../layers/RevenueOffices_6.json'
import RevenueClassification from '../layers/RevenueClassification_10.json'
import sroLocations from '../data/sro_locs.json'
import droLocations from '../data/dro_locs.json'
import psLocations from '../data/ps_locs.json'
import tpLocations from '../data/tp_locs.json'
import ReactDOM from 'react-dom';


const BangaloreAddressMap = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showInfoPanel, setShowInfoPanel] = useState(false);
  const [zoomedLocation, setZoomedLocation] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const [tooltipPosition, setTooltipPosition] = useState('bottom');
  const [isMobile, setIsMobile] = useState(false);
  const [locationInfo, setLocationInfo] = useState({
    bbmpInfo: {
      Zone: 'Loading...',
      Division: 'Loading...',
      Subdivision: 'Loading...',
      'Ward name': 'Loading...',
      'Ward number': 'Loading...'
    },
    revenueClassification: {
      District: 'Loading...',
      Taluk: 'Loading...',
      Hobli: 'Loading...',
      Village: 'Loading...',
      htmlDescription: null
    },
    revenueOffices: {
      SRO: 'Loading...',
      DRO: 'Loading...',
      'SRO Address': 'Loading...',
      'DRO Address': 'Loading...',
      'SRO Maps Link': null,
      'DRO Maps Link': null
    },
    policeJurisdiction: {
      'Police station': 'Loading...',
      'Traffic station': 'Loading...',
      'Electicity station': 'Loading...',
      'Police station Address': 'Loading...',
      'Traffic station Address': 'Loading...',
      'Police station Maps Link': null,
      'Traffic station Maps Link': null
    }
  });
  
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const polygonRef = useRef(null);
  const labelRef = useRef(null);
  const searchTimeoutRef = useRef(null);
  const infoPanelRef = useRef(null);
  const [showTooltip, setShowTooltip] = useState(false);
  const [isPanelExpanded, setIsPanelExpanded] = useState(false);
  const touchStartRef = useRef(null);
  const touchEndRef = useRef(null);
  const minSwipeDistance = 50; // minimum distance required for swipe action

  // Check if device is mobile
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // Initial check
    checkIsMobile();
    
    // Add event listener for window resize
    window.addEventListener('resize', checkIsMobile);
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', checkIsMobile);
    };
  }, []);

  // Helper function to check if a point is inside a polygon (more accurate than bounds check)
  const isMarkerInsidePolygon = (point, poly) => {
    // Ray casting algorithm for point in polygon detection
    const x = point.lat, y = point.lng;
    
    let inside = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const xi = poly[i].lat, yi = poly[i].lng;
      const xj = poly[j].lat, yj = poly[j].lng;
      
      const intersect = ((yi > y) !== (yj > y))
          && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }
    
    return inside;
  };

  // Add click handler to close search suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showSuggestions && !event.target.closest('form')) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [showSuggestions]);
  
  // Reset active suggestion index when search results change
  useEffect(() => {
    setActiveSuggestionIndex(-1);
  }, [searchResults]);

  // Initialize the map and GeoJSON data
  useEffect(() => {
    // Log the imported data for debugging
    console.log("Revenue Offices data loaded:", RevenueOffices);
    console.log("BBMP Information data loaded:", BBMPInformation);
    console.log("Revenue Classification data loaded:", RevenueClassification);
    console.log("SRO Locations data loaded:", sroLocations);
    console.log("DRO Locations data loaded:", droLocations);
    console.log("Police Station Locations data loaded:", psLocations);
    console.log("Traffic Police Station Locations data loaded:", tpLocations);
    
    // Bangalore coordinates
    const bangaloreCoordinates = [12.9716, 77.5946]; // [latitude, longitude]
    
    // Prevent multiple initializations
    if (mapInstanceRef.current) {
      return;
    }
    
    // Only load Leaflet if we're in the browser
    if (typeof window !== 'undefined' && mapContainerRef.current) {
      // Load leaflet CSS
      const loadLeafletCSS = () => {
        const linkEl = document.createElement('link');
        linkEl.rel = 'stylesheet';
        linkEl.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        linkEl.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
        linkEl.crossOrigin = '';
        document.head.appendChild(linkEl);
      };

      // Add custom CSS
      const addCustomStyles = () => {
        const styleEl = document.createElement('style');
        styleEl.innerHTML = `
          .leaflet-map-controls {
            position: absolute;
            z-index: 1000;
            pointer-events: auto;
          }
          
          .leaflet-container {
            z-index: 1;
          }
          
          .map-attribution {
            position: absolute; 
            z-index: 1000;
            background-color: white;
            padding: 4px 8px;
            border-radius: 4px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            font-size: 0.75rem;
            pointer-events: auto;
          }

          /* Mobile info panel styles */
          @media (max-width: 767px) {
            .mobile-info-panel {
              position: fixed;
              bottom: 0;
              left: 0;
              width: 100%;
              max-height: 75vh;
              border-radius: 16px 16px 0 0;
              box-shadow: 0 -2px 10px rgba(0,0,0,0.1);
              z-index: 1001;
              overflow-y: auto;
              transition: transform 0.3s ease-in-out;
            }
            
            .mobile-info-panel-header {
              padding: 8px 12px;
              border-bottom: 1px solid #eee;
              display: flex;
              flex-direction: column;
              align-items: center;
              position: sticky;
              top: 0;
              background: white;
              z-index: 2;
            }
            
            .mobile-info-collapsed {
              transform: translateY(calc(100% - 170px));
            }
            
            .mobile-info-expanded {
              transform: translateY(0);
            }
            
            .preview-content {
              padding: 12px 16px;
              background-color: #f8fafc;
            }
            
            /* Improve text display in mobile panels */
            .mobile-info-panel .section-content {
              word-break: break-word;
              font-size: 14px;
            }
            
            .mobile-info-panel h2 {
              font-size: 16px;
            }
            
            .mobile-info-panel .full-width-text {
              grid-column: span 2;
              padding-top: 4px;
            }
          }
        `;
        document.head.appendChild(styleEl);
      };

      // Load the Leaflet script
      const loadLeafletScript = () => {
        return new Promise((resolve, reject) => {
          if (window.L) {
            resolve(window.L);
          } else {
            const script = document.createElement('script');
            script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
            script.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
            script.crossOrigin = '';
            script.onload = () => resolve(window.L);
            script.onerror = reject;
            document.head.appendChild(script);
          }
        });
      };

      // Initialize map and plugins
      const initializeMap = (L) => {
        // Make sure the container is still in the DOM and map isn't already initialized
        if (!mapContainerRef.current || mapInstanceRef.current) return;
        
        // Initialize map
        const map = L.map(mapContainerRef.current, {
          zoomControl: false // Disable default zoom control
        }).setView(bangaloreCoordinates, 12);
        
        // Add OpenStreetMap tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);
        
        // Add click event to map for reverse geocoding
        map.on('click', handleMapClick);
        
        // Store map instance
        mapInstanceRef.current = map;
      };

      // Load everything in sequence
      // Check if initialization is already in progress
      if (!window.leafletInitializing) {
        window.leafletInitializing = true;
        
        loadLeafletCSS();
        addCustomStyles();
        loadLeafletScript()
          .then(initializeMap)
          .catch(error => {
            console.error('Failed to load Leaflet or plugins:', error);
          })
          .finally(() => {
            window.leafletInitializing = false;
          });
      }
    }

    // Cleanup function
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [mapContainerRef]);

  // Function to find BBMP information for a location
  const findBBMPInfo = (lat, lng) => {
    if (!BBMPInformation || !BBMPInformation.features) {
      return {
        Zone: "Unknown",
        Division: "Unknown",
        Subdivision: "Unknown",
        'Ward name': "Unknown",
        'Ward number': "Unknown"
      };
    }

    const L = window.L;
    if (!L) return {
      Zone: "Unknown",
      Division: "Unknown",
      Subdivision: "Unknown",
      'Ward name': "Unknown",
      'Ward number': "Unknown"
    };

    // Create a point for the clicked location
    const point = L.latLng(lat, lng);
    
    // Log the first feature to see its properties structure
    if (BBMPInformation.features.length > 0 && lng === 77.5946 && lat === 12.9716) {
      // Only log for the initial Bangalore coordinates to avoid excessive logging
      console.log("BBMP feature example:", BBMPInformation.features[0]);
    }
    
    // Check each BBMP polygon
    for (const feature of BBMPInformation.features) {
      if (feature.geometry && (feature.geometry.type === "Polygon" || feature.geometry.type === "MultiPolygon")) {
        try {
          let polygon = null;
          let polygonLatLngs = [];
          
          if (feature.geometry.type === "Polygon") {
            // Single polygon
            const polygonCoords = feature.geometry.coordinates[0].map(coord => [coord[1], coord[0]]);
            polygon = L.polygon(polygonCoords);
            polygonLatLngs = polygon.getLatLngs()[0]; // Get array of LatLng objects
          } else if (feature.geometry.type === "MultiPolygon") {
            // Multiple polygons
            const multiPolygonCoords = feature.geometry.coordinates.map(poly => {
              // Each polygon in the multi-polygon
              return poly[0].map(coord => [coord[1], coord[0]]);
            });
            polygon = L.polygon(multiPolygonCoords);
            
            // For MultiPolygon, we need to check each ring
            polygonLatLngs = polygon.getLatLngs().flat();
          }
          
          // First do a quick bounds check (for performance)
          if (polygon && polygon.getBounds().contains(point)) {
            // Then do a precise point-in-polygon check
            const isInside = isMarkerInsidePolygon(point, polygonLatLngs);
            
            if (isInside) {
              // Log the matching feature to see its properties
              console.log("Matching BBMP feature:", feature);
              
              // Extract BBMP information from properties
              // Try different possible property names based on the JSON structure
              const wardName = feature.properties["Ward Name"] || 
                              feature.properties.Name || 
                              "Unknown";
                              
              const wardNumber = feature.properties.Name || 
                                "Unknown";
                                
              const zone = feature.properties.Zone || 
                          "Unknown";
                          
              const division = feature.properties.Division || 
                              "Unknown";
                              
              const subdivision = feature.properties.Subdivision || 
                                 "Unknown";
              
              return {
                'Zone': zone,
                'Division': division,
                'Subdivision': subdivision,
                'Ward name': wardName,
                'Ward number': wardNumber
              };
            }
          }
        } catch (error) {
          console.error('Error checking BBMP polygon:', error);
        }
      }
    }
    
    return {
      Zone: "Outside known BBMP areas",
      Division: "Outside known BBMP areas",
      Subdivision: "Outside known BBMP areas",
      'Ward name': "Outside known BBMP areas",
      'Ward number': "Outside known BBMP areas"
    };
  };

  // Function to find police jurisdiction for a location
  const findPoliceJurisdiction = (lat, lng) => {
    if (!policeJurisdiction || !policeJurisdiction.features) {
      return {
        'Police station': "Unknown",
        'Traffic station': "Unknown",
        'Police station Address': "Unknown",
        'Traffic station Address': "Unknown",
        'Police station Maps Link': null,
        'Traffic station Maps Link': null
      };
    }

    const L = window.L;
    if (!L) return {
      'Police station': "Unknown",
      'Traffic station': "Unknown",
      'Police station Address': "Unknown",
      'Traffic station Address': "Unknown",
      'Police station Maps Link': null,
      'Traffic station Maps Link': null
    };

    // Create a point for the clicked location
    const point = L.latLng(lat, lng);
    
    // Log the first feature to see its properties structure
    if (policeJurisdiction.features.length > 0 && lng === 77.5946 && lat === 12.9716) {
      // Only log for the initial Bangalore coordinates to avoid excessive logging
      console.log("Police jurisdiction feature example:", policeJurisdiction.features[0]);
    }
    
    // Check each police jurisdiction polygon
    for (const feature of policeJurisdiction.features) {
      if (feature.geometry && (feature.geometry.type === "Polygon" || feature.geometry.type === "MultiPolygon")) {
        try {
          let polygon = null;
          let polygonLatLngs = [];
          
          if (feature.geometry.type === "Polygon") {
            // Single polygon
            const polygonCoords = feature.geometry.coordinates[0].map(coord => [coord[1], coord[0]]);
            polygon = L.polygon(polygonCoords);
            polygonLatLngs = polygon.getLatLngs()[0]; // Get array of LatLng objects
          } else if (feature.geometry.type === "MultiPolygon") {
            // Multiple polygons
            const multiPolygonCoords = feature.geometry.coordinates.map(poly => {
              // Each polygon in the multi-polygon
              return poly[0].map(coord => [coord[1], coord[0]]);
            });
            polygon = L.polygon(multiPolygonCoords);
            
            // For MultiPolygon, we need to check each ring
            polygonLatLngs = polygon.getLatLngs().flat();
          }
          
          // First do a quick bounds check (for performance)
          if (polygon && polygon.getBounds().contains(point)) {
            // Then do a precise point-in-polygon check
            const isInside = isMarkerInsidePolygon(point, polygonLatLngs);
            
            if (isInside) {
              // Extract police jurisdiction information from properties
              const policeStation = feature.properties["Police Station"] || 
                                   feature.properties.Name || 
                                   "Unknown";
                                   
              const trafficStation = policeStation.replace(' PS', ' Traffic PS');
              
              // Get additional information from our data files
              let psAddress = "Address not available";
              let psMapsLink = null;
              let tpAddress = "Address not available";
              let tpMapsLink = null;
              
              // Look up police station information
              if (psLocations[policeStation.trim()] && psLocations[policeStation.trim()].places && psLocations[policeStation.trim()].places.length > 0) {
                const psInfo = psLocations[policeStation.trim()].places[0];
                psAddress = psInfo.formattedAddress;
                psMapsLink = psInfo.googleMapsUri;
              }
              
              // Look up traffic police station information
              if (tpLocations[trafficStation.trim()] && tpLocations[trafficStation.trim()].places && tpLocations[trafficStation.trim()].places.length > 0) {
                const tpInfo = tpLocations[trafficStation.trim()].places[0];
                tpAddress = tpInfo.formattedAddress;
                tpMapsLink = tpInfo.googleMapsUri;
              }
              
              return {
                'Police station': policeStation,
                'Traffic station': trafficStation,
                'Police station Address': psAddress,
                'Traffic station Address': tpAddress,
                'Police station Maps Link': psMapsLink,
                'Traffic station Maps Link': tpMapsLink
              };
            }
          }
        } catch (error) {
          console.error('Error checking police jurisdiction polygon:', error);
        }
      }
    }
    
    return {
      'Police station': "Outside known police jurisdictions",
      'Traffic station': "Outside known police jurisdictions",
      'Police station Address': "Not applicable",
      'Traffic station Address': "Not applicable",
      'Police station Maps Link': null,
      'Traffic station Maps Link': null
    };
  };

  // Function to find revenue classification for a location
  const findRevenueClassification = (lat, lng) => {
    if (!RevenueClassification || !RevenueClassification.features) {
      return {
        District: "Unknown",
        Taluk: "Unknown",
        Hobli: "Unknown",
        Village: "Unknown",
      htmlDescription: null
      };
    }

    const L = window.L;
    if (!L) return {
      District: "Unknown",
      Taluk: "Unknown",
      Hobli: "Unknown",
      Village: "Unknown",
      htmlDescription: null
    };

    // Create a point for the clicked location
    const point = L.latLng(lat, lng);
    
    // Log the first feature to see its properties structure
    if (RevenueClassification.features.length > 0 && lng === 77.5946 && lat === 12.9716) {
      // Only log for the initial Bangalore coordinates to avoid excessive logging
      console.log("Revenue classification feature example:", RevenueClassification.features[0]);
    }
    
    // Check each revenue classification polygon
    for (const feature of RevenueClassification.features) {
      if (feature.geometry && (feature.geometry.type === "Polygon" || feature.geometry.type === "MultiPolygon")) {
        try {
          let polygon = null;
          let polygonLatLngs = [];
          
          if (feature.geometry.type === "Polygon") {
            // Single polygon
            const polygonCoords = feature.geometry.coordinates[0].map(coord => [coord[1], coord[0]]);
            polygon = L.polygon(polygonCoords);
            polygonLatLngs = polygon.getLatLngs()[0]; // Get array of LatLng objects
          } else if (feature.geometry.type === "MultiPolygon") {
            // Multiple polygons
            const multiPolygonCoords = feature.geometry.coordinates.map(poly => {
              // Each polygon in the multi-polygon
              return poly[0].map(coord => [coord[1], coord[0]]);
            });
            polygon = L.polygon(multiPolygonCoords);
            
            // For MultiPolygon, we need to check each ring
            polygonLatLngs = polygon.getLatLngs().flat();
          }
          
          // First do a quick bounds check (for performance)
          if (polygon && polygon.getBounds().contains(point)) {
            // Then do a precise point-in-polygon check
            const isInside = isMarkerInsidePolygon(point, polygonLatLngs);
            
            if (isInside) {
              // Extract village name from properties
              const villageName = feature.properties.Name || "Unknown";
              
              // Extract HTML description for detailed information
              const htmlDescription = feature.properties.description || null;
              
              // Extract district, taluk, hobli from HTML description using regex
              let district = "Unknown";
              let taluk = "Unknown";
              let hobli = "Unknown";
              
              if (htmlDescription) {
                // Extract KGISVillageCode
                const villageCodeMatch = htmlDescription.match(/KGISVillageCode<\/td>\s*<td>(\d+)<\/td>/);
                const villageCode = villageCodeMatch ? villageCodeMatch[1] : null;
                
                // Extract KGISHobliID
                const hobliIdMatch = htmlDescription.match(/KGISHobliID<\/td>\s*<td>(\d+)<\/td>/);
                const hobliId = hobliIdMatch ? hobliIdMatch[1] : null;
                
                // Extract Bhucode (contains district, taluk, hobli codes)
                const bhuCodeMatch = htmlDescription.match(/Bhucode<\/td>\s*<td>(\d+)<\/td>/);
                const bhuCode = bhuCodeMatch ? bhuCodeMatch[1] : null;
                
                // Map district code to name (example mapping)
                const districtCodeToName = { "20": "Bengaluru (Urban)" };
                
                // Map taluk code to name (example mapping)
                const talukCodeToName = {};
                
                // Map hobli code to name (example mapping)
                const hobliCodeToName = {};
                
                // Extract district code (first 2 digits of bhuCode)
                if (bhuCode && bhuCode.length >= 2) {
                  const districtCode = bhuCode.substring(0, 2);
                  district = districtCodeToName[districtCode] || `District Code: ${districtCode}`;
                }
                
                // Extract taluk code (digits 3-4 of bhuCode)
                if (bhuCode && bhuCode.length >= 4) {
                  const talukCode = bhuCode.substring(2, 4);
                  taluk = talukCodeToName[talukCode] || `Taluk Code: ${talukCode}`;
                }
                
                // Extract hobli code (digits 5-6 of bhuCode)
                if (bhuCode && bhuCode.length >= 6) {
                  const hobliCode = bhuCode.substring(4, 6);
                  hobli = hobliCodeToName[hobliCode] || `Hobli Code: ${hobliCode}`;
                }
              }
              
              return {
                District: district,
                Taluk: taluk,
                Hobli: hobli,
                Village: villageName,
                htmlDescription: htmlDescription
              };
            }
          }
        } catch (error) {
          console.error('Error checking revenue classification polygon:', error);
        }
      }
    }
    
    return {
      District: "Outside known revenue classifications",
      Taluk: "Outside known revenue classifications",
      Hobli: "Outside known revenue classifications",
      Village: "Outside known revenue classifications",
      htmlDescription: null
    };
  };

  // Function to find revenue offices for a location
  const findRevenueOffices = (lat, lng) => {
    if (!RevenueOffices || !RevenueOffices.features) {
      return {
        'SRO': "Unknown",
        'DRO': "Unknown",
        'SRO Address': "Unknown",
        'DRO Address': "Unknown",
        'SRO Maps Link': null,
        'DRO Maps Link': null
      };
    }

    const L = window.L;
    if (!L) return {
      'SRO': "Unknown",
      'DRO': "Unknown",
      'SRO Address': "Unknown",
      'DRO Address': "Unknown",
      'SRO Maps Link': null,
      'DRO Maps Link': null
    };

    // Create a point for the clicked location
    const point = L.latLng(lat, lng);
    
    // Log the first feature to see its properties structure
    if (RevenueOffices.features.length > 0 && lng === 77.5946 && lat === 12.9716) {
      // Only log for the initial Bangalore coordinates to avoid excessive logging
      console.log("Revenue office feature example:", RevenueOffices.features[0]);
    }
    
    // Check each revenue office polygon
    for (const feature of RevenueOffices.features) {
      if (feature.geometry && (feature.geometry.type === "Polygon" || feature.geometry.type === "MultiPolygon")) {
        try {
          let polygon = null;
          let polygonLatLngs = [];
          
          if (feature.geometry.type === "Polygon") {
            // Single polygon
            const polygonCoords = feature.geometry.coordinates[0].map(coord => [coord[1], coord[0]]);
            polygon = L.polygon(polygonCoords);
            polygonLatLngs = polygon.getLatLngs()[0]; // Get array of LatLng objects
          } else if (feature.geometry.type === "MultiPolygon") {
            // Multiple polygons
            const multiPolygonCoords = feature.geometry.coordinates.map(poly => {
              // Each polygon in the multi-polygon
              return poly[0].map(coord => [coord[1], coord[0]]);
            });
            polygon = L.polygon(multiPolygonCoords);
            
            // For MultiPolygon, we need to check each ring
            polygonLatLngs = polygon.getLatLngs().flat();
          }
          
          // First do a quick bounds check (for performance)
          if (polygon && polygon.getBounds().contains(point)) {
            // Then do a precise point-in-polygon check
            const isInside = isMarkerInsidePolygon(point, polygonLatLngs);
            
            if (isInside) {
              // Extract both SRO and DRO information from properties
              const sroName = feature.properties.SRO_Name || 
                             feature.properties.Name || 
                             "Unknown";
              
              const droName = feature.properties.DRO_Name ||
                             "Unknown";
              
              // Get additional information from our data files
              let sroAddress = "Address not available";
              let sroMapsLink = null;
              let droAddress = "Address not available";
              let droMapsLink = null;
              
              // Look up SRO information
              if (sroLocations[sroName] && sroLocations[sroName].places && sroLocations[sroName].places.length > 0) {
                const sroInfo = sroLocations[sroName].places[0];
                sroAddress = sroInfo.formattedAddress;
                sroMapsLink = sroInfo.googleMapsUri;
              }
              
              // Look up DRO information
              if (droLocations[droName] && droLocations[droName].places && droLocations[droName].places.length > 0) {
                const droInfo = droLocations[droName].places[0];
                droAddress = droInfo.formattedAddress;
                droMapsLink = droInfo.googleMapsUri;
              }
              
              return {
                'SRO': sroName,
                'DRO': droName,
                'SRO Address': sroAddress,
                'DRO Address': droAddress,
                'SRO Maps Link': sroMapsLink,
                'DRO Maps Link': droMapsLink
              };
            }
          }
        } catch (error) {
          console.error('Error checking revenue office polygon:', error);
        }
      }
    }
    
    return {
      'SRO': "Outside known revenue offices",
      'DRO': "Outside known revenue offices",
      'SRO Address': "Not applicable",
      'DRO Address': "Not applicable",
      'SRO Maps Link': null,
      'DRO Maps Link': null
    };
  };

  // Function to find constituency for a location
  const findConstituency = (lat, lng) => {
    if (!Constituencies || !Constituencies.features) {
      return {
        'Constituency Name': "Unknown",
        'Constituency Type': "Unknown"
      };
    }

    const L = window.L;
    if (!L) return {
      'Constituency Name': "Unknown",
      'Constituency Type': "Unknown"
    };

    // Create a point for the clicked location
    const point = L.latLng(lat, lng);
    
    // Log the first feature to see its properties structure
    if (Constituencies.features.length > 0 && lng === 77.5946 && lat === 12.9716) {
      // Only log for the initial Bangalore coordinates to avoid excessive logging
      console.log("Constituency feature example:", Constituencies.features[0]);
    }
    
    // Check each constituency polygon
    for (const feature of Constituencies.features) {
      if (feature.geometry && (feature.geometry.type === "Polygon" || feature.geometry.type === "MultiPolygon")) {
        try {
          let polygon = null;
          let polygonLatLngs = [];
          
          if (feature.geometry.type === "Polygon") {
            // Single polygon
            const polygonCoords = feature.geometry.coordinates[0].map(coord => [coord[1], coord[0]]);
            polygon = L.polygon(polygonCoords);
            polygonLatLngs = polygon.getLatLngs()[0]; // Get array of LatLng objects
          } else if (feature.geometry.type === "MultiPolygon") {
            // Multiple polygons
            const multiPolygonCoords = feature.geometry.coordinates.map(poly => {
              // Each polygon in the multi-polygon
              return poly[0].map(coord => [coord[1], coord[0]]);
            });
            polygon = L.polygon(multiPolygonCoords);
            
            // For MultiPolygon, we need to check each ring
            polygonLatLngs = polygon.getLatLngs().flat();
          }
          
          // First do a quick bounds check (for performance)
          if (polygon && polygon.getBounds().contains(point)) {
            // Then do a precise point-in-polygon check
            const isInside = isMarkerInsidePolygon(point, polygonLatLngs);
            
            if (isInside) {
              // Extract constituency information from properties
              const constituencyName = feature.properties["AC_NAME"] || 
                                      feature.properties.Name || 
                                      "Unknown";
                                      
              const constituencyType = feature.properties["Constituency Type"] || 
                                      "Assembly"; // Default to Assembly
              
              return {
                'Constituency Name': constituencyName,
                'Constituency Type': constituencyType
              };
            }
          }
        } catch (error) {
          console.error('Error checking constituency polygon:', error);
        }
      }
    }
    
    return {
      'Constituency Name': "Outside known constituencies",
      'Constituency Type': "Unknown"
    };
  };

  // Handle map click for reverse geocoding
  const handleMapClick = async (e) => {
    if (!mapInstanceRef.current) return;
    
    const { lat, lng } = e.latlng;
    setIsReverseGeocoding(true);
    
    try {
      // Perform reverse geocoding
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        {
          headers: {
            'Accept-Language': 'en-US,en',
            'User-Agent': 'CivicCompassWebApp'
          }
        }
      );
      
      if (!response.ok) {
        throw new Error('Reverse geocoding failed');
      }
      
      const data = await response.json();
      
      // Create a location object similar to search results
      const location = {
        display_name: data.display_name,
        lat: lat.toString(),
        lon: lng.toString(),
        address: data.address
      };
      
      // Set as selected location
      setSelectedLocation(location);
      
      // Update search query with the location name
      setSearchQuery(data.display_name.split(',')[0]);
      
      // Always show info panel
      setShowInfoPanel(true);
      
      // Find the relevant police jurisdiction and revenue offices
      const policeStation = findPoliceJurisdiction(lat, lng);
      const revenueOffices = findRevenueOffices(lat, lng);
      
      // Update the info with dynamically calculated data
      setLocationInfo({
        bbmpInfo: findBBMPInfo(lat, lng),
        revenueClassification: findRevenueClassification(lat, lng),
        revenueOffices: revenueOffices,
        policeJurisdiction: {
          ...policeStation,
          'Electicity station': 'Calculated from GeoJSON'
        }
      });
      
      // Add marker to map
      zoomToLocation(lat, lng, data.display_name);
      
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      
      // Even if geocoding fails, we can still mark the location
      const location = {
        display_name: `Location at ${lat.toFixed(5)}, ${lng.toFixed(5)}`,
        lat: lat.toString(),
        lon: lng.toString()
      };
      
      setSelectedLocation(location);
      setSearchQuery(`Location at ${lat.toFixed(5)}, ${lng.toFixed(5)}`);
      setShowInfoPanel(true); // Always show info panel even if geocoding fails
      
      // Find the relevant police jurisdiction and revenue offices
      const policeStation = findPoliceJurisdiction(lat, lng);
      const revenueOffices = findRevenueOffices(lat, lng);
      
      // Update with limited info
      setLocationInfo({
        ...locationInfo,
        revenueOffices: revenueOffices,
        policeJurisdiction: {
          ...policeStation,
          'Electicity station': 'Unknown'
        }
      });
      
      zoomToLocation(lat, lng, `Location at ${lat.toFixed(5)}, ${lng.toFixed(5)}`);
      
    } finally {
      setIsReverseGeocoding(false);
    }
  };

  // Map controls
  const zoomIn = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setZoom(mapInstanceRef.current.getZoom() + 1);
    }
  };
  
  const zoomOut = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setZoom(mapInstanceRef.current.getZoom() - 1);
    }
  };
  
  const setCurrentLocation = () => {
    if (!mapInstanceRef.current) return;
    
    setIsSearching(true);
    
    // Try to get the user's location if supported
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        // Success callback
        (position) => {
          const { latitude, longitude } = position.coords;
          
          // Remove previous marker if exists
          if (markerRef.current) {
            mapInstanceRef.current.removeLayer(markerRef.current);
          }
          
          // Add new marker
          markerRef.current = window.L.marker([latitude, longitude])
            .addTo(mapInstanceRef.current)
            .bindPopup("Your Location")
            .openPopup();
          
          // Zoom to the location
          mapInstanceRef.current.setView([latitude, longitude], 16);
          
          // Show zoomed notification
          setZoomedLocation(true);
          
          // Hide the notification after 3 seconds
          setTimeout(() => {
            setZoomedLocation(false);
          }, 3000);
          
          setIsSearching(false);
          
          // Find the police jurisdiction and revenue offices for the current location
          const policeStation = findPoliceJurisdiction(latitude, longitude);
          const revenueOffices = findRevenueOffices(latitude, longitude);
          
          // Update location info
          setLocationInfo({
            ...locationInfo,
            revenueOffices: revenueOffices,
            policeJurisdiction: {
              ...policeStation,
              'Electicity station': 'Calculated from GeoJSON'
            }
          });
          
          // Try to reverse geocode the location
          fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`, {
            headers: {
              'Accept-Language': 'en-US,en',
              'User-Agent': 'CivicCompassWebApp'
            }
          })
          .then(response => response.json())
          .then(data => {
            setSearchQuery(data.display_name.split(',')[0]);
            setSelectedLocation({
              display_name: data.display_name,
              lat: latitude,
              lon: longitude,
              address: data.address
            });
            
            // Update with more detailed info
            setLocationInfo({
              bbmpInfo: findBBMPInfo(latitude, longitude),
              revenueClassification: findRevenueClassification(latitude, longitude),
              revenueOffices: revenueOffices,
              policeJurisdiction: {
                ...policeStation,
                'Electicity station': 'Calculated from GeoJSON'
              }
            });
            setShowInfoPanel(true); // Always show info panel
          })
          .catch(error => {
            console.error('Error reverse geocoding current location:', error);
          });
        },
        // Error callback
        (error) => {
          console.error("Geolocation error:", error);
          // Fallback to Bangalore center if geolocation fails
          const bangaloreCoordinates = [12.9716, 77.5946];
          
          if (markerRef.current) {
            mapInstanceRef.current.removeLayer(markerRef.current);
          }
          
          markerRef.current = window.L.marker(bangaloreCoordinates)
            .addTo(mapInstanceRef.current)
            .bindPopup("Bangalore")
            .openPopup();
          
          mapInstanceRef.current.setView(bangaloreCoordinates, 12);
          
          setIsSearching(false);
          setSearchQuery("Bangalore");
        }
      );
    } else {
      // Fallback for browsers without geolocation
      const bangaloreCoordinates = [12.9716, 77.5946];
      
      if (markerRef.current) {
        mapInstanceRef.current.removeLayer(markerRef.current);
      }
      
      markerRef.current = window.L.marker(bangaloreCoordinates)
        .addTo(mapInstanceRef.current)
        .bindPopup("Bangalore")
        .openPopup();
      
      mapInstanceRef.current.setView(bangaloreCoordinates, 12);
      
      setIsSearching(false);
      setSearchQuery("Bangalore");
    }
  };

  // Search for locations using Nominatim
  const searchLocations = async (query) => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      setShowSuggestions(false);
      return;
    }
    
    try {
      setIsSearching(true);
      // Add "Bangalore" to the search query to focus results
      const searchUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query + ' Bangalore')}&limit=5`;
      
      const response = await fetch(searchUrl, {
        headers: {
          'Accept-Language': 'en-US,en',
          'User-Agent': 'CivicCompassWebApp'
        }
      });
      
      if (!response.ok) {
        throw new Error('Search failed');
      }
      
      const data = await response.json();
      setSearchResults(data);
      setShowSuggestions(data.length > 0);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Handle location selection from suggestions
  const handleLocationSelect = (location) => {
    setSelectedLocation(location);
    setSearchQuery(location.display_name.split(',')[0]); // Set the input to first part of location name
    setShowSuggestions(false);
    setShowInfoPanel(true);
    setIsPanelExpanded(false);
    
    if (mapInstanceRef.current) {
      const { lat, lon } = location;
      const latitude = parseFloat(lat);
      const longitude = parseFloat(lon);
      
      // Find the police jurisdiction and revenue offices
      const policeStation = findPoliceJurisdiction(latitude, longitude);
      const revenueOffices = findRevenueOffices(latitude, longitude);
      
      // Update location info with dynamically calculated data
      setLocationInfo({
        bbmpInfo: findBBMPInfo(latitude, longitude),
        revenueClassification: findRevenueClassification(latitude, longitude),
        revenueOffices: revenueOffices,
        policeJurisdiction: {
          ...policeStation,
          'Electicity station': 'Calculated from GeoJSON'
        }
      });
      
      zoomToLocation(latitude, longitude, location.display_name);
    }
  };
  
  // Function to zoom to a location and show its information
  const zoomToLocation = (lat, lng, address = null) => {
    try {
      // Clear existing markers and polygons
      if (markerRef.current) {
        mapInstanceRef.current.removeLayer(markerRef.current);
      }
      
      if (polygonRef.current) {
        mapInstanceRef.current.removeLayer(polygonRef.current);
      }
      
      if (labelRef.current) {
        mapInstanceRef.current.removeLayer(labelRef.current);
      }
      
      // Create a marker at the location
      const L = window.L;
      if (!L) return;
      
      const location = L.latLng(lat, lng);
      markerRef.current = L.marker(location).addTo(mapInstanceRef.current);
      
      // Zoom to the location
      mapInstanceRef.current.setView(location, 15);
      
      // Find BBMP information for this location
      if (BBMPInformation && BBMPInformation.features) {
        // Create a point for the clicked location
        const point = L.latLng(lat, lng);
        
        // Check each BBMP polygon
        for (const feature of BBMPInformation.features) {
          if (feature.geometry && (feature.geometry.type === "Polygon" || feature.geometry.type === "MultiPolygon")) {
            try {
              let polygon = null;
              let polygonLatLngs = [];
              let polygonCoordinates = [];
              
              if (feature.geometry.type === "Polygon") {
                // Single polygon
                polygonCoordinates = feature.geometry.coordinates[0].map(coord => [coord[1], coord[0]]);
                polygon = L.polygon(polygonCoordinates, {
                  color: '#00796b',
                  weight: 2,
                  fillColor: '#4db6ac',
                  fillOpacity: 0.3
                });
                polygonLatLngs = polygon.getLatLngs()[0]; // Get array of LatLng objects
              } else if (feature.geometry.type === "MultiPolygon") {
                // Multiple polygons
                const multiPolygonCoords = feature.geometry.coordinates.map(poly => {
                  // Each polygon in the multi-polygon
                  return poly[0].map(coord => [coord[1], coord[0]]);
                });
                polygon = L.polygon(multiPolygonCoords, {
                  color: '#00796b',
                  weight: 2,
                  fillColor: '#4db6ac',
                  fillOpacity: 0.3
                });
                
                // For MultiPolygon, we need to check each ring
                polygonLatLngs = polygon.getLatLngs().flat();
                polygonCoordinates = multiPolygonCoords.flat();
              }
              
              // First do a quick bounds check (for performance)
              if (polygon && polygon.getBounds().contains(point)) {
                // Then do a precise point-in-polygon check
                const isInside = isMarkerInsidePolygon(point, polygonLatLngs);
                
                if (isInside) {
                  // Add the polygon to the map
                  polygonRef.current = polygon.addTo(mapInstanceRef.current);
                  
                  // Extract ward name and zone for the label
                  const wardName = feature.properties["Ward Name"] || feature.properties.Name || "Unknown Ward";
                  const zone = feature.properties.Zone || "";
                  
                  // Create a label at the center of the polygon
                  const bounds = polygon.getBounds();
                  const center = bounds.getCenter();
                  
                  // Create a label with the ward name and zone
                  const labelContent = `<div style="background-color: rgba(255, 255, 255, 0.8); padding: 5px; border-radius: 3px; font-weight: bold;">
                    ${wardName}${zone ? ` (${zone} Zone)` : ''}
                  </div>`;
                  
                  labelRef.current = L.marker(center, {
                    icon: L.divIcon({
                      className: 'ward-label',
                      html: labelContent,
                      iconSize: [100, 40],
                      iconAnchor: [50, 20]
                    })
                  }).addTo(mapInstanceRef.current);
                  
                  // Fit the map to show both the marker and the polygon
                  const allPoints = [location, ...polygonCoordinates];
                  const allBounds = L.latLngBounds(allPoints);
                  mapInstanceRef.current.fitBounds(allBounds, { padding: [50, 50] });
                  
                  break;
                }
              }
            } catch (error) {
              console.error('Error creating BBMP polygon:', error);
            }
          }
        }
      }
      
      // Update location info
      const bbmpInfo = findBBMPInfo(lat, lng);
      const policeStation = findPoliceJurisdiction(lat, lng);
      const revenueClassification = findRevenueClassification(lat, lng);
      const revenueOffices = findRevenueOffices(lat, lng);
      const constituencyInfo = findConstituency(lat, lng);
      
      setLocationInfo({
        address: address || "Unknown address",
        coordinates: { lat, lng },
        bbmpInfo,
        revenueClassification,
        revenueOffices: revenueOffices,
        policeJurisdiction: {
          ...policeStation,
          'Electicity station': 'Calculated from GeoJSON'
        },
        constituency: constituencyInfo
      });
      
      // Show the info panel
      setShowInfoPanel(true);
    } catch (error) {
      console.error('Error zooming to location:', error);
    }
  };

  // Handle keyboard navigation for suggestions
  const handleKeyDown = (e) => {
    // Only handle keys if suggestions are showing
    if (!showSuggestions) {
      return;
    }
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault(); // Prevent cursor from moving in input
        setActiveSuggestionIndex(prevIndex => 
          prevIndex < searchResults.length - 1 ? prevIndex + 1 : prevIndex
        );
        break;
        
      case 'ArrowUp':
        e.preventDefault(); // Prevent cursor from moving in input
        setActiveSuggestionIndex(prevIndex => 
          prevIndex > 0 ? prevIndex - 1 : 0
        );
        break;
        
      case 'Enter':
        // If we have an active suggestion, select it
        if (activeSuggestionIndex >= 0 && activeSuggestionIndex < searchResults.length) {
          e.preventDefault(); // Prevent form submission
          handleLocationSelect(searchResults[activeSuggestionIndex]);
        }
        break;
        
      case 'Escape':
        setShowSuggestions(false);
        setActiveSuggestionIndex(-1);
        break;
        
      default:
        break;
    }
  };

  // Handle search input changes
  const handleSearchInputChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    
    // Clear any pending search
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    // Search with a tiny delay to avoid too many requests
    searchTimeoutRef.current = setTimeout(() => {
      searchLocations(value);
    }, 150);
  };

  // Handle form submission
  const handleSearch = (e) => {
    e.preventDefault();
    
    // If there's an active suggestion, use that one
    if (activeSuggestionIndex >= 0 && activeSuggestionIndex < searchResults.length) {
      const location = searchResults[activeSuggestionIndex];
      handleLocationSelect(location);
    } else if (selectedLocation) {
      // We already have a selected location, just zoom to it again
      const { lat, lon } = selectedLocation;
      zoomToLocation(parseFloat(lat), parseFloat(lon), selectedLocation.display_name);
    } else if (searchResults.length > 0) {
      // Use the first result
      const location = searchResults[0];
      handleLocationSelect(location);
    } else if (searchQuery.length >= 2) {
      // Perform a new search
      searchLocations(searchQuery);
    }
    
    // Close suggestions after search
    setShowSuggestions(false);
  };

  // Toggle mobile info panel state (expanded/collapsed)
  const toggleMobileInfoPanel = () => {
    const panel = document.getElementById('mobile-info-panel');
    if (panel) {
      if (panel.classList.contains('mobile-info-collapsed')) {
        panel.classList.remove('mobile-info-collapsed');
        panel.classList.add('mobile-info-expanded');
        setIsPanelExpanded(true);
      } else {
        panel.classList.remove('mobile-info-expanded');
        panel.classList.add('mobile-info-collapsed');
        setIsPanelExpanded(false);
      }
    }
  };

  // Add a touch handling function
  const handleTouchStart = (e) => {
    touchStartRef.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e) => {
    touchEndRef.current = e.touches[0].clientY;
  };

  const handleTouchEnd = useCallback(() => {
    if (!touchStartRef.current || !touchEndRef.current) return;
    
    const distance = touchStartRef.current - touchEndRef.current;
    const isUpSwipe = distance > minSwipeDistance;
    const isDownSwipe = distance < -minSwipeDistance;
    
    if (isUpSwipe && !isPanelExpanded) {
      // Swipe up to expand
      toggleMobileInfoPanel();
    } else if (isDownSwipe && isPanelExpanded) {
      // Swipe down to collapse
      toggleMobileInfoPanel();
    }
    
    // Reset values
    touchStartRef.current = null;
    touchEndRef.current = null;
  }, [isPanelExpanded]);

  return (
    <div className="bg-gray-100 h-screen flex flex-col justify-start items-center p-0">
      <div className="w-full h-screen flex flex-col bg-white overflow-hidden">
        {/* Header Area (always at top) */}
        <div className="px-4 py-6 text-center">
          <h1 className="text-xl md:text-2xl font-bold mb-3 text-blue-600">
            Civic Compass
            <span className="text-sm md:text-base font-medium text-gray-500 ml-2">by ZenCitizen</span>
          </h1>
          <h2 className="text-lg md:text-xl font-semibold text-center mt-4">
            Find key details of your address in Bangalore
            <button 
  type="button"
  className="inline-flex align-baseline ml-1 text-gray-500 hover:text-blue-500 focus:outline-none relative top-[0.125em]"
  onMouseEnter={(e) => {
    // Determine if there's enough space below
    const rect = e.currentTarget.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    
    // If less than 100px below, show above instead
    if (spaceBelow < 100) {
      setTooltipPosition('top');
    } else {
      setTooltipPosition('bottom');
    }
    setShowTooltip(true);
  }}
  onMouseLeave={() => setShowTooltip(false)}
  aria-label="More information"
>
  <Info size={16} />
</button>

{/* Fixed tooltip that renders outside the normal component hierarchy */}
{showTooltip && (
  <div id="tooltip-portal">
    {ReactDOM.createPortal(
      <div 
        className="fixed bg-white rounded-lg shadow-lg text-sm text-left text-gray-700 border border-gray-200"
        style={{
          padding: '12px',
          width: '280px',
          maxWidth: '90vw',
          zIndex: 9999,
          // Position will be set by JavaScript below
          // This ensures it's always in the viewport
        }}
        ref={(el) => {
          if (el) {
            // Get position of the info button
            const infoButton = document.querySelector('button[aria-label="More information"]');
            if (infoButton) {
              const rect = infoButton.getBoundingClientRect();
              
              // Default: position below
              let top = rect.bottom + 8;
              let left = rect.left;
              
              // If should show above
              if (tooltipPosition === 'top') {
                const tooltipHeight = el.offsetHeight;
                top = rect.top - tooltipHeight - 8;
              }
              
              // Ensure it doesn't go off the right side
              const rightEdge = left + el.offsetWidth;
              if (rightEdge > window.innerWidth) {
                left = window.innerWidth - el.offsetWidth - 10;
              }
              
              // Ensure it doesn't go off the left side
              if (left < 10) {
                left = 10;
              }
              
              // Apply the positioning
              el.style.top = `${top}px`;
              el.style.left = `${left}px`;
            }
          }
        }}
      >
        This tool helps you discover information about your Bangalore address including BBMP Ward details, Revenue classifications, and Police jurisdictions.
      </div>,
      document.body
    )}
  </div>
)}
          </h2>
          
          <div className="mt-6 max-w-md mx-auto">
            <div className="flex items-center gap-2">
              <form onSubmit={handleSearch} className="relative flex-grow">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={handleSearchInputChange}
                  onKeyDown={handleKeyDown}
                  onFocus={() => searchQuery.length >= 2 && setShowSuggestions(true)}
                  placeholder="Enter exact address or click on map"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg pr-12 truncate"
                />
                <button 
                  type="submit"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-blue-600 hover:text-blue-800"
                >
                  {isSearching ? <Loader size={20} className="animate-spin" /> : <Search size={20} />}
                </button>
                
                {/* Search suggestions */}
                {showSuggestions && (
                  <div className="absolute text-left mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg z-50 max-h-60 overflow-y-auto">
                    {searchResults.map((result, index) => (
                      <div 
                        key={index}
                        className={`p-2 cursor-pointer border-b border-gray-100 last:border-0 ${
                          index === activeSuggestionIndex ? 'bg-blue-100' : 'hover:bg-gray-100'
                        }`}
                        onClick={() => handleLocationSelect(result)}
                      >
                        <div className="font-medium">{result.display_name.split(',')[0]}</div>
                        <div className="text-xs text-gray-500">{result.display_name}</div>
                      </div>
                    ))}
                    {searchResults.length === 0 && !isSearching && (
                      <div className="p-2 text-gray-500">No results found</div>
                    )}
                    {isSearching && (
                      <div className="p-2 text-gray-500 flex items-center">
                        <Loader size={16} className="animate-spin mr-2" /> Searching...
                      </div>
                    )}
                  </div>
                )}
              </form>
              
              {/* Location pin button outside search bar */}
              <button 
                type="button"
                onClick={setCurrentLocation}
                className="bg-white p-2 rounded-lg border border-gray-300 text-blue-600 hover:text-blue-800 hover:border-blue-300 transition-colors"
                title="Use your current location"
              >
                <MapPin size={20} />
              </button>
            </div>
          </div>
        </div>
  
        {/* Map Container (flex-grow to take remaining space) */}
        <div className="flex-1 relative">
          {/* Map container */}
          <div 
            ref={mapContainerRef} 
            className="w-full h-full absolute inset-0" 
          ></div>
          
          {/* Desktop Info Panel (only visible on desktop) */}
          {selectedLocation && !isMobile && (
            <div className="absolute top-4 left-4 z-40 bg-white rounded-lg shadow-lg max-w-sm w-full md:w-96 max-h-80vh overflow-auto">
              <div className="p-4 overflow-y-auto" style={{ maxHeight: 'calc(80vh - 40px)' }}>
                <div className="flex justify-between items-center mb-2">
                  <h2 className="font-bold text-gray-800">Location Details</h2>
                </div>
                
                <div className="text-sm text-gray-600 mb-4 border-b pb-2">
                  {selectedLocation.display_name}
                </div>
                
                <div className="space-y-6">
                  {/* BBMP information */}
                  <div>
                    <h2 className="font-semibold text-gray-700 mb-3 pb-2 border-b">BBMP information</h2>
                    <div className="space-y-1">
                      {Object.entries(locationInfo.bbmpInfo).map(([fieldName, value]) => (
                        <div key={fieldName} className="grid grid-cols-2 py-1">
                          <span className="text-gray-600">{fieldName}</span>
                          <span className="font-medium">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Revenue Classification */}
                  <div>
                    <h2 className="font-semibold text-gray-700 mb-3 pb-2 border-b">Revenue Classification</h2>
                    <div className="space-y-1">
                      {Object.entries(locationInfo.revenueClassification)
                        .filter(([key]) => key !== 'htmlDescription')
                        .map(([fieldName, value]) => (
                          <div key={fieldName} className="grid grid-cols-2 py-1">
                            <span className="text-gray-600">{fieldName}</span>
                            <span className="font-medium">{value}</span>
                          </div>
                        ))
                      }
                    </div>
                    
                    {/* HTML Description from Revenue Classification */}
                    {locationInfo.revenueClassification.htmlDescription && (
                      <div className="mt-4">
                        <button 
                          onClick={() => {
                            const detailsElement = document.getElementById('revenue-details');
                            if (detailsElement) {
                              detailsElement.open = !detailsElement.open;
                            }
                          }}
                          className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
                        >
                          <Info size={14} className="mr-1" /> View detailed information
                        </button>
                        <details id="revenue-details" className="mt-2 text-xs border rounded p-2">
                          <summary className="cursor-pointer font-medium">Revenue Classification Details</summary>
                          <div 
                            className="mt-2 overflow-auto max-h-60 text-xs"
                            dangerouslySetInnerHTML={{ 
                              __html: locationInfo.revenueClassification.htmlDescription 
                            }} 
                          />
                        </details>
                      </div>
                    )}
                  </div>
                  
                  {/* Revenue Offices */}
                  <div>
                    <h2 className="font-semibold text-gray-700 mb-3 pb-2 border-b">Revenue Offices</h2>
                    <div className="space-y-4">
                      {/* SRO Information */}
                      <div className="space-y-2">
                        <div className="grid grid-cols-2 py-1">
                          <span className="text-gray-600 pr-2">SRO</span>
                          <span className="font-medium">{locationInfo.revenueOffices.SRO}</span>
                        </div>
                        <div className="grid grid-cols-2 py-1">
                          <span className="text-gray-600 pr-2">Address</span>
                          <span className="text-sm">{locationInfo.revenueOffices['SRO Address']}</span>
                        </div>
                        {locationInfo.revenueOffices['SRO Maps Link'] && (
                          <div className="grid grid-cols-2 py-1">
                            <span className="text-gray-600 pr-2">Map link</span>
                            <a 
                              href={locationInfo.revenueOffices['SRO Maps Link']} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
                            >
                              <ExternalLink size={16} className="mr-1" /> Google Maps
                            </a>
                          </div>
                        )}
                      </div>
                      
                      {/* DRO Information */}
                      <div className="space-y-2 mt-4">
                        <div className="grid grid-cols-2 py-1">
                          <span className="text-gray-600 pr-2">DRO</span>
                          <span className="font-medium">{locationInfo.revenueOffices.DRO}</span>
                        </div>
                        <div className="grid grid-cols-2 py-1">
                          <span className="text-gray-600 pr-2">Address</span>
                          <span className="text-sm">{locationInfo.revenueOffices['DRO Address']}</span>
                        </div>
                        {locationInfo.revenueOffices['DRO Maps Link'] && (
                          <div className="grid grid-cols-2 py-1">
                            <span className="text-gray-600 pr-2">Map link</span>
                            <a 
                              href={locationInfo.revenueOffices['DRO Maps Link']} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
                            >
                              <ExternalLink size={16} className="mr-1" /> Google Maps
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Police Jurisdiction */}
                  <div>
                    <h2 className="font-semibold text-gray-700 mb-3 pb-2 border-b">Police Jurisdiction</h2>
                    <div className="space-y-4">
                      {/* Police Station Information */}
                      <div className="space-y-2">
                        <div className="grid grid-cols-2 py-1">
                          <span className="text-gray-600 pr-2">Police station</span>
                          <span className="font-medium">{locationInfo.policeJurisdiction['Police station']}</span>
                        </div>
                        <div className="grid grid-cols-2 py-1">
                          <span className="text-gray-600 pr-2">Address</span>
                          <span className="text-sm">{locationInfo.policeJurisdiction['Police station Address']}</span>
                        </div>
                        {locationInfo.policeJurisdiction['Police station Maps Link'] && (
                          <div className="grid grid-cols-2 py-1">
                            <span className="text-gray-600 pr-2">Map link</span>
                            <a 
                              href={locationInfo.policeJurisdiction['Police station Maps Link']} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
                            >
                              <ExternalLink size={16} className="mr-1" /> Google Maps
                            </a>
                          </div>
                        )}
                      </div>
                      
                      {/* Traffic Police Station Information */}
                      <div className="space-y-2 mt-4">
                        <div className="grid grid-cols-2 py-1">
                          <span className="text-gray-600 pr-2">Traffic station</span>
                          <span className="font-medium">{locationInfo.policeJurisdiction['Traffic station']}</span>
                        </div>
                        <div className="grid grid-cols-2 py-1">
                          <span className="text-gray-600 pr-2">Address</span>
                          <span className="text-sm">{locationInfo.policeJurisdiction['Traffic station Address']}</span>
                        </div>
                        {locationInfo.policeJurisdiction['Traffic station Maps Link'] && (
                          <div className="grid grid-cols-2 py-1">
                            <span className="text-gray-600 pr-2">Map link</span>
                            <a 
                              href={locationInfo.policeJurisdiction['Traffic station Maps Link']} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
                            >
                              <ExternalLink size={16} className="mr-1" /> Google Maps
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Mobile Info Panel (only visible on mobile) */}
          {selectedLocation && isMobile && showInfoPanel && (
            <div 
              id="mobile-info-panel"
              ref={infoPanelRef}
              className="mobile-info-panel bg-white mobile-info-collapsed"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              {/* Mobile Info Panel Header - Fix truncation issue in expanded state */}
              <div className="mobile-info-panel-header flex flex-col items-center" onClick={toggleMobileInfoPanel}>
                <div className="flex justify-center items-center h-6 text-blue-500">
                  {isPanelExpanded ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="18 15 12 9 6 15"></polyline>
                    </svg>
                  )}
                </div>
                <div className={`text-sm text-gray-600 mt-1 w-full px-3 text-left font-medium ${isPanelExpanded ? '' : 'truncate'}`}>
                  {selectedLocation.display_name}
                </div>
              </div>
              
              {/* Preview content (shown when collapsed) */}
              <div className="preview-content border-t border-gray-100 py-4 px-4">
                <div className="flex flex-col gap-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-medium text-gray-500">Ward</span>
                    <span className="text-sm font-medium text-gray-800">{locationInfo.bbmpInfo['Ward name']}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-medium text-gray-500">Zone</span>
                    <span className="text-sm font-medium text-gray-800">{locationInfo.bbmpInfo['Zone']}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-medium text-gray-500">Police Station</span>
                    <span className="text-sm font-medium text-gray-800 truncate ml-2 max-w-[60%] text-right">{locationInfo.policeJurisdiction['Police station']}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-medium text-gray-500">SRO</span>
                    <span className="text-sm font-medium text-gray-800 truncate ml-2 max-w-[60%] text-right">{locationInfo.revenueOffices['SRO']}</span>
                  </div>
                </div>
              </div>
              
              {/* Mobile Info Panel Content */}
              <div className="p-4 space-y-6 overflow-y-auto section-content" onClick={(e) => e.stopPropagation()}>
                {/* BBMP information */}
                <div>
                  <h2 className="font-semibold text-gray-700 mb-3 pb-2 border-b">BBMP information</h2>
                  <div className="space-y-2">
                    {Object.entries(locationInfo.bbmpInfo).map(([fieldName, value]) => (
                      <div key={fieldName} className="grid grid-cols-2 py-1">
                        <span className="text-gray-600 pr-2">{fieldName}</span>
                        <span className="font-medium">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Revenue Classification */}
                <div>
                  <h2 className="font-semibold text-gray-700 mb-3 pb-2 border-b">Revenue Classification</h2>
                  <div className="space-y-2">
                    {Object.entries(locationInfo.revenueClassification)
                      .filter(([key]) => key !== 'htmlDescription')
                      .map(([fieldName, value]) => (
                        <div key={fieldName} className="grid grid-cols-2 py-1">
                          <span className="text-gray-600 pr-2">{fieldName}</span>
                          <span className="font-medium">{value}</span>
                        </div>
                      ))
                    }
                  </div>
                </div>
                
                {/* Revenue Offices */}
                <div>
                  <h2 className="font-semibold text-gray-700 mb-3 pb-2 border-b">Revenue Offices</h2>
                  <div className="space-y-4">
                    {/* SRO Information */}
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 py-1">
                        <span className="text-gray-600 pr-2">SRO</span>
                        <span className="font-medium">{locationInfo.revenueOffices.SRO}</span>
                      </div>
                      <div className="grid grid-cols-2 py-1">
                        <span className="text-gray-600 pr-2">Address</span>
                        <span className="text-sm">{locationInfo.revenueOffices['SRO Address']}</span>
                      </div>
                      {locationInfo.revenueOffices['SRO Maps Link'] && (
                        <div className="grid grid-cols-2 py-1">
                          <span className="text-gray-600 pr-2">Map link</span>
                          <a 
                            href={locationInfo.revenueOffices['SRO Maps Link']} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
                          >
                            <ExternalLink size={16} className="mr-1" /> Google Maps
                          </a>
                        </div>
                      )}
                    </div>
                    
                    {/* DRO Information */}
                    <div className="space-y-2 mt-4">
                      <div className="grid grid-cols-2 py-1">
                        <span className="text-gray-600 pr-2">DRO</span>
                        <span className="font-medium">{locationInfo.revenueOffices.DRO}</span>
                      </div>
                      <div className="grid grid-cols-2 py-1">
                        <span className="text-gray-600 pr-2">Address</span>
                        <span className="text-sm">{locationInfo.revenueOffices['DRO Address']}</span>
                      </div>
                      {locationInfo.revenueOffices['DRO Maps Link'] && (
                        <div className="grid grid-cols-2 py-1">
                          <span className="text-gray-600 pr-2">Map link</span>
                          <a 
                            href={locationInfo.revenueOffices['DRO Maps Link']} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
                          >
                            <ExternalLink size={16} className="mr-1" /> Google Maps
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Police Jurisdiction */}
                <div>
                  <h2 className="font-semibold text-gray-700 mb-3 pb-2 border-b">Police Jurisdiction</h2>
                  <div className="space-y-4">
                    {/* Police Station Information */}
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 py-1">
                        <span className="text-gray-600 pr-2">Police station</span>
                        <span className="font-medium">{locationInfo.policeJurisdiction['Police station']}</span>
                      </div>
                      <div className="grid grid-cols-2 py-1">
                        <span className="text-gray-600 pr-2">Address</span>
                        <span className="text-sm">{locationInfo.policeJurisdiction['Police station Address']}</span>
                      </div>
                      {locationInfo.policeJurisdiction['Police station Maps Link'] && (
                        <div className="grid grid-cols-2 py-1">
                          <span className="text-gray-600 pr-2">Map link</span>
                          <a 
                            href={locationInfo.policeJurisdiction['Police station Maps Link']} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
                          >
                            <ExternalLink size={16} className="mr-1" /> Google Maps
                          </a>
                        </div>
                      )}
                    </div>
                    
                    {/* Traffic Police Station Information */}
                    <div className="space-y-2 mt-4">
                      <div className="grid grid-cols-2 py-1">
                        <span className="text-gray-600 pr-2">Traffic station</span>
                        <span className="font-medium">{locationInfo.policeJurisdiction['Traffic station']}</span>
                      </div>
                      <div className="grid grid-cols-2 py-1">
                        <span className="text-gray-600 pr-2">Address</span>
                        <span className="text-sm">{locationInfo.policeJurisdiction['Traffic station Address']}</span>
                      </div>
                      {locationInfo.policeJurisdiction['Traffic station Maps Link'] && (
                        <div className="grid grid-cols-2 py-1">
                          <span className="text-gray-600 pr-2">Map link</span>
                          <a 
                            href={locationInfo.policeJurisdiction['Traffic station Maps Link']} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
                          >
                            <ExternalLink size={16} className="mr-1" /> Google Maps
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Add 40px padding at bottom to ensure everything is visible when scrolling */}
                <div className="h-10"></div>
              </div>
            </div>
          )}
          
          {/* Zoom notification */}
          {zoomedLocation && (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50">
              <div className="bg-orange-500 text-white px-3 py-1 rounded-md shadow-md">
                <div className="absolute h-6 w-6 right-0 bottom-0 transform translate-x-3 translate-y-3">
                  <div className="w-6 h-0.5 bg-orange-500 rotate-45 origin-left"></div>
                </div>
              </div>
            </div>
          )}
          
          {/* Loading indicator for reverse geocoding */}
          {isReverseGeocoding && (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 bg-white bg-opacity-75 p-3 rounded-lg shadow-lg">
              <div className="flex items-center">
                <Loader size={24} className="animate-spin mr-2 text-blue-500" />
                <span>Getting location info...</span>
              </div>
            </div>
          )}
          
          {/* Map controls */}
          <div className="leaflet-map-controls absolute top-4 right-4 flex flex-col gap-2">
            <button 
              className="bg-white p-2 rounded shadow hover:bg-gray-100 text-blue-600"
              onClick={zoomIn}
            >+</button>
            <button 
              className="bg-white p-2 rounded shadow hover:bg-gray-100 text-blue-600"
              onClick={zoomOut}
            >−</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BangaloreAddressMap;

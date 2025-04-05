import React, { useState, useEffect, useRef, useCallback } from 'react';
import { LocateFixed, Search, Info, Loader, ExternalLink, ChevronDown, ChevronUp, ArrowLeft, Sun, Moon, Plus, Minus } from 'lucide-react';
import policeJurisdiction from '../layers/PoliceJurisdiction_5.json'
import BBMPInformation from '../layers/BBMPInformation_11.json'
import Constituencies from '../layers/Constituencies_3.json'
import RevenueOffices from '../layers/RevenueOffices_6.json'
import RevenueClassification from '../layers/RevenueClassification_10.json'
import bescomSectionBoundary from '../layers/bescom-section-boundary.json'
import bescomDivisionBoundary from '../layers/bescom-division-boundary.json'
import bescomSubdivisionBoundary from '../layers/bescom-subdivision-boundary.json'
import bescomOffices from '../layers/bescom-offices.json'
import bwssbDivisions from '../layers/bwssb_divisions.json'
import bwssbSubDivisions from '../layers/bwssb_sub_divisions.json'
import bwssbServiceStations from '../layers/bwssb_service_station_divisions.json'
import bdaLayoutBoundaries from '../layers/bda_layout_boundaries.json'
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
      'Zone': 'Unknown',
      'Division': 'Unknown',
      'Subdivision': 'Unknown',
      'Ward name': 'Unknown',
      'Ward number': 'Unknown'
    },
    revenueClassification: {
      'Hobli': 'Unknown',
      'Taluk': 'Unknown',
      'District': 'Unknown',
      'Land zone': 'Unknown'
    },
    revenueOffices: {
      'Tahsildar Office': 'Unknown',
      'Tahsildar Office Address': 'Loading...',
      'Tahsildar Office Maps Link': null,
      'SRO': 'Unknown',
      'SRO Address': 'Loading...',
      'SRO Maps Link': null,
      'DRO': 'Unknown',
      'DRO Address': 'Loading...',
      'DRO Maps Link': null
    },
    policeJurisdiction: {
      'Police station': 'Unknown',
      'Traffic station': 'Unknown',
      'Police station Address': 'Unknown',
      'Traffic station Address': 'Unknown',
      'Police station Maps Link': null,
      'Traffic station Maps Link': null,
      'Electicity station': 'Unknown'
    },
    bescomInfo: {
      'Division': 'Unknown',
      'Division Office': 'Unknown',
      'Division Address': 'Loading...',
      'Division Contact': 'Loading...',
      'Subdivision': 'Unknown',
      'Subdivision Office': 'Unknown',
      'Subdivision Address': 'Loading...',
      'Subdivision Contact': 'Loading...',
      'Section': 'Unknown',
      'Section Office': 'Unknown',
      'Section Address': 'Loading...',
      'Section Contact': 'Loading...'
    },
    bwssbInfo: {
      'Division': 'Unknown',
      'Division Office': 'Unknown',
      'Division Address': 'Loading...',
      'Division Contact': 'Loading...',
      'Subdivision': 'Unknown',
      'Subdivision Office': 'Unknown',
      'Subdivision Address': 'Loading...',
      'Subdivision Contact': 'Loading...',
      'Service Station': 'Unknown',
      'Service Station Office': 'Unknown',
      'Service Station Address': 'Loading...',
      'Service Station Contact': 'Loading...'
    },
    bdaInfo: {
      'BDA Layout Name': "Unknown",
      'BDA Layout Number': "Unknown"
    }
  });
  
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const polygonRef = useRef(null);
  const labelRef = useRef(null);
  const searchTimeoutRef = useRef(null);
  const infoPanelRef = useRef(null);
  const scrollableContentRef = useRef(null); // <-- Add ref for scrollable content
  const [showTooltip, setShowTooltip] = useState(false);
  const touchStartRef = useRef(null);
  const touchEndRef = useRef(null);
  const minSwipeDistance = 150; // minimum distance required for swipe action
  const [showIntroPanel, setShowIntroPanel] = useState(true); // New state to control intro panel visibility
  const [isDarkMode, setIsDarkMode] = useState(false); // <-- Add dark mode state
  // State for panel expansion (start expanded on mobile if intro is showing)
  const [isPanelExpanded, setIsPanelExpanded] = useState(false);
  const [lastToggledAccordion, setLastToggledAccordion] = useState(null); // <-- State to track last opened accordion

  // First, add state for tracking open accordions
  const [openAccordions, setOpenAccordions] = useState({
    bbmpInfo: true, // Open by default
    revenueClassification: false,
    revenueOffices: false,
    policeJurisdiction: false,
    bescomInfo: false,
    bwssbInfo: false,
    bdaInfo: false // Add BDA info accordion section
  });
 // Also open by default
  // Reset accordion state function
  const resetAccordions = () => {
    setOpenAccordions({
      bbmpInfo: true,
      revenueClassification: false,
      revenueOffices: false,
      policeJurisdiction: false,
      bescomInfo: false,
      bwssbInfo: false,
      bdaInfo: false
    });
  };
  // Then add a toggle function for accordions
  const toggleAccordion = (section) => {
    setOpenAccordions(prev => {
      const isOpening = !prev[section]; // Check if we are opening this section
      const newState = {
        ...prev,
        [section]: isOpening
      };
      // If opening, track which one was just opened
      if (isOpening) {
        setLastToggledAccordion(section);
      } else {
          setLastToggledAccordion(null); // Reset if closing
      }
      return newState;
    });
  };

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

  useEffect(() => {
    // Scroll adjustment effect for mobile accordion
    // Only run if an accordion was just opened and we are on mobile
    if (lastToggledAccordion && isMobile && scrollableContentRef.current) {
      // Use requestAnimationFrame to ensure calculation happens after DOM update
      requestAnimationFrame(() => {
        // Find the accordion's container element using the data attribute
        const accordionElement = scrollableContentRef.current.querySelector(`[data-accordion-section="${lastToggledAccordion}"]`);

        if (accordionElement && scrollableContentRef.current) {
          // Calculate the offsetTop relative to the scrollable container's parent
          // (since offsetTop is relative to the offsetParent, which might not be the scrollable container itself)
          const offsetTop = accordionElement.offsetTop;

          // Get the sticky header's height (it's the previous sibling of the scrollable container)
          const headerElement = scrollableContentRef.current.previousElementSibling;
          const headerHeight = headerElement ? headerElement.offsetHeight : 0;

          // Calculate the desired scroll position
          // We want the top of the accordion element to be just below the sticky header
          const desiredScrollTop = offsetTop - headerHeight - 10; // Subtract 10px for a small margin

          // Set the scroll position
          scrollableContentRef.current.scrollTop = desiredScrollTop;
        }
        // Reset the tracker after attempting scroll adjustment
        // This prevents re-scrolling if the component re-renders for other reasons
        setLastToggledAccordion(null);
      });
    }
  }, [lastToggledAccordion, isMobile]); // Depend on the tracker and mobile status

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
    console.log("BESCOM Division Boundary data loaded:", bescomDivisionBoundary);
    console.log("BESCOM Subdivision Boundary data loaded:", bescomSubdivisionBoundary);
    console.log("BESCOM Section Boundary data loaded:", bescomSectionBoundary);
    console.log("BESCOM Offices data loaded:", bescomOffices);
    console.log("BWSSB Divisions data loaded:", bwssbDivisions);
    console.log("BWSSB Sub Divisions data loaded:", bwssbSubDivisions);
    console.log("BWSSB Service Stations data loaded:", bwssbServiceStations);
    
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
            z-index: 400; /* Lower z-index to be below search suggestions */
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
              font-size: 16px; /* Changed from 14px to 16px */
            }
            
            .mobile-info-panel h2 {
              font-size: 18px; /* Increased from 16px to 18px for better hierarchy */
            }
            
            .mobile-info-panel .full-width-text {
              grid-column: span 2;
              padding-top: 4px;
            }
            
            /* Make values in mobile panel consistent with 16px */
            .mobile-info-panel .grid span.font-medium {
              font-size: 16px;
            }
            
            /* Ensure address text and Google Maps links are also 16px */
            .mobile-info-panel .flex-col span.text-sm, 
            .mobile-info-panel .flex-col a.text-sm {
              font-size: 16px;
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
      // Remove tooltip portal if it exists
      const tooltipPortal = document.getElementById('tooltip-portal');
      if (tooltipPortal) {
        document.body.removeChild(tooltipPortal);
      }
    };
  }, [mapContainerRef]);

  // Function to find BBMP information for a location
  const findBBMPInfo = (lat, lng) => {
    if (!BBMPInformation || !BBMPInformation.features) {
      return {
        Zone: "Missing data",
        Division: "Missing data",
        Subdivision: "Missing data",
        'Ward name': "Missing data",
        'Ward number': "Missing data"
      };
    }

    const L = window.L;
    if (!L) return {
      Zone: "Missing data",
      Division: "Missing data",
      Subdivision: "Missing data",
      'Ward name': "Missing data",
      'Ward number': "Missing data"
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
      Zone: "Missing data",
      Division: "Missing data",
      Subdivision: "Missing data",
      'Ward name': "Missing data",
      'Ward number': "Missing data"
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
      'Police station': "Unknown",
      'Traffic station': "Unknown",
      'Police station Address': "Unknown",
      'Traffic station Address': "Unknown",
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
      District: "Missing data",
      Taluk: "Missing data",
      Hobli: "Missing data",
      Village: "Missing data",
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
      'SRO': "Unknown",
      'DRO': "Unknown",
      'SRO Address': "Unknown",
      'DRO Address': "Unknown",
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
      'Constituency Name': "Unknown",
      'Constituency Type': "Unknown"
    };
  };

  // Function to find BESCOM information for a location
  const findBescomInfo = (lat, lng) => {
    if (!bescomDivisionBoundary || !bescomDivisionBoundary.features ||
        !bescomSubdivisionBoundary || !bescomSubdivisionBoundary.features ||
        !bescomSectionBoundary || !bescomSectionBoundary.features ||
        !bescomOffices || !bescomOffices.features) {
      return {
        'Division': "Unknown",
        'Sub Division': "Unknown",
        'Section': "Unknown",
        'Office Name': "Unknown",
        'Office Address': "Unknown",
        'Office Maps Link': null
      };
    }

    const L = window.L;
    if (!L) return {
      'Division': "Unknown",
      'Sub Division': "Unknown",
      'Section': "Unknown",
      'Office Name': "Unknown",
      'Office Address': "Unknown",
      'Office Maps Link': null
    };

    // Create a point for the clicked location
    const point = L.latLng(lat, lng);
    
    // Find the BESCOM division
    let divisionName = "Unknown";
    for (const feature of bescomDivisionBoundary.features) {
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
              divisionName = feature.properties.DivisionName || "Unknown";
              console.log("Found BESCOM Division:", divisionName, feature.properties);
              break;
            }
          }
        } catch (error) {
          console.error('Error checking BESCOM division polygon:', error);
        }
      }
    }
    
    // Find the BESCOM subdivision
    let subdivisionName = "Unknown";
    for (const feature of bescomSubdivisionBoundary.features) {
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
              subdivisionName = feature.properties.Sub_DivisionName || "Unknown";
              console.log("Found BESCOM Subdivision:", subdivisionName, feature.properties);
              break;
            }
          }
        } catch (error) {
          console.error('Error checking BESCOM subdivision polygon:', error);
        }
      }
    }
    
    // Find the BESCOM section
    let sectionName = "Unknown";
    for (const feature of bescomSectionBoundary.features) {
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
              sectionName = feature.properties.SectionName || "Unknown";
              console.log("Found BESCOM Section:", sectionName, feature.properties);
              break;
            }
          }
        } catch (error) {
          console.error('Error checking BESCOM section polygon:', error);
        }
      }
    }
    
    // Find the nearest BESCOM office
    let officeName = "Unknown";
    let officeAddress = "Unknown";
    let officeMapsLink = null;
    
    // Find the nearest BESCOM office (using point features)
    if (bescomOffices.features.length > 0) {
      let nearestOffice = null;
      let shortestDistance = Infinity;
      
      for (const feature of bescomOffices.features) {
        if (feature.geometry && feature.geometry.type === "Point") {
          try {
            const officeCoords = feature.geometry.coordinates;
            const officeLatLng = L.latLng(officeCoords[1], officeCoords[0]);
            
            // Calculate distance
            const distance = point.distanceTo(officeLatLng);
            
            if (distance < shortestDistance) {
              shortestDistance = distance;
              nearestOffice = feature;
            }
          } catch (error) {
            console.error('Error calculating distance to BESCOM office:', error);
          }
        }
      }
      
      if (nearestOffice) {
        officeName = nearestOffice.properties.ESCOM_OfficeName || "Unknown";
        console.log("Found nearest BESCOM Office:", officeName, nearestOffice.properties);
        // Placeholder for address and maps link - would need actual data source
        officeAddress = "Address not available";
      }
    }
    
    return {
      'Division': divisionName,
      'Sub Division': subdivisionName,
      'Section': sectionName,
      'Office Name': officeName,
      'Office Address': officeAddress,
      'Office Maps Link': officeMapsLink
    };
  };

  // Function to find BWSSB information for a location
  const findBwssbInfo = (lat, lng) => {
    if (!bwssbDivisions || !bwssbDivisions.features ||
        !bwssbSubDivisions || !bwssbSubDivisions.features ||
        !bwssbServiceStations || !bwssbServiceStations.features) {
      return {
        'Division': "Unknown",
        'Sub Division': "Unknown",
        'Service Station': "Unknown",
        'Office Address': "Unknown",
        'Office Maps Link': null
      };
    }

    const L = window.L;
    if (!L) return {
      'Division': "Unknown",
      'Sub Division': "Unknown",
      'Service Station': "Unknown",
      'Office Address': "Unknown",
      'Office Maps Link': null
    };

    // Create a point for the clicked location
    const point = L.latLng(lat, lng);
    
    // Find the BWSSB division
    let divisionName = "Unknown";
    for (const feature of bwssbDivisions.features) {
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
              divisionName = feature.properties.DivisionName || "Unknown";
              console.log("Found BWSSB Division:", divisionName, feature.properties);
              break;
            }
          }
        } catch (error) {
          console.error('Error checking BWSSB division polygon:', error);
        }
      }
    }
    
    // Find the BWSSB subdivision
    let subdivisionName = "Unknown";
    for (const feature of bwssbSubDivisions.features) {
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
              subdivisionName = feature.properties.Sub_DivisionName || "Unknown";
              console.log("Found BWSSB Subdivision:", subdivisionName, feature.properties);
              break;
            }
          }
        } catch (error) {
          console.error('Error checking BWSSB subdivision polygon:', error);
        }
      }
    }
    
    // Find the BWSSB service station
    let serviceStationName = "Unknown";
    for (const feature of bwssbServiceStations.features) {
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
              serviceStationName = feature.properties.Service_StationName || "Unknown";
              console.log("Found BWSSB Service Station:", serviceStationName, feature.properties);
              break;
            }
          }
        } catch (error) {
          console.error('Error checking BWSSB service station polygon:', error);
        }
      }
    }
    
    return {
      'Division': divisionName,
      'Sub Division': subdivisionName,
      'Service Station': serviceStationName,
      'Office Address': "Address not available", // Placeholder
      'Office Maps Link': null // Placeholder
    };
  };

  // Function to find BDA (Bangalore Development Authority) information for a location
  const findBdaInfo = (lat, lng) => {
    // Default return object with missing data
    const defaultInfo = {
      'BDA Layout Name': "Unknown",
      'BDA Layout Number': "Unknown"
    };
    
    if (!bdaLayoutBoundaries || !bdaLayoutBoundaries.features) {
      return defaultInfo;
    }

    const L = window.L;
    if (!L) return defaultInfo;

    // Create a point for the clicked location
    const point = L.latLng(lat, lng);
    
    // Log the first feature to see its properties structure (only once)
    if (bdaLayoutBoundaries.features.length > 0 && lng === 77.5946 && lat === 12.9716) {
      // Only log for the initial Bangalore coordinates to avoid excessive logging
      console.log("BDA Layout feature example:", bdaLayoutBoundaries.features[0]);
    }
    
    // Check each BDA layout polygon
    for (const feature of bdaLayoutBoundaries.features) {
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
              // Extract BDA layout information from properties
              // Only use LAYOUT_NAME and LAYOUT_NO properties
              return {
                'BDA Layout Name': feature.properties.LAYOUT_NAME || "Unknown",
                'BDA Layout Number': feature.properties.LAYOUT_NO || "Unknown"
              };
            }
          }
        } catch (error) {
          console.error('Error checking BDA layout polygon:', error);
        }
      }
    }
    
    // If no layout is found, return default info
    return defaultInfo;
  };

  // Function to handle "Go back" action
  const handleGoBack = () => {
    setSelectedLocation(null);
    // setSearchQuery('');
    setShowInfoPanel(false); // Hide info panel
    setShowIntroPanel(true); // Show intro panel
    resetAccordions(); // Reset accordions

    // Clear map elements
    if (mapInstanceRef.current) {
      if (markerRef.current) {
        mapInstanceRef.current.removeLayer(markerRef.current);
        markerRef.current = null;
      }
      if (polygonRef.current) {
        mapInstanceRef.current.removeLayer(polygonRef.current);
        polygonRef.current = null;
      }
      // Optionally reset map view
      // const bangaloreCoordinates = [12.9716, 77.5946];
      // mapInstanceRef.current.setView(bangaloreCoordinates, 12);
    }
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
      setSearchQuery(data.display_name); // Keep full display name for consistency? Maybe just first part is better UX. Let's keep full for now.
      
      // Always show info panel
      setShowInfoPanel(true);
      setShowIntroPanel(false); // Hide intro panel
      
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
        },
        bescomInfo: findBescomInfo(lat, lng),
        bwssbInfo: findBwssbInfo(lat, lng),
        bdaInfo: findBdaInfo(lat, lng)
      });
      
      // Add marker to map without changing zoom or center
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
      setShowIntroPanel(false); // Hide intro panel
      
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
        },
        bescomInfo: findBescomInfo(lat, lng),
        bwssbInfo: findBwssbInfo(lat, lng),
        bdaInfo: findBdaInfo(lat, lng)
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
          
          // DO zoom to the location when using geolocate - this is like a search
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
            },
            bescomInfo: findBescomInfo(latitude, longitude),
            bwssbInfo: findBwssbInfo(latitude, longitude),
            bdaInfo: findBdaInfo(latitude, longitude)
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
              },
              bescomInfo: findBescomInfo(latitude, longitude),
              bwssbInfo: findBwssbInfo(latitude, longitude),
              bdaInfo: findBdaInfo(latitude, longitude)
            });
            setShowInfoPanel(true); // Always show info panel
            setShowIntroPanel(false); // Hide intro panel
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

  // Search for locations using photon
  const searchLocations = async (query) => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      setShowSuggestions(false);
      return;
    }
    
    try {
      setIsSearching(true);
      // Photon API with Bangalore as a bias point
      // The lon,lat coordinates are for Bangalore center
      const searchUrl = `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=5&lang=en&lon=77.5946&lat=12.9716`;
      
      const response = await fetch(searchUrl);
      
      if (!response.ok) {
        throw new Error('Search failed');
      }
      
      const data = await response.json();
      
      const transformedResults = data.features.map(feature => {
        const { properties, geometry } = feature;
        
        const parts = [];
        if (properties.name) parts.push(properties.name);
        if (properties.street) parts.push(properties.street);
        if (properties.city) parts.push(properties.city);
        if (properties.state) parts.push(properties.state);
        if (properties.country) parts.push(properties.country);
        
        const display_name = parts.join(', ');
        
        return {
          display_name,
          lat: geometry.coordinates[1].toString(), // Photon uses [lon, lat] format
          lon: geometry.coordinates[0].toString(),
          address: properties,
          // Add any additional properties needed for compatibility
          osm_type: properties.osm_type || '',
          osm_id: properties.osm_id || '',
          type: properties.type || ''
        };
      });
      
      setSearchResults(transformedResults);
      setShowSuggestions(transformedResults.length > 0);
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
    setSearchQuery(location.display_name); // Set the input to first part of location name
    setShowSuggestions(false);
    setShowInfoPanel(true);
    setShowIntroPanel(false); // Hide intro panel
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
        },
        bescomInfo: findBescomInfo(latitude, longitude),
        bwssbInfo: findBwssbInfo(latitude, longitude),
        bdaInfo: findBdaInfo(latitude, longitude)
      });
      
      // When selecting from search results, DO center the map on the location
      zoomToLocationFromSearch(latitude, longitude, location.display_name);
    }
  };

  // New function specifically for search results that centers the map
  const zoomToLocationFromSearch = (lat, lng, address = null) => {
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
        labelRef.current = null;
      }
      
      // Create a marker at the location
      const L = window.L;
      if (!L) return;
      
      const location = L.latLng(lat, lng);
      markerRef.current = L.marker(location).addTo(mapInstanceRef.current);
      
      // DO center the map and zoom when coming from search
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
                  
                  // For search results, we DO want to fit the bounds to show the whole polygon
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
        constituency: constituencyInfo,
        bescomInfo: findBescomInfo(lat, lng),
        bwssbInfo: findBwssbInfo(lat, lng),
        bdaInfo: findBdaInfo(lat, lng)
      });
      
      // Show the info panel
      setShowInfoPanel(true);
    } catch (error) {
      console.error('Error zooming to location:', error);
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
      
      // Remove the label reference removal - we don't want to show labels anymore
      if (labelRef.current) {
        mapInstanceRef.current.removeLayer(labelRef.current);
        labelRef.current = null;
      }
      
      // Create a marker at the location
      const L = window.L;
      if (!L) return;
      
      const location = L.latLng(lat, lng);
      markerRef.current = L.marker(location).addTo(mapInstanceRef.current);
      
      // REMOVE: Don't zoom to the location or change map center
      // mapInstanceRef.current.setView(location, 15);
      
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
                  
                  // REMOVE: Don't create ward label anymore
                  // Extract ward name and zone for the label
                  // const wardName = feature.properties["Ward Name"] || feature.properties.Name || "Unknown Ward";
                  // const zone = feature.properties.Zone || "";
                  
                  // REMOVE: Don't create a label at the center of the polygon
                  // const bounds = polygon.getBounds();
                  // const center = bounds.getCenter();
                  
                  // REMOVE: Don't create a label with the ward name and zone
                  // const labelContent = `<div style="background-color: rgba(255, 255, 255, 0.8); padding: 5px; border-radius: 3px; font-weight: bold;">
                  //   ${wardName}${zone ? ` (${zone} Zone)` : ''}
                  // </div>`;
                  
                  // REMOVE: Don't add label to map
                  // labelRef.current = L.marker(center, {
                  //   icon: L.divIcon({
                  //     className: 'ward-label',
                  //     html: labelContent,
                  //     iconSize: [100, 40],
                  //     iconAnchor: [50, 20]
                  //   })
                  // }).addTo(mapInstanceRef.current);
                  
                  // REMOVE: Don't fit the map bounds to polygon
                  // const allPoints = [location, ...polygonCoordinates];
                  // const allBounds = L.latLngBounds(allPoints);
                  // mapInstanceRef.current.fitBounds(allBounds, { padding: [50, 50] });
                  
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
        constituency: constituencyInfo,
        bescomInfo: findBescomInfo(lat, lng),
        bwssbInfo: findBwssbInfo(lat, lng),
        bdaInfo: findBdaInfo(lat, lng)
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
    }, 350);
  };

  // Handle form submission
  const handleSearch = (e) => {
    e.preventDefault();
    
    // If there's an active suggestion, use that one
    if (activeSuggestionIndex >= 0 && activeSuggestionIndex < searchResults.length) {
      const location = searchResults[activeSuggestionIndex];
      handleLocationSelect(location);
    } else if (selectedLocation) {
      // We already have a selected location, zoom to it again with the search method that centers the map
      const { lat, lon } = selectedLocation;
      zoomToLocationFromSearch(parseFloat(lat), parseFloat(lon), selectedLocation.display_name);
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
    setIsPanelExpanded(!isPanelExpanded);
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

  // When selected location changes, hide intro panel
  useEffect(() => {
    if (selectedLocation) {
      setShowIntroPanel(false);
    } else {
      setShowIntroPanel(true);
      resetAccordions(); // Reset accordions when going back to intro
    }
  }, [selectedLocation]);

  // Load dark mode preference from localStorage
  // useEffect(() => {
  //   const savedMode = localStorage.getItem('darkMode');
  //   if (savedMode) {
  //     const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  //     setIsDarkMode(JSON.parse(savedMode) ?? prefersDark); // Default to system preference if no saved value
  //   } else {
  //      // Set initial state based on system preference if no localStorage value
  //      setIsDarkMode(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
  //   }
  // }, []);

  // Save dark mode preference to localStorage and update root class
  // useEffect(() => {
  //   console.log('Dark mode effect running. isDarkMode:', isDarkMode);
  //   localStorage.setItem('darkMode', JSON.stringify(isDarkMode));
  //   if (isDarkMode) {
  //     console.log('Adding dark class');
  //     document.documentElement.classList.add('dark');
  //   } else {
  //     console.log('Removing dark class');
  //     document.documentElement.classList.remove('dark');
  //   }
  // }, [isDarkMode]);

  // Toggle dark mode
  const toggleDarkMode = () => {
    console.log('Toggling dark mode');
    setIsDarkMode(prevMode => !prevMode);
  };

  // Update initial panel expansion state when mobile status changes or intro panel is shown/hidden
  useEffect(() => {
    // Expand if mobile and showing intro OR if mobile and a location is selected (always start expanded if content exists)
    // Collapse if desktop OR if mobile and panel was manually collapsed
    if (isMobile && (showIntroPanel && selectedLocation)) {
        // If it wasn't already expanded, expand it. Avoid forcing expansion if user manually collapsed.
        // Let's simplify: always expand if mobile and content is visible. User can collapse if they want.
        setIsPanelExpanded(true);
    } else if (!isMobile) {
        setIsPanelExpanded(false); // Collapse on desktop
    }
    // If switching to mobile view with intro panel, ensure BBMP accordion is open
    if (isMobile && showIntroPanel) {
        setOpenAccordions(prev => ({...prev, bbmpInfo: true}));
    }
  }, [isMobile, showIntroPanel, selectedLocation]);

  return (
    <div className="relative h-screen overflow-hidden flex"> {/* Root container */}
      {/* Map Area and Overlays - Always visible */}
      <div className="relative w-full h-screen"> {/* Map container wrapper */}
        {/* Search Bar Overlay */}
        <div className="absolute top-4 z-20 w-full px-5 md:pl-10 md:pr-24">
           <div className="flex items-center gap-3">
             <form onSubmit={handleSearch} className="relative flex-grow">
               <input
                 type="search"
                 value={searchQuery}
                 onChange={handleSearchInputChange}
                 onKeyDown={handleKeyDown}
                 onFocus={() => searchQuery.length >= 2 && setShowSuggestions(true)}
                 placeholder="Enter the exact address"
                 className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg pl-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
               />
               <button
                 type="submit"
                 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-600 hover:text-blue-800"
                 aria-label="Search"
               >
                 {isSearching ? <Loader size={20} className="animate-spin" /> : <Search size={20} />}
               </button>

               {/* Search suggestions */}
               {showSuggestions && (
                 <div className="absolute text-left mt-1 w-full bg-white border border-gray-200 rounded-lg max-h-60 overflow-y-auto">
                   {searchResults.map((result, index) => (
                     <div
                       key={index}
                       className={`p-2 cursor-pointer border-b border-gray-100 last:border-0 ${
                         index === activeSuggestionIndex ? 'bg-blue-100' : 'hover:bg-gray-100'
                       }`}
                       onClick={() => handleLocationSelect(result)}
                     >
                       <div className="text-sm font-medium text-gray-800 truncate">{result.display_name}</div>
                     </div>
                   ))}
                   {searchResults.length === 0 && !isSearching && (
                     <div className="p-2 text-gray-500 text-sm">No results found</div>
                   )}
                   {isSearching && (
                     <div className="p-2 text-gray-500 flex items-center text-sm">
                       <Loader size={16} className="animate-spin mr-2" /> Searching...
                     </div>
                   )}
                 </div>
               )}
             </form>

             {/* Current Location Button */}
             <button
               type="button"
               onClick={setCurrentLocation}
               className="bg-white  p-2 rounded-lg border-2 border-gray-300 text-blue-600 dark:text-blue-400 hover:bg-gray-100 transition-colors flex-shrink-0 shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500" // Add dark mode styles
               title="Use your current location"
               aria-label="Use your current location"
             >
               <LocateFixed size={22} />
             </button>

             {/* Dark Mode Toggle Button */}
             {/* <button
               type="button"
               onClick={toggleDarkMode}
               className="bg-white dark:bg-gray-800 p-2 rounded-lg border border-gray-300 dark:border-gray-600 text-yellow-500 dark:text-yellow-400 hover:text-yellow-600 dark:hover:text-yellow-300 hover:border-yellow-300 dark:hover:border-yellow-500 transition-colors flex-shrink-0 shadow-md" // Add dark mode styles
               title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
               aria-label={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
             >
               {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
             </button> */}
           </div>
        </div>

        {/* Map container */}
        <div
          ref={mapContainerRef}
          className="w-full h-full"
        ></div>

        {/* Map controls */}
        <div className="leaflet-map-controls absolute top-20 right-5 md:top-20 md:right-4 flex flex-col gap-2" style={{ zIndex: 5}}> {/* Adjusted top/right for mobile */}
          <button
            className="bg-white p-2 rounded-md border-2 border-gray-300 dark:text-blue-400 hover:bg-gray-100 transition-colors flex-shrink-0 shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            onClick={zoomIn}
            aria-label="Zoom in"
          ><Plus size={20} strokeWidth={2.5} /></button>
          <button
            className="bg-white p-2 rounded-md border-2 border-gray-300 dark:text-blue-400 hover:bg-gray-100 transition-colors flex-shrink-0 shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            onClick={zoomOut}
            aria-label="Zoom out"
          ><Minus size={20} strokeWidth={2.5} /></button>
        </div>

        {/* Loading indicator */}
        {isReverseGeocoding && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 bg-white bg-opacity-75 p-3 rounded-lg shadow-lg">
            <div className="flex items-center">
              <Loader size={24} className="animate-spin mr-2 text-blue-500" />
              <span>Getting location info...</span>
            </div>
          </div>
        )}
      </div>

      {/* Conditional Layout: Desktop Sidebar or Mobile Bottom Sheet */}
      {isMobile ? (
        // Mobile: Bottom Sheet Panel
        <div
          id="mobile-info-panel"
          ref={infoPanelRef}
          className="fixed bottom-0 left-0 right-0 bg-white rounded-t-lg transition-all duration-300 ease-in-out flex flex-col z-10"
        >
          {/* Panel Header (Clickable Toggle) */}
          <div
            className="flex-shrink-0 p-3 border-b border-gray-200 dark:border-gray-700 cursor-pointer flex flex-col items-center sticky top-0 bg-white dark:bg-gray-900 z-10" // Add dark mode styles
            onClick={toggleMobileInfoPanel}
          >
            {isPanelExpanded ? <ChevronDown size={24} className="text-gray-500 mb-1"/> : <ChevronUp size={24} className="text-gray-500 mb-1"/>}
            <div className="flex flex-col items-center">
              <h1 className="text-xl font-bold text-blue-600 dark:text-blue-400 flex-shrink-0"> {/* Dark mode */}
                Civic Compass – Bengaluru
              </h1>
              <a
                href="https://zencitizen.in"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-300 font-medium text-lg" // Dark mode
              >
                Zen Citizen
              </a>                
            </div>
          </div>
        

          {/* Panel Content (Scrollable) */}
          <div ref={scrollableContentRef} className={`flex-grow overflow-y-auto p-4 dark:text-gray-300 ${isPanelExpanded ? 'h-96' : 'h-56'}`}> {/* Hide content when collapsed, ADDED REF */}
            {showIntroPanel && !selectedLocation ? (
              // Intro Content for Mobile
              <div className="flex-grow overflow-y-auto pr-1 text-md mt-4"> {/* Scrollable content area */}
                <p className="text-gray-600"> {/* Dark mode */}
                If you're a Bengaluru resident, you can use Civic compass to identify the BBMP, Revenue, BESCOM, BWSSB, and BDA offices for your area.
                </p>
                <h2 className="text-lg font-semibold text-gray-800 mt-7 mb-1">Note</h2>
                <p className="text-gray-600"> {/* Dark mode */}
                Enter the exact address you need information for. Note that a single pincode can cover multiple wards, and that some roads may fall under two different wards.
                </p>
                <p className="text-gray-600 mt-2"><em>This tool is only for Bengaluru at this time.</em></p>

                <h2 className="text-lg font-semibold text-gray-800 mt-7 mb-1">Data Sources</h2>
                <p className="text-gray-600"> {/* Dark mode */}
                We pull information from government records. While we strive for accuracy, these sources can be incomplete or outdated.
                </p>
                {/* Linkified Data Sources */}
                <div className="flex flex-col space-y-2 text-sm mt-2"> {/* Dark mode */}
                  <a href="https://opencity.in/data" target="_blank" rel="noopener noreferrer" className="underline text-gray-500 transtition-opacity hover:opacity-80">OpenCity Data</a>
                  <a href="https://kgis.ksrsac.in/kgis/" target="_blank" rel="noopener noreferrer" className="underline text-gray-500 transtition-opacity hover:opacity-80">Karnataka-GIS Portal</a>
                  <a href="https://www.openstreetmap.org/about" target="_blank" rel="noopener noreferrer" className="underline text-gray-500 transtition-opacity hover:opacity-80">OpenStreetMap</a>
                </div>
              </div>
            ) : selectedLocation ? (
              // Location Details Accordions for Mobile
              <div className="flex flex-col overflow-y-auto flex-grow h-full"> {/* Dark mode */}
                {/* Back Button */}
                <button
                  onClick={handleGoBack}
                  className="flex items-center text-md text-gray-500 transition-opacity hover:opacity-80 mb-4 focus:outline-none flex-shrink-0" // Dark mode
                >
                  <ArrowLeft size={22} className="mr-1" /> Go Back
                </button>

                {/* Location Details Header */}
                <div className="flex-shrink-0 mb-4">
                  <h2 className="text-lg font-semibold text-gray-800 mb-1">Address</h2>
                  <p className="text-md text-gray-600 break-words">
                    {selectedLocation.display_name}
                  </p>
                </div>

                {/* Accordions Container */}
                <div className="flex-grow pr-1"> {/* Scrollable accordion area */}
                  {/* BBMP Information */}
                  <div className="border-b border-gray-200">
                    <button
                        onClick={() => toggleAccordion('bbmpInfo')}
                        className="w-full flex justify-between items-center py-3 text-left focus:outline-none"
                    >
                      <h2 className="font-semibold text-gray-800 text-base">BBMP Information</h2>
                        {openAccordions.bbmpInfo ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </button>

                    {openAccordions.bbmpInfo && (
                      <div className="pb-4">
                        <div className="space-y-1 text-md">
                          {Object.entries(locationInfo.bbmpInfo).map(([fieldName, value]) => (
                            <div key={fieldName} className="grid grid-cols-2 gap-2 py-1">
                              <span className="text-gray-600">{fieldName}</span>
                              <span className="font-medium text-gray-700 text-left break-words">{value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                    {/* Revenue Classification - Accordion */}
                    <div className="border-b border-gray-200">
                      <button
                          onClick={() => toggleAccordion('revenueClassification')}
                          className="w-full flex justify-between items-center py-3 text-left focus:outline-none"
                      >
                        <h2 className="font-semibold text-gray-800 text-base">Revenue Classification</h2>
                        {openAccordions.revenueClassification ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                      </button>

                      {openAccordions.revenueClassification && (
                        <div className="pb-4">
                          <div className="space-y-1 text-md">
                            {Object.entries(locationInfo.revenueClassification)
                              .filter(([key]) => key !== 'htmlDescription')
                              .map(([fieldName, value]) => (
                                <div key={fieldName} className="grid grid-cols-2 gap-2 py-1">
                                  <span className="text-gray-600">{fieldName}</span>
                                  <span className="font-medium text-gray-700 text-left break-words">{value}</span>
                                </div>
                              ))
                            }
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Revenue Offices - Accordion */}
                    <div className="border-b border-gray-200">
                      <button
                        onClick={() => toggleAccordion('revenueOffices')}
                        className="w-full flex justify-between items-center py-3 text-left focus:outline-none"
                      >
                        <h2 className="font-semibold text-gray-800 text-base">Revenue Offices</h2>
                        {openAccordions.revenueOffices ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                      </button>

                      {openAccordions.revenueOffices && (
                        <div className="pb-4">
                          <div className="space-y-4 text-md">
                            {/* SRO Information */}
                            <div className="space-y-2">
                              <div className="grid grid-cols-2 gap-2 py-1">
                                <span className="text-gray-600">SRO</span>
                                <span className="font-medium text-gray-700 text-left break-words">{locationInfo.revenueOffices.SRO}</span>
                              </div>
                              <div className="grid grid-cols-2 gap-2 py-1 items-start">
                                <span className="text-gray-600">Address</span>
                                <div className="flex flex-col text-left">
                                  <span className="text-gray-700 break-words">{locationInfo.revenueOffices['SRO Address']}</span>
                                  {locationInfo.revenueOffices['SRO Maps Link'] && (
                                    <a
                                      href={locationInfo.revenueOffices['SRO Maps Link']}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-blue-600 hover:text-blue-800 flex items-center mt-1"
                                    >
                                      <ExternalLink size={14} className="mr-1 flex-shrink-0" /> Google Maps
                                    </a>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* DRO Information */}
                            <div className="space-y-2 mt-4">
                              <div className="grid grid-cols-2 gap-2 py-1">
                                <span className="text-gray-600">DRO</span>
                                <span className="font-medium text-gray-700 text-left break-words">{locationInfo.revenueOffices.DRO}</span>
                              </div>
                              <div className="grid grid-cols-2 gap-2 py-1 items-start">
                                <span className="text-gray-600">Address</span>
                                <div className="flex flex-col text-left">
                                  <span className="text-gray-700 break-words">{locationInfo.revenueOffices['DRO Address']}</span>
                                  {locationInfo.revenueOffices['DRO Maps Link'] && (
                                    <a
                                      href={locationInfo.revenueOffices['DRO Maps Link']}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-blue-600 hover:text-blue-800 flex items-center mt-1"
                                    >
                                      <ExternalLink size={14} className="mr-1 flex-shrink-0" /> Google Maps
                                    </a>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Police Jurisdiction - Accordion */}
                    <div className="border-b border-gray-200">
                    <button
                        onClick={() => toggleAccordion('policeJurisdiction')}
                        className="w-full flex justify-between items-center py-3 text-left focus:outline-none"
                      >
                        <h2 className="font-semibold text-gray-800 text-base">Police Jurisdiction</h2>
                        {openAccordions.policeJurisdiction ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                      </button>

                      {openAccordions.policeJurisdiction && (
                        <div className="pb-4">
                          <div className="space-y-4 text-md">
                            {/* Police Station Information */}
                            <div className="space-y-2">
                              <div className="grid grid-cols-2 gap-2 py-1">
                                <span className="text-gray-600">Police station</span>
                                <span className="font-medium text-gray-700 text-left break-words">{locationInfo.policeJurisdiction['Police station']}</span>
                              </div>
                              <div className="grid grid-cols-2 gap-2 py-1 items-start">
                                <span className="text-gray-600">Address</span>
                                <div className="flex flex-col text-left">
                                  <span className="text-gray-700 break-words">{locationInfo.policeJurisdiction['Police station Address']}</span>
                                  {locationInfo.policeJurisdiction['Police station Maps Link'] && (
                                    <a
                                      href={locationInfo.policeJurisdiction['Police station Maps Link']}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-blue-600 hover:text-blue-800 flex items-center mt-1"
                                    >
                                      <ExternalLink size={14} className="mr-1 flex-shrink-0" /> Google Maps
                                    </a>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Traffic Police Station Information */}
                            <div className="space-y-2 mt-4">
                              <div className="grid grid-cols-2 gap-2 py-1">
                                <span className="text-gray-600">Traffic station</span>
                                <span className="font-medium text-gray-700 text-left break-words">{locationInfo.policeJurisdiction['Traffic station']}</span>
                              </div>
                              <div className="grid grid-cols-2 gap-2 py-1 items-start">
                                <span className="text-gray-600">Address</span>
                                <div className="flex flex-col text-left">
                                  <span className="text-gray-700 break-words">{locationInfo.policeJurisdiction['Traffic station Address']}</span>
                                  {locationInfo.policeJurisdiction['Traffic station Maps Link'] && (
                                    <a
                                      href={locationInfo.policeJurisdiction['Traffic station Maps Link']}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-blue-600 hover:text-blue-800 flex items-center mt-1"
                                    >
                                      <ExternalLink size={14} className="mr-1 flex-shrink-0" /> Google Maps
                                    </a>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* BESCOM Information - Accordion */}
                    <div className="border-b border-gray-200">
                      <button
                        onClick={() => toggleAccordion('bescomInfo')}
                        className="w-full flex justify-between items-center py-3 text-left focus:outline-none"
                      >
                        <h2 className="font-semibold text-gray-800 text-base">Electricity (BESCOM)</h2>
                        {openAccordions.bescomInfo ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                      </button>

                      {openAccordions.bescomInfo && (
                        <div className="pb-4">
                          <div className="space-y-1 text-md">
                            {Object.entries(locationInfo.bescomInfo).map(([fieldName, value]) => (
                              <div key={fieldName} className="grid grid-cols-2 gap-2 py-1">
                                <span className="text-gray-600">{fieldName}</span>
                                <span className="font-medium text-gray-700 text-left break-words">{value}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* BWSSB Information - Accordion */}
                    <div className="border-b border-gray-200">
                      <button
                        onClick={() => toggleAccordion('bwssbInfo')}
                        className="w-full flex justify-between items-center py-3 text-left focus:outline-none"
                      >
                        <h2 className="font-semibold text-gray-800 text-base">Water Supply (BWSSB)</h2>
                        {openAccordions.bwssbInfo ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                      </button>

                      {openAccordions.bwssbInfo && (
                        <div className="pb-4">
                          <div className="space-y-1 text-md">
                            {Object.entries(locationInfo.bwssbInfo).map(([fieldName, value]) => (
                              <div key={fieldName} className="grid grid-cols-2 gap-2 py-1">
                                <span className="text-gray-600">{fieldName}</span>
                                <span className="font-medium text-gray-700 text-left break-words">{value}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* BDA Information - Accordion */}
                    <div> {/* Removed border-b */}
                      <button
                        onClick={() => toggleAccordion('bdaInfo')}
                        className="w-full flex justify-between items-center py-3 text-left focus:outline-none"
                      >
                        <h2 className="font-semibold text-gray-800 text-base">BDA Information</h2>
                        {openAccordions.bdaInfo ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                      </button>
                      {openAccordions.bdaInfo && (
                        <div className="pb-4">
                          <div className="space-y-1 text-md">
                            {Object.entries(locationInfo.bdaInfo).map(([fieldName, value]) => (
                              <div key={fieldName} className="grid grid-cols-2 gap-2 py-1">
                                <span className="text-gray-600">{fieldName}</span>
                                <span className="font-medium text-gray-700 text-left break-words">{value}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                </div> {/* End Accordions Container */}
              </div>
            ) : null} {/* Render nothing if no selection and not intro */}

            {/* Footer moved outside this scrollable div */}
          </div>

          {/* Footer - Common for mobile (Now outside scrollable content) */}
          <div className="flex-shrink-0 p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 z-10"> {/* Dark mode, Removed sticky/mt-auto */}          
            <div className="flex justify-between items-center text-sm">
              <a href="https://zencitizen.in/contact-us/" target="_blank" className="underline text-gray-500 transition-opacity hover:opacity-80">Report an Error</a>
              <a href="https://docs.google.com/forms/d/e/1FAIpQLScQS_-VgUFQZJedyu6iIlpoYymsKSyGUhrvPoJX1WkZGQqfLQ/viewform" target="_blank" className="underline text-gray-500 transition-opacity hover:opacity-80">Volunteer with Us</a>
              <a href="https://github.com/zen-citizen/civic-compass" target="_blank" className="underline text-gray-500 transition-opacity hover:opacity-80">Open Source</a>                  
            </div>
          </div>
        </div>
      ) : (
        // Desktop: Sidebar
        <div className="order-first h-screen bg-white shadow-lg flex flex-col border-r border-gray-200 flex-shrink-0" style={{ width: '480px' }}> {/* Sidebar is absolute for desktop too */}
          <div className="p-4 flex flex-col flex-grow h-full"> {/* Ensure full height */}
            <div className="flex justify-between mb-4 pb-3 border-b border-gray-200">
              <h1 className="text-xl font-bold text-blue-600 dark:text-blue-400 flex-shrink-0"> {/* Dark mode */}
                Civic Compass – Bengaluru
              </h1>
              <a
                href="https://zencitizen.in"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-300 font-medium text-lg" // Dark mode
              >
                Zen Citizen
              </a>                
            </div>

            {/* Conditional Rendering: Intro Panel or Location Details */}
            {showIntroPanel && !selectedLocation ? (
              <div className="flex-grow overflow-y-auto pr-1 text-md mt-4"> {/* Scrollable content area */}
                <p className="text-gray-600"> {/* Dark mode */}
                If you're a Bengaluru resident, you can use Civic compass to identify the BBMP, Revenue, BESCOM, BWSSB, and BDA offices for your area.
                </p>
                <h2 className="text-lg font-semibold text-gray-800 mt-7 mb-1">Note</h2>
                <p className="text-gray-600"> {/* Dark mode */}
                Enter the exact address you need information for. Note that a single pincode can cover multiple wards, and that some roads may fall under two different wards.
                </p>
                <p className="text-gray-600 mt-2"><em>This tool is only for Bengaluru at this time.</em></p>

                <h2 className="text-lg font-semibold text-gray-800 mt-7 mb-1">Data Sources</h2>
                <p className="text-gray-600"> {/* Dark mode */}
                We pull information from government records. While we strive for accuracy, these sources can be incomplete or outdated.
                </p>
                {/* Linkified Data Sources */}
                <div className="flex flex-col space-y-2 text-sm mt-2"> {/* Dark mode */}
                  <a href="https://opencity.in/data" target="_blank" rel="noopener noreferrer" className="underline text-gray-500 transtition-opacity hover:opacity-80">OpenCity Data</a>
                  <a href="https://kgis.ksrsac.in/kgis/" target="_blank" rel="noopener noreferrer" className="underline text-gray-500 transtition-opacity hover:opacity-80">Karnataka-GIS Portal</a>
                  <a href="https://www.openstreetmap.org/about" target="_blank" rel="noopener noreferrer" className="underline text-gray-500 transtition-opacity hover:opacity-80">OpenStreetMap</a>
                </div>
              </div>
            ) : selectedLocation ? (
              <div className="flex flex-col overflow-y-auto flex-grow h-full"> {/* Dark mode */}
                {/* Back Button */}
                <button
                  onClick={handleGoBack}
                  className="flex items-center text-md text-gray-500 transition-opacity hover:opacity-80 mb-4 focus:outline-none flex-shrink-0" // Dark mode
                >
                  <ArrowLeft size={22} className="mr-1" /> Go Back
                </button>

                {/* Location Details Header */}
                <div className="flex-shrink-0 mb-4">
                  <h2 className="text-lg font-semibold text-gray-800 mb-1">Address</h2>
                  <p className="text-md text-gray-600 break-words">
                    {selectedLocation.display_name}
                  </p>
                </div>

                {/* Accordions Container */}
                <div className="flex-grow overflow-y-auto pr-1"> {/* Scrollable accordion area */}
                  {/* BBMP Information */}
                  <div className="border-b border-gray-200">
                    <button
                        onClick={() => toggleAccordion('bbmpInfo')}
                        className="w-full flex justify-between items-center py-3 text-left focus:outline-none"
                    >
                      <h2 className="font-semibold text-gray-800 text-base">BBMP Information</h2>
                        {openAccordions.bbmpInfo ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </button>

                    {openAccordions.bbmpInfo && (
                      <div className="pb-4">
                        <div className="space-y-1 text-md">
                          {Object.entries(locationInfo.bbmpInfo).map(([fieldName, value]) => (
                            <div key={fieldName} className="grid grid-cols-2 gap-2 py-1">
                              <span className="text-gray-600">{fieldName}</span>
                              <span className="font-medium text-gray-700 text-left break-words">{value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                    {/* Revenue Classification - Accordion */}
                    <div className="border-b border-gray-200">
                      <button
                          onClick={() => toggleAccordion('revenueClassification')}
                          className="w-full flex justify-between items-center py-3 text-left focus:outline-none"
                      >
                        <h2 className="font-semibold text-gray-800 text-base">Revenue Classification</h2>
                        {openAccordions.revenueClassification ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                      </button>

                      {openAccordions.revenueClassification && (
                        <div className="pb-4">
                          <div className="space-y-1 text-md">
                            {Object.entries(locationInfo.revenueClassification)
                              .filter(([key]) => key !== 'htmlDescription')
                              .map(([fieldName, value]) => (
                                <div key={fieldName} className="grid grid-cols-2 gap-2 py-1">
                                  <span className="text-gray-600">{fieldName}</span>
                                  <span className="font-medium text-gray-700 text-left break-words">{value}</span>
                                </div>
                              ))
                            }
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Revenue Offices - Accordion */}
                    <div className="border-b border-gray-200">
                      <button
                        onClick={() => toggleAccordion('revenueOffices')}
                        className="w-full flex justify-between items-center py-3 text-left focus:outline-none"
                      >
                        <h2 className="font-semibold text-gray-800 text-base">Revenue Offices</h2>
                        {openAccordions.revenueOffices ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                      </button>

                      {openAccordions.revenueOffices && (
                        <div className="pb-4">
                          <div className="space-y-4 text-md">
                            {/* SRO Information */}
                            <div className="space-y-2">
                              <div className="grid grid-cols-2 gap-2 py-1">
                                <span className="text-gray-600">SRO</span>
                                <span className="font-medium text-gray-700 text-left break-words">{locationInfo.revenueOffices.SRO}</span>
                              </div>
                              <div className="grid grid-cols-2 gap-2 py-1 items-start">
                                <span className="text-gray-600">Address</span>
                                <div className="flex flex-col text-left">
                                  <span className="text-gray-700 break-words">{locationInfo.revenueOffices['SRO Address']}</span>
                                  {locationInfo.revenueOffices['SRO Maps Link'] && (
                                    <a
                                      href={locationInfo.revenueOffices['SRO Maps Link']}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-blue-600 hover:text-blue-800 flex items-center mt-1"
                                    >
                                      <ExternalLink size={14} className="mr-1 flex-shrink-0" /> Google Maps
                                    </a>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* DRO Information */}
                            <div className="space-y-2 mt-4">
                              <div className="grid grid-cols-2 gap-2 py-1">
                                <span className="text-gray-600">DRO</span>
                                <span className="font-medium text-gray-700 text-left break-words">{locationInfo.revenueOffices.DRO}</span>
                              </div>
                              <div className="grid grid-cols-2 gap-2 py-1 items-start">
                                <span className="text-gray-600">Address</span>
                                <div className="flex flex-col text-left">
                                  <span className="text-gray-700 break-words">{locationInfo.revenueOffices['DRO Address']}</span>
                                  {locationInfo.revenueOffices['DRO Maps Link'] && (
                                    <a
                                      href={locationInfo.revenueOffices['DRO Maps Link']}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-blue-600 hover:text-blue-800 flex items-center mt-1"
                                    >
                                      <ExternalLink size={14} className="mr-1 flex-shrink-0" /> Google Maps
                                    </a>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Police Jurisdiction - Accordion */}
                    <div className="border-b border-gray-200">
                    <button
                        onClick={() => toggleAccordion('policeJurisdiction')}
                        className="w-full flex justify-between items-center py-3 text-left focus:outline-none"
                      >
                        <h2 className="font-semibold text-gray-800 text-base">Police Jurisdiction</h2>
                        {openAccordions.policeJurisdiction ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                      </button>

                      {openAccordions.policeJurisdiction && (
                        <div className="pb-4">
                          <div className="space-y-4 text-md">
                            {/* Police Station Information */}
                            <div className="space-y-2">
                              <div className="grid grid-cols-2 gap-2 py-1">
                                <span className="text-gray-600">Police station</span>
                                <span className="font-medium text-gray-700 text-left break-words">{locationInfo.policeJurisdiction['Police station']}</span>
                              </div>
                              <div className="grid grid-cols-2 gap-2 py-1 items-start">
                                <span className="text-gray-600">Address</span>
                                <div className="flex flex-col text-left">
                                  <span className="text-gray-700 break-words">{locationInfo.policeJurisdiction['Police station Address']}</span>
                                  {locationInfo.policeJurisdiction['Police station Maps Link'] && (
                                    <a
                                      href={locationInfo.policeJurisdiction['Police station Maps Link']}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-blue-600 hover:text-blue-800 flex items-center mt-1"
                                    >
                                      <ExternalLink size={14} className="mr-1 flex-shrink-0" /> Google Maps
                                    </a>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Traffic Police Station Information */}
                            <div className="space-y-2 mt-4">
                              <div className="grid grid-cols-2 gap-2 py-1">
                                <span className="text-gray-600">Traffic station</span>
                                <span className="font-medium text-gray-700 text-left break-words">{locationInfo.policeJurisdiction['Traffic station']}</span>
                              </div>
                              <div className="grid grid-cols-2 gap-2 py-1 items-start">
                                <span className="text-gray-600">Address</span>
                                <div className="flex flex-col text-left">
                                  <span className="text-gray-700 break-words">{locationInfo.policeJurisdiction['Traffic station Address']}</span>
                                  {locationInfo.policeJurisdiction['Traffic station Maps Link'] && (
                                    <a
                                      href={locationInfo.policeJurisdiction['Traffic station Maps Link']}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-blue-600 hover:text-blue-800 flex items-center mt-1"
                                    >
                                      <ExternalLink size={14} className="mr-1 flex-shrink-0" /> Google Maps
                                    </a>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* BESCOM Information - Accordion */}
                    <div className="border-b border-gray-200">
                      <button
                        onClick={() => toggleAccordion('bescomInfo')}
                        className="w-full flex justify-between items-center py-3 text-left focus:outline-none"
                      >
                        <h2 className="font-semibold text-gray-800 text-base">Electricity (BESCOM)</h2>
                        {openAccordions.bescomInfo ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                      </button>

                      {openAccordions.bescomInfo && (
                        <div className="pb-4">
                          <div className="space-y-1 text-md">
                            {Object.entries(locationInfo.bescomInfo).map(([fieldName, value]) => (
                              <div key={fieldName} className="grid grid-cols-2 gap-2 py-1">
                                <span className="text-gray-600">{fieldName}</span>
                                <span className="font-medium text-gray-700 text-left break-words">{value}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* BWSSB Information - Accordion */}
                    <div className="border-b border-gray-200">
                      <button
                        onClick={() => toggleAccordion('bwssbInfo')}
                        className="w-full flex justify-between items-center py-3 text-left focus:outline-none"
                      >
                        <h2 className="font-semibold text-gray-800 text-base">Water Supply (BWSSB)</h2>
                        {openAccordions.bwssbInfo ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                      </button>

                      {openAccordions.bwssbInfo && (
                        <div className="pb-4">
                          <div className="space-y-1 text-md">
                            {Object.entries(locationInfo.bwssbInfo).map(([fieldName, value]) => (
                              <div key={fieldName} className="grid grid-cols-2 gap-2 py-1">
                                <span className="text-gray-600">{fieldName}</span>
                                <span className="font-medium text-gray-700 text-left break-words">{value}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* BDA Information - Accordion */}
                    <div> {/* Removed border-b */}
                      <button
                        onClick={() => toggleAccordion('bdaInfo')}
                        className="w-full flex justify-between items-center py-3 text-left focus:outline-none"
                      >
                        <h2 className="font-semibold text-gray-800 text-base">BDA Information</h2>
                        {openAccordions.bdaInfo ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                      </button>
                      {openAccordions.bdaInfo && (
                        <div className="pb-4">
                          <div className="space-y-1 text-md">
                            {Object.entries(locationInfo.bdaInfo).map(([fieldName, value]) => (
                              <div key={fieldName} className="grid grid-cols-2 gap-2 py-1">
                                <span className="text-gray-600">{fieldName}</span>
                                <span className="font-medium text-gray-700 text-left break-words">{value}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                </div> {/* End Accordions Container */}
              </div>
            ) : null} {/* Render nothing if no selection and not intro */}

            <div className="mt-auto pt-4 border-t border-gray-200 flex-shrink-0"> {/* Footer stick to bottom */}
              <div className="flex justify-between items-center text-sm">
                <a href="https://zencitizen.in/contact-us/" target="_blank" className="underline text-gray-500 transition-opacity hover:opacity-80">Report an Error</a>
                <a href="https://docs.google.com/forms/d/e/1FAIpQLScQS_-VgUFQZJedyu6iIlpoYymsKSyGUhrvPoJX1WkZGQqfLQ/viewform" target="_blank" className="underline text-gray-500 transition-opacity hover:opacity-80">Volunteer with Us</a>
                <a href="https://github.com/zen-citizen/civic-compass" target="_blank" className="underline text-gray-500 transition-opacity hover:opacity-80">Open Source</a>                  
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tooltip Portal remains the same */}
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
              }}
              ref={(el) => {
                // Positioning logic remains the same
                if (el) {
                  const infoButton = document.querySelector('button[aria-label="More information"]');
                  if (infoButton) {
                    const rect = infoButton.getBoundingClientRect();
                    let top = rect.bottom + 8;
                    let left = rect.left;
                    if (tooltipPosition === 'top') {
                      const tooltipHeight = el.offsetHeight;
                      top = rect.top - tooltipHeight - 8;
                    }
                    const rightEdge = left + el.offsetWidth;
                    if (rightEdge > window.innerWidth) {
                      left = window.innerWidth - el.offsetWidth - 10;
                    }
                    if (left < 10) {
                      left = 10;
                    }
                    el.style.top = `${top}px`;
                    el.style.left = `${left}px`;
                  }
                }
              }}
            >
              This tool helps you discover information about your Bangalore address including BBMP Ward details, Revenue classifications, and Police jurisdictions.
            </div>,
            document.body // Ensure portal target exists
          )}
        </div>
      )}
    </div>
  );
};

export default BangaloreAddressMap;

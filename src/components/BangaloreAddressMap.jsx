import React, { useState, useEffect, useRef, useCallback } from 'react';
import { LocateFixed, Search, Loader, ExternalLink, ChevronDown, ChevronUp, ArrowLeft, Sun, Moon, Plus, Minus } from 'lucide-react';
import policeJurisdiction from '../layers/PoliceJurisdiction_5.json'
import BBMPInformation from '../layers/BBMPInformation_11.json'
import Constituencies from '../layers/Constituencies_3.json'
import RevenueOffices from '../layers/RevenueOffices_6.json'
import RevenueClassification from '../layers/RevenueClassification_10.json'
import bescomSectionBoundary from '../layers/bescom-section-boundary.json'
import bescomDivisionBoundary from '../layers/bescom-division-boundary.json'
import bescomSubdivisionBoundary from '../layers/bescom-subdivision-boundary.json'
import bwssbDivisions from '../layers/bwssb_divisions.json'
import bwssbSubDivisions from '../layers/bwssb_sub_divisions.json'
import bwssbServiceStations from '../layers/bwssb_service_station_divisions.json'
import bdaLayoutBoundaries from '../layers/bda_layout_boundaries.json'
import sroLocations from '../data/sro_locs.json'
import droLocations from '../data/dro_locs.json'
import psLocations from '../data/ps_locs.json'
import tpLocations from '../data/tp_locs.json'
import bescomLocations from '../data/bescom_locs_suffix.json'
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
      'Zone': 'Not Available',
      'Division': 'Not Available',
      'Subdivision': 'Not Available',
      'Ward name': 'Not Available',
      'Ward number': 'Not Available'
    },
    revenueClassification: {
      'Hobli': 'Not Available',
      'Taluk': 'Not Available',
      'District': 'Not Available',
      'Land zone': 'Not Available'
    },
    revenueOffices: {
      'Tahsildar Office': 'Not Available',
      'Tahsildar Office Address': 'Loading...',
      'Tahsildar Office Maps Link': null,
      'SRO': 'Not Available',
      'SRO Address': 'Loading...',
      'SRO Maps Link': null,
      'DRO': 'Not Available',
      'DRO Address': 'Loading...',
      'DRO Maps Link': null
    },
    policeJurisdiction: {
      'Police station': 'Not Available',
      'Traffic station': 'Not Available',
      'Police station Address': 'Not Available',
      'Traffic station Address': 'Not Available',
      'Police station Maps Link': null,
      'Traffic station Maps Link': null,
      'Electicity station': 'Not Available'
    },
    bescomInfo: {
      'Division': "Not Available",
      'Subdivision': "Not Available",
      'Section': "Not Available",
      'O&M Office': "Not available",
      'O&M Office Address': "Loading...",
      'O&M Office Maps Link': null
    },
    bwssbInfo: {
      'Division': 'Not Available',
      'Division Office': 'Not Available',
      'Division Address': 'Loading...',
      'Division Contact': 'Loading...',
      'Subdivision': 'Not Available',
      'Subdivision Office': 'Not Available',
      'Subdivision Address': 'Loading...',
      'Subdivision Contact': 'Loading...',
      'Service Station': 'Not Available',
      'Service Station Office': 'Not Available',
      'Service Station Address': 'Loading...',
      'Service Station Contact': 'Loading...'
    },
    bdaInfo: {
      'BDA Layout Name': "Not Available",
      'BDA Layout Number': "Not Available"
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
  const [useGoogleSearch, setUseGoogleSearch] = useState(process.env.REACT_APP_USE_GOOGLE_SEARCH === 'true');

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

  const loadGoogleMapsScript = () => {
    if (window.google) return Promise.resolve();

    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  };

  // Helper function for handling different geometry types
  const processGeometry = (geometry, point, L) => {
    try {
      if (!geometry) return false;

      if (geometry.type === "Polygon") {
        const polygonCoords = geometry.coordinates[0].map(coord => [coord[1], coord[0]]);
        const polygon = L.polygon(polygonCoords);
        const polygonLatLngs = polygon.getLatLngs()[0];

        if (polygon.getBounds().contains(point)) {
          return isMarkerInsidePolygon(point, polygonLatLngs);
        }
      }
      else if (geometry.type === "MultiPolygon") {
        for (const polyCoords of geometry.coordinates) {
          const polygonCoords = polyCoords[0].map(coord => [coord[1], coord[0]]);
          const polygon = L.polygon(polygonCoords);
          const polygonLatLngs = polygon.getLatLngs()[0];

          if (polygon.getBounds().contains(point)) {
            if (isMarkerInsidePolygon(point, polygonLatLngs)) {
              return true;
            }
          }
        }
      }
      else if (geometry.type === "GeometryCollection") {
        for (const geom of geometry.geometries) {
          if (processGeometry(geom, point, L)) {
            return true;
          }
        }
      }

      return false;
    } catch (error) {
      console.error('Error processing geometry:', error);
      return false;
    }
  };

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

    const point = L.latLng(lat, lng);

    if (BBMPInformation.features.length > 0 && lng === 77.5946 && lat === 12.9716) {
      console.log("BBMP feature example:", BBMPInformation.features[0]);
    }

    for (const feature of BBMPInformation.features) {
      if (feature.geometry) {
        const isInside = processGeometry(feature.geometry, point, L);

        if (isInside) {
          console.log("Matching BBMP feature:", feature);

          const wardName = feature.properties["Ward Name"] ||
              feature.properties.Name ||
              "Not Available";

          const wardNumber = feature.properties.Name ||
              "Not Available";

          const zone = feature.properties.Zone ||
              "Not Available";

          const division = feature.properties.Division ||
              "Not Available";

          const subdivision = feature.properties.Subdivision ||
              "Not Available";

          return {
            'Zone': zone,
            'Division': division,
            'Subdivision': subdivision,
            'Ward name': wardName,
            'Ward number': wardNumber
          };
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
        'Police station': "Not Available",
        'Traffic station': "Not Available",
        'Police station Address': "Not Available",
        'Traffic station Address': "Not Available",
        'Police station Maps Link': null,
        'Traffic station Maps Link': null
      };
    }

    const L = window.L;
    if (!L) return {
      'Police station': "Not Available",
      'Traffic station': "Not Available",
      'Police station Address': "Not Available",
      'Traffic station Address': "Not Available",
      'Police station Maps Link': null,
      'Traffic station Maps Link': null
    };

    const point = L.latLng(lat, lng);

    if (policeJurisdiction.features.length > 0 && lng === 77.5946 && lat === 12.9716) {
      console.log("Police jurisdiction feature example:", policeJurisdiction.features[0]);
    }

    for (const feature of policeJurisdiction.features) {
      if (feature.geometry) {
        const isInside = processGeometry(feature.geometry, point, L);

        if (isInside) {
          const policeStation = feature.properties["Police Station"] ||
              feature.properties.Name ||
              "Not Available";

          const trafficStation = policeStation.replace(' PS', ' Traffic PS');

          let psAddress = "Address not available";
          let psMapsLink = null;
          let tpAddress = "Address not available";
          let tpMapsLink = null;

          if (psLocations[policeStation.trim()] && psLocations[policeStation.trim()].places && psLocations[policeStation.trim()].places.length > 0) {
            const psInfo = psLocations[policeStation.trim()].places[0];
            psAddress = psInfo.formattedAddress;
            psMapsLink = psInfo.googleMapsUri;
          }

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
    }

    return {
      'Police station': "Not Available",
      'Traffic station': "Not Available",
      'Police station Address': "Not Available",
      'Traffic station Address': "Not Available",
      'Police station Maps Link': null,
      'Traffic station Maps Link': null
    };
  };

  // Function to find revenue classification for a location
  const findRevenueClassification = (lat, lng) => {
    if (!RevenueClassification || !RevenueClassification.features) {
      return {
        District: "Not Available",
        Taluk: "Not Available",
        Hobli: "Not Available",
        Village: "Not Available",
        htmlDescription: null
      };
    }

    const L = window.L;
    if (!L) return {
      District: "Not Available",
      Taluk: "Not Available",
      Hobli: "Not Available",
      Village: "Not Available",
      htmlDescription: null
    };

    const point = L.latLng(lat, lng);

    if (RevenueClassification.features.length > 0 && lng === 77.5946 && lat === 12.9716) {
      console.log("Revenue classification feature example:", RevenueClassification.features[0]);
    }

    for (const feature of RevenueClassification.features) {
      if (feature.geometry) {
        const isInside = processGeometry(feature.geometry, point, L);

        if (isInside) {
          const villageName = feature.properties.Name || "Not Available";

          const htmlDescription = feature.properties.description || null;

          let district = "Not Available";
          let taluk = "Not Available";
          let hobli = "Not Available";

          if (htmlDescription) {
            const villageCodeMatch = htmlDescription.match(/KGISVillageCode<\/td>\s*<td>(\d+)<\/td>/);
            const villageCode = villageCodeMatch ? villageCodeMatch[1] : null;

            const hobliIdMatch = htmlDescription.match(/KGISHobliID<\/td>\s*<td>(\d+)<\/td>/);
            const hobliId = hobliIdMatch ? hobliIdMatch[1] : null;

            const bhuCodeMatch = htmlDescription.match(/Bhucode<\/td>\s*<td>(\d+)<\/td>/);
            const bhuCode = bhuCodeMatch ? bhuCodeMatch[1] : null;

            const districtCodeToName = { "20": "Bengaluru (Urban)" };

            const talukCodeToName = {};

            const hobliCodeToName = {};

            if (bhuCode && bhuCode.length >= 2) {
              const districtCode = bhuCode.substring(0, 2);
              district = districtCodeToName[districtCode] || `District Code: ${districtCode}`;
            }

            if (bhuCode && bhuCode.length >= 4) {
              const talukCode = bhuCode.substring(2, 4);
              taluk = talukCodeToName[talukCode] || `Taluk Code: ${talukCode}`;
            }

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
        'SRO': "Not Available",
        'DRO': "Not Available",
        'SRO Address': "Not Available",
        'DRO Address': "Not Available",
        'SRO Maps Link': null,
        'DRO Maps Link': null
      };
    }

    const L = window.L;
    if (!L) return {
      'SRO': "Not Available",
      'DRO': "Not Available",
      'SRO Address': "Not Available",
      'DRO Address': "Not Available",
      'SRO Maps Link': null,
      'DRO Maps Link': null
    };

    const point = L.latLng(lat, lng);

    if (RevenueOffices.features.length > 0 && lng === 77.5946 && lat === 12.9716) {
      console.log("Revenue office feature example:", RevenueOffices.features[0]);
    }

    for (const feature of RevenueOffices.features) {
      if (feature.geometry) {
        const isInside = processGeometry(feature.geometry, point, L);

        if (isInside) {
          const sroName = feature.properties.SRO_Name ||
              feature.properties.Name ||
              "Not Available";

          const droName = feature.properties.DRO_Name ||
              "Not Available";

          let sroAddress = "Address not available";
          let sroMapsLink = null;
          let droAddress = "Address not available";
          let droMapsLink = null;

          if (sroLocations[sroName] && sroLocations[sroName].places && sroLocations[sroName].places.length > 0) {
            const sroInfo = sroLocations[sroName].places[0];
            sroAddress = sroInfo.formattedAddress;
            sroMapsLink = sroInfo.googleMapsUri;
          }

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
    }

    return {
      'SRO': "Not Available",
      'DRO': "Not Available",
      'SRO Address': "Not Available",
      'DRO Address': "Not Available",
      'SRO Maps Link': null,
      'DRO Maps Link': null
    };
  };

  // Function to find constituency for a location
  const findConstituency = (lat, lng) => {
    if (!Constituencies || !Constituencies.features) {
      return {
        'Constituency Name': "Not Available",
        'Constituency Type': "Not Available"
      };
    }

    const L = window.L;
    if (!L) return {
      'Constituency Name': "Not Available",
      'Constituency Type': "Not Available"
    };

    const point = L.latLng(lat, lng);

    if (Constituencies.features.length > 0 && lng === 77.5946 && lat === 12.9716) {
      console.log("Constituency feature example:", Constituencies.features[0]);
    }

    for (const feature of Constituencies.features) {
      if (feature.geometry) {
        const isInside = processGeometry(feature.geometry, point, L);

        if (isInside) {
          const constituencyName = feature.properties["AC_NAME"] ||
              feature.properties.Name ||
              "Not Available";

          const constituencyType = feature.properties["Constituency Type"] ||
              "Assembly";

          return {
            'Constituency Name': constituencyName,
            'Constituency Type': constituencyType
          };
        }
      }
    }

    return {
      'Constituency Name': "Not Available",
      'Constituency Type': "Not Available"
    };
  };

  // Function to find BESCOM information for a location
  const findBescomInfo = (lat, lng) => {
    if (!bescomDivisionBoundary || !bescomDivisionBoundary.features ||
        !bescomSubdivisionBoundary || !bescomSubdivisionBoundary.features ||
        !bescomSectionBoundary || !bescomSectionBoundary.features) {
      return {
        'Division': "Not Available",
        'Subdivision': "Not Available",
        'Section': "Not Available",
        'O&M Office': "Not Available",
        'O&M Office Address': "Address not available",
        'O&M Office Maps Link': null
      };
    }

    const L = window.L;
    if (!L) return {
      'Division': "Not Available",
      'Subdivision': "Not Available",
      'Section': "Not Available",
      'O&M Office': "Not Available",
      'O&M Office Address': "Address not available",
      'O&M Office Maps Link': null
    };

    const point = L.latLng(lat, lng);

    let divisionName = "Not Available";
    for (const feature of bescomDivisionBoundary.features) {
      if (feature.geometry) {
        const isInside = processGeometry(feature.geometry, point, L);

        if (isInside) {
          divisionName = feature.properties.DivisionName || "Not Available";
          console.log("Found BESCOM Division:", divisionName, feature.properties);
          break;
        }
      }
    }

    let subdivisionName = "Not Available";
    for (const feature of bescomSubdivisionBoundary.features) {
      if (feature.geometry) {
        const isInside = processGeometry(feature.geometry, point, L);

        if (isInside) {
          subdivisionName = feature.properties.Sub_DivisionName || "Not Available";
          console.log("Found BESCOM Subdivision:", subdivisionName, feature.properties);
          break;
        }
      }
    }

    let sectionName = "Not Available";
    let sectionId = null;
    for (const feature of bescomSectionBoundary.features) {
      if (feature.geometry) {
        const isInside = processGeometry(feature.geometry, point, L);

        if (isInside) {
          sectionName = feature.properties.SectionName || "Not Available";
          sectionId = feature.properties.KGISSectionID || null;
          console.log("Found BESCOM Section:", sectionName, feature.properties);
          break;
        }
      }
    }

    let omOfficeName = "Not Available";
    let omOfficeAddress = "Address not available";
    let omOfficeMapsLink = null;

    if (sectionId && bescomLocations[sectionId] &&
        bescomLocations[sectionId].places &&
        bescomLocations[sectionId].places.length > 0) {

      const sectionInfo = bescomLocations[sectionId].places[0];
      omOfficeName = bescomLocations[sectionId].name || "O&M - " + sectionName;
      omOfficeAddress = sectionInfo.formattedAddress || "Address not available";
      omOfficeMapsLink = sectionInfo.googleMapsUri || null;
    }

    return {
      'Division': divisionName,
      'Subdivision': subdivisionName,
      'Section': sectionName,
      'O&M Office': omOfficeName,
      'O&M Office Address': omOfficeAddress,
      'O&M Office Maps Link': omOfficeMapsLink
    };
  };

  // Function to find BWSSB information for a location
  const findBwssbInfo = (lat, lng) => {
    if (!bwssbDivisions || !bwssbDivisions.features ||
        !bwssbSubDivisions || !bwssbSubDivisions.features ||
        !bwssbServiceStations || !bwssbServiceStations.features) {
      return {
        'Division': "Not Available",
        'Sub Division': "Not Available",
        'Service Station': "Not Available",
      };
    }

    const L = window.L;
    if (!L) return {
      'Division': "Not Available",
      'Sub Division': "Not Available",
      'Service Station': "Not Available",
    };

    const point = L.latLng(lat, lng);

    let divisionName = "Not Available";
    for (const feature of bwssbDivisions.features) {
      if (feature.geometry) {
        const isInside = processGeometry(feature.geometry, point, L);

        if (isInside) {
          divisionName = feature.properties.DivisionName || "Not Available";
          console.log("Found BWSSB Division:", divisionName, feature.properties);
          break;
        }
      }
    }

    let subdivisionName = "Not Available";
    for (const feature of bwssbSubDivisions.features) {
      if (feature.geometry) {
        const isInside = processGeometry(feature.geometry, point, L);

        if (isInside) {
          subdivisionName = feature.properties.Sub_DivisionName || "Not Available";
          console.log("Found BWSSB Subdivision:", subdivisionName, feature.properties);
          break;
        }
      }
    }

    let serviceStationName = "Not Available";
    for (const feature of bwssbServiceStations.features) {
      if (feature.geometry) {
        const isInside = processGeometry(feature.geometry, point, L);

        if (isInside) {
          serviceStationName = feature.properties.Service_StationName || "Not Available";
          console.log("Found BWSSB Service Station:", serviceStationName, feature.properties);
          break;
        }
      }
    }

    return {
      'Division': divisionName,
      'Sub Division': subdivisionName,
      'Service Station': serviceStationName,
    };
  };

  // Function to find BDA (Bangalore Development Authority) information for a location
  const findBdaInfo = (lat, lng) => {
    const defaultInfo = {
      'BDA Layout Name': "Not Available",
      'BDA Layout Number': "Not Available"
    };

    if (!bdaLayoutBoundaries || !bdaLayoutBoundaries.features) {
      return defaultInfo;
    }

    const L = window.L;
    if (!L) return defaultInfo;

    const point = L.latLng(lat, lng);

    if (bdaLayoutBoundaries.features.length > 0 && lng === 77.5946 && lat === 12.9716) {
      console.log("BDA Layout feature example:", bdaLayoutBoundaries.features[0]);
    }

    for (const feature of bdaLayoutBoundaries.features) {
      if (feature.geometry) {
        const isInside = processGeometry(feature.geometry, point, L);

        if (isInside) {
          return {
            'BDA Layout Name': feature.properties.LAYOUT_NAME || "Not Available",
            'BDA Layout Number': feature.properties.LAYOUT_NO || "Not Available"
          };
        }
      }
    }

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
          'Electicity station': 'Not Available'
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
  const searchLocationsPhoton = async (query) => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      setShowSuggestions(false);
      return;
    }
    
    try {
      setIsSearching(true);
      // Photon API with Bangalore as a bias point
      // The lon,lat coordinates are for Bangalore center
      // Add bbox parameter for Bangalore (approximate coordinates)
      const bangaloreBbox = '77.4,12.8,77.8,13.2'; // minLon, minLat, maxLon, maxLat
      const searchUrl = `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=5&lang=en&lon=77.5946&lat=12.9716&bbox=${bangaloreBbox}`;
      
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

  const searchLocationsGoogle = async (query) => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      setShowSuggestions(false);
      return;
    }

    try {
      setIsSearching(true);

      // Make sure Google Maps is loaded
      if (!window.google) {
        await loadGoogleMapsScript();
      }

      // Create a bounds biased to Bangalore
      const bangaloreBounds = new window.google.maps.LatLngBounds(
          new window.google.maps.LatLng(12.8, 77.4), // SW corner
          new window.google.maps.LatLng(13.2, 77.8)  // NE corner
      );

      // Create the places service
      const service = new window.google.maps.places.AutocompleteService();

      // Request predictions
      service.getPlacePredictions({
        input: query,
        bounds: bangaloreBounds,
        componentRestrictions: { country: 'in' },
        types: ['geocode']
      }, (predictions, status) => {
        if (status !== window.google.maps.places.PlacesServiceStatus.OK || !predictions) {
          setSearchResults([]);
          setShowSuggestions(false);
          setIsSearching(false);
          return;
        }

        // We need a PlacesService to get details for each prediction
        // Create a temporary div for the PlacesService
        // const placesDiv = document.createElement('div');
        // const placesService = new window.google.maps.places.PlacesService(placesDiv);

        // Limit to 5 predictions to match photon behavior
        const limitedPredictions = predictions.slice(0, 5);

        // Transform predictions to match our expected format
        const transformedResults = limitedPredictions.map(prediction => {
          return {
            display_name: prediction.description,
            place_id: prediction.place_id,
            lat: '', // Will be filled after getting place details
            lon: '', // Will be filled after getting place details
            address: prediction.structured_formatting,
            google_result: true // Mark as Google result for later processing
          };
        });

        setSearchResults(transformedResults);
        setShowSuggestions(transformedResults.length > 0);
        setIsSearching(false);
      });
    } catch (error) {
      console.error('Google Places search error:', error);
      setSearchResults([]);
      setShowSuggestions(false);
      setIsSearching(false);
    }
  };

  const searchLocations = async (query) => {
    const useGoogleSearch = process.env.REACT_APP_USE_GOOGLE_SEARCH === 'true';

    if (useGoogleSearch) {
      await searchLocationsGoogle(query);
    } else {
      await searchLocationsPhoton(query)
    }
  }

  // Handle location selection from suggestions
  const handleLocationSelect = async (location) => {
    // Check if it's a Google result that needs details
    if (location.google_result && location.place_id) {
      setIsSearching(true);

      try {
        if (!window.google) {
          await loadGoogleMapsScript();
        }

        // Create a temporary div for the PlacesService
        const placesDiv = document.createElement('div');
        const placesService = new window.google.maps.places.PlacesService(placesDiv);

        // Get place details
        placesService.getDetails({
          placeId: location.place_id,
          fields: ['name', 'formatted_address', 'geometry']
        }, (place, status) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK && place && place.geometry) {
            const lat = place.geometry.location.lat();
            const lng = place.geometry.location.lng();

            // Create a complete location object
            const completeLocation = {
              display_name: place.name || place.formatted_address,
              lat: lat.toString(),
              lon: lng.toString(),
              address: { formatted: place.formatted_address }
            };

            // Continue with the normal flow using the complete location
            setSelectedLocation(completeLocation);
            setSearchQuery(completeLocation.display_name);
            setShowSuggestions(false);
            setShowInfoPanel(true);
            setShowIntroPanel(false);
            setIsPanelExpanded(false);

            if (mapInstanceRef.current) {
              // Find the police jurisdiction and revenue offices
              const policeStation = findPoliceJurisdiction(lat, lng);
              const revenueOffices = findRevenueOffices(lat, lng);

              // Update location info with dynamically calculated data
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

              // When selecting from search results, DO center the map on the location
              zoomToLocationFromSearch(lat, lng, completeLocation.display_name);
            }
          } else {
            console.error('Place details error:', status);
          }

          setIsSearching(false);
        });
      } catch (error) {
        console.error('Error getting place details:', error);
        setIsSearching(false);
      }
    } else {
      // Original code for non-Google results
      setSelectedLocation(location);
      setSearchQuery(location.display_name);
      setShowSuggestions(false);
      setShowInfoPanel(true);
      setShowIntroPanel(false);
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

  useEffect(() => {
    // Update your existing useEffect to include this
    setUseGoogleSearch(process.env.REACT_APP_USE_GOOGLE_SEARCH === 'true');

    if (process.env.REACT_APP_USE_GOOGLE_SEARCH === 'true') {
      // Preload Google Maps API
      loadGoogleMapsScript().catch(error => {
        console.error('Failed to load Google Maps API:', error);
      });
    }

    // Rest of your existing useEffect code...
  }, []);

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
               className="bg-white p-2 rounded-lg border-2 border-gray-300 text-blue-600 dark:text-blue-400 hover:bg-gray-100 transition-colors flex-shrink-0 shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 relative group" // Added 'relative group' for tooltip positioning
               aria-label="Use your current location"
             >
               <LocateFixed size={22} />
               {/* Tooltip */}
               <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none">
                 Find your current location
               </div>
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
                If you're a Bengaluru resident, you can use Civic Compass to identify the BBMP, BDA, Revenue, BESCOM, BWSSB offices, and Police stations for your area.
                </p>
                <p className="text-gray-600 mt-2"> {/* Dark mode */}
                Enter the <strong>exact address</strong> you need information for.
                </p>
                <p className="text-gray-600 mt-2"><em>This tool is only for Bengaluru at this time.</em></p>

                <h2 className="text-lg font-semibold text-gray-800 mt-7 mb-1">Data Sources</h2>
                <p className="text-gray-600"> {/* Dark mode */}
                We pull information from Government records. While we strive for accuracy, these sources can sometimes be incomplete or outdated.
                </p>
                {/* Linkified Data Sources */}
                <div className="flex flex-col space-y-2 text-sm mt-2"> {/* Dark mode */}
                  <a href="https://opencity.in/data" target="_blank" rel="noopener noreferrer" className="underline text-gray-500 transtition-opacity hover:opacity-80">OpenCity</a>
                  <a href="https://kgis.ksrsac.in/kgis/" target="_blank" rel="noopener noreferrer" className="underline text-gray-500 transtition-opacity hover:opacity-80">Karnataka-GIS</a>
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
                  <h2 className="text-lg font-semibold text-gray-800 mb-1">Address You Entered</h2>
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
                          {Object.values(locationInfo.bbmpInfo).every(value => value === "Not Available" || value === "Missing data") ? (
                            <p className="text-gray-700 py-1">This information is unavailable for this address. This could be because the area is outside BBMP limits</p>
                          ) : (
                            <>
                              {Object.entries(locationInfo.bbmpInfo).map(([fieldName, value]) => (
                                <div key={fieldName} className="grid grid-cols-2 gap-2 py-1">
                                  <span className="text-gray-600">{fieldName}</span>
                                  <span className="font-medium text-gray-700 text-left break-words">{value}</span>
                                </div>
                              ))}
                              <p className="text-xs text-gray-600 mt-4 mb-3">
                                This information is based on the 198-ward classification, which BBMP still uses as a reference — even though it's no longer the official structure.
                              </p>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                    {/* BDA Information - Accordion */}
                    <div className="border-b border-gray-200">
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
                            {Object.values(locationInfo.bdaInfo).every(value => value === "Not Available") ? (
                              <p className="text-gray-700 py-1">This information is unavailable for this address. This could be because the area is outside BDA limits</p>
                            ) : (
                              Object.entries(locationInfo.bdaInfo).map(([fieldName, value]) => (
                                <div key={fieldName} className="grid grid-cols-2 gap-2 py-1">
                                  <span className="text-gray-600">{fieldName}</span>
                                  <span className="font-medium text-gray-700 text-left break-words">{value}</span>
                                </div>
                              ))
                            )}
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
                              .every(([_, value]) => value === "Not Available" || value === "Missing data") ? (
                                <p className="text-gray-700 py-1">This information is unavailable for this address</p>
                              ) : (
                                Object.entries(locationInfo.revenueClassification)
                                  .filter(([key]) => key !== 'htmlDescription')
                                  .map(([fieldName, value]) => (
                                    <div key={fieldName} className="grid grid-cols-2 gap-2 py-1">
                                      <span className="text-gray-600">{fieldName}</span>
                                      <span className="font-medium text-gray-700 text-left break-words">{value}</span>
                                    </div>
                                  ))
                              )
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
                            {Object.entries(locationInfo.revenueOffices)
                              .filter(([key]) => !key.includes('Maps Link'))
                              .every(([_, value]) => value === "Not Available" || value === "Missing data") ? (
                                <p className="text-gray-700 py-1">This information is unavailable for this address</p>
                              ) : (
                                <>
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
                                </>
                              )
                            }
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
                              {Object.entries(locationInfo.bescomInfo)
                                  .filter(([key]) => key !== 'O&M Office Address' && key !== 'O&M Office Maps Link')
                                  .every(([_, value]) => value === "Not Available" || value === "Not available") ? (
                                    <p className="text-gray-700 py-1">This information is unavailable for this address. This could be because the area is outside BESCOM limits</p>
                                  ) : (
                                    <>
                                      {Object.entries(locationInfo.bescomInfo)
                                          .filter(([key]) => key !== 'O&M Office Address' && key !== 'O&M Office Maps Link')
                                          .map(([fieldName, value]) => (
                                          <div key={fieldName} className="grid grid-cols-2 gap-2 py-1">
                                            <span className="text-gray-600">{fieldName}</span>
                                            <span className="font-medium text-gray-700 text-left break-words">{value}</span>
                                          </div>
                                      ))}

                                      {/* O&M Office Address */}
                                      {locationInfo.bescomInfo['O&M Office Address'] !== "Address not available" && (
                                          <div className="grid grid-cols-2 py-1">
                                            <span className="text-gray-600">O&M Office Address</span>
                                            <div className="flex flex-col">
                                              <span className="text-gray-700 break-words">{locationInfo.bescomInfo['O&M Office Address']}</span>
                                              {locationInfo.bescomInfo['O&M Office Maps Link'] && (
                                                  <a
                                                      href={locationInfo.bescomInfo['O&M Office Maps Link']}
                                                      target="_blank"
                                                      rel="noopener noreferrer"
                                                      className="text-blue-600 hover:text-blue-800 text-md flex items-center mt-1"
                                                  >
                                                    <ExternalLink size={14} className="mr-1" /> Google Maps
                                                  </a>
                                              )}
                                            </div>
                                          </div>
                                      )}

                                      {/* Warning message at the bottom */}
                                      {locationInfo.bescomInfo['O&M Office'] !== "Not Available" && (
                                          <div className="mt-3 text-xs text-yellow-600 flex items-center">
                                            <svg
                                                xmlns="http://www.w2.org/2000/svg"
                                                className="h-5 w-4 mr-1 text-yellow-500"
                                                fill="none"
                                                viewBox="-1 0 24 24"
                                                stroke="currentColor"
                                            >
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                            </svg>
                                            <span>O&M office data may need verification.</span>
                                          </div>
                                      )}
                                    </>
                                  )
                              }
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
                            {Object.entries(locationInfo.bwssbInfo)
                              .filter(([key]) => !key.includes('Address') && !key.includes('Contact'))
                              .every(([_, value]) => value === "Not Available") ? (
                                <p className="text-gray-700 py-1">This information is unavailable for this address. This could be because the area is outside BWSSB service limits</p>
                              ) : (
                                Object.entries(locationInfo.bwssbInfo)
                                  .filter(([key]) => !key.includes('Address') && !key.includes('Contact'))
                                  .map(([fieldName, value]) => (
                                    <div key={fieldName} className="grid grid-cols-2 gap-2 py-1">
                                      <span className="text-gray-600">{fieldName}</span>
                                      <span className="font-medium text-gray-700 text-left break-words">{value}</span>
                                    </div>
                                  ))
                              )
                            }
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
                            {locationInfo.policeJurisdiction['Police station'] === "Not Available" && 
                             locationInfo.policeJurisdiction['Traffic station'] === "Not Available" ? (
                              <p className="text-gray-700 py-1">This information is unavailable for this address</p>
                            ) : (
                              <>
                                {/* Police Station Information */}
                                <div className="space-y-2">
                                  <div className="grid grid-cols-2 gap-2 py-1">
                                    <span className="text-gray-600">Police Station</span>
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
                                    <span className="text-gray-600">Traffic Police</span>
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
                              </>
                            )}
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
              <a href="https://forms.gle/EmQiMpayciLdbww96" target="_blank" className="underline text-gray-500 transition-opacity hover:opacity-80">Report an Error</a>
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
                If you're a Bengaluru resident, you can use Civic Compass to identify the BBMP, BDA, Revenue, BESCOM, BWSSB offices, and Police stations for your area.
                </p>
                <p className="text-gray-600  mt-2"> {/* Dark mode */}
                Enter the <strong>exact address</strong> you need information for.
                </p>
                <p className="text-gray-600 mt-2"><em>This tool is only for Bengaluru at this time.</em></p>

                <h2 className="text-lg font-semibold text-gray-800 mt-7 mb-1">Data Sources</h2>
                <p className="text-gray-600"> {/* Dark mode */}
                We pull information from Government records. While we strive for accuracy, these sources can sometimes be incomplete or outdated.
                </p>
                {/* Linkified Data Sources */}
                <div className="flex flex-col space-y-2 text-sm mt-2"> {/* Dark mode */}
                  <a href="https://opencity.in/data" target="_blank" rel="noopener noreferrer" className="underline text-gray-500 transtition-opacity hover:opacity-80">OpenCity</a>
                  <a href="https://kgis.ksrsac.in/kgis/" target="_blank" rel="noopener noreferrer" className="underline text-gray-500 transtition-opacity hover:opacity-80">Karnataka-GIS</a>
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
                  <h2 className="text-lg font-semibold text-gray-800 mb-1">Address You Entered</h2>
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
                          {Object.values(locationInfo.bbmpInfo).every(value => value === "Not Available" || value === "Missing data") ? (
                            <p className="text-gray-700 py-1">This information is unavailable for this address. This could be because the area is outside BBMP limits</p>
                          ) : (
                            <>
                              {Object.entries(locationInfo.bbmpInfo).map(([fieldName, value]) => (
                                <div key={fieldName} className="grid grid-cols-2 gap-2 py-1">
                                  <span className="text-gray-600">{fieldName}</span>
                                  <span className="font-medium text-gray-700 text-left break-words">{value}</span>
                                </div>
                              ))}
                              <p className="text-xs text-gray-800 mt-4 mb-3 max-w-md">
                                This information is based on the 198-ward classification, which BBMP still uses as a reference — even though it's no longer the official structure.
                              </p>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                    {/* BDA Information - Accordion */}
                    <div className="border-b border-gray-200">
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
                            {Object.values(locationInfo.bdaInfo).every(value => value === "Not Available") ? (
                              <p className="text-gray-700 py-1">This information is unavailable for this address. This could be because the area is outside BDA limits</p>
                            ) : (
                              Object.entries(locationInfo.bdaInfo).map(([fieldName, value]) => (
                                <div key={fieldName} className="grid grid-cols-2 gap-2 py-1">
                                  <span className="text-gray-600">{fieldName}</span>
                                  <span className="font-medium text-gray-700 text-left break-words">{value}</span>
                                </div>
                              ))
                            )}
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
                              .every(([_, value]) => value === "Not Available" || value === "Missing data") ? (
                                <p className="text-gray-700 py-1">This information is unavailable for this address</p>
                              ) : (
                                Object.entries(locationInfo.revenueClassification)
                                  .filter(([key]) => key !== 'htmlDescription')
                                  .map(([fieldName, value]) => (
                                    <div key={fieldName} className="grid grid-cols-2 gap-2 py-1">
                                      <span className="text-gray-600">{fieldName}</span>
                                      <span className="font-medium text-gray-700 text-left break-words">{value}</span>
                                    </div>
                                  ))
                              )
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
                            {Object.entries(locationInfo.revenueOffices)
                              .filter(([key]) => !key.includes('Maps Link'))
                              .every(([_, value]) => value === "Not Available" || value === "Missing data") ? (
                                <p className="text-gray-700 py-1">This information is unavailable for this address</p>
                              ) : (
                                <>
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
                                </>
                              )
                            }
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
                              {Object.entries(locationInfo.bescomInfo)
                                  .filter(([key]) => key !== 'O&M Office Address' && key !== 'O&M Office Maps Link')
                                  .every(([_, value]) => value === "Not Available" || value === "Not available") ? (
                                    <p className="text-gray-700 py-1">This information is unavailable for this address. This could be because the area is outside BESCOM limits</p>
                                  ) : (
                                    <>
                                      {Object.entries(locationInfo.bescomInfo)
                                          .filter(([key]) => key !== 'O&M Office Address' && key !== 'O&M Office Maps Link')
                                          .map(([fieldName, value]) => (
                                          <div key={fieldName} className="grid grid-cols-2 gap-2 py-1">
                                            <span className="text-gray-600">{fieldName}</span>
                                            <span className="font-medium text-gray-700 text-left break-words">{value}</span>
                                          </div>
                                      ))}

                                      {/* O&M Office Address */}
                                      {locationInfo.bescomInfo['O&M Office Address'] !== "Address not available" && (
                                          <div className="grid grid-cols-2 py-1">
                                            <span className="text-gray-600">O&M Office Address</span>
                                            <div className="flex flex-col">
                                              <span className="text-gray-700 break-words">{locationInfo.bescomInfo['O&M Office Address']}</span>
                                              {locationInfo.bescomInfo['O&M Office Maps Link'] && (
                                                  <a
                                                      href={locationInfo.bescomInfo['O&M Office Maps Link']}
                                                      target="_blank"
                                                      rel="noopener noreferrer"
                                                      className="text-blue-600 hover:text-blue-800 text-md flex items-center mt-1"
                                                  >
                                                    <ExternalLink size={14} className="mr-1" /> Google Maps
                                                  </a>
                                              )}
                                            </div>
                                          </div>
                                      )}

                                      {/* Warning message at the bottom */}
                                      {locationInfo.bescomInfo['O&M Office'] !== "Not Available" && (
                                          <div className="mt-3 text-xs text-yellow-600 flex items-center">
                                            <svg
                                                xmlns="http://www.w2.org/2000/svg"
                                                className="h-5 w-4 mr-1 text-yellow-500"
                                                fill="none"
                                                viewBox="-1 0 24 24"
                                                stroke="currentColor"
                                            >
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                            </svg>
                                            <span>O&M office data may need verification.</span>
                                          </div>
                                      )}
                                    </>
                                  )
                              }
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
                            {Object.entries(locationInfo.bwssbInfo)
                              .filter(([key]) => !key.includes('Address') && !key.includes('Contact'))
                              .every(([_, value]) => value === "Not Available") ? (
                                <p className="text-gray-700 py-1">This information is unavailable for this address. This could be because the area is outside BWSSB service limits</p>
                              ) : (
                                Object.entries(locationInfo.bwssbInfo)
                                  .filter(([key]) => !key.includes('Address') && !key.includes('Contact'))
                                  .map(([fieldName, value]) => (
                                    <div key={fieldName} className="grid grid-cols-2 gap-2 py-1">
                                      <span className="text-gray-600">{fieldName}</span>
                                      <span className="font-medium text-gray-700 text-left break-words">{value}</span>
                                    </div>
                                  ))
                              )
                            }
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
                            {locationInfo.policeJurisdiction['Police station'] === "Not Available" && 
                             locationInfo.policeJurisdiction['Traffic station'] === "Not Available" ? (
                              <p className="text-gray-700 py-1">This information is unavailable for this address</p>
                            ) : (
                              <>
                                {/* Police Station Information */}
                                <div className="space-y-2">
                                  <div className="grid grid-cols-2 gap-2 py-1">
                                    <span className="text-gray-600">Police Station</span>
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
                                    <span className="text-gray-600">Traffic Police</span>
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
                              </>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                </div> {/* End Accordions Container */}
              </div>
            ) : null} {/* Render nothing if no selection and not intro */}

            <div className="mt-auto pt-4 border-t border-gray-200 flex-shrink-0"> {/* Footer stick to bottom */}
              <div className="flex justify-between items-center text-sm">
                <a href="https://forms.gle/EmQiMpayciLdbww96" target="_blank" className="underline text-gray-500 transition-opacity hover:opacity-80">Report an Error</a>
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

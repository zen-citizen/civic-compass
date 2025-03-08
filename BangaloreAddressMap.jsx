import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Search, Info, X, Loader } from 'lucide-react';

const BangaloreAddressMap = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showInfoPanel, setShowInfoPanel] = useState(false); // Default to hidden
  const [zoomedLocation, setZoomedLocation] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false); // Added to track reverse geocoding state
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1); // Track which suggestion is active
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const polygonRef = useRef(null);
  const searchTimeoutRef = useRef(null);

  // Sample data - in a real app this would come from an API
  const bbmpInfo = {
    Zone: 'West',
    Division: 'Gandhi Nagar',
    Subdivision: 'Chikpet',
    'Ward name': 'Chickpete',
    'Ward number': 'Ward 109'
  };

  const revenueClassification = {
    District: 'Bengaluru (Urban)',
    Taluk: 'Bangalore (North)',
    Hobli: 'Kasaba',
    Village: 'Bbmp'
  };

  const revenueOffices = {
    DRO: 'Gandhinagar',
    SRO: 'Gandhinagar'
  };

  const policeJurisdiction = {
    'Police station': 'City Market PS',
    'Traffic station': 'City Market Traffic PS',
    'Electicity station': 'City Market Traffic PS'
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

  // Initialize the map
  useEffect(() => {
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
      
      // Show info panel
      setShowInfoPanel(true);
      
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
      setShowInfoPanel(true);
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
          
          // Try to reverse geocode the location
          if (window.L.Control.Geocoder) {
            const geocoder = window.L.Control.Geocoder.nominatim();
            geocoder.reverse(
              { lat: latitude, lng: longitude },
              mapInstanceRef.current.getZoom(),
              results => {
                if (results && results.length > 0) {
                  setSearchQuery(results[0].name.split(',')[0]);
                  setSelectedLocation({
                    display_name: results[0].name,
                    lat: latitude,
                    lon: longitude
                  });
                }
              }
            );
          }
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
    setShowInfoPanel(true); // Show the info panel when a location is selected
    
    if (mapInstanceRef.current) {
      const { lat, lon } = location;
      zoomToLocation(parseFloat(lat), parseFloat(lon), location.display_name);
    }
  };
  
  // Zoom to a specific location
  const zoomToLocation = (lat, lng, name) => {
    if (!mapInstanceRef.current) return;
    
    const map = mapInstanceRef.current;
    const L = window.L;
    
    // Clear previous marker
    if (markerRef.current) {
      map.removeLayer(markerRef.current);
    }
    
    // Clear previous polygon
    if (polygonRef.current) {
      map.removeLayer(polygonRef.current);
    }
    
    // Add new marker
    markerRef.current = L.marker([lat, lng])
      .addTo(map)
      .bindPopup(name)
      .openPopup();
    
    // Zoom to the location
    map.setView([lat, lng], 16);
    
    // Show "zoomed in" message
    setZoomedLocation(true);
    
    // Show info panel when a location is selected
    setShowInfoPanel(true);
    
    // Hide the message after 3 seconds
    setTimeout(() => {
      setZoomedLocation(false);
    }, 3000);
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

  return (
    <div className="bg-gray-100 h-screen flex justify-center items-center p-0">
      <div className="w-full h-screen bg-white overflow-hidden">
        <div className="p-4 text-center">
          <h1 className="text-xl font-semibold flex justify-center items-center gap-1">
            Find key details of
            <br />your address in Bangalore <Info size={16} className="text-gray-500" />
          </h1>
          
          <div className="mt-6 max-w-md mx-auto">
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchInputChange}
                onKeyDown={handleKeyDown}
                onFocus={() => searchQuery.length >= 2 && setShowSuggestions(true)}
                placeholder="Enter exact address or click on map"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg pr-12"
              />
              <button 
                type="submit"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500"
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
            
            {/* Click instruction */}
            <div className="mt-2 text-sm text-gray-500">
                {/* <span>Sources</span>
                <span>Other information</span>
                <span>Links</span> */}
            </div>
          </div>
        </div>

        <div className="flex flex-col">
          {/* Map container - takes full width */}
          <div className="flex-1 relative" style={{ minHeight: '80vh' }}>
            {/* Map container */}
            <div 
              ref={mapContainerRef} 
              className="w-full h-full absolute inset-0" 
            ></div>
            
            {/* Floating info panel */}
            {selectedLocation && showInfoPanel && (
              <div className="absolute top-4 left-4 z-40 bg-white rounded-lg shadow-lg max-w-sm w-full md:w-96 max-h-80vh overflow-auto">
                <div className="p-4 overflow-y-auto" style={{ maxHeight: 'calc(80vh - 40px)' }}>
                  <div className="flex justify-between items-center mb-2">
                    <h2 className="font-bold text-gray-800">Location Details</h2>
                    <button 
                      onClick={() => setShowInfoPanel(false)}
                      className="p-1 rounded-full hover:bg-gray-100"
                    >
                      <X size={16} />
                    </button>
                  </div>
                  
                  <div className="text-sm text-gray-600 mb-4 border-b pb-2">
                    {selectedLocation.display_name}
                  </div>
                  
                  <div className="space-y-6">
                    {/* BBMP information */}
                    <div>
                      <h2 className="font-semibold text-gray-700 mb-3 pb-2 border-b">BBMP information</h2>
                      <div className="space-y-1">
                        {Object.entries(bbmpInfo).map(([fieldName, value]) => (
                          <div key={fieldName} className="grid grid-cols-2 py-1">
                            <span className="text-gray-600">{fieldName}</span>
                            <span className="text-right font-medium">{value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {/* Revenue Classification */}
                    <div>
                      <h2 className="font-semibold text-gray-700 mb-3 pb-2 border-b">Revenue Classification</h2>
                      <div className="space-y-1">
                        {Object.entries(revenueClassification).map(([fieldName, value]) => (
                          <div key={fieldName} className="grid grid-cols-2 py-1">
                            <span className="text-gray-600">{fieldName}</span>
                            <span className="text-right font-medium">{value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {/* Revenue Offices */}
                    <div>
                      <h2 className="font-semibold text-gray-700 mb-3 pb-2 border-b">Revenue Offices</h2>
                      <div className="space-y-1">
                        {Object.entries(revenueOffices).map(([fieldName, value]) => (
                          <div key={fieldName} className="grid grid-cols-2 py-1">
                            <span className="text-gray-600">{fieldName}</span>
                            <span className="text-right font-medium">{value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {/* Police Jurisdiction */}
                    <div>
                      <h2 className="font-semibold text-gray-700 mb-3 pb-2 border-b">Police Jurisdiction</h2>
                      <div className="space-y-1">
                        {Object.entries(policeJurisdiction).map(([fieldName, value]) => (
                          <div key={fieldName} className="grid grid-cols-2 py-1">
                            <span className="text-gray-600">{fieldName}</span>
                            <span className="text-right font-medium">{value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
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
                className="bg-white p-2 rounded shadow hover:bg-gray-100"
                onClick={setCurrentLocation}
              >
                <MapPin size={20} />
              </button>
              <button 
                className="bg-white p-2 rounded shadow hover:bg-gray-100"
                onClick={zoomIn}
              >+</button>
              <button 
                className="bg-white p-2 rounded shadow hover:bg-gray-100"
                onClick={zoomOut}
              >−</button>
            </div>

            {/* Toggle info panel button - only shown when panel is hidden but location is selected */}
            {selectedLocation && !showInfoPanel && (
              <div className="absolute top-4 left-4 z-40">
                <button 
                  onClick={() => setShowInfoPanel(true)}
                  className="bg-white p-2 rounded-full shadow-md hover:bg-gray-100"
                >
                  <Info size={20} />
                </button>
              </div>
            )}

            {/* Attribution - Left bottom */}
            <div className="map-attribution top-4 left-4 text-gray-700">
              <div>
                <span>Civic Compass</span>
                <br />
                <span className="text-gray-500">by ZenCitizen</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BangaloreAddressMap;
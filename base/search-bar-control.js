class SearchBar extends L.Control {
    constructor(options = {}) {
        super(options);
        this.resultsContainer = null;
        this.searchInput = null;
        this.countryCode = null; // Property to store the country code
    }

    onAdd(map) {
        var container = L.DomUtil.create('div', 'search-bar');

        // Inject styles directly into the control
        const style = document.createElement('style');
        style.id='search-bar-styles'
        style.innerHTML = `
        .search-bar {
            display: flex;
            align-items: center;
            padding: 10px;
            background-color: rgba(255, 255, 255, 0.4); /* 40% opacity white */
            border-radius: 5px;
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
        }
        .search-bar input {
            flex-grow: 1;
            min-width: 300px;
            margin-left: 10px;
            padding: 5px;
            border: 1px solid #ccc;
            border-radius: 3px;
        }
        .search-bar .results-container {
            position: absolute;
            top: 40px;
            left: 10px;
            right: 10px;
            background-color: white;
            border: 1px solid #ccc;
            border-radius: 3px;
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
            max-height: 200px;
            overflow-y: auto;
            z-index: 1000;
        }
        .search-bar .result-item {
            padding: 5px;
            cursor: pointer;
            display: flex;
            align-items: center;
        }
        .search-bar .result-item input[type="checkbox"] {
            flex: 1;
            min-width: 5%; /* 5% width for the checkbox */
            margin-right: 10px;
        }
        .search-bar .result-item label {
            flex: 19; /* 95% width for the label */
            margin-right: 10px;
        }
        .search-bar .result-item:hover {
            background-color: #f0f0f0;
        }
        .search-bar button {
            padding: 5px 10px;
            margin-right: 5px;
            background-color: #444; /* Dark gray background */
            color: white;
            border: none;
            border-radius: 3px;
            cursor: pointer;
        }
        .search-bar button:hover {
            background-color: #333; /* Darker shade on hover */
        }
        .search-bar .ok-button {
            margin: 10px;
            display: block;
        }
    `;
    
        document.head.appendChild(style);

        // Prevent clicks on the control from propagating to the map
        L.DomEvent.disableClickPropagation(container);

        
        // Create the search bar
        this.searchInput = L.DomUtil.create('input', '', container);
        this.searchInput.type = 'text';
        this.searchInput.placeholder = 'Search for companies or addresses...';

        this.searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                this.performSearch(this.searchInput.value);
            }
        });

        // Create the results container
        this.resultsContainer = L.DomUtil.create('div', 'results-container', container);

        // Fetch the country code when the map is moved
        map.on('moveend', async () => {
            const mapCenter = map.getCenter();
            this.countryCode = await this.getCountryCode(mapCenter.lat, mapCenter.lng);
        });

        return container;
    }

    async performSearch(query) {
        // Clear previous results
        this.resultsContainer.innerHTML = '';

        if (!query) {
            this.resultsContainer.style.display = 'none';
            return;
        }

        // Perform the search using Nominatim API with the country code constraint
        const results = await this.searchNominatim(query, this.countryCode);

        // Display the results
        results.forEach(result => {
            const resultItem = L.DomUtil.create('div', 'result-item', this.resultsContainer);
            const checkbox = L.DomUtil.create('input', '', resultItem);
            checkbox.type = 'checkbox';
            checkbox.value = JSON.stringify(result); // Store result as JSON string in the value attribute

            const label = L.DomUtil.create('label', '', resultItem);
            label.innerHTML = result.display_name;
            resultItem.appendChild(checkbox);
            resultItem.appendChild(label);
        });

        // Create the "OK" button
        const okButton = L.DomUtil.create('button', 'ok-button', this.resultsContainer);
        okButton.innerHTML = 'OK';
        okButton.addEventListener('click', () => {
            this.handleOkClick();
        });

        // Show results container if there are results
        if (results.length > 0) {
            this.resultsContainer.style.display = 'block';
        } else {
            this.resultsContainer.style.display = 'none';
        }
    }

    async searchNominatim(query, countryCode) {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&countrycodes=${countryCode}&format=json&addressdetails=1`);
        const data = await response.json();
        return data;
    }

    async getCountryCode(lat, lon) {
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1`);
        const data = await response.json();
        return data.address.country_code.toUpperCase();
    }

    handleOkClick() {
        // Get selected results
        const checkboxes = this.resultsContainer.querySelectorAll('input[type="checkbox"]:checked');
        checkboxes.forEach(checkbox => {
            const result = JSON.parse(checkbox.value); // Parse the JSON string to an object
            this.handleResultClick(result);
        });

        // Hide the results container and clear the search input
        this.resultsContainer.style.display = 'none';
        this.searchInput.value = ''; // Clear the search input
    }

    handleResultClick(result) {
        console.log('Selected location:', result);
        // Create a marker on the map
        const latlng = [result.lat, result.lon];
        const marker = L.marker(latlng).addTo(this._map);
        marker.bindPopup(result.display_name).openPopup();

        // Fly to the marker's location
        this._map.flyTo(latlng, 14, {
            duration: 2 // Duration in seconds
        });
    }
}


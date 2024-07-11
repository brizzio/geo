class SearchBar extends L.Control {
    constructor(mapContext, options = {}) {
        super(options);
        this.mapContext = mapContext;
        this.resultsContainer = null;
        this.searchInput = null;
        this.loadingBar = null; // Add a property for the loading bar
        this.countryCode = null; // Property to store the country code
       
        
    }

    onAdd(map) {
        var container = L.DomUtil.create('div', 'search-bar');

        // Inject styles directly into the control
        const style = document.createElement('style');
        style.id = 'search-bar-styles';
        style.innerHTML = `
        .search-bar {
            display: flex;
            flex-direction: column; /* Align items in column */
            width: 90vw;
            padding: 10px;
            background-color: rgba(255, 255, 255, 0.4); /* 40% opacity white */
            border-radius: 5px;
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
        }
        .search-bar input {
            flex-grow: 1;
            
            margin-left: 10px;
            padding: 5px;
            border: 1px solid #ccc;
            border-radius: 3px;
            margin-bottom: 10px; /* Space between input and loading bar */
        }
        .search-bar .loading-bar {
            width: 100%;
            height: 4px;
            background-color: #ccc;
            overflow: hidden;
            position: relative;
            display: none;
        }
        .search-bar .loading-bar::before {
            content: '';
            display: block;
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background-color: #444;
            animation: loading 1.5s infinite;
        }
        @keyframes loading {
            0% { left: -100%; width: 100%; }
            50% { left: 0; width: 100%; }
            100% { left: 100%; width: 10%; }
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
        @media (max-width: 768px) {
            .search-bar {
                width: 300px;
            }
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

        // Create the loading bar
        this.loadingBar = L.DomUtil.create('div', 'loading-bar', container);

        // Create the results container
        this.resultsContainer = L.DomUtil.create('div', 'results-container', container);

        // Prevent mouse wheel scrolling from propagating to the map
        L.DomEvent.on(this.resultsContainer, 'mousewheel', L.DomEvent.stopPropagation);

        // Fetch the country code when the map is moved
        map.on('moveend', async () => {
            const mapCenter = map.getCenter();
            //this.countryCode = await this.getCountryCode(mapCenter.lat, mapCenter.lng);
        });

        
        return container;
    }

    async performSearch(query) {
        // Clear previous results
        this.resultsContainer.innerHTML = '';
        this.loadingBar.style.display = 'block'; // Show the loading bar

        if (!query) {
            this.resultsContainer.style.display = 'none';
            this.loadingBar.style.display = 'none'; // Hide the loading bar
            return;
        }

        // Perform the search using Nominatim API with the country code constraint
        const results = await this.searchNominatim(query, this.countryCode);

        // Hide the loading bar after getting the results
        this.loadingBar.style.display = 'none';

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
        console.log('search query', query);
        const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&countrycodes=${countryCode}&format=json&addressdetails=1`);
        const data = await response.json();
        console.log('search data', data);
        return data;
    }

   /*  async getCountryCode(lat, lon) {
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1`);
        const data = await response.json();
        return data.address.country_code.toUpperCase();
    } */

    handleOkClick() {
        let arr = []
        // Get selected results
        const checkboxes = this.resultsContainer.querySelectorAll('input[type="checkbox"]:checked');
        checkboxes.forEach(checkbox => {
            const result = JSON.parse(checkbox.value); // Parse the JSON string to an object
            this.handleResultClick(result);
        });

        //console.log('results', results)
        // Hide the results container and clear the search input
        this.resultsContainer.style.display = 'none';
        this.searchInput.value = ''; // Clear the search input
    }

    handleResultClick(result) {
        console.log('Selected location:', result);
        let parsed = SearchResultModel.parseFromNominatimSearchObject(result)
        // Create a marker on the map
        new SearchMarker(this.mapContext, parsed);
        new SearchItems().add(parsed)
    }

    
}

const results = [{
    "place_id": 7145121,
    "licence": "Data © OpenStreetMap contributors, ODbL 1.0. http://osm.org/copyright",
    "osm_type": "way",
    "osm_id": 673095700,
    "lat": "-23.4811284",
    "lon": "-47.42060364350246",
    "class": "shop",
    "type": "bakery",
    "place_rank": 30,
    "importance": 0.0000649080643930269,
    "addresstype": "shop",
    "name": "Padaria Real",
    "display_name": "Padaria Real, 2650, Avenida Engenheiro Carlos Reinaldo Mendes, Jardim Bela Vista, Jardim Jockey Club, Sorocaba, Região Imediata de Sorocaba, Região Metropolitana de Sorocaba, Região Geográfica Intermediária de Sorocaba, São Paulo, Região Sudeste, 18013-280, Brasil",
    "address": {
        "shop": "Padaria Real",
        "house_number": "2650",
        "road": "Avenida Engenheiro Carlos Reinaldo Mendes",
        "neighbourhood": "Jardim Bela Vista",
        "suburb": "Jardim Jockey Club",
        "city_district": "Sorocaba",
        "city": "Sorocaba",
        "municipality": "Região Imediata de Sorocaba",
        "county": "Região Metropolitana de Sorocaba",
        "state_district": "Região Geográfica Intermediária de Sorocaba",
        "state": "São Paulo",
        "ISO3166-2-lvl4": "BR-SP",
        "region": "Região Sudeste",
        "postcode": "18013-280",
        "country": "Brasil",
        "country_code": "br"
    },
    "boundingbox": [
        "-23.4813410",
        "-23.4809142",
        "-47.4210980",
        "-47.4201088"
    ]
}]



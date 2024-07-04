

document.addEventListener('DOMContentLoaded', function() {

    const geo = new Geo();
    geo.getCurrentPosition()
    .then((position) => {
        console.log('User position:', position);
        // Use the position as a Leaflet LatLng object
        // Make mapInstance global
        retailMap(position);
        
    })
    .catch((error) => {
        console.error('Error getting position:', error);
    });





});


const retailMap = (latlngs)=>{

    const retailMap = new Map('retailMap', latlngs)

    

    // Function to show the headquarter form
   const showHeadquarterForm = () => {
        console.log('Button clicked');
        const inputs = [
            { field: 'name', label: 'Nome', placeholder: 'Nome Fantasia' },
            { field: 'banner', label: 'Bandeira', placeholder: 'Nome Fachada' },
            { field: 'street', label: 'Logradouro', placeholder: 'Nome da rua / av' },
            { field: 'number', label: 'Numero', placeholder: 'Numero do endereço' },
            { field: 'number-complement', label: 'Complemento', placeholder: 'Ex.: Casa 3' },
            { field: 'city', label: 'Cidade', placeholder: 'nome da cidade' },
            { field: 'state', label: 'UF', placeholder: 'sigla da UF' }
        ];
        
        const onSave = (formData) => {
            console.log('Form Data:', formData);
            
            retailMap.addHeadquarter(formData);
        };

        const onCancel = () => {
            console.log('Form cancelled');
        };
        const form = new DynamicForm(onSave, onCancel);
        form.show(inputs);
        console.log('Form rendered');
    }; 

    function showEditForm() {
        const editForm = new EditForm(
            (name) => {
                this.updateName(name);
            },
            () => {
                console.log('Edit form canceled');
            }
        );

        editForm.show('teste');
    }

    // Define buttons and actions
    const buttons = [
        { text: 'Matriz', onClick: () => showHeadquarterForm() },
        { text: 'Filial', onClick: () => alert('Filial button clicked') },
        { text: 'Concorrente', onClick: () => alert('Concorrente Button clicked') },
    ];

    // Add the custom control to the map
    retailMap.map.addControl(new SearchBar({ position: 'topleft' }));

    // Add the buttons bar control to the map
    retailMap.map.addControl(new ButtonsBar(buttons, { position: 'bottomright' }));

    

    console.log(Models.address)
   

    window.mapInstance = retailMap

}




const o = {
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
}





function generateUniqueId(identifier = 'id') {
    const timestamp = Date.now(); // Current timestamp in milliseconds
    const randomNum = Math.floor(Math.random() * 1000000); // Random number between 0 and 999999
    return `${identifier}-${timestamp}-${randomNum}`; // Concatenate to form the unique ID
}

function deleteKeysFromObject(obj, keys) {
    keys.forEach(key => delete obj[key]);
}

function toPlainObject(instance) {
    if (instance === null || typeof instance !== 'object') {
        return instance;
    }

    if (Array.isArray(instance)) {
        return instance.map(toPlainObject);
    }

    const plainObject = {};

    for (const key in instance) {
        if (instance.hasOwnProperty(key)) {
            plainObject[key] = toPlainObject(instance[key]);
        }
    }

    // Optionally handle prototype properties
    // for (const key of Object.getOwnPropertyNames(Object.getPrototypeOf(instance))) {
    //     if (key !== 'constructor') {
    //         plainObject[key] = toPlainObject(instance[key]);
    //     }
    // }

    return plainObject;
}

/* 
In this example, the additional_info.tags array will be directly assigned to the result without flattening, while the nested objects will be recursively flattened. The function handles objects, arrays, and primitive values appropriately.
If you need to flatten objects within arrays but leave the array structure intact, you can update the function to check for arrays and then handle the objects within those arrays. Here's how you can modify the function to achieve this:
This way, you maintain the array structure but ensure that any objects within arrays are flattened correctly.
*/
function flattenObject(obj, parent = '', res = {}) {
    for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
            const propName = parent ? parent + '.' + key : key;
            if (Array.isArray(obj[key])) {
                res[propName] = obj[key].map((item, index) => {
                    if (typeof item === 'object' && item !== null) {
                        let nestedRes = {};
                        flattenObject(item, `${propName}[${index}]`, nestedRes);
                        return nestedRes;
                    } else {
                        return item;
                    }
                });
            } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                flattenObject(obj[key], propName, res);
            } else {
                res[propName] = obj[key];
            }
        }
    }
    return res;
}


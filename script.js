

document.addEventListener('DOMContentLoaded', async() =>{

    const geo = new Geo();
    
    //let position = await geo.getCurrentPosition()
    
    //console.log('User position:', position);
    // Use the position as a Leaflet LatLng object
    // Make mapInstance global
    let map = retailMap();
    console.log('map', map);
    window.MAP = map
    //window.mk = tester(map)
    //tester(map)



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

    

    //console.log(Models.address)

    // Listen for the layeradd event
    retailMap.map.on('layeradd', (e)=>Map.onlayerAdd(retailMap.map, e));
   
    

   

    return retailMap

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

function tester(map){
    return new SearchMarker(map, results[0]);
}


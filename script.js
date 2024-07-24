

document.addEventListener('DOMContentLoaded', async() =>{

    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    document.documentElement.style.height = '100%';
    document.body.style.height = '100%';
    
    document.getElementById('map').appendChild(logoElement())
    const geo = new Geo();
    
    //let position = await geo.getCurrentPosition()
    
    //console.log('User position:', position);
    // Use the position as a Leaflet LatLng object
    // Make mapInstance global

    let map = retailMap([-23.5676567, -46.6505462]);

    // Create an instance of the ImageEditor class to initialize the form

    //const imageEditor = new ImageEditor();
    

    console.log('map', map);

    

   // const language = new LanguageModel();
    //document.body.appendChild(language.languageDropdown);

    //reverse(-23.5575585,-46.6456233).then(r=>console.log('reverse',r))

   /*  let data = []
    console.log('elements',res.elements)
    let elements = res.elements

    for(let e in elements){
        let element = elements[e]
        //console.log('input', element)
        //let si = new SearchItemModel(element)
        //console.log('output', si)
        //data.push(si)
        //new SearchMarker(map.map,si)
        //searchStore.addItem(si)
    }

    console.log(data) */
        
    window.MAP = map
    //window.mk = tester(map)
    //tester(map)



});


async function reverse(lat, lon) {
    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1`);
    const data = await response.json();
    return data
}


const retailMap = (latlngs)=>{

    const retailMap = new Map('tenant1', latlngs)

    

   

    return retailMap

}


function logoElement() {
    // Create the container div
    const container = document.createElement('div');
    container.style.cssText = `
        position:absolute;
        top:12px;
        left:10px;
        z-index:999;
        display: flex;
        flex-direction: column;
        align-items: center;
        background-color: rgba(255, 255, 255, 0.4); /* 50% opacity white */ 
        border-radius: 5px;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
        padding:5px;
    `;

    // Create the image element
    const img = document.createElement('img');
    img.src = logo64;
    img.style.cssText = `
        width: 120px;
    `;
    container.appendChild(img);

    // Create the text element
    const text = document.createElement('span');
    text.textContent = 'INTELIGÊNCIA DE PREÇOS';
    text.style.cssText = `
        font-size: 10px;
        margin-top: 2px;
        text-align: center;
    `;
    container.appendChild(text);

    // Append the container to the body or another element
    return container;
}
//control bar buttons functions

const clusters = ()=> {
    console.log('call clusters');
    
   new ClusterEditorPage('tenant1')
}


const logo64=`
data:image/png;base64,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
`





function getRandomHexColor() {
    const hex = Math.floor(Math.random() * 16777215).toString(16);
    return `#${hex.padStart(6, '0')}`;
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


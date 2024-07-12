

document.addEventListener('DOMContentLoaded', async() =>{

    const geo = new Geo();
    
    //let position = await geo.getCurrentPosition()
    
    //console.log('User position:', position);
    // Use the position as a Leaflet LatLng object
    // Make mapInstance global

    let map = retailMap([-23.5676567, -46.6505462]);

    // Create an instance of the ImageEditor class to initialize the form

    //const imageEditor = new ImageEditor();
    

    console.log('map', map);

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

    const retailMap = new Map('retailMap', latlngs)

    

   

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


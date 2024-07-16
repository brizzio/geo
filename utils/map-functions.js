function getBoundingBox(latlon, distance) {

    const lat = latlon[0]
    const lon = latlon[1]
    const earthRadius = 6378.1; // Radius of the Earth in kilometers

    const latChange = distance / earthRadius;
    const lonChange = distance / (earthRadius * Math.cos(Math.PI * lat / 180));

    const minLat = lat - latChange * 180 / Math.PI;
    const maxLat = lat + latChange * 180 / Math.PI;
    const minLon = lon - lonChange * 180 / Math.PI;
    const maxLon = lon + lonChange * 180 / Math.PI;

    return [minLat, minLon, maxLat, maxLon];
}


async function transformObjectToArray(obj, langCode = null) {
    const result = [];

    for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
            let translatedLabel = key;
            if (langCode) {
                translatedLabel = await translateLabel(key, langCode);
            }
            result.push({
                field: key,
                label: translatedLabel,
                value: obj[key]
            });
        }
    }

    return result;
}

async function translateLabel(text, targetLanguage) {
    const url = 'https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=' + targetLanguage + '&dt=t&q=' + encodeURI(text);
    try {
        const response = await axios.get(url);
        if (response.data && response.data.length > 0) {
            return response.data[0][0][0];
        } else {
            throw new Error('Translation failed');
        }
    } catch (error) {
        console.error('Error translating label:', error);
        return text; // Return original text if there's an error
    }
}

function mergeNonNullProperties(target, source) {
    const nonNullSource = Object.fromEntries(
        Object.entries(source).filter(([_, value]) => value !== null)
    );
    Object.assign(target, nonNullSource);
}


function transformObjectToArray(obj, labels) {
    const result = [];

   /*  const labelsInPortuguese = {
        "shop": "Loja",
        "house_number": "Número",
        "road": "Rua",
        "neighbourhood": "Bairro",
        "suburb": "Subúrbio",
        "city_district": "Distrito da Cidade",
        "city": "Cidade",
        "municipality": "Município",
        "county": "Condado",
        "state_district": "Distrito do Estado",
        "state": "Estado",
        "ISO3166-2-lvl4": "ISO3166-2 Nível 4",
        "region": "Região",
        "postcode": "Código Postal",
        "country": "País",
        "country_code": "Código do País"
    };
 */
    for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
            result.push({
                field: key,
                label: labels[key] || key,
                value: obj[key]
            });
        }
    }

    return result;
}
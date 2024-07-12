To calculate a bounding box with a 20-meter side dimension around a given center coordinate, you need to convert meters to degrees. The conversion depends on the latitude due to the curvature of the Earth. At the equator, 1 degree of latitude or longitude is approximately 111,320 meters. However, this changes with latitude, particularly for longitude.

Here's a step-by-step method to calculate the bounding box:

Convert meters to degrees for latitude and longitude:

For latitude, the conversion is fairly straightforward:
latitude degrees
=
meters
111320
latitude degrees= 
111320
meters
​
 
For longitude, the conversion depends on the latitude:
longitude degrees
=
meters
111320
⋅
cos
⁡
(
latitude in radians
)
longitude degrees= 
111320⋅cos(latitude in radians)
meters
​
 
Calculate the bounding box coordinates:

Given center coordinates (lat, lon), calculate the north, south, east, and west boundaries using the converted degree values.
Here's how you can implement it in JavaScript:

javascript
Copiar código
function getBoundingBox(centerLat, centerLon, distanceMeters) {
    const earthRadius = 6378137; // Earth's radius in meters

    // Calculate latitude and longitude degrees per meter
    const latDegreesPerMeter = 1 / (earthRadius * Math.PI / 180);
    const lonDegreesPerMeter = 1 / (earthRadius * Math.PI / 180 * Math.cos(centerLat * Math.PI / 180));

    // Calculate half distance in degrees
    const latHalfDistance = (distanceMeters / 2) * latDegreesPerMeter;
    const lonHalfDistance = (distanceMeters / 2) * lonDegreesPerMeter;

    // Calculate bounding box
    const minLat = centerLat - latHalfDistance;
    const maxLat = centerLat + latHalfDistance;
    const minLon = centerLon - lonHalfDistance;
    const maxLon = centerLon + lonHalfDistance;

    return {
        minLat,
        maxLat,
        minLon,
        maxLon
    };
}

// Example usage:
const centerLat = 51.5074; // Replace with your center latitude
const centerLon = -0.1278; // Replace with your center longitude
const distanceMeters = 20;

const boundingBox = getBoundingBox(centerLat, centerLon, distanceMeters);
console.log('Bounding Box:', boundingBox);
Explanation:
Earth's radius: Earth's radius is used to calculate the conversion factor from meters to degrees.
Degrees per meter: Calculations for latitude and longitude degrees per meter account for the Earth's curvature and the specified latitude.
Bounding box calculation: The bounding box is calculated by subtracting and adding the half distance (in degrees) from the center coordinates.
This method provides a rectangular bounding box with a 20-meter side length around the specified center coordinates.

----------------------------------------------------------------------------------------
Step 1: Include Cropper.js
Add the following lines to your HTML to include the Cropper.js library and its CSS:

html
Copiar código
<head>
    ...
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.5.12/cropper.min.css" />
    ...
</head>
<body>
    ...
    <script src="https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.5.12/cropper.min.js"></script>
    ...
</body>




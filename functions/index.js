const functions = require('firebase-functions');
const axios = require('axios');
const apiKey = 'AIzaSyAlGoSBOXpF5C4IfWf5ebI5LE7pXPToa7Y';

async function getGeolocation(placeInput) {
    try {
        // Set up your geocoding service API key and endpoint
        const geocodingEndpoint = 'https://maps.googleapis.com/maps/api/geocode/json';

        // Send the geocoding request to the service
        const response = await axios.get(geocodingEndpoint, {
            params: {
                address: placeInput,
                key: apiKey,
            },
        });

        const geocodingData = response.data.results[0];
        return geocodingData;
    } catch (error) {
        console.error('Error:', error);
        return null;
    }
}

exports.sushi = functions.https.onRequest(async (req, res) => {

  res.set('Access-Control-Allow-Origin', '*');

  if (req.method === 'OPTIONS') {
    // Send response to OPTIONS requests
    res.set('Access-Control-Allow-Methods', 'GET');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    res.set('Access-Control-Max-Age', '3600');
    res.status(204).send('');
  } else {
    
    if (req.method === 'POST') {
        // Handle the POST request here
        const { placeInput } = req.body.data; // Access POST data

        console.log(req.body)

        const place = await getGeolocation(placeInput);
        
        // Hier den Google Places API-Key einfügen

        // Senden der nearbySearch-Anfrage an die Google Places API
        const response = await axios.get('https://maps.googleapis.com/maps/api/place/nearbysearch/json', {
            params: {
                location: place.geometry.location.lat + ',' + place.geometry.location.lng,
                radius: 30000,
                keyword: 'sushi',
                key: apiKey,
                type: 'restaurant'
            },
        });

        const sushiData = response.data.results;
        res.send({
            data: {
                place: place,
                sushiRestaurants: sushiData.filter((data) => data.rating >= 4.2 && data.user_ratings_total >= 10)
            }
        });
    } else {
        res.status(405).send('Method Not Allowed');
    }
  }
});
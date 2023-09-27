const express = require('express');
const axios = require('axios');
const app = express();
const port = 3000;
require('dotenv').config()
const apiKey = process.env.MAP_API_KEY;
var bodyParser = require('body-parser')

app.use( bodyParser.json() );       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
}));

// Middleware für CORS
app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

app.use(express.static(__dirname + "/public"));

// Beispielroute für eine Sushi-Abfrage
app.post('/api/sushi', async (req, res) => {
    const { placeInput } = req.body;

    const place = await getGeolocation(placeInput);

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
    res.json({
        place: place,
        sushiRestaurants: sushiData.filter((data) => data.rating >= 4.2 && data.user_ratings_total >= 10)
    });
});

async function getGeolocation(placeInput) {
    try {
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

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
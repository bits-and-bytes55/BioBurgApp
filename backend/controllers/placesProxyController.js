// controllers/placesProxyController.js

import axios from "axios";

const KEY = process.env.GOOGLE_MAPS_API_KEY;

// GET /api/geo-tracking/places-autocomplete?input=<text>
export const placesAutocomplete = async (req, res) => {
  try {
    const { input } = req.query;
    if (!input) return res.json({ predictions: [] });

    const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json`;
    const { data } = await axios.get(url, {
      params: {
        input,
        key:        KEY,
        types:      "establishment",          
        components: "country:in",              
        language:   "en",
      },
    });

    res.json({ predictions: data.predictions || [] });
  } catch (err) {
    res.status(500).json({ message: err.message, predictions: [] });
  }
};

// GET /api/geo-tracking/place-details?placeId=<id>
export const placeDetails = async (req, res) => {
  try {
    const { placeId } = req.query;
    if (!placeId) return res.json({ lat: null, lng: null });

    const url = `https://maps.googleapis.com/maps/api/place/details/json`;
    const { data } = await axios.get(url, {
      params: {
        place_id: placeId,
        fields:   "geometry,name,formatted_address",
        key:      KEY,
      },
    });

    const loc = data.result?.geometry?.location;
    res.json({
      lat:     loc?.lat || null,
      lng:     loc?.lng || null,
      name:    data.result?.name,
      address: data.result?.formatted_address,
    });
  } catch (err) {
    res.status(500).json({ message: err.message, lat: null, lng: null });
  }
};
const fs = require('fs')
const request = require('request')
const express = require('express')
const querystring = require('querystring')
const polyline = require('@mapbox/polyline');

//Line to encode lat/long in Google :
//console.log(polyline.encode([[50.83711, 4.399754]]))

const api = JSON.parse(fs.readFileSync('api.json'))

const app = express()

function logError(error, response) {
	console.error('error: ', error)
	console.error('statusCode: ', response && response.statusCode)
}

app.get('/test1', (req, res) => {
	const params = {
		propertyTypes: 'HOUSE', //required
		transactionTypes: 'FOR_RENT', //required
		minBedroomCount: 2,
		maxPrice: 1500//,
		//geoSearchPoint: '50.83,4.39',
		//geoSearchRadius: 10
	}

	request({
		url: api.immoweb_url + '/classifieds?' + querystring.stringify(params),
		headers: {
			'x-iw-api-key': api.immoweb_key, //required
			'Accept': 'application/vnd.be.immoweb.classifieds.v2.0+json' //required
		}
	}, function (error, response, body) {
		if (error) logError(error, response)
		console.log(body)
		res.send(body)
	})
})

// GET /duration?origin=XX.XX,XX.XX&dest=XX.XX,XX.XX&mode=XXXX
// modes : driving, walking, bicycling, transit
app.get("/duration", (req, res) => {
	const params = {
		key: api.google_key,
		origin: req.query.origin,
		destination: req.query.dest,
		mode: req.query.mode,
		alternatives: false //we only need one route to get its time
		//departure_time: TODO get timestamp for a random 8:00 in the future
	}

	request({
		url: api.google_url + '/directions/json?' + querystring.stringify(params)
	}, function (error, response, body) {
		if (error) logError(error, response)
		const result = JSON.parse(body)
		const duration = result.routes[0].legs[0].duration.value
		res.send(duration + '')
	})
})

// GET /get-location?input=Brussels
const googlePlacesApi = 'https://maps.googleapis.com/maps/api/place/findplacefromtext/';
app.get("/get-location", (req, res) => {
  if (!req.query.input || req.query.input.length === 0) return res.send("please specify the input");
  request(`${googlePlacesApi}/json?input=${req.query.input}&inputtype=textquery&fields=formatted_address%2Cgeometry&key=${api.google_key}`, (error, response, body) => {
      if (error) {
        console.log("error:", error);
        console.log("statusCode:", response && response.statusCode);
      }
      fullRequest = JSON.parse(body);
      coordinates = [fullRequest.candidates[0].geometry.location.lat, fullRequest.candidates[0].geometry.location.lng];
      const params = {
		propertyTypes: 'HOUSE', //required
		transactionTypes: 'FOR_RENT', //required
		minBedroomCount: 2,
		maxPrice: 1500,
		geoSearchPoint: polyline.encode([coordinates]),
		geoSearchRadius: 10000
	}

	request({
		url: api.immoweb_url + '/classifieds?' + querystring.stringify(params),
		headers: {
			'x-iw-api-key': api.immoweb_key, //required
			'Accept': 'application/vnd.be.immoweb.classifieds.v2.1+json' //required
		}
	}, function (error, response, body) {
		if (error) console.log(error)
		//console.log(response)
		//console.log(body)
		res.send(body)
	})
    }
  );
});

app.listen(3000, function () {
	console.log('Example app listening on port 3000!')
})

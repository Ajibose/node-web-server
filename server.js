const express = require('express');
const weather = require('weather-js');
const app = express();
app.set('trust proxy', true);
const geoip = require('geoip-lite');
const port = process.env.PORT || 3000;


app.use((req, res, next) => {
	let ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
	if (ip == "::ffff:127.0.0.1") {
		ip = '8.8.8.8';
	}
	req.client_ip = ip
	const geo = geoip.lookup(ip);
	req.geoinfo = geo;
	next();
});

app.get('/api/hello', (req, res) => {
	const visitorName = req.query.visitor_name || 'Guest';
	if (req.geoinfo) {
		city = req.geoinfo.city || "Lagos"
		weather.find({ search: city, degreeType: 'C' }, (err, result) => {
			if (err) {
				console.error('Error fetching weather:', err.message);
				res.status(500).send('Error fetching weather');
				return;
			}

			if (result && result[0]) {
				const temperature = result[0].current.temperature;
				const response = {                                                                    
					client_ip: req.client_ip,
					location: req.geoinfo.city,
					greeting: `Hello, ${visitorName}!, the temperature is ${temperature} degrees Celcius in ${city}`,
				}

				res.setHeader('Content-Type', 'application/json');
				res.send(JSON.stringify(response, null, 2));
			} else {
				res.status(404).send('Weather data not found');
			}
		});
	}else {
		res.status(404).json({ message: 'Geolocation information not found' });
	}
});

app.listen(port, () => {
	console.log(`Server is running on port ${port}`);
});


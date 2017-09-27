var jwt =  require('jsonwebtoken')
, fs = require('fs')
, https = require("https")
, querystring= require("querystring")




module.exports = function( ) {
	return new Promise( function( resolve, reject ) {
		getAccessToken( createToken(), resolve, reject ) 
	}) 
}


function createToken() {
	var data = {
		"iss":"billy-364@ideavaluation.iam.gserviceaccount.com",
		"scope":"https://www.googleapis.com/auth/cloud-platform",
		"aud":"https://www.googleapis.com/oauth2/v4/token"
	}
	var cert = fs.readFileSync('./googleApi/private.key');  // get private key
	var token = jwt.sign(data, cert, { algorithm: 'RS256', expiresIn: 3600 });

	return token
}


function getAccessToken( clientToken, resolve, reject ) {
	var postData = querystring.stringify({ grant_type : "urn:ietf:params:oauth:grant-type:jwt-bearer" , assertion : clientToken });
	
	const options = {
		hostname: 'www.googleapis.com',
		port: 443,
		path: '/oauth2/v4/token',
		method: 'POST',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
			'Content-Length': Buffer.byteLength( postData )
		}
	};
	var data = ""
	const req = https.request(options, (res) => {
		res.setEncoding('utf8');
		res.on('data', (chunk) => {
			data += chunk ;
		});
		res.on('end', () => {
			resolve( JSON.parse( data ) ) 
		});
	});

	req.on('error', (e) => {
		reject( e ) 
	});
	// write data to request body
	req.write(postData);
	req.end();
}

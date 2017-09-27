//API ROUTE
var route = require( "./Router" )() 
	, jwt = require('jsonwebtoken')
route.init = function( model ) {
	console.log( "/user online ") ;

	this.post( "/updateInfo")
			.fetch( model.user.updateInfo )			
			.render( renewToken )
			.catch( error )
			
	function renewToken( requete, reponse, card  ) {
		token=jwt.sign( 
				card
	    , model.config.jwt.secret
	  	, { expiresIn: "24h" } ) ;
			//Set the cookie with the token
		reponse.cookie( 'token', token );
		reponse.redirect( "/" )
	}
	return this ;
}

renderToto = function(  requete, reponse, values ) {  
	reponse.json( values ) 
} 

function error(  requete, reponse, err ) {
	console.log( "err : ", err) 
	reponse.json( { success : true, card : err })
}




module.exports = route.init.bind( route ) ; 
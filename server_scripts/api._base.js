/**  ==== API = ===== 

**/
var lexique = require( "./api.lexique" )
	, api = require( "./Router" )() ;

api.init = function( model ) {	
	this.model = model ; 
	console.log( "/api online ") ;
	this.use( this.enrichRequeteForPugMiddleware, model.authentication.check)
	lexique.attach( this ) 
	return this ;
}

module.exports = api.init.bind( api ) ; 


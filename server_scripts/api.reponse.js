//API ROUTE
var route = require( "./Router" )() ;

route.init = function( model ) {
	console.log( "/reponse online ") ;
	this.post( "/add" )
			.fetch(  model.reponse.add )
			.render( noRender )	
	this.get( "/mine" )
			.fetch(  model.reponse.mine )	
			.render( returnReponse )				
	//get api/reponse/event_2/mine
	this.get( "/event_:event_id(\\d+)/mine" )
			.fetch(  model.reponse.mine )
			.render( returnReponse )					
	//get api/reponse/event_2/all
	//get api/reponse/event_2/other
	return this ;
}

noRender = function(  requete, reponse, values ) {  	
	reponse.redirect( requete.body.returnTo )
} 
returnReponse = function(  requete, reponse, values ) {  	
	reponse.json( { success:true , reponses: values })
}

module.exports = route.init.bind( route ) ; 
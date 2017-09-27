//API ROUTE
var route = require( "./Router" )() ;

route.attach = function( root ) {
	var model = root.model 
		
	this.eventCorrespondance = {} ; 
	this.model = model ;
	//Populate the name to id correspondanc
	model.query( model.sql.event.all )
			 .then( data => { for( var i in data ) route.eventCorrespondance[data[ i ].name ] = data[ i ].id })


	//API SPECIFIC TO ALL EVENTS
	root.get( "/all")
			.fetch( model.event.getAll ) 
			.render( returnReponse )

	//API SPECIFIC TO ONE EVENT			
	//Populate the query and the body element
	root.param( "event_id", event_idToBody )
	root.use( "/event_:event_id(\\d+)", this ) ;	
	root.param( "event_name", event_nameToBody )
	root.use( "/event/:event_name(\\w*[^0-9/]\\w*)", this ) ;	
	//If people dont use the event id 
	root.use( "/event", middlewareEvenementId, this )

	this.get( "/detail" )
			.fetch(  model.reponse.add )
			.render( noRender )	
	this.get( "/isParticipating" )
			.fetch( model.event.isParticipating )
			.render( returnParticipationId )
	this.get( "/isProfileComplete")
		.fetch( model.event.isProfileComplete )
		.render( returnProfile )

	this.post( "/participate" )
		.fetch( model.event.participate )
		.render( returnParticipationId )		


	this.get( "/reponse/mine" )	
			.fetch(  model.reponse.mine )	
			.render( returnReponse )		

	this.get( "/reponse/all" )	
			.fetch(  model.reponse.all )	
			.render( returnReponse )	

	this.get( "/reponse/other" )	
			.fetch(  model.reponse.other )	
			.render( returnReponse )	
				
	this.post( "/reponse/add" )
			.fetch(  model.reponse.add )
			.render( noRender )	

	return this ;
}

returnParticipationId = function(  requete, reponse, values ) {
	if( values instanceof Array ) {
		if( values.length > 0 ) values = values[0]
		else return reponse.json( { success:true, participation_id  : -1  } )
	} 
	reponse.json( { success:true, participation  : values } )
} 
returnProfile = function( requete, reponse, values ) {
	reponse.json( { success:true, profileComplete : (values[0].count > 0 )} )	
}
noRender = function(  requete, reponse, values ) {  	
	reponse.redirect( requete.body.returnTo )
} 
returnReponse = function(  requete, reponse, values ) {  	
	reponse.json( { success:true , reponses: values })
}

//THis middleware populate the params correctly 
function middlewareEvenementId( requete, reponse, next ) { 
	var evenement_id = requete.body.evenement_id || requete.query.evenement_id || requete.body.event_id || requete.query.event_id	
	if( !evenement_id ) { 
		reponse.json( { success : false , data : "No evenement_id "})
	}	else {
		//Cause I am stupidly speaking two languages
		requete.body.event_id = evenement_id
		requete.body.evenement_id = evenement_id			

		requete.query.event_id = evenement_id
		requete.query.evenement_id = evenement_id		
		next() ;
	}
}

function event_idToBody( requete, reponse, next, event_id ) {	
	requete.body.evenement_id = event_id
	requete.body.event_id = event_id
	requete.query.evenement_id = event_id
	requete.query.event_id = event_id	
	next() ;
}

function event_nameToBody( requete, reponse, next, event_name ) {	
	console.warn( "api should use the id of the event")
	event_id = route.eventCorrespondance[ event_name ] ;
	if( event_id ) {	
		requete.body.evenement_id = event_id
		requete.body.event_id = event_id
		requete.query.evenement_id = event_id
		requete.query.event_id = event_id	
		next() ;
	} else {
		reponse.json( { success : false , data : "Unknown event_name"})
	}
}
module.exports = route ; 
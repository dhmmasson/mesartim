var route = require( "./Router" )() ;

route.attach = function( root ) {
	model = root.model 
	this.model = model ; 


	this.eventCorrespondance = {} ; 	
	//Populate the name to id correspondanc
	model.query( model.sql.event.all )
			 .then( data => { for( var i in data ) route.eventCorrespondance[data[ i ].name ] = data[ i ].id })


	root.param( "event_id", this.paramToQuery( "evenement_id" ) )
	root.use( "/event_:event_id(\\d+)", this ) ;	
	root.param( "event_name", event_nameToBody )
	root.use( "/event/:event_name(\\w*[^0-9/]\\w*)", this ) ;	

	this.get( "/detail" )
			.fetch(  model.event.getDetailById )
			.render( renderDetail )
			.catch( notFound )

	this.get( "/profile" )
			.fetch(  model.reponse.mine )
			.render( renderProfile )
			.catch( notFound )	


	//API GET/event_2/recommandation
	var profilesTraitement = data=>{ users = {} ; for( var i in data ) { if( !users[ data[i].user_id ] ) users[ data[i].user_id ]=[] ;   users[ data[i].user_id ][ data[i].position ] =  data[i]  }  return users }
	var profileTraitement  = data=>{ result=[] ; for( var i in data ) { result[ data[i].position ] =  data[i]  }  return result }
	var userTraitment = users => { result = {} ; for( var i in users ) result[ users[i].user_id ] = users[i] ; return result  }
	var recommandation = 
	{	categories 	: 
		{ sql : model.sql.question.category.byEvenementId
		, pretraitement : model.getParam( "event_id" ) }
	, eventDetail : 
		{ sql : model.sql.event.detail.byEvenementId
		, pretraitement : model.getParam( "event_id" )						 
		, postTraitement: model.unique }
 	, users 			: 
 		{ sql : model.sql.user.all.byEvenementId
 		, pretraitement : model.getParam( "event_id" ) 
 		, postTraitement : userTraitment}
 	, profile 		: 
 		{ sql : model.sql.reponse.mine.byEvenementId
 		, pretraitement : model.getParam( [ "event_id", "user_id" ] ) 
 		, postTraitement : profileTraitement }
 	, profiles 		: 
 		{ sql : model.sql.reponse.other.byEvenementId
 		, pretraitement : model.getParam( [ "event_id", "user_id" ] )
 		, postTraitement : profilesTraitement }
	}
	this.get( "/recommandation" )
		.fetch(  model.promiseQueryNamed( recommandation ) )
		.render( renderRecommandation )
		.catch( notFound )	



	console.log( "/event online") ;				
	return this ;
}

renderDetail = function( requete, reponse, values ) {  
	//Render an unique page 
	requete.infoPug({ event_id : requete.param( "evenement_id" ) } )
	if( values.length == 0 ) return notFound( requete, reponse,  "event_not_found:The event {{event_id}} was not found" )
	reponse.render( "pages/event/detail" , requete.infoPug({ eventDetail : values[0] }) )
} 

notFound = function( requete, reponse, err ) {
	console.log( "notFound" , err )
	reponse.render( "pages/404" , requete.infoPug({ message : err }) )
}


renderRecommandation = function( requete, reponse, values  ) {	

	requete.infoPug( values ) 
	reponse.render( "pages/recommandation", requete.infoPug() ) 

}

renderProfile = function renderProfile( requete, reponse, values ) {
	requete.infoPug( { event_id : requete.param( "evenement_id" ) } )
	requete.infoPug( { eventDetail : values[0] } )
	requete.infoPug( { reponses : values } )
	reponse.render( "pages/profil", requete.infoPug() ) ;	
}

function event_nameToBody( requete, reponse, next, event_name ) {	
	console.log(  route.eventCorrespondance, event_name )
	event_id = route.eventCorrespondance[ event_name ] ;
	if( event_id !== undefined ) {	
		requete.query.evenement_id = event_id
		next() ;
	} else {
		reponse.json( { success : false , data : "Unknown event_name"})
	}
}

module.exports = route ; 
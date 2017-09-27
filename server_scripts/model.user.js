/**  ==== MODEL = USER =====


**/

var user = new (function userModel() {})()  

module.exports = init ;

function init( model ) {
	user.model = model ; 	
	user.registerOrInfo = registerOrInfo ; 
	user.updateInfo = updateCard ;
	return user ;



	function updateCard( requete ) {

		return new Promise( function( resolve, reject ) {
			model.query( { sql : model.sql.user.updateCard
									 , values : [ requete.body.firstname
									 						, requete.body.name
									 						, requete.body.displayName
									 						, requete.body.organisation
									 						, requete.body.natureOrganisation
									 						, requete.body.position
									 						, requete.body.phone
									 						, requete.body.email
									 						, requete.user.id  ] })
				.then( data => model.query( {sql:model.sql.user.info, values : requete.user.user_id} )
										 			 	.then(  data => { resolve( data[0] ) }  )
											 			.catch( reject ))
				.catch( reject )
		})
	}




	function registerOrInfo( requete ) {		
		return new Promise( function( resolve, reject ) {			
			model.query( { sql : model.sql.user.exist, values : requete.user.id } )
				.then( data => {
					if( data.length > 0 ) {			
													console.log( "User exists id:", data[ 0 ].user_id )									
													model.query( { sql : model.sql.user.info, values : data[ 0 ].user_id } )
															 .then( data => { resolve( data[0] ) } )
															 .catch( reject )							
												} else {
													console.log( "User doesn't exist ")			
													model.query( model.sql.user.create )
														.then( data => {
																console.log( "User created id:", data.insertId )			
																card = createCard( requete, data.insertId )
																model.query( { sql : model.sql.user.addCard, values : card} )															
																					.then( data => resolve( card ) )
																					.catch( reject )
															} 				
														)
														.catch( reject )
												}})
				.catch( reject )
		})
	}
}

function createCard( requete, user_id  ) {
	var profile = requete.user
		, emails 	= ""
		, organisation = null
		, photo = null 
		, position = null 
		, natureOrganisation = null 

	for( var i in profile.emails ) {
		emails += profile.emails[ i ].value + ";"
	}

	try { organisation = profile._json.positions.values[0].company.name } catch( e )  { organisation = null }	
	try { photo = profile.photos[0].value  } catch ( e ) { 
		photo =  profile.picture
	}
	try { position = profile._json.positions.values[0].title } catch( e ) { position =( profile._json ) ? profile._json.headline : null 	}
	try { natureOrganisation = profile._json.positions.values[0].company.industry } catch( e ) { natureOrganisation =( profile._json ) ? profile._json.industry  : null 	}

	var card = 
	{ id     			: profile.id
	, user_id 		: user_id
	, name   			: profile.name.familyName
	, firstname   : profile.name.givenName
	, displayName : profile.displayName 
	, email 			: emails.slice(0,-1)
 	, source 			: profile.provider
 	, photo				: photo
 	, locale 			: profile.locale || requete.query.lang || 'fr'
 	, phone 			: null 
 	, position    : position
 	, organisation: organisation
 	, natureOrganisation: natureOrganisation
 	}

 	requete.user.card = card ; 
 	console.log( card )
 	return card ;
}

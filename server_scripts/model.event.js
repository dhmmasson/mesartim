/**  ==== MODEL = Evenement =====


**/
var event = new (function eventModel() {})()  

module.exports = init ;

function init( model ) {
	event.getDetailById = model.promiseQuery(  model.sql.event.detailById , requete => requete.param('evenement_id') )
	event.getDetailByName = model.promiseQuery(  model.sql.event.detailByName , requete => requete.params.name  )
	event.getAll = model.promiseQuery(  model.sql.event.enriched.all, requete=> requete.user.user_id  )					

	var getParticipationId  = model.promiseQuery( model.sql.event.isParticipating )
		, updateParticipation = model.promiseQuery( model.sql.event.updateParticipation )
		, createParticipation = model.promiseQuery( model.sql.event.createParticipation ) 

	event.isParticipating = model.promiseQuery( model.sql.event.isParticipating, 		 requete => [ requete.param('evenement_id'), requete.user.user_id  ] )
	event.isProfileComplete = model.promiseQuery( model.sql.event.isProfileComplete, requete => [ requete.param('evenement_id'), requete.user.user_id  ] )



	event.participate = function participate( requete ) {
		console.log( "participate" , requete.params, requete.sqlParams )
		var status 	 = (requete.param('participate') == "true" ? 1 : 0 )
			, event_id = requete.param('evenement_id')
			, user_id  = requete.user.user_id 
			, createOrUpdateParticipation = function( participation ) {
					if( participation.length > 0 ) {
						console.log( "Participation Exist")
						//If participation exist, update, but resolve the id
						updateParticipation( [ status, participation[0].id ]  ) ;
						return Promise.resolve( {id : participation[0].id, status:status}   ) 
					}	else {
						console.log( "Create Participation")
						//Create Particiption
						return createParticipation( [ event_id, user_id, status ] )	
					} 		
			}
		function participatePromise ( resolve, reject ) {
			getParticipationId( [event_id, user_id ] )
				.then( participation => createOrUpdateParticipation( participation )
					.then( data => {
						if( data.insertId ) resolve( { id: data.insertId, status : status } ) 
						else 								resolve( data ) } )
					.catch( e=>reject( "createOrUpdateParticipation Fail\n" + e ) ) 

					)
				.catch( function( e ) { console.log( e ) ;  reject( "participatePromise Fail\n" + e )} )	
		}
		return new Promise( participatePromise )
	}

return event ;
}
//API ROUTE
var route = require( "./Router" )() ;

route.attach = function( root ) {
	var model = root.model 			
	this.model = model ;

	//API SPECIFIC TO all carnets
	//GET /carnet/mine => { carnets : [ {id :, name : }] }  	
	root.get( "/contacts")
			.fetch( model.promiseQueryNamed( 
				{ carnets : 
					{ sql : model.sql.carnet.mine 
					, pretraitement : model.getParam( "user_id" )
					}
				, cards : 
					{ sql : model.sql.cards.mine
					, pretraitement : model.getParam( "user_id" )
					, postTraitement : model.sortByField("carnet_id")
					}					
				, reverseCarnet : 
					{ sql : model.sql.cards.aboutMe
					, pretraitement : model.getParam( "user_id" )
					}
				, interactionTypes : 
					{ sql : model.sql.interaction.types		
					, postTraitement : model.sortByField("position")				
					}
				}) )
			.render( renderContacts )
	

	return this 
}



function renderContacts( requete, reponse, data ) {
	reponse.render( "pages/contacts", requete.infoPug( data ) ) ;
}

module.exports = route ; 
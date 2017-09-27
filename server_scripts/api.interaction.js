//API ROUTE
var route = require( "./Router" )() ;

route.attach = function( root ) {
	var model = root.model 			
	this.model = model ;

	
	// 	#INTERACTION
	// GET /interaction/aboutMe
	root.get("/interaction/aboutMe")
			.fetch( model.promiseQueryNamed( 
				{ interactions : 
					{ sql : model.sql.interaction.aboutMe 
					, pretraitement : model.getParam([ "user_id" ]) 
					, postTraitement : model.sortByField("user_id")
					}
				} ) )
			.render( returnReponse )

	// GET	/interaction/mine
	root.get("/interaction/mine")
			.fetch( model.promiseQueryNamed( 
				{ interactions : 
					{ sql : model.sql.interaction.mine 
					, pretraitement : model.getParam([ "user_id" ])
					, postTraitement : model.sortByField("user_id")
					}
				} ) )
			.render( returnReponse )


	// POST /interaction_:name/user_:user_id/add
	root.param( "interaction_name", this.paramToQuery( "interaction_name" ) )
	root.param( "target_user_id", this.paramToQuery( "target_user_id" ) )

	root.use( "/interaction_:interaction_name/user_:target_user_id(\\d+)" , this )

	this.post("/add")
			.fetch( model.promiseQueryNamed( 
				{ interactionId : 
					{ sql : model.sql.interaction.create 
					, pretraitement : model.getParam([ "user_id", "target_user_id", "interaction_name", "value" ])
					, postTraitement : model.insertId 
					}
				} ) )
			.render( returnReponse )

	this.post("/remove")
			.fetch( model.promiseQueryNamed( 
				{ interactionId : 
					{ sql : model.sql.interaction.remove 
					, pretraitement : model.getParam([ "user_id", "target_user_id", "interaction_name" ])
					, postTraitement : model.insertId 
					}
				} ) )
			.render( returnReponse )

	return this 
}
var returnReponse = function(  requete, reponse, data ) {
	data.success = true  	
	reponse.json( data )
}
module.exports = route ; 
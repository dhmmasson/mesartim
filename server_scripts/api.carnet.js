//API ROUTE
var route = require( "./Router" )() ;

route.attach = function( root ) {
	var model = root.model 			
	this.model = model ;

	//API SPECIFIC TO all carnets
	//GET /carnet/mine => { carnets : [ {id :, name : }] }  	
	root.get( "/carnet/mine")
			.fetch( model.promiseQueryNamed( 
				{ carnets : 
					{ sql : model.sql.carnet.mine 
					, pretraitement : model.getParam( "user_id" )
					}
				} ) )
			.render( returnReponse )
	
	//GET /carnet/create => { id : X }
	root.get( "/carnet/create/:name")
		.fetch( model.promiseQueryNamed( 
			{ carnetId : 
				{ sql : model.sql.carnet.create 
				, pretraitement : model.getParam([ "name", "user_id" ])
				, postTraitement : model.insertId 
				}
			} ) )
		.render( returnReponse )

	//API FOR A SPECIFIC CARNET
	root.param( "carnet_id", this.paramToQuery( "carnet_id" ) )
	root.param( "userId", this.paramToQuery( "userId" ) )
	root.use( "/carnet_:carnet_id(\\d+)", this ) ;	


	//GET /carnet_2/cards => { cards : [ {} ] }
	this.get( "/cards" )
			.fetch( model.promiseQueryNamed( 
				{ cards : 
					{ sql : model.sql.card.fromCarnet 
					, pretraitement : model.getParam( "carnet_id" )
					}
				} ) )
			.render( returnReponse )

	//GET /carnet_2/add/:cardId  => { success}
	this.get( "/add/:userId" )
			.fetch( model.promiseQueryNamed( 
				{ cards : 
					{ sql : model.sql.carnet.add
					, pretraitement : model.getParam([ "carnet_id", "userId" ])
					}
				} ) )
			.render( returnReponse )

	//GET /carnet_2/remove/:cardId  => { success}
	this.get( "/remove/:userId" )
			.fetch( model.promiseQueryNamed( 
				{ cards : 
					{ sql : model.sql.carnet.remove
					, pretraitement : model.getParam([ "carnet_id", "userId" ])
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
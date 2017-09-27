//API ROUTE
var route = require( "./Router" )() ;

route.attach = function( root ) {
	var model = root.model 			
	this.model = model ;
	console.log ( "apiV2/lexique")

	//API SPECIFIC TO all 
	root.get( "/lexique/list")
			.fetch( model.promiseQueryNamed( 
				{ lexiques : 
					{ sql : model.sql.lexique.list
					, pretraitement : model.getParam( ["seance_id"] )
					}
				} ) )
			.render( returnReponse )

	//POST /lexique/create/:name => { lexiqueId : 2 }
	root.post( "/lexique/create")
		.fetch( model.promiseQueryNamed( 
			{ lexiqueId : 
				{ sql : model.sql.lexique.create 
				, pretraitement : model.getParam([ "name", "description", "seance_id" ])
				, postTraitement : model.insertId 
				}
			} ) )
		.render( returnReponse )

	//API FOR A SPECIFIC CARNET

	//GET /tokens => { cards : [ {} ] }
	root.get( "/lexique/:name/all" )
			.fetch( model.promiseQueryNamed( 
				{ tokens : 
					{ sql : model.sql.lexique.all
						, pretraitement : model.getParam( [ "name", "seance_id" ] )
					}
				} ) )
			.render( returnReponse )

	//GET /lexique/:name/add  => {success}
	root.post( "/lexique/:id(\\d+)/add" )
			.fetch( model.promiseQueryNamed( 
				{ tokenId : 
					{ sql : model.sql.lexique.add
						, pretraitement : createToken
						, postTraitement : model.insertId
					}
				} ) )
			.render( returnReponse )

	return this 
}
var returnReponse = function(  requete, reponse, data ) {
	console.log( 'reponse' ) ;
	data.success = true 
	reponse.json( data )
}
function createToken( requete, reponse )  {
	return [{ lexique_id : requete.params.id
		, lemme : requete.body.lemme || requete.body.text  || ""
		, text : requete.body.text   || requete.body.lemme || ""
		, partOfSpeech : requete.body.partOfSpeech         || "UNKNOWN"
	}]
}
module.exports = route ; 

/**  ==== API = ===== 

**/
var event = require( "./page.event" )
	,	carnet = require( "./page.carnet" )	
	, Router = require( "./Router" )
	, api = Router() ;

api.init = function( model ) {	
	console.log( "/api online ") ;	
	this.model = model 

	this.get("/login", Router.addInfo({auth0 : model.config.Auth0.public}))
			.render( renderLogin )


	this.use(   model.authentication.check )


	this.get("/", Router.addInfo({auth0 : model.config.Auth0.public}))
		.fetch(  model.event.getAll )
		.render( renderHome )

	event.attach( this )
	carnet.attach( this )


	this.get( "/dialogies/:id")
		.fetch( model.question.getAllBySeance )
		.render( renderDialogies )

			this.get( "/test" )
			
			.render( (req, rep) => rep.render( "pages/infoUser" ) ) 

	this.get("/profil" )
		.render( renderProfile )

	return this ;
}
module.exports = api.init.bind( api ) ; 
function renderLogin( requete, reponse ) {  
	reponse.render( "pages/login.pug" , requete.infoPug() ) 
}

function renderHome( requete, reponse, values ) {  
	reponse.render( "pages/index.pug" , requete.infoPug({ evenements : values })) 
}
function renderProfile( requete, reponse ) {
	reponse.render( "pages/cardEditor.pug", requete.infoPug() )

}

function renderDialogies( requete, reponse, values ) { 
	console.log( requete.decoded )	
	reponse.render( "pages/dialoJ.pug" 
		,	requete.infoPug( 
			{ dialogies :  values[0]
			, categories : values[1] 
			, eventDetail : values[2][0]
			, participation_id : requete.params.id 
			}
		))
}



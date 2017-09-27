var express = require( "express" ) ; 
(()=>{
	module.exports = routerFactory ;

	function Handler(){}
	//Default JSON handlers
	Handler.prototype.fetchHandler = ( requete ) => new Promise( ( resolve, reject ) => resolve() ) ;
	Handler.prototype.render  = ( requete, reponse, data ) => reponse.json( { success : true, data : data } ) ;
	Handler.prototype.failHandler    = ( requete, reponse, data ) => reponse.json( { success : false, data : data } ) ;
	Handler.prototype.handle  = function( requete, reponse, handler ) {
		handler( requete )
			.then( data => {console.log( "coucou" ) ; this.renderHandler( requete, reponse, data ) } )  
			.catch( error => this.failHandler( requete, reponse, error ) )
	}

	Handler.prototype.testAndFetch = function( requete, reponse ) {
		if( this.testHandler ) 
			this.testHandler( requete )
					.then( data => this.handle( requete, reponse, this.validator( data ) ? this.fetchHandler : this.elseHandler ) )
					.catch( error => failHandler( requete, reponse, error ) ) ;
		else
			this.handle( requete, reponse, this.fetchHandler ) ;
	}  

	//Change handler 	
	Handler.prototype.test =  function( handler, validator ) { this.testHandler = handler.bind(this) ; this.validator = validator || ((data)=>data.length>0) ; return this ; } ;
	
	Handler.prototype.fetch =  function( handler ) { this.fetchHandler = handler.bind(this) ; return this ; } ;
	Handler.prototype.then =  function( handler ) { this.fetchHandler = handler.bind(this) ; return this ; } ;
	Handler.prototype.else =  function( handler ) { this.elseHandler = handler.bind(this) ; return this ; } ;

	Handler.prototype.render = function( handler ) { this.renderHandler = handler.bind(this) ; return this ; } ;
	Handler.prototype.catch =  function( handler ) { this.failHandler = handler.bind(this) ; return this ; } ;




	function routerFactory () {
		var router = express.Router({mergeParams: true})  			//Normal express handler			
			, _router = Object.getPrototypeOf( router ) //Enable surcharging get, put etc

		//Create a default handler for the router
		router.defaultHandler = new Handler()


		router.get = function get( url, middlewares ) {
			console.log( "Register", url )
			//Specific handler
			handler = Object.create( router.defaultHandler ) ;			
			if( middlewares )
				_router.get.call( router, url, middlewares, handler.testAndFetch.bind( handler ) )
			else 
				_router.get.call( router, url, handler.testAndFetch.bind( handler ) )
			return handler ; 
		}

		router.post = function post( url, middlewares ) {
			console.log( "Register", url )
			//Specific handler
			handler = Object.create( router.defaultHandler ) ;			
			if( middlewares )
				_router.post.call( router, url, middlewares, handler.testAndFetch.bind( handler ) )
			else 
				_router.post.call( router, url, handler.testAndFetch.bind( handler ) )
			return handler ; 
		}

		router.addInfo=addInfo
		router.paramToQuery = __paramToQuery
		router.enrichRequeteForPugMiddleware = enrichRequeteForPugMiddleware
		return router ;
	}

	


	function __paramToQuery( paramName ) {
		return function paramToQuery( requete, reponse, next, paramValue ) {	
			console.log( "paramToQuery ["+paramName+"]", paramValue  ) 
			requete.body[paramName] = paramValue
			requete.query[paramName] = paramValue
			next() ;
		}
	}
	//SHALLOW Copy, should be a deep copy
	function infoPug( info ) {
		if( this.__pug_info == undefined ) 
			this.__pug_info = {} ;
		for (var i in info ) {
			this.__pug_info[ i ] = info[ i ]
		}
		return { data : this.__pug_info }
	}
	function addInfo( info ) {
		return ( requete, reponse, next ) => { 
			if( !requete.infoPug ) requete.infoPug = infoPug ;
			requete.infoPug( info ) ; 
			next () } 
	}
	function param( paramName, defaultValue ) {
		if( this.params[ paramName ] !== undefined ) return this.params[ paramName ] ;
		if( this.query[ paramName ] !== undefined ) return this.query[ paramName ] ;
		if( this.body[ paramName ] !== undefined ) return this.body[ paramName ] ;
		return defaultValue ;
	}

	function enrichRequeteForPugMiddleware( requete, reponse, next ) {
		requete.infoPug = infoPug ;
		requete.param = param ;
		next()
	}
	
	routerFactory.enrichRequeteForPugMiddleware = enrichRequeteForPugMiddleware 
	routerFactory.addInfo = addInfo 

	return routerFactory ;


})()

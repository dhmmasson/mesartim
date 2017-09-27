// var 
// 	, databasePool = mysql.createPool( config.database )  

var model = { query : p_queries  } 
	, mysql = require("mysql")  
	, bd = {}
	, sqlLoader = require( "./sqlLoader" ) ;

module.exports = init  ;

//Promise to construct the model 
function init( config ) {	
	return new Promise( ( resolve, reject ) =>
		sqlLoader( "sql" )
		.then( function( data ) {
			//store the config in the model, useful to config stuff down the line
			model.config = config ;
			//Connect to the database
			bd = mysql.createPool( config.sql )  
			//store the sql request 
			model.sql = data.sql ;			
			//Load the sub models
			//Everything as been loaded return the model  			
			resolve( model )
		} )
		.catch( reject ) 
	) ;
}


//Return a promise connection
function p_getConnection() {
	return new Promise( function( resolve, reject ) {
		bd.getConnection( ( err, connection ) => 
		{				
			if( err ) {
				//connection.release()    
				reject( "p_getConnection::Can't get a connection " + err ) ;
			} else {
				resolve( connection ) ;				
			}
		})
	})
}

//Promise to return the result of ONE sql query
function p_query( sqlStuff ) {
	return new Promise( function( resolve, reject ) {
		//Get a connection then do the query, release the connection before resolving.
		p_getConnection()
			.then( connection => {				
				console.log( mysql.format( sqlStuff.sql,  sqlStuff.values  ))
				connection.query( sqlStuff, 
					( err, data ) => {						
						if( err ) { 
							connection.release() ;
							reject( "p_query::" + err + "\n" + sqlStuff ) ;
						} else {
							connection.release() 
							resolve( data ) ;
						}
					})

			})
			.catch( error => reject( error ))
	})
}

//Promise to return the result of ONE or MULTIPLE sql queries
function p_queries( sql ) {
	//the promise to return
	var promise = [] ; 
	//If given multiple sql queries create an array of promise for each one
	if( sql instanceof Array ) {
		var promises = []		
		for( var i in sql ) {
			promises.push( p_query( sql[ i ] ) )
		}
		//Create a promise that is fullfilled only when all the sql queries promise are
		promise = Promise.all( promises ) ;
	} else {
		//Treat the lonely promise
		promise = p_query( sql ) ; 
	}
	return promise ; 
}


//Promise to return the result of multiple sql queries where they are named 
function p_queries_named( sqlNamedArray ) {
	return new Promise( function( resolve, reject ){ 
	//the promise to return
	var promises = []
		, names = [] ; 	
	for( var name in sqlNamedArray ) {
		var query = sqlNamedArray[ name ]
		//Check that the query is well formed
		if( query.hasOwnProperty( "sql" ) &&  query.hasOwnProperty( "values" ) ) {
			promises.push( p_query( query ) )
			names.push( name )	
		}		
	}		
	Promise.all( promises )
				 .then( dataArray => {				 		
				 		var result = {}
				 	  for( var i in dataArray ) {
				 	  	if( sqlNamedArray[ names[ i ] ].postTraitement ) dataArray[ i ] = sqlNamedArray[ names[ i ] ].postTraitement(dataArray[ i ]) ;
				 	  	result[ names[ i ] ] = dataArray[ i ] 
				 	  } 
				 	  resolve( result ) 
				 	})
				 .catch( e => reject( ":p_queries_named\n" + e ) )
	})	
}



//Pre traitement
model.getParam = function( paramNames ) { 
	return function( requete ) {
		var result = []
		if( paramNames instanceof Array ) for( var i in paramNames ) { result.push( requete.param( paramNames[ i ] )   )}
		else result = requete.param( paramNames ) ;
		return result ;	
	}
}

//POST TRAITEMENT
model.unique = data=>data[0]
model.insertId = data=>data.insertId
model.sortByField= function( field ) {
	return function( rows ) { 
		var result = {} 
		for( var i in rows ) { 
			var value = rows[ i ][ field ]
			if( !result[ value ] ) result[ value ] = [] 
			result[ value ].push( rows[i] )
		}
		return result ; 
	}
}

function aggregateQueryAndValue( query, value ) {
	result = query
	if( typeof query == "string" )
		result = { sql: query, values : value }
	else if( query.sql != undefined )
		query.values = value
	return result ;
}



model.promiseQueryNamed = function( sqlNamedArray ) {	
	return function( requete ) {
		for( var name in sqlNamedArray ) {
			sqlNamedArray[ name ].values = ( typeof sqlNamedArray[ name ].pretraitement == "function" ) ? sqlNamedArray[ name ].pretraitement( requete ) : requete
		}
		return p_queries_named( sqlNamedArray )
	}
}

model.promiseQuery = function( sql, requeteToValues ) {	
	return function( requete ) {
		var values = ( typeof requeteToValues == "function" ) ? requeteToValues( requete ) : requete ;	
		if( sql instanceof Array  ) {
			if( ! values instanceof Array || values.length != sql.length ) return Promise.reject( "Values is not an Array")
			for( var i in sql ) {
				sql[i] = aggregateQueryAndValue( sql[i], values[i])										
			}
		} else {
			sql = aggregateQueryAndValue( sql, values )
		}
		return model.query( sql )				
	}
}

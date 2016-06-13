var config = require('./configHeroku')
  , express = require('express')
  , app = express()
  , http = require('http').Server(app)
  , io = require('socket.io')(http)
  , cookieParser = require('cookie-parser')
  , bodyParser = require('body-parser')
  , multer = require('multer') // v1.0.5
  , upload = multer()					// for parsing multipart/form-data
  , jwt = require('jsonwebtoken')
  , mysql = require("mysql") 
  , mesartimBd = mysql.createPool( config.database )
  , morgan = require('morgan') //debug tool   
  , fs = require('fs')


//================================================================
//configurations 
//================================================================


app.use( morgan( 'dev' ) );
app.use( cookieParser() )
app.use( bodyParser.json() ); // for parsing application/json
app.use( bodyParser.urlencoded({ extended: true }) ); // for parsing application/x-www-form-urlencoded
app.use( express.static( '.' ) );

app.set('secret', config.secret); //set the secret there, why not use config.secret I wouldn't know... 
app.set('view engine', 'pug');

http.listen( config.port, successListen );
//	mesartimBd.connect( callBackMySqlConnexion );

//================================================================
//ROUTES
//================================================================
var apiRoutes = express.Router(); 

apiRoutes.use( checkAuthentication ) ; 


apiRoutes.get( '/seance/:id/participants', getParticipantsBySeance ) ; 
apiRoutes.get( '/seance/:id/messages', getMessagesBySeance ) ;
apiRoutes.get( '/seance/names', getSeanceNames ) ;

apiRoutes.post( '/message/new', upload.array(), addMessage ) ;
apiRoutes.post( '/message/:id/annotate',  upload.array(), annotateMessage );
apiRoutes.get(  '/message/id/:id', getMessageById );

apiRoutes.get( '/annotations/all', getAnnotations ) ;
apiRoutes.get( '/annotations/mine', getAnnotationsFromUser ) ;

apiRoutes.get( '/message/mine', getAllMessageFromUser );
apiRoutes.get( '/message/all', proxyGetAllMessageFromSeance );

apiRoutes.get( '/tokenValid', tokenValid ) ;

app.get( '/seance', requestListSeances );
app.post('/register', upload.array(), register ) ;

app.use('/api', apiRoutes);
app.use( '/vote', checkAuthentication, getVotePage )
app.use( '/generation', checkAuthentication, getSubmissionPage )
app.use( '/login', getLogin )
app.use( '/rank', checkAuthentication, getRankPage )

app.use( '/', getLogin )

var compteur = 0
mesartimBd.on('connection', function (connection) {
  console.log( "connection to database", ++compteur ) ; 
});
//SQL


function wrapProcess( callBackSuccess, callBackError, ...args ) {
	return ( err, data ) => { 
		if( err ) 
			callBackError.apply(this, (args.unshift( err ), args ) ) ; 
		else 
			callBackSuccess.apply( this, (args.push( data ), args )  ) ;
	} 
}



function mesartimBd_pooled_query() {
	//some arguments...
	var _arguments = [].splice.call(arguments,0)
	//first argument is the request object
 	  , requete = _arguments.shift() ;
	mesartimBd.getConnection( (err, connection ) => {
		if( err ) return console.error("can't get a connection", compteur) ;
		requete.sqlConnection = connection ; 
		return connection.query.apply( connection, _arguments) ;
	} )
}




var sqlAddMessage = 'INSERT INTO message ( participation_id, text, `row_id`, `column_id` ) VALUES ( ?, ?, ?, ? )'
  , sqlGetMessageId = 'SELECT message.id' 
							+ ' ' + 'FROM message'
							+ ' ' + 'JOIN participation ON participation_id = participation.id'
							+ ' ' + 'WHERE ?' 
							
	, sqlGetCriteria 	= "SELECT criteria_id as id, description, type"
						  + ' ' + 'FROM seance_has_criteria'
						  + ' ' + 'JOIN criteria ON criteria_id = criteria.id'
						  + ' ' + 'WHERE ?'
	, sqlColumName = 'SELECT position, id, title FROM `columnname` WHERE ? ORDER BY position ASC'
	, sqlRowName  = 'SELECT position, id, title FROM `rowname` WHERE ? ORDER BY position ASC'
	, sqlAllMessage 
					= 'SELECT `message`.`id`, `text`, `rowname`.`position` as row_position, `columnname`.`position` as column_position, `datemodification`\n' 
		+ ' ' + 'FROM `message`\n'
		+ ' ' + 'JOIN `participation` ON participation_id = participation.id\n'
		+ ' ' + 'JOIN `columnname` ON column_id = columnname.id\n'
		+ ' ' + 'JOIN `rowname` ON row_id = rowname.id\n'
	, sqlAllMessageSinceFromSeance = sqlAllMessage  
		+ ' ' + 'WHERE `message`.`id` > ? AND `participation`.`seance_id` = ?'
		+ ' ' + 'ORDER BY `message`.`id` DESC'
	, sqlAllMessageSinceFromUser = sqlAllMessage 
		+ ' ' + 'WHERE `message`.`id` > ? AND `participation_id` = ?'
	, sqlGetVoteByUser = 'SELECT message_id, criteria_id, value\n'
	 	+ ' ' + 'FROM `annotation` a1\n'
	 	+ ' ' + 'WHERE user_id = ? '
	 	+ ' ' + '  AND datecreation = ( SELECT max( datecreation )'
	 															+ ' FROM annotation '
	 															+ ' WHERE message_id = a1.message_id '
	 															+ '   AND user_id = a1.user_id '
	 															+ ') \n'	


function getLogin( requete, reponse) {
	reponse.render( "login.pug") ;
}


function proxyGetAllMessageFromSeance( requete, reponse ){
	getAllMessageFromSeance( requete, reponse, processGetAllMessageFromSeance)
}

function getSubmissionPage( requete, reponse ) {
	getGridHeaders( requete, reponse, processGetSubmissionPage )	
}
function processGetSubmissionPage( requete, reponse, columnNames, rowNames ) {
	reponse.render(   "phase1.pug", 
		{ token : requete.token
		, columnNames : requete.columnNames
		, rowNames : requete.rowNames
		, dimensionNames : requete.dimensionNames
		, baseName : "grille" 		
	}); 

}




//================================================================
//Get Rank page
//================================================================
function getRankPage( requete, reponse ) {
	getAllInfoSeance( requete, reponse, processGetRankPage )
}
function processGetRankPage( requete, reponse, data ){
	if( requete.sqlConnection ) requete.sqlConnection.release()
	data.baseName = "grille"
	reponse.render( "phase3", data ) ;
}

function getAnnotationsFromUser( requete, reponse ) {
	mesartimBd_pooled_query(requete, sqlGetVoteByUser, requete.decoded.user.id, wrapProcess( processGetAnnotationsFromUser, printAndSkip, requete, reponse ))
}
function processGetAnnotationsFromUser( requete, reponse, data ) {
	if( requete.sqlConnection ) requete.sqlConnection.release()
	reponse.json( {
		success:true
	, result : data 
	})
}
//================================================================
//Get Vote Page
//================================================================


function getVotePage( requete, reponse ) {
	getAllInfoSeance( requete, reponse, renderVotePage2 )
}
function renderVotePage2( requete, reponse, data ) {
	if( requete.sqlConnection ) requete.sqlConnection.release()	
	data.baseName = "grille"
	reponse.render( "phase2", data ) ;
}

//================================================================
//SEANCE
//================================================================


function getSeanceNames( requete, reponse ) {
	getGridHeaders( requete, reponse, processSeanceNames )
}
function processSeanceNames( requete, reponse, dimensionNames, columnNames, rowNames  ) {
	if( requete.sqlConnection ) requete.sqlConnection.release()
	reponse.json( 
	  { success:true
	  , dimensionNames : dimensionNames 
		, columnNames : columnNames
		, rowNames : rowNames 
		})
}



//GET GRIDS HEADER 
function getGridHeaders( requete, reponse, callback ) {
	getColumnNames( callback, requete.decoded.participation.seance_id, requete, reponse )
}
function getColumnNames( callback, seanceId, requete, reponse ) {
	var values = { seance_id : seanceId }
	mesartimBd_pooled_query(requete, sqlColumName, values, wrapProcess( getRowNames, printAndSkip, callback, seanceId, requete, reponse ) )
}
function getRowNames( callback, seanceId, requete, reponse, result ) {
	var values = { seance_id : seanceId }
		  
	mesartimBd_pooled_query(requete, sqlRowName, values, wrapProcess( cleanRowAndColumn, printAndSkip, callback, requete, reponse, result ) )
}
function cleanRowAndColumn( callback, requete, reponse, _columnNames, _rowNames) {
	var columnNames = []
	, rowNames = []
	, dimensionNames = {}
	for( var i = 0 ; i < _columnNames.length ; i++ ) {
		if( _columnNames[i].position >= 0 ){
			columnNames.push( _columnNames[i] ) 
		} else {
			dimensionNames.column = _columnNames[i].title
		}
	}
	for( var i = 0 ; i < _rowNames.length ; i++ )  {
		if( _rowNames[i].position >= 0 ) {
			rowNames.push( _rowNames[i] )
		} else  {
			dimensionNames.row = _rowNames[i].title
		}
	}
	

	requete.columnNames = columnNames
	requete.rowNames = rowNames
	requete.dimensionNames = dimensionNames
	callback( requete, reponse, dimensionNames, columnNames, rowNames ) ; 
}


//get all messages for a particular participation
function getAllMessageFromSeance( requete, reponse, callback ) {
	
	if( callback === undefined ) callback = processGetAllMessageFromSeance
	var participation = requete.decoded.participation 
	  , since = requete.query.since || 0 
		, values = [ since, participation.seance_id ] 
	query = mesartimBd_pooled_query(requete, sqlAllMessageSinceFromSeance, values, wrapProcess( callback, printAndSkip, requete, reponse) ) ; 		
	
}
function processGetAllMessageFromSeance( requete, reponse, rows ) {
	if( requete.sqlConnection ) requete.sqlConnection.release()
	reponse.json( 
		{ success : true 
		, result : rows }
		) ; 
}

//================================================================
//MESSAGES
//================================================================


//new message
function addMessage( requete, reponse ) {
	var participation = requete.decoded.participation 
	  , user = requete.decoded.user  
	  ,	message = requete.body.content
	  , coords = requete.body.grille.split("_") 
	  , values = [ participation.id, message, coords[0], coords[1] ]
	mesartimBd_pooled_query(requete, sqlAddMessage, values, wrapProcess( processAddMessage, printAndSkip, requete, reponse ) ) ; 
}
function processAddMessage( requete, reponse, result ) {
	if( requete.sqlConnection ) requete.sqlConnection.release()
	reponse.json( { success: true  
								, result : result.insertId } )	
}

//get all messages Id for a seances
function getMessagesBySeance( requete, reponse ) {
	var values = {seance_id : requete.params.id || requete.decoded.participation.seance_id}	
  mesartimBd_pooled_query(requete, 	sqlGetMessageId, values , wrapProcess( processGetMessagesBySeance, printAndSkip, requete, reponse )
	);	
}
function processGetMessagesBySeance( requete, reponse, rows ) {
	if( requete.sqlConnection ) requete.sqlConnection.release()
	reponse.json( rows )	
}

//get message by Id
function getMessageById( requete, reponse ) {
	var values = {id : requete.params.id}	
	mesartimBd_pooled_query(requete, { sql : 'SELECT * FROM message WHERE ?'
			   , values :  values
			   } 
			   , wrapProcess( processGetMessageById, printAndSkip, requete, reponse )
	);	
}
function processGetMessageById( requete, reponse, rows ) {
		if( requete.sqlConnection ) requete.sqlConnection.release()
	reponse.json( { success: true  
							  , result : rows } )	
}

//get all messages for a particular participation
function getAllMessageFromUser( requete, reponse ) {
	var participation = requete.decoded.participation 
	  , since = requete.query.since || 0 
		, values = [ since, participation.id ] 
	query = mesartimBd_pooled_query(requete, sqlAllMessageSinceFromUser, values, wrapProcess( processGetAllMessageFromUser, printAndSkip, requete, reponse) ) ; 	

}
function processGetAllMessageFromUser( requete, reponse, rows ) {
		if( requete.sqlConnection ) requete.sqlConnection.release()
	reponse.json( 
		{ success : true 
		, result : rows }
		) ; 
}

function annotateMessage( requete, reponse ) {
	//should get the token
	console.log( requete.body )
	var criteria = requete.body.criteria 
	  , user = requete.decoded.user	  
	  , sql = 'INSERT INTO annotation( user_id, message_id, criteria_id, value )' 
	  + ' ' + 'VALUES ? '
	  , values = 	[]


	  for( var i = 0 ; i < criteria.length ; i++ ) {
	  	values.push( [ user.id, criteria[i].message_id, criteria[i].criteria_id, criteria[i].value ] )
	  }
	  
	  mesartimBd_pooled_query(requete, { sql : sql, values :  [values] }, wrapProcess( processAnnotateMessage, printAndSkip, requete, reponse ) ) ; 
	  
}
function processAnnotateMessage( requete, reponse, result ) {
	if( requete.sqlConnection ) requete.sqlConnection.release()
		reponse.json( {
			success: true
		, result : result } ) ;
}

function getAnnotationSeance( callback, requete, reponse ) {
	var participation = requete.decoded.participation 
	  , sql = "SELECT criteria_id, description, type"
	  + ' ' + 'FROM seance_has_criteria'
	  + ' ' + 'JOIN criteria ON criteria_id = criteria.id'
	  + ' ' + 'WHERE ?'
	  , value = { seance_id : participation.seance_id }

	mesartimBd_pooled_query(requete, sql, value, wrapProcess( callback, printAndSkip, requete, reponse ))
}
function processGetAnnotationSeance( requete, reponse, rows ) {
	if( requete.sqlConnection ) requete.sqlConnection.release()
	reponse.json( {
		success: true
	, result : rows } )
}

function getAnnotations( requete, reponse ) {
	var user = requete.decoded.user
	  , values = [ user.id ]
	mesartimBd_pooled_query(requete, sqlGetVoteByUser, values, wrapProcess( processGetAnnotation, printAndSkip, requete, reponse ))
}

function processGetAnnotation( requete, reponse, data ) {
	if( requete.sqlConnection ) requete.sqlConnection.release()
		reponse.json( {
		success: true
	, result : data } )
}

//================================================================
//PARTICIPANTS
//================================================================
//get all participants for a seance
function getParticipantsBySeance( requete, reponse ) {
	var values = {seance_id : requete.params.id || requete.decoded.participation.seance_id}	
	mesartimBd_pooled_query(requete, 	{ sql : 'SELECT user.*' 
				+ ' ' + 'FROM user'
				+ ' ' + 'JOIN participation ON participation_id 	= participation.id'
				//+ ' ' + 'JOIN seance        ON seance_id 		= seance.id'  
				+ ' ' + 'WHERE ?'
			   , values :  values
			   } 
			   , wrapProcess( processGetParticipantsBySeance, printAndSkip, requete, reponse )
	);	
}
function processGetParticipantsBySeance( requete, reponse, reponse ) {
	if( requete.sqlConnection ) requete.sqlConnection.release()
	reponse.json( rows )	
}



function getAllInfoSeance( requete, reponse, callback  ) {
	var participation = requete.decoded.participation 
		, seanceId = participation.seance_id
		, sql = sqlColumName + ";\n"
					+ sqlRowName   + ";\n"
					+ sqlAllMessageSinceFromSeance +";\n"
					+ sqlGetCriteria 
		, values = [{seance_id : seanceId }, {seance_id : seanceId }, 0, seanceId , {seance_id : seanceId }]

	
	query = mesartimBd_pooled_query(requete, sql, values, wrapProcess( processGetAllInfoSeance, printAndSkip, requete, reponse,callback  ))
	
}
function processGetAllInfoSeance( requete, reponse, callback, data ) {
	//CLEAN ROW AND COLUMNS DATA
	var result = 
	{ columnNames : []
	, rowNames : []
	, dimensionNames : {}
	, ideas : data[2]
	, criteria : data[3]
	}
	for( var i = 0 ; i < data[0].length ; i++ ) {
		if(  data[0][i].position >= 0 ){
			result.columnNames.push( data[0][i] ) 
		} else {
			result.dimensionNames.column = data[0][i].title
		}
	}
	for( var i = 0 ; i < data[1].length ; i++ )  {
		if(  data[1][i].position >= 0 ) {
			result.rowNames.push( data[1][i] )
		} else  {
			result.dimensionNames.row = data[1][i].title
		}
	}
	callback( requete, reponse, result )
}





//register 
function register( requete, reponse ) {
	//Test if user exist 
	requete.user = {
		  nom : requete.body.nom || "_Onyme"
		, prenom : requete.body.prenom || "_Anne"
		, entreprise : requete.body.prenom || ""
		, email :  requete.body.email || ""
	}		
	updateOrCreateUser( requete, reponse ) ; 
} 


//Update or create User
function updateOrCreateUser( requete, reponse ){
	mesartimBd_pooled_query(requete, 'SELECT * FROM user WHERE email = ?',  requete.user.email 
			 , wrapProcess( processUpdateOrCreateUser, printAndSkip, requete, reponse ) ) ;	
}

function processUpdateOrCreateUser( requete, reponse, rows ) {
	if( rows.length > 0 ) {
		requete.user.id = rows[0].id ; 
		requete.participation = {
		  	  user_id : requete.user.id
			, seance_id : requete.body.seanceId || 1
		}	
		createParticipation( requete, reponse )
	} else {
		createUser( requete, reponse ) ;
	}
}

function createUser( requete, reponse ) {
	mesartimBd_pooled_query(requete, 'INSERT INTO user SET ?', requete.user
		     , wrapProcess( processNewUser, printAndSkip, requete, reponse )
	)	
}

function processNewUser( requete, reponse, err, result ){
	if(err) throw err;
	requete.user.id = result.insertId
	requete.participation = {
		  user_id :  result.insertId
		, seance_id : requete.body.seanceId || 1
	}	
	createParticipation( requete, reponse ) ; 
}
function createParticipation( requete, reponse ) {
	mesartimBd_pooled_query(requete, 'INSERT INTO participation SET ? ON DUPLICATE KEY UPDATE lastlogin=NOW();', requete.participation
			 , wrapProcess( processNewParticapation, printAndSkip, requete, reponse )		
	)
}

function processNewParticapation( requete, reponse, result ){
	if( requete.sqlConnection ) requete.sqlConnection.release()
	requete.participation.id = result.insertId
	//Should rather send a token 
	token=jwt.sign( { user : requete.user, participation : requete.participation }
								, app.get('secret')
								, { expiresIn: "24h" // expires in 24 hours    
								} ) ;
	reponse.cookie( 'token', token );
	reponse.redirect('/generation')

}
//List séances 

function requestListSeances( requete, reponse ){
	mesartimBd_pooled_query(requete, 'SELECT id, titre FROM seance WHERE date >= NOW()' 
			 , wrapProcess( processRequestListSeances, printAndSkip, requete, reponse)
		);	
}

function processRequestListSeances(requete, reponse, rows ) {
	if( requete.sqlConnection ) requete.sqlConnection.release()
	reponse.json( rows );
}

function tokenValid( requete, reponse ) {
	if( requete.sqlConnection ) requete.sqlConnection.release()
	reponse.json({ success : true 
							, token : requete.token 
							, user : requete.decoded.user 
							, participation : requete.decoded.participation 
							})
}

function wrapProcess( callBackSuccess, callBackError, ...args ) {
	return ( err, data ) => { 
		if( err ) 
			callBackError.apply(this, (args.unshift( err ), args ) ) ; 
		else 
			callBackSuccess.apply( this, (args.push( data ), args )  ) ;
	} 
}

function printAndSkip ( err ) { 
	if( requete.sqlConnection ) requete.sqlConnection.release()
	console.error( "\033[31m")
	console.error( err ) 
	console.error( "\033[0m")
}


function successListen() {
	console.log('listening on *:' + config.port); 
}

function callBackMySqlConnexion (err){
	if(err){
		console.log('Error connecting to Db');
		return;
	}
	console.log('Connection to database established');
}


function checkAuthentication(requete, reponse, next) {
  // check header or url parameters or post parameters for token
  var token = requete.body.token || requete.query.token || requete.headers['x-access-token'] || requete.cookies.token;
  requete.token = token ; 

  // decode token
  if (token) {
    // verifies secret and checks exp
    jwt.verify(token, app.get('secret'), wrapProcess( authenticationValid, authenticationInvalid, requete, reponse, next ));
  } else {
    // if there is no token
    // return an error
    noTokenFound( requete, reponse ) ;     
  }
}


function noTokenFound( requete, reponse ) {
	return reponse.status(403).send({ 
        success: false, 
        message: 'No token provided.' 
    });
}

function authenticationInvalid( err, requete, reponse, next ) {
	return reponse.status(403).json({ success: false, message: 'Failed to authenticate token.' + err.message });    
}

function authenticationValid(requete, reponse, next, decoded ) {
	requete.decoded = decoded;    
  next();
}


/*
io.on('connection', function(socket){
  console.log('a user connected');
});*/
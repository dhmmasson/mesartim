var config = require('./configHeroku')
  , argv = require('minimist')(process.argv.slice(2));

if( argv.port != undefined ) config.port = argv.port ;
if( argv.database != undefined ) config.database.database = argv.database ;

var express = require('express')
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
  , model = require("./server_scripts/model._base")
  , Router = require( "./server_scripts/Router" )
  , apiRoutesV2 = require( "./server_scripts/api._base" )   //Route for every ajax request
	, authenticationEngine = require('./server_scripts/auth0.config')
, googleToken = require('./googleApi/googleToken') 
//================================================================
//configurations 
//================================================================
console.log( config )

//Hot Fix

config.sql = config.database 
config.jwt = { secret : config.secret }
config.Auth0 = { public : { domain :"ideavaluation.estia.fr", client_id : "123", callbackURL : "ideavaluation.estia.fr" }, private : { client_secret : config.secret } }


model( config )
	.then( initializeApp )
	.catch( message => console.log( "init error: " + message ) ) ;


		


app.use( morgan( 'common' ) );
app.use( cookieParser( config.secret ) )
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

function initializeApp( model ) {
	model.authentication = authenticationEngine( config ) ;	
	console.log( "init app" ) ; 
	app.use( "/api", 
		upload.array(),
		apiRoutesV2( model ) ) ;



	apiRoutes.use( checkAuthentication ) ; 

	apiRoutes.get( '/seance/list', requestListSeances );
	apiRoutes.get( '/seance/:id/token', getSeanceToMonitor ) ; 

	apiRoutes.get( '/googleToken', getGoogleToken ) ;

	apiRoutes.get( '/seance/:id/participants', getParticipantsBySeance ) ;
	apiRoutes.get( '/seance/:id/messages', getMessagesBySeance ) ;
	apiRoutes.get( '/seance/:id(\\d+)/title', getSeanceTitle ) ;
	apiRoutes.get( '/seance/monitor', getSeanceToMonitor ) ;
	apiRoutes.get( '/seance/names', getSeanceNames ) ;



	apiRoutes.post( '/message/new', upload.array(), addMessage ) ;
	apiRoutes.post( '/message/:id/annotate',  upload.array(), annotateMessage );
	apiRoutes.get(  '/message/id/:id', getMessageById );
	apiRoutes.get(  '/message/mine', getAllMessageFromUser );
	apiRoutes.get(  '/message/all', proxyGetAllMessageFromSeance );
	apiRoutes.get(  '/message/count/:team?/:interval(\\d+|beginning)?', getMessageCountByTeam ) ;


	apiRoutes.get( '/annotations/all', getAnnotations ) ;
	apiRoutes.get( '/annotations/mine', getAnnotationsFromUser ) ;

	apiRoutes.get( '/tokenValid', tokenValid ) ;

	apiRoutes.post( '/screen/next', upload.array(), insertScreenMessage ) ;
	apiRoutes.get( '/screen/first', upload.array(), getNextScreen ) ;
	apiRoutes.get( '/screen/mine', getMyScreen ) ;
	apiRoutes.get( '/screen/info', apiScreenInfo  ) ;
	apiRoutes.get( '/screen/:id(\\d+)', getSpecificScreenMessage ) ;



	app.get( '/seance', requestListSeances );
	app.get( '/token', getSeanceToMonitor ) ;
	app.post('/register', upload.array(), register ) ;



	app.use('/api', apiRoutes);
	app.use( '/vote', checkAuthentication, getVotePage )
	app.use( '/generation', checkAuthentication, getSubmissionPage )
	app.use( '/login', getLogin )
	app.use( '/rank', checkAuthentication, getRankPage ) ;
	app.use( '/screen', checkAuthentication, getScreen ) ;
	app.use( '/screenResult', checkAuthentication, getScreenResult) ; 
	app.use( '/admin', checkAuthentication, getAdminPage ) ; 

	app.use( '/', getLogin )
		

}
var compteur = 0
mesartimBd.on('connection', function (connection) {
  console.log( "connection to database", ++compteur ) ; 
});
//SQL


function wrapProcess() {
	var callBackSuccess = arguments[0]
		, callBackError   = arguments[1]
		, args = Array.prototype.slice.call(arguments, 2); 

	return function( err, data ) { 
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
    console.log( "Get pooled query",  arguments.callee.caller.name, requete.sqlConnection != undefined ) ;
    if( requete.sqlConnection != undefined ) 
        return requete.sqlConnection.query.apply( requete.sqlConnection, _arguments) ;
    mesartimBd.getConnection( function(err, connection )  {
        connection.releaseProxy = function() {
            console.log( "release connection " , arguments.callee.caller.name )
            compteur -- ;
            this.release() ;
        }
	if( err ) {
            connection.releaseProxy() ;
            return console.error("can't get a connection", err,  compteur) ;
        }
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
					= 'SELECT `message`.`id`, `text`, `rowname`.`position` as row_position, `columnname`.`position` as column_position, `datemodification`, participation.user_id as auteur_id\n' 
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
	if( requete.sqlConnection ) requete.sqlConnection.releaseProxy()
	reponse.render(   "phase1.pug", 
		{ token : requete.token
		, columnNames : requete.columnNames
		, rowNames : requete.rowNames
		, dimensionNames : requete.dimensionNames
		, baseName : "grille" 		
	}); 

}

//===============================================================
//Get token
//===============================================================
function getGoogleToken( requete, reponse ) {
	googleToken()
		.then( token => reponse.json( { success : "true", token : token }))
		.catch( e => reponse.json( { sucess : false, error : e }) )
}

//================================================================
//Get Rank page
//================================================================
function getRankPage( requete, reponse ) {
	getAllInfoSeance( requete, reponse, processGetRankPage )
}
function processGetRankPage( requete, reponse, data ){
	if( requete.sqlConnection ) requete.sqlConnection.releaseProxy()
	data.baseName = "grille"
	reponse.render( "phase3", data ) ;
 }

function getAnnotationsFromUser( requete, reponse ) {
	mesartimBd_pooled_query(requete, sqlGetVoteByUser, requete.decoded.user.id, wrapProcess( processGetAnnotationsFromUser, printAndSkip, requete, reponse ))
}
function processGetAnnotationsFromUser( requete, reponse, data ) {
	if( requete.sqlConnection ) requete.sqlConnection.releaseProxy()
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
	if( requete.sqlConnection ) requete.sqlConnection.releaseProxy()	
	data.baseName = "grille"
	reponse.render( "phase2", data ) ;
}
//================================================================
//Screen result 
//================================================================
var sqlGetScreenInfo =
"SELECT message_id, screentype.description, rowname.position as row_position, columnname.position as column_position  ,  count(*) as count \
FROM screen \
JOIN screentype on screentype_id = screentype.id \
JOIN message on message_id = message.id \
JOIN columnname on column_id = columnname.id \
JOIN rowname on row_id = rowname.id \
JOIN participation on message.participation_id = participation.id  \
WHERE participation.seance_id = ? \
GROUP BY message_id, screentype.id ;"

function getScreenResult( requete, reponse ) {
	getAllInfoSeance( requete, reponse, getScreenInfo )
}
function getScreenInfo( requete, reponse, data ){
	requete._data = data
	var seanceId = requete.decoded.participation.seance_id 
	mesartimBd_pooled_query(requete, sqlGetScreenInfo, seanceId, wrapProcess( renderScreenResult, printAndSkip, requete, reponse ) )
}

function renderScreenResult( requete, reponse, data ) {
	if( requete.sqlConnection ) requete.sqlConnection.releaseProxy()	
	var data2 = requete._data
	data2.screen = data 
	data2.baseName = "grille"
	reponse.render( "screenResult", data2 ) ;
}
function apiScreenInfo( requete, reponse ) {
	var seanceId = requete.decoded.participation.seance_id 
	mesartimBd_pooled_query(requete, sqlGetScreenInfo, seanceId, wrapProcess( jsonScreenResult, printAndSkip, requete, reponse ) )
}
function jsonScreenResult( requete, reponse, data ) {
	reponse.json( { success: true, screenInfo : data }) 
}

//================================================================
//SEANCE
//================================================================


function getSeanceToMonitor( requete, reponse ) {
	var fakeData =
			{
				"user": {
					"nom": "Tappou",
					"prenom": "Robin",
					"entreprise": "estia",
					"email": "r.tappou@net.estia.fr",
					"ageRange": "17",
					"lastDiploma": "1",
					"organism": "ETI",
					"jobtype": "EXP",
					"motivation": "RES",
					"implantation": "RE1",
					"sex": "male",
					"id": 0
				},
				"participation": {
					"user_id": 0,
					"seance_id": requete.params.id || requete.query.seanceId || 0 ,
					"id": 0
				}
			}
			

	reponse.send(  jwt.sign( fakeData
												 , app.get('secret')
												 , { expiresIn: "8d" // expires in 24 hours
													 }
												 )
							) ; 
}

function getSeanceNames( requete, reponse ) {
	getGridHeaders( requete, reponse, processSeanceNames )
}
function processSeanceNames( requete, reponse, dimensionNames, columnNames, rowNames  ) {
	if( requete.sqlConnection ) requete.sqlConnection.releaseProxy()
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
	if( requete.sqlConnection ) requete.sqlConnection.releaseProxy()
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
	if( requete.sqlConnection ) requete.sqlConnection.releaseProxy()
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
	if( requete.sqlConnection ) requete.sqlConnection.releaseProxy()
	reponse.json( { success : true, resultat : rows } )	
}


function getMessageCountByTeam( requete, reponse ) {
	var values=[1,2,3,5,7,8,8,9,7,5,3,2,1,2,3,5,6,7,6,7,5,7,9,7,6,5,4,2,5,6,4,3,4,5,4,5,4,3,4,6,5,6,7,6,5,6,7,8,9,10,11,9,8,6,4,3,1,3,2,1,0,0]
	if( requete.params.team == "PURPLE" ) return reponse.status(200).send( ""+ values[ (new Date()).getMinutes() ] )
	var sql= "SELECT count(message.id) as count \n"  
	    +    "FROM message \n"
			+    "JOIN participation ON participation_id = participation.id \n"
	    +    "JOIN user          ON user_id = user.id \n"
	    +    "WHERE seance_id = ? "
	,	values = [requete.decoded.participation.seance_id]
	if(requete.params.team != undefined && requete.params.team != 'all' ) {
		sql += "AND adhesion = ? "
		values.push( requete.params.team ) 
	}
	if(requete.params.interval != "beginning" ) {
		sql += "AND (CURRENT_TIMESTAMP - message.datemodification ) < ? " 
		values.push( (requete.params.interval || 300 ) ) 
	}
	var sqlFormat = mysql.format( sql, values )  
	console.log( sqlFormat ) 
	q = mesartimBd_pooled_query(requete,  sqlFormat, wrapProcess(  processGetMessageCountByTeam, printAndSkip, requete, reponse )) ;    

};

function processGetMessageCountByTeam( requete, reponse, data ) {
	if( requete.sqlConnection ) requete.sqlConnection.releaseProxy()
	console.log( data ) 
	reponse.status(200).send( ""+ data[0].count ) 
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
		if( requete.sqlConnection ) requete.sqlConnection.releaseProxy()
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
		if( requete.sqlConnection ) requete.sqlConnection.releaseProxy()
	reponse.json( 
		{ success : true 
		, result : rows }
		) ; 
}

function getMyScreen( requete, reponse ) {
	var sql = "SELECT message_id as id, screentype_id as value FROM screen WHERE participation_id = ? ORDER BY datecreation" ;
	mesartimBd_pooled_query( requete, { sql : sql, values : requete.decoded.participation.id }, wrapProcess( processGetMyScreen, printAndSkip, requete, reponse ) ) ;
}

function processGetMyScreen( requete, reponse, data ) {
	if( requete.sqlConnection ) requete.sqlConnection.releaseProxy()
	if( data.length > 0 )
		reponse.json( { success : true , screen : data } )
	if( data.length == 0 )
		reponse.json( { success : false , screen : [] } )    

}

function insertScreenMessage( requete, reponse ) {
	var values = {
		message_id : requete.body.id
		, participation_id : requete.decoded.participation.id
		, screenType_id : requete.body.value
	}
	, sql= "INSERT INTO screen SET ? ON DUPLICATE KEY UPDATE datecreation=NOW(), screentype_id = VALUES( screentype_id ) ;"

	mesartimBd_pooled_query(requete, { sql : sql, values :  values }, wrapProcess( processScreenMessage, printAndSkip, requete, reponse ) ) ;  
}

function processScreenMessage( requete, reponse ) {
	//if( requete.sqlConnection ) requete.sqlConnection.releaseProxy()
	getNextScreen( requete, reponse ) ;
}

function getSpecificScreenMessage( requete, reponse  ) {
	var	sql = "select id, text as description from message where id = ?"
	, value = requete.params.id

	mesartimBd_pooled_query(requete, { sql : sql, values : value }, wrapProcess( processGetNextScreen, printAndSkip, requete, reponse ) ) ;     
}
function getNextScreen( requete, reponse ) {
//Get the message id and description of the next message to be screened by the current participant
	var sql= "select message.id as id , message.text as description, columnname.title as colname, rowname.title as rowname " + "\n"
	+ "from screen" + "\n"
	+ "right join message on message.id = message_id" + "\n"
	+ "join rowname on message.row_id = rowname.id "
	+ "join columnname on message.column_id = columnname.id "
	+ "where  message.participation_id != ?" + "\n"
	+ "group by message.id" + "\n"
	+ "having message.id not in ( select message_id from screen where participation_id = ? )" + "\n"
	+ "order by count(*) asc" + "\n"
	+ "limit 1" + ";"
	, participationId = requete.decoded.participation.id 

	mesartimBd_pooled_query(requete, { sql : sql, values :  [participationId, participationId ] }, wrapProcess( processGetNextScreen, printAndSkip, requete, reponse ) ) ;
	
}

function processGetNextScreen( requete, reponse, data ) {
  if( requete.sqlConnection ) requete.sqlConnection.releaseProxy() 
	if( data.length > 0 ) 
		reponse.json( { success : true , message : data[0] } )
	if( data.length == 0 )
		reponse.json( { success : "done" , message : {} } )
	
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
	if( requete.sqlConnection ) requete.sqlConnection.releaseProxy()
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
	if( requete.sqlConnection ) requete.sqlConnection.releaseProxy()
	reponse.json( {
		success: true
	, result : rows } )
}


// function getAnnotations( requete, reponse ) {
// 	var user = requete.decoded.user
// 	  , values = [ user.id ]
// 	mesartimBd_pooled_query(requete, sqlGetVoteByUser, values, wrapProcess( processGetAnnotation, printAndSkip, requete, reponse ))
// }

// function processGetAnnotation( requete, reponse, data ) {
// 	releaseProxyIfExists( requete.sqlConnection ) 
// 		reponse.json( {
// 		success: true
// 	, result : data } )
// }

//================================================================
//Resultat
//================================================================

function getAnnotations( requete, reponse ) {
	//Bst annotation is a request that sort annotation by date, and then group by the "primary key (user,message,criteria)" 
  //select * from (select * from annotation group by id, datecreation order by datecreation desc) annotationByTime group by user_id, message_id, criteria_id
  var bestAnnotation = "(select annotation.*, user.email as judge_email, user.sex as judge_sex,  CONCAT( user.prenom, ' ', user.nom ) as judge_name from annotation join user on annotation.user_id = user.id order by user_id, message_id, criteria_id, datecreation desc) bestAnnotation "
    , sql = "SELECT message.id as message_id, message.text as message_text, bestAnnotation.user_id as judge_id, participation.user_id as auteur_id, user.email as auteur_email, user.sex as auteur_sex,  CONCAT( user.prenom, ' ', user.nom ) as auteur_name, criteria.id as criteria_id, criteria.description, bestAnnotation.value, message.dateModification as dateMessage, bestAnnotation.dateCreation as dateVote, bestAnnotation.judge_email, bestAnnotation.judge_sex, bestAnnotation.judge_name "
          + "FROM " + bestAnnotation 
	          + "JOIN criteria      on bestAnnotation.criteria_id = criteria.id "
      + "RIGHT JOIN message       on bestAnnotation.message_id  = message.id "
          + "JOIN participation on message.participation_id   = participation.id "

          + "JOIN user      		on participation.user_id 			= user.id "
          + "WHERE participation.seance_id = ? "
    , seance = requete.query.seance || requete.decoded.participation.seance_id 
    
    console.log( sql ) 

    query = mesartimBd_pooled_query( requete, sql, seance, wrapProcess( processGetAnnotations, printAndSkip, requete, reponse ) ) ;
    console.log( query )
}
function processGetAnnotations( requete, reponse, resultat ) {
	if( requete.sqlConnection ) requete.sqlConnection.releaseProxy()
	reponse.json( 
		{ success : true 
		, resultat : resultat 
		})
}

//================================================================
//ADMIN
//================================================================
function getAdminPage( requete, reponse ) {
		var sql = "SELECT id, description, type"
			+ ' ' + 'FROM criteria'

	mesartimBd_pooled_query(requete, sql, {}, wrapProcess( processGetAdminPage, printAndSkip, requete, reponse ))
}

function processGetAdminPage( requete, reponse, data ) {
	var values = { criteria : data[0] }
	reponse.render( "admin", values ) ;
}

//================================================================
//ADMIN
//================================================================
function getScreen( requete, reponse ) {
    reponse.render( "screen" ) ;
}




//================================================================
//PARTICIPANTS
//================================================================
//get all participants for a seance
function getParticipantsBySeance( requete, reponse ) {
	var values = {seance_id : requete.params.id || requete.decoded.participation.seance_id}	
	mesartimBd_pooled_query(requete, 	{ sql : 'SELECT user.*, participation.id as participation_id ' 
				+ ' ' + 'FROM user'
				+ ' ' + 'JOIN participation ON user_id 	= user.id'
				//+ ' ' + 'JOIN seance        ON seance_id 		= seance.id'  
				+ ' ' + 'WHERE ?'
			   , values :  values
			   } 
			   , wrapProcess( processGetParticipantsBySeance, printAndSkip, requete, reponse )
	);	
}
function processGetParticipantsBySeance( requete, reponse, rows ) {
	if( requete.sqlConnection ) requete.sqlConnection.releaseProxy()
	reponse.json( {success: true, resultat : rows }) ;	
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
	requete.user = {}
	requete.user.nom = requete.body.nom || "_Onyme"
	requete.user.prenom = requete.body.prenom || "_Anne"
	requete.user.entreprise = requete.body.entreprise || ""
	requete.user.email =  requete.body.email || ""
  requete.user.ageRange = requete.body.ageRange
  requete.user.lastDiploma = requete.body.lastDiploma
  requete.user.organism = requete.body.organism
  requete.user.jobtype = requete.body.jobtype
  requete.user.motivation = requete.body.motivation
  requete.user.implantation = requete.body.implantation
  requete.user.sex = requete.body.sex
	// requete.user.adhesion  =  requete.body.adhesion
  // if( requete.body.adhesion != undefined && typeof requete.body.adhesion.join == "function" )
	// 	requete.user.adhesion  =  requete.body.adhesion.join(",")
	// else if( typeof requete.body.adhesion != "string")
	
	
	
	/**CLEAN UP : code dégueulasse **/
	console.log( requete.user )
	updateOrCreateUser( requete, reponse ) ; 
} 


//Update or create User
function updateOrCreateUser( requete, reponse ){
	mesartimBd_pooled_query(requete, 'SELECT * FROM user WHERE email = ?',  requete.user.email 
			 , wrapProcess( processUpdateOrCreateUser, printAndSkip, requete, reponse ) ) ;	
}

function processUpdateOrCreateUser( requete, reponse, rows ) {
	console.log( "seance",  requete.body.seanceId )
	if( rows.length > 0 ) {
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
    console.log( requete.user ) 
	mesartimBd_pooled_query(requete, 'INSERT INTO user SET ?', requete.user
		     , wrapProcess( processNewUser, printAndSkip, requete, reponse )
	)		
}

function processNewUser( requete, reponse, result ){
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
	if( requete.sqlConnection ) requete.sqlConnection.releaseProxy()
	requete.participation.id = result.insertId
	//Should rather send a token 
	token=jwt.sign( { user : requete.user, participation : requete.participation }
								, app.get('secret')
								, { expiresIn: "8d" // expires in 24 hours    
								} ) ;
	reponse.cookie( 'token', token );
	reponse.redirect('/vote')

}
//List séances 

function requestListSeances( requete, reponse ){
	mesartimBd_pooled_query(requete, 'SELECT id, titre FROM seance WHERE date >= NOW()' 
			 , wrapProcess( processRequestListSeances, printAndSkip, requete, reponse)
		);	
}

function processRequestListSeances(requete, reponse, rows ) {
	if( requete.sqlConnection ) requete.sqlConnection.releaseProxy()
	reponse.json( rows );
}

function getSeanceTitle( requete, reponse ){
	mesartimBd_pooled_query(requete, 'SELECT titre FROM seance WHERE id='+requete.params.id 
			 , wrapProcess( processGetSeanceTitle, printAndSkip, requete, reponse)
		);	
}

function processGetSeanceTitle(requete, reponse, rows ) {
	if( requete.sqlConnection ) requete.sqlConnection.releaseProxy()
	reponse.json(
	{success : true
	 , result : rows[0]} );
}

function tokenValid( requete, reponse ) {
	if( requete.sqlConnection ) requete.sqlConnection.releaseProxy()
	reponse.json({ success : true 
							, token : requete.token 
							, user : requete.decoded.user 
							, participation : requete.decoded.participation 
							})
}


function printAndSkip ( err, requete ) { 
	if( requete.sqlConnection ) requete.sqlConnection.releaseProxy()
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
	console.log( "hello authentication" ) 
  // check header or url parameters or post parameters for token
  var token = requete.body.token || requete.query.token || requete.headers['x-access-token'] || requete.cookies.token;
  requete.token = token ; 

  // decode token
  if (token) {
    // verifies secret and checks exp
    jwt.verify(token, app.get('secret'), wrapProcess( authenticationValid, authenticationInvalid, requete, reponse, next ));
  } else {
    // if tmhere is no token
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

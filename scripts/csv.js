define( ['jquery', "date_format", "papaparse", "util"], 
function($, date_format, Papa) {

	date_format.extendPrototype();

	window.getUserInfo = function( id  ) { getInfo( id ).then( traiteInfo ) } 
	
	function getInfo( id ) {
		var message = getDataFromServer( "/api/message/all")
		, vote    = getDataFromServer( "/api/annotations/all")
		, user    = getDataFromServer( "/api/seance/"+id+"/participants")
		, title    = getDataFromServer( "/api/seance/"+id+"/title")
		return new Promise( function( resolve, reject ) {
			Promise
				.all( [ user, message, vote, title  ] )
				.then( data => resolve(
				{user : data[0]
				 , message : data[1]
				 , vote : data[2]
				 , title : data[3].title
				}))
				.catch( error => reject(error) )
					})
	}

	function getDataFromServer( url ) {
		var data = null
		, dataFromServerSolver = function( resolve, reject ) {
			$.get( url, function( reponse ) {
				if( reponse.success ) {
					if( reponse.result )
						resolve( reponse.result )
					else if( reponse.resultat )
						resolve( reponse.resultat )
				} else  {
					reject( reponse )
				}
			})
		}
		return new Promise( dataFromServerSolver ) ;
	}

	//Should be a request from the database
	var criteriaIdToDescription = [ "interest", "originality", "feasibility", "potentiality" ]

	function traiteInfo( info ) {
		var exportUsers = {}
		, tocsv = []
		, allMessage = []
		console.log( info ) 
		for( var i in info.user ){
			var user = info.user[i] ;
			exportUsers[ user.id ] =
				{nom : user.prenom + " " + user.nom
				 , mail : user.email
				 , sexe : user.sex
				 , age : user.ageRange
				 , profession : user.jobtype
				 , implantation : user.implantation
				 , motivation : user.motivation
				 , diplome : user.lastDiploma
				 , organisation : user.entreprise
				 , "séance" : info.title
				 , "nombre idées proposées" : 0
				 , "message ids" : []
				 , "description des idées proposés" : ""
				 , "nombre d'évaluations réalisées" : 0
				 , evaluations : {}
				}
		}

		//Traite tous les messages
		for( var i in info.message ) {
			var message = info.message[i]
			, user = exportUsers[ message.auteur_id ]


			if( user ){
				user["nombre idées proposées"] ++
				user["message ids"].push( message.id )
				user["description des idées proposés"] += message.text.replace(/[\n\r]/g,"%")  +"%"
			}
			//Ajoute le message à tout le monde pour les critères d'évaluations

			for( var j in exportUsers ) {
				user = exportUsers[j]
				user["message " + message.id + " criteria " + criteriaIdToDescription[0] ] = ""
				user["message " + message.id + " criteria " + criteriaIdToDescription[1] ] = ""
				user["message " + message.id + " criteria " + criteriaIdToDescription[2] ] = ""
				user["message " + message.id + " criteria " + criteriaIdToDescription[3] ] = ""
			}
		}
		console.log(exportUsers)
		//traite tous les votes
		for( var i in info.vote ) {
			var vote = info.vote[i]
			, user = exportUsers[ vote.judge_id ]
			if( user ){

				if( !user.evaluations[ vote.message_id ] ) user.evaluations[ vote.message_id ] = {}
				user.evaluations[ vote.message_id ][ vote.criteria_id ] = vote.value
			}
		}

		for( var i in exportUsers ) {
			var evaluations = exportUsers[i].evaluations
			delete exportUsers[i].evaluations
			for( var j  in evaluations ) {
				exportUsers[i]["nombre d'évaluations réalisées"] ++
				for( var l in evaluations[j] ) {
					exportUsers[i]["message " + j + " criteria " + criteriaIdToDescription[l] ] = evaluations[j][l]

				}
			}

			exportUsers[i]["description des idées proposés"].slice(0,-1)

			tocsv.push( exportUsers[i] ) ;
		}
		saveData( Papa.unparse( tocsv ),   "user_"+( ( new Date() ).format('Y-m-d_Hi'))+".csv") 
		console.log( tocsv ) 

	}


	//Function to download the data to computer 
	//Tkn from http://jsfiddle.net/koldev/cw7w5/
	var saveData = (function () {
    var a = document.createElement("a");
    document.body.appendChild(a);
    a.style = "display: none";
    return function (data, fileName) {
        var blob = new Blob( [data], {encoding:"UTF-8", type: "text/plain;charset=UTF-8"}),
            url = window.URL.createObjectURL(blob);
        a.href = url;
        a.download = fileName;
        a.click();
        window.URL.revokeObjectURL(url);
    };
	}());

})

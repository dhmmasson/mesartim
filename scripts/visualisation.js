define( ["d3", 'jquery', "date_format", "util"], 
function(d3, $, date_format) {
	window.d3 = d3 ;



	function ConsolidatedVote () {}
	_consolidatedVote = Object.create( ConsolidatedVote.prototype )  ; 

	_consolidatedVote.id = 0 
	_consolidatedVote.auteur_id = 0 
	_consolidatedVote.judge_id = 0 
	_consolidatedVote.message_id = 0 
    _consolidatedVote.dateVote = 0 
    _consolidatedVote.dateGeneration = 0 
	heritableArray( _consolidatedVote, 'criteria', [0,0,0,0] )


	


	
	function ConsolidatedMessage () {}
	_consolidatedMessage = Object.create( ConsolidatedMessage.prototype )  ; 

	_consolidatedMessage.id = 0 
	_consolidatedMessage.auteur_id = 0 
	_consolidatedMessage.nbJudge = 0 
	_consolidatedMessage.message_id = 0 
        _consolidatedMessage.dateCreation = 0 
    _consolidatedMessage.judge_interested = "" 
    _consolidatedMessage.auteur_email = ""
    _consolidatedMessage.auteur_name = ""
_consolidatedMessage.message_text = "" 
    _consolidatedMessage.averageOfAverage = [0,0,0,0] 

	heritableArray( _consolidatedMessage, 'criteria_average', [0,0,0,0] )
	heritableArray( _consolidatedMessage, 'criteria_sum', [0,0,0,0] )
	heritableArray( _consolidatedMessage, 'criteria_stddev', [0,0,0,0] )
	heritableArray( _consolidatedMessage, 'criteria_count', [0,0,0,0] )
	heritableArray( _consolidatedMessage, 'criteria_max', [0,0,0,0] )
	heritableArray( _consolidatedMessage, 'criteria_min', [0,0,0,0] )

	
	function ConsolidatedUser () {}
	_consolidatedUser = Object.create( ConsolidatedUser.prototype )
	_consolidatedUser.id = 0
	_consolidatedUser.nb_vote 	
	heritableArray( _consolidatedUser, 'criteria_average', [0,0,0,0] )
	heritableArray( _consolidatedUser, 'criteria_stddev', [0,0,0,0] )
	heritableArray( _consolidatedUser, 'criteria_sum', [0,0,0,0] )
	heritableArray( _consolidatedUser, 'criteria_count', [0,0,0,0] )
	heritableArray( _consolidatedUser, 'criteria_max', [0,0,0,0] )
	heritableArray( _consolidatedUser, 'criteria_min', [0,0,0,0] )


	function Visualisation () {} 
	visualisation = Object.create( Visualisation.prototype ) ; 



	visualisation.loadData = function() {
 		$.get("/api/annotations/all", this.onDataLoaded.bind( this ) )
	} 
	visualisation.loadFromCsv = function( ) {
		$.get("/data_2016-09-14_1827.csv", this.onCsvLoaded.bind(this) ) ;
	}

	visualisation.onCsvLoaded =function( data ) {
		//this.onDataLoaded( { success :true, resultat : d3.csvParse(data)} )
		console.log(d3.csvParse(data))
	}

	visualisation.onDataLoaded = function( data ) {
		localStorage.setItem( "data", JSON.stringify( data ) )
		if( data.success == false ) return ;
		localStorage
		


		var resultat = [] //all the rough result
			, votes  = {}							 //result consolidated by message/user
			, element 								 //the current rough element being treated
			, consolidatedVote = null
			, consolidatedMessage = null 
			, messages = {}
			, users = {} 
			, prev = data.resultat[0] 

		resultat.push( prev )	
		for( var i = 1 ; i <  data.resultat.length ; i++ ) {
			if( data.resultat[i].judge_id != prev.judge_id
			 || data.resultat[i].message_id != prev.message_id 
			 || data.resultat[i].criteria_id != prev.criteria_id ) {
				prev = data.resultat[i]
				resultat.push( prev )
			}
		}

		for( var i = 0 ; i <  resultat.length ; i++ ) {
			element = resultat[ i ] ; 
                    if( element == undefined ) continue
		    element.id = element.message_id + "_" + element.judge_id
			
			//Create a new vote that consolidate all the criteria
			if( ! votes.hasOwnProperty( element.id ) ) {
				consolidatedVote            = Object.create( _consolidatedVote )
				consolidatedVote.id         = element.id
				consolidatedVote.auteur_id  = element.auteur_id
			    consolidatedVote.judge_id   = element.judge_id
				consolidatedVote.message_id = element.message_id				
                            consolidatedVote.dateGeneration = (new Date( element.dateMessage ) ).getTime()
                            consolidatedVote.dateVote = (new Date( element.dateVote )).getTime() 
				//Add vote to its consolidated result set
				votes[ element.id ] = consolidatedVote ;
			} 
			consolidatedVote = votes[ element.id ] 
			
			// //If it's a older vote for the same criteria skip it //Assume they are ordered  
			// if( consolidatedVote.criteria.hasOwnProperty(  element.criteria_id ) ) continue ;
			

			consolidatedVote.criteria[ element.criteria_id ] = element.value 		

			//Create a new element that aggregate the criteria values by message
			if( !messages.hasOwnProperty( element.message_id ) ) {
				consolidatedMessage 					 	= Object.create( _consolidatedMessage ) 
				consolidatedMessage.message_id = element.message_id	
				consolidatedMessage.message_text = element.message_text			
				consolidatedMessage.id 				 = element.message_id
				consolidatedMessage.auteur_id  = element.auteur_id
				consolidatedMessage.auteur_name = element.auteur_name
			    consolidatedMessage.auteur_email = element.auteur_email
				consolidatedMessage.nbJudge 	 = 0				
                            consolidatedMessage.dateCreation = (new Date( element.dateMessage)  ).getTime() 
				//Add message to its consolidated result set

				messages[ element.message_id ] = consolidatedMessage ;
			}
			//aggregate the vote		
			consolidatedMessage = messages[ element.message_id ] 
			consolidatedMessage.criteria_sum[ element.criteria_id ] += element.value 	
                    if( element.criteria_id == 0 && element.value == 1 ) consolidatedMessage.judge_interested += element.judge_name + ":" +  element.judge_email + "%"
			consolidatedMessage.criteria_min[ element.criteria_id ] = Math.min( consolidatedMessage.criteria_min[ element.criteria_id ] ,  element.value 	) 
			consolidatedMessage.criteria_max[ element.criteria_id ] = Math.max( consolidatedMessage.criteria_max[ element.criteria_id ] ,  element.value 	) 
			consolidatedMessage.criteria_count[ element.criteria_id ] ++			

			//link the vote to the message 
			consolidatedVote.consolidatedMessage = consolidatedMessage ; 



			//Create a new element that aggregate the criteria values by user
			if( !users.hasOwnProperty( element.judge_id ) ) {
				consolidatedUser 			   			= Object.create( _consolidatedUser ) 
				consolidatedUser.id 		   		= element.judge_id
				consolidatedUser.nb_vote 	 		= 0				
				//Add user to its consolidated result set
				users[ element.judge_id ] = consolidatedUser ;
			}
			//aggregate the vote		
			consolidatedUser = users[ element.judge_id ] 
			consolidatedUser.criteria_sum[ element.criteria_id ] += element.value 	
			consolidatedUser.criteria_min[ element.criteria_id ] = Math.min( consolidatedUser.criteria_min[ element.criteria_id ] ,  element.value 	) 
			consolidatedUser.criteria_max[ element.criteria_id ] = Math.max( consolidatedUser.criteria_max[ element.criteria_id ] ,  element.value 	) 
			consolidatedUser.criteria_count[ element.criteria_id ] ++			

			//link the vote to the message 
			consolidatedVote.consolidatedUser = consolidatedUser ; 




		}
		
		//compute the mean by message
		for( var message_id in messages ) {
			for( var criteria_id = 0 ; criteria_id < messages[ message_id ].criteria_sum.length ; criteria_id++ ) {
				if( messages[ message_id ].criteria_count[ criteria_id ] > 0 )
					messages[ message_id ].criteria_average[ criteria_id ] = messages[ message_id ].criteria_sum[ criteria_id ] / messages[ message_id ].criteria_count[ criteria_id ]
				else 
					messages[ message_id ].criteria_average[ criteria_id ] = 0
			}
		}
		
			//compute the mean by user
		for( var user_id in users ) {
			for( var criteria_id = 0 ; criteria_id < users[ user_id ].criteria_sum.length ; criteria_id++ ) {
				if( users[ user_id ].criteria_count[ criteria_id ] > 0 )
					users[ user_id ].criteria_average[ criteria_id ] = users[ user_id ].criteria_sum[ criteria_id ] / users[ user_id ].criteria_count[ criteria_id ]
				else 
					users[ user_id ].criteria_average[ criteria_id ] = 0
			}
		}
		

		this.users = users 
		this.votes = votes
		this.messages = []
		this.array = [] ;
		for( var vote_id in votes ) {
			//compute stddev for each criteria 
			for( var criteria_id = 0 ; criteria_id < votes[vote_id].criteria.length ; criteria_id++ ) {
				//difference with the mean
				var value = votes[ vote_id ].criteria[ criteria_id ] - votes[  vote_id ].consolidatedMessage.criteria_average[ criteria_id ] 
				//add the square of the difference
				votes[  vote_id ].consolidatedMessage.criteria_stddev[ criteria_id ] += value * value
			}
			this.array.push( votes[  vote_id ] )
		}

		//Finish the stddev
		for( var message_id in messages ) {
			//square root of the mean
			for( var criteria_id = 0 ; criteria_id < messages[ message_id ].criteria_sum.length ; criteria_id++ ) {
				if( messages[ message_id ].criteria_count[ criteria_id ] != 0)
					messages[ message_id ].criteria_stddev[ criteria_id ] = Math.sqrt( messages[ message_id ].criteria_stddev[ criteria_id ] / messages[ message_id ].criteria_count[ criteria_id ]) 
			}
			this.messages.push( messages[ message_id ] )
		}



		for( var vote_id in votes ) {
			//compute stddev for each criteria 
			for( var criteria_id = 0 ; criteria_id < votes[vote_id].criteria.length ; criteria_id++ ) {
				//difference with the mean
				var value = votes[ vote_id ].criteria[ criteria_id ] - votes[  vote_id ].consolidatedUser.criteria_average[ criteria_id ] 
				//add the square of the difference
				votes[  vote_id ].consolidatedUser.criteria_stddev[ criteria_id ] += value * value
			}
		}

		//Finish the stddev
		for( var user_id in users ) {
			//square root of the mean
			for( var criteria_id = 0 ; criteria_id <users[ user_id ].criteria_sum.length ; criteria_id++ ) {
				if( users[ user_id ].criteria_count[ criteria_id ] != 0)
					users[ user_id ].criteria_stddev[ criteria_id ] = Math.sqrt(users[ user_id ].criteria_stddev[ criteria_id ] / users[ user_id ].criteria_count[ criteria_id ]) 
			}
		}



	//	this.init() ; 
		this.render()
		
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

	date_format.extendPrototype();
	visualisation.votesToCSV = function( filter, title ) {
            console.log( "vote to CSV" ) ;
		var votes = this.votes 
			, resultat = "" 
		for( var label in _consolidatedVote ){
			if( _consolidatedVote[label].length > 0 ) {
				for( var i = 0 ; i <  _consolidatedVote[label].length ; i++) 	resultat += label +"_"+i + "~" ;
			} else { 
				resultat += label + "," ;
			}
		}
		resultat = resultat.slice(0,-1) ;
		resultat +="\r\n" ;
		
		for( var i in votes ) {
			if( filter( votes[i] )){
				//Push value for all label in right order
				for( var label in _consolidatedVote ){				
					resultat += votes[i][ label ] + "," ;
				}
				resultat = resultat.slice(0,-1) ;
				resultat +="\r\n" ;
			}
		}
		saveData( resultat, title + "_"+( ( new Date() ).format('Y-m-d_Hi'))+".csv")
	}

	visualisation.messagesToCSV = function( filter, title ) {
            console.log( "message to CSV" ) ;
		var messages = this.messages 
			, resultat = "" 

            averageOfAverages = [0,0,0,0] ;
            for( var i in messages ) {
                var message = messages[ i ] 
                for( var j in message.criteria_average ) {
                    averageOfAverages[ j ] += message.criteria_average[ j ] / messages.length 
                }
                message.averageOfAverage = averageOfAverages ;
                message.message_text =   message.message_text.replace( /"/g, "\"\"" ) 
                message.judge_interested = message.judge_interested.trim()  
            }




		for( var label in _consolidatedMessage ){
			if( _consolidatedMessage[label].length > 0 ) {
				for( var i = 0 ; i <  _consolidatedMessage[label].length ; i++) 	resultat += "\"" + label +"_"+i + "\"," ;
			} else { 
				resultat += "\"" +  label + "\"," ;
			}
		}
		resultat = resultat.slice(0,-1) ;
		resultat +="\n" ;
		
		for( var i in messages ) {
			if( filter( messages[i] )){
				//Push value for all label in right order
				for( var label in _consolidatedMessage ){				
                                    if( typeof messages[i][label] != "string" && messages[i][ label ].length > 0 ) 
                                        for( l in messages[i][ label ] )  resultat += "\"" + messages[i][ label ][l] + "\"," ;
                                    else 
					resultat += "\"" + messages[i][ label ] + "\"," ;
				}
				resultat = resultat.slice(0,-1) ;
				resultat +="\r\n" ;
			}
		}
		saveData( resultat, title + "_"+( ( new Date() ).format('Y-m-d_Hi'))+".csv")
	}


	visualisation.userToCSV = function( filter, title ) {
            console.log( "user to CSV" ) ;
		var users = this.users 
			, resultat = "" 
		for( var label in _consolidatedUser ){
			if( _consolidatedUser[label].length > 0 ) {
				for( var i = 0 ; i <  _consolidatedUser[label].length ; i++) 	resultat += "\"" + label +"_"+i + "\"," ;
			} else { 
				resultat += "\""+ label + "\"," ;
			}
		}
		resultat = resultat.slice(0,-1) ;
		resultat +="\n" ;
		
		for( var i in users ) {
			if( filter( users[i] )){
				//Push value for all label in right order
				for( var label in _consolidatedUser ){				
					resultat += users[i][ label ] + "," ;
				}
				resultat = resultat.slice(0,-1) ;
				resultat +="\n" ;
			}
		}
		saveData( resultat, title + "_"+( ( new Date() ).format('Y-m-d_Hi'))+".csv")
	}


	function filterAll( ){ return true }
    function withInterest( vote ){ return vote["criteria"][0] == 1 }
    function withNoInterest( vote ){ return vote["criteria"][0] == 0 }

	visualisation.makeAllCSV = function() {
	    
            setTimeout( this.votesToCSV.bind(this), 100, filterAll, "allVotes" ) ;
	    setTimeout( this.votesToCSV.bind(this), 5000, withInterest, "allVotesWithInteret" ) ;
	    setTimeout( this.votesToCSV.bind(this), 10000, withNoInterest,  "allVotesWithNoInteret" ) ;
            setTimeout( this.messagesToCSV.bind(this),15000, filterAll, "allMessages" )
            setTimeout( this.userToCSV.bind(this), 20000, filterAll, "allUsers" )
	}

	visualisation.toCSV = function() {
		var votes = this.votes 
			, resultat = "" 
		for( var label in _consolidatedVote ){
			if( _consolidatedVote[label].length > 0 ) {
				for( var i = 0 ; i <  _consolidatedVote[label].length ; i++) 	resultat += label +"_"+i + "," ;
			} else { 
				resultat += label + "," ;
			}
		}
		resultat = resultat.slice(0,-1) ;
		resultat +="\n" ;
		
		for( var i in votes ) {
			//Push value for all label in right order
			for( var label in _consolidatedVote ){
				resultat += votes[i][ label ] + "," ;
			}
			resultat = resultat.slice(0,-1) ;
			resultat +="\n" ;
		}
		saveData( resultat, "data_"+( ( new Date() ).format('Y-m-d_Hi'))+".csv")
	}


	var margin = {top: 20, right: 20, bottom: 30, left: 40},
  width = 800 - margin.left - margin.right,
  height = 800 - margin.top - margin.bottom;

	visualisation.init =function() {
		this.svg = 
		d3.select("#visualisation").append("svg")
      .attr("width", width + margin.left + margin.right)
    	.attr("height", height + margin.top + margin.bottom)
    	.append("g")
    	.attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    d3.svg = this.svg 

    this.XaxisCriteriaId = 1 
    this.YaxisCriteriaId = 2  
	}


	//Coloration 
	var colorScheme10 = d3.schemeCategory20;
	//either take directly the message id or an object that has a message_id attribut
	function valueInColorScheme( index, colorScheme ) {
		index = index || 0 
		return colorScheme10[ index % colorScheme10.length ]
	}
	function colorByMessageId( dOrMessageId ) {
		if( dOrMessageId == undefined ) return colorScheme10[ 0 ]	;
		return colorScheme10[ dOrMessageId % colorScheme10.length ] || colorScheme10[ dOrMessageId.message_id % colorScheme10.length ] ||  colorScheme10[ 0 ]	
	}

	function colorByAttribute( attribute, index ) {				
		return function( d) {
			if( index != undefined ) 					returnValue = valueInColorScheme( d[ attribute ][ index ] )
			else if( attribute != undefined ) returnValue = valueInColorScheme( d[ attribute ] ) ;
			else 															returnValue = valueInColorScheme( d ) ;		
			return returnValue
		}
	}

		var xScale = d3.scaleLinear().range([0, width]) // value -> display
    	, xMap = function( fct, d) { return xScale( fct(d ) );} // data -> display
    	, xAxis = d3.axisBottom(xScale)    	
			, yScale = d3.scaleLinear().range([height, 0]) // value -> display
    	, yMap = function( fct, d) { return yScale( fct(d ) );} // data -> display
    	, yAxis = d3.axisLeft(yScale) 


    	var ValueCriteriaX =function( criteriaId, d ) { return d.criteria[ criteriaId ]  + randomX(d.message_id, d.judge_id )    	}
    	, ValueCriteriaY =function( criteriaId, d ) { return d.criteria[ criteriaId ]  + randomY(d.message_id, d.judge_id )    	}
    	, AverageCriteria =function( criteriaId, d ) { return d.criteria_average[ criteriaId ] }    	
    	, consolidatedCriteriaX =function( aggregateFunction, criteriaId, d ) { return d.consolidatedMessage[ aggregateFunction ][ criteriaId ]  + randomX(d.message_id, d.judge_id )    	}
    	, consolidatedCriteriaY=function( aggregateFunction, criteriaId, d ) { return d.consolidatedMessage[ aggregateFunction ][ criteriaId ]  + randomY(d.message_id, d.judge_id )    	}

    	, selectCoordinates = function( axis, d ) {
    			//If d is a vote, it can be selected or not
    			if( d instanceof ConsolidatedVote ) {
    				if( d.selected ) {
    					return d.criteria[ this.axisVoteCriteriaId[ axis ] ] + random[ axis ](d.message_id, d.judge_id )  
    				} else {
    					return d.consolidatedMessage[ this.axisMessageCriteria[ axis ] ][ 0 ] + random[ axis ](d.message_id, d.judge_id )  
    				}
    			}
    			//if d is a message 
    			if( d instanceof ConsolidatedMessage ) {
    				if( d.selected ) {
    					return d.criteria[ this.axisCriteriaId[ axis ] ] + random[ axis ](d.message_id, d.judge_id )  
    				} else {
    					return d.consolidatedMessage[ this.axisCriteriaId[ axis ] ] + random[ axis ](d.message_id, d.judge_id )  
    				}
    			}
    		}


   function randomX( seed1, seed2 ) {
   	 return ( ( seed1 * 983 + seed2 * 967 ) % 97 - 48 ) / 97 * 2
   }
   function randomY( seed1, seed2 ) {
   	 return ( ( seed1 * 971 + seed2 * 953 ) % 101 - 50 ) / 101 * 2
   }

   visualisation.initAxis = function() {
   	var axis = { }


   	r
   }

   visualisation.setAxis = function( xScale, yScale ) {
   	//


   }

	/**
	*	@param elements : array of strings to put in the cell
	* @param header : type of cell th (true) or td (false)
	*/
	function createRow( elements, header ) {
		var row = $(document.createElement( "tr" ) ) 
		for( var i = 0 ; i < elements.length ; i++ ) {
			row.append( 
				$(document.createElement( (header)?"th":"td" ) ).text( elements[i] ) 
			)
		}
		return row ; 
	}

	function createTable( messages, titre, criteria, attribute ) {
		var title = $( document.createElement("h5") ).text( titre ) 
			, table  = $(document.createElement( "table" ) ) 
			, header = $(document.createElement( "thead" ) ) 
			, body   = $(document.createElement( "tbody" ) ) 

		header.append( createRow( ["#Idea", "Author", "Description", "Score" ], true ) ) ; 
		var array = get5Best( messages, attribute, criteria ) ; 
		for( var i = array.length - 1 ; i >= 0 ; i-- ) {
			var message = array[i] 
			body.append( createRow( [ message.message_id, message.auteur_name, message.message_text, Math.floor(message[ attribute][ criteria ]) ] )  )
		}


		table.append( header )
		table.append( body )

		return $( document.createElement("div") ).append( title ).append( table )

	} 
	function swapArray( A, x, y ) {
		A[x] = A.splice(y, 1, A[x])[0];
	}

	//bubble sort ... not the fastest but easy to implement 
	function get5Best( array, attribute, criteria ) {
		var localArray = array.slice(0) ; 
		//WE only need the 5 best 
		for( var i = 0 ; i < 5 ; i++ ) {
			for( var j = 0 ; j < localArray.length - i - 1; j++ ) {
				if( localArray[j][ attribute ][ criteria ] > localArray[j+1][ attribute ][ criteria ] ) swapArray( localArray, j, j+1 ) ;				
			}
		}
		return localArray.slice(-5) ;
	}



	visualisation.render = function() {
		root=$("#tables")

		root.append( createTable( this.messages, "TOP 5: the most ORIGINAL ideas   (on average)", 1, "criteria_average" )  )
		root.append( createTable( this.messages, "TOP 5: the most FEASIBLE ideas    (on average)", 2, "criteria_average" )  )
		root.append( createTable( this.messages, "TOP 5: the most POTENTIAL ideas   (on average)", 3, "criteria_average" )  )
		root.append( createTable( this.messages, "TOP 5: the most INTERESTING ideas (number of interests)", 0, "criteria_count" )  )
		root.append( createTable( this.messages, "TOP 5: the most divergent ideas in terms of ORIGINALITY (on average)", 1, "criteria_stddev" )  )
		root.append( createTable( this.messages, "TOP 5: the most divergent ideas in terms of FEASIBILITY (on average)", 2, "criteria_stddev" )  )
		root.append( createTable( this.messages, "TOP 5: the most divergent ideas in terms of POTENTIALITY (on average)", 3, "criteria_stddev" )  )
		
	}




	visualisation.render2 = function( ) {


		data = this.array



	  xScale.domain([d3.min(data, ValueCriteriaX.bind( this, 1) )-1, d3.max(data,  ValueCriteriaX.bind( this, 1) )+1]);
	  yScale.domain([d3.min(data, ValueCriteriaY.bind( this, 2) )-1, d3.max(data, ValueCriteriaY.bind( this, 2) )+1]);

    // setup fill color
		var cValue = function(d) { return d.message_id % 10 ;},
    color = d3.schemeCategory10;


    //
// add the graph canvas to the body of the webpage
		// x-axis
	  d3.svg.append("g")
	      .attr("class", "x axis")
	      .attr("fill", "#000")
	      .attr("transform", "translate(0," + height + ")")
	      .call(xAxis)
	    .append("text")
	    	.attr("fill", "#000")
	      .attr("class", "label")
	      .attr("x", width)
	      .attr("y", -6)
	      .style("text-anchor", "end")
	      .text("Calories");

	  // y-axis
	   d3.svg.append("g")
	      .attr("class", "y axis")
	      .attr("fill", "#000")
	      .call(yAxis)
	    .append("text")
	      .attr("class", "label")
	      .attr("fill", "#000")
	      .attr("transform", "rotate(-90)")
	      .attr("y", 6)
	      .attr("dy", ".71em")
	      .style("text-anchor", "end")
	      .text("Protein (g)");

		//render a dot for each vote
  	d3.svg.selectAll(".vote")
      		.data(data)
				    .enter().append("circle")
				      .attr("class", function( d ) { return "vote" + " m" + d.message_id + " j" + d.judge_id + (d.criteria[0] ? " interested" : "" )  })				      
				      .attr("r", 2.0 )
				      .attr("cx",xMap.bind( this, ValueCriteriaX.bind( this, this.XaxisCriteriaId ) ) )
							.attr("cy",yMap.bind( this, ValueCriteriaY.bind( this, this.YaxisCriteriaId ) ) )
				      .style("fill", colorByMessageId ) ;


		d3.svg.selectAll(".message")
			.data(this.messages)
				 .enter()
				 	.append("circle")
				 			.each( function(d) { d.expanded = true })
				 			.attr("class", function( d ) { return "message" + " m" + d.message_id + (d.criteria_average[0] ? " interested" : "" )  })				      				      
				      .attr("r", 8.0 )
							.attr("cx", xMap.bind( this, AverageCriteria.bind( this, this.XaxisCriteriaId  ) ))
							.attr("cy", yMap.bind( this, AverageCriteria.bind( this, this.YaxisCriteriaId  ) ))
				      .style("fill", colorByMessageId )
				      .on( "mouseover", mouseOverMessage )
				      .on( "mouseout", mouseOutMessage )
				       .on( "click",  mouseClickMessage)

	}


	//================================================================================
	//MEssage interaction functions 	
	//================================================================================

	function mouseOverMessage( d ) {
		//If not selected expand vote so we can visualize
  	if( d.hidden ) {
  		visualisation.voteToValue( d.message_id )					      		
		} 								
		if( d.expanded ) visualisation.highlightIdee( d.message_id )	
	}
	function mouseOutMessage( d ) {
  	visualisation.colorByMessage( d.message_id )
  	//If not selected hide back the votes
  	if( !d.selected && d.hidden ) {
  		visualisation.voteToAverage( d.message_id )
  		d.wasHidden = false 				      	
		}
  }
  function mouseClickMessage( d ) {
     	//Si le point n'est pas sélectionné
   	if( !d.selected ) {
   		//Deselect everyone
   		d3.svg.selectAll(".message")
   			.each( function(d) { d.selected = false, d.hidden = true  })
   			.classed( "selected", function( d2 ) { return d2 == d } )
   			.classed( "hidden", function( d2 ) { return d2 != d } )
   		//This one is selected
   		d.selected = true 
   		 
   		//update vote visualisation
     	visualisation.voteToAverage( d.message_id, true  )
    	visualisation.voteToValue( d.message_id ) 					      	
    } else {
    	//Back to normal
    	visualisation.voteToValue( )
    	d3.svg.selectAll(".message")
 						.each( function(d) { d.selected = false, d.hidden = true })
 						.classed( "selected hidden",false )
    	d.selected = false ; 					      					 
    }    
  }

  //================================================================================
	//Vote behaviour
	//================================================================================




	visualisation.highlightJudge =function( judgeId ) {
		color = ["gray", "red"];
		d3.selectAll(".vote").style("fill", function(d) { return color[ (d.judge_id == judgeId)?1:0 ];}) 
	}
	visualisation.highlightIdee =function( message_id, exclude ) {
		var filter = (message_id != undefined ) ? ".m"+message_id : "*" 
		filter =  (exclude) ? ":not("+filter+")" : filter 

		var t = d3.transition()
    .duration(150)
    .ease(d3.easeLinear);

		d3.selectAll(".vote").transition(t).style("fill", "gray" )
												 .filter( filter)
												 	.attr("r", 4.0 ) 
												 	.style("fill", colorByAttribute( "message_id" ) )
	}
	visualisation.colorByMessage =function( message_id, exclude ) {
		var filter = (message_id != undefined ) ? ".m"+message_id : "*" 
		filter =  (exclude) ? ":not("+filter+")" : filter 
		
	var t = d3.transition()
    .duration(150)
    .ease(d3.easeLinear);

		d3.selectAll(".vote").transition(t).style("fill",  colorByAttribute( "message_id" )  )
												 .filter( filter)
												 	.attr("r", 2.0 ) 
	}
	
	visualisation.voteToAverage = function ( message_id, exclude ) {
		var filter = (message_id != undefined ) ? ".m"+message_id : "" 
		filter =  (exclude) ? ":not("+filter+")" : filter



		var t2 = d3.transition()
    .duration(750)
    .ease(d3.easeBackIn.overshoot(1.02));


			d3.selectAll(".vote"+filter)
				
				.transition(t2)
				.attr("cx", xMap.bind( this, consolidatedCriteriaX.bind( this, "criteria_average", this.XaxisCriteriaId  ) ))
				.attr("cy", yMap.bind( this, consolidatedCriteriaY.bind( this, "criteria_average", this.YaxisCriteriaId  ) ))

	}
	visualisation.voteToValue = function ( message_id, exclude  ) {
		var filter = (message_id != undefined ) ? ".m"+message_id : "" 
		filter =  (exclude) ? ":not("+filter+")" : filter 
		
		var t2 = d3.transition()
    .duration(1250)
     .ease(d3.easeBackOut.overshoot(1.02));

		d3.selectAll(".vote"+filter)
			
			.transition(t2)
      .attr("cx",xMap.bind( this, ValueCriteriaX.bind( this, this.XaxisCriteriaId ) ) )
			.attr("cy",yMap.bind( this, ValueCriteriaY.bind( this, this.YaxisCriteriaId ) ) )
			.each( function(d) { d.hidden = false } )
	}


	//================================================================================
	//Axis interaction function 	
	//================================================================================
	visualisation.changeAxis = function( attributes, axis ) {
		if( typeof attributes == "object" ) {
			console.log( attributes )
			this.XaxisCriteriaId = attributes[0]
			this.YaxisCriteriaId = attributes[1]
		} else {
			if( axis == "Y" ) this.XaxisCriteriaId = attributes
			else 							this.XaxisCriteriaId = attributes

		}	
		var t = d3.transition()
    .duration(1250)
     .ease(d3.easeBackOut.overshoot(1.02));

		d3.selectAll(".vote").transition(t)
			.attr("cx",xMap.bind( this, ValueCriteriaX.bind( this, this.XaxisCriteriaId ) ) )
			.attr("cy",yMap.bind( this, ValueCriteriaY.bind( this, this.YaxisCriteriaId ) ) )	

		d3.selectAll(".message").transition(t)
			.attr("cx",xMap.bind( this, AverageCriteria.bind( this, this.XaxisCriteriaId ) ) )
			.attr("cy",yMap.bind( this, AverageCriteria.bind( this, this.YaxisCriteriaId ) ) )		

	}

}

)

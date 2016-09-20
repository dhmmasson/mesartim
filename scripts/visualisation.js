define( ["d3", 'jquery', "date_format", "util"], 
function(d3, $, date_format) {
	window.d3 = d3 ;



	function ConsolidatedVote () {}
	_consolidatedVote = Object.create( ConsolidatedVote.prototype )  ; 

	_consolidatedVote.id = 0 
	_consolidatedVote.auteur_id = 0 
	_consolidatedVote.juge_id = 0 
	_consolidatedVote.message_id = 0 
	
	heritableArray( _consolidatedVote, 'criteria', [0,0,0,0] )


	


	
	function ConsolidatedMessage () {}
	_consolidatedMessage = Object.create( ConsolidatedMessage.prototype )  ; 

	_consolidatedMessage.id = 0 
	_consolidatedMessage.auteur_id = 0 
	_consolidatedMessage.nbJudge = 0 
	_consolidatedMessage.message_id = 0 

	heritableArray( _consolidatedMessage, 'criteria_average', [0,0,0,0] )
	heritableArray( _consolidatedMessage, 'criteria_sum', [0,0,0,0] )
	heritableArray( _consolidatedMessage, 'criteria_stddev', [0,0,0,0] )
	heritableArray( _consolidatedMessage, 'criteria_count', [0,0,0,0] )
	heritableArray( _consolidatedMessage, 'criteria_max', [0,0,0,0] )
	heritableArray( _consolidatedMessage, 'criteria_min', [0,0,0,0] )

	
	




	function Visualisation () {} 
	visualisation = Object.create( Visualisation.prototype ) ; 



	visualisation.loadData = function() {
 		if( localStorage.hasOwnProperty("data") ) 
 			this.onDataLoaded( JSON.parse( localStorage.getItem("data")));
 		else 
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
		
		var resultat = data.resultat //all the rough result
			, votes  = {}							 //result consolidated by message/user
			, element 								 //the current rough element being treated
			, consolidatedVote = null
			, consolidatedMessage = null 
			, messages = {}
		for( var i = 0 ; i <  resultat.length ; i++ ) {
			element = resultat[ i ] ; 
			element.id = element.message_id + "_" + element.judge_id
			

			//Create a new vote that consolidate all the criteria
			if( ! votes.hasOwnProperty( element.id ) ) {
				consolidatedVote            = Object.create( _consolidatedVote )
				consolidatedVote.id         = element.id
				consolidatedVote.auteur_id  = element.auteur_id
				consolidatedVote.judge_id   = element.judge_id
				consolidatedVote.message_id = element.message_id
				//Add vote to its consolidated result set
				votes[ element.id ] = consolidatedVote ;
			} 
			consolidatedVote = votes[ element.id ] 
			consolidatedVote.criteria[ element.criteria_id ] = element.value 		

			//Create a new element that aggregate the criteria values by message
			if( !messages.hasOwnProperty( element.message_id ) ) {
				consolidatedMessage 					 = Object.create( _consolidatedMessage ) 
				consolidatedMessage.message_id 	 = element.message_id				
				consolidatedMessage.id 					 = element.message_id
				consolidatedMessage.auteur_id  = element.auteur_id
				consolidatedMessage.nbJudge 	 = 0				
				//Add message to its consolidated result set
				messages[ element.message_id ] = consolidatedMessage ;
			}
			//aggregate the vote		
			consolidatedMessage = messages[ element.message_id ] 
			consolidatedMessage.criteria_sum[ element.criteria_id ] += element.value 	
			consolidatedMessage.criteria_min[ element.criteria_id ] = Math.min( consolidatedMessage.criteria_min[ element.criteria_id ] ,  element.value 	) 
			consolidatedMessage.criteria_max[ element.criteria_id ] = Math.max( consolidatedMessage.criteria_max[ element.criteria_id ] ,  element.value 	) 
			consolidatedMessage.criteria_count[ element.criteria_id ] ++			

			//link the vote to the message 
			consolidatedVote.consolidatedMessage = consolidatedMessage ; 
		}
		
		//compute the mean by message
		for( var message_id in messages ) {
			for( var criteria_id = 0 ; criteria_id < messages[ message_id ].criteria_sum.length ; criteria_id++ ) {
				messages[ message_id ].criteria_average[ criteria_id ] = messages[ message_id ].criteria_sum[ criteria_id ] / messages[ message_id ].criteria_count[ criteria_id ]
			}
		}
		


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
				messages[ message_id ].criteria_stddev[ criteria_id ] = Math.sqrt( messages[ message_id ].criteria_stddev[ criteria_id ] / messages[ message_id ].criteria_count[ criteria_id ]) 
			}
			this.messages.push( messages[ message_id ] )
		}


		this.init() ; 
		this.render()
		
	}



	//Function to download the data to computer 
	//Tkn from http://jsfiddle.net/koldev/cw7w5/
	var saveData = (function () {
    var a = document.createElement("a");
    document.body.appendChild(a);
    a.style = "display: none";
    return function (data, fileName) {
        var blob = new Blob( [data], {type: "octet/stream"}),
            url = window.URL.createObjectURL(blob);
        a.href = url;
        a.download = fileName;
        a.click();
        window.URL.revokeObjectURL(url);
    };
	}());

	date_format.extendPrototype();
	visualisation.toCSV = function() {
		var votes = this.votes 
			, resultat = "" 
		for( var label in _consolidatedVote ){
			resultat += label + "," ;
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


	visualisation.render = function( ) {


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
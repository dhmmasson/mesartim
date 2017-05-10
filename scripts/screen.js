define( ['jquery', "util"], mainFunction ) ;

function mainFunction($) {
	screen = { currentId : 1 } ;
	screen.init = function() {
		$("button.option").click( submitOption ) ;


		$.get( "/api/screen/first", loadNext.bind( screen ))
		$.get( "/api/screen/mine", loadPreviousScreen.bind( screen ))

	}
	//Call back to render the next message to screen
	function loadNext( reponse ) {
		console.log( reponse ) 
		if( reponse.success == true ) {
			screen.currentId = reponse.message.id
			$( "#messageId" ).text( reponse.message.id )
			$( "#messageText" ).text( reponse.message.description )
			$( "#messageCategory" ).text( reponse.message.colname + "/" + reponse.message.rowname  )			
		} else if ( reponse.success == "done" ) {
			$( "#doneMessage" ).text( "You have screened all the ideas. Thank you!" ) 
		}
	}
	//Submit what option the user choose for the message
	function submitOption() {
		if( screen.currentId ) {

			$.post( "/api/screen/next"
							, { id : screen.currentId
									, value : $(this).data( "value" ) 
								}
							, loadNext.bind( screen )
						)
			addScreenElement( screen.currentId  , $(this).data( "value" )  ) 
		}
	}

	function addScreenElement( id, value ) {
		//Get the element if exist and remove it from the list
		var $span = $( "#screenElement_"+id ).detach()  ;
		//Create the element otherwhise
		if( $span.length == 0  ) {
			$span = $( document.createElement( "a" ) ) 
			$span.attr("id", "screenElement_"+id ) 
			$span.addClass("btn screenedElement")
			$span.text( id )
			$span.click( reloadSpecificScreen ) ;
		}
		//Change color and append last
		$span.removeClass(colorRemover ) ;
		$span.addClass(" color_" + value ) ;
		$( "#previousScreen" ).append( $span ) 

	
	}
	function colorRemover (index, className) {
		return (className.match (/(^|\s)color_\d+/g) || []).join(' ');
	};
	function loadPreviousScreen( reponse ) {
		if( reponse.success ) {
			for( var i in reponse.screen ) {
				var screenElement = reponse.screen[i]
				addScreenElement( screenElement.id, screenElement.value ) ; 
			}
			 
		}
		
	}

	function reloadSpecificScreen() {
		$.get("/api/screen/"+ $(this).text() , loadNext.bind( screen ) ) ;
	}
	
	window.screen = screen ; 
	return screen ; 
}


define(
	['jquery', 'socketio', 'materialize'],
  function($, io, mdl) {
  	function foo(){
  		console.log("foo");
  	}


  	//===============================================================
//Sliders=====================
//===============================================================
function changeSliderFilling( e ) {
  var $this = $(this) 
    , filling = $this.data("filling")
  $this.parent(".mesartimSliderWrapper").addClass("set")
  filling.addClass("red lighten-3")
  filling.width( $this.val() +"%" ) ; 
} 

function mesartimSlider(){ 
  $(this).each( function() {
    
    var $this = $(this) 
      , wrapper = $("<span>").addClass("mesartimSliderWrapper")
      , filling = $("<span>").addClass("mesartimFilling")  
    $this.wrap( wrapper ) ;
    $this.before( filling )
    $this.data("filling", filling )
    $this.change(changeSliderFilling)
    $this.mousemove(changeSliderFilling)
    $this.val(0)
  })
}

$.fn.mesartimSlider = mesartimSlider ;


    function generateMatrix( root, rows, columns ) {
      var baseName = root.attr("id")  
      , table = $("<table>").data( "basename", baseName ) 
      , line = $("<tr>") ; 

      line.append("<th>Choisir une case</th>") ; 
      for( var columnIndex = 0 ; columnIndex < columns.length ; columnIndex++ ) {
        line.append( $("<th>"+columns[ columnIndex ].title+"</th>").attr( "id", baseName+"_column_"+columnIndex   )   ) ; 
      }
      table.append( line ) ; 

      for( var rowIndex = 0 ; rowIndex < rows.length ; rowIndex++ ) {
        line = $("<tr>") ; 
        line.append( $("<th>"+rows[ rowIndex ].title +"</th>").attr( "id", baseName+"_line_"+rowIndex   )  ); 
        for( var columnIndex = 0 ; columnIndex < columns.length ; columnIndex++ ) {
          var element = $( "<td> </td>" ) 

          , radioId  = baseName + "_radio_" +  rowIndex + "_" + columnIndex
          , labelId  = baseName + "_label_" +  rowIndex + "_" + columnIndex
          , radio = $("<input>").attr( 
            { type : "radio"
            , name : baseName
            , id   : radioId
            , class : "with-gap"
            , value : rowIndex + "_" + columnIndex
          })     
          , label = $("<label>").attr(
            { for : radioId
              , id  : labelId 
            })
          radio.change( categoryChosen )
          radio.data( { columnIndex : columnIndex
            , rowIndex : rowIndex
            , columnName : columns[ columnIndex ].title
            , rowName : rows[ rowIndex ].title  } )
          element.append( radio )
          element.append( label )
          line.append(element) ; 
        }
        table.append( line ) ; 
      }

      root.empty().append( table ) ;   

      //put header 
    }



  }


)
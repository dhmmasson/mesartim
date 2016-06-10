requirejs.config({
  paths: {
    requirejs: '../bower_components/requirejs/require',
    socketio: '/socket.io/socket.io.js',
    jquery: '../bower_components/jquery/dist/jquery',
    'jqueryui': '../bower_components/jquery-ui',
    'materialize': '../../bower_components/materialize/dist/js/materialize',
    'hammerjs':    '../../bower_components/Materialize/js/hammer.min',
    'jquery-hammerjs':'../../bower_components/Materialize/js/jquery.hammer'        
  },
  packages: [

  ],
  shim: {
   
    socketio: {
      exports: 'io'
    }, 
    'materialize': {
      deps: ['jquery', 'hammerjs', 'jquery-hammerjs']
    },
    'jquery': {
      exports: '$'
    },
     "jqueryui": {
      //exports: "$",
      deps: ['jquery']
    }
  }
});

// Start the main app logic.
requirejs(['jquery', 'socketio', 'materialize', 'util', 'jqueryui/ui/sortable'],
  function   (io, mdl, util, ui) {
    //  var socket = io();
    console.log(ui)
    token = localStorage.getItem('token') || null ; 
    since = 0 


  //  $("#register").submit( submitRegistration ) ; 

  page = location.pathname.slice(1);


    //ALL 
    $(".button-collapse").sideNav();
    
    if( page == "login") {
      //registration
      $.get("seance", processListSeances )
      $('select').material_select();
    } else {

      //pour generation et vote 
      getSeanceColumnAndRows()    ;
      $('input[type="radio"]').change( categoryChosen )
      $("input.hidden").parents("td").click( propagateCellClickToInput ) ;
      if( page == "generation"){
        //generation
        $("#addIdea").submit( addIdea )
        getOwnIdea(0)
      } else if( page == "vote"){
        //vote
        getAllIdeas(0) ;
        $("form.vote").submit( voteIdea ) ;
        $("input.mesarthimSlider").mesartimSlider() 
        restoreVote() 
      } else if ( page = "rank") {
        addVoteValue()
        $("input.mesarthimSlider").mesartimSlider() 
        $(".ideas").mesartimSortable(".criteriaSorter")
        
      }
    }





//================================================================
// Rank page
//================================================================
function addVoteValue() {
  $.get("/api/annotations/mine", processVoteValue ) ;
}
function processVoteValue( data ) {
  console.log( data )
  for (var i = 0; i < data.result.length; i++) {
    voteData = data.result[i] ;    
    voteElement = $("#idea_" + voteData.message_id ) ;
    voteElement.data( "criteria_"+voteData.criteria_id , voteData.value ) ;    
  }
  $($(".criteriaSorter")[2]).click() 
}



//===============================================================
//VOTE SUR UNE IDÉE =====================
//===============================================================
function voteIdea( e ){
  e.preventDefault();
  var $form = $( this )
    , data =  $form.serializeArray()
    , $header= $form.parent("li.idea")
    , message_id = $form.data("message_id")  

    $header.addClass("voted")

  criteria = [] ;
  for( var i = 0 ; i < data.length ; i++ ) {
    console.log( data[i] )
    var [ ok , id ] = data[i].name.match(/criteria_(\d+)/) || []
    if( ok ){
      criteria.push(
      { message_id : message_id
      , criteria_id : id 
      , value : data[i].value
      })
    if( id == 0 ) $header.addClass("interested")
    }
  }
  console.log( criteria )

  $.post("/api/message/"+ message_id +"/annotate", { criteria : criteria }, processVoteIdea ) ;
}
function restoreVote() {
  $.get("/api/annotations", processRestoreVote)


}
function processRestoreVote( data ) {
  console.log( data )
  for( var i = 0 ; i < data.result.length ; i++ ) {
    vote = data.result[i] ;
    $slider = $("#idea_" + vote.message_id + "_criteria_" + vote.criteria_id )
    console.log( $slider )
    $slider.val( vote.value )
    $slider.change() 
  }

    
}
function processVoteIdea( res ){

}

//===============================================================
//SOUMETTRE UNE IDÉE AU SERVEUR=====================
//===============================================================
function addIdea(e) {       
  var message =  $( this ).serialize()
  console.log( message )
  if (message.content != "" )
    $.post("api/message/new", $( this ).serialize() , processAddIdea )
  e.preventDefault();
}
function processAddIdea( res ) {
  if( res.success ){
    getOwnIdea( since ) ;
  }
}   


//===============================================================
//Mise à jour de la grille=====================
//===============================================================
function categoryChosen( e ) {
  var radio = $(e.target)
  , columnIndex =  radio.data( "columnindex" ) 
  , rowIndex    =  radio.data( "rowindex" )       
  , columnName  =  radio.data( "columnname" )
  , rowName     =  radio.data( "rowname" )

  highlightHeadersAndCell( radio, rowIndex, columnIndex )
  changeTitle( rowName, columnName )
  setIdeaSubmissionOk()
  //hide yo wife
  hideIdeasDifferentCategory( rowIndex, columnIndex ) ;
}



function changeTitle( rowName, columnName ){
  var titre = "catégorie selectionnée : "+ rowName + "/" + columnName 
  $("#sectionSelectionTitle").text( titre )
  titre = "Ajouter idée à la catégorie : " + rowName+ "/" + columnName
  $("#addIdeaTitle")
  .text( titre )
  .attr("title", titre )
}

function highlightHeadersAndCell(radio, rowIndex, columnIndex ) {
  var table = $(radio.parents("table")[0] ) 
  , baseName = table.data("basename")      
  //unhiglight all cells and headers
  table.find("th,td").removeClass("active")
  //Highlight the current cell
  $(radio.parents("td")[0] ).addClass("active"); 
//Highlight header
$("#" + baseName + "_column_" + columnIndex).addClass("active")
$("#" + baseName + "_row_" +   rowIndex ).addClass("active")
}

function hideIdeasDifferentCategory( rowIndex, columnIndex ) {
 $(".idea:not(.row_"+rowIndex+".col_"+columnIndex+")").filter(":not(.hidden)")
 .addClass("hidden")
 .slideUp( 500 )                      
 $(".idea.hidden.row_"+rowIndex+".col_"+columnIndex)
 .removeClass("hidden") 
 .slideDown(400)        
}
function propagateCellClickToInput() {
  inputElement = $( $(this).find("input")[0] )
  inputElement.prop("checked", true ) 
  inputElement.change() ;
}
function setIdeaSubmissionOk() {
  $('#submitIdea').prop("disabled", false )
  $('#submitIdea').find('i').text("playlist_add")
  $('#submitIdea').find('span').text("Soumettre votre idée")
}





function submitRegistration( e ) {
  console.log( $( this ).serialize() );
  $.post("/register", $( this ).serialize() , goToAddMessage )
  e.preventDefault();
}

function processListSeances( res ) {
  seance =  $("#seance")
  for( var i = 0 ; i < res.length ; i++ ){
    seance.append( "<option value='"+res[i].id+"'>"+res[i].titre+"</option>" )            
  }
  seance.material_select()          
}


function getAllIdeas( since ) {
 $.get( "api/message/all"
   , { since : since }
   , processGetOwnIdea ) ;
}

function getOwnIdea( since ) {
  $.get( "api/message/mine"
   , { 
     since : since }
     , processGetOwnIdea ) ;
}
function processGetOwnIdea( res ) { 
letters = "ABCDFGHIJKLMNOPQRSTUVWXYZ"  
  if( res.success ) {
    console.log( res )
    ownIdea = $("#ownIdea")
    for( var i = 0 ; i < res.result.length ; i++ ) {
      var item = res.result[i]
        , newBadge = $("<span class='chip green right'>").text("new") 

      ownIdea.prepend( 
        $("<li>" )
        .addClass("collection-item")
        .addClass("truncate")
        .addClass("yellow lighten-"+ (3 + item.id % 2))
        .text( item.text )              
        .append( newBadge )
        //.append( $("<span class='chip right'>").text( columnNames[item.column_position].title ) )                                
        .append( $("<span class='chip right'>")
            .addClass("chip right clickable")
            .text( letters[item.row_position] + ( item.column_position + 1 ))  
            .attr( "title", rowNames[item.row_position].title  + "/" + columnNames[item.column_position].title )
            .data( "category", $("#grille_radio_"+item.row_position+"_"+ item.column_position )) 
            .click( function(e) { $(e.target).data( "category").change() })
                )

            

        ) ;
      newBadge.fadeOut(5000, function() { $(this).remove(); })
      grilleElement = $("#grille_label_"+item.row_position+"_"+item.column_position) ;
      grilleElement.text(grilleElement.text()*1+1)
      since = Math.max( since, item.id ) ;
    }
  }
}

    //all the necessary info are in the token
    function getSeanceColumnAndRows()  {
      $.get("/api/seance/names", processSeanceColumnAndRows)
    }
    function processSeanceColumnAndRows( data ) {
      if( data.success ) {
        console.log( data )
        rowNames = data.rowNames ; 
        columnNames = data.columnNames ; 
      }
    }



  });
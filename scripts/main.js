requirejs.config({
  paths: {
    requirejs: '../bower_components/requirejs/require',
    socketio: '/socket.io/socket.io.js',
    jquery: '../bower_components/jquery/dist/jquery',
    'jqueryui': '../bower_components/jquery-ui',
    'materialize': '../../bower_components/Materialize/dist/js/materialize',
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


  $(function() {
     var pgurl = window.location.href.substr(window.location.href.lastIndexOf("/")+1);
     $("nav ul li a").each(function(){
          if($(this).attr("href") == pgurl || $(this).attr("href") == '' )
          $(this).parents("li").addClass("active");
        
     })
  });

  page = location.pathname.slice(1);


    //ALL 
    $(".button-collapse").sideNav();
    
    if( page == "login" || page == "") {
      //registration
      $.get("seance", processListSeances )
      $('select').material_select();
    } else {

      //pour generation et vote 
      getSeanceColumnAndRows( init ) ;
    }

function init() {
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
    

    var tab = data[i].name.match(/criteria_(\d+)/) || []
      , ok = tab[1]
      , id = tab[1] ;
    console.log( "coucou",  tab, ok, id )  
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
  $.get("/api/annotations/mine", processRestoreVote)


}
function processRestoreVote( data ) {
  console.log( data )
  for( var i = 0 ; i < data.result.length ; i++ ) {
    var vote = data.result[i] 
      , $slider = $("#idea_" + vote.message_id + "_criteria_" + vote.criteria_id )
      , $header= $slider.parents("li.idea").addClass("voted")
       
    if( vote.criteria_id == 0 ) $header.addClass("interested")    
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
  
  if (message.content != "" )
    $.post("api/message/new", $( this ).serialize() , processAddIdea )
  
  e.preventDefault();
}
function processAddIdea( res ) {
  if( res.success ){
    $("#ideaSubmissionField").val("")
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
        , newBadge = $("<span class='mesartimNew'>").text("new") 

      ownIdea.prepend( 
        $("<li>" )
        .addClass("collection-item row mesartimIdeaList valign-wrapper") 
        .append( $("<i>")
          .addClass("left")
          .text(item.id) )      
        .append( $("<span>")
          .addClass( "ideaText valign")
          .text( item.text ) )
        .append( newBadge )
        .append( $("<a>")
            .addClass("mesartimChip clickable waves-effect waves-light")            
            .text( letters[item.row_position] + ( item.column_position + 1 ))  
            .attr( "title", rowNames[item.row_position].title  + "/" + columnNames[item.column_position].title )
            .data( "category", $("#grille_radio_"+item.row_position+"_"+ item.column_position )) 
            .click( function(e) { 

              $(e.target).data( "category").prop("checked", true).change() })
                )

            

        ) ;
      newBadge.fadeOut(5000, function() { $(this).remove(); })
      grilleElement = $("#grille_label_"+item.row_position+"_"+item.column_position) ;
      grilleElement.text(grilleElement.text()*1+1)
      since = Math.max( since, item.id ) ;
    }
    Waves.displayEffect();
  }
}

    //all the necessary info are in the token
    function getSeanceColumnAndRows( next )  {
      $.get("/api/seance/names", function( data ) {
        processSeanceColumnAndRows( data )
        next()
      })
    }
    function processSeanceColumnAndRows( data ) {
      if( data.success ) {
        rowNames = data.rowNames ; 
        columnNames = data.columnNames ; 
      }
    }



  });
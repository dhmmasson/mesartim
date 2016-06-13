define(
	['jquery', 'socketio', 'materialize'],
  function($, io, mdl) {
  	function foo(){
  		console.log("foo");
  	}


  	//===============================================================
    //Sliders=====================
    //===============================================================
    $.__mesartim_sortingInProgress = true ; 


    function changeSliderFilling( e ) {      
      var $this = $(this) 
      , filling = $this.data("filling")
      $this.parent(".mesartimSliderWrapper").addClass("set")
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
        $this.on('input', changeSliderFilling)
        changeSliderFilling.apply( this )
        //$this.val(0)
      })
    }
    function sortable( criteriaSelector ) {
      $(this).each( function() {
          ideasContainer = $(this) ;
         // criteriaSelector = ".criteriaSorter"
        $(criteriaSelector).click( function( e ) {      
          changeCriteria( $(ideasContainer), $(this).data("criteria")  )
        })

        ideasContainer.find(".mesarthimSlider").on('input', feedfowardChangeValue ) ; 
        ideasContainer.find(".mesarthimSlider").on('change', refreshList ) ; 
      })
    }
   

    $.fn.mesartimSlider = mesartimSlider ;
    $.fn.mesartimSortable = sortable ;




    function feedfowardChangeValue () {
      var criteria =  "criteria_" + $(".criteriaSorter.active").data("criteria") 
        , $this = $(this)
        , idea = $(this).parents(".idea")
        , i = 0 
        , positif = true

      if( $this.val() > idea.data( criteria ) ) {    
        positif = true
        while( ($suiv = idea.prev()) && $suiv.find( "input" ).val() <  $this.val() ) {
          i++
          idea =  $suiv           
        }         
      } else if( $this.val() < idea.data( criteria ) ) {   
        positif = false     
        while( ($suiv = idea.next()) && $suiv.find( "input" ).val() >  $this.val() ) {
          i++
          idea =  $suiv           
        } 
        
      }
      popup = $this.siblings( ".popup" ) 
     
        console.log( i )
        popup = $this.siblings( ".popup" ) 
        //if there is no popup span create ones
        if( popup.length <= 0  ) {
          popup = $("<span>").addClass( "popup" ).css("opacity" ,0)
          $this.after( popup )
        }
        popup.fadeTo(100, 1 )
        popup.text( (positif ? "+":"-")+i + (positif ? "↑":"↓") )
        if( positif ) {
          popup.addClass("positif").removeClass("negatif") 
        }else {
          popup.addClass("negatif").removeClass("positif")  ;
        }
        if( i == 0 ) {
           popup.removeClass("negatif").removeClass("positif")  ;
           popup.text( 0 )
        }  
    }

    function sortByCriteria( rootElement, criteria_id, speed  ) {
      $.__mesartim_sortingInProgress  = true ; 
      var array = $( rootElement.children() )      
      , changed = false ; 
      for( var i = 1 ; i < array.length ; i++ ) {
        valeurElement1 = $(array[i-1]).data( "criteria_" + criteria_id ) 
        valeurElement2 = $(array[i]).data( "criteria_" + criteria_id ) 

        if( valeurElement1 <  valeurElement2 ){
          changed = true
          var temp = array[i-1] ;
          array[i-1] = array[i];
          array[i] = temp ;
          i++
        } 
      }

      if( changed ) {
        rootElement.children().detach()
        rootElement.append( array )
        setTimeout(sortByCriteria, speed, rootElement, criteria_id, speed  ) 
         $.__mesartim_sortingInProgress  = true 
      } else {
        $.__mesartim_sortingInProgress  = false ;
      }
    }

    function changeCriteria( rootElement, criteria_id) {
      $.__mesartim_sortingInProgress  = true 
      var array = $( rootElement.children() )
      for (var i = 0; i < array.length; i++) {
        var value  = $(array[i]).data(  "criteria_" + criteria_id )
        , slider = $(array[i]).find("input")
        slider.val( value ).change()  
      }
      sortByCriteria( rootElement, criteria_id, 10 )
    }
    function refreshList( ) {
      var criteria_id = $(".criteriaSorter.active").data("criteria") 
      if( !$.__mesartim_sortingInProgress  ) {                
        $(this).parents(".idea").data( "criteria_" + criteria_id, $(this).val() )
        window.__debug = $(this)        
        sortByCriteria(  $(".ideas"), criteria_id, 50 )
        popup = $(this).siblings( ".popup" ) 
        if( popup.length > 0  ) popup.fadeTo(500, 0 )
      } else {
        
      }
    }

    







  }


  )
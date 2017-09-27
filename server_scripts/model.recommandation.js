/**  ==== MODEL = Evenement =====


**/
var recommandation = new (function recommandationModel() {})()  

module.exports = init ;

function init( model ) {	
	recommandation.get = model.promiseQuery( 
		[ model.sql.question.category.byEvenementId
		, model.sql.event.detail.byEvenementId 
		, model.sql.user.all.byEvenementId 
		, model.sql.reponse.mine.byEvenementId
		, model.sql.reponse.other.byEvenementId
		]
	, requete => [ requete.param( "event_id"),requete.param( "event_id"),requete.param( "event_id")  ]  ) 
	return recommandation ;
}


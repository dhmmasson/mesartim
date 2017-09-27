/**  ==== MODEL = Evenement =====


**/
var question = new (function QuestionModel() {})()  

module.exports = init ;

function init( model ) {	
	question.getAllBySeance = model.promiseQuery( 
		[ model.sql.question.dialogy.byParticipationId
		, model.sql.question.category.byParticipationId
		, model.sql.event.detail.byParticipationId  
		]
	, requete => [requete.params.id, requete.params.id, requete.params.id ]  ) 
	return question ;
}


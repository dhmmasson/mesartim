/**  ==== MODEL = Evenement =====


**/
var reponse = new (function ReponseModel() {})()  

module.exports = init ;

function init( model ) {	
	reponse.add = model.promiseQuery( model.sql.reponse.add, prepareReponse ) 
	reponse.mine = model.promiseQuery( model.sql.reponse.mine.byEvenementId, requete => 	[ requete.param("event_id"), requete.user.user_id ]  ) 
	reponse.other = model.promiseQuery( model.sql.reponse.other.byEvenementId, requete => [ requete.param("event_id"), requete.user.user_id ]  ) 
	reponse.all = model.promiseQuery( model.sql.reponse.all.byEvenementId, requete => 		[ requete.param("event_id") ]  ) 
	return reponse ;
}


function prepareReponse( requete ) {
	var reponses = JSON.parse( requete.body.reponses )
	
	result = [] 
	for( var i = 0 ; i < reponses.length ; i++ ) {
		reponse = reponses[i]
		result.push( [ reponse.participation_id, reponse.question_id, reponse.value ])
	}
	return [result] 
}
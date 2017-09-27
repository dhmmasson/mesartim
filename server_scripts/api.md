
GET /api/event_2/reponse/all
GET /api/event_2/reponse/other
GET /api/event_2/reponse/mine

POST /api/event_2/reponse/add

GET /api/event_2/detail

POST /api/event_2/participate

GET /api/event_2/isParticipating
GET /api/event_2/isProfileComplete

#USER
/api/user/updateInfo

#CARNET
GET /carnet/mine => { id : [] }  
GET /carnet/create => { id : X }

GET /carnet_2/cards => { cards : [] }
GET /carnet_2/add/:cardId  => { success}
GET /carnet_2/remove/:cardId  => { success}

#INTERACTION
POST /interaction_:name/user_:user_id/
GET /interaction/aboutMe
GET	/interaction/mine


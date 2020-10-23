var passport = require('passport')
	, Auth0Strategy = require('passport-auth0')
	, jwt = require('jsonwebtoken')

function init( config ) {
 	var authenticationEngine = new( function AuthenticationEngine(){} ) () 	 	
 	authenticationEngine.check 		= check.bind( authenticationEngine ) ;
	//authenticationEngine.register = register.bind( authenticationEngine ) ;
	authenticationEngine.config = config ;
	authenticationEngine.strategy = new Auth0Strategy(
  	{ domain:      	config.Auth0.public.domain
    , clientID:     config.Auth0.public.client_id 
    , clientSecret: config.Auth0.private.client_secret 
    , callbackURL:  config.Auth0.public.callbackURL 
  	 }, function(accessToken, refreshToken, extraParams, profile, done) {
    // accessToken is the token to call Auth0 API (not needed in the most cases)
    // extraParams.id_token has the JSON Web Token
    // profile has all the information from the user
    console.log( "done authenticatation")

    return done(null, profile);
  });

  passport.use(authenticationEngine.strategy);	  

 	return authenticationEngine;

}

//Middleware 
function check(requete, reponse, next) {
  // check header or url parameters or post parameters for token
  var token = requete.body.token || requete.query.token || requete.headers['x-access-token'] || requete.cookies.token;
  requete.token = token ; 
  
  //Fake user for testing
  if( this.config.Auth0.private.user !== undefined  ) {
    requete.decoded = { user : auth0.private.user}
    next() ;
    return 
  }  
  if (token) {
    // verifies secret and checks exp
    jwt.verify(token, this.config.jwt.secret , wrapProcess( authenticationValid, authenticationInvalid, requete, reponse, next ));
  } else {
    // if there is no token
    // return an error
    noTokenFound( requete, reponse ) ;     
  }
}




//================================================================
//Express utility functions
//================================================================
function wrapProcess( callBackSuccess, callBackError, ...args ) {
  return ( err, data ) => { 
    if( err ) 
      callBackError.apply(this, (args.unshift( err ), args ) ) ; 
    else 
      callBackSuccess.apply( this, (args.push( data ), args )  ) ;
  } 
}

function noTokenFound( requete, reponse ) {
  console.log( "No Token found " )
  console.log( "Origin ", requete.originalUrl )
  reponse.cookie( 'returnTo', requete.originalUrl, { signed: true  });
  return reponse.redirect("/login")
}

function authenticationInvalid( err, requete, reponse, next ) {
  console.log( "Token invalid ", err )
  console.log( "Origin ", requete.originalUrl )
  reponse.cookie( 'returnTo', requete.originalUrl, { signed: true });
  return reponse.redirect("/login")
  
}

function authenticationValid(requete, reponse, next, decoded ) {
  console.log( "authenticationValid: set requete.user")
	console.log( decoded ) ;
	requete.accessToken = decoded ;
  requete.user = decoded.user;  
	requete.body.seance_id = decoded.participation.seance_id 
  if( !requete.body.user_id ) requete.body.user_id = decoded.user_id ;
  next();
}


module.exports = init ; 
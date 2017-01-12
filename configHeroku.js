module.exports = 
{	secret : "it4IsG6uTKyn17nqucTnkmLS8kckboZu"		 
, database: {	host:  "127.0.0.1" 		 
	    ,	user:  "ideavaluation"		 
	    ,	password: process.env.SQL_PASSWORD   || "mesartim"
	    ,	database: process.env.SQL_DATABASE    || "ideavaluation"
	    , multipleStatements: true
                , connectionLimit : 100
                , queueLimit : 10
                , waitForConnections : true 
                , acquireTimeout : 3000
						}
, port : process.env.PORT 
};
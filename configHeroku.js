module.exports = 
{	secret : process.env.SECRET 							 
, database: {	host: process.env.SQL_HOST 		 
						,	user: process.env.SQL_USER 		 
						,	password: process.env.SQL_PASSWORD   
						,	database: process.env.SQL_DATABASE    
						, multipleStatements: true
						}
, port : process.env.PORT 
};
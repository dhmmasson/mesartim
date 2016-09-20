module.exports = 
{	secret : "v9ycrpqng82zjfo7jqy9rb93voypa2ds"
, database: {	host: process.env.SQL_HOST 		 || '172.22.111.37'
						,	user: process.env.SQL_USER 		 || 'mesartim'
						,	password: process.env.SQL_PASSWORD   || 'hamal'
						,	database: process.env.SQL_DATABASE    || 'mesartim'
						, multipleStatements: true
						, connectionLimit : 1000
						}
, port : process.env.PORT || 5009
};


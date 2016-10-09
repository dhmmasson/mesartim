module.exports = 
{  secret : process.env.SECRET     									|| "adasdasdasd"           
, database: {  host: process.env.SQL_HOST      			|| "127.0.0.1"
            ,  user: process.env.SQL_USER     			|| "root"
            ,  password: process.env.SQL_PASSWORD   || "hamal"
            ,  database: process.env.SQL_DATABASE   || "mesartim"  
            , multipleStatements: true
            , connectionLimit : 100
            }
, port : process.env.PORT || 5009
};
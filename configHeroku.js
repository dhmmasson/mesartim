module.exports = 
{  secret : process.env.SECRET     									|| "adasdasdasd"           
, database: {  host: process.env.SQL_HOST      			|| "172.22.111.68"
            ,  user: process.env.SQL_USER     			|| "IdeaValuation"
            ,  password: process.env.SQL_PASSWORD   || "Enboislol33pma"
            ,  database: process.env.SQL_DATABASE   || "IdeaValuation"  
            , multipleStatements: true
            , connectionLimit : 100
            }
, port : process.env.PORT || 5009
};
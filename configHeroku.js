module.exports = 
{  secret : process.env.SECRET     					|| "Z7nQTFhYP7inCTJbOqG4mjw0avs1jnHw"           
, database: {  host: process.env.SQL_HOST      		|| "localhost"
            ,  user: process.env.SQL_USER     		|| "root"
            ,  password: process.env.SQL_PASSWORD   || "" //9awHDSYSmLESuDZt
            ,  database: process.env.SQL_DATABASE   || "ideavaluation"  
            , multipleStatements: true
            , connectionLimit : 1000
            }
, port : process.env.PORT || 5009
};
START TRANSACTION; 
INSERT INTO lexique( `name`, description ) VALUE( ?, ? ) ;
INSERT INTO seance_has_lexique( seance_id, lexique_id ) VALUE( ?, LAST_INSERT_ID() ) ;
COMMIT ;

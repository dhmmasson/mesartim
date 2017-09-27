SELECT * FROM lexique
JOIN seance_has_lexique ON lexique.id = lexique_id 
WHERE seance_id = ? ;


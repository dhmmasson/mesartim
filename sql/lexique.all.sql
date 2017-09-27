SELECT token.*
FROM token 
JOIN lexique on token.lexique_id = lexique.id
JOIN seance_has_lexique on lexique.id = seance_has_lexique.lexique_id
WHERE lexique.name = ? AND seance_id = ? ;

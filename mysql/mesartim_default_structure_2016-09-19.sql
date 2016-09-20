# ************************************************************
# Sequel Pro SQL dump
# Version 4541
#
# http://www.sequelpro.com/
# https://github.com/sequelpro/sequelpro
#
# Host: 172.22.111.37 (MySQL 5.6.17)
# Database: mesartim
# Generation Time: 2016-09-19 15:50:06 +0000
# ************************************************************


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;


# Dump of table annotation
# ------------------------------------------------------------

DROP TABLE IF EXISTS `annotation`;

CREATE TABLE `annotation` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `message_id` int(11) NOT NULL,
  `criteria_id` int(11) NOT NULL,
  `value` int(11) DEFAULT NULL,
  `comment` text,
  `datecreation` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_user_has_Message_Message1_idx` (`message_id`),
  KEY `fk_user_has_Message_user1_idx` (`user_id`),
  KEY `fk_Vote_type1_idx` (`criteria_id`),
  CONSTRAINT `annotation_ibfk_1` FOREIGN KEY (`message_id`) REFERENCES `message` (`id`),
  CONSTRAINT `fk_user_has_Message_Message1` FOREIGN KEY (`Message_id`) REFERENCES `message` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `fk_user_has_Message_user1` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `fk_Vote_type1` FOREIGN KEY (`criteria_id`) REFERENCES `criteria` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8;



# Dump of table columnname
# ------------------------------------------------------------

DROP TABLE IF EXISTS `columnname`;

CREATE TABLE `columnname` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `seance_id` int(11) NOT NULL,
  `position` int(11) NOT NULL,
  `title` text NOT NULL,
  `datecreation` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `table_id` (`seance_id`),
  CONSTRAINT `columnname_ibfk_1` FOREIGN KEY (`seance_id`) REFERENCES `seance` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;



# Dump of table criteria
# ------------------------------------------------------------

DROP TABLE IF EXISTS `criteria`;

CREATE TABLE `criteria` (
  `id` int(11) NOT NULL,
  `description` text NOT NULL,
  `type` enum('numeric','boolean') NOT NULL,
  `multiple` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;



# Dump of table lien
# ------------------------------------------------------------

DROP TABLE IF EXISTS `lien`;

CREATE TABLE `lien` (
  `Message_id_parent` int(11) NOT NULL,
  `Message_id_children` int(11) NOT NULL,
  `datecreation` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`Message_id_parent`,`Message_id_children`),
  KEY `fk_Message_has_Message_Message2_idx` (`Message_id_children`),
  KEY `fk_Message_has_Message_Message1_idx` (`Message_id_parent`),
  CONSTRAINT `fk_Message_has_Message_Message1` FOREIGN KEY (`Message_id_parent`) REFERENCES `message` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `fk_Message_has_Message_Message2` FOREIGN KEY (`Message_id_children`) REFERENCES `message` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8;



# Dump of table message
# ------------------------------------------------------------

DROP TABLE IF EXISTS `message`;

CREATE TABLE `message` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `participation_id` int(11) NOT NULL,
  `text` text NOT NULL,
  `column_id` int(11) NOT NULL,
  `row_id` int(11) NOT NULL,
  `datecreation` datetime DEFAULT CURRENT_TIMESTAMP,
  `datemodification` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_Message_participation1_idx` (`participation_id`),
  CONSTRAINT `fk_Message_participation1` FOREIGN KEY (`participation_id`) REFERENCES `participation` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8;



# Dump of table participation
# ------------------------------------------------------------

DROP TABLE IF EXISTS `participation`;

CREATE TABLE `participation` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `seance_id` int(11) NOT NULL,
  `datecreation` datetime DEFAULT CURRENT_TIMESTAMP,
  `lastLogin` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `seance_id` (`seance_id`,`user_id`),
  KEY `fk_user_has_seance_seance1_idx` (`seance_id`),
  KEY `fk_user_has_seance_user_idx` (`user_id`),
  CONSTRAINT `fk_user_has_seance_seance1` FOREIGN KEY (`seance_id`) REFERENCES `seance` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `fk_user_has_seance_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8;



# Dump of table rowname
# ------------------------------------------------------------

DROP TABLE IF EXISTS `rowname`;

CREATE TABLE `rowname` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `seance_id` int(11) NOT NULL,
  `position` int(11) NOT NULL,
  `title` text NOT NULL,
  `datecreation` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `seance_id` (`seance_id`),
  CONSTRAINT `rowname_ibfk_1` FOREIGN KEY (`seance_id`) REFERENCES `seance` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;



# Dump of table seance
# ------------------------------------------------------------

DROP TABLE IF EXISTS `seance`;

CREATE TABLE `seance` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `titre` text NOT NULL,
  `datecreation` datetime DEFAULT CURRENT_TIMESTAMP,
  `date` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;



# Dump of table seance_has_criteria
# ------------------------------------------------------------

DROP TABLE IF EXISTS `seance_has_criteria`;

CREATE TABLE `seance_has_criteria` (
  `seance_id` int(11) NOT NULL,
  `criteria_id` int(11) NOT NULL,
  `ponderation` int(11) NOT NULL,
  PRIMARY KEY (`seance_id`,`criteria_id`),
  KEY `criteria_id` (`criteria_id`),
  CONSTRAINT `seance_has_criteria_ibfk_1` FOREIGN KEY (`seance_id`) REFERENCES `seance` (`id`),
  CONSTRAINT `seance_has_criteria_ibfk_2` FOREIGN KEY (`criteria_id`) REFERENCES `criteria` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;



# Dump of table user
# ------------------------------------------------------------

DROP TABLE IF EXISTS `user`;

CREATE TABLE `user` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nom` text NOT NULL,
  `prenom` text NOT NULL,
  `entreprise` text,
  `datecreation` datetime DEFAULT CURRENT_TIMESTAMP,
  `email` text,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;




/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;
/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;

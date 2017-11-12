var mysql = require('mysql')
var dbconfig = require('../config/database')

var connection = mysql.createConnection(dbconfig.connection)

connection.query('\
	CREATE TABLE  IF NOT EXISTS `' + dbconfig.database + '`.`subjects` ( \
    `sid` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY, \
    `name` VARCHAR(255) NOT NULL, \
    `abbrev` VARCHAR(10) NOT NULL, \
    `lec_per_week` TINYINT UNSIGNED NOT NULL \
    )')

connection.end()
var mysql = require('mysql')
var dbconfig = require('../config/database')

var connection = mysql.createConnection(dbconfig.connection)

connection.query('\
	CREATE TABLE  IF NOT EXISTS `' + dbconfig.database + '`.`rooms` ( \
    `rid` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY, \
    `name` VARCHAR(10) NOT NULL UNIQUE, \
    `capacity` SMALLINT UNSIGNED NOT NULL \
    )')

connection.end()
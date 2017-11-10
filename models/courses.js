var mysql = require('mysql')
var dbconfig = require('../config/database')

var connection = mysql.createConnection(dbconfig.connection)

connection.query('\
	CREATE TABLE  IF NOT EXISTS `' + dbconfig.database + '`.`courses` ( \
    `cid` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY, \
    `name` VARCHAR(10) NOT NULL UNIQUE,\
    `streams` TINYINT(1) NOT NULL \
    )')

connection.end()
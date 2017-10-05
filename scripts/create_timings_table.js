var mysql = require('mysql')
var dbconfig = require('../config/database')

var connection = mysql.createConnection(dbconfig.connection)

connection.query('\
	CREATE TABLE  IF NOT EXISTS `' + dbconfig.database + '`.`timings` ( \
    `time` TINYINT UNSIGNED NOT NULL,\
    `day` TINYINT UNSIGNED NOT NULL, \
    `rid` INT UNSIGNED NOT NULL, \
    `sid` INT UNSIGNED NOT NULL,\
     UNIQUE(time, day, sid), \
     UNIQUE(time, day, rid) \
    )')

console.log('Success: timings Table Created!')

connection.end()
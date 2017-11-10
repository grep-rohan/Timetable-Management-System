var mysql = require('mysql')
var dbconfig = require('../config/database')

var connection = mysql.createConnection(dbconfig.connection)

connection.query('\
	CREATE TABLE  IF NOT EXISTS `' + dbconfig.database + '`.`timings` ( \
	`tid` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY, \
    `time` TINYINT UNSIGNED NOT NULL,\
    `day` TINYINT UNSIGNED NOT NULL, \
    `rid` INT UNSIGNED NOT NULL, \
    `sid` INT UNSIGNED NOT NULL,\
    UNIQUE(time, day, sid), \
    UNIQUE(time, day, rid), \
    FOREIGN KEY (rid) \
        REFERENCES rooms(rid) \
        ON DELETE CASCADE, \
    FOREIGN KEY (sid) \
        REFERENCES subjects(sid) \
        ON DELETE CASCADE \
    )')

connection.end()
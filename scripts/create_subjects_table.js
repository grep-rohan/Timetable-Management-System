var mysql = require('mysql')
var dbconfig = require('../config/database')

var connection = mysql.createConnection(dbconfig.connection)

connection.query('\
	CREATE TABLE  IF NOT EXISTS `' + dbconfig.database + '`.`subjects` ( \
    `sid` INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY, \
    `name` VARCHAR(255) NOT NULL, \
    `abbrev` VARCHAR(10) NOT NULL, \
    `course` ENUM(\'btech\', \'mba\', \'bba\', \'bcomm\') NOT NULL, \
    `combined` TINYINT(1) NOT NULL, \
    `streams` VARCHAR(99) NOT NULL, \
    `lec_per_week` TINYINT UNSIGNED NOT NULL, \
    `batch` YEAR(4) NOT NULL, \
    UNIQUE(`name`, `course`, `streams`, `batch`) \
    )')

console.log('Success: subjects Table Created!')

connection.end()
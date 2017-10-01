var mysql = require('mysql')
var dbconfig = require('../config/database')

var connection = mysql.createConnection(dbconfig.connection)

connection.query('\
	CREATE TABLE  IF NOT EXISTS `' + dbconfig.database + '`.`subjects` ( \
    `sid` INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY, \
    `name` VARCHAR(255) NOT NULL, \
    `course` ENUM(\'btech\', \'mba\', \'bba\', \'bcomm\') NOT NULL, \
    `stream` ENUM(\'none\', \'csc\', \'cse\', \'me\', \'ece\', \'ce\') NOT NULL, \
    `lec_per_week` TINYINT UNSIGNED NOT NULL, \
    `batch` YEAR(4) NOT NULL, \
    UNIQUE(`name`, `course`, `stream`, `batch`) \
    )')

console.log('Success: subjects Table Created!')

connection.end()
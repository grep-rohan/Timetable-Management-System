var mysql = require('mysql')
var dbconfig = require('../config/database')

var connection = mysql.createConnection(dbconfig.connection)

connection.query('\
	CREATE TABLE  IF NOT EXISTS `' + dbconfig.database + '`.`students` ( \
    `uid` INT UNSIGNED PRIMARY KEY, \
    `course` ENUM(\'btech\', \'mba\', \'bba\', \'bcomm\') NOT NULL, \
    `stream` ENUM(\'none\', \'csc\', \'cse\', \'me\', \'ece\', \'ce\') NOT NULL, \
    `batch` YEAR(4) NOT NULL, \
    FOREIGN KEY (uid)\
        REFERENCES users(uid)\
        ON DELETE CASCADE \
    )')

connection.end()
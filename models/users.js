var mysql = require('mysql')
var dbconfig = require('../config/database')

var connection = mysql.createConnection(dbconfig.connection)

connection.query('\
    CREATE TABLE  IF NOT EXISTS `' + dbconfig.database + '`.`users` ( \
    `uid` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY, \
    `username` VARCHAR(255) NOT NULL UNIQUE, \
    `password` CHAR(60) NOT NULL, \
    `name` VARCHAR(255) NOT NULL, \
    `type` ENUM(\'student\', \'faculty\', \'po\', \'admin\') NOT NULL \
    )')

connection.end()
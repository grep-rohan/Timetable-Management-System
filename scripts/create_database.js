var mysql = require('mysql')
var dbconfig = require('../config/database')

var connection = mysql.createConnection(dbconfig.connection)

connection.query('CREATE DATABASE IF NOT EXISTS ' + dbconfig.database)

connection.query('\
	CREATE TABLE  IF NOT EXISTS `' + dbconfig.database + '`.`' + dbconfig.users_table + '` ( \
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY, \
    `username` VARCHAR(20) NOT NULL UNIQUE, \
    `password` CHAR(60) NOT NULL, \
    `privileges` ENUM(\'student\', \'faculty\', \'po\', \'admin\') NOT NULL, \
    `updated_at` TIMESTAMP NOT NULL DEFAULT NOW() ON UPDATE NOW(), \
  	`created_at` TIMESTAMP NOT NULL \
    )')

console.log('Success: Database Created!')

connection.end()

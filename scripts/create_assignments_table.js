var mysql = require('mysql')
var dbconfig = require('../config/database')

var connection = mysql.createConnection(dbconfig.connection)

connection.query('\
	CREATE TABLE  IF NOT EXISTS `' + dbconfig.database + '`.`assignments` ( \
    `uid` INT UNSIGNED NOT NULL, \
    `sid` INT UNSIGNED NOT NULL,\
    PRIMARY KEY(uid, sid) \
    )')

console.log('Success: assignments Table Created!')

connection.end()
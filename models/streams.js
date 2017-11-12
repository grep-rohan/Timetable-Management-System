var mysql = require('mysql')
var dbconfig = require('../config/database')

var connection = mysql.createConnection(dbconfig.connection)

connection.query('\
	CREATE TABLE  IF NOT EXISTS `' + dbconfig.database + '`.`streams` ( \
    `streamid` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY, \
    `name` VARCHAR(50), \
    `batch` YEAR(4) NOT NULL, \
    `cid` INT UNSIGNED NOT NULL,\
    UNIQUE (name, batch, cid), \
    FOREIGN KEY (cid) \
        REFERENCES courses(cid) \
        ON DELETE CASCADE \
    )')

connection.end()
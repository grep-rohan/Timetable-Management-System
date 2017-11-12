var mysql = require('mysql')
var dbconfig = require('../config/database')

var connection = mysql.createConnection(dbconfig.connection)

connection.query('\
	CREATE TABLE  IF NOT EXISTS `' + dbconfig.database + '`.`subject_streams` ( \
    `sid` INT UNSIGNED, \
    `streamid` INT UNSIGNED, \
    PRIMARY KEY (sid, streamid), \
    FOREIGN KEY (sid) \
        REFERENCES subjects(sid) \
        ON DELETE CASCADE,\
    FOREIGN KEY (streamid)\
        REFERENCES streams(streamid) \
        ON DELETE CASCADE \
    )')

connection.end()
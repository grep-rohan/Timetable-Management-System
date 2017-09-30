var mysql = require('mysql')
var dbconfig = require('../config/database')

var connection = mysql.createConnection(dbconfig.connection)

connection.query('CREATE DATABASE IF NOT EXISTS ' + dbconfig.database)

console.log('Success: Database Created!')

connection.end()

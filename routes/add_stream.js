module.exports = function(app)
{
    app.get('/add_stream',
        function(req, res, next)
        {
            if(!req.isAuthenticated())
            {
                res.redirect('/')
                return
            }

            if(req.user.type === 'po')
            {

                var callback2 = function (courses, streams)
                {
                    res.render('add_stream.ejs',
                        {
                            title: 'Add Stream',
                            message: req.flash('addStreamMessage'),
                            user: req.user,
                            courses: courses,
                            streams: streams
                        }
                    )
                }

                var callback1 = function(courses)
                {
                    var mysql = require('mysql')
                    var dbconfig = require('../config/database')
                    var connection = mysql.createConnection(dbconfig.connection)

                    connection.query('USE ' + dbconfig.database)

                    var sql = 'SELECT streams.name as stream, streams.batch, courses.name as course\n' +
                        'FROM streams, courses\n' +
                        'WHERE streams.cid = courses.cid\n' +
                        'ORDER BY batch, course, stream'

                    connection.query(sql,
                        function(err, result)
                        {
                            callback2(courses, result)
                        }
                    )
                }

                var mysql = require('mysql')
                var dbconfig = require('../config/database')
                var connection = mysql.createConnection(dbconfig.connection)

                connection.query('USE ' + dbconfig.database)

                sql = 'SELECT cid, name FROM courses ORDER BY name'

                connection.query(sql,
                    function(err, result)
                    {
                        callback1(result)
                    }
                )
            }
            else
            {
                var error = new Error('Access Denied!')
                error.status = 401
                next(error)
            }
        }
    )

    app.post('/add_stream',
        function(req, res)
        {
            var data = req.body

            var mysql = require('mysql')
            var dbconfig = require('../config/database')
            var connection = mysql.createConnection(dbconfig.connection)

            connection.query('USE ' + dbconfig.database)


            sql = 'INSERT INTO streams (name, batch, cid) VALUES ?'
            values = [[data.name, data.batch, data.cid]]

            var callback = function(result)
            {
                if(result)
                    req.flash('addStreamMessage',
                        JSON.stringify(
                            {
                                status: 'success',
                                message: 'Stream added successfully!'
                            }
                        )
                    )
                else
                    req.flash('addStreamMessage',
                        JSON.stringify(
                            {
                                status: 'error',
                                message: 'Stream already exists!'
                            }
                        )
                    )

                connection.end()

                res.redirect('/add_stream')
            }

            connection.query(sql, [values],
                function(err)
                {
                    if(err)
                        callback(false)
                    else
                        callback(true)
                }
            )
        }
    )
}
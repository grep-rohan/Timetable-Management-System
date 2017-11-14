module.exports = function(app)
{
    app.get('/add_subject',
        function(req, res, next)
        {
            if(!req.isAuthenticated())
                res.redirect('/')

            if(req.user.type === 'po')
            {
                var callback = function(courses)
                {
                    res.render('add_subject.ejs',
                        {
                            title: 'Add Subject',
                            user: req.user,
                            message: req.flash('addSubjectMessage'),
                            courses: courses
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
                        callback(result)
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

    app.post('/add_subject',
        function(req, res)
        {
            var data = req.body

            // subject name validation
            var name = data.name
            if(name.length < 5 || name.length > 255)
            {
                req.flash('addSubjectMessage',
                    JSON.stringify(
                        {
                            status: 'error',
                            message: 'Full subject name should be between 5 to 255 characters!'
                        }
                    )
                )
                res.redirect('/add_subject')
                return
            }

            var abbrev = data.abbrev
            if(abbrev.length < 2 || abbrev.length > 10)
            {
                req.flash('addSubjectMessage',
                    JSON.stringify(
                        {
                            status: 'error',
                            message: 'Abbreviated subject name should be between 2 to 10 characters!'
                        }
                    )
                )
                res.redirect('/add_subject')
                return
            }

            // lectures per week validation
            var lecPerWeek = data.lec_per_week
            if(parseInt(lecPerWeek) < 1 || parseInt(lecPerWeek) > 5)
            {
                req.flash('addSubjectMessage',
                    JSON.stringify(
                        {
                            status: 'error',
                            message: 'Lectures per week should be between 1 and 5'
                        }
                    )
                )
                res.redirect('/add_subject')
                return
            }

            var mysql = require('mysql')
            var dbconfig = require('../config/database')
            var connection = mysql.createConnection(dbconfig.connection)

            connection.query('USE ' + dbconfig.database)

            var sql = 'INSERT INTO subjects (name, abbrev, lec_per_week) VALUES ?'
            var values = [[data.name, data.abbrev, data.lec_per_week]]

            var callback = function(result)
            {
                if(result)
                    req.flash('addSubjectMessage',
                        JSON.stringify(
                            {
                                status: 'success',
                                message: 'Subject added successfully!'
                            }
                        )
                    )
                else
                    req.flash('addSubjectMessage',
                        JSON.stringify(
                            {
                                status: 'error',
                                message: 'Error inserting subject!'
                            }
                        )
                    )

                connection.end()

                res.redirect('/add_subject')
            }

            connection.query(sql, [values],
                function (err, result)
                {
                    if (err)
                        callback(false)
                    else
                    {
                        var sql = 'INSERT INTO subject_streams (sid, streamid) VALUES ?'
                        var values = [[result.insertId, data.streamid]]

                        connection.query(sql, [values],
                            function (err)
                            {
                                if(err)
                                    callback(false)
                                else
                                    callback(true)
                            }
                        )
                    }
                }
            )
        }
    )

    app.get('/get_batches',
        function (req, res)
        {
            var mysql = require('mysql')
            var dbconfig = require('../config/database')
            var connection = mysql.createConnection(dbconfig.connection)

            connection.query('USE ' + dbconfig.database)

            var sql = 'SELECT DISTINCT batch FROM streams WHERE cid = ' + req.query.cid + ' ORDER BY batch'

            connection.query(sql,
                function (err, result)
                {
                    res.send(result)
                }
            )
        }
    )

    app.get('/get_streams',
        function (req, res)
        {
            var mysql = require('mysql')
            var dbconfig = require('../config/database')
            var connection = mysql.createConnection(dbconfig.connection)

            connection.query('USE ' + dbconfig.database)

            var sql = 'SELECT streamid, name FROM streams WHERE cid = ' + req.query.cid + ' AND batch = '
                + req.query.batch + ' ORDER BY name'

            connection.query(sql,
                function (err, result)
                {
                    res.send(result)
                }
            )
        }
    )
}
module.exports = function(app)
{
    app.post('/get_subject',
        function(req, res)
        {
            req.session['sid'] = req.body.sid
            res.redirect('/add_lecture')
        }
    )

    app.get('/add_lecture',
        function(req, res, next)
        {
            if(!req.isAuthenticated())
            {
                res.redirect('/')
                return
            }

            var sid = req.session.sid
            if(req.user.type === 'faculty')
            {
                if(typeof sid === 'undefined')
                {
                    res.redirect('/')
                    return
                }

                getData()
            }
            else
            {
                var error = new Error('Access Denied!')
                error.status = 401
                next(error)
            }

            function getData()
            {
                var day = req.session.day
                var time = req.session.time
                var availableRooms = req.session.availableRooms

                delete req.session.day
                delete req.session.time
                delete req.session.availableRooms

                var myScheduleCallback = function(curSub, theirSchedule, mySchedule)
                {
                    res.render('add_lecture.ejs',
                        {
                            title: 'Add Lecture',
                            curSub: curSub,
                            user: req.user,
                            theirSchedule: theirSchedule,
                            mySchedule: mySchedule,
                            day: day,
                            time: time,
                            availableRooms: availableRooms
                        }
                    )
                }

                var theirScheduleCallback = function(curSub, theirSchedule)
                {
                    sql = 'SELECT timings.day, timings.time\n' +
                        'FROM timings, subjects, assignments\n' +
                        'WHERE assignments.sid = subjects.sid\n' +
                        'AND subjects.sid = timings.sid\n' +
                        'AND assignments.uid = ' + req.user.uid + '\n' +
                        'ORDER BY timings.time, timings.day'

                    connection.query(sql,
                        function(err, result)
                        {
                            myScheduleCallback(curSub, theirSchedule, result)
                        }
                    )
                }

                var curSubCallback = function(curSub)
                {
                    sql = 'SELECT timings.day, timings.time\n' +
                        'FROM timings, subjects\n' +
                        'WHERE timings.sid = subjects.sid\n' +
                        'AND subjects.course = \'' + curSub.course + '\'\n' +
                        'AND subjects.streams = \'' + curSub.stream + '\'\n' +
                        'AND subjects.batch = ' + curSub.batch + '\n' +
                        'ORDER BY timings.day, timings.time'

                    connection.query(sql,
                        function(err, result)
                        {
                            theirScheduleCallback(curSub, result)
                        }
                    )
                }

                var mysql = require('mysql')
                var dbconfig = require('../config/database')
                var connection = mysql.createConnection(dbconfig.connection)

                connection.query('USE ' + dbconfig.database)

                var sql = 'SELECT * FROM subjects WHERE sid = ' + sid

                connection.query(sql,
                    function(err, result)
                    {
                        curSubCallback(result[0])
                    }
                )
            }
        }
    )

    app.post('/get_rooms',
        function(req, res)
        {
            req.session['day'] = req.body.day
            req.session['time'] = req.body.time

            var mysql = require('mysql')
            var dbconfig = require('../config/database')
            var connection = mysql.createConnection(dbconfig.connection)

            connection.query('USE ' + dbconfig.database)

            var sql = 'SELECT rid, name\n' +
                'FROM rooms\n' +
                'WHERE rid NOT IN\n' +
                '(SELECT rooms.rid AS id\n' +
                ' FROM rooms, timings\n' +
                ' WHERE timings.day = ' + req.body.day + '\n' +
                ' AND timings.time = ' + req.body.time + '\n' +
                ' AND rooms.rid = timings.rid)'

            var callback = function(result)
            {
                req.session['availableRooms'] = result
                res.redirect('/add_lecture')
            }

            connection.query(sql,
                function(err, result)
                {
                    callback(result)
                }
            )
        }
    )

    app.post('/add_timing',
        function(req, res)
        {
            var data = req.body

            var mysql = require('mysql')
            var dbconfig = require('../config/database')
            var connection = mysql.createConnection(dbconfig.connection)

            connection.query('USE ' + dbconfig.database)

            var sql = 'INSERT INTO timings (day, time, rid, sid) VALUES ?'
            var values = [[data.day, data.time, data.rid, data.sid]]

            connection.query(sql, [values],
                function(err, result)
                {
                    res.redirect('/')
                }
            )
        }
    )
}
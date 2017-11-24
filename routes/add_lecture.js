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
                        'AND assignments.uid = ' + req.user.uid + '\n'

                    connection.query(sql,
                        function(err, result)
                        {
                            myScheduleCallback(curSub, theirSchedule, result)
                        }
                    )
                }

                var curSubCallback = function(curSub, streams)
                {
                    sql = 'SELECT timings.day, timings.time\n' +
                        'FROM timings, subject_streams\n' +
                        'WHERE\n' +
                        '(\n' +
                        '    subject_streams.streamid = ' + streams[0].streamid + '\n'
                    for(var i = 1; i < streams.length; i++)
                        sql += '    OR subject_streams.streamid = ' + streams[i].streamid + '\n'
                    sql += ')\n' +
                        'AND subject_streams.sid = timings.sid'

                    console.log(sql)

                    connection.query(sql,
                        function(err, result)
                        {
                            console.log(result)
                            theirScheduleCallback(curSub, result)
                        }
                    )
                }

                var subjectStreamsCallback = function(curSub)
                {
                    console.log(curSub)
                    sql = 'SELECT streams.streamid\n' +
                        'FROM subject_streams, streams\n' +
                        'WHERE subject_streams.streamid = streams.streamid\n' +
                        'AND subject_streams.sid = ' + curSub.sid

                    connection.query(sql,
                        function(err, result)
                        {
                            curSubCallback(curSub, result)
                        }
                    )
                }

                var mysql = require('mysql')
                var dbconfig = require('../config/database')
                var connection = mysql.createConnection(dbconfig.connection)

                connection.query('USE ' + dbconfig.database)

                var sql = 'SELECT A.sid, subject_name, course, batch, streams FROM \n' +
                    '(\n' +
                    '    SELECT DISTINCT subjects.sid, subjects.name as subject_name, courses.name as course, streams.batch\n' +
                    '    FROM subjects, subject_streams, courses, streams\n' +
                    '    WHERE subjects.sid = subject_streams.sid\n' +
                    '    AND streams.streamid = subject_streams.streamid\n' +
                    '    AND courses.cid = streams.cid\n' +
                    ') as A,\n' +
                    '(\n' +
                    '    SELECT subjects.sid, GROUP_CONCAT(streams.name SEPARATOR \', \') as streams\n' +
                    '    FROM subjects, streams, subject_streams\n' +
                    '    WHERE subjects.sid = subject_streams.sid\n' +
                    '    AND streams.streamid = subject_streams.streamid\n' +
                    '    GROUP BY sid\n' +
                    ') as B\n' +
                    'WHERE A.sid = B.sid\n' +
                    'AND A.sid = ' + sid + '\n' +
                    'ORDER BY batch, course, streams, subject_name'

                connection.query(sql,
                    function(err, result)
                    {
                        subjectStreamsCallback(result[0])
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
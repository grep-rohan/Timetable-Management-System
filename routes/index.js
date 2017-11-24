module.exports = function(app)
{
    app.get('/', function(req, res)
    {
        if(!req.isAuthenticated())
            res.render('login.ejs',
                {
                    message: req.flash('loginMessage'),
                    title: 'Login'
                }
            )
        else
        {
            if(req.user.type === 'faculty')
                getFacultyData()
            else if(req.user.type === 'student')
                getStudentData()
            else
                res.render('home.ejs',
                    {
                        user: req.user,
                        title: 'Home'
                    }
                )
        }

        function getFacultyData()
        {
            var callback2 = function(timings, incomplete_subs)
            {
                res.render('home_faculty.ejs',
                    {
                        user: req.user,
                        title: 'Home',
                        timings: timings,
                        incomplete_subs: incomplete_subs
                    }
                )
            }

            var callback1 = function(timings)
            {
                var sql = 'SELECT * \n' +
                    'FROM (SELECT *\n' +
                    '      FROM (SELECT *, COUNT(sid) AS cnt\n' +
                    '            FROM (SELECT subjects.sid, subjects.name, subjects.abbrev, subjects.lec_per_week\n' +
                    '                  FROM timings, subjects, assignments\n' +
                    '                  WHERE assignments.uid = 3\n' +
                    '                  AND timings.sid = assignments.sid\n' +
                    '                  AND assignments.sid=subjects.sid) AS x\n' +
                    '            GROUP BY sid) AS y\n' +
                    '      WHERE cnt < lec_per_week\n' +
                    '      UNION\n' +
                    '      SELECT DISTINCT subjects.*, 0 AS cnt\n' +
                    '      FROM subjects, assignments\n' +
                    '      WHERE subjects.sid NOT IN (SELECT DISTINCT sid FROM timings)\n' +
                    '      AND assignments.sid = subjects.sid\n' +
                    '      AND assignments.uid = 3) AS t\n' +
                    'ORDER BY cnt, name'

                connection.query(sql,
                    function(err, result)
                    {
                        callback2(timings, result)
                    }
                )
            }

            var mysql = require('mysql')
            var dbconfig = require('../config/database')
            var connection = mysql.createConnection(dbconfig.connection)

            connection.query('USE ' + dbconfig.database)

            var sql = 'SELECT day, time, room_name, subject_name, abbrev, course, streams, batch\n' +
                'FROM\n' +
                '(\n' +
                '    SELECT subjects.sid, timings.day, timings.time, rooms.name AS room_name, subjects.name AS subject_name, subjects.abbrev\n' +
                '\tFROM timings, rooms, subjects, assignments\n' +
                '\tWHERE assignments.uid = 3\n' +
                '\tAND\ttimings.sid = assignments.sid\n' +
                '\tAND assignments.sid = subjects.sid\n' +
                '\tAND timings.rid = rooms.rid\n' +
                ') as A,\n' +
                '(\n' +
                '\tSELECT DISTINCT subjects.sid, courses.name as course, streams.batch\n' +
                '    FROM subjects, subject_streams, courses, streams\n' +
                '    WHERE subjects.sid = subject_streams.sid\n' +
                '    AND streams.streamid = subject_streams.streamid\n' +
                '    AND courses.cid = streams.cid    \n' +
                ') as B,\n' +
                '(\n' +
                '    SELECT subjects.sid, GROUP_CONCAT(streams.name SEPARATOR \', \') as streams\n' +
                '    FROM subjects, streams, subject_streams\n' +
                '    WHERE subjects.sid = subject_streams.sid\n' +
                '    AND streams.streamid = subject_streams.streamid\n' +
                '    GROUP BY sid\n' +
                ') as C\n' +
                'WHERE A.sid = B.sid\n' +
                'AND A.sid = C.sid'

            connection.query(sql,
                function(err, result)
                {
                    callback1(result)
                }
            )
        }

        function getStudentData()
        {
            var mysql = require('mysql')
            var dbconfig = require('../config/database')
            var connection = mysql.createConnection(dbconfig.connection), sql

            connection.query('USE ' + dbconfig.database)

            sql = 'SELECT * FROM students WHERE uid = ' + req.user.uid

            var timingsCallback = function()
            {
                sql = 'SELECT subjects.name as subject_name, subjects.abbrev, rooms.name AS room_name, timings.day, timings.time, users.name AS faculty\n' +
                    'FROM subjects, rooms, students, timings, users, assignments, subject_streams\n' +
                    'WHERE students.uid = ' + req.user.uid + '\n' +
                    'AND subject_streams.streamid = students.streamid\n' +
                    'AND subjects.sid = subject_streams.sid\n' +
                    'AND subjects.sid = timings.sid\n' +
                    'AND timings.rid = rooms.rid\n' +
                    'AND assignments.sid = subjects.sid\n' +
                    'AND users.uid = assignments.uid\n' +
                    'ORDER BY day, time'

                console.log(sql)

                connection.query(sql,
                    function(err, result)
                    {
                        res.render('home_student.ejs',
                            {
                                title: 'Home',
                                user: req.user,
                                timings: result
                            }
                        )
                    }
                )
            }

            var coursesCallback = function()
            {
                sql = 'SELECT courses.cid, courses.name FROM courses ORDER BY name'

                connection.query(sql,
                    function(err, result)
                    {
                        res.render('add_student_details.ejs',
                            {
                                title: 'Home',
                                user: req.user,
                                courses: result
                            }
                        )
                    }
                )
            }

            connection.query(sql,
                function(err, result)
                {
                    if(result.length === 0)
                        coursesCallback()
                    else
                       timingsCallback()
                }
            )
        }
    })

    app.post('/add_student_details',
        function(req, res)
        {
            var data = req.body

            var mysql = require('mysql')
            var dbconfig = require('../config/database')
            var connection = mysql.createConnection(dbconfig.connection)

            connection.query('USE ' + dbconfig.database)

            var sql = 'INSERT INTO students (uid, streamid) VALUES ?'
            var values = [[req.user.uid, data.streamid]]

            connection.query(sql, [values],
                function()
                {
                    res.redirect('/')
                }
            )
        }
    )

    app.get('/get_subject_details',     // get streams not assigned to passed subject
        function (req, res)
        {
            var mysql = require('mysql')
            var dbconfig = require('../config/database')
            var connection = mysql.createConnection(dbconfig.connection)

            connection.query('USE ' + dbconfig.database)

            var sql = 'SELECT course, batch, streams FROM \n' +
                '(\n' +
                '    SELECT DISTINCT subjects.sid, courses.name as course, courses.cid, streams.batch\n' +
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
                'AND A.sid = ' + req.query.sid

            connection.query(sql,
                function(err, result)
                {
                    res.send(result)
                }
            )
        }
    )
}
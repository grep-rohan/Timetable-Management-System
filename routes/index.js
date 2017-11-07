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

            var callback1 = function(result, connection)
            {
                var sql = 'SELECT * \n' +
                    'FROM (SELECT *\n' +
                    '      FROM (SELECT *, COUNT(sid) AS cnt\n' +
                    '            FROM (SELECT subjects.sid, subjects.name, subjects.abbrev, subjects.course, subjects.combined,subjects.streams, subjects.lec_per_week, subjects.batch\n' +
                    '                  FROM timings, subjects, assignments\n' +
                    '                  WHERE assignments.uid = ' + req.user.uid + '\n' +
                    '                  AND timings.sid=assignments.sid\n' +
                    '                  AND assignments.sid=subjects.sid) AS x\n' +
                    '            GROUP BY sid) AS y\n' +
                    '      WHERE cnt < lec_per_week\n' +
                    '      UNION\n' +
                    '      SELECT DISTINCT subjects.*, 0 AS cnt\n' +
                    '      FROM subjects, assignments\n' +
                    '      WHERE subjects.sid NOT IN (SELECT DISTINCT sid FROM timings)\n' +
                    '      AND assignments.sid = subjects.sid\n' +
                    '      AND assignments.uid = ' + req.user.uid + ') AS t\n' +
                    'ORDER BY cnt, name'

                connection.query(sql,
                    function(err, result2)
                    {
                        callback2(result, result2)
                    }
                )
            }

            var mysql = require('mysql')
            var dbconfig = require('../config/database')
            var connection = mysql.createConnection(dbconfig.connection)

            connection.query('USE ' + dbconfig.database)

            var sql = 'SELECT timings.day, timings.time, rooms.name AS room_name, subjects.name AS subject_name, ' +
                'subjects.abbrev, subjects.course, subjects.combined, subjects.streams, subjects.batch\n' +
                'FROM timings, rooms, subjects, assignments\n' +
                'WHERE assignments.uid=' + req.user.uid + '\n' +
                'AND timings.sid=assignments.sid\n' +
                'AND assignments.sid=subjects.sid\n' +
                'AND timings.rid=rooms.rid\n' +
                'ORDER BY subject_name'

            connection.query(sql,
                function(err, result)
                {
                    callback1(result, connection)
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

            var callback = function()
            {
                sql = 'SELECT subjects.name, subjects.abbrev, rooms.name AS room_name, timings.day, timings.time, users.name AS user_name\n' +
                    'FROM subjects, rooms, students, timings, users, assignments\n' +
                    'WHERE students.uid = ' + req.user.uid + '\n' +
                    'AND subjects.course = students.course\n' +
                    'AND subjects.streams LIKE CONCAT(\'%\', students.stream, \'%\')\n' +
                    'AND subjects.batch = students.batch\n' +
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

            connection.query(sql,
                function(err, result)
                {
                    if(result.length === 0)
                        res.render('add_student_details.ejs',
                            {
                                title: 'Home',
                                user: req.user
                            }
                        )
                    else
                        callback()
                }
            )
        }
    })

    app.post('/add_student_details',
        function(req, res)
        {
            var data = req.body

            // batch validation
            var batch = data.batch
            var dt = new Date()
            var max = dt.getYear() + 1900
            var min = max - 4
            if(parseInt(batch) < min || parseInt(batch) > max)
            {
                req.flash('addSubjectMessage',
                    JSON.stringify(
                        {
                            status: 'error',
                            message: 'Batch should be between ' + min + ' and ' + max
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

            var sql = 'INSERT INTO students (uid, course, stream, batch) VALUES ?'
            var values = [[req.user.uid, data.course, data.stream, data.batch]]

            connection.query(sql, [values],
                function()
                {
                    res.redirect('/')
                }
            )
        }
    )
}
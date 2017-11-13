module.exports = function(app)
{
    app.get('/view_subjects',
        function(req, res, next)
        {
            if(!req.isAuthenticated())
            {
                res.redirect('/')
                return
            }

            if(req.user.type === 'po')
            {
                var mysql = require('mysql')
                var dbconfig = require('../config/database')
                var connection = mysql.createConnection(dbconfig.connection)

                connection.query('USE ' + dbconfig.database)

                var sql = 'SELECT A.sid, subject_name, user_name, course, batch, streams FROM \n' +
                    '(\n' +
                    '    SELECT subjects.sid, subjects.name as subject_name, users.name as user_name\n' +
                    '\tFROM subjects\n' +
                    '\tLEFT JOIN assignments\n' +
                    '   \t\tINNER JOIN users\n' +
                    '   \t\tON  assignments.uid = users.uid\n' +
                    '\tON subjects.sid = assignments.sid\n' +
                    ') as A,\n' +
                    '(\n' +
                    '    SELECT DISTINCT subjects.sid, courses.name as course, streams.batch\n' +
                    '    FROM subjects, subject_streams, courses, streams\n' +
                    '    WHERE subjects.sid = subject_streams.sid\n' +
                    '    AND streams.streamid = subject_streams.streamid\n' +
                    '    AND courses.cid = streams.cid\n' +
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

                console.log(sql)

                var callback2 = function(faculty, subjects)
                {
                    res.render('view_subjects.ejs',
                        {
                            title: 'View Subjects',
                            user: req.user,
                            subjects: subjects,
                            faculty: faculty
                        }
                    )
                    connection.end()
                }

                var callback1 = function(result)
                {
                    sql = 'SELECT * FROM users WHERE type = \'faculty\' ORDER BY name'

                    connection.query(sql, function(err, result2)
                        {
                            callback2(result2, result)
                        }
                    )
                }

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

    app.post('/assign_subject',
        function(req, res)
        {
            var data = req.body

            var mysql = require('mysql')
            var dbconfig = require('../config/database')
            var connection = mysql.createConnection(dbconfig.connection)

            connection.query('USE ' + dbconfig.database)

            var sql = 'INSERT INTO assignments (uid, sid) VALUES ?'
            var values = [[data.faculty, data.id]]

            var callback = function(result)
            {
                if(result)
                    req.flash('assignSubjectMessage',
                        JSON.stringify(
                            {
                                status: 'success',
                                message: 'Assignment created successfully!'
                            }
                        )
                    )
                else
                    req.flash('assignSubjectMessage',
                        JSON.stringify(
                            {
                                status: 'error',
                                message: 'Assignment already exists!'
                            }
                        )
                    )

                connection.end()

                res.redirect('/view_subjects')
            }

            connection.query(sql, [values], function(err, result)
            {
                if(err)
                    callback(false)
                else
                    callback(true)
            })
        }
    )
}
module.exports = function(app)
{
    app.get('/my_subjects',
        function(req, res, next)
        {
            if(!req.isAuthenticated())
            {
                res.redirect('/')
                return
            }

            if(req.user.type === 'faculty')
            {
                var mysql = require('mysql')
                var dbconfig = require('../config/database')
                var connection = mysql.createConnection(dbconfig.connection)

                connection.query('USE ' + dbconfig.database)

                var sql = 'SELECT subject_name, course, batch, streams FROM \n' +
                    '(\n' +
                    '    SELECT subjects.sid, subjects.name as subject_name\n' +
                    '\tFROM subjects\n' +
                    '\tLEFT JOIN assignments\n' +
                    '\tON subjects.sid = assignments.sid\n' +
                    '    WHERE assignments.uid = 3\n' +
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
                    'AND A.sid = C.sid\n' +
                    'ORDER BY batch, course, streams, subject_name'

                console.log(sql)

                var callback = function(result)
                {
                    res.render('my_subjects.ejs',
                        {
                            title: 'My Subjects',
                            user: req.user,
                            subjects: result
                        }
                    )
                    connection.end()
                }

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
}
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

                var sql = 'SELECT subjects.sid, subjects.name AS subject_name, subjects.batch, subjects.course, ' +
                    'subjects.combined, subjects.streams, users.name AS user_name\n' +
                    'FROM subjects\n' +
                    'LEFT JOIN assignments\n' +
                    '   INNER JOIN users\n' +
                    '   ON assignments.uid = users.uid\n' +
                    'ON subjects.sid = assignments.sid\n' +
                    'ORDER BY subject_name'

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
                        console.log(result)
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
}
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

                var sql = 'SELECT subjects.sid, subjects.name as subject_name, users.name as user_name\n' +
                    'FROM subjects\n' +
                    'LEFT JOIN assignments\n' +
                    '   INNER JOIN users\n' +
                    '   ON  assignments.uid = users.uid\n' +
                    'ON subjects.sid = assignments.sid'

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
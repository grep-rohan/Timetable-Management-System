module.exports = function(app)
{
    app.get('/add_course',
        function(req, res, next)
        {
            if(!req.isAuthenticated())
            {
                res.redirect('/')
                return
            }

            if(req.user.type === 'po')
                res.render('add_course.ejs',
                    {
                        title: 'Add Course',
                        message: req.flash('addCourseMessage'),
                        user: req.user
                    }
                )
            else
            {
                var error = new Error('Access Denied!')
                error.status = 401
                next(error)
            }
        }
    )

    app.post('/add_course',
        function(req, res)
        {
            var data = req.body

            var mysql = require('mysql')
            var dbconfig = require('../config/database')
            var connection = mysql.createConnection(dbconfig.connection)

            connection.query('USE ' + dbconfig.database)

            var sql = 'INSERT INTO courses (name) VALUES ?'
            var values = [[data.name]]

            var callback = function(result)
            {
                if(result)
                    req.flash('addCourseMessage',
                        JSON.stringify(
                            {
                                status: 'success',
                                message: 'Course added successfully!'
                            }
                        )
                    )
                else
                    req.flash('addCourseMessage',
                        JSON.stringify(
                            {
                                status: 'error',
                                message: 'Course already exists!'
                            }
                        )
                    )

                connection.end()

                res.redirect('/add_course')
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
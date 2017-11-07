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

                var sql = 'SELECT sid FROM assignments WHERE uid=' + req.user.uid

                var callback2 = function(result)
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

                var callback1 = function(result)
                {
                    sql = 'SELECT * FROM subjects WHERE sid='
                    for(var i = 0; i < result.length; i++)
                    {
                        if(i === 0)
                            sql += result[i].sid
                        else
                            sql += ' OR sid=' + result[i].sid
                    }

                    if(result.length === 0)
                        callback2([])
                    else
                        connection.query(sql,
                            function(err, result)
                            {
                                callback2(result)
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
module.exports = function(app)
{
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
                {
                    console.log(err.message)
                    callback(false)
                }
                else
                {
                    console.log(result.message)
                    callback(true)
                }
            })
        }
    )
}
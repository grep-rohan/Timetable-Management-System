module.exports = function(app)
{
    app.get('/add_subject',
        function(req, res, next)
        {
            if(!req.isAuthenticated())
                res.redirect('/')

            if(req.user.type === 'po')
                res.render('add_subject.ejs',
                    {
                        title: 'Add Subject',
                        user: req.user,
                        message: req.flash('addSubjectMessage')
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

    app.post('/add_subject',
        function(req, res)
        {
            var data = req.body

            // subject name validation
            var name = data.name
            if(name.length < 5 || name.length > 255)
            {
                req.flash('addSubjectMessage',
                    JSON.stringify(
                        {
                            status: 'error',
                            message: 'Full subject name should be between 5 to 255 characters!'
                        }
                    )
                )
                res.redirect('/add_subject')
                return
            }

            var abbrev = data.abbrev
            if(abbrev.length < 2 || abbrev.length > 10)
            {
                req.flash('addSubjectMessage',
                    JSON.stringify(
                        {
                            status: 'error',
                            message: 'Abbreviated subject name should be between 2 to 10 characters!'
                        }
                    )
                )
                res.redirect('/add_subject')
                return
            }

            // lectures per week validation
            var lecPerWeek = data.lec_per_week
            if(parseInt(lecPerWeek) < 1 || parseInt(lecPerWeek) > 5)
            {
                console.log('lectures per week error')
                req.flash('addSubjectMessage',
                    JSON.stringify(
                        {
                            status: 'error',
                            message: 'Lectures per week should be between 1 and 5'
                        }
                    )
                )
                res.redirect('/add_subject')
                return
            }

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

            var sql = 'INSERT INTO subjects (name, abbrev, course, stream, lec_per_week, batch) VALUES ?'
            var values = []
            var streams = ['none', 'csc', 'cse', 'me', 'ece', 'ce']
            for(var i = 0; i < streams.length; i++)
                if(streams[i] in data)
                    values.push([data.name, data.abbrev, data.course, streams[i], data.lec_per_week,
                        data.batch])

            var callback = function(result)
            {
                if(result)
                    req.flash('addSubjectMessage',
                        JSON.stringify(
                            {
                                status: 'success',
                                message: 'Subject added successfully!'
                            }
                        )
                    )
                else
                    req.flash('addSubjectMessage',
                        JSON.stringify(
                            {
                                status: 'error',
                                message: 'Subject already exists!'
                            }
                        )
                    )

                connection.end()

                res.redirect('/add_subject')
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
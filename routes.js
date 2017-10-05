module.exports = function (app, passport)
{
    /*
    ------------------------------------------- INDEX ----------------------------------------------
     */
    app.get('/', function (req, res)
    {
        if (!req.isAuthenticated())
            res.render('login.ejs',
                {
                    message: req.flash('loginMessage'),
                    title: 'Login'
                }
            )
        else
        {
            if (req.user.type === 'faculty')
                getTimings()
            else
                res.render('home.ejs',
                    {
                        user: req.user,
                        title: 'Home'
                    }
                )
        }

        var callback = function (result)
        {
            res.render('home_faculty.ejs',
                {
                    user: req.user,
                    title: 'Home',
                    timings: result
                }
            )
        }

        function getTimings()
        {
            var mysql = require('mysql')
            var dbconfig = require('./config/database')
            var connection = mysql.createConnection(dbconfig.connection)

            connection.query('USE ' + dbconfig.database)

            var sql = 'SELECT timings.day, timings.time, rooms.name AS room_name, subjects.name AS subject_name, ' +
                'subjects.abbrev, subjects.course, subjects.stream, subjects.batch\n' +
                'FROM timings, rooms, subjects, assignments\n' +
                'WHERE assignments.uid=' + req.user.uid + '\n' +
                'AND timings.sid=assignments.sid\n' +
                'AND assignments.sid=subjects.sid\n' +
                'AND timings.rid=rooms.rid\n' +
                'ORDER BY day, time'

            connection.query(sql,
                function (err, result)
                {
                    callback(result)
                }
            )
        }
    })

    /*
    ------------------------------------------------ LOGIN -------------------------------------------------
     */
    app.post('/login', passport.authenticate('local-login', {
            successRedirect: '/',
            failureRedirect: '/',
            failureFlash: true
        }),
        function (req, res)
        {
            if (req.body.remember)
                req.session.cookie.maxAge = new Date(Date.now() + 3600000)

            else
                req.session.cookie.expires = false

            res.redirect('/')
        })

    /*
    ------------------------------------------------- LOGOUT ----------------------------------------------
     */
    app.get('/logout',
        function (req, res)
        {
            req.logout()
            res.redirect('/')
        }
    )

    /*
    ---------------------------------------------- CREATE USER -------------------------------------------
     */
    app.get('/create_user',
        function (req, res, next)
        {
            if (req.ip === '::ffff:127.0.0.1' || req.ip === '::1' || req.user.type === 'admin')
                res.render('create_user.ejs',
                    {
                        message: req.flash('signupMessage'),
                        title: 'Create User',
                        user: req.user
                    }
                )
            else
            {
                var error = new Error('Access Denied!')
                error.status = 401
                next(error)
            }
        })

    app.post(
        '/create_user',
        passport.authenticate(
            'local-signup',
            {
                successRedirect: '/create_user',
                failureRedirect: '/create_user',
                failureFlash: true
            }
        )
    )

    /*
    ------------------------------------------------- ADD SUBJECT -------------------------------------------------
     */
    app.get('/add_subject',
        function (req, res, next)
        {
            if (!req.isAuthenticated())
                res.redirect('/')

            if (req.user.type === 'po')
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
        function (req, res)
        {
            var data = req.body

            // subject name validation
            var name = data.name
            if (name.length < 5 || name.length > 255)
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
            if (abbrev.length < 2 || abbrev.length > 10)
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
            if (parseInt(lecPerWeek) < 1 || parseInt(lecPerWeek) > 5)
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
            if (parseInt(batch) < min || parseInt(batch) > max)
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
            var dbconfig = require('./config/database')
            var connection = mysql.createConnection(dbconfig.connection)

            connection.query('USE ' + dbconfig.database)

            var sql = 'INSERT INTO subjects (name, abbrev, course, stream, lec_per_week, batch) VALUES ?'
            var values = []
            var streams = ['none', 'csc', 'cse', 'me', 'ece', 'ce']
            for (var i = 0; i < streams.length; i++)
                if (streams[i] in data)
                    values.push([data.name, data.abbrev, data.course, streams[i], data.lec_per_week,
                        data.batch])

            var callback = function (result)
            {
                if (result)
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

            connection.query(sql, [values], function (err, result)
            {
                if (err)
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

    /*
    ------------------------------------------------- ASSIGN SUBJECT ---------------------------------------------------
     */
    app.post('/assign_subject',
        function (req, res)
        {
            var data = req.body

            var mysql = require('mysql')
            var dbconfig = require('./config/database')
            var connection = mysql.createConnection(dbconfig.connection)

            connection.query('USE ' + dbconfig.database)

            var sql = 'INSERT INTO assignments (uid, sid) VALUES ?'
            var values = [[data.faculty, data.id]]

            var callback = function (result)
            {
                if (result)
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

            connection.query(sql, [values], function (err, result)
            {
                if (err)
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

    /*
    ------------------------------------------------------------ VIEW SUBJECTS -----------------------------------------
     */
    app.get('/view_subjects',
        function (req, res, next)
        {
            if (!req.isAuthenticated())
            {
                res.redirect('/')
                return
            }

            if (req.user.type === 'po')
            {
                var mysql = require('mysql')
                var dbconfig = require('./config/database')
                var connection = mysql.createConnection(dbconfig.connection)

                connection.query('USE ' + dbconfig.database)

                var sql = 'SELECT subjects.sid, subjects.name AS subject_name, subjects.batch, subjects.course, ' +
                    'subjects.stream, users.name AS user_name\n' +
                    'FROM subjects\n' +
                    'LEFT JOIN assignments\n' +
                    '   INNER JOIN users\n' +
                    '   ON assignments.uid = users.uid\n' +
                    'ON subjects.sid = assignments.sid\n' +
                    'ORDER BY subject_name'

                var callback2 = function (faculty, subjects)
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

                var callback1 = function (result)
                {
                    sql = 'SELECT * FROM users WHERE type=\'faculty\' ORDER BY name'

                    connection.query(sql, function (err, result2)
                        {
                            callback2(result2, result)
                        }
                    )
                }

                connection.query(sql,
                    function (err, result)
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

    /*
    -------------------------------------------------------- MY SUBJECTS -----------------------------------------------
     */
    app.get('/my_subjects',
        function (req, res, next)
        {
            if (!req.isAuthenticated())
            {
                res.redirect('/')
                return
            }

            if (req.user.type === 'faculty')
            {
                var mysql = require('mysql')
                var dbconfig = require('./config/database')
                var connection = mysql.createConnection(dbconfig.connection)

                connection.query('USE ' + dbconfig.database)

                var sql = 'SELECT sid FROM assignments WHERE uid=' + req.user.uid

                var callback2 = function (result)
                {
                    console.log(result)
                    res.render('my_subjects.ejs',
                        {
                            title: 'My Subjects',
                            user: req.user,
                            subjects: result
                        }
                    )
                    connection.end()
                }

                var callback1 = function (result)
                {
                    sql = 'SELECT * FROM subjects WHERE sid='
                    for (var i = 0; i < result.length; i++)
                    {
                        if (i === 0)
                            sql += result[i].sid
                        else
                            sql += ' OR sid=' + result[i].sid
                    }

                    connection.query(sql,
                        function (err, result)
                        {
                            callback2(result)
                        }
                    )
                }

                connection.query(sql,
                    function (err, result)
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

    /*
    -------------------------------------------------------- ADD ROOM --------------------------------------------------
     */
    app.get('/add_room',
        function (req, res, next)
        {
            if (!req.isAuthenticated())
            {
                res.redirect('/')
                return
            }

            if (req.user.type === 'po')
                res.render('add_room.ejs',
                    {
                        title: 'Add Room',
                        message: req.flash('addRoomMessage'),
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

    app.post('/add_room',
        function (req, res)
        {
            var data = req.body

            if (data.name.length < 4 || data.name.length > 10)
            {
                req.flash('addRoomMessage',
                    JSON.stringify(
                        {
                            status: 'error',
                            message: 'Room name should be between 4 to 10 characters!'
                        }
                    )
                )
                res.redirect('/add_room')
                return
            }
            if (data.capacity < 20 || data.capacity > 1000)
            {
                req.flash('addRoomMessage',
                    JSON.stringify(
                        {
                            status: 'error',
                            message: 'Capacity should be between 20 and 1000'
                        }
                    )
                )
                res.redirect('/add_room')
                return
            }

            var mysql = require('mysql')
            var dbconfig = require('./config/database')
            var connection = mysql.createConnection(dbconfig.connection)

            connection.query('USE ' + dbconfig.database)

            var sql = 'INSERT INTO rooms (name, capacity) VALUES ?'
            var values = [[data.name, data.capacity]]

            var callback = function (result)
            {
                if (result)
                    req.flash('addRoomMessage',
                        JSON.stringify(
                            {
                                status: 'success',
                                message: 'Room added successfully!'
                            }
                        )
                    )
                else
                    req.flash('addRoomMessage',
                        JSON.stringify(
                            {
                                status: 'error',
                                message: 'Room already exists!'
                            }
                        )
                    )

                connection.end()

                res.redirect('/add_room')
            }

            connection.query(sql, [values],
                function (err, result)
                {
                    if (err)
                    {
                        console.log(err.message)
                        callback(false)
                    }
                    else
                    {
                        console.log(result.message)
                        callback(true)
                    }
                }
            )
        }
    )
}
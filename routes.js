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
            res.render('home.ejs',
                {
                    user: req.user,
                    title: 'Home'
                }
            )
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
    app.get('/logout', function (req, res)
    {
        req.logout()
        res.redirect('/')
    })

    /*
    ---------------------------------------------- CREATE USER -------------------------------------------
     */
    app.get('/create_user', function (req, res, next)
    {
        if (req.ip === '::1' || req.user.type === 'admin')
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
    app.get(
        '/add_subject',
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

    app.post(
        '/add_subject',
        function (req, res)
        {
            var mysql = require('mysql')
            var dbconfig = require('./config/database')
            var connection = mysql.createConnection(dbconfig.connection)

            connection.query('USE ' + dbconfig.database)

            var sql = 'INSERT INTO subjects (name, course, stream, lec_per_week, batch) VALUES ?'
            var values = []
            var streams = ['none', 'csc', 'cse', 'me', 'ece', 'ce']
            for (var i = 0; i < streams.length; i++)
                if (streams[i] in req.body)
                    values.push([req.body.name, req.body.course, streams[i], req.body.lec_per_week,
                        req.body.batch])

            console.log(values)

            connection.query(sql, [values], function (err, result)
            {
                if (err)
                    req.flash(
                        'addSubjectMessage',
                        JSON.stringify(
                            {
                                status: 'error',
                                message: 'Error adding subject!'
                            }
                        )
                    )
                else
                {
                    console.log(result)
                    req.flash(
                        'addSubjectMessage',
                        JSON.stringify(
                            {
                                status: 'success',
                                message: 'Subject added successfully!'
                            }
                        )
                    )
                }
            })

            res.redirect('/add_subject')
        }
    )
}
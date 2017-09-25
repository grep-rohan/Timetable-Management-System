module.exports = function (app, passport)
{
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

    app.get('/logout', function (req, res)
    {
        req.logout()
        res.redirect('/')
    })

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
}
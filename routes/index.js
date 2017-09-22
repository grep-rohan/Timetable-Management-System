module.exports = function (app, passport)
{
    app.get('/', function (req, res)
    {
        if (!req.isAuthenticated())
            res.render('login.ejs', {message: req.flash('loginMessage')})
        else
            res.render('home.ejs',
                {
                    user: req.user
                })
    })

    // process the login form
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

    app.get('/logout', function(req, res) {
        req.logout();
        res.redirect('/');
    });
}
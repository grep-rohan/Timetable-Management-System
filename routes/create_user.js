module.exports = function (app, passport)
{
    app.get('/create_user', function (req, res, next)
    {
        if(req.ip === '::1')
            res.render('create_user.ejs', {message: req.flash('signupMessage')})
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
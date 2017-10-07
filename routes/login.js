module.exports = function(app, passport)
{
    app.post('/login', passport.authenticate('local-login', {
            successRedirect: '/',
            failureRedirect: '/',
            failureFlash: true
        }),
        function(req, res)
        {
            if(req.body.remember)
                req.session.cookie.maxAge = new Date(Date.now() + 3600000)

            else
                req.session.cookie.expires = false

            res.redirect('/')
        })
}
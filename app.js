var express = require('express')
var session = require('express-session')
var path = require('path')
var favicon = require('serve-favicon')
var logger = require('morgan')
var cookieParser = require('cookie-parser')
var bodyParser = require('body-parser')
var passport = require('passport')
var flash = require('connect-flash')

var app = express()

require('./config/passport')(passport)

app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'ejs')

app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')))
app.use(logger('dev'))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: true}))
app.use(cookieParser())
app.use('/public', express.static(path.join(__dirname, 'public')))

app.use(session(
    {
        secret: 'secret',
        resave: true,
        saveUninitialized: true,
        maxAge: new Date(Date.now() + 3600000)
    }
))
app.use(passport.initialize())
app.use(passport.session())
app.use(flash())

// routes
require('./routes/index.js')(app, passport)
require('./routes/login.js')(app, passport)
require('./routes/logout.js')(app, passport)
require('./routes/create_user.js')(app, passport)
require('./routes/add_subject.js')(app, passport)
require('./routes/assign_subject.js')(app, passport)
require('./routes/view_subjects.js')(app, passport)
require('./routes/my_subjects.js')(app, passport)
require('./routes/add_room.js')(app, passport)
require('./routes/add_lecture.js')(app, passport)

app.use(function(req, res, next)
{
    var err = new Error('Not Found')
    err.status = 404
    next(err)
})

app.use(function(err, req, res, next)
{
    // set locals, only providing error in development
    res.locals.message = err.message
    res.locals.error = req.app.get('env') === 'development' ? err : {}

    // render the error page
    res.status(err.status || 500)
    res.render('error')
})

module.exports = app
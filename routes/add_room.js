module.exports = function(app)
{
    app.get('/add_room',
        function(req, res, next)
        {
            if(!req.isAuthenticated())
            {
                res.redirect('/')
                return
            }

            if(req.user.type === 'po')
            {
                var mysql = require('mysql')
                var dbconfig = require('../config/database')
                var connection = mysql.createConnection(dbconfig.connection)

                connection.query('USE ' + dbconfig.database)

                var sql = 'SELECT rooms.name, rooms.capacity FROM rooms ORDER BY name'

                var callback = function(rooms)
                {
                    res.render('add_room.ejs',
                        {
                            title: 'Add Room',
                            message: req.flash('addRoomMessage'),
                            user: req.user,
                            rooms: rooms
                        }
                    )
                }

                connection.query(sql,
                    function(err, result)
                    {
                        callback(result)
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

    app.post('/add_room',
        function(req, res)
        {
            var data = req.body

            if(data.name.length < 4 || data.name.length > 10)
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
            if(data.capacity < 20 || data.capacity > 1000)
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
            var dbconfig = require('../config/database')
            var connection = mysql.createConnection(dbconfig.connection)

            connection.query('USE ' + dbconfig.database)

            var sql = 'INSERT INTO rooms (name, capacity) VALUES ?'
            var values = [[data.name, data.capacity]]

            var callback = function(result)
            {
                if(result)
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
                function(err, result)
                {
                    if(err)
                        callback(false)
                    else
                        callback(true)
                }
            )
        }
    )
}
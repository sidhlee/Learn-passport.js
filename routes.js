const passport    = require('passport');
const bcrypt      = require('bcrypt');

module.exports = function (app, db) {
      
  function ensureAuthenticated(req, res, next) {
    // passport.deserializeUser is called here (with every request)
    // it matches serialized user from session to the ones in the db
    // if deserialization fail to find user from db,
    // req.isAuthenticated will return false here. (req.user == null)
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/');
  };

  app.route('/')
    .get((req, res) => {
      res.render(process.cwd() + '/views/pug/index', 
                 {renderedFrom: 'Pug', 
                  authLib: 'Passport.js', 
                  showLogin: true, 
                  showRegistration: true});
    });

  app.route('/login') 
    .post(passport.authenticate('local', { failureRedirect: '/' }),(req,res) => {
         // passport.deserializeUser is called with the first middleware(passport.authenticate) 
         // if the user wasn't found in db, save 'null' inside req.user 
         // LocalStrategy is invoked and if succeed, retreived user obj is again, attatched to req.user
         // also, serialized user id is stored in session
         // done(null, user) -> req.login(user, cb) -> req.user -> serializeUser(user,cb) -> req._passport.session.user
         
         // req.isAuthenticated() returns true here. (user id in session)
         
         res.redirect('/profile');  // req - res cycle ends here. (only session lives)
    });

  app.route('/profile')
  // match user id from session to the user.id from db, if succeed, next()
    .get(ensureAuthenticated, (req, res) => {
         res.render(process.cwd() + '/views/pug/profile', {username: req.user.username});
    });

  app.route('/register')
    .post((req, res, next) => {
        // never store plaintext password into db
        var hash = bcrypt.hashSync(req.body.password, 8);
        db.collection('users').findOne({ username: req.body.username }, function (err, user) {
            if(err) {
                next(err); // async action cb must pass err inside next() for express to catch.
            } else if (user) {
                res.redirect('/'); // if user is already in db, don't need to register. 
            } else {
                db.collection('users').insertOne(
                  {username: req.body.username,
                   password: hash},
                  (err, doc) => {
                      if(err) {
                          res.redirect('/');
                      } else {
                          next();
                      }
                  }
                )
            }
        })},
      passport.authenticate('local', { failureRedirect: '/' }),
      (req, res, next) => {
          res.redirect('/profile');
      }
  );

  app.route('/logout')
    .get((req, res) => {
        req.logout(); // removes req.user & clears session
        res.redirect('/');
    });

  // place middleware for 404 at the end of route stack
  // if the request is not caught by any of the route we set,
  // respond with 404 Not Found
  app.use((req, res, next) => {
    res.status(404)
      .type('text')
      .send('Not Found');
  });
  
}

const session     = require('express-session'); 
const passport    = require('passport');
const ObjectID    = require('mongodb').ObjectID;
const LocalStrategy = require('passport-local');
const bcrypt      = require('bcrypt');

module.exports = function (app,db) {
  
  app.use(session({
    secret: process.env.SESSION_SECRET,
    
    // save unmodified session to keep them alive
    // usually session middleware ddo this for you by 
    // calling Session.touch() to reset req.session.cookie.maxAge 
    resave: true,  
    
    // save sid in cookie even if new session is not Modified at all
    // "false" will make the session forgotten with "res" 
    // and cookie with sid will NOT be set in browser
    saveUninitialized: true,
  }));
  
  // sets req._passport
  // also req.login() and req.logout()
  // if passport.user is not found(the user is not anuthenticated)
  // creates req.session.passport.user = {};
  app.use(passport.initialize());
  
  // reads user from session and store it in req.user
  // called with every req and checks serialized user in session
  // then calls deserializeUser() 
  app.use(passport.session());  
  
  // only called after passport.authenticate
  passport.serializeUser((user, done) => {
    done(null, user._id);
  });

  // invoked with every request
  passport.deserializeUser((id, done) => {
      db.collection('users').findOne(
          {_id: new ObjectID(id)},
          (err, user) => {
            
            
              // done(null, user) calls login(user, cb)
              // which save user into req.user
              // and call serializeUser(user, cb) and store serialized user in session inside cb
              // ( @ req._passport.session.user)
              done(null, user); 
          } // if the user wasn't matched from the db, it will pass "null" for the user.
      );
  });
  
  
  // passport.use(strategy) configures strategy
  // invoked only on route with passport.authenticate middleware
  passport.use(new LocalStrategy(
    
    // passing req.body.username and req.body.password (plaintext)
    function(username, password, done) {
      db.collection('users').findOne({ username: username }, function (err, user) {
        console.log('User '+ username +' attempted to log in.');
        if (err) { return done(err); }
        if (!user) { return done(null, false); }
        
        // bcrypt.compareSync(plaintextPW, hash)
        if (!bcrypt.compareSync(password, user.password)) { return done(null, false); }
        
        return done(null, user);
      });
    }
  ));
  
}
**FreeCodeCamp**

Leaning backend devaelopment and authentication with passport from freeCodeCamp

## Resources

#### MongoDB
[MongoDB Node.js Tutorial](http://mongodb.github.io/node-mongodb-native/3.2/tutorials/connect/)

#### Passport

[Passport: The Hidden Manual](https://github.com/sidhlee/passport-api-docs)

## Functions added to the Request

### req.login(user, callback)

Log a user in (causes passport to serialize the user to the session).  On completion, req.user will be set.

### req.logout()

Removes req.user, and clears the session.

## Passport and Sessions

Passport creates a key in the session called `session.passport`.

When a request comes in to the `passport.session()` middleware, passport runs the [built-in 'session' strategy](https://github.com/jaredhanson/passport/blob/2327a36e7c005ccc7134ad157b2f258b57aa0912/lib/strategies/session.js) - this calls `deserializeUser(session.passport.user, done)` to read the user out of the session, and stores it in req.user.

You can override how passport deserializes a session by creating a new strategy called 'session' and registering it with `passport.use()`.

When you call `req.login()`, or when a strategy successfully authenticates a user, passport uses the [session manager](https://github.com/jaredhanson/passport/blob/2327a36e7c005ccc7134ad157b2f258b57aa0912/lib/sessionmanager.js#L12-L28), and essentially does:

```js
serializeUser(req.user, (err, user) => {
    if(err) {return done(err);}
    session.passport.user = user;
});
```

Although it's more verbose about it.  You can override the session manager by creating your own implementation and setting `passport._sm`, but this is not documented or supported, so use at your own risk.





[Passport: passport/lib/passport/http/request.js](https://github.com/jaredhanson/passport/blob/a892b9dc54dce34b7170ad5d73d8ccfba87f4fcf/lib/passport/http/request.js#L74)

```javascript
/**
 * Module dependencies.
 */
var http = require('http')
  , req = http.IncomingMessage.prototype;


/**
 * Intiate a login session for `user`.
 *
 * Options:
 *   - `session`  Save login state in session, defaults to _true_
 *
 * Examples:
 *
 *     req.logIn(user, { session: false });
 *
 *     req.logIn(user, function(err) {
 *       if (err) { throw err; }
 *       // session saved
 *     });
 *
 * @param {User} user
 * @param {Object} options
 * @param {Function} done
 * @api public
 */
req.login =
req.logIn = function(user, options, done) {
  if (!this._passport) throw new Error('passport.initialize() middleware not in use');
  
  if (!done && typeof options === 'function') {
    done = options;
    options = {};
  }
  options = options || {};
  var property = this._passport.instance._userProperty || 'user';
  var session = (options.session === undefined) ? true : options.session;
  
  this[property] = user;
  if (session) {
    var self = this;
    this._passport.instance.serializeUser(user, function(err, obj) {
      if (err) { self[property] = null; return done(err); }
      self._passport.session.user = obj;
      done();
    });
  } else {
    done && done();
  }
}

/**
 * Terminate an existing login session.
 *
 * @api public
 */
req.logout =
req.logOut = function() {
  if (!this._passport) throw new Error('passport.initialize() middleware not in use');
  
  var property = this._passport.instance._userProperty || 'user';
  
  this[property] = null;
  delete this._passport.session.user;
};

/**
 * Test if request is authenticated.
 *
 * @return {Boolean}
 * @api public
 */
req.isAuthenticated = function() {
  var property = 'user';
  if (this._passport && this._passport.instance._userProperty) {
    property = this._passport.instance._userProperty;
  }
  
  return (this[property]) ? true : false;
};

/**
 * Test if request is unauthenticated.
 *
 * @return {Boolean}
 * @api public
 */
req.isUnauthenticated = function() {
  return !this.isAuthenticated();
};
```





[Passport: definition of done()](https://stackoverflow.com/a/26164977)

```javascript
const done = function(err, user, info) {
               if (err) { return next(err); }
               if (!user) { return res.redirect('/login'); }
               req.logIn(user, function(err) {
                 if (err) { return next(err); }
                 return res.redirect('/users/' + user.username);
               });
             }
```


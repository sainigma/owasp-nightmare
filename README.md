# owasp-nightmare

This is a course project for University of Helsinki's Cyber Security Base 2021. It (eventually) features five different flaws from OWASP [top ten list](https://owasp.org/www-project-top-ten/)

## Installation and usage

1. After cloning the repo, initialize the project by running `python3 manage.py migrate`

2. Run the project with `python3 manage.py runserver`

The app allows users to send messages to each other. Running the project requires JavaScript to be enabled on the browser.

The available commands are `new username-here password-here`, `login username-here password-here`, `send target-user multiline message here` and `logout`.

## Implemented flaws

### Injection

While the queries themselves are parametrized to prevent SQL injection, the actual content of the messages are not sanitized. This means that messages sent to other users can be injected with custom html and javascript. This can be then used to hijack the target user's csrftoken, after which the user's messages can be read.

Easy way to test that this injection works, is to send command `send target <img src="#" onerror=alert(1) />`, which will send an alert popup every time the messages are fetched.

Since the project allows Cross-Origin Resource Sharing, even complex scripts outside the server can be embedded inside.

The injection can be fixed by validating and sanitizing the user inputs on user creation and message sending. HTML-tags should either be removed, or allowed only in special cases (<b></b> comes to mind).

The exact entry points which should have validation, are:

https://github.com/sainigma/owasp-nightmare/blob/main/app/views.py#L38
https://github.com/sainigma/owasp-nightmare/blob/main/app/views.py#L63
https://github.com/sainigma/owasp-nightmare/blob/main/app/views.py#L81

The CORS problem can be fixed by configuring CORS headers to the app, with django-cors-headers. Another way is to setup the app as a HTTPS site, which should create errors in browser, if cross-origin resources are ever fetched.

### Identification and authentication failures

The app does not rate limit incoming connections, which means that the app accepts any number of login attempts from a single source. Additionally, the app permits any sort of string to be used as a password. Both of these problems combined, means that a credential stuffing/dictionary attack is feasible.

Also, the app does not provide a new token on valid authentication. It just marks the active request session as the current user. This means, that the users will use the same token until they expire (in two weeks). Even if the user logs out and logins as a different user, the same token is still used. This means that a successful CSRF heist can be used to gain access to any number of users that login to the app, using the same browser. The only thing that limits the scope of this vulnerability, is that the same token can track only one active login at a time.

To fix the first problem, the app should check the strength of a new password, based on length and characters used. This could be done using a regex pattern. The password should also be checked against a list of well known worst passwords.

The exact line which should check for password strength is:

https://github.com/sainigma/owasp-nightmare/blob/main/app/views.py#L64

Addittionally, the app should also start rate limiting connections that seem suspicious. A criteria for this could be n failed login attempts from the same source, based on IP and the target username.

To fix the second problem, logging out should clear the session on both ends, and tokens should not be reused. This could be done by granting the user a new token on successful login. This means that once the token expires, either by time or log out, it will never be valid again, preventing reuse.

The exact fixes are:
This should return a new token

https://github.com/sainigma/owasp-nightmare/blob/main/app/views.py#L51

This should expect a new token

https://github.com/sainigma/owasp-nightmare/blob/main/static/scripts/main.js#L61

This should clear the previous token

https://github.com/sainigma/owasp-nightmare/blob/main/static/scripts/main.js#L88

These action should be rate limited:

https://github.com/sainigma/owasp-nightmare/blob/main/app/views.py#L36
https://github.com/sainigma/owasp-nightmare/blob/main/app/views.py#L79

### Broken access control

When the app lists all messages, it returns a list containing the senders username. While usernames are often public in online services, it increases the possible attack surface. Using separate nicknames and usernames for users is an easy fix for this problem.

It's hard to pinpoint the exact lines where this fix should be applied to, since it requires that the way users can reference to each other to be changed when sending messages. Maybe by id, since nicknames can't be assumed to be unique?

If a csrftoken is stolen, the app blindly trust that the other user is the same. This could be mitigated by checking for simultaneous logins, or by requiring separate login for each unique IP.

The fix should be applied to points where request.session['user'] is referenced, maybe by replacing the lines `if 'user' in request.session` with a method that returns the truth value for the following:
`if 'user' in request.session and 'ip' in request.session and request.session['ip'] == request.META.get('REMOTE_ADDR')`

Successful login should set the request.session['ip'] parameter:

https://github.com/sainigma/owasp-nightmare/blob/main/app/views.py#L49

### Security logging and monitoring failures

The app doesn't produce any meaningful logs, for example when logins fail or an invalid route is accessed. This means, that any suscpicious activity (=penetration testing) will go unnoticed.

To fix this problem, some sort of logging middleware should be implemented. At the very least, this middleware should be used to generate logs in routes that validate data: login, user creation and message sending.

The exact lines which should feature logging are:

Invalid routes:

https://github.com/sainigma/owasp-nightmare/blob/main/app/views.py#L23
https://github.com/sainigma/owasp-nightmare/blob/main/app/views.py#L52
https://github.com/sainigma/owasp-nightmare/blob/main/app/views.py#L77
https://github.com/sainigma/owasp-nightmare/blob/main/app/views.py#L88

Failed actions:

https://github.com/sainigma/owasp-nightmare/blob/main/app/views.py#L42
https://github.com/sainigma/owasp-nightmare/blob/main/app/views.py#L25

### Software and data integrity failures

The app will run in any python3+django install found in the local machine, and doesn't care how it got there. This means that if it contains malicious code, the app will contain it as well.

One fix is to manually verify that the dependencies are not compromised. Another solution would be to setup a CI pipeline that installs the correct dependencies from a trusted source. This could be achieved with poetry or docker, for example.

### Insecure design

The app doesn't feature any tests, which means that there might be any number of overlooked security flaws.

This can be fixed by writing unit tests, that test the app's individual components, and integration tests that test the system as a whole. A good framework for testing python is pytest.

The tests should have both use and misuse cases, and the project would benefit, if the misuse cases featured fuzzing and mutated inputs.
# owasp-nightmare

This is a course project for University of Helsinki's Cyber Security Base 2021. It (eventually) features five different flaws from OWASP [top ten list](https://owasp.org/www-project-top-ten/)

## Implemented flaws

### Injection

While the queries themselves are parametrized to prevent SQL injection, the actual content of the messages are not sanitized. This means that messages sent to other users can be injected with custom html and javascript. This can be then used to hijack the target user's csrftoken, after which the user's messages can be read.

Easy way to test that this injection works, is to send command `send target <img src="#" onerror=alert(1) />`, which will send an alert popup when the messages are fetched.

This can be fixed by sanitizing the user inputs, so that they can't contain HTML-tags or JavaScript.

### Identification and authentication failures

The app permits weak and well-known passwords. It also doesn't rate limit login requests, meaning that a dictionary attack is feasible. The app also doesn't provide a new token on valid authentication, meaning that the users will use the same token until they expire, even between logins. The latter makes a CSRF forgery very feasible, because even though logging out removes the authentication server-side, once the user logs back in during the same session, the token is once again valid.

To fix the first problem, the app should check the strength of a new password with a regex pattern. Additionally, the app should check the password against a top-10000 worst passwords list.

To fix the second problem, the app should start rate limiting logins from the same source after n failed attempts, based on IP and the target username.

To fix the third problem, the logout should clear the session client side, and during login the client should receive a brand new session token.

### Broken access control

When the app lists all messages, it returns a list containing the senders username. While usernames are often public in online services, it increases the possible attack surface. Using separate shown names and usernames for users is an easy fix for this problem.

If a csrftoken is stolen, the app blindly trust that the other user is the same. This could be mitigated by checking for simultaneous logins, or by requiring separate login for each unique IP.

### Security logging and monitoring failures

The app doesn't produce any meaningful logs, for example when logins fail or an invalid route is accessed. This means, that any suscpicious activity (=penetration testing) will go unnoticed.

A simple solution to the problem, is to implement some sort of logging middleware, that at the very least logs suspicious activity in routes that validate data: login etc.

### Software and data integrity failures

The app will run in any python3+django install found in the local machine, and doesn't care how it got there. This means that if it contains malicious code, the app will contain it as well.

One fix is to manually verify that the dependencies are not compromised. Another solution would be to setup a CI pipeline (with poetry or docker for example) that installs the correct dependencies from a trusted source.

### Insecure design

The app doesn't feature any tests, which means that there might be any number of security flaws that I've overlooked. This can be fixed by writing unit tests, that test the app's individual components, and integration tests that test the system as a whole. The tests should have both use and misuse cases.
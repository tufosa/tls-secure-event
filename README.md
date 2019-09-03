# tls-secure-event
A showcase for a potential bug in nodejs.

## How to reproduce the bug
This program starts a `tls.Server`, and then two clients, one using the
deprecated `createSecurePair` and the other using `tls.TLSSocket`. It just opens
the connections and wait for the different events to trigger. Each event leaves
a trace. It reproduces 2 cases per client (4 in total): one just opening the
connection (`write: false`) and the other opening the connection and 
immediately writing an empty string to the socket. Therefore the 4 cases are:

- SecurePair-write-false
- SecurePair-write-true
- TLSSocket-write-false
- TLSSocket-write-true

In order to reproduce the run `node main.js` using different versions of nodejs 
and observe the differences in behaviour through the traces left by the program.

# node v8.16.1
```
Creating SecurePair write false client...
(node:31271) [DEP0064] DeprecationWarning: tls.createSecurePair() is deprecated. Please use tls.TLSSocket instead.
secureConnection
secure

Creating TLSSocket write false client...
ERROR:  TLSSocket with write false did NOT receive secure event

Creating SecurePair write true client...
secureConnection
secure

Creating TLSSocket write true client...
secureConnection
secure

Finished
```
The only case not emitting any event is TLSSocket-write-false.

# node v10.16.3
```
Creating SecurePair write false client...
(node:31533) [DEP0064] DeprecationWarning: tls.createSecurePair() is deprecated. Please use tls.TLSSocket instead.
ERROR:  SecurePair with write false did NOT receive secure event

Creating TLSSocket write false client...
ERROR:  TLSSocket with write false did NOT receive secure event

Creating SecurePair write true client...
secureConnection
secure

Creating TLSSocket write true client...
secureConnection
secure

Finished
```
All write-false cases fail (as in do not emit events) and all write-true cases
pass.

# node v12.8.1
```
Creating SecurePair write false client...
(node:31828) [DEP0064] DeprecationWarning: tls.createSecurePair() is deprecated. Please use tls.TLSSocket instead.
ERROR:  SecurePair with write false did NOT receive secure event

Creating TLSSocket write false client...
ERROR:  TLSSocket with write false did NOT receive secure event

Creating SecurePair write true client...
secure

Creating TLSSocket write true client...
secureConnection
secure

Finished
```
All write-false cases fail and the write-true cases behave slightly different,
as one of them (SecurePair-write-true) never emit the `secureConnection` event.

var r = require("../fingerprint/DataDomeAnalyzer.js");
var i = require("../http/DataDomeRequest.js");
var c = require("../http/DataDomeResponse.js");
var o = require("../common/DataDomeTools.js");
var a = 2048;
var s = false;
var f = false;
module.exports = function (e) {
  var t = "x-datadome-clientid";
  var u = "x-set-cookie";
  var h = "x-sf-cc-x-set-cookie";
  var l = new o();
  this.processSyncRequest = function () {
    var n = new r(e);
    var t = false;
    window.addEventListener("datadome-jstag-ch", function () {
      if (!t) {
        t = true;
        var n = new i("ch");
        if (window.dataDomeOptions) {
          n.requestApi(window.ddjskey, e, [], window.dataDomeOptions.patternToRemoveFromReferrerUrl, true, window.dataDomeOptions.ddResponsePage);
        }
      }
    }, {
      capture: true,
      once: true
    });
    n.process();
  };
  this.processAsyncRequests = function (r, i, o, w, d) {
    var v = require("../common/DataDomeUrlTools.js");
    var b = this;
    if (window.XMLHttpRequest) {
      var y = XMLHttpRequest.prototype.setRequestHeader;
      if (window.dataDomeOptions.replayAfterChallenge) {
        XMLHttpRequest.prototype.setRequestHeader = function (n, e) {
          this._datadome = this._datadome || {};
          this._datadome.originalRequestHeaders ||= [];
          if (!f && n !== t) {
            this._datadome.originalRequestHeaders.push({
              header: n,
              value: e
            });
          }
          y.call(this, n, e);
        };
        var p = XMLHttpRequest.prototype.send;
        XMLHttpRequest.prototype.send = function () {
          this._datadome = this._datadome || {};
          this._datadome.originalSendArgs = Array.prototype.slice.call(arguments);
          p.apply(this, arguments);
        };
      }
      var m = XMLHttpRequest.prototype.open;
      XMLHttpRequest.prototype.open = function () {
        this._datadome = this._datadome || {};
        this._datadome.originalOpenArgs = Array.prototype.slice.call(arguments);
        var n = window.dataDomeOptions.replayAfterChallenge;
        if (this.addEventListener !== undefined) {
          if (n) {
            this.addEventListener("readystatechange", function (n) {
              var e = n.currentTarget;
              if (e.readyState === 2 && typeof e.onload == "function") {
                var t = b.filterAsyncResponse(e.responseURL, r, i, d);
                var c = e.getAllResponseHeaders();
                var o = l.getDataDomeChallengeType(c);
                if (t && o != null) {
                  e._datadome.onload = e.onload;
                  e.onload = null;
                }
              }
            });
          }
          this.addEventListener("load", function (s) {
            var v = s.currentTarget;
            var y = v.getAllResponseHeaders();
            l.getCookie("datadome");
            if (v.responseType === "text" || v.responseType === "" || v.responseType === "json" || v.responseType === "blob" || v.responseType === "arraybuffer") {
              var p = b.filterAsyncResponse(v.responseURL, r, i, d);
              if (p) {
                if (window.ddSbh) {
                  var m = l.findXHRHeaderValue(y, h) || l.findXHRHeaderValue(y, u);
                  if (window.ddSbh && m != null) {
                    l.setDDSession(m);
                  }
                  if (m && l.hasPartitionedAttribute(m)) {
                    var F = l.getCookieDomainFromCookie(m);
                    if (F) {
                      l.removeUnpartitionedCookieIfPartitionedOneIsPresent(F);
                    }
                  }
                } else {
                  l.removeUnpartitionedCookieIfPartitionedOneIsPresent();
                }
              }
              var L = l.getDataDomeChallengeType(y);
              if (L || p) {
                var U = new c(e);
                function A(e) {
                  if (U.process(e, o, w, v, d, v.responseURL, L) && !f && n && v._datadome.originalRequestHeaders && v._datadome.originalSendArgs && v._datadome.originalOpenArgs) {
                    if (typeof v.onloadend == "function") {
                      v._datadome.onloadend = v.onloadend;
                      v.onloadend = null;
                    }
                    f = true;
                    window.addEventListener(l.internalEventNames.replayRequest, function n() {
                      v.abort();
                      s.stopImmediatePropagation();
                      s.preventDefault();
                      v.open.apply(v, v._datadome.originalOpenArgs);
                      if (v._datadome.originalRequestHeaders) {
                        v._datadome.originalRequestHeaders.forEach(function (n) {
                          v.setRequestHeader(n.header, n.value);
                        });
                      }
                      if (window.ddSbh) {
                        v.setRequestHeader(t, l.getDDSession());
                      }
                      if (typeof v._datadome.onload == "function") {
                        v.onload = v._datadome.onload;
                      }
                      if (typeof v._datadome.onloadend == "function") {
                        v.onloadend = v._datadome.onloadend;
                      }
                      v.send.apply(v, v._datadome.originalSendArgs);
                      window.removeEventListener(l.internalEventNames.replayRequest, n);
                      f = false;
                    });
                  }
                }
                switch (v.responseType) {
                  case "blob":
                    if (typeof FileReader != "undefined") {
                      var Q = new FileReader();
                      Q.onload = function (n) {
                        if (typeof n.target.result == "string") {
                          A(n.target.result);
                        }
                      };
                      Q.readAsText(v.response);
                    }
                    break;
                  case "json":
                    A(v.response);
                    break;
                  case "text":
                  case "":
                    A(v.responseText);
                    break;
                  case "arraybuffer":
                    if (window.TextDecoder && v.response.byteLength <= a) {
                      var Y = new TextDecoder("utf-8").decode(v.response);
                      A(Y);
                    }
                }
              }
            }
          });
        }
        var s = arguments.length ? Array.prototype.slice.call(arguments) : [];
        if (m) {
          m.apply(this, s);
        }
        try {
          if (s.length > 1 && s[1] && (!v.isAbsoluteUrl(s[1]) || b.filterAsyncResponse(s[1], r, i, d)) && (window.dataDomeOptions.withCredentials && (this.withCredentials = true), window.ddSbh)) {
            var y = l.getDDSession();
            if (!this._dd_hook) {
              this.setRequestHeader(t, y);
              this._dd_hook = true;
            }
          }
        } catch (n) {}
      };
    }
    var F = window.dataDomeOptions.overrideAbortFetch;
    var L = window.Request && typeof window.Request == "function";
    var U = window.Proxy && typeof window.Proxy == "function";
    var A = window.Reflect && typeof window.Reflect.construct == "function";
    if (F && L && U && A) {
      window.Request = new Proxy(window.Request, {
        construct: function (n, e, t) {
          if (e.length > 1) {
            var c = v.getRequestURL(e[0]);
            if (b.filterAsyncResponse(c, r, i, d) && e[1] != null && e[1].signal) {
              try {
                delete e[1].signal;
              } catch (n) {}
            }
            return new n(e[0], e[1]);
          }
          return Reflect.construct(n, e);
        }
      });
    }
    if (window.fetch) {
      var Q = window.fetch;
      window.fetch = function () {
        var n;
        var a = arguments.length ? Array.prototype.slice.call(arguments) : [];
        var f = v.getRequestURL(a[0]);
        if (F && a.length > 1 && a[1] && a[1].signal !== undefined && typeof a[0] == "string" && (!v.isAbsoluteUrl(f) || b.filterAsyncResponse(f, r, i, d))) {
          try {
            delete a[1].signal;
          } catch (n) {}
        }
        if (window.dataDomeOptions.withCredentials || window.ddSbh) {
          var y;
          if (typeof a[0] == "string") {
            y = a[0];
          } else if (typeof a[0] == "object") {
            if (typeof a[0].url == "string") {
              y = a[0].url;
            } else if (typeof a[0].href == "string") {
              y = a[0].href;
            }
          }
          var p = false;
          try {
            p = b.filterAsyncResponse(y, r, i, d);
          } catch (n) {}
          if (typeof y == "string" && (!v.isAbsoluteUrl(y) || p)) {
            if (window.dataDomeOptions.withCredentials) {
              if (typeof a[0] == "object" && typeof a[0].url == "string") {
                a[0].credentials = "include";
              } else if (a.length >= 1) {
                if (a[1] == null) {
                  var m = [];
                  for (var L = 0; L < a.length; ++L) {
                    m[L] = a[L];
                  }
                  (a = m)[1] = {};
                }
                a[1].credentials = "include";
              }
            }
            if (window.ddSbh) {
              var U = l.getDDSession();
              var A = typeof Headers == "function" && typeof Headers.prototype.set == "function";
              if (typeof a[0] == "object" && typeof a[0].url == "string") {
                if (!a[0].headers) {
                  if (A) {
                    a[0].headers = new Headers();
                  }
                }
                if (a[0].headers) {
                  a[0].headers.set(t, U);
                }
              } else if (a.length >= 1) {
                if (a[1] == null) {
                  var Y = [];
                  for (var D = 0; D < a.length; ++D) {
                    Y[D] = a[D];
                  }
                  (a = Y)[1] = {};
                }
                if (a[1].headers == null) {
                  a[1].headers = {};
                }
                if (A && a[1].headers.constructor === Headers) {
                  a[1].headers.set(t, U);
                } else if (Array.isArray(a[1].headers)) {
                  a[1].headers.push([t, U]);
                } else {
                  a[1].headers[t] = U;
                }
              }
            }
          }
        }
        if (window.dataDomeOptions.replayAfterChallenge && a[0] instanceof Request) {
          try {
            n = a[0].clone();
          } catch (n) {}
        }
        var R;
        var j;
        var H;
        var G = 250;
        if (window.ddjskey === "1F633CDD8EF22541BD6D9B1B8EF13A") {
          try {
            j = this === window;
            R = Q.apply(window, a);
          } catch (n) {
            H = typeof n.message == "string" ? n.message.slice(0, G) : "errorfetch";
          }
        } else {
          try {
            R = Q.apply(this, a);
          } catch (n) {
            H = typeof n.message == "string" ? n.message.slice(0, G) : "errorfetch";
          }
        }
        e.i("nowd", j);
        e.i("sfex", H);
        if (a.length > 1 && a[1] && a[1].trustToken || R.then === undefined) {
          return R;
        } else {
          return new Promise(function (t, f) {
            R.then(function (v) {
              if (window.ddSbh) {
                var y = v.headers.get(h) || v.headers.get(u);
                if (y != null && window.ddSbh) {
                  try {
                    l.setDDSession(y);
                  } catch (n) {}
                }
                if (y && l.hasPartitionedAttribute(y)) {
                  var p = l.getCookieDomainFromCookie(y);
                  if (p) {
                    l.removeUnpartitionedCookieIfPartitionedOneIsPresent(p);
                  }
                }
              } else {
                l.removeUnpartitionedCookieIfPartitionedOneIsPresent();
              }
              if (v.ok) {
                t(v);
              } else {
                v.clone().text().then(function (u) {
                  var h = v.headers;
                  var y = l.getDataDomeChallengeType(h);
                  var p = b.filterAsyncResponse(v.url, r, i, d);
                  if (y || p) {
                    var m = new c(e).process(u, o, w, null, d, v.url, y);
                    var F = window.dataDomeOptions.replayAfterChallenge;
                    if (m && !s && F) {
                      function L() {
                        s = false;
                        window.removeEventListener(l.internalEventNames.replayRequest, U);
                      }
                      function U() {
                        if (a[0] instanceof Request && n) {
                          a[0] = n;
                        }
                        window.fetch.apply(window, a).then(function (n) {
                          L();
                          t(n);
                        }).catch(function (n) {
                          L();
                          f();
                        });
                      }
                      s = true;
                      window.addEventListener(l.internalEventNames.replayRequest, U);
                    } else {
                      t(v);
                    }
                  } else {
                    t(v);
                  }
                }).catch(function (n) {
                  f();
                });
              }
            }).catch(function (n) {
              f(n);
            });
          });
        }
      };
    }
  };
  this.filterAsyncResponse = function (e, t, r, i) {
    if (e == null) {
      return true;
    }
    if (e === window.dataDomeOptions.endpoint) {
      return false;
    }
    if (i) {
      var c = "DDUser-Challenge";
      var o = e.replace(/\?.*/, "");
      return o.slice(o.length - c.length) === c;
    }
    return !!t && t.length === 0 || require("../common/DataDomeUrlTools.js").matchURLConfig(e, t, r);
  };
};
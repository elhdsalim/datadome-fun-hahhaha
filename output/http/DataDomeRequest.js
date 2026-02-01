var r = require("../common/DataDomeTools");
module.exports = function (n) {
  this.jsType = n;
  this.requestApi = function (n, e, t, i, c, o) {
    if (!window.ddShouldSkipFingerPrintReq) {
      var a = new r();
      e.i("jset", Math.floor(Date.now() / 1000));
      if (!c && window.navigator && window.navigator.sendBeacon && window.Blob) {
        var s = this.getQueryParamsString(e, t, n, i, o);
        var f = "URLSearchParams" in window ? new URLSearchParams(s) : new Blob([s], {
          type: "application/x-www-form-urlencoded"
        });
        window.navigator.sendBeacon(window.dataDomeOptions.endpoint, f);
        if (window.dataDomeOptions.enableTagEvents) {
          a.dispatchEvent(a.eventNames.posting, {
            endpointUrl: window.dataDomeOptions.endpoint
          });
        }
      } else if (window.XMLHttpRequest) {
        var u = new XMLHttpRequest();
        try {
          u.open("POST", window.dataDomeOptions.endpoint, c);
          u.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
          var h = this.getQueryParamsString(e, t, n, i, o);
          a.debug("xmlHttpString built.", h);
          if (window.dataDomeOptions.customParam !== null) {
            h += "&custom=" + window.dataDomeOptions.customParam;
          }
          u.onreadystatechange = function () {
            if (this && this.readyState == 4 && this.status == 200) {
              try {
                if (typeof this.responseText == "string" && !window.DataDomeResponseDisplayed) {
                  var n = JSON.parse(u.responseText);
                  if (n.cookie) {
                    var t = n.cookie.indexOf("Domain=");
                    var r = n.cookie.indexOf("Path=");
                    var i = "";
                    if (t > -1 && r > -1) {
                      i = n.cookie.slice(t + "Domain=".length, r - "; ".length);
                    }
                    var c = window.location.hostname;
                    var o = window.dataDomeOptions.overrideCookieDomain;
                    var s = window.dataDomeOptions.enableCookieDomainFallback;
                    const u = c.substring(c.length - i.replace(/^\./, "").length) !== i.replace(/^\./, "");
                    if (o) {
                      n.cookie = a.replaceCookieDomain(n.cookie, window.location.hostname);
                      e.i("dcok", a.getCookieDomainFromCookie(n.cookie));
                    } else if (s && i && u) {
                      n.cookie = a.setCookieWithFallback(n.cookie);
                      e.i("dcok", a.getCookieDomainFromCookie(n.cookie));
                    } else {
                      e.i("dcok", i);
                    }
                    if ((window.ddCbh || window.ddSbh) && a.isLocalStorageEnabled() && typeof localStorage.setItem == "function") {
                      var f = a.getCookie(a.dataDomeCookieName, n.cookie);
                      if (f != null) {
                        localStorage.setItem(window.dataDomeOptions.ddCookieSessionName, f);
                      }
                    }
                    a.setCookie(n.cookie);
                    if (a.hasPartitionedAttribute(n.cookie)) {
                      var h = a.getCookieDomainFromCookie(n.cookie);
                      if (h) {
                        a.removeUnpartitionedCookieIfPartitionedOneIsPresent(h);
                      }
                    }
                  }
                }
                if (window.dataDomeOptions.enableTagEvents) {
                  a.dispatchEvent(a.eventNames.posted, {
                    endpointUrl: window.dataDomeOptions.endpoint
                  });
                }
              } catch (n) {}
            }
          };
          a.debug("Request sent.", u);
          u.send(h);
          if (window.dataDomeOptions.enableTagEvents) {
            a.dispatchEvent(a.eventNames.posting, {
              endpointUrl: window.dataDomeOptions.endpoint
            });
          }
        } catch (n) {
          a.debug("Error when trying to send request.", n);
        }
      }
    }
  };
  this.getQueryParamsString = function (n, e, t, i, c) {
    var o = new r();
    var a = o.getDDSession();
    if (a == null && window.ddm) {
      a = window.ddm.cid;
    }
    var s;
    var f = n.o(a);
    s = a ? "&cid=" + encodeURIComponent(a) : "";
    var u = "jspl=" + encodeURIComponent(f) + "&eventCounters=" + encodeURIComponent(JSON.stringify(e)) + "&jsType=" + this.jsType + s + "&ddk=" + escape(encodeURIComponent(t)) + "&Referer=" + escape(encodeURIComponent(o.removeSubstringPattern(window.location.href, i).slice(0, 1024))) + "&request=" + escape(encodeURIComponent((window.location.pathname + window.location.search + window.location.hash).slice(0, 1024))) + "&responsePage=" + escape(encodeURIComponent(c)) + "&ddv=" + window.dataDomeOptions.version;
    if (window.dataDomeOptions.testingMode) {
      window.testJsData = [f, a];
    }
    return u;
  };
};
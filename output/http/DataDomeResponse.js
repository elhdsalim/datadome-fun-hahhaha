var r = require("../common/DataDomeTools.js");
var i = require("../common/DataDomeUrlTools.js");
var c = ["F45F521D9622089B5E33C18031FB8E", "10D43DA6B79A5089E1A7846864D6BD", "34C213C44735CBC8D9C08B65110F96", "87B024B36133DBAA93E054371373E7"];
module.exports = function (n) {
  var e = new r();
  this.parseResponseBody = function (t, r, i, c) {
    try {
      var o;
      var a;
      var s;
      var f;
      var u;
      var h;
      var l;
      var w;
      var d = typeof r == "string";
      if (d) {
        h = r.indexOf("dd={");
        l = r.indexOf("'cid':");
        w = r.slice(h).indexOf("}");
        a = r.indexOf("<style") > -1 || r.indexOf("<script") > -1;
        s = r.indexOf("{\"url\":\"") > -1;
        u = (f = h > -1 && l > h && l < h + w) || s;
      }
      if (d && u && a) {
        if (f) {
          var v;
          var b = h + "dd=".length;
          var y = b + r.slice(b).indexOf("}") + 1;
          var p = e.decodeHTMLEntity(r.slice(b, y));
          var m = JSON.parse(p.replace(/'/g, "\""));
          var F = m.s ? "&s=" + m.s : "";
          var L = m.t ? "&t=" + m.t : "";
          var U = m.e ? "&e=" + m.e : "";
          if (m.rt == "c") {
            v = "/captcha/";
          } else if (m.rt == "i") {
            v = "/interstitial/";
            U += m.b ? "&b=" + m.b : "";
          }
          o = {
            url: "https://" + m.host + v + "?initialCid=" + m.cid + "&hash=" + m.hsh + L + F + "&referer=" + encodeURIComponent(document.location.href) + U + "&cid=" + (m.cookie || e.getCookie())
          };
        } else if (s) {
          var A = r.indexOf("{\"url\":\"");
          var Q = A + r.slice(A).indexOf("}") + 1;
          var Y = r.slice(A, Q);
          var D = e.decodeHTMLEntity(Y);
          var R = decodeURIComponent(D);
          o = JSON.parse(R);
        }
        if (f) {
          n.i("chtp", i);
        }
      } else if (c || t && d && u) {
        o = d ? JSON.parse(r) : r;
      }
    } catch (e) {
      if (e && e.message) {
        try {
          n.i("cdcx", e.message.slice(0, 150));
        } catch (n) {}
      }
      return;
    }
    return o;
  };
  this.process = function (n, t, r, c, o, a, s) {
    if (window.DataDomeResponseDisplayed) {
      return false;
    }
    if (!n) {
      return false;
    }
    var f = this.parseResponseBody(o, n, a, s);
    var u = null;
    if (o && f) {
      u = e.decodeHTMLEntity(f.url);
    } else if (f) {
      u = f.url;
    }
    return !!u && !!i.isTrustedOrigin(u) && (window.dataDomeOptions.enableTagEvents && e.dispatchEvent(e.eventNames.blocked, {
      url: a,
      captchaUrl: u,
      responseUrl: u
    }), r && this.displayResponsePage({
      responsePageUrl: u,
      challengeType: s
    }), t && c && c.abort(), true);
  };
  this.displayResponsePage = function (n) {
    var t;
    var r = n.responsePageUrl;
    var o = n.challengeType;
    var a = n.root;
    var s = window.dataDomeOptions.enableTagEvents;
    var f = window.dataDomeOptions.isSalesforce;
    var u = e.isSafariUA() ? "height: -webkit-fill-available;" : "";
    var h = {
      dcInvisible: "visibility: hidden; position: absolute; top: -9999px; left: -9999px;",
      root: "width:100%;height:100%;background-color:#ffffff;",
      default: "height:100vh;" + u + "width:100%;position:fixed;top:0;left:0;z-index:2147483647;background-color:#ffffff;"
    };
    var l = Date.now();
    var w = 0;
    function d(n) {
      try {
        if (n.isTrusted && i.isTrustedOrigin(n.origin) && n.data) {
          var r = JSON.parse(n.data);
          if (r && r.eventType && r.responseType) {
            switch (r.eventType) {
              case "load":
                if (s) {
                  e.dispatchEvent(e.eventNames.responseDisplayed, {
                    responseType: r.responseType,
                    responseUrl: r.responseUrl,
                    rootElement: a || document.body
                  });
                }
                if (w > 0) {
                  document.getElementById("ddChallengeContainer" + l).style = a ? h.root : h.default;
                }
                w++;
                break;
              case "passed":
                var c = window.dataDomeOptions.sessionByHeader;
                var o = window.dataDomeOptions.overrideCookieDomain;
                var f = window.dataDomeOptions.disableAutoRefreshOnCaptchaPassed;
                var u = window.dataDomeOptions.replayAfterChallenge;
                function v() {
                  if (c) {
                    e.setDDSession(r.cookie);
                  }
                  if (o) {
                    r.cookie = e.replaceCookieDomain(r.cookie, window.location.hostname);
                  }
                  e.setCookieWithFallback(r.cookie);
                }
                if (window.removeEventListener) {
                  window.removeEventListener("message", d, false);
                } else if (window.detachEvent) {
                  window.detachEvent("onmessage", d);
                }
                if (!r.cookie) {
                  if (r.url) {
                    setTimeout(function () {
                      window.location.reload();
                    }, 100);
                  }
                  return;
                }
                if (s) {
                  v();
                  e.dispatchEvent(e.eventNames.captchaPassed);
                  e.dispatchEvent(e.eventNames.responsePassed, {
                    responseType: r.responseType
                  });
                }
                setTimeout(function () {
                  if (f) {
                    var n = document.querySelector("iframe[src^=\"" + b + "\"]");
                    if (n) {
                      var i = n.parentNode;
                      if (i && i.parentNode) {
                        i.parentNode.removeChild(i);
                      }
                    }
                    e.removeEventListener(window, "scroll", e.noscroll);
                    var c = document.getElementById("ddStyleCaptchaBody" + l);
                    v();
                    if (c && c.parentNode) {
                      c.parentNode.removeChild(c);
                    }
                    window.DataDomeCaptchaDisplayed = false;
                    window.DataDomeResponseDisplayed = false;
                    var o = document.querySelector("head");
                    if (o != null && t != null) {
                      o.removeChild(t);
                    }
                    window.postMessage(e.eventNames.captchaPassed, window.origin);
                    if (s) {
                      e.dispatchEvent(e.eventNames.responseUnload, {
                        responseType: r.responseType
                      });
                    }
                    if (u) {
                      e.dispatchEvent(e.internalEventNames.replayRequest);
                    }
                  } else {
                    if (s) {
                      e.dispatchEvent(e.eventNames.responseUnload, {
                        responseType: r.responseType
                      });
                    }
                    v();
                    window.location.reload();
                  }
                }, 500);
            }
          }
        }
      } catch (n) {}
    }
    if (window.addEventListener) {
      window.addEventListener("message", d, false);
    } else if (window.attachEvent) {
      window.attachEvent("onmessage", d);
    }
    if (!window.DataDomeResponseDisplayed) {
      var v;
      var b = r;
      v = f === undefined ? "ju" : f ? "js" : "jd";
      var y = "allow-scripts allow-same-origin allow-forms" + (c.indexOf(window.ddjskey) > -1 ? " allow-popups" : "");
      var p = "title=\"Verification system\" id=\"ddChallengeBody" + l + "\" width=\"100%\" height=\"100%\" sandbox=\"" + y + "\" allow=\"accelerometer; gyroscope; magnetometer\" FRAMEBORDER=\"0\" border=\"0\" scrolling=\"yes\" style=\"" + (a ? "" : "height:100vh;" + u) + "\"";
      try {
        if (typeof window.dataDomeOptions.challengeLanguage == "string") {
          r += "&lang=" + encodeURIComponent(window.dataDomeOptions.challengeLanguage);
        }
      } catch (n) {}
      var m = "<iframe src=\"" + r + "&dm=" + v + "\" " + p + "></iframe>";
      var F = o === e.ChallengeType.DEVICE_CHECK_INVISIBLE_MODE;
      var L = "<div id=\"ddChallengeContainer" + l + "\" style=\"" + (F ? h.dcInvisible : a ? h.root : h.default) + "\">" + m + "</div>";
      if (window.dataDomeOptions.sessionByHeader ? e.getDDSession() : e.getCookie()) {
        if (!F) {
          e.addEventListener(window, "scroll", e.noscroll);
          e.noscroll();
        }
        if (a && a.insertAdjacentHTML) {
          a.insertAdjacentHTML("afterbegin", L);
        } else {
          if (!F) {
            document.body.insertAdjacentHTML("beforeend", "<style id=\"ddStyleCaptchaBody" + l + "\"> html, body { margin: 0 !important; padding:0 !important; } body { height: 100vh !important; overflow: hidden; -webkit-transform: scale(1) !important; -moz-transform: scale(1) !important; transform: scale(1) !important; } </style>");
          }
          document.body.insertAdjacentHTML("beforeend", L);
        }
        (t = document.createElement("meta")).name = "viewport";
        t.content = "width=device-width, initial-scale=1.0";
        var U = document.querySelector("head");
        if (U != null) {
          U.appendChild(t);
        }
        window.DataDomeCaptchaDisplayed = true;
        window.DataDomeResponseDisplayed = true;
        if (s) {
          e.dispatchEvent(e.eventNames.captchaDisplayed, {
            captchaUrl: r,
            rootElement: a || document.body
          });
        }
      } else {
        var A = "<div style=\"display:none;\">" + L + "</div>";
        document.body.insertAdjacentHTML("beforeend", A);
        if (s) {
          e.dispatchEvent(e.eventNames.captchaError, {
            captchaUrl: r,
            rootElement: a || document.body,
            reason: "DataDome session not found"
          });
          e.dispatchEvent(e.eventNames.responseError, {
            responseUrl: r,
            rootElement: a || document.body,
            reason: "DataDome session not found"
          });
        }
      }
    }
  };
  this.displayResponsePagePublic = function (n, e) {
    this.displayResponsePage({
      responsePageUrl: n,
      root: e
    });
  }.bind(this);
};
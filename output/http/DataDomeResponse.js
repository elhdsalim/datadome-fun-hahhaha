var DataDomeTools = require("../common/DataDomeTools.js");
var DataDomeUrlTools = require("../common/DataDomeUrlTools.js");
// js keys that are allowed to have allow-popups in the challenge iframe sandbox
var POPUPS_ALLOWED_KEYS = ["F45F521D9622089B5E33C18031FB8E", "10D43DA6B79A5089E1A7846864D6BD", "34C213C44735CBC8D9C08B65110F96", "87B024B36133DBAA93E054371373E7"];
module.exports = function (wrapper) {
  var tools = new DataDomeTools();

  // parse the response body to extract challenge URL
  // 3 formats: dd={...} inline JS, {"url":"..."} HTML-encoded JSON, or raw JSON
  this.parseResponseBody = function (isXhr, body, challengeUrl, challengeType) {
    try {
      var result;
      var hasHtmlTags;
      var hasJsonUrl;
      var hasDdBlock;
      var isChallenge;
      var ddBlockStart;
      var cidIndex;
      var ddBlockLength;
      var isString = typeof body == "string";
      if (isString) {
        ddBlockStart = body.indexOf("dd={");
        cidIndex = body.indexOf("'cid':");
        ddBlockLength = body.slice(ddBlockStart).indexOf("}");
        hasHtmlTags = body.indexOf("<style") > -1 || body.indexOf("<script") > -1;
        hasJsonUrl = body.indexOf("{\"url\":\"") > -1;
        isChallenge = (hasDdBlock = ddBlockStart > -1 && cidIndex > ddBlockStart && cidIndex < ddBlockStart + ddBlockLength) || hasJsonUrl;
      }
      if (isString && isChallenge && hasHtmlTags) {
        // format 1: dd={...} inline block in HTML response
        if (hasDdBlock) {
          var routePath;
          var jsonStart = ddBlockStart + "dd=".length;
          var jsonEnd = jsonStart + body.slice(jsonStart).indexOf("}") + 1;
          var decoded = tools.decodeHTMLEntity(body.slice(jsonStart, jsonEnd));
          var ddParams = JSON.parse(decoded.replace(/'/g, "\""));
          var sParam = ddParams.s ? "&s=" + ddParams.s : "";
          var tParam = ddParams.t ? "&t=" + ddParams.t : "";
          var eParam = ddParams.e ? "&e=" + ddParams.e : "";
          if (ddParams.rt == "c") {
            routePath = "/captcha/";
          } else if (ddParams.rt == "i") {
            routePath = "/interstitial/";
            eParam += ddParams.b ? "&b=" + ddParams.b : "";
          }
          result = {
            url: "https://" + ddParams.host + routePath + "?initialCid=" + ddParams.cid + "&hash=" + ddParams.hsh + tParam + sParam + "&referer=" + encodeURIComponent(document.location.href) + eParam + "&cid=" + (ddParams.cookie || tools.getCookie())
          };
        // format 2: {"url":"..."} HTML-encoded JSON in HTML response
        } else if (hasJsonUrl) {
          var jsonUrlStart = body.indexOf("{\"url\":\"");
          var jsonUrlEnd = jsonUrlStart + body.slice(jsonUrlStart).indexOf("}") + 1;
          var jsonRaw = body.slice(jsonUrlStart, jsonUrlEnd);
          var jsonDecoded = tools.decodeHTMLEntity(jsonRaw);
          var jsonString = decodeURIComponent(jsonDecoded);
          result = JSON.parse(jsonString);
        }
        if (hasDdBlock) {
          wrapper.i("chtp", challengeUrl);
        }
      // format 3: raw JSON (from XHR or pre-parsed)
      } else if (challengeType || isXhr && isString && isChallenge) {
        result = isString ? JSON.parse(body) : body;
      }
    } catch (err) {
      if (err && err.message) {
        try {
          wrapper.i("cdcx", err.message.slice(0, 150));
        } catch (e) {}
      }
      return;
    }
    return result;
  };

  // process a response: parse it, verify trusted origin, display challenge if needed, abort XHR if needed
  this.process = function (body, shouldAbort, shouldDisplay, xhrObj, isXhr, challengeUrl, challengeType) {
    if (window.DataDomeResponseDisplayed) {
      return false;
    }
    if (!body) {
      return false;
    }
    var parsed = this.parseResponseBody(isXhr, body, challengeUrl, challengeType);
    var responseUrl = null;
    if (isXhr && parsed) {
      responseUrl = tools.decodeHTMLEntity(parsed.url);
    } else if (parsed) {
      responseUrl = parsed.url;
    }
    return !!responseUrl && !!DataDomeUrlTools.isTrustedOrigin(responseUrl) && (window.dataDomeOptions.enableTagEvents && tools.dispatchEvent(tools.eventNames.blocked, {
      url: challengeUrl,
      captchaUrl: responseUrl,
      responseUrl: responseUrl
    }), shouldDisplay && this.displayResponsePage({
      responsePageUrl: responseUrl,
      challengeType: challengeType
    }), shouldAbort && xhrObj && xhrObj.abort(), true);
  };

  // display the challenge iframe (captcha, interstitial, or invisible device check)
  this.displayResponsePage = function (config) {
    var viewportMeta;
    var pageUrl = config.responsePageUrl;
    var challengeType = config.challengeType;
    var rootElement = config.root;
    var enableTagEvents = window.dataDomeOptions.enableTagEvents;
    var isSalesforce = window.dataDomeOptions.isSalesforce;
    var safariHeightFix = tools.isSafariUA() ? "height: -webkit-fill-available;" : "";
    var styles = {
      dcInvisible: "visibility: hidden; position: absolute; top: -9999px; left: -9999px;",
      root: "width:100%;height:100%;background-color:#ffffff;",
      default: "height:100vh;" + safariHeightFix + "width:100%;position:fixed;top:0;left:0;z-index:2147483647;background-color:#ffffff;"
    };
    var timestamp = Date.now();
    var loadCount = 0;

    // listen for postMessage from the challenge iframe
    function onMessage(event) {
      try {
        if (event.isTrusted && DataDomeUrlTools.isTrustedOrigin(event.origin) && event.data) {
          var msg = JSON.parse(event.data);
          if (msg && msg.eventType && msg.responseType) {
            switch (msg.eventType) {
              case "load":
                if (enableTagEvents) {
                  tools.dispatchEvent(tools.eventNames.responseDisplayed, {
                    responseType: msg.responseType,
                    responseUrl: msg.responseUrl,
                    rootElement: rootElement || document.body
                  });
                }
                // on subsequent loads (e.g. after captcha retry), re-apply the container style
                if (loadCount > 0) {
                  document.getElementById("ddChallengeContainer" + timestamp).style = rootElement ? styles.root : styles.default;
                }
                loadCount++;
                break;
              case "passed":
                var sessionByHeader = window.dataDomeOptions.sessionByHeader;
                var overrideCookieDomain = window.dataDomeOptions.overrideCookieDomain;
                var disableAutoRefresh = window.dataDomeOptions.disableAutoRefreshOnCaptchaPassed;
                var replayAfterChallenge = window.dataDomeOptions.replayAfterChallenge;
                function applyCookie() {
                  if (sessionByHeader) {
                    tools.setDDSession(msg.cookie);
                  }
                  if (overrideCookieDomain) {
                    msg.cookie = tools.replaceCookieDomain(msg.cookie, window.location.hostname);
                  }
                  tools.setCookieWithFallback(msg.cookie);
                }
                if (window.removeEventListener) {
                  window.removeEventListener("message", onMessage, false);
                } else if (window.detachEvent) {
                  window.detachEvent("onmessage", onMessage);
                }
                if (!msg.cookie) {
                  if (msg.url) {
                    setTimeout(function () {
                      window.location.reload();
                    }, 100);
                  }
                  return;
                }
                if (enableTagEvents) {
                  applyCookie();
                  tools.dispatchEvent(tools.eventNames.captchaPassed);
                  tools.dispatchEvent(tools.eventNames.responsePassed, {
                    responseType: msg.responseType
                  });
                }
                setTimeout(function () {
                  if (disableAutoRefresh) {
                    var iframe = document.querySelector("iframe[src^=\"" + originalPageUrl + "\"]");
                    if (iframe) {
                      var container = iframe.parentNode;
                      if (container && container.parentNode) {
                        container.parentNode.removeChild(container);
                      }
                    }
                    tools.removeEventListener(window, "scroll", tools.noscroll);
                    var styleEl = document.getElementById("ddStyleCaptchaBody" + timestamp);
                    applyCookie();
                    if (styleEl && styleEl.parentNode) {
                      styleEl.parentNode.removeChild(styleEl);
                    }
                    window.DataDomeCaptchaDisplayed = false;
                    window.DataDomeResponseDisplayed = false;
                    var head = document.querySelector("head");
                    if (head != null && viewportMeta != null) {
                      head.removeChild(viewportMeta);
                    }
                    window.postMessage(tools.eventNames.captchaPassed, window.origin);
                    if (enableTagEvents) {
                      tools.dispatchEvent(tools.eventNames.responseUnload, {
                        responseType: msg.responseType
                      });
                    }
                    if (replayAfterChallenge) {
                      tools.dispatchEvent(tools.internalEventNames.replayRequest);
                    }
                  } else {
                    if (enableTagEvents) {
                      tools.dispatchEvent(tools.eventNames.responseUnload, {
                        responseType: msg.responseType
                      });
                    }
                    applyCookie();
                    window.location.reload();
                  }
                }, 500);
            }
          }
        }
      } catch (e) {}
    }
    if (window.addEventListener) {
      window.addEventListener("message", onMessage, false);
    } else if (window.attachEvent) {
      window.attachEvent("onmessage", onMessage);
    }
    if (!window.DataDomeResponseDisplayed) {
      var deployMode;
      var originalPageUrl = pageUrl;
      // dm param: "ju" = unknown/standard, "js" = salesforce, "jd" = non-salesforce explicit
      deployMode = isSalesforce === undefined ? "ju" : isSalesforce ? "js" : "jd";
      var sandboxRules = "allow-scripts allow-same-origin allow-forms" + (POPUPS_ALLOWED_KEYS.indexOf(window.ddjskey) > -1 ? " allow-popups" : "");
      var iframeAttrs = "title=\"Verification system\" id=\"ddChallengeBody" + timestamp + "\" width=\"100%\" height=\"100%\" sandbox=\"" + sandboxRules + "\" allow=\"accelerometer; gyroscope; magnetometer\" FRAMEBORDER=\"0\" border=\"0\" scrolling=\"yes\" style=\"" + (rootElement ? "" : "height:100vh;" + safariHeightFix) + "\"";
      try {
        if (typeof window.dataDomeOptions.challengeLanguage == "string") {
          pageUrl += "&lang=" + encodeURIComponent(window.dataDomeOptions.challengeLanguage);
        }
      } catch (e) {}
      var iframeHtml = "<iframe src=\"" + pageUrl + "&dm=" + deployMode + "\" " + iframeAttrs + "></iframe>";
      var isInvisible = challengeType === tools.ChallengeType.DEVICE_CHECK_INVISIBLE_MODE;
      var containerHtml = "<div id=\"ddChallengeContainer" + timestamp + "\" style=\"" + (isInvisible ? styles.dcInvisible : rootElement ? styles.root : styles.default) + "\">" + iframeHtml + "</div>";
      // only show challenge if user has a DataDome session
      if (window.dataDomeOptions.sessionByHeader ? tools.getDDSession() : tools.getCookie()) {
        if (!isInvisible) {
          tools.addEventListener(window, "scroll", tools.noscroll);
          tools.noscroll();
        }
        if (rootElement && rootElement.insertAdjacentHTML) {
          rootElement.insertAdjacentHTML("afterbegin", containerHtml);
        } else {
          if (!isInvisible) {
            document.body.insertAdjacentHTML("beforeend", "<style id=\"ddStyleCaptchaBody" + timestamp + "\"> html, body { margin: 0 !important; padding:0 !important; } body { height: 100vh !important; overflow: hidden; -webkit-transform: scale(1) !important; -moz-transform: scale(1) !important; transform: scale(1) !important; } </style>");
          }
          document.body.insertAdjacentHTML("beforeend", containerHtml);
        }
        (viewportMeta = document.createElement("meta")).name = "viewport";
        viewportMeta.content = "width=device-width, initial-scale=1.0";
        var head = document.querySelector("head");
        if (head != null) {
          head.appendChild(viewportMeta);
        }
        window.DataDomeCaptchaDisplayed = true;
        window.DataDomeResponseDisplayed = true;
        if (enableTagEvents) {
          tools.dispatchEvent(tools.eventNames.captchaDisplayed, {
            captchaUrl: pageUrl,
            rootElement: rootElement || document.body
          });
        }
      } else {
        // no session: hide the challenge, dispatch error
        var hiddenHtml = "<div style=\"display:none;\">" + containerHtml + "</div>";
        document.body.insertAdjacentHTML("beforeend", hiddenHtml);
        if (enableTagEvents) {
          tools.dispatchEvent(tools.eventNames.captchaError, {
            captchaUrl: pageUrl,
            rootElement: rootElement || document.body,
            reason: "DataDome session not found"
          });
          tools.dispatchEvent(tools.eventNames.responseError, {
            responseUrl: pageUrl,
            rootElement: rootElement || document.body,
            reason: "DataDome session not found"
          });
        }
      }
    }
  };
  this.displayResponsePagePublic = function (url, root) {
    this.displayResponsePage({
      responsePageUrl: url,
      root: root
    });
  }.bind(this);
};

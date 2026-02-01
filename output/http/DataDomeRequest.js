var DataDomeTools = require("../common/DataDomeTools");
module.exports = function (jsType) {
  this.jsType = jsType;

  // send fingerprint data to the DataDome API endpoint
  // needsResponse: if true, uses XHR (to read cookie from response); if false, uses sendBeacon (fire-and-forget)
  this.requestApi = function (jsKey, wrapper, eventCounters, referrerPattern, needsResponse, responsePage) {
    if (!window.ddShouldSkipFingerPrintReq) {
      var tools = new DataDomeTools();
      wrapper.i("jset", Math.floor(Date.now() / 1000));

      // fire-and-forget mode: use sendBeacon when no response is needed
      if (!needsResponse && window.navigator && window.navigator.sendBeacon && window.Blob) {
        var queryString = this.getQueryParamsString(wrapper, eventCounters, jsKey, referrerPattern, responsePage);
        var body = "URLSearchParams" in window ? new URLSearchParams(queryString) : new Blob([queryString], {
          type: "application/x-www-form-urlencoded"
        });
        window.navigator.sendBeacon(window.dataDomeOptions.endpoint, body);
        if (window.dataDomeOptions.enableTagEvents) {
          tools.dispatchEvent(tools.eventNames.posting, {
            endpointUrl: window.dataDomeOptions.endpoint
          });
        }

        // response mode: use XHR to read back the cookie
      } else if (window.XMLHttpRequest) {
        var xhr = new XMLHttpRequest();
        try {
          xhr.open("POST", window.dataDomeOptions.endpoint, needsResponse);
          xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
          var queryString = this.getQueryParamsString(wrapper, eventCounters, jsKey, referrerPattern, responsePage);
          tools.debug("xmlHttpString built.", queryString);
          if (window.dataDomeOptions.customParam !== null) {
            queryString += "&custom=" + window.dataDomeOptions.customParam;
          }

          xhr.onreadystatechange = function () {
            if (this && this.readyState == 4 && this.status == 200) {
              try {
                if (typeof this.responseText == "string" && !window.DataDomeResponseDisplayed) {
                  var response = JSON.parse(xhr.responseText);
                  if (response.cookie) {
                    // extract domain from Set-Cookie string
                    var domainStart = response.cookie.indexOf("Domain=");
                    var pathStart = response.cookie.indexOf("Path=");
                    var domain = "";
                    if (domainStart > -1 && pathStart > -1) {
                      domain = response.cookie.slice(domainStart + "Domain=".length, pathStart - "; ".length);
                    }

                    var hostname = window.location.hostname;
                    var overrideDomain = window.dataDomeOptions.overrideCookieDomain;
                    var enableFallback = window.dataDomeOptions.enableCookieDomainFallback;
                    // check if cookie domain doesn't match current hostname suffix
                    const domainMismatch = hostname.substring(hostname.length - domain.replace(/^\./, "").length) !== domain.replace(/^\./, "");

                    if (overrideDomain) {
                      // force cookie domain to current hostname
                      response.cookie = tools.replaceCookieDomain(response.cookie, window.location.hostname);
                      wrapper.i("dcok", tools.getCookieDomainFromCookie(response.cookie));
                    } else if (enableFallback && domain && domainMismatch) {
                      // try fallback domain hierarchy
                      response.cookie = tools.setCookieWithFallback(response.cookie);
                      wrapper.i("dcok", tools.getCookieDomainFromCookie(response.cookie));
                    } else {
                      wrapper.i("dcok", domain);
                    }

                    // if sessionByHeader or cookieByHeader mode, also store in localStorage
                    if ((window.ddCbh || window.ddSbh) && tools.isLocalStorageEnabled() && typeof localStorage.setItem == "function") {
                      var cookieValue = tools.getCookie(tools.dataDomeCookieName, response.cookie);
                      if (cookieValue != null) {
                        localStorage.setItem(window.dataDomeOptions.ddCookieSessionName, cookieValue);
                      }
                    }

                    tools.setCookie(response.cookie);

                    // if cookie has Partitioned attribute (CHIPS), remove the old unpartitioned one
                    if (tools.hasPartitionedAttribute(response.cookie)) {
                      var cookieDomain = tools.getCookieDomainFromCookie(response.cookie);
                      if (cookieDomain) {
                        tools.removeUnpartitionedCookieIfPartitionedOneIsPresent(cookieDomain);
                      }
                    }
                  }
                }
                if (window.dataDomeOptions.enableTagEvents) {
                  tools.dispatchEvent(tools.eventNames.posted, {
                    endpointUrl: window.dataDomeOptions.endpoint
                  });
                }
              } catch (e) { }
            }
          };
          tools.debug("Request sent.", xhr);
          xhr.send(queryString);
          if (window.dataDomeOptions.enableTagEvents) {
            tools.dispatchEvent(tools.eventNames.posting, {
              endpointUrl: window.dataDomeOptions.endpoint
            });
          }
        } catch (e) {
          tools.debug("Error when trying to send request.", e);
        }
      }
    }
  };

  // build the POST body with fingerprint payload, event counters, and metadata
  this.getQueryParamsString = function (wrapper, eventCounters, jsKey, referrerPattern, responsePage) {
    var tools = new DataDomeTools();
    var session = tools.getDDSession();
    if (session == null && window.ddm) {
      session = window.ddm.cid;
    }
    var cidParam;
    var fingerprintPayload = wrapper.o(session);
    cidParam = session ? "&cid=" + encodeURIComponent(session) : "";
    var queryString = "jspl=" + encodeURIComponent(fingerprintPayload) + "&eventCounters=" + encodeURIComponent(JSON.stringify(eventCounters)) + "&jsType=" + this.jsType + cidParam + "&ddk=" + escape(encodeURIComponent(jsKey)) + "&Referer=" + escape(encodeURIComponent(tools.removeSubstringPattern(window.location.href, referrerPattern).slice(0, 1024))) + "&request=" + escape(encodeURIComponent((window.location.pathname + window.location.search + window.location.hash).slice(0, 1024))) + "&responsePage=" + escape(encodeURIComponent(responsePage)) + "&ddv=" + window.dataDomeOptions.version;
    if (window.dataDomeOptions.testingMode) {
      window.testJsData = [fingerprintPayload, session];
    }
    return queryString;
  };
};

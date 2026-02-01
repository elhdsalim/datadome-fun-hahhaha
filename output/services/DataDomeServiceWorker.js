module.exports = function (n, e, t) {
  var r = t.dataDomeResponse;
  var i = 3;
  function c() {
    try {
      if (!window.DataDomeServiceWorkerConnected && window.MessageChannel && navigator.serviceWorker.controller && navigator.serviceWorker.controller.postMessage) {
        var t = new MessageChannel();
        if (t.port1 && t.port2) {
          navigator.serviceWorker.controller.postMessage({
            type: "INIT_PORT",
            dataDomeOptions: JSON.stringify(n),
            clientSideKey: e
          }, [t.port2]);
          t.port1.onmessage = function (n) {
            (function (n) {
              try {
                if (n.data && n.data.responsePageUrl) {
                  r.displayResponsePage({
                    responsePageUrl: n.data.responsePageUrl
                  });
                }
              } catch (n) {}
            })(n);
          };
          window.DataDomeServiceWorkerConnected = true;
        }
      } else if (i > 0) {
        setTimeout(function () {
          c();
          i--;
        }, 300);
      }
    } catch (n) {}
  }
  this.initListener = function () {
    if (typeof window != "undefined" && window.navigator && "serviceWorker" in window.navigator) {
      try {
        navigator.serviceWorker.ready.then(function () {
          c();
        }).catch(function (n) {});
        if (navigator.serviceWorker.controller) {
          c();
        }
      } catch (n) {}
    }
  };
};
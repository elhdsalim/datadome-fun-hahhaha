module.exports = function (options, jsKey, dependencies) {
  var dataDomeResponse = dependencies.dataDomeResponse;
  var retryCount = 3;

  // establish a MessageChannel with the DataDome service worker
  function connectToServiceWorker() {
    try {
      if (!window.DataDomeServiceWorkerConnected && window.MessageChannel && navigator.serviceWorker.controller && navigator.serviceWorker.controller.postMessage) {
        var channel = new MessageChannel();
        if (channel.port1 && channel.port2) {
          navigator.serviceWorker.controller.postMessage({
            type: "INIT_PORT",
            dataDomeOptions: JSON.stringify(options),
            clientSideKey: jsKey
          }, [channel.port2]);

          // listen for challenge responses from the service worker
          channel.port1.onmessage = function (event) {
            (function (message) {
              try {
                if (message.data && message.data.responsePageUrl) {
                  dataDomeResponse.displayResponsePage({
                    responsePageUrl: message.data.responsePageUrl
                  });
                }
              } catch (err) {}
            })(event);
          };
          window.DataDomeServiceWorkerConnected = true;
        }
      } else if (retryCount > 0) {
        setTimeout(function () {
          connectToServiceWorker();
          retryCount--;
        }, 300);
      }
    } catch (err) {}
  }

  this.initListener = function () {
    if (typeof window != "undefined" && window.navigator && "serviceWorker" in window.navigator) {
      try {
        navigator.serviceWorker.ready.then(function () {
          connectToServiceWorker();
        }).catch(function (err) {});
        if (navigator.serviceWorker.controller) {
          connectToServiceWorker();
        }
      } catch (err) {}
    }
  };
};

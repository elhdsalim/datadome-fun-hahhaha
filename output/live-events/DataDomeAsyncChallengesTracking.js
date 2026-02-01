var r = require("./../http/DataDomeRequest");
var i = require("./../common/DataDomeTools");
module.exports = function (n) {
  var e = new r("ac");
  var t = new i();
  var c = false;
  this.process = function () {
    t.addEventListener(window, "datadome-det-a", function () {
      if (window.dataDomeOptions && !c) {
        c = true;
        e.requestApi(window.ddjskey, n, [], window.dataDomeOptions.patternToRemoveFromReferrerUrl, true, window.dataDomeOptions.ddResponsePage);
      }
    });
  };
};
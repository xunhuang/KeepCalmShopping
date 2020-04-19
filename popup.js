$(document).ready(() => {
  chrome.storage.sync.get(function (result) {
    $("#monitorCostcoSwitch").prop("checked", result.monitorCostco);
    $("#monitorAmazonWholeFoodsSwitch").prop("checked", result.monitorAmazonWholeFoods);
    $("#monitorAmazonFreshSwitch").prop("checked", result.monitorAmazonFresh);
    $("#userPhone").val(result.userPhone);
  });

  $("#userPhone").change(event => {
    chrome.storage.sync.set({ userPhone: $("#userPhone").val() });
  });
  $("#monitorCostcoSwitch").change(event => {
    chrome.storage.sync.set({ monitorCostco: $("#monitorCostcoSwitch").prop("checked") });
    chrome.runtime.sendMessage({
      module: "Costco",
      command: "reset",
    });
  });
  $("#monitorAmazonWholeFoodsSwitch").change(event => {
    chrome.storage.sync.set({
      monitorAmazonWholeFoods: $("#monitorAmazonWholeFoodsSwitch").prop("checked")
    });
  });
  $("#monitorSayWeeeSwitch").change(event => {
    chrome.storage.sync.set({
      monitorSayWeee: $("#monitorSayWeeeSwitch").prop("checked")
    });
  });
  $("#monitorAmazonFreshSwitch").change(event => {
    chrome.storage.sync.set({
      monitorAmazonFresh: $("#monitorAmazonFreshSwitch").prop("checked")
    });
  });
});

$(document).ready(() => {
  chrome.storage.sync.get(function (result) {
    $("#monitorCostcoSwitch").prop("checked", result.monitorCostco);
    $("#monitorAmazonWholeFoodsSwitch").prop("checked", result.monitorAmazonWholeFoods);
    $("#monitorAmazonFreshSwitch").prop("checked", result.monitorAmazonFresh);
    $("#monitorSayWeeeSwitch").prop("checked", result.monitorSayWeee);
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
    chrome.runtime.sendMessage({
      module: "AmazonWholeFoods",
      command: "reset",
    });
  });
  $("#monitorSayWeeeSwitch").change(event => {
    chrome.storage.sync.set({
      monitorSayWeee: $("#monitorSayWeeeSwitch").prop("checked")
    });
    chrome.runtime.sendMessage({
      module: "SayWeee",
      command: "reset",
    });
  });
  $("#monitorAmazonFreshSwitch").change(event => {
    chrome.storage.sync.set({
      monitorAmazonFresh: $("#monitorAmazonFreshSwitch").prop("checked")
    });
    chrome.runtime.sendMessage({
      module: "AmazonFresh",
      command: "reset",
    });
  });
});

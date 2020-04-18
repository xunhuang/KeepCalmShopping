console.log("Background Page started");

chrome.webRequest.onBeforeSendHeaders.addListener(
  function (details) {
    if (details.url.includes("delivery_options")) {
      chrome.storage.sync.set({
        CostcoDeliveryURL: details.url
      });
    }
    return {
      requestHeaders: details.requestHeaders
    };
  },
  {
    urls: [
      "*://*.amazon.com/*",
      "*://*.costco.com/*",
    ]
  },
  ["requestHeaders"]
);

async function getOptionFromStorage(storage_key) {
  const data = await new Promise(resolve => {
    chrome.storage.sync.get(storage_key, function (result) {
      resolve(result);
    });
  });
  return data[storage_key];
}

async function sendNotification(message) {
  let phone = await getOptionFromStorage("userPhone");
  const url = "https://us-central1-covid-19-live.cloudfunctions.net/datajsonNew?";
  const response = await self.fetch(url + new URLSearchParams({
    msg: message,
    number: phone,
  }));
  const text = await response.text(); // there's response.json() as well
  console.log(text);
}

var CostcoFound = false;

chrome.runtime.onMessage.addListener(
  async function (request, sender, sendResponse) {
    if (request.module == "Costco") {
      if (request.command == "monitor") {
        let monitorCostco = await getOptionFromStorage("monitorCostco");
        if (!monitorCostco) {
          console.log("Monitor costco is off.")
          return;
        }
        let found = false;
        let availdays = CostcoAvailableDays(request.content);
        if (availdays.length > 0) {
          console.log("available!");
          console.log(availdays);
          found = true;
        } else {
          console.log("Not available, be patient");
          found = false
        }

        if (found !== CostcoFound) {
          if (found) {
            let dates = availdays.map(d => d.date).join(", ");
            sendNotification(`Check Costco! ${availdays.length} days have slots. ` + dates);
          } else {
            sendNotification(`Costco slots are gone!`);
          }
          CostcoFound = found;
        }
      } else if (request.command == "reset") {
        let monitorCostco = await getOptionFromStorage("monitorCostco");
        if (monitorCostco) {
          console.log(`Monitor costco has started!`);
          sendNotification(`Monitor costco has started.`);
        } else {
          console.log(`Monitor costco has been turned off!`);
          sendNotification(`Monitor costco is turned off.`);
        }
        CostcoFound = false;
      }
    }
  });

function CostcoAvailableDays(data) {
  let result = [];
  try {
    let r = JSON.parse(data);
    let days = r.service_options.days;
    for (let day of days) {
      if (day.message === null) {
        result.push(day);
        continue;
      }
      let flatmessage = day.message.map(msgarray => {
        return msgarray.strings.map(msg => msg.value).join();
      }).join();
      if (!flatmessage.toLowerCase().includes("sorry")) {
        result.push(day);
      }
    }
  } catch (e) {
    console.log(e);
    return [];
  }
  return result;
}
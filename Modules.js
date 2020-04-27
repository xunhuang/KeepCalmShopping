
async function getOptionFromStorage(storage_key) {
  const data = await new Promise(resolve => {
    chrome.storage.sync.get(storage_key, function (result) {
      resolve(result);
    });
  });
  return data[storage_key];
}

async function getServerResults(url) {
  const response = await self.fetch(url);
  return await response.text(); // there's response.json() as well
}

function whichModule(url) {
  if (url.startsWith("https://sameday.costco.com/store/checkout")) {
    return Module.Costco;
  }
  if (url.startsWith("https://www.amazon.com/gp/buy/shipoptionselect/handlers/display.html")) {
    return Module.AmazonWholeFoods;
  }
  if (url.startsWith("https://www.sayweee.com")) {
    return Module.SayWeee;
  }
  return null;
}

class ModuleType {
  constructor() {
    this.FoundState = false;
  }
  name() { throw "no implemented" }
  monitorSetting() { throw "no implemented" }
  async proccesor() { throw "no implemented" }
  availableSlots() { throw "no implemented" }
  prettyMessageFromSlots() { throw "no implemented" }
};

function cleanText(text) {
  return text.replace(/  +/g, ' ')
    .replace(/^\s*$(?:\r\n?|\n)/gm, "");
}

class AmazonWholeFoods extends ModuleType {
  name() { return "Amazon" }
  monitorSetting() { return "monitorAmazonWholeFoods" }
  async proccesor() {
    let result;
    console.log('Checking Whole Foods');
    let url = "https://www.amazon.com/gp/buy/shipoptionselect/handlers/display.html";
    result = await getServerResults(url);
    return result;
  }
  availableSlots(data) {
    let result = [];
    const $ = cheerio.load(data);
    let days = $("div.ufss-slotselect");
    console.log(days);

    let freshslots = $("#daySelector .a-list-item .a-list-item ");
    let slots = [];
    freshslots.map(s => slots.push(freshslots[s]));
    for (let slot of slots) {
      console.log(cleanText($(slot).text()));
      let text = cleanText($(slot).text());
      if (!text.toLocaleLowerCase().includes("not available")) {
        result.push({ type: "fresh", text: text });
      }
    }

    days.map(s => {
      let day = days[s];
      let slots = [];
      let slots1 = cheerio(day, ".ufss-available");
      slots1.map(s => slots.push(slots1[s]));
      let slots2 = cheerio(day, "ul.ufss-slot-list li.ufss-slot-container");
      slots2.map(s => slots.push(slots2[s]));

      for (let slot of slots) {
        let html = cheerio(slot).text();
        let text = cleanText(html);
        if (!text.toLocaleLowerCase().includes("not available")
          && !text.toLocaleLowerCase().includes("no delivery")) {
          result.push({ type: "wholefoods", text: text });
        }
      }
      result = [...new Set(result)];
    })
    return result;
  }
  prettyMessageFromSlots(slots) {
    let entity = "Amazon";
    if (slots.length > 0) {
      entity = slots[0].type === "fresh" ? "Amazon Fresh" : "Amazon Whole Foods";
    }
    return `Check ${entity} -  ${slots.length} slots: ` + slots.map(s => s.text).join(",");
  }

}

class Costco extends ModuleType {
  name() { return "Costco" }
  monitorSetting() { return "monitorCostco" }
  async proccesor() {
    let result;
    console.log('Checking costco');
    let CostcoDeliveryURL = await getOptionFromStorage("CostcoDeliveryURL");
    result = await getServerResults(CostcoDeliveryURL);
    return result;

  }
  availableSlots(data) {
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
  prettyMessageFromSlots(slots) {
    return `Check Costco -  ${slots.length} slots: ` + slots.map(d => d.date).join(", ");
  }
}


class SayWeee extends ModuleType {

  name() { return "SayWeee" }
  monitorSetting() { return "monitorSayWeee" }
  async fetchItems() {
    const itemlist = [95272, 94161, 97078, 48574, 96837, 60193, 60633, 30878, 7259, 55950, 94060, 9819, 1079, 29843, 37009];
    let handles = itemlist.map(i => getServerResults(`https://www.sayweee.com/product/view/${i}`));
    let results = await Promise.all(handles);
    return results;
  }
  async proccesor() {
    let result;
    console.log('Checking SayWeee');
    result = await this.fetchItems();
    return result;
  }
  availableSlots(data) {
    console.log(data);
    const minThreshold = 3;
    let result = [];
    for (let entry of data) {
      if (!entry.includes("availableDates = false")) {
        result.push(entry);
      }
    }

    if (result.length < minThreshold) {
      return [];
    }
    /*
    const $ = cheerio.load(data);
    let entries = $(".product-media-list > div").length;
    let disabled = $("div.product-unavailable > div.disable-cart").length;
    if (entries > disabled + 10) {
      result.push({ entries: entries, disabled: disabled });
    }
    console.log(`${entries} item listed with ${disabled} item not available`);
    */
    return result;
  }
  prettyMessageFromSlots(slots) {
    return `SayWeee! ${slots.length} item checked is available.`;
    // return `SayWeee! ${slots[0].entries} item listed with ${slots[0].disabled} item not available`;
  }
}

const Module = {
  Costco: new Costco(),
  AmazonWholeFoods: new AmazonWholeFoods(),
  SayWeee: new SayWeee(),
}
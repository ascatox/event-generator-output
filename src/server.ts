// const pot = process.env.PORT || 3000;
const fabricConfig = require('../resources/config-fabric-network.json');
const config = require('../conf/config.json');
import * as bodyParser from 'body-parser';
import * as schedule from 'node-schedule';
import * as async from 'async';
import {logger} from './Logger';
import {ConveyorBay} from './model/ConveyorBay';
import {ConveyorItemType} from './model/ConveyorItemType';
import {ConveyorItem} from './model/ConveyorItem';
import {LedgerClient} from 'node-ledger-client';


/* app/server.ts */

// Import everything from express and assign it to the express variable
import * as express from 'express';

// Import WelcomeController from controllers entry point
import {LedgerController} from './controllers';
import {read} from 'fs';
var bays: ConveyorBay[] = [];
var timeout;
var ledgerClient;

// Create a new express application instance
const app: express.Application = express();
// The port the express app will listen on
const port: number = 3000;

// Mount the WelcomeController at the /welcome route
app.use('/ledger', LedgerController);

// Serve the application at the given port
app.listen(port, () => {
  // Success callback
  console.log(`Listening at http://localhost:${port}/`);
});


/**
 * Shuffles array in place.
 * @param {Array} a items An array containing the items.
 */
function shuffle(a) {
  var j, x, i;
  for (i = a.length - 1; i > 0; i--) {
    j = Math.floor(Math.random() * (i + 1));
    x = a[i];
    a[i] = a[j];
    a[j] = x;
  }
  return a;
}



/**
 * Returns a random integer between min (inclusive) and max (inclusive)
 * Using Math.round() will give you a non-uniform distribution!
 */
function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomString(length, chars) {
  var result = '';
  for (var i = length; i > 0; --i)
    result += chars[Math.floor(Math.random() * chars.length)];
  return result;
}

function objectEquals(obj1, obj2) {
  for (var i in obj1) {
    if (obj1.hasOwnProperty(i)) {
      if (!obj2.hasOwnProperty(i)) return false;
      if (obj1[i] != obj2[i]) return false;
    }
  }
  for (var i in obj2) {
    if (obj2.hasOwnProperty(i)) {
      if (!obj1.hasOwnProperty(i)) return false;
      if (obj1[i] != obj2[i]) return false;
    }
  }
  return true;
}

function contains(items, item) {
  //console.log('bay\'s items=' + JSON.stringify(items));
  //console.log('item to search=' + JSON.stringify(item));
  if ((items == null) || (item == null)) {
    return false;
  }

  for (var i = 0; i < items.length; i++) {
    // if (JSON.encode(items[i]) == JSON.encode(item)) {
      if (items[i] == null) {
        continue;
      } 
    //console.log('bay\'s item[i]=' + JSON.stringify(items[i]));
    if (objectEquals(items[i], item)) {
      return true;
    }
  }

  return false;
}



function removeObjectFromArray(items, item) {
  if ((items == null) || (item == null)) {
    return null;
  }
  for (var i = 0; i < items.length; i++) {
    if (items[i] === item) {
      items.splice(i, 1);
      console.log('found and deleted');
      return items;
    }
    if (items[i] instanceof Array){
      for (var j = 0; j < items.length; j++) {
        if (items[i][j] === item) {
          items[i].splice(j, 1);
          console.log('found and deleted');
          return items;
        }
      }
    }
  }
  return items;
}


function cleanObjectFromArray(items, item) {
  if ((items == null) || (item == null)) {
    return null;
  }
  for (var i = 0; i < items.length; i++) {
    if (items[i] === item) {
      items[i]=[];
      console.log('found and deleted');
      return items;
    }
    if (items[i] instanceof Array){
      for (var j = 0; j < items.length; j++) {
        if (items[i][j] === item) {
          items[i][j]=[];
          console.log('found and deleted');
          return items;
        }
      }
    }


  }
  return items;
}


async function editConveyorBay(json: string) {
  console.log('***editConveyorBay***');
  try {
    return await ledgerClient.doInvoke('editConveyorBay', [json]);
  } catch (err) {
    throw new Error(err);
  }
}

async function editConveyorBay2(bay: ConveyorBay) {
  console.log('***editConveyorBay***');
  try {
    return await ledgerClient.doInvoke('editConveyorBay', [bay]);
  } catch (err) {
    throw new Error(err);
  }
}


async function getBays() {
  console.log('***getBays***');
  try {
    return await ledgerClient.doInvoke('getBays', []);
  } catch (err) {
    throw new Error(err);
  }
}

async function conveyorItemIntoConveyorBay(item:ConveyorItem) {
  console.log('***conveyorItemIntoConveyorBay***');
  try {
    return await ledgerClient.doInvoke('conveyorItemIntoConveyorBay', [JSON.stringify(item)]);
  } catch (err) {
    throw new Error(err);
  }
}


async function controlBays() {
  console.log('***controlBays***');
  try {
    let bayOne = new ConveyorBay('1', 10, 5, true, 1, new Date());
    return await ledgerClient.doInvoke('controlBays', [JSON.stringify(bayOne)]);
  } catch (err) {
    throw new Error(err);
  }
}

function generateFakeItem(id) {
  var item1: ConveyorItem = new ConveyorItem();
  item1.id = getRandomInt(0, 1000000);
  item1.state = ConveyorItem.State.InConveyorBelt;
  item1.conveyorBay = getBayByID(id);
  var item2: ConveyorItem = new ConveyorItem();
  item2.id = getRandomInt(0, 1000000);
  item2.state = ConveyorItem.State.InConveyorBelt;
  item2.conveyorBay = getBayByID(id);
  return [item1,item2];
}

function getBayByID(id) {
  for (var i = 0; i < bays.length; i++) {
    if (bays[i].id == id) return bays[i];
  }
}

async function getItemsByBay(json: string) {
  console.log('***getItemsByBay***' + json);
  try {
    //return await generateFakeItem(json.match(/\d+/));
    return await ledgerClient.doInvoke('getItemsByBay', [""+json.match(/\d+/)]);
  } catch (err) {
    throw new Error(err);
  }
}



(function main() {
  // LEDGER SECTION

  var items: ConveyorItem[][] = [];
  var totalItems: ConveyorItem[] = [];
  var bayIndex=[];

  const ledger = async () => {
    ledgerClient = await LedgerClient.init(fabricConfig);
    bays = JSON.parse(await getBays());
    //console.log('bays=' + JSON.stringify(bays));
    console.log('bays length=' + bays.length);
    bayIndex =
        Array.apply(null, {length: bays.length}).map(Number.call, Number);
    bayIndex = shuffle(bayIndex);
    console.log('bayIndex=' + JSON.stringify(bayIndex));
    for (var j = 0; j < bays.length; j++) {
      console.log('id=' + bays[j].id);
      console.log('capacity=' + bays[j].capacity);
      console.log('load=' + bays[j].load);
      console.log('datetime=' + bays[j].datetime);
    }

    

    for (var i = 0; i < bays.length; i++) {
      // var res= ledgerClient.doInvoke('getItemsByBay', JSON.stringify("1"));
      // items[i] = await (ledgerClient.doInvoke('getItemsByBay', '' + i));
     // console.log("id="+bays[i].id);
      items[i] = JSON.parse(await getItemsByBay(JSON.stringify('' + bays[i].id)));
      //console.log(" items[i]="+JSON.stringify( items[i]));
      console.log(" items.length="+items[i].length);

      for (var j = 0; j < items[i].length; j++) {
      console.log(
          'items[' + j + '].id=' + items[i][j].id +
          ' bay.id=' + items[i][j].conveyorBay.id);
      totalItems.push(items[i][j]);
      }
    }
  };
  ledger();


  console.log('items length=' + items.length);
  // Index bays id list

  var j = schedule.scheduleJob(config.cronExpressionItemScanner, function() {
    if (bays.length==0){
      return;
    }
    if (totalItems.length==0){
      return;
    }
    // Get a random item
    var n_item = getRandomInt(0, totalItems.length - 1);
  

    (function theLoop(data, bayIndex, i) {
     
      setTimeout(function() {
        console.log('processing bay ' + bayIndex[i - 1]+"...");
        var foundItem = false;
        var itemFound:ConveyorItem;
        // Verify if bay contains item in its list
        if (contains(items[bayIndex[i - 1]], totalItems[n_item])) {
          console.log('found in bay with '+bays[bayIndex[i - 1]].id);
          foundItem = true;
          itemFound=totalItems[n_item];
          const conv = async () => {
            await conveyorItemIntoConveyorBay(itemFound);
          }
          conv();
          //console.log("PRE TOTAL LIST="+JSON.stringify(totalItems));
          // Delete from complete list
          totalItems = removeObjectFromArray(totalItems, itemFound);
          //console.log("POST TOTAL LIST="+JSON.stringify(totalItems));


          // Delete from bay list
          //console.log("PRE BAY LIST="+JSON.stringify([items]));
          console.log("items da gestire="+totalItems.length);
          items =
            removeObjectFromArray(items, itemFound);
          //console.log("POST BAY LIST="+JSON.stringify([items]));
          
          //console.log("cache items ="+JSON.stringify(items));
        } else {
          //console.log('not found');
        }
        if ((--i) && (!foundItem)&&(totalItems.length>0)) {   // If i > 0, keep going
          theLoop(data, bayIndex, i);  // Call the loop again
        }else{
          //RESHUFFLE BAYS
          bayIndex =
          Array.apply(null, {length: bays.length}).map(Number.call, Number);
          bayIndex = shuffle(bayIndex);
        }
      }, 2000);
    
    })(null, bayIndex, bays.length);
    console.log('ITEM IN GESTIONE id=' + totalItems[n_item].id +" for bay.id="+totalItems[n_item].conveyorBay.id);
    
  })

 
  var j = schedule.scheduleJob(config.cronExpressionHealthBeat, function() {
    const healthbeat = async () => {
    console.log('********* keep-alive *********');
    var updatedItems: ConveyorItem[][] = [];
    var updatedTotalItems: ConveyorItem[] = [];
    // let bay = new ConveyorBay('1', 10, 5, true, 1, new Date());
    const keepalive = async () => {


      for (var i = 0; i < bays.length; i++) {   
        bays[i].datetime = new Date(Date.now());
        await editConveyorBay(JSON.stringify(bays[i]));
      }
      //Updating ITEMS list
      for (var i = 0; i < bays.length; i++) {
        // var res= ledgerClient.doInvoke('getItemsByBay', JSON.stringify("1"));
        // items[i] = await (ledgerClient.doInvoke('getItemsByBay', '' + i));
       // console.log("id="+bays[i].id);
        updatedItems[i] = JSON.parse(await getItemsByBay(JSON.stringify('' + bays[i].id)));
        //console.log(" items[i]="+JSON.stringify( updatedItems[i]));
        console.log("updatedItems.length="+updatedItems[i].length);
  
        for (var j = 0; j < updatedItems[i].length; j++) {
        console.log(
            'items[' + i + ']=' + updatedItems[i][j].id +
            ' bay.id=' + updatedItems[i][j].conveyorBay.id);
            updatedTotalItems.push(updatedItems[i][j]);
        }
      }
      if (updatedTotalItems.length>0){
        console.log("replacing in memory items..."+updatedTotalItems.length+" new items")
        totalItems=updatedTotalItems;
        items=updatedItems;
      }
    };
    keepalive();   
  }
  healthbeat();
  })
})();

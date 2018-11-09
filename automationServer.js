const fs = require('fs');
const util = require('util');
const mqttHandler = require('./mqttHandler');
const https = require('https');


const readFile = util.promisify(fs.readFile);
const SUNSET_DELAY = 8;
let temp;
let stack;
let sunset = "17:30";


function popAction(temp, lifo) {
  console.log("Action performed => "+ lifo.name + ((lifo.state)?" turned ON":" turned OFF"));
  mqttHandler.constructCmnd(temp,lifo);
}

async function verifyNextAction() {
  try {
  if(stack.length > 0) {
    var currentTime = new Date();
    if((currentTime.getHours() == new Date(stack[stack.length -1 ].time).getHours()) 
    && (currentTime.getMinutes() == new Date(stack[stack.length -1].time).getMinutes())) {
      var lifo = stack.pop();
      popAction(temp,lifo);
      while(lifo.time == stack[stack.length -1 ].time) {
          lifo = stack.pop();
          popAction(temp,lifo);
      }
    }
  }
} catch(err){}
}

function validDay(days, current) {
  days.forEach(day => {
    if (day == current)
      return true;
  })
  return false;
}
function rebuildStack() {
  stack = [];
  temp.forEach(element => {
    element.scheduled_activities.forEach(item => {
      if(item.weekdays === "*" || validDay(item.weekdays.split(",") , new Date().getDay())) {
        var date;
        if (item.time === "SUNSET") {
          date = sunset;
          date = new Date().setHours(sunset.split(":")[0],sunset.split(":")[1]);
          date = new Date(date).setSeconds(00);
        } else {
        date = new Date().setHours(item.time.split(":")[0],item.time.split(":")[1]);
        date = new Date(date).setSeconds(00);
        }
        var action = {
        name: element.name,
        state: true,
        time: date
      }
   
      if(item.hours === "" && item.minutes === "") { //Daily shutdown signal, no Gap => Hours: 0 , Minutes: 00
        action.state = false;
        if(action.time >= new Date()) {
        stack.push(action);
        }
      } else {                                       //Regular command. Goes on and after the gap , off.
        if(action.time >= new Date()) {
          stack.push(action);                        // on action is added to event stack
      }
        
        var modified_date = new Date (action.time).setMinutes(new Date(action.time).getMinutes() + (parseInt(item.hours) * 60) + parseInt(item.minutes));
        modified_date = new Date(modified_date).setSeconds(00);
        var action_down = {                        //state gets set to off and time is modified according to the assigned gap in modified_date
          name: element.name,
          state: false,
          time: modified_date
        }  
        if(action_down.time >= new Date()) {
          stack.push(action_down);                  //off action is added to event stack
        }  
       }
      } 
    });
  });
  stack = stack.sort(function(a,b) {
    return (new Date(a.time) < new Date(b.time)) 
  })
  for (var i = 0; i < stack.length; i++) {
    console.log(stack[i].name +"\t " +stack[i].state +"\t@ ==> " +new Date(stack[i].time))
  }
}

async function readConfig(flag) 
{
  try 
  {
    const content = await readFile('./config.js', 'utf8');
    var elements = JSON.parse(content);

    if(JSON.stringify(temp) != JSON.stringify(elements) || flag ) 
    { 
      getSunset(elements);
    } 
  } catch (e) 
  {
    console.error(e);
  }
}

 function getSunset(elements) {
     https.get('https://api.sunrise-sunset.org/json?lat=9.974050&lng=-84.136708&date=today&formatted=0', (resp) => {
    let data = '';
  resp.on('data', (chunk) => {
      data += chunk;
    });
    resp.on('end', () => {
      var tempTime = (new Date(JSON.parse(data).results.sunset).toTimeString().split(":"));
      sunset = tempTime[0] + ":" + (parseInt(tempTime[1]) + SUNSET_DELAY);
      constructConfig(elements);
    });
  }).on("error", (err) => {
    console.log("Error: " + err.message);
    constructConfig(elements);
  });
}


function constructConfig(elements) {
  stack = [];
  temp = "";
  console.log("\n\n\t\tFRANCOSTA 263 - HOMEBOT SERVICE");
  console.log("🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹");
  console.log(new Date().toLocaleDateString() + " " + new Date().toLocaleTimeString());
  console.log("Today's sunset: " + sunset);
  console.log("\nInstalling recipes...");
  temp = elements;
  console.log("Rebuilding event stack...");
  rebuildStack();
  console.log("\n-> All done! 👍");
  console.log("🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹");
}




function thread() 
{
  readConfig(0);
  verifyNextAction();
  var currentTime = new Date();
  if(currentTime.getHours() === 19 && currentTime.getMinutes() === 39 && currentTime.getSeconds() < 1.5 ) {
    console.log("\n\n--> New day, new me...");
    console.log(new Date());
    readConfig(true);
  }
}


setInterval(thread, 1500);

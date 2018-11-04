const fs = require('fs');
const util = require('util');
const mqttHandler = require('./mqttHandler');

const readFile = util.promisify(fs.readFile);
let temp;
let stack;

async function verifyNextAction() {
  if(stack.length > 0) {
    var currentTime = new Date();
    if((currentTime.getHours() == new Date(stack[stack.length -1 ].time).getHours()) 
    && (currentTime.getMinutes() == new Date(stack[stack.length -1].time).getMinutes())) {
      var lifo = stack.pop();
      console.log("Action performed => "+ lifo.name + ((lifo.state)?" turned ON":" turned OFF"));
      mqttHandler.constructCmnd(temp,lifo);
    }
  }
}

function validDay(days, current) {
  days.forEach(day => {
    if (day == current)
      return true;
  })
  return false;
}
function rebuildStack() 
{
  stack = [];
  temp.forEach(element => {
    element.scheduled_activities.forEach(item => {
      if(item.weekdays === "*" || validDay(item.weekdays.split(",") , new Date().getDay())) {
        var date = new Date().setHours(item.time.split(":")[0],item.time.split(":")[1]);
        date = new Date(date).setSeconds(00);
        var action = {
        name: element.name,
        state: true,
        time: date
      }
   
      if(item.hours === "" && item.minutes === "") {//Daily shutdown signal, no Gap => Hours: 0 , Minutes: 00
        action.state = false;
        if(action.time >= new Date()) {
        stack.push(action);
        }
      } else {                                     //Regular command. Goes on and after the gap , off.
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

async function readConfig() 
{
  try 
  {
    const content = await readFile('./config.js', 'utf8');
    var elements = JSON.parse(content);

    if(JSON.stringify(temp) != JSON.stringify(elements)) 
    { 
      stack = [];
      temp = "";
      console.log("\n\n🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹");
      console.log("Installing recipes...");
      temp = elements;
      console.log("-> Done! 👍\n");
      console.log("Rebuilding event stack...");
      rebuildStack();
      console.log("\n-> Done! 👍");
      console.log("🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹");
    }
  } 
  catch (e) 
  {
    console.error(e);
  }
}


function thread() 
{
  readConfig();
  verifyNextAction();
  var currentTime = new Date();

  if(currentTime.getHours() === 00 && currentTime.getMinutes() === 00 && currentTime.getSeconds() < 2 ) { 
    console.log("New day, new me. Rebuilding event stack...");
    rebuildStack();
    console.log("\n-> Done! 👍");
  }
  }

setInterval(thread, 1500);
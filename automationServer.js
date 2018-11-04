const fs = require('fs');
const util = require('util');
var mqtt = require('mqtt');
var client  = mqtt.connect('mqtt://192.168.0.105');

const readFile = util.promisify(fs.readFile);
var temp;
var stack;

function validDay(days, current) {
  days.forEach(day => {
    if (day == current)
      return true;
  })
  return false;
}
function rebuildStack() 
{
  temp.forEach(element => {
    element.scheduled_activities.forEach(item => {
      if(item.weekdays == "*" || validDay(item.weekdays.split(",") , new Date().getDay())) {
        var date = new Date().setHours(item.time.split(":")[0],item.time.split(":")[1]);
        date = new Date(date).setSeconds(00);
        var action = {
        name: element.name,
        state: true,
        time: date
      }
      if(action.time >= new Date()) {
      if(item.hours == "" && item.minutes == "") { //Daily shutdown signal, no Gap => Hours: 0 , Minutes: 00
        action.state = false;
        stack.push(action);
      } else {                                    //Regular command. Goes on and after the gap , off.
        stack.push(action);// on action is added to event stack
        var modified_date = new Date (action.time).setMinutes(new Date(action.time).getMinutes() + (parseInt(item.hours) * 60) + parseInt(item.minutes));
        modified_date = new Date(modified_date).setSeconds(00);
        var action_down = { //state gets set to off and time is modified according to the assigned gap in modified_date
          name: element.name,
          state: false,
          time: modified_date
        }  
        stack.push(action_down); //off action is added to event stack
        }
      } 
      } 
    });
  });
  stack = stack.sort(function(a,b) {
    return (new Date(a.time) > new Date(b.time)) 
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

function verifyNextAction() {


}
function thread() 
{
  client.publish("cmnd/fan/POWER","0");
  readConfig();
}

setInterval(thread, 1500);
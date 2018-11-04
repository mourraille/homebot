var mqtt = require('mqtt');
var client  = mqtt.connect('mqtt://192.168.0.105');

module.exports = {
    constructCmnd: function(config, element) {
      config.forEach(item => {
          if(item.name == element.name) {
            switch(item.type) {
              case "SWITCH":  
                switchCommand(element, item.topic);
                break;
              case "FAN":  
                switchCommand(element, item.topic);
                break;
              default:
                break;
            }
          }
        
      }); 
    }
}

function switchCommand(element, topic) {
  (element.state) ? client.publish(topic,"1"):client.publish(topic,"0");
}

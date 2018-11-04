[
    { 
    "name": "Fan",
    "type": "FAN",
    "topic": "cmnd/fan/POWER",
    "threshold" : "25",
    "scheduled_activities" : [
        {
            "time":"00:30",
            "hours": "",
            "minutes":"",
            "weekdays":"*"
        }
    ]},
    {
    "name": "Porche",
    "type": "SWITCH",
    "topic": "cmnd/porche/POWER",
    "scheduled_activities" : [  
        {
        "time":"17:45",
        "hours": "2",
        "minutes":"30",
        "weekdays":"*"
    }]
    },
    {
    "name": "Balcon",
    "type": "SWITCH",
    "topic": "cmnd/balcon/POWER",
    "scheduled_activities" : [
        {
            "time":"17:45",
            "hours": "2",
            "minutes":"30",
            "weekdays":"*"
        }
    ]
    }
]

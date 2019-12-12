const WebSocket = require('ws')
const wss = new WebSocket.Server({ port: 8080 })

var messages = require('./ClientMessagingProtocol_pb');

const testCases = {
  STOPLIBRARY: 'StopLibraryRemotely',
  GEOINCYCLES: 'GeoLocationsInCycles',
  GEOCONTINUOUSLY: 'GeoLocationsContinuously',
  UNKNOWN: 'Unknown'
}

var connectedClients = 0
var receivedMessages = 0
var successTestCase = true;
var lastMessagesNumber = 0;

wss.on('connection', ws => {
  connectedClients += 1;

  ws.on('message', message => {
    receivedMessages += 1;
    console.log('Received message from client.'); //=> ${message}`)
    detectTestCaseAndStart(message.toString());
  })
  ws.send('Hello! Your Test Websocket is ready and connected.')
})

function detectTestCaseAndStart(commandString) {
  var testCase = testCases.UNKNOWN;

  if (commandString.includes("TESTCASE-") == false) {
    return;
  }

  if (commandString.includes("StopLibraryRemotely")) {
    testCase = testCases.STOPLIBRARY;
  } else if (commandString.includes("GeoLocationsInCycles")) {
    testCase = testCases.GEOINCYCLES;
  } else if (commandString.includes("GeoLocationsContinuously")) {
    testCase = testCases.GEOCONTINUOUSLY;
  } 
  
  console.log("\n@@@ Test case detected: ", testCase);
  startTest(testCase);
}

function startTest(testCase) {
  var serrverSettings = getServerSettingsForTestCase(testCase);
  console.log("Server Settings ready for sending to the", connectedClients, "clients:\n", serrverSettings.toObject(), "\n");

  wss.clients.forEach(function each(client) {
    client.send(serrverSettings.serializeBinary());
  })

  if (testCase == testCases.GEOINCYCLES) {
    updateLastMessagesNumber();
    checkMessagesNumber(5000, true);
    checkMessagesNumber(10000, false);
    checkMessagesNumber(39000, true);

    checkSuccessTestCase(40000)
  } else if (testCase == testCases.GEOCONTINUOUSLY) {
    updateLastMessagesNumber();

    checkMessagesNumber(5000, true);
    checkMessagesNumber(15000, true);
    checkMessagesNumber(29000, true);

    checkSuccessTestCase(30000)
  } else if (testCase == testCases.STOPLIBRARY) {
    updateLastMessagesNumber();

    checkMessagesNumber(5000, false);
    checkMessagesNumber(10000, false);
    checkMessagesNumber(19000, false);

    checkSuccessTestCase(20000)
  }
}

let getServerSettingsForTestCase = function(testCase) {
  var serverMessage =  new messages.ServerMessage();

  var globalSettings =  new messages.GlobalSettings();
  var iosSettings =  new messages.IosSettings();

  var geoSettings =  new messages.IosGeoSettings();
  var foregroundGeoSettings = new messages.IosStandardGeoSettings();
  var backgroundGeoSettings = new messages.IosStandardGeoSettings();

  var beaconSettings =  new messages.IosBeaconSettings();   
  var beaconMonitoringSettings = new messages.BeaconMonitoring();
  var foregrounfBeaconRanging = new messages.BeaconRanging();
  var backgrounfBeaconRanging = new messages.BeaconRanging();

  switch (testCase) {
    case testCases.STOPLIBRARY: 
      beaconSettings.setMonitoring(beaconMonitoringSettings)
      beaconSettings.setForegroundranging(foregrounfBeaconRanging);
      beaconSettings.setBackgroundranging(backgrounfBeaconRanging);
  
      iosSettings.setBeaconsettings(beaconSettings);
  
      serverMessage.setGlobalsettings(globalSettings);
      serverMessage.setIossettings(iosSettings);
      return serverMessage;
    case testCases.GEOINCYCLES:
        globalSettings.setRadiosilence(0);
  
        foregroundGeoSettings.setMaxruntime(5000)
        foregroundGeoSettings.setMinofftime(5000)
        foregroundGeoSettings.setDesiredaccuracy(-1);
        foregroundGeoSettings.setDistancefilter(-1);
        foregroundGeoSettings.setPausesupdates(false);

        geoSettings.setForegroundgeo(foregroundGeoSettings)
        geoSettings.setBackgroundgeo(backgroundGeoSettings)
        geoSettings.setSignificantupates(true);

        beaconSettings.setMonitoring(beaconMonitoringSettings)
        beaconSettings.setForegroundranging(foregrounfBeaconRanging);
        beaconSettings.setBackgroundranging(backgrounfBeaconRanging);
    
        iosSettings.setGeosettings(geoSettings);
        iosSettings.setBeaconsettings(beaconSettings);
    
        serverMessage.setGlobalsettings(globalSettings);
        serverMessage.setIossettings(iosSettings);
        return serverMessage;
    case testCases.GEOCONTINUOUSLY:
        globalSettings.setRadiosilence(0);
  
        foregroundGeoSettings.setDesiredaccuracy(-1);
        foregroundGeoSettings.setDistancefilter(-1);
        foregroundGeoSettings.setPausesupdates(false);

        geoSettings.setForegroundgeo(foregroundGeoSettings)
        geoSettings.setBackgroundgeo(backgroundGeoSettings)
        geoSettings.setSignificantupates(true);

        beaconSettings.setMonitoring(beaconMonitoringSettings)
        beaconSettings.setForegroundranging(foregrounfBeaconRanging);
        beaconSettings.setBackgroundranging(backgrounfBeaconRanging);
    
        iosSettings.setGeosettings(geoSettings);
        iosSettings.setBeaconsettings(beaconSettings);
    
        serverMessage.setGlobalsettings(globalSettings);
        serverMessage.setIossettings(iosSettings);
        return serverMessage;
    case testCases.UNKNOWN:
        return serverMessage;
  }
}

function checkMessagesNumber(seconds, greater) {
  setTimeout(function() { 
    console.log("There are", receivedMessages, " received messages after", seconds / 1000, "seconds\n"); 
    if ((greater && receivedMessages <= lastMessagesNumber) || (greater == false && receivedMessages > lastMessagesNumber)) {
       console.log("Greater: ", greater, "initital: ", lastMessagesNumber, "current", receivedMessages);
       successTestCase = false
    }
    lastMessagesNumber = receivedMessages;
  }, seconds);
}

function checkSuccessTestCase(seconds) {
  setTimeout(function() { 
    if (successTestCase) {
      console.log("\n@@@ Test result: success\n");
    } else {
      console.log("\n@@@ Test result: failure\n");
    }
  }, seconds);
}

// Time estimated until new settings arrive and are configured on the simulator
function updateLastMessagesNumber() {
  setTimeout(function() { 
    lastMessagesNumber = receivedMessages;
  }, 1000);
}


// Add tests for geofence update, geofence event, significant updates, desired accuracy and distance (the flow/ debit of messages comming in)


// Coordinates for Freeway Ride, Standford, CA, US (next to Cupertino)
// 37.403509, -122.186210
// The ra

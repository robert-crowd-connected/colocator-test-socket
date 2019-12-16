const WebSocket = require('ws')
const wss = new WebSocket.Server({ port: 8080 })

var messages = require('./MessagingProtocol_pb');

const testCases = {
  STOPLIBRARY: 'StopLibraryRemotely',
  GEOINCYCLES: 'GeoLocationsInCycles',
  GEOCONTINUOUSLY: 'GeoLocationsContinuously',
  ACCURACYANDDISTANCE: 'GeoAccuracyAndDistance',
  SIGNIFICANTUPDATES: 'GeoSignificantUpdates',
  GEOFENCEEVENT: 'GeofenceEvent',
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
    const clientMessage =  messages.ClientMessage.deserializeBinary(message);
    // detectClientMessageType(clientMessage);
    
    detectTestCaseAndStart(message.toString());
  })
  ws.send('Hello! Your Test Websocket is ready and connected.')
})

function detectClientMessageType(clientMessage) {
  console.log('Received message from client.');

  if (clientMessage.getLocationmessageList().length != 0) {
    console.log("Location Message")
  }

  if (clientMessage.getBluetoothmessageList().length != 0) {
    console.log("Bluetooth Message")
  }
  
  if (clientMessage.getIbeaconmessageList().length != 0) {
    console.log("iBeacon Message")
  }
  
  if (clientMessage.getAliasList().length != 0) {
    console.log("Alias Message")
  }
  
  if (clientMessage.getStepList().length != 0) {
    console.log("Steps Message")
  }
  
  if (clientMessage.getCirculargeofenceeventsList().length != 0) {
    console.log("Geofence Event Message")
  }
  
  if (clientMessage.getLocationrequest() !== undefined) {
    console.log("Location Request Message")
  }
  
  if (clientMessage.getIoscapability() !== undefined) {
    console.log("iOS Capability Message")
  }
}

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
  } else if (commandString.includes("GeoAccuracyAndDistance")) {
    testCase = testCases.ACCURACYANDDISTANCE;
  } else if (commandString.includes("GeoSignificantUpdates")) {
    testCase = testCases.SIGNIFICANTUPDATES;
  } else if (commandString.includes("GeofenceEvent")) {
    testCase = testCases.GEOFENCEEVENT;
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

  startTrackingTestProgress(testCase)
}

function startTrackingTestProgress(testCase) {
  if (testCase == testCases.GEOINCYCLES) {
    updateLastMessagesNumber();
    successTestCase = true;

    checkMessagesNumber(5000, true);
    checkMessagesNumber(10000, false);
    checkMessagesNumber(39000, true);

    checkSuccessTestCase(40000)
  } else if (testCase == testCases.GEOCONTINUOUSLY) {
    updateLastMessagesNumber();
    successTestCase = true;

    checkMessagesNumber(5000, true);
    checkMessagesNumber(15000, true);
    checkMessagesNumber(29000, true);

    checkSuccessTestCase(30000)
  } else if (testCase == testCases.STOPLIBRARY) {
    updateLastMessagesNumber();
    successTestCase = true;

    checkMessagesNumber(5000, false);
    checkMessagesNumber(10000, false);
    checkMessagesNumber(19000, false);

    checkSuccessTestCase(20000)
  } else if (testCase == testCases.ACCURACYANDDISTANCE) {
    updateLastMessagesNumber();
    successTestCase = true;

    checkMessagesFlowAfterSeconds(20000);
    checkSuccessTestCase(21000);
  } else if (testCase == testCases.SIGNIFICANTUPDATES) {
    updateLastMessagesNumber();
    successTestCase = true;

    checkMessagesNumber(31000, true);
    checkSuccessTestCase(32000);
  } else if (testCase == testCases.GEOFENCEEVENT) {
    updateLastMessagesNumber();
    successTestCase = true;

    // send geofence with cupertino coordinates and big radius
    // start test when app has just started
    // you shouldn't track location (probably)
    // check if you get a message when the app exit the geofence
    // is possible that first event not to be reported
    
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
    case testCases.ACCURACYANDDISTANCE:
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
    case testCases.SIGNIFICANTUPDATES:
        globalSettings.setRadiosilence(0);
  
        foregroundGeoSettings.setDistancefilter(10000);

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
    case testCases.GEOFENCEEVENT:
        globalSettings.setRadiosilence(0);

        foregroundGeoSettings.setDesiredaccuracy(100);
        foregroundGeoSettings.setDistancefilter(100000);
        foregroundGeoSettings.setPausesupdates(false);

        geoSettings.setForegroundgeo(foregroundGeoSettings)
        geoSettings.setBackgroundgeo(backgroundGeoSettings)
        geoSettings.setSignificantupates(false);

        beaconSettings.setMonitoring(beaconMonitoringSettings)
        beaconSettings.setForegroundranging(foregrounfBeaconRanging);
        beaconSettings.setBackgroundranging(backgrounfBeaconRanging);

// Coordinates for Freeway Ride, Standford, CA, US (next to Cupertino)
// 37.403509, -122.186210

        var circularGeofence= new messages.IosCircularGeoFence();
        circularGeofence.setLatitude(37.403509);
        circularGeofence.setLongitude(-122.186210);
        circularGeofence.setRadius(20000);

        var geofencesArray = [circularGeofence];

        geoSettings.setIoscirculargeofencesList(geofencesArray);
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

function checkMessagesFlowAfterSeconds(seconds) {
  // average debit is 1 update/sec having the simultaor on Freeway Drive and settings -1, -1
  let messagesPerSec = 1;
  let debit = messagesPerSec * seconds / 1000;
  let errorMargin = debit * 0.9;
  setTimeout(function() { 
    if (receivedMessages - lastMessagesNumber < debit - errorMargin) {
       console.log("The expected number of messages in ", seconds/1000, " is minimum", debit - errorMargin , " and the number of messages received is", receivedMessages - lastMessagesNumber);
       successTestCase = false
    }
    lastMessagesNumber = receivedMessages;
  }, seconds);
}

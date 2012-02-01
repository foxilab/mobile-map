// Google OAuth 2.0 stuff
var google_client_id = '693645881354.apps.googleusercontent.com';
var google_client_secret = 'UZgTsVNjRMxZyiKSWSr_SOwc';
var google_api_key = 'AIzaSyClELEF3P8NDUeGkiZg0qSD1I_mIejPDI0';
var google_access_token = '';
var google_refresh_token = '1/gSrdSV4gIR-_yzrKSBydRLo6k47CHymfLA3CycMRAOQ';

// Fusion Table IDs
var TableId = new function () {
	this.statusref = function () { return '1IhAYlY58q5VxSSzGQdd7PyGpKSf0fhjm7nSetWQ' };
	this.locations  = function() { return '1G4GCjQ21U-feTOoGcfWV9ITk4khKZECbVCVWS2E'; };
}

function refreshAccessToken() {
	var url = 'https://accounts.google.com/o/oauth2/token';
	var data = $.post(url, {
			client_id:			google_client_id,
			client_secret:		google_client_secret,
			refresh_token:		google_refresh_token,
			grant_type:			'refresh_token'
		},
		function (data) {
			google_access_token = data.access_token;
		}
	);
}

function googleSQL() {
	arguments[0].url = 'https://www.google.com/fusiontables/api/query';
	arguments[0].error = function(data) {
		console.log('an error occurred');
		console.log(data);
//		refreshAccessToken();
		// TODO: we may want to make sure infinite recursion is not possible
		//return googleSQL(arguments);
	}
	return $.ajax.apply(null, arguments);
}

// If you want to prevent dragging, uncomment this section
/*
 function preventBehavior(e) 
 { 
 e.preventDefault(); 
 };
 document.addEventListener("touchmove", preventBehavior, false);
 */

/* If you are supporting your own protocol, the var invokeString will contain any arguments to the app launch.
 see http://iphonedevelopertips.com/cocoa/launching-your-own-application-via-a-custom-url-scheme.html
 for more details -jm */
/*
 function handleOpenURL(url)
 {
 // TODO: do something with the url passed in.
 }
 */

/*
 * OpenLayers.Map
 */
var map;

var navSymbolizer = new OpenLayers.Symbolizer.Point({
	pointRadius : 10,
	externalGraphic : "css/images/15x15_Blue_Arrow.png",
	fillOpacity: 1,
	rotation: 0
});

var navStyle = new OpenLayers.StyleMap({
	"default" : new OpenLayers.Style(null, {
		rules : [ new OpenLayers.Rule({
					symbolizer : navSymbolizer
				})]
	})
});

var navigationLayer = new OpenLayers.Layer.Vector("Navigation Layer",
{
  styleMap: navStyle
});


var WGS84 = new OpenLayers.Projection("EPSG:4326");
var WGS84_google_mercator = new OpenLayers.Projection("EPSG:900913");
var maxResolution = 15543.0339;
var maxExtent = new OpenLayers.Bounds(-20037508, -20037508, 20037508, 20037508);
var restrictedExtent = maxExtent.clone();

var touchNavOptions = {
dragPanOptions: {
interval: 0, //non-zero kills performance on some mobile phones
enableKinetic: true
}
};


var rotatingTouchNav = new OpenLayers.Control.TouchNavigation(touchNavOptions);

var options = {
div: "map",
projection: WGS84,
	numZoomLevels : 20,
maxResolution: maxResolution,
maxExtent: maxExtent,
restrictedExtent: restrictedExtent,
controls: [
		   rotatingTouchNav
		   ]
};

/*var gimmyHeading = 315;
OpenLayers.Control.Click = OpenLayers.Class(OpenLayers.Control, {                
	defaultHandlerOptions: {
		'single': true,
		'double': false,
		'pixelTolerance': 0,
		'stopSingle': false,
		'stopDouble': false
	},
					
	initialize: function(options) {
		this.handlerOptions = OpenLayers.Util.extend(
		 {}, this.defaultHandlerOptions
		);
		OpenLayers.Control.prototype.initialize.apply(
		  this, arguments
		); 
		this.handler = new OpenLayers.Handler.Click(
			this, {
				'click': this.trigger
			}, this.handlerOptions
		);
	}, 
											
	trigger: function(e) {
		//navSymbolizer.rotation += 10;
		//navigationLayer.redraw();
									
		//Rotate map
											var heading = gimmyHeading;
											var mapRotation = 360 - heading;
											var diff = (-1 * mapRotation) - map.events.rotationAngle;
											if(diff > -180)
											$("#map").animate({rotate: mapRotation + 'deg'}, 1000);
											else
											$("#map").animate({rotate: (-1 * heading) + 'deg'}, 1000);
											
											map.events.rotationAngle = -1 * mapRotation;
											gimmyHeading = 90;
	}
										
});*/


//  NativeControl Variables
var nativeControls;
var tempLon;
var tempLat;

// Phone Variables
var isAppPaused = false;
var isInternetConnection = false;
var isDataToPush = false;
var itemsToPush = 0;
var isLandscape = false;

function onBodyLoad()
{
	document.addEventListener("deviceready", onDeviceReady, false);
}

var geolocationSuccess = function(position){
	var lon = position.coords.longitude;
	var lat = position.coords.latitude;
    
    //Quick and Dirty to get lat/lon to center the map
    tempLat = lat;
    tempLon = lon;
	
	var currentPoint = new OpenLayers.Geometry.Point(lon, lat).transform(WGS84, WGS84_google_mercator);
	var currentPosition = new OpenLayers.Feature.Vector(currentPoint);
	
	navigationLayer.removeAllFeatures();
	navigationLayer.addFeatures([currentPosition]);
	
	map.setCenter(new OpenLayers.LonLat(position.coords.longitude, position.coords.latitude)
				  .transform(WGS84, WGS84_google_mercator), 17);
    
    //iPhone Quirks
    //  position.timestamp returns seconds instead of milliseconds.
}

var geolocationError = function(error){
	//error handling
}

var compassSuccess = function(heading){
	//Rotate arrow
	/*navSymbolizer.rotation = heading.magneticHeading;
	navigationLayer.redraw();*/
	
	//Rotate map
	var heading = heading.magneticHeading;
	var mapRotation = 360 - heading;
	var diff = (-1 * mapRotation) - map.events.rotationAngle;
	if(diff > -180)
		$("#map").animate({rotate: mapRotation + 'deg'}, 1000);
	else
		$("#map").animate({rotate: (-1 * heading) + 'deg'}, 1000);
	
	map.events.rotationAngle = -1 * mapRotation;
}

var compassError = function(error){
	//error handling
	if(error.code == CompassError.COMPASS_INTERNAL_ERR)
        navigator.notification.alert("compass internal error", function(){}, 'Error', 'Okay');
	else if(error.code == CompassError.COMPASS_NOT_SUPPORTED)
        navigator.notification.alert("compass not supported", function(){}, 'Error', 'Okay');
	
}

/* When this function is called, PhoneGap has been initialized and is ready to roll */
/* If you are supporting your own protocol, the var invokeString will contain any arguments to the app launch.
 see http://iphonedevelopertips.com/cocoa/launching-your-own-application-via-a-custom-url-scheme.html
 for more details -jm */

function googleLogin() {
	$.ajax({
		url: 'https://www.google.com/accounts/ClientLogin',
		data:	{
			accountType:	'HOSTED_OR_GOOGLE',
			Email:			'research.lmn@gmail.com',
			Passwd:			'lmnisgr8',
			service:			'fusiontables',
			source:			google_client_id
		},
		success:	function(data) {
			google_access_token = data.slice(data.indexOf('Auth=') + 5);
		},
		error: function(data) {
			console.log("Couldn't log in");
		}
	});

	googleSQL({
		data:	{
			token:	google_access_token,
			sql:		'SELECT * FROM ' + TableId.locations()
		},
		success:	function(data, status, xhr) {
			console.log('success');
			console.log(data);
		}
	});
}

function onDeviceReady()
{
	googleLogin();

	//Now that the device is ready, lets set up our event listeners.
	document.addEventListener("pause"            , onAppPause         , false);
	document.addEventListener("resume"           , onAppResume        , false);
	document.addEventListener("online"           , onAppOnline        , false);
	document.addEventListener("offline"          , onAppOffline       , false);
	document.addEventListener("batterycritical"  , onBatteryCritical  , false);
	document.addEventListener("batterylow"       , onBatteryLow       , false);
	document.addEventListener("batterystatus"    , onBatteryStatus    , false);
	window.addEventListener("orientationchange", onOrientationChange,  true);

	//Set up NativeControls
	nativeControls = window.plugins.nativeControls;
		setupTabBar();
		setupNavBar();

	//ChildBrowser code to open Google.com
/*	var cb = ChildBrowser.install();
	if (cb != null) {
		var setting =
		{
			'clientId':	"693645881354.apps.googleusercontent.com",
			'scope':		"https://www.googleapis.com/auth/fusiontables"
		};

		var endUserAuthorizationEndpoint = 'https://accounts.google.com/o/oauth2/auth';

		var authUrl = endUserAuthorizationEndpoint +
		"?response_type=code" +
		"&client_id=" + setting.clientId +
		"&scope=" + setting.scope +
		"&redirect_uri=http://localhost";

		window.plugins.childBrowser.showWebPage(encodeURI(authUrl));
	}
*/
	// The Local Database (global for a reason)
	try {
		if (!window.openDatabase) {
			// Do we need to support this?
			navigator.notification.alert('Local databases not supported');
		}
		else {
			// Open or create a 3MB database and store in global variable
			sqlDb = window.openDatabase('mobdisapp', '0.1', 'MobDisAppDB', 3145728);
			createStatusRefTable(sqlDb);
			createQueueTable(sqlDb);
		}
	}
	catch (e) {
		// Do we need to handle this?
		navigator.notification.alert('Error opening database: ' + e);
	}

	// do your thing!
	var docHeight = $(window).height();
	var headerHeight = $("#header").height();
	var footerHeight = $("#footer").height();
	var mapHeight = docHeight - headerHeight - footerHeight - 50;
	
	var mapContainer = $("#mapContainer");
	mapContainer.height(mapHeight +"px");
	var mapDiv = $("#map");
	mapHeight = mapHeight*1.7;
	mapDiv.height(mapHeight+"px");
	mapDiv.width(mapHeight+"px");

	var mapLeftPosition = -1 * (mapDiv.width()-mapContainer.width()) / 2;
	var mapTopPosition = -1 * (mapDiv.height()-mapContainer.height()) / 2;
	mapDiv.css('top', mapTopPosition);
	mapDiv.css('left', mapLeftPosition);
	
	map = new OpenLayers.Map(options);
	map.events.mapSideLength = mapHeight;
	
	var mapLayerOSM = new OpenLayers.Layer.OSM();
	map.addLayers([mapLayerOSM, navigationLayer]);
	
	navigator.geolocation.watchPosition(geolocationSuccess, geolocationError, 
	{
		enableHighAccuracy: true,
		maximumAge: 3000
	});
	
	var compassOptions = {
		frequency: 3000
	};
	
	//navigator.compass.watchHeading(compassSuccess, compassError, compassOptions);
	OpenLayers.Control.Click = OpenLayers.Class(OpenLayers.Control, 
	{
		defaultHandlerOptions : 
		{
			'single' : true, 'double' : false, 'pixelTolerance' : 0, 'stopSingle' : false, 'stopDouble' : false 
		},
		initialize : function (options) 
		{
			this.handlerOptions = OpenLayers.Util.extend( {}, this.defaultHandlerOptions );
			OpenLayers.Control.prototype.initialize.apply( this, arguments );
			this.handler = new OpenLayers.Handler.Click( this, {
				'click' : this.trigger 
			},
			this.handlerOptions );
		},
		trigger : function (e) 
		{
			var lonlat = map.getLonLatFromViewPortPx(e.xy);
			navigator.camera.getPicture(function (imageURI) 
			{
				insertToLocationQueueTable(sqlDb, lonlat.lon, lonlat.lat, null, imageURI, null);
				// TODO: This sometimes flashes the map
				$.mobile.changePage('#queue-dialog', 'pop');
                                        
                //We just added an item to the queue, meaning we have new data to push.
                //#TODO: Make it track items not pushed, not just items added
                                        //QUick and dirty ATM
                isDataToPush = true;
                itemsToPush += 1;
                updateTabItemBadge('Queue', itemsToPush);
                updateAppBadge(itemsToPush);
			},
			function () { },
			{
				quality : 100,
				destinationType : Camera.DestinationType.FILE_URI,
				// DEBUG: This should be CAMERA to force a new pic
				sourceType : Camera.PictureSourceType.SAVEDPHOTOALBUM,
				allowEdit : false
			});
		}
	});

	var zoomPanel = new OpenLayers.Control.ZoomPanel({div: document.getElementById("zoomPanel")});
	map.addControl(zoomPanel);
	var zoomRight = .05 * mapHeight;
	$("#zoomPanel").css("right", "5%");
	$("#zoomPanel").css("bottom", zoomRight + "px");

	var click = new OpenLayers.Control.Click();
	map.addControl(click);
	click.activate();

	$('#queue-dialog').on('pageshow', function() {
		// TODO: more efficient to keep a 'dirty' flag telling us when we need to clear/update
		// rather than doing it every time.
		clearQueueDialog();
		forAllLocations(sqlDb, addToQueueDialog);
	});
}

function clearQueueDialog() {
	$('#queue-dialog li').not('#queue-list-item-archetype').remove();
}

function addToQueueDialog(locRow) {
	var $clone = $('#queue-list-item-archetype').clone();	
	$clone.removeAttr('id');
	$clone.find('img').attr('src', locRow.photo);

	if (locRow.status >= 1) {
		$clone.find('h3').text(StatusRef.fromId(locRow.status).toString());
	}

	$clone.attr('rowid', locRow.id);
	$('#queue-dialog ul').append($clone);
	$clone.show();
}

function hideQueueItemDelete(e) {
	$('#queue-item-delete').hide();
}

function showQueueItemDelete(e) {
	var $del = $('#queue-item-delete');
	$del.attr('rowid', $(this).attr('rowid'));
	$del.show();
	$del.position({
		my:	'right center',
		at:	'right center',
		of:	$(this),
		offet:'0, 0'
	});
}

$(document).ready(function() {
	$(document).click(function() {
		$('#queue-item-delete').hide();
	});

	var $queue_item;

	// TODO: Why do some of these only work with live() and not on() ?
	$('.queue-list-item').live('click', function(e) {
		$queue_item = $(this);
	});

	$('.queue-list-item').live('swipeleft', showQueueItemDelete)
	$('.queue-list-item').live('swiperight', hideQueueItemDelete);
	$('.queue-list-item').live('blur', hideQueueItemDelete);

	$('#queue-item-delete').live('click', function(e) {
		var id = $(this).attr('rowid');
		deleteLocation(sqlDb, id);
		$(this).hide();
		$('.queue-list-item').filter('[rowid="' + id + '"]').remove();
	});

	$('.status-list-item').on('click', function(e) {
                            
		// See the text for the currently selected queue list item
		var $h3 = $queue_item.find('h3');
		$h3.text($(this).text());
		
		// Store back to local DB
		var id = $queue_item.attr('rowid');
		updateLocationStatus(sqlDb, id, $(this).attr('status-ref'));
	});

	$('.status-submit-button').on('click', function(e) {
		var valid = 0;
		var items = new Array();
		$('.queue-list-item').filter(':visible').each(function() {
			if ($(this).find('h3').text() !== 'Select a Status') {
				++valid;
				items.push($(this));
			}
		});

		if (valid === 0) {
			navigator.notification.alert('You must set the status for at least one location');
			e.preventDefault();
			e.stopPropagation();
		}
		else {
			var rowids = new Array();
			items.forEach(function(elem) {
				rowids.push($(elem).attr('rowid'));
			});

			// Submit them to the server - if successful remove from local database
			submitToServer(rowids);
			itemsToPush = 0;
         updateTabItemBadge('Queue',0);
         updateAppBadge(0);
		}		
	});
});

function submitToServer(rowids) {
	forLocationQueueRows(sqlDb, rowids, function(rows) {
		var sql = '';
		for (var i = 0; i < rows.length; ++i) {
			var row = rows.item(i);
			sql += 'INSERT INTO ' + TableId.locations() + ' (Location, Name, Status, Date, PhotoURL) VALUES (';
			sql += squote('<Point><coordinates>' + row.location + '</coordinates></Point>') + ',';
			sql += squote(row.name) + ',';
			sql += squote('placeholder') + ','; // TODO: upload the photo and store the URL
			sql += squote(row.date) + ',';
			sql += row.status + ');';
		}
		
		console.log(encodeURI('https://www.google.com/fusiontables/api/query?sql=' + sql + '&jsonCallback=?'));
		var jsonp = $.post(encodeURI('https://www.google.com/fusiontables/api/query?sql=' + sql + '&jsonCallback=?'), function(data) {
			console.log('data: ' + data);
			
			// Since we were successful, remove from local DB
			
		}, 'jsonp');
	});
}

/*
        ==============================================
                  NativeControls Functions
        ==============================================
 
    This array contains all the information about the buttons that we are going to have in the tab bar. It contains the name of the tab, the image used for the tab and what function to call when that tab is selected. 
 */
var tabBarItems = { tabs: [
      {'name': 'Map'  , 'image': '/www/TabImages/Map.png'  , 'onSelect': onClick_MapTab},
      {'name': 'Queue', 'image': '/www/TabImages/Queue.png', 'onSelect': onClick_QueueTab},
      {'name': 'User' , 'image': '/www/TabImages/User.png' , 'onSelect': onClick_UserTab},
      {'name': 'Debug', 'image': '/www/TabImages/Debug.png', 'onSelect': onClick_DebugTab},
      {'name': 'More' , 'image': 'tabButton:More'     , 'onSelect': onClick_MoreTab}]};

/*
    This function loops though the array and sets up the buttons for us. Then we add them to the tab bar and show the bar.
 */
function setupTabBar() {
    nativeControls.createTabBar();
        var _length = tabBarItems.tabs.length;
        for (var i = 0; i < _length; i++) {
            setUpButton(tabBarItems.tabs[i]);
        }
    nativeControls.showTabBarItems('Map', 'Queue', 'User', 'More', 'Debug');
    nativeControls.selectTabBarItem('Map');
    showTabBar();
}

/*
    Called by setupTabBar, this function creates the TabBarItems with the given params from our array.
 */
function setUpButton(_tabItem)
{
    var options = new Object();
        options.onSelect = _tabItem.onSelect;
    nativeControls.createTabBarItem(_tabItem.name, _tabItem.name, _tabItem.image, options);
}

/*
    This function creates the Nav bar, sets up the buttons and their callbacks and then displays the nav bar.
 */
function setupNavBar() {
    nativeControls.createNavBar();
    nativeControls.setupLeftNavButton('Left','', 'onClick_LeftNavBarButton');
    nativeControls.setupRightNavButton('Settings','', 'onClick_RightNavBarButton');
    nativeControls.setNavBarTitle('Disaster Response');
    nativeControls.setNavBarLogo('');
    hideLeftNavButton();
    showNavBar();
}

function updateTabItemBadge(_tabName, _amount) {
    if(_amount >= 1)
    {
        console.log('TabBar: Badge with the value '+_amount+' added to '+_tabName+'.');
        var object = new Object();
            object.badge = _amount.toString();
        nativeControls.updateTabBarItem(_tabName, object);
    }
    else
        hideTabItemBadge(_tabName);
}

function hideTabItemBadge(_tabName) {
    console.log('TabBar: Badge removed from '+_tabName+'.');
    nativeControls.updateTabBarItem(_tabName, null);
}

function updateAppBadge(_amount) {
    if(_amount >= 1)
    {
        console.log('App: Badge added with the value '+_amount+'.');
        window.plugins.badge.set(_amount);
    }
    else
        hideAppBadge();
}

function hideAppBadge() {
    console.log('App: Badge removed from App.');
    window.plugins.badge.clear();
}

function showTabBar() {
    var options = new Object();
    options.position = 'bottom';
    nativeControls.showTabBar(options);
    console.log('TabBar: shown');
}

function hideTabBar() {
    nativeControls.hideTabBar();
    console.log('TabBar: hidden');
}

function showNavBar() {
    nativeControls.showNavBar();
}

function hideNavBar() {
    nativeControls.hideNavBar();
}

function showLeftNavButton() {
    nativeControls.showLeftNavButton();
}

function hideLeftNavButton() {
    nativeControls.hideLeftNavButton();
}

function showRightNavButton() {
    nativeControls.showRightNavButton();
}

function hideRightNavButton() {
    nativeControls.hideRightNavButton();
}

/*
        ==============================================
            NativeControls Nav onClick Functions
        ==============================================
 */

function onClick_LeftNavBarButton() {
    console.log('onClick: LeftNavBarButton');
    navigator.notification.alert('Left NavBar button was selected.', function(){}, 'Debug', 'Okay');
}

function onClick_RightNavBarButton() {
    console.log('onClick: RightNavBarButton');
    navigator.notification.alert('Right NavBar button was selected.', function(){}, 'Debug', 'Okay');
}

/*
        ==============================================
             NativeControls Tab onClick Functions
        ==============================================
 */
function onClick_MapTab() {
    console.log('onClick: MapTab');
    map.setCenter(new OpenLayers.LonLat(tempLon, tempLat)
				  .transform(WGS84, WGS84_google_mercator), 17);
}

function onClick_QueueTab() {
    console.log('onClick: QueueTab');
    navigator.notification.alert('Queue tab clicked.', function(){}, 'Debug', 'Okay');
}

function onClick_UserTab() {
    console.log('onClick: UserTab');
    navigator.notification.alert('User tab clicked.', function(){}, 'Debug', 'Okay');
}

function onClick_MoreTab() {
    console.log('onClick: MoreTab');
    navigator.notification.alert('More tab clicked.', function(){}, 'Debug', 'Okay');
}

//Temporary option to allow us to open a different tab and access debug information
// like Device, iOS version, current location, etc.
function onClick_DebugTab() {
    console.log('onClick: DebugTab');
    window.open ('Debug.html','_self',false);
}

/*
        ==============================================
                  Event Listener Callbacks
        ==============================================

    When the application is put into the background via the home button, phone call, app switch, etc. it is paused. Any Objective-C code or PhoneGap code (like alert()) will not run. This callback will allow us to pause anything we need to to avoid time based errors.
 
 */
function onAppPause() {
    console.log('Listener: App has been paused.');
    isAppPaused = true;
    //Because native code won't run while an app is paused, all code below this line
    // will not run until the app is reopened again.
}

/*
    When the user resumes the app from the background this callback is called, allowing us to resume anything that we stopped.
 */
function onAppResume() {
    console.log('Listener: App has been resumed.');
    isAppPaused = false;

    //Check to see if we have an internet connection
    if(isInternetConnection)
    {
        //We do, now check to see if we have pushed our data already or not.
        // no need to push data thats already there...
        if(isDataToPush)
        {
            //#TODO: Upload the local queue to the Google Fusion Table.
            console.log('Debug: #TODO: Wrote to fusion table in onAppResume().');
            
            //Mark that we pushed the data.
            isDataToPush = false;
        }
    }
}

/*
    Whenever the device connects to the internet this function will be called. This allows us to know when to update our fusion tables online as well as when to start updating the map again.
    #QUIRK: Durring the inital startup of the app, this will take at least a second to fire.
 */
function onAppOnline() {

   console.log('Listener: App has internet connection.');
	isInternetConnection = true;
    
   //Because native code won't run while an app is paused, this will not get called unless
   // the app is running. Time to push data to the server.
    
   //Check to see if we have pushed our data already or not.
   if(isDataToPush)
   {
		//#TODO: Upload the local queue to the Google Fusion Table.
      console.log('Debug: #TODO: Wrote to fusion table in onAppOnline().');
        
      //Mark that we pushed the data.
		isDataToPush = false;
   }
}

/*
    This function is called whenever the device loses internet connection (be it WiFi or 3G or EDGE). With this we can keep the current map tiles cached to avoid losing them.
    #QUIRK: Durring the inital startup of the app, this will take at least a second to fire.
 */
function onAppOffline() {
    console.log('Listener: App has lost internet connection.');
    isInternetConnection = false;
}

/*
    Called when the orientation of the iDevice is changed.
    #QUIRK: Triggered twice on 1 rotation.
 */
var orDirtyToggle = false;
function onOrientationChange(_error)
{    
    //Prevent the function from running multiple times.
    orDirtyToggle = !orDirtyToggle;
    if(orDirtyToggle)
    {
        switch(window.orientation)
        {
            case -90:   //Landscape with the screen turned to the left.
                onOrientationLandscape(window.orientation);
                break;
            
            case 0:     //Default view
                onOrientationPortrait(window.orientation);
                break;
  
            case 90:    //Landscape with the screen turned to the right.
                onOrientationLandscape(window.orientation);
                break;
            
            case 180:   //Upside down.
                onOrientationPortrait(window.orientation);
                break;
            
            default: 
                navigator.notification.alert('Orientation issue.', function(){},'Error','Okay');
                break;
        }
    }
}

/*
    This function is called whenever the device is switched over to landscape mode. Here we can do things like resize our viewport.
 */
function onOrientationLandscape(_o) {
    console.log('Listener: App has changed orientation to Landscape '+_o+'.');
    isLandscape = true;
}

/*
 This function is called whenever the device is switched over to portrait mode. Here we can do things like resize our viewport.
 */
function onOrientationPortrait(_o) {
    console.log('Listener: App has changed orientation to Portrait '+_o+'.');
    isLandscape = false;
}

/*
    Called when the device hits the critical level threshold. This is device specific. (10 on iDevices)
 */
function onBatteryCritical(_info) {
    console.log('Listener: Device battery is now critical.');
    //_info.level = % of battery (0-100).
    //_info.isPlugged = true if the device is plugged in.
}

/*
    Called when the device hits the low level threshold. This is device specific. (20 on iDevices).
 */
function onBatteryLow(_info) {
    console.log('Listener: Device battery is now on low.');
    //_info.level = % of battery (0-100).
    //_info.isPlugged = true if the device is plugged in.
}

/*
    Whenever the battery changes status (either info.level changes by one, or info.isPlugged is toggled) this function is called.
    Example: If they plug in, that means they have power where they are. The building locations that are close by are now operational (if they weren't already labled as such).
 */
function onBatteryStatus(_info) {
    console.log('Listener: Device battery now at '+_info.level+'.');
    //_info.level = % of battery (0-100).
    //_info.isPlugged = true if the device is plugged in.
}

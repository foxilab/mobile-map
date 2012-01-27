function MyPlugin() { }

//Plugin Fuction Prototype
//PLUGINNAME.prototype.JAVASCRIPTFUNCTIONNAME = function(params) {
//    PhoneGap.exec(successCallback, failCallback, "SEVICENAME", "CFUNCTIONNAME", [paramsforCFunction]);
//};

MyPlugin.prototype.nativeFunction = function(types, success, fail) {
    PhoneGap.exec(success, fail, "UIDevice", "print", types);
};

//Prototype to get the iDevices unique identifier
MyPlugin.prototype.getUDID = function(successCallback, failCallback) {
    
    if (typeof successCallback != "function") {
        console.log("PGUIDevice.getUDID Error: successCallback is not a function");
        return;
    }
    
    if (typeof failCallback != "function") {
        console.log("PGUIDevice.getUDID Error: failCallback is not a function");
        return;
    }
    
    PhoneGap.exec(successCallback, failCallback, "UIDevice", "getUniqueDeviceIdentifier", []);
};

PhoneGap.addConstructor(function(){
    if(!window.plugins) { window.plugins = {}; }
    window.plugins.MyPlugin = new MyPlugin();
});
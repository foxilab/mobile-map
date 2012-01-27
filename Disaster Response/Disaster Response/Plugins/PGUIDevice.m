//
//  PGUIDevice.m
//  UDIDTest
//
//  Created by Joseph Stuhr on 1/24/12.
//  Copyright (c) 2012 __MyCompanyName__. All rights reserved.
//

#import "PGUIDevice.h"
#import "UIDevice/UIDevice+IdentifierAddition.h"
@implementation PGUIDevice

@synthesize callbackID;
@synthesize udID;
@synthesize udGID;

-(void)print:(NSMutableArray*)arguments withDict:(NSMutableDictionary*)options  
{
    
    //The first argument in the arguments parameter is the callbackID.
    //We use this to send data back to the successCallback or failureCallback
    //through PluginResult.   
    self.callbackID = [arguments pop];
    
    //Get the string that javascript sent us 
    NSString *stringObtainedFromJavascript = [[UIDevice currentDevice] uniqueDeviceIdentifier];                 
    
    //Create the Message that we wish to send to the Javascript
    NSMutableString *stringToReturn = [NSMutableString stringWithString: @"StringReceived:"];
    //Append the received string to the string we plan to send out        
    [stringToReturn appendString: stringObtainedFromJavascript];
    //Create Plugin Result
    PluginResult* pluginResult = [PluginResult resultWithStatus:PGCommandStatus_OK messageAsString:                        [stringToReturn stringByAddingPercentEscapesUsingEncoding:NSUTF8StringEncoding]];
    //Checking if the string received is HelloWorld or not
    if([[arguments objectAtIndex:0] isEqualToString:@"HelloWorld"]==YES)
    {
        //Call  the Success Javascript function
        [self writeJavascript: [pluginResult toSuccessCallbackString:self.callbackID]];
        
    }else
    {    
        //Call  the Failure Javascript function
        [self writeJavascript: [pluginResult toErrorCallbackString:self.callbackID]];
        
    }
    
}

-(void)getUniqueDeviceIdentifier:(NSMutableArray*)arguments withDict:(NSMutableDictionary*)options;
{
    //The first argument in the arguments parameter is the callbackID.
    //We use this to send data back to the successCallback or failureCallback
    //through PluginResult.   
    //self.callbackID = [arguments pop];
    
    //NSString *udid = [[UIDevice currentDevice] uniqueDeviceIdentifier];  
    
    //PluginResult* pluginResult = [PluginResult resultWithStatus:PGCommandStatus_OK messageAsString:
    //    [udid  stringByAddingPercentEscapesUsingEncoding:NSUTF8StringEncoding]];
    
    //[self writeJavascript: [pluginResult toSuccessCallbackString:self.callbackID]];
    
    
    PluginResult* result = nil;
	NSString* jsString = nil;
	NSString* callbackId = [arguments objectAtIndex:0];
    NSDictionary* dictionary = nil;
    
	if(true) {
        dictionary = [NSDictionary dictionaryWithObject:[[UIDevice currentDevice] uniqueDeviceIdentifier] forKey:@"value"];
        
		result = [PluginResult resultWithStatus: PGCommandStatus_OK messageAsDictionary: dictionary];
		jsString = [result toSuccessCallbackString:callbackId];
	}
	else {
		result = [PluginResult resultWithStatus:PGCommandStatus_ERROR messageAsInt: -1];
		jsString = [result toErrorCallbackString:callbackId];
	}
    
	[self writeJavascript:jsString];
}

@end

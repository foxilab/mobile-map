//
//  PGUIDevice.h
//  UDIDTest
//
//  Created by Joseph Stuhr on 1/24/12.
//  Copyright (c) 2012 __MyCompanyName__. All rights reserved.
//

#import <Foundation/Foundation.h>
#ifdef PHONEGAP_FRAMEWORK
    #import <PhoneGap/PGPlugin.h>
#else
    #import <PGPlugin.h>
#endif

@interface PGUIDevice : PGPlugin {
    NSString* callbackID;
    NSString* udID;         //Unique identifier for this device running this app.
    NSString* udGID;        //Unique identifier for this device running ANY app.
}

@property (nonatomic, copy) NSString* callbackID;
@property (readonly) NSString* udID;
@property (readonly) NSString* udGID;

- (void) print:(NSMutableArray*)arguments withDict:(NSMutableDictionary*)options;
- (void) getUniqueDeviceIdentifier:(NSMutableArray*)arguments withDict:(NSMutableDictionary*)options;

@end

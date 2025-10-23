/****************************************************************************
*
*     TECHNOLOGIE MANAGEMENT GRUPPE Technologie und Engineering GmbH
*
****************************************************************************/
/**
*       \file      CSample.cpp
*       \brief     USB IO-Link Master Sample Application
* 
* This file contains a very simple example how to access the IO-Link Master
* library.
* 
****************************************************************************/
#include <windows.h>    // common windows interface and structures
#include <stdio.h>      // console output functions
#include <conio.h>      // console key functions
#include "TMGIOLUSBIF20.h" // IO-Link library interface


/***************************************************************************/
/** 
*       \brief     simple main routine
*
* This simple application looks for an IO-Link Master, starts it in IO-Link 
* mode and waits for a sensor. After the sensor is connected, it will read
* one acyclic parameter (Vendor name).
* after that, it will read the process data cyclically.
* The program can be terminated with a key.
* 
****************************************************************************/
void main ( void )
{
  LONG retval;

  // step 1. Search for connected interfaces
  printf("Looking for IO-Link Master interfaces..\n");
  TDeviceIdentification Devices[5];
  LONG Number = IOL_GetUSBDevices(Devices,5);
  if (Number == 0)
  {
    printf("No master found. Terminating program..\n");
    exit(1);
  }

  // step 2. connect to the first available master
  printf("we found a master interface at Port %s, setting it to IO-Link Mode..\n",Devices[0].Name);
  LONG Handle = IOL_Create(Devices[0].Name);
  if (Handle == 0)
  {
    printf("Connecting to IO-Link Master failed. Terminating program..\n");
    exit(1);
  }

  // step 3: Set Master to IO-Link Mode
  TPortConfiguration PortConfig;
  memset(&PortConfig,0,sizeof(PortConfig));
  PortConfig.CRID = 0x11;                                 // running in IO-Link Mode
  PortConfig.TargetMode = SM_MODE_IOLINK_OPERATE;         // IO-Link Modus
  PortConfig.PortModeDetails = 0;                         // free runnning IO-Link
  PortConfig.InspectionLevel = SM_VALIDATION_MODE_NONE;   // no Validation of Device
  PortConfig.InputLength = 32;                            // max. Length of Inputs
  PortConfig.OutputLength = 32;                           // max. Length of Outputs
  retval = IOL_SetPortConfig(Handle, 0, &PortConfig);     // activate master on port 0
  if (retval != RETURN_OK)
  {
    printf("Setting portmode failed. Terminating program..\n");
  }
  else
  {
    printf("Setting Port to IO-Link mode, waiting for sensor to connect...\n");
    bool bFertig = false;
    bool bParameterRead =false;
    DWORD Status;
    DWORD Length;
    BYTE InData[32];
    while (!bFertig)
    {
      // on key pressing we exit the program
      if (_kbhit())
        bFertig = true;
      // getting sensor status
      retval = IOL_GetSensorStatus(Handle,0,&Status);
      if (retval != RETURN_OK)
      {
        printf("getting sensor state failed. Terminating program..\n");
        break;
      }
      // if sensor state is online, we will read one of the parameters
      if ((Status & MASK_SENSORSTATE) == BIT_CONNECTED)
      {
        if (bParameterRead == false)
        {
          printf("We found a new sensor. Begin to read the vendor name..\n");
          bParameterRead = true;
          TParameter Parameter;
          Parameter.Index = 16; // index of vendor name
          Parameter.SubIndex = 0;
          retval = IOL_ReadReq(Handle, 0, &Parameter);
          if (retval != RETURN_OK)
          {
            printf("getting vendor name failed. Terminating program..\n");
            break;
          }
          else
          {
            printf("DEVICE Vendor:       %s\n\r", Parameter.Result);
          }
        }
        // read process data cyclically
        IOL_ReadInputs(Handle,0,InData,&Length,&Status);
      }
      else
      {
        bParameterRead = false; // on next connecting sensor we will reread the vendor ID
      }
      // Handle Events
      if (Status & BIT_EVENTAVAILABLE)
      {
        TEvent theEvent;
        retval = IOL_ReadEvent(Handle,&theEvent,&Status);
        if (retval == RETURN_OK)
        {
          if (theEvent.LocalGenerated == 0)
          {
            /* Event from Device */
            switch (theEvent.EventCode)
            {
              case   0:// here you must fill the 
              break;
            }
          }
        }
      }
    }

  }

  
  /* Last step: destroy handle */
 memset(&PortConfig,0,sizeof(PortConfig));               // clear port configuration
 retval = IOL_SetPortConfig(Handle, 0, &PortConfig);     // activate master on port 0  IOL_Destroy(Handle);
 IOL_Destroy(Handle);

}
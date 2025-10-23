/****************************************************************************
*
*     TECHNOLOGIE MANAGEMENT GRUPPE Technologie und Engineering GmbH
*
****************************************************************************/
/**
*       \file      CDataloggingApp.cpp
*       \brief     USB IO-Link Master Sample Application for data logging
* 
* This file contains a very simple example how to access the IO-Link Master
* library.
* 
****************************************************************************/
#include <windows.h>        /* common windows interface and structures */
#include <stdio.h>          /* console output functions */
#include <conio.h>          /* console key functions */
#include "TMGIOLUSBIF20.h"  /* IO-Link library interface */


/***************************************************************************/
/**
*       \brief     Logging routine
*
* This routine tries to read out the data buffer in the USB Master. it should be
* called cyclically because otherwise the memory could overflow.
* the function will display the segment length of the entries in the logging
* buffer.
*
****************************************************************************/
static LONG ReadLoggingData(LONG Handle, BYTE Port)
{
  BYTE Buffer[10000];       /* we try to read the buffer with a 10K segmentation size */
  LONG Buffersize = 10000;
  DWORD Status = 0;
  LONG retval = IOL_ReadLoggingBuffer(Handle, &Buffersize, Buffer, &Status);
  if (retval != RETURN_OK)
  {
    printf("IOL_ReadLoggingBuffer ERROR: %i \n", retval);
    return retval;
  }
  else
  {
    LONG Pos = 0;
    printf("Logging Data:\n");
    while (Pos < Buffersize)
    {
      int inlen = Buffer[Pos + 1] - 1;
      printf("  Port=%i InLen=%i PDValid=0x%x OutLen=%i\n ", Buffer[Pos], inlen, Buffer[Pos + 2 + inlen], Buffer[Pos + 3 + inlen]);
      Pos = Pos + 4 + inlen + Buffer[Pos + 3 + inlen];
    }
  }
  return RETURN_OK;
}

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
    bool bLoggingActivated =false;
    DWORD Status;
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
        /* at the first connect we start the data logging. in this example we use the following settings:
           MemorySize = 1MB , is far too much, but to avoid data loss we choose it so big
           Mode = LOGGING_MODE_CYCLES -> cycle synchronous mode 
           SampleTime
           */
        if (bLoggingActivated == false)
        {
          printf("We found a new sensor. Begin to log the data..\n");
          DWORD sampleTime = 10;
          retval = IOL_StartDataLoggingInBuffer(Handle, 0, 1000000, LOGGING_MODE_CYCLES, &sampleTime);
          if (retval != RETURN_OK)
          {
            printf("Starting Logging failed Result=%i. Terminating program..\n",retval);
            break;
          }
          else
          {
            printf("Logging has been started...\n");
            bLoggingActivated = true;
          }
          printf("Writing Outputs once to zero because otherwise we will not get any outputs");
          BYTE outputs[32] = { 0 };

          retval = IOL_WriteOutputs(Handle, 0, outputs, 32);
          if (retval != RETURN_OK)
          {
            printf("Writing Outputs failed Result=%i. Terminating program..\n", retval);
            break;
          }
        }
        else
        {
          if (RETURN_OK != ReadLoggingData(Handle, 0))
            bFertig = true;
        }
        Sleep(1000);
      }
    }
    retval = IOL_StopDataLogging(Handle);
    printf("IOL_StopDataLogging Result=%i", retval);

  }

  
 /* Last step: deactivate Port and destroy handle */
 memset(&PortConfig,0,sizeof(PortConfig));               // clear port configuration
 retval = IOL_SetPortConfig(Handle, 0, &PortConfig);     // activate master on port 0  IOL_Destroy(Handle);
 IOL_Destroy(Handle);

}
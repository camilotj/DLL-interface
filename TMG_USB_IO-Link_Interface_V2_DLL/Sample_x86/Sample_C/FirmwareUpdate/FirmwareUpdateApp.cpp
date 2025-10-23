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
#include "TMGIOLBlob.h"         /* BLOB interface */
#include "TMGIOLFwUpdate.h"     /* firmware update routines */

/***************************************************************************/
/** 
*       \brief     status and error display
*
* This function show the status of the last update process step 
****************************************************************************/
char * FWRETVAL[]=
{
  "FWUPDATE_RET_OK",
  "FWUPDATE_RET_ERROR_BUSY",
  "FWUPDATE_ID_WRONG_VENDORID",
  "FWUPDATE_ID_WRONG_REVISION",
  "FWUPDATE_ID_WRONG_HWKEY",
  "FWUPDATE_ID_WRONG_BOOTSTATUS",
  "FWUPDATE_RET_ACTIVATION_FAILED",
  "FWUPDATE_RET_BLOB_ERROR",
};
char * FWUPDATESTATE[] =
{
  "FWUPDATE_STATE_IDLE",
  "FWUPDATE_STATE_IDENTIFICATION",
  "FWUPDATE_STATE_VERIFICATION",
  "FWUPDATE_STATE_PASSWORD",
  "FWUPDATE_STATE_SWITCHTOBOOTLOADER",
  "FWUPDATE_STATE_WAITREBOOT",
  "FWUPDATE_STATE_STARTDOWNLOAD",
  "FWUPDATE_STATE_DOWNLOADFIRMWARE",
  "FWUPDATE_STATE_ACTIVATENEWFIRMWARE",
  "FWUPDATE_STATE_WAITACTIVATE",
  "FWUPDATE_STATE_CHECKNEWFIRMWARE",
  "FWUPDATE_STATE_ERROR",
};
char * BLOBRETVAL[]=
{
  "BLOB_RET_OK",
  "BLOB_RET_ERROR_BUSY",
  "BLOB_RET_ERROR_ISDU_READ",
  "BLOB_RET_ERROR_ISDU_WRITE",
  "BLOB_RET_ERROR_STATECONFLICT",
  "BLOB_RET_ERROR_CHECKBLOBINFO_FAILED",
  "BLOB_RET_ERROR_WRONGCRC",
  "BLOB_RET_ERROR_SIZEOVERRUN",
  "BLOB_RET_ERROR_STOPPED"
};
char * BLOBSTATE[] =
{
  "BLOB_STATE_IDLE",
  "BLOB_STATE_PREPARE_DOWNLOAD",
  "BLOB_STATE_DOWNLOAD",
  "BLOB_STATE_FINALIZE_DOWNLOAD",
  "BLOB_STATE_PREPARE_UPLOAD",
  "BLOB_STATE_UPLOAD",
  "BLOB_STATE_FINALIZE_UPLOAD",
  "BLOB_STATE_ERROR",
};
void PrintUpdateStatus(LONG retval, TFWUpdateState* pUpdateState)
{
  if ((retval !=0) || (pUpdateState->executedState != pUpdateState->nextState))
  {
    if ((retval >=0) && (retval <=FWUPDATE_RET_BLOB_ERROR))
    {
      if (pUpdateState->dllReturnValue < 0)
        printf("FWUP: From=%s Next=%s retval=%s dllretval=%i\n",FWUPDATESTATE[pUpdateState->executedState],FWUPDATESTATE[pUpdateState->nextState],FWRETVAL[retval],pUpdateState->dllReturnValue);
      else
        printf("FWUP: From=%s Next=%s retval=%s dllretval=0x%X\n",FWUPDATESTATE[pUpdateState->executedState],FWUPDATESTATE[pUpdateState->nextState],FWRETVAL[retval],pUpdateState->dllReturnValue);
    }
    else
      printf("From=%s Next=%s retval=%i dllretval=%i\n",FWUPDATESTATE[pUpdateState->executedState],FWUPDATESTATE[pUpdateState->nextState],retval,pUpdateState->dllReturnValue);
  }
  /* special added comments */
  if ((pUpdateState->BlobStatus.executedState != BLOB_STATE_IDLE)||(pUpdateState->BlobStatus.nextState != BLOB_STATE_IDLE))
  {
    if ((pUpdateState->blobReturnValue >=0)&&(pUpdateState->blobReturnValue <=BLOB_RET_ERROR_STOPPED))
      printf("BLOB: From=%s Next=%s retval=%s percent=%i\n",BLOBSTATE[pUpdateState->BlobStatus.executedState],BLOBSTATE[pUpdateState->BlobStatus.nextState],BLOBRETVAL[pUpdateState->BlobStatus.dllReturnValue],pUpdateState->BlobStatus.PercentComplete);
    else
      printf("BLOB: From=%s Next=%s retval=%i percent=%i\n",BLOBSTATE[pUpdateState->BlobStatus.executedState],BLOBSTATE[pUpdateState->BlobStatus.nextState],pUpdateState->BlobStatus.dllReturnValue,pUpdateState->BlobStatus.PercentComplete);
  }
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

  // step 3.1 reset the port because otherwise the DLL will not return the correct status
  TPortConfiguration PortConfig;
  memset(&PortConfig,0,sizeof(PortConfig));               // clear port configuration
  retval = IOL_SetPortConfig(Handle, 0, &PortConfig);     // activate master on port 0  IOL_Destroy(Handle);
  if (retval != RETURN_OK)
  {
    printf("Setting portmode failed. Terminating program..\n");
  }
  else
  {
    // step 3.2: Set Master to IO-Link Mode
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
  }
  if (RETURN_OK==retval)
  {
    printf("Setting Port to IO-Link mode, waiting for sensor to connect...\n");
    bool bFertig = false;
    DWORD Status;
    while (!bFertig)
    {
      // on key pressing we exit the program
      if (_kbhit()) {
        printf("Stopped by user..\n");
        bFertig = true;
        retval = RETURN_INTERNAL_ERROR;
        break;
      }
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
        printf("Sensor found, begin with download...\n");
        retval = RETURN_OK;
        break;
      }
    }

  }

  /* a device has been connected, we start the download process */
  if (retval==0)
  {
    TFwUpdateInfo UpdateInfo;
    TFWUpdateState UpdateState;
    char filename[] = "C:\\Daten\\...\\TMG-Master-Test-Device-01-112-V12-20211123-IOLFW1.0\\TMG-Master-Test-Device-01-112-V12-20211123-IOLFW1.0.xml";
    char Password[100] = "fwupdate";
    LONG ret;

    printf("Filename:");
    printf("%s\n",filename);
    ret = IOL_FwUpdateStartByMetafile(Handle,0,filename,&UpdateInfo,&UpdateState);
    PrintUpdateStatus(ret,&UpdateState);

    while (UpdateState.nextState != FWUPDATE_STATE_IDLE)
    {
      if (UpdateState.nextState == FWUPDATE_STATE_PASSWORD)
      {
        printf("Please enter the password:");
        scanf_s("%s",Password,sizeof(Password)-1);
        ret = IOL_FwUpdateContinue(Handle,0,Password,&UpdateState);
      }
      else
        ret = IOL_FwUpdateContinue(Handle,0,0,&UpdateState);

      /* here we can interpret the update state of the firmware update */
      PrintUpdateStatus(ret,&UpdateState);

    }
  }
  
  /* Last step: destroy handle */
 memset(&PortConfig,0,sizeof(PortConfig));               // clear port configuration
 retval = IOL_SetPortConfig(Handle, 0, &PortConfig);     // activate master on port 0  IOL_Destroy(Handle);
 IOL_Destroy(Handle);

}
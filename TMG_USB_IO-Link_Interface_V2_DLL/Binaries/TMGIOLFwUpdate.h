/****************************************************************************
*
*     TECHNOLOGIE MANAGEMENT GRUPPE Technologie und Engineering GmbH
*
****************************************************************************/
/**
*       \file
*       \brief     Firmware Update over Io-Link
*
* This file contains definitions for executing the IO-Link firmware update 
* procedure
*
* \weakgroup DLL TMG IO-Link USB Master V2 - DLL interface
* The DLL interface is a standard C interface to the DLL for the TMG IO-Link USB Master V2
* @{
****************************************************************************/

#ifndef __TMGIOLFWUPDATE_H__
#define __TMGIOLFWUPDATE_H__

/****************************************************************************
**
**     Includes
*/

#include <windows.h>     /* for basic datatypes  */
#include "TMGIOLBlob.h"  /* use BLOB error types */

/*     End Includes
**
****************************************************************************/
/****************************************************************************
**
**     Defines
*/

/*     End Defines
**
****************************************************************************/
/****************************************************************************
**
**     Datatypes
*/
#pragma pack (push,1)

/** \weakgroup FWUP Firmware Update Functions
*   These definitions and functions implement the firmware update functions.
*@{*/


/** 
 *  @name Return codes which are used in the library functions.
 *  These return codes define the reaction of the firmware update library functions. 
 *  Codes less than zero are reported from the DLL. please see the codes RETURN_xxx in TMGIOLUSBIF20.h
 *
 *@{*/
#define	  FWUPDATE_RET_OK                       0	/**< function has been executed successfully */
#define   FWUPDATE_RET_ERROR_BUSY               1	/**< function could not be executed because the state machine is busy */
#define   FWUPDATE_ID_WRONG_VENDORID            2	/**< the vendor ID doesn't fit to the vendor id in the device */
#define   FWUPDATE_ID_WRONG_REVISION            3   /**< the revision doesn't fit to the revision in the device */
#define   FWUPDATE_ID_WRONG_HWKEY               4   /**< the hardware key doesn't fit to the hardware key in the device */
#define   FWUPDATE_ID_WRONG_BOOTSTATUS          5   /**< the state after booting is not correct */
#define   FWUPDATE_BOOT_MODE_NOT_REACHED        6	/**< the boot mode could not be reached */
#define   FWUPDATE_RET_ACTIVATION_FAILED        7	/**< the activation of the new firmware failed */
#define   FWUPDATE_RET_BLOB_ERROR               8	/**< there was an error during the download of the firmware */
#define   FWUPDATE_RET_XML_ERROR                9	/**< the xml file is incorrect */
/**@}*/

/** 
 *  @name Firmware update state
 *  these codes define the actual state of the firmware update state machine
 *@{*/
#define   FWUPDATE_STATE_IDLE                    0 /**< before starting or after downloading, the state changes to IDLE */
#define   FWUPDATE_STATE_IDENTIFICATION          1 /**< read our information from device (vendor id, device id, hw id) */
#define   FWUPDATE_STATE_VERIFICATION            2 /**< verify the data against the metafile information */
#define   FWUPDATE_STATE_PASSWORD                3 /**< optional password step. Must be implemented by calling application */
#define   FWUPDATE_STATE_SWITCHTOBOOTLOADER      4 /**< after verification and password protection we switch the device to boot loader with use of system commands */
#define   FWUPDATE_STATE_WAITREBOOT              5 /**< the device shall restart with another device ID. After reconnect, a new verification will be done */
#define   FWUPDATE_STATE_STARTDOWNLOAD           6 /**< start the blob download */
#define   FWUPDATE_STATE_DOWNLOADFIRMWARE        7 /**< the firmware binary will be downloaded to the device with the BLOB mechanism */
#define   FWUPDATE_STATE_ACTIVATENEWFIRMWARE     8 /**< last step in firmware update. write system command BM_ACTIVATE to device */
#define   FWUPDATE_STATE_WAITACTIVATE            9 /**< the device shall restart with another device ID. After reconnect, a new verification will be done */
#define   FWUPDATE_STATE_CHECKNEWFIRMWARE       10 /**< the device has been restartet, check if a new device id (either the old one or a new due to function differences) is 
                                                       set, and the boot loader status has been changed */
#define   FWUPDATE_STATE_ERROR                  11 /**< state which will be entered in case of any error. can only be left with Abort */
/**@}*/



/*     End Datatypes
**
****************************************************************************/

#ifdef _cplusplus
extern "C" {
#else
#ifdef __cplusplus
extern "C" {
#endif
#endif

/****************************************************************************
**
**     Function prototypes
*/

/*! TFWUpdateState_Struct contains the status information about an Update request.  */
typedef struct TFWUpdateState_Struct
{
  BYTE executedState;   /** State which was executed during the call of the continue function */
  BYTE errorCode;       /**< error code for the result of the last executed service */
  BYTE additionalCode;  /**< additional error code of the result of the last executed service */
  LONG dllReturnValue;  /**< return value from IOL - function for the result of the last executed service */
  LONG blobReturnValue; /**< return value of the BLOB state machine during download */
  BYTE nextState;       /**< next step which will be executed or has been entered (in case of error or idle) */
  TBLOBStatus BlobStatus; /**< in download states we copy the status from the blob state machine */
}TFWUpdateState;

/***************************************************************************/
/**
*       \brief     aborts a firmware update
*
* This function aborts the BLOB-transmission using TMGDLL. BLOB_ID of device will be zero after that.
*       \param     Handle      Handle to work on/with
*       \param     Port        Port number of the used port
*       \param     pUpdateState   pointer to a struct which will be used to return the actual status
*       \return    Errorcode
****************************************************************************/
LONG __stdcall IOL_FwUpdateAbort(LONG Handle, DWORD Port, TFWUpdateState * pUpdateState);


/*! TFwUpdateInfo contains the information about an Update request.  */
typedef struct TFwUpdateInfoStruct
{
  WORD vendorID;            /**< vendor ID of the attached device. Must match */
  BYTE fwPasswordRequired;  /**< from meta file. not used at this moment */
  BYTE hwKey[64+1];         /**< the correct hardware key which shall be used. the meta file must support more than one,
                                 but in this case the parser of the meta file can look for the correct one. */
  BYTE * pFirmware;         /**< pointer to the firmware object. Must be consecutive memory */
  DWORD fwLength;           /**< length of the firmware image */
}TFwUpdateInfo;

/***************************************************************************/
/**
*       \brief     starts a firmware update, parameters are raw data parameters
*
* This function reads a BLOB from the device using TMGDLL. Read data is stored in given buffer.
*       \return    Errorcode
*       \param     Handle         Handle to work on/with
*       \param     Port           Port number of the used port
*       \param     pFwUpdateInfo  pointer to a struct with the information about the update
*       \param     pUpdateState   pointer to a struct which will be used to return the actual status
****************************************************************************/
LONG __stdcall IOL_FwUpdateStart(LONG Handle, DWORD Port, TFwUpdateInfo * pFwUpdateInfo,TFWUpdateState * pUpdateState);

/***************************************************************************/
/**
*       \brief     starts a firmware update, parameters are raw data parameters
*
* This function starts the firmware update by using the metafile as a parameter.
*       \return    Errorcode
*       \param     Handle         Handle to work on/with
*       \param     Port           Port number of the used port
*       \param     pFileName      file name of the package file
*       \param     pFwUpdateInfo  Pointer to a firmware update info struct. will be filled by this function
*       \param     pUpdateState   pointer to a struct which will be used to return the actual status
****************************************************************************/
LONG __stdcall IOL_FwUpdateStartByMetafile(LONG Handle, DWORD Port, char * pFileName, TFwUpdateInfo * pFwUpdateInfo,TFWUpdateState * pUpdateState);

/***************************************************************************/
/**
*       \brief     continues the fw update protocol
*
* This function is used to execute the next firmware update step. this approach is used so that the
* calling application can show progress bar etc, or can abort the update.
*       \return    Errorcode
*       \param     Handle           Handle to work on/with
*       \param     Port             Port number of the used port
*       \param     pPassword        password which shall be used if the fwRequired is TRUE.
*                                   this parameter is only evaluated and used in State FWUPDATE_STATE_PASSWORD
*       \param     pUpdateState     pointer to a struct which will be used to return the actual status
****************************************************************************/
LONG __stdcall IOL_FwUpdateContinue(LONG Handle, DWORD Port, char * pPassword, TFWUpdateState * pUpdateState);


/*     End Function prototypes
**
****************************************************************************/
#ifdef _cplusplus
}
#endif
#ifdef __cplusplus
}
#endif
/**@}*/
#pragma pack(pop)
#endif /* __TMGIOLFWUPDATE_H__ */
/**@}*/

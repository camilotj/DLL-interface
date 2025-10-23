/****************************************************************************
*
*     TECHNOLOGIE MANAGEMENT GRUPPE Technologie und Engineering GmbH
*
****************************************************************************/
/**
*       \file
*       \brief     BLOB-transfer
*
* This file contains definitions for reading/writing BLOBs from/to 
* IO-Link-devices.
*
* \weakgroup DLL TMG IO-Link USB Master V2 - DLL interface
* The DLL interface is a standard C interface to the DLL for the TMG IO-Link USB Master V2
* @{
****************************************************************************/

#ifndef __TMGIOLBLOB_H__
#define __TMGIOLBLOB_H__

/****************************************************************************
**
**     Includes
*/

#include <windows.h>    // for basic datatypes
#pragma pack (push,1)

/*     End Includes
**
****************************************************************************/
/** \weakgroup BLOB BLOB functions
*   These definitions and functions implement the IO-Link BLOB functionality.
*@{*/

/****************************************************************************
**
**     Defines
*/

/* polynominal for CRC32 */
#define CRC32_POLYNOMIAL 0xEB31D82E

/*     End Defines
**
****************************************************************************/
/****************************************************************************
**
**     Datatypes
*/

/** 
*  @name Return values which are used in the BLOB-functions
*  These return codes define the reaction of the firmware update library functions. 
*  positive values incl. 0 come from the blob protocol
*  negative values are results from the DLL. Please see RETURN_xxx from TMGIOLUSBIF20.h for negative values
*@{*/
#define	  BLOB_RET_OK                           0	/**< successful execution of the command */
#define	  BLOB_RET_ERROR_BUSY                   1	/**< there is a service pending. it should be aborted or ended before starting a new one */
#define	  BLOB_RET_ERROR_ISDU_READ              2	/**< error in ISDU read */
#define	  BLOB_RET_ERROR_ISDU_WRITE             3	/**< error in ISDU write */
#define	  BLOB_RET_ERROR_STATECONFLICT          4	/**< the function cannot be called in the actual state */
#define	  BLOB_RET_ERROR_CHECKBLOBINFO_FAILED   5	/**< there was an error during checking of the BLOB info */
#define	  BLOB_RET_ERROR_WRONGCRC               6	/**< the CRC was wrong */
#define	  BLOB_RET_ERROR_SIZEOVERRUN            7	/**< the size of the BLOB content was too large */
#define   BLOB_RET_ERROR_STOPPED                8	/**< the BLOB has stopped */
/**@}*/

/** 
*  @name BLOB statemachine state definition
*  These codes define the actual state of the BLOB state machine
*@{*/
#define BLOB_STATE_IDLE               0 /**< n BLOB service activated */
#define BLOB_STATE_PREPARE_DOWNLOAD   1 /**< preparation of Download */
#define BLOB_STATE_DOWNLOAD           2 /**< download of the buffer */
#define BLOB_STATE_FINALIZE_DOWNLOAD  3 /**< finalize the download */
#define BLOB_STATE_PREPARE_UPLOAD     4 /**< preparation of Upload */
#define BLOB_STATE_UPLOAD             5 /**< Upload of the buffer */
#define BLOB_STATE_FINALIZE_UPLOAD    6 /**< finalize the Upload */
#define BLOB_STATE_ERROR              7 /**< error state, can only be left with Abort */
/**@}*/



/*! TBLOBStatus_Struct contains the status information about BLOB service. */
typedef struct TBLOBStatus_Struct {
  BYTE executedState;   /** State which was executed during the call of the continue function */
  BYTE errorCode;       /**< error code for the result of the service */
  BYTE additionalCode;  /**< additional error code of the result */
  LONG dllReturnValue;  /**< return value from IOL - function */
  DWORD Position;       /**< actual position */
  BYTE PercentComplete; /**< percentage of download will be computed */
  BYTE nextState;       /**< next step which will be executed or has been entered (in case of error or idle) */
} TBLOBStatus;

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


/***************************************************************************/
/**
*       \brief     aborts the BLOB-transmission
*
* This function aborts the BLOB-transmission using TMGDLL. BLOB_ID of device will be zero after that.
*       \return    Errorcode
*       \param     Handle      Handle to work on/with
*       \param     Port        Port number of the used port
*       \param     pBlobStatus      Pointer to the structure where detailed error-information is put in
****************************************************************************/
LONG __stdcall BLOB_Abort(LONG Handle, DWORD Port, TBLOBStatus * pBlobStatus);

/***************************************************************************/
/**
*       \brief     reads a BLOB from device
*
* This function reads a BLOB from the device using TMGDLL. Read data is stored in given buffer.
*       \return    Errorcode
*       \param     Handle         Handle to work on/with
*       \param     Port           Port number of the used port
*       \param     targetBLOB_ID  BLOB-ID to read from
*       \param     bufferSize     Size of the given read-buffer
*       \param     BLOB_buffer    Pointer to the read buffer
*       \param     lengthRead     Pointer to a variable the read length to put
*       \param     pBlobStatus      Pointer to the structure where detailed error-information is put in
*
****************************************************************************/
LONG __stdcall BLOB_uploadBLOB(LONG Handle, DWORD Port, LONG targetBLOB_ID, DWORD bufferSize, BYTE * BLOB_buffer, DWORD * lengthRead, TBLOBStatus * pBlobStatus);

/***************************************************************************/
/**
*       \brief     writes a BLOB to device
*
* This function writes data to the device using BLOB-mechanism and the TMGDLL.
*       \return    Errorcode
*       \param     Handle           Handle to work on/with
*       \param     Port             Port number of the used port
*       \param     targetBLOB_ID    BLOB-ID to write to
*       \param     target_BLOB_size Size of the given data
*       \param     BLOB_data        Pointer to the data to write to BLOB
*       \param     pBlobStatus        Pointer to the structure where detailed error-information is put in
****************************************************************************/
LONG __stdcall BLOB_downloadBLOB(LONG Handle, DWORD Port, LONG targetBLOB_ID, DWORD target_BLOB_size, BYTE * BLOB_data, TBLOBStatus * pBlobStatus);


/***************************************************************************/
/**
*       \brief     reads the current BLOB-ID from the device
*
* This function reads the current BLOB-ID(Index 49) from the device using TMGDLL.
*       \return    Errorcode
*       \param     Handle      Handle to work on/with
*       \param     Port        Port number of the used port
*       \param     blob_id     Pointer to the variable the BLOB-ID to put
*       \param     pBlobStatus   Pointer to the structure where detailed error-information is put in
****************************************************************************/
LONG __stdcall BLOB_ReadBlobID(LONG Handle, DWORD Port, LONG * blob_id, TBLOBStatus * pBlobStatus);

/***************************************************************************/
/**
*       \brief     continues the BLOB protocol
*
* This function is used to execute the next BLOB step. this approach is used so that the
* calling application can show progress bar etc, or can abort the update.
*       \return    Errorcode
*       \param     Handle           Handle to work on/with
*       \param     Port             Port number of the used port
*       \param     pBlobStatus   Pointer to the structure where detailed error-information is put in
****************************************************************************/
LONG __stdcall BLOB_Continue(LONG Handle, DWORD Port, TBLOBStatus * pBlobStatus);


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
#endif /* __BLOB_H__ */
/**@}*/

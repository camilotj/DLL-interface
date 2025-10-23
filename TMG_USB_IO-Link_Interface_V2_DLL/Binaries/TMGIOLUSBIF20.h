/****************************************************************************
*
*     TECHNOLOGIE MANAGEMENT GRUPPE Technologie und Engineering GmbH
*
****************************************************************************/
/**
*       \brief     USB IO-Link Master V2 - DLL Interface
*       \file      TMGIOLUSBIF20.h
* 
* This file contains the interface definitions for the TMG USB IO-Link Master.
* 
* \weakgroup DLL TMG IO-Link USB Master V2 - DLL interface
* The DLL interface is a standard C interface to the DLL for the TMG IO-Link USB Master V2
* @{
****************************************************************************/
#ifndef _IOLUSBIF20H_
#define _IOLUSBIF20H_

#pragma pack (push,1)

/** \weakgroup GDEF Global Definitions
*   These common definitions are used for several functions in the interface.
@{*/

/** 
 *  @name Sensor Status Bit definitions
 *  Some of the functions return a sensor status, which contains some status bits. The following definitions
 *  define the different informations which are shown by the status
 *
 *@{*/
#define MASK_SENSORSTATE            ((BYTE) (0x13)) /**< 1= Sensor Found, 0 = Sensor Lost, 2 = Sensor in Preoperate, 0x10 = wrong sensor connected, validation failed  */
  #define BIT_CONNECTED             ((BYTE) (0x01)) /**< 0x01 Sensor is connected and in state OPERATE */
  #define BIT_PREOPERATE            ((BYTE) (0x02)) /**< 0x02 Sensor is connected and in state PREOPERATE */
  #define BIT_WRONGSENSOR           ((BYTE) (0x10)) /**< 0x03 Sensor is connected, but the validation failed, and a WRONG_SENSOR event has been received */
#define BIT_EVENTAVAILABLE          ((BYTE) (0x04)) /**< 1 means that there are Events to be read, 0 if there is no event */
#define BIT_PDVALID                 ((BYTE) (0x08)) /**< 1 means Process datas are valid, 0 if not */
#define BIT_SENSORSTATEKNOWN        ((BYTE) (0x80)) /**< 1 means State of Sensor is known, 0 if not. (at start of set mode) */
/**@}*/



/** 
 *  @name Return codes which are used in the library functions.
 *  These return codes define the reaction of the library functions. This doesn't include the error codes
 *  which are returned by the IO-Link devices during ISDU access
 *  Codes less than zero are reported from the DLL. The commands have not been transmitted to the IO-Link
 *  master if these codes occur.
 *  Codes from 1 to 100 are reported from the IO-Link master. They occur if a service which has been received
 *  from the DLL cannot be executed due to some reason.
 *  all other codes are coming from the IO-Link device as defined in the standard
 *
 *@{*/
#define RETURN_FIRMWARE_NOT_COMPATIBLE  -16 /**< the firmware needs a firmware update because some of the functions are not implemented */
#define RETURN_FUNCTION_CALLEDFROMCALLBACK -15 /**< calling a DLL function from inside a callback is not allowed */
#define RETURN_FUNCTION_DELAYED         -14 /**< a callback has been defined, so the result may come later with the callback */
#define RETURN_FUNCTION_NOT_IMPLEMENTED -13 /**< the function is not implemented in the connected IO-Link Master */
#define RETURN_STATE_CONFLICT           -12 /**< the function cannot be used in the actual state of the IO-Link Master */
#define RETURN_WRONG_COMMAND            -11 /**< a wrong answer to a command has been received from the IO-Link Master */
#define RETURN_WRONG_PARAMETER          -10 /**< one of the function parameters is invalid */
#define RETURN_WRONG_DEVICE             -9  /**< the device name was wrong or the device which is connected is not supported */
#define RETURN_NO_EVENT                 -8  /**< a Read Event was called, but there is no event */
#define RETURN_UNKNOWN_HANDLE           -7  /**< the handle of the function is unknown */
#define RETURN_UART_TIMEOUT             -6  /**< a timeout has been reached because there as no answer to a command */
#define RETURN_CONNECTION_LOST          -5  /**< the USB master has been unplugged during communication */
#define RETURN_OUT_OF_MEMORY            -4  /**< no more memory available */
#define RETURN_DEVICE_ERROR             -3  /**< error in accessing the USB device driver */
#define RETURN_DEVICE_NOT_AVAILABLE     -2  /**< the device is not available at this moment */
#define RETURN_INTERNAL_ERROR           -1  /**< internal library error. Please restart the program */
#define RETURN_OK                       0   /**< sucessful end of the function */
#define RESULT_STATE_CONFLICT           1   /**< the command is not applicable in the actual state */
#define RESULT_NOT_SUPPORTED            2   /**< the command is not supported on this device */
#define RESULT_SERVICE_PENDING          3   /**< a Service is pending. A new service must wait for the end of the pending service */
#define RESULT_WRONG_PARAMETER_STACK    4   /**< a parameter has been rejected by the USB master */
#define RESULT_ABORT                    8   /**< a service has been aborted */
/**@}*/
/**@} GDEF*/


/*------------------------------------------------------------------------------------------*/
/* Exported DLL Functions                                                                   */
/*------------------------------------------------------------------------------------------*/
#ifdef _cplusplus
extern "C" {
#else
#ifdef __cplusplus
extern "C" {
#endif
#endif

/** \weakgroup UIM USB interface management
*   These functions are used to manage the access to USB devices. There are function to list
*   all connected devices, and to connect or disconnect to a special device.
*@{*/

/***************************************************************************/
/** 
*       \brief     Creates and initializes the communication port and handle
*
* This function opens the referred COM Port and initializes the 
* internal Datastructures. If the return value is greater than 0 it is
* the Handle by which the connected Master and its structures 
* are referenced. It shall be used with further calls to functions in this
* Library.
*       \param     Device  COM Port to open as string (e.g. COM1, COM2, ...)
*       \retval    RETURN_DEVICE_NOT_AVAILABLE  the Device referred by the string parameter "Device" is not available or busy
*       \retval    RETURN_COMM_TIMEOUT          the device did not respond in time
*       \retval    RETURN_OUT_OF_MEMORY         no more Handles can be assigned
*       \retval    RETURN_WRONG_PARAMETER       the device name was wrong
*       \retval    RETURN_FUNCTION_CALLEDFROM-CALLBACK calling a DLL function from inside a callback is not allowed
*       \retval    RETURN_FIRMWARE_NOT_-COMPATIBLE  the firmware needs a firmware update because some of the functions are not implemented
*       \return    if greater than 0 the returnvalue is a Handle
* 
****************************************************************************/
LONG __stdcall IOL_Create(char * Device);

/***************************************************************************/
/** 
*       \brief     Closes the communication port and discards the Handle
*
* This function closes the COM Port referred by the Handle. And also frees
* all the Memory coresponding to the Handle.
* \note  This function has to be called, once the Programm using this DLL is
*        about to terminate. Otherwise, when not unloading the DLL one might
*        risk an OUT_OF_MEMORY error.
*       \param     Handle  Handle to work on/with
*       \retval    RETURN_UNKNOWN_HANDLE  Handle is not valid
*       \retval    RETURN_INTERNAL_ERROR  Error that should not occur.
*       \retval    RETURN_OK              Everything worked out allright
*       \retval    RETURN_FUNCTION_CALLEDFROM-CALLBACK calling a DLL function from inside a callback is not allowed
* 
****************************************************************************/
LONG __stdcall IOL_Destroy(LONG Handle);

/*! TDeviceIdentification contains the information about an USB IO-Link master.  */
typedef struct TDeviceInfoStruct{
  char Name[8];         /**< contains the device name which should be used for the driver */
  char ProductCode[16]; /**< product identification */
  char ViewName[100];   /**< name which is shown in the device manager */
} TDeviceIdentification;

/***************************************************************************/
/** 
*       \brief     Looks for USB devices which are plugged into the PC
*
* This function looks for USB IO-Link masters in the windows device manager and returns
* a list of these devices. The information which is achieved from the device manager contains
* name and product informaion of the device.
* \note The memory containing the resulting list must be allocated by the applicaation. The library
*       cannot check if the size is big enough, therefore the application must ensure the size
*       \param     pDeviceList pointer to a buffer for the result
*       \param     MaxNumberOfEntries max number of entries which can be put in the buffer
*       \retval    number of USB devices which are found
****************************************************************************/
LONG __stdcall IOL_GetUSBDevices(TDeviceIdentification * pDeviceList, LONG MaxNumberOfEntries);

/*! TMasterInfo contains revision information from the connected master */
typedef struct TMasterInfoStruct{
	char Version[13]; /**< string which was build from the following parameters */
	BYTE Major;       /**< major firmware revision */
	BYTE Minor;       /**< minor firmware revision */
	BYTE Build;       /**< build revision of the firmware */
  BYTE MajorRevisionIOLStack; /**< major revision of the IO-Link stack used by the master */
  BYTE MinorRevisionIOLStack; /**< minor revision of the IO-Link stack used by the master */
  BYTE BuildRevisionIOLStack; /**< build revision of the IO-Link stack used by the master */
} TMasterInfo;

/***************************************************************************/
/** 
*       \brief     Get information from the USB Gateway Module
*
* This function gets version and type information from the USB Gateway Module. The module type
* is contained in the Version string (Standard or Development Version).
*       \param     Handle       Handle to work on/with
*       \param     pMasterInfo  Pointer to TMasterinfo structure
*       \retval    RETURN_UNKNOWN_HANDLE  Handle is not valid
*       \retval    RETURN_INTERNAL_ERROR  Error that should not occur.
*       \retval    RETURN_OK              Everything worked out allright
*       \retval    RETURN_FUNCTION_CALLEDFROM-CALLBACK calling a DLL function from inside a callback is not allowed
****************************************************************************/
LONG __stdcall IOL_GetMasterInfo(LONG Handle, TMasterInfo *pMasterInfo);

/*! TDllInfo contains the DLL version information */
typedef struct TDllInfoStruct{
	char Build[20];   /**< Build revision of the DLL */
	char Datum[20];   /**< build date of the DLL */
	char Version[20]; /**< major revision of the DLL */
} TDllInfo;

/***************************************************************************/
/** 
*       \brief     Get information about the DLL
*
* This function returns the Version information from the DLL
*       \param     pDllInfo   Pointer to TDllInfo structure
*       \retval    RETURN_OK  Everything worked out allright
****************************************************************************/
LONG __stdcall IOL_GetDLLInfo(TDllInfo * pDllInfo );

/**@} UIM*/


/** \weakgroup PC Port Configuration
*   These functions are used to set the specific mode of an IO-Link port, and to get information
*   about connected sensors.
*@{*/

/** @name PortModus port modi which are used for TargetMode in SetPortConfig
*@{*/
#define SM_MODE_RESET                   0   /**< Port is deactivated */
#define SM_MODE_IOLINK_PREOP            1   /**< Port is in IO-Link mode and stops in Preoperate */
#define SM_MODE_SIO_INPUT               3   /**< Port is in SIO Input mode */
#define SM_MODE_SIO_OUTPUT              4   /**< Port is in SIO Output mode */
#define SM_MODE_IOLINK_PREOP_FALLBACK   10  /**< io-link to preoperate, fallback allowed */
#define SM_MODE_IOLINK_OPER_FALLBACK    11  /**< io-link to operate, fallback allowed */
#define SM_MODE_IOLINK_OPERATE          12  /**< Io-Link, but go into operate automatically */
#define SM_MODE_IOLINK_FALLBACK         13  /**< io-link to preoperate, then automatically to fallback */
/**@}*/

/** @name Port Commands.  Commands which are used to switch the actual state of a port via the function SM_SetCommand. 
*   Note that not all state changes are allowed at any time
*@{*/
#define SM_COMMAND_FALLBACK             5   /**< switch Device from IO-Link mode back to SIO */
#define SM_COMMAND_PD_OUT_VALID         6   /**< send outputs_valid to device */
#define SM_COMMAND_PD_OUT_INVALID       7   /**< send outputs_invalid to device */
#define SM_COMMAND_OPERATE              8   /**< switch from preoperate to operate state */
#define SM_COMMAND_RESTART              9   /**< restart the connection */
/**@}*/

/** @name Port Mode details for SIO output mode.  
*   These values define the mode of a digital output.
*@{*/
#define SM_MODE_SIO_PP_SWITCH           0x0   /**< Digital output works in Push/Pull mode */
#define SM_MODE_SIO_HS_SWITCH           0x80  /**< Digital output works as High Side Switch */
#define SM_MODE_SIO_LS_SWITCH           0x40  /**< Digital output works as Low Side Switch */
/**@}*/

/** @name Port Mode details for SIO input mode.  
*   These values define the mode of a digital input.
*@{*/
#define SM_MODE_NORMAL_INPUT            0     /**< Digital input works as a normal input */
#define SM_MODE_DIAGNOSTIC_INPUT        1     /**< Digital input works as a diagnostic input */
#define SM_MODE_INVERT_INPUT            2     /**< Digital input works as a inverted input */
#define SM_MODE_SIO_TYPE_2              4     /**< this bit can be set in addition to the mode to run the Port in IEC Type 2. The default of the SIO
                                                   is Type 1 */
/**@}*/

/** @name Validation Mode, used in SetPortConfig.  
*   These values define the validation mode.
*@{*/
#define SM_VALIDATION_MODE_NONE         0 /**< no validation, each combination of device and vendor id is allowed */
#define SM_VALIDATION_MODE_COMPATIBLE   1 /**< device and vendor ID will be checked */
#define SM_VALIDATION_MODE_IDENTICAL    2 /**< device and vendor ID and the serial number will be checked */
/**@}*/

/** @name Commands which are used in the DSConfigure parameter in SetPortConfig.  
*   These values define the behavior of the parameter server. The values can be combined. If the data storage shall be enabled,
*   the bit DS_CFG_ENABLED shall be set. If (in addition) the automatic upload mode shall be used, the bit DS_CFG_UPLOAD_ENABLED
*   shall be set in addition to DS_CFG_ENABLED.
*   if the data storage shall not be used, use the value DS_CFG_DISABLED.
*@{*/
#define DS_CFG_DISABLED                 0x00  /**< the data storage mechanism is disabled */
#define DS_CFG_ENABLED                  0x80  /**< the data storage is enabled.  */
#define DS_CFG_UPLOAD_ENABLED           0x01  /**< the automatical upload is enabled */
/**@}*/

/** @name Baud rates.  Speed of the connection if it's established
*@{*/
#define SM_BAUD_19200             0   /**< speed of the connection is 19200 baud */
#define SM_BAUD_38400             1   /**< speed of the connection is 38400 baud */
#define SM_BAUD_230400            2   /**< speed of the connection is 230400 baud */
/**@}*/

/*! TPortConfiguration contains the port configuration information */
typedef struct STPortConfiguration{
  BYTE PortModeDetails;     /**< additional info for the port */
  BYTE TargetMode;          /**< Mode in which the port shall be run */
  BYTE CRID;                /**< configured revision ID */
  BYTE DSConfigure;         /**< Data Storage configuration */
  BYTE Synchronisation;     /**< Synchronisation, not used */
  BYTE FunctionID[2];       /**< Function ID, not used */
  BYTE InspectionLevel;     /**< NO_CHECK, TYPE_COMP, IDENTICAL */
  BYTE VendorID[2];         /**< validation:  Vendor ID of the device */
  BYTE DeviceID[3];         /**< validation:  Device ID of the device */
  BYTE SerialNumber[16];    /**< NULL-terminated string with the serial number */
  BYTE InputLength;         /**< configured input length */
  BYTE OutputLength;        /**< configured Output length */
} TPortConfiguration;

/***************************************************************************/
/** 
*       \brief     Sets the Mode according to the Parameters
*
* This function sets the Port on the USB IO-Link Master Gateway to the desired Mode, specified by the parameters of 
* pConfig.
* - TargetMode defines the mode of the port which is used. possible Values are:
*         - SM_MODE_RESET                 Port is deactivated
*         - SM_MODE_IOLINK_PREOP          Port is in IO-Link mode and stops in Preoperate
*         - SM_MODE_SIO_INPUT             Port is in SIO Input mode
*         - SM_MODE_SIO_OUTPUT            Port is in SIO Output mode
*         - SM_MODE_IOLINK_PREOP_FALLBACK io-link to preoperate, fallback allowed
*         - SM_MODE_IOLINK_OPER_FALLBACK  io-link to operate, fallback allowed
*         - SM_MODE_IOLINK_OPERATE        Io-Link, but go into operate automatically
*         - SM_MODE_IOLINK_FALLBACK       io-link to preoperate, then automatically to fallback
* .
* - PortModeDetails sets additional information for the port mode. The content depends on the TargetMode:
*         - in IO-Link Modes SM_MODE_IOLINK_xxx the value contains the cycle time. The format of the cycle time is defined in the IO-Link
*           specification. A value of 0 means "free running" mode where the maximum of (min cycle time of the device and min cycle time
*           of the master) will be used as the real cycle time.
*         - in SM_MODE_SIO_INPUT the value defines the behavior of the input value. Possible values are:
*                 - SM_MODE_NORMAL_INPUT  Digital input works as a normal input
*                 - SM_MODE_DIAGNOSTIC_INPUT Red if Open, diagnostic input
*                 - SM_MODE_INVERT_INPUT  Digital input works as a inverted input
*         - in SM_MODE_SIO_OUTPUT the value defines the physical mode of the output circuit
*                 - SM_MODE_SIO_PP_SWITCH Digital output works in Push/Pull mode
*                 - SM_MODE_SIO_HS_SWITCH Digital output works as High Side Switch
*                 - SM_MODE_SIO_LS_SWITCH Digital output works as Low Side Switch
* - CRID  defines the Configured revision ID. This Value defines the IO-Link version which will be used to communicate. If the sensor does not support this version, the connection will fail. Possible values are:
*         - 0x11  The Port will be used in V11 Mode. Devices based on Specification 1.0 will accessed with V1.0 Frames.
*           Devices based on V1.1 Spec will be accessed with V1.1 Frames.
*         - 0x10  The Port will run in V10 Mode. Devices based on V11 Specification will be automatically switched to V10 if they are capable to do this.
*         - 0     there will be no check against the revision number. both V10 and V11 devices with the same vendor and device ID will be connected.
*           However, if Data storage is enabled, the revision numer must be set to 0x11. Otherwise the service will be respond with WRONG_PARAMETER,
*           because only V11 devices support the data storage.
* - DSConfigure configuration of the Data storage. The Values can be combined. Possible values are:
*         - DS_CFG_ENABLED defines that the data storage is enabled. 
*         - DS_CFG_UPLOAD_ENABLED defines that the automatically upload is enabled. If not set, the Upload must be done manually.
* - InspectionLevel defines the amount of validation which is done at connecting to the device. If one of the validation parameters
*   does not match the parameters in the device, the connection will fail
*         - SM_VALIDATION_MODE_NONE there is no validation. Each device can be connected without validating anything. The parameters
*           VendorID, DeviceID and SerialNumber can be left empty
*         - SM_VALIDATION_MODE_COMPATIBLE defines the mode where a given device can be exchanged with a device of the same type.
*           the Parameter VendorID and DeviceID must be set and are checked against the parameters of the device. If the device matches
*           these values (this includes compatible devices which can switch the device ID), the connection will be successful. Otherwise
*           it will fail.
*         - SM_VALIDATION_MODE_IDENTICAL defines the mode where the exact device will be checked which is connected. All Parameters 
*           VendorID, DeviceID and SerialNumber will be checked. Of course the device has to support the Parameter SerialNumber which
*           is not mandatory.
* - InputLength defines the input data length of the application. The normal value is 32 so that each device can be connected. 
*   If the application doesn't support 32 byte, it can reduce this. If the device needs more data, the connection will fail
* - OutputLength defines the output data length of the application. The normal value is 32 so that each device can be connected. 
*   If the application doesn't support 32 byte, it can reduce this. If the device needs more data, the connection will fail
*       \param     Handle    Handle to work on/with
*       \param     Port      Port number of the used port
*       \param     pConfig  pointer to the data structure containing the data
*       \retval    RETURN_UNKNOWN_HANDLE  Handle is not valid
*       \retval    RETURN_INTERNAL_ERROR  Error that should not occur.
*       \retval    RETURN_OK              Everything worked out allright
*       \retval    RETURN_FUNCTION_CALLEDFROM-CALLBACK calling a DLL function from inside a callback is not allowed
*
****************************************************************************/
LONG  __stdcall IOL_SetPortConfig(LONG Handle, DWORD Port, TPortConfiguration * pConfig);


/***************************************************************************/
/** 
*       \brief     Reads out the actual port configuration
*
* This function reads out the actual Port configuration for a given Port
*       \param     Handle    Handle to work on/with
*       \param     Port      Port number of the used port
*       \param     pConfig  pointer to the data structure containing the data
*       \retval    RETURN_UNKNOWN_HANDLE  Handle is not valid
*       \retval    RETURN_INTERNAL_ERROR  Error that should not occur.
*       \retval    RETURN_OK              Everything worked out allright
*       \retval    RETURN_FUNCTION_CALLEDFROM-CALLBACK calling a DLL function from inside a callback is not allowed
*
****************************************************************************/
LONG  __stdcall IOL_GetPortConfig(LONG Handle, DWORD Port, TPortConfiguration * pConfig);

/** 
 *  @name SensorStateDefinitions for TInfo
 *  The SensorState in TInfo structure is different from other state definitions. This is due to historical use of this function.
 *  it will still work, but the functions IOL_GetSensorState and IOL_GetModeEx have some advantages over the function IOL_GetMode
 *  the value is only useful for the IO-Link mode. In other modes the state will show always the
 *  value STATE_DISCONNECTED_GETMODE
*@{*/
#define STATE_DISCONNECTED_GETMODE 0    /**< there is no device connected */
#define STATE_PREOPERATE_GETMODE   0x80 /**< the connection is still in PREOPERATE state */
#define STATE_WRONGSENSOR_GETMODE  0x40 /**< a wrong device has been conntected. This may appear if the validation mode is set */
#define STATE_OPERATE_GETMODE      0xFF /**< the connection has been established */
/**@}*/



/*! TInfo contans the information about a connected sensor and the state of a port */
typedef struct Info_Struct {
	char COM[10];         /**< device interface name */
	BYTE DeviceID[3];     /**< Device ID */
	BYTE VendorID[2];     /**< Vendor ID */
	BYTE FunctionID[2];   /**< Function ID */
	BYTE ActualMode;      /**< Actual Mode of the Port, Deactivated, IO-Link or SIO */
	BYTE SensorState;     /**< state of the sensor see \see SensorStateDefinitions */
	BYTE MasterCycle;     /**< used cycle time if sensor is connected */
	BYTE CurrentBaudrate; /**< current baud rate */
} TInfo;

/***************************************************************************/
/** 
*       \brief     Gets the current Mode
*
* This function gets the current state and Mode information of the Port on
* the USB IO-Link Master Gateway. The result will be stored in the data structure
* pointed to by the parameter pInfo.
* - COM contains the Device name of the IO-Link Master (such as "COM3")
* - DeviceID contains the device ID of the connected device
* - VendorID contains the Vendor ID of the connected device
* - FunctionID contains the Function ID of the connected device
* - ActualMode is the actual running mode of the port. the values are a subset of the values used by SetPortConfig:
*         - SM_MODE_RESET                 Port is deactivated
*         - SM_MODE_IOLINK_PREOP          Port is in IO-Link mode
*         - SM_MODE_SIO_INPUT             Port is in SIO Input mode
*         - SM_MODE_SIO_OUTPUT            Port is in SIO Output mode
* - SensorState defines the actual state of the sensor:
* - MasterCycle defines the actual cycle time which is used in the connection
* - CurrentBaudrate defines the actual used baud rate of the connection
*       \param     Handle    Handle to work on/with
*       \param     Port        Port number of the used port
*       \param     pInfo     Pointer to TInfo structure
*       \retval    RETURN_UNKNOWN_HANDLE  Handle is not valid
*       \retval    RETURN_INTERNAL_ERROR  Error that should not occur.
*       \retval    RETURN_OK              Everything worked out allright
*       \retval    RETURN_FUNCTION_DELAYED  the answer will be delayed because a callback is defined
*       \retval    RETURN_FUNCTION_CALLEDFROM-CALLBACK calling a DLL function from inside a callback is not allowed
*       \warning   This function is depreciated and should not be used anymore. Please use IOL_GetStatus and IOL_GetModeEx instead because they have advantages.
*
****************************************************************************/
LONG __stdcall IOL_GetMode(LONG Handle, DWORD Port, TInfo * pInfo);

/***************************************************************************/
/** 
*       \brief     Send Command to the IO-Link Master

* This function sends a command out of a predefined list of commands. These commands are transmitted
* to the sensor. Possible values for the Command are:
* - SM_COMMAND_FALLBACK  switch Device from IO-Link mode back to SIO
* - SM_COMMAND_PD_OUT_VALID send outputs_valid to device
* - SM_COMMAND_PD_OUT_INVALID send outputs_invalid to device
* - SM_COMMAND_OPERATE switch from preoperate to operate state
*       \param     Handle   Handle to work on/with
*       \param     Port        Port number of the used port
*       \param     Command  Pointer to TMasterinfo structure
*       \retval    RETURN_UNKNOWN_HANDLE  Handle is not valid
*       \retval    RETURN_INTERNAL_ERROR  Error that should not occur.
*       \retval    RETURN_OK              Everything worked out allright
*       \retval    RETURN_FUNCTION_CALLEDFROM-CALLBACK calling a DLL function from inside a callback is not allowed
*
****************************************************************************/
LONG __stdcall IOL_SetCommand(LONG Handle, DWORD Port, DWORD Command);

/***************************************************************************/
/** 
*       \brief     Return the current Sensor Status
*
* This function will return the current Sensorstatus. It will write the same
* bits to the Variable Status as it is written in Processdata Exchange.
*       \param     Handle       Handle to work on/with
*       \param     Port        Port number of the used port
*       \param     Status       Status information (Events, Processdata Valid, ...)
*       \retval    RETURN_UNKNOWN_HANDLE  Handle is not valid
*       \retval    RETURN_INTERNAL_ERROR  Error that should not occur.
*       \retval    RETURN_OK              Everything worked out allright
*       \retval    RETURN_FUNCTION_CALLEDFROM-CALLBACK calling a DLL function from inside a callback is not allowed
****************************************************************************/
LONG __stdcall IOL_GetSensorStatus(LONG Handle, DWORD Port, DWORD * Status);

/*! TInfoEx contains the extended information about a connected sensor */
typedef struct Info_StructEx {
	char COM[10];                 /**< device interface name */
  BYTE DirectParameterPage[16]; /**< information from direct parameter page (Index 0) */
	BYTE ActualMode;              /**< actual master port state */
	BYTE SensorStatus;            /**< actual connection state of the sensor */
	BYTE CurrentBaudrate;         /**< actual baud rate */
} TInfoEx;

/***************************************************************************/
/** 
*       \brief     Gets the current Mode
*
* This function gets the current state and Mode information of the Port on
* the USB IO-Link Master Gateway. The result will be stored in the data structure
* pointed to by the parameter pInfoEx.
* - COM contains the Device name of the IO-Link Master (such as "COM3")
* - DirectParameterPage contains the complete DPP1 of the device if OnlyStatus was false
* - ActualMode is the actual running mode of the port. the values are a subset of the values used by SetPortConfig:
*         - SM_MODE_RESET                 Port is deactivated
*         - SM_MODE_IOLINK_PREOP          Port is in IO-Link mode
*         - SM_MODE_SIO_INPUT             Port is in SIO Input mode
*         - SM_MODE_SIO_OUTPUT            Port is in SIO Output mode
* - SensorState defines the actual state of the sensor:
* - CurrentBaudrate defines the actual used baud rate of the connection
*       \param     Handle    Handle to work on/with
*       \param     Port        Port number of the used port
*       \param     pInfoEx     Pointer to TInfo structure
*       \param     OnlyStatus 
*       \retval    RETURN_UNKNOWN_HANDLE  Handle is not valid
*       \retval    RETURN_INTERNAL_ERROR  Error that should not occur.
*       \retval    RETURN_OK              Everything worked out allright
*       \retval    RETURN_FUNCTION_DELAYED  the answer will be delayed because a callback is defined
*       \retval    RETURN_FUNCTION_CALLEDFROM-CALLBACK calling a DLL function from inside a callback is not allowed
*
****************************************************************************/
LONG __stdcall IOL_GetModeEx(LONG Handle, DWORD Port, TInfoEx * pInfoEx,BOOL OnlyStatus);

/**@} PC */


/** \weakgroup PDH Process Data Handling
*   These functions are used to get and set process data. In addition the data loggin can be
*   activated and deactivated.
*@{*/

/***************************************************************************/
/** 
*       \brief     Read-back the Output Process Data written
*
* This function reads-back the Process Data written to the Process-Data-
* Output-Buffer previously with IOL_WriteOutputs.
*       \param     Handle       Handle to work on/with
*       \param     Port         Port from which to read, 0xFF = ALL Ports
*       \param     ProcessData  Pointer to write the Process Data to
*       \param     Length       Length of written Process Data
*       \param     Status       Status information (Events, Processdata Valid, ...)
*       \retval    RETURN_UNKNOWN_HANDLE  Handle is not valid
*       \retval    RETURN_INTERNAL_ERROR  Error that should not occur.
*       \retval    RETURN_OK              Everything worked out allright
*       \retval    RETURN_FUNCTION_CALLEDFROM-CALLBACK calling a DLL function from inside a callback is not allowed
****************************************************************************/
LONG __stdcall IOL_ReadOutputs(LONG Handle, DWORD Port, BYTE * ProcessData, DWORD * Length, DWORD * Status);

/***************************************************************************/
/** 
*       \brief     Read the Input Process Data from the Sensor connected
*
* This function reads the Process Data from the USB IO-Link Master Gateway,
* which was received from the Sensor.
* for specific port numbers, the structure contains the Length, the data, and a valid information
* for port 0xFF, which means ALL Ports, first byte is the number of entries. Then the above structure
* follows Length, data, valid
*       \param     Handle       Handle to work on/with
*       \param     Port         Port from which to read, 0xFF = ALL Ports
*       \param     ProcessData  Pointer to write the Process Data to
*       \param     Length       Length of written Process Data
*       \param     Status       Status information (Events, Processdata Valid, ...)
*       \retval    RETURN_UNKNOWN_HANDLE  Handle is not valid
*       \retval    RETURN_INTERNAL_ERROR  Error that should not occur.
*       \retval    RETURN_OK              Everything worked out allright
*       \retval    RETURN_FUNCTION_CALLEDFROM-CALLBACK calling a DLL function from inside a callback is not allowed
****************************************************************************/
LONG __stdcall IOL_ReadInputs(LONG Handle, DWORD Port,BYTE * ProcessData, DWORD * Length, DWORD * Status);

/***************************************************************************/
/** 
*       \brief     Write Output Process Data to the USB IO-Link Master
*
* This function writes the Process Data refered by ProcessData to the USB
* IO-Link Master. The data is then transferred to the connected Sensor.
*       \param     Handle       Handle to work on/with
*       \param     Port         Port from which to read, 0xFF = ALL Ports
*       \param     ProcessData  Pointer to the Process Data to be written
*       \param     Length       Length of Process Data
*       \retval    RETURN_UNKNOWN_HANDLE  Handle is not valid
*       \retval    RETURN_INTERNAL_ERROR  Error that should not occur.
*       \retval    RETURN_OK              Everything worked out allright
*       \retval    RETURN_FUNCTION_CALLEDFROM-CALLBACK calling a DLL function from inside a callback is not allowed
****************************************************************************/
LONG __stdcall IOL_WriteOutputs(LONG Handle, DWORD Port, BYTE * ProcessData, DWORD Length);

/***************************************************************************/
/** 
*       \brief     Transfers Process Data in both directions
*
* This function transfers Process Data in both directions. It first sends
* out the Processdata referenced by ProcessDataOut. And then receives the
* response and writes it's content to ProcessDataIn.
*       \param     Handle          Handle to work on/with
*       \param     Port           Port from which to read and write, 0xFF = ALL Ports
*       \param     ProcessDataOut  Pointer to read the Process Data from
*       \param     LengthOut       Length of Process Data to be output
*       \param     ProcessDataIn   Pointer to write the Process Data to
*       \param     LengthIn        Length of written Process Data
*       \param     Status          Status information (Events, Processdata Valid, ...)
*       \retval    RETURN_UNKNOWN_HANDLE  Handle is not valid
*       \retval    RETURN_INTERNAL_ERROR  Error that should not occur.
*       \retval    RETURN_OK              Everything worked out allright
*       \retval    RETURN_FUNCTION_CALLEDFROM-CALLBACK calling a DLL function from inside a callback is not allowed
****************************************************************************/
LONG __stdcall IOL_TransferProcessData(LONG Handle, DWORD Port, BYTE * ProcessDataOut, DWORD LengthOut, BYTE * ProcessDataIn, DWORD * LengthIn, DWORD * Status);
/**@} PDH*/

/** \weakgroup LOG Process Data Logging
*   These functions are used to log the process data to a file or into a buffer.
*@{*/

/***************************************************************************/
/** 
*       \brief     Starts the process data logging into a file
*
* This function informs the master to send cyclically the process input data
* to the DLL. The DLL will store them together with the output data into the
* file which has been defined by the FileName. The logging will only occur if
* the mode of the port is not in Deactivated. The Sample Time will be given in
* ms, however the master interface will round this time to a value it can provide
*       \param     Handle      Handle to work on/with
*       \param     Port        Port number of the used port
*       \param     FileName    Pointer to the full filename
*       \param     pSampleTimeMs time interval between the process data samples
*       \retval    RETURN_UNKNOWN_HANDLE  Handle is not valid
*       \retval    RETURN_INTERNAL_ERROR  Error that should not occur.
*       \retval    RETURN_WRONG_PARAMETER One of the paramters was wrong.
*       \retval    RETURN_OK              Everything worked out allright
*       \retval    RETURN_STATE_CONFLICT  interface is in the wrong state
*       \retval    RETURN_FUNCTION_CALLEDFROM-CALLBACK calling a DLL function from inside a callback is not allowed
****************************************************************************/
LONG __stdcall IOL_StartDataLogging (LONG Handle, DWORD Port, char * FileName, DWORD *pSampleTimeMs);


/** @name LoggingMode Operation mode of the data logging. There are two modes: time driven and cycle synchron. In time driven mode,
    the USB Master will send the process data each invall given by the settings. the unit is microseconds, but it will be rounded to a multiple of
    5ms, because there is no advantage if it would be faster, because it is not synchronized with the IO-Link cycle.
    In cycle synchron mode, the setting will be used as a counter for the cycles. On elapsing of the counter the samples will be sent to
    the PC. The real cycle depends on the cycle time of the master and the counter
*@{*/
#define LOGGING_MODE_TIME          0   /**< time driven logging mode */
#define LOGGING_MODE_CYCLES        1   /**< cycle synchron logging mode */
/**@}*/

/***************************************************************************/
/**
*       \brief     Starts the process data logging into a buffer
*
* This function informs the master to send cyclically the process input data
* to the DLL. The DLL will store them together with the output data into a buffer.
* The logging will only occur if the mode of the port is not in Deactivated. The Sample Time will be given in
* microseconds, however the master interface will round this time to a value it can provide.
* The data can be read by the function IOL_ReadLoggingBuffer
*       \param     Handle      Handle to work on/with
*       \param     Port        Port number of the used port
*       \param     LoggingMode Mode which defines the trigger for the transmission of process data. See LoggingMode for the different modes.
*       \param     MemorySize  size of the ring buffer. the memory will be allocated by the DLL.
*       \param     pSampleTime dependend on the mode parameter this parameter defines either the time interval 
*                              between the process data samples in micro seconds (Mode = 0) or the number of cycles
*                              to elapse between two samples in mode 1
*       \retval    RETURN_UNKNOWN_HANDLE  Handle is not valid
*       \retval    RETURN_INTERNAL_ERROR  Error that should not occur.
*       \retval    RETURN_WRONG_PARAMETER One of the paramters was wrong.
*       \retval    RETURN_OK              Everything worked out allright
*       \retval    RETURN_STATE_CONFLICT  interface is in the wrong state
*       \retval    RETURN_FUNCTION-CALLEDFROMCALLBACK calling a DLL function from inside a callback is not allowed
****************************************************************************/
LONG __stdcall IOL_StartDataLoggingInBuffer(LONG Handle, DWORD Port, LONG MemorySize, DWORD LoggingMode, DWORD *pSampleTime);


/** @name LoggingStatus Bit Codings used in the status of the function IOL_ReadLoggingBuffer
*@{*/
#define LOGGING_STATUS_RUNNING          1   /**< 1 if Logging is started, 0 if stopped */
#define LOGGING_STATUS_AVAILABLE        2   /**< 1 if there are more data available in the read buffer */
#define LOGGING_STATUS_OVERRUN          4   /**< The application has not read out the results fast enough. for this
                                                 reason the logging has stopped. The bit is reset on call of the 
                                                 function see IOL_StopDataLogging or see IOL_StartDataLoggingInBuffer */
/**@}*/

/** @name InputValidity coding for validity of inputs, see IOL_ReadLoggingBuffer
*@{*/
#define LOGGING_INPUTS_VALID            0     /**< inputs are valid and can be used */
#define LOGGING_INPUTS_INVALID          0x40  /**< the inputs are invalid, and the use of the data should not be done
                                                 because the content is not guaranteed */
/**@}*/

/***************************************************************************/
/**
*       \brief     Ready out the logged data from the buffer
*
* This function is used to read out a part of the logging buffer. The pointer and the size of the buffer will
* part of the parameter. The function will read out as much as logging data as possible. The data will not be
* segmented. If there is no more place in the buffer, the size will be reduced.
* The data is an array of logging entries. A logging Entry is structured as seen below (all members are byte or byte arrays):
*       Port       Port number of the logged port
*       InLength   Length of the logged input data including an additional byte for the validity which is the last byte
*       InputData  Array of the inputs. The length is InLength-1
*       InValidity validity of the inputs
*       OutLength  Length of the output data
*       OutputData Array of the outputs. The length is OutLength

*       \param     Handle      Handle to work on/with
*       \param     pBufferSize  pointer to the size of the ring buffer. On call, it shall contain the maximum length
*                              of the buffer. This function will change it to the real length. \note The buffer Size shall
*                              be at least the maximum of an IO-Link frame + some bytes of structure information. for this
*                              reason the length should be bigger than 128 byte. Otherwise it might be possible that you
*                              cannot read out the buffer.
*       \param     pData       pointer to a buffer where the logging data shall be stored.
*       \param     pStatus     Pointer to a DWORD buffer where a bit coded status will be stored. The possible
*                              bit values for the status are coded in LoggingStatus.
*       \retval    RETURN_UNKNOWN_HANDLE  Handle is not valid
*       \retval    RETURN_INTERNAL_ERROR  Error that should not occur.
*       \retval    RETURN_WRONG_PARAMETER One of the paramters was wrong.
*       \retval    RETURN_OK              Everything worked out allright
*       \retval    RETURN_STATE_CONFLICT  interface is in the wrong state
*       \retval    RETURN_FUNCTION-CALLEDFROMCALLBACK calling a DLL function from inside a callback is not allowed
****************************************************************************/
LONG __stdcall IOL_ReadLoggingBuffer(LONG Handle, LONG * pBufferSize, BYTE * pData, DWORD * pStatus);

/***************************************************************************/
/** 
*       \brief     Stops the data logging
*
* This function informs the master to stop the logging of the process data.
*       \param     Handle      Handle to work on/with
*       \retval    RETURN_UNKNOWN_HANDLE  Handle is not valid
*       \retval    RETURN_INTERNAL_ERROR  Error that should not occur.
*       \retval    RETURN_WRONG_PARAMETER One of the paramters was wrong.
*       \retval    RETURN_STATE_CONFLICT  interface is in the wrong state
*       \retval    RETURN_OK              Everything worked out allright
*       \retval    RETURN_FUNCTION_CALLEDFROM-CALLBACK calling a DLL function from inside a callback is not allowed
****************************************************************************/
LONG __stdcall IOL_StopDataLogging (LONG Handle);

/**@} PDH*/


/** \weakgroup ISDU ISDU handling
*   These functions are used to get and set parameter data via ISDU requests.
*@{*/

/*! TParameter contains the information which are used for ISDU read and write */
typedef struct Parameter_Struct {
	BYTE Result[256];     /**< buffer for data bytes (read and write) */
	WORD Index;           /**< index of the variable to be read or written */
	BYTE SubIndex;        /**< subindex of the variable to be read or written */
	BYTE Length;          /**< length of the parameter data */
	BYTE ErrorCode;       /**< error code for the result of the service */
	BYTE AdditionalCode;  /**< additional error code of the result */
} TParameter;

/***************************************************************************/
/** 
*       \brief     Request read on SPDU from the Sensor
*
* This function sends a Read Request to the USB IO-Link Master, which
* passes it to the Device connected. The pParameter struct is used to
* set the Index and Subindex, that is requested via the SPDU-Channel.
*       \param     Handle      Handle to work on/with
*       \param     Port        Port number of the used port
*       \param     pParameter  Pointer to TParameter struct
*       \retval    RETURN_UNKNOWN_HANDLE  Handle is not valid
*       \retval    RETURN_INTERNAL_ERROR  Error that should not occur.
*       \retval    RETURN_OK              Everything worked out allright
*       \retval    RETURN_FUNCTION_DELAYED  the answer will be delayed because a callback is defined
*       \retval    RETURN_FUNCTION_CALLEDFROM-CALLBACK calling a DLL function from inside a callback is not allowed
****************************************************************************/
LONG __stdcall IOL_ReadReq(LONG Handle, DWORD Port, TParameter * pParameter);

/***************************************************************************/
/** 
*       \brief     Request to write on SPDU to the Sensor
*
* This function sends a Write Request to the USB IO-Link Master, which
* passes it to the Device connected. The pParameter struct is used to
* set the Index and Subindex, that is requested to be written via the
* SPDU-Channel. The pParameter struct also contains the Data that will
* be written.
*       \param     Handle      Handle to work on/with
*       \param     Port        Port number of the used port
*       \param     pParameter  Pointer to TParameter struct
*       \retval    RETURN_UNKNOWN_HANDLE  Handle is not valid
*       \retval    RETURN_INTERNAL_ERROR  Error that should not occur.
*       \retval    RETURN_OK              Everything worked out allright
*       \retval    RETURN_FUNCTION_DELAYED  the answer will be delayed because a callback is defined
*       \retval    RETURN_FUNCTION_CALLEDFROM-CALLBACK calling a DLL function from inside a callback is not allowed
****************************************************************************/
LONG __stdcall IOL_WriteReq(LONG Handle, DWORD Port, TParameter * pParameter);

/**@} ISDU*/


/** \weakgroup EH Event handling
*   These functions are used to handle the device events.
*@{*/

/** @name Event definitions
*   These values define the content of the event buffer
*@{*/
/* instance definitions */
#define EVNT_INST_UNKNOWN                 0  /**< instance is unknown */
#define EVNT_INST_PHL                     1  /**< instance physical layer */
#define EVNT_INST_DL                      2  /**< instance data layer */
#define EVNT_INST_AL                      3  /**< instance Application Layer */
#define EVNT_INST_APPL                    4  /**< instance Application */
/* event types */
#define EVNT_TYPE_ERROR                   0x30 /**< event shows an error */
#define EVNT_TYPE_WARNING                 0x20 /**< event shows a warning */
#define EVNT_TYPE_MESSAGE                 0x10 /**< event shows a Message */
/* EventMode */
#define EVNT_MODE_SINGLE                  0x40 /**< event shows a single message or warning */
#define EVNT_MODE_COMING                  0xC0 /**< event shows that an error has appeared */
#define EVNT_MODE_GOING                   0x80 /**< event shows that an error has disappeared */
/* event codes */
#define EVNT_CODE_M_PDU_CHECK             2   /**< a frame with a CRC error has been received */
#define EVNT_CODE_S_DEVICELOST            16  /**< Device has been disconnected: coming: line break going: device is in operate */
#define EVNT_CODE_S_WRONGSENSOR           26  /**< a wrong sensor has been detected. Unspecific error. The normal case is code 64-72 */
#define EVNT_CODE_S_RETRY                 27  /**< Retries have been detected */
#define EVNT_CODE_P_SHORT                 30  /**< a short circuit has been detected on the C/Q line */
#define EVNT_CODE_P_SENSOR                31  /**< there is an error in the Sensor supply */
#define EVNT_CODE_P_ACTOR                 32  /**< there is an error in the Actor supply */
#define EVNT_CODE_P_POWER                 33  /**< there is an error in the Power Supply of the IO-Link master */
#define EVNT_CODE_P_RESET                 34  /**< an event is send if a port has been resetted */
#define EVNT_CODE_S_FALLBACK              35  /**< fallback has been done successful, device is back in SIO state */
#define EVNT_CODE_M_PREOPERATE            36  /**< device has reached the preoperate state */
#define EVNT_CODE_DSREADY_NOACTION        40  /**< data storage come to the end, but there os no action, because the CRC was correct */
#define DS_FAULT_IDENT                    41  /**< the sensor doesn't match the content in the data storage */
#define DS_FAULT_SIZE                     42  /**< the sensor parameters doesn't fit in the memory of the data storage */
#define DS_FAULT_UPLOAD                   43  /**< error in uploading the data storage */
#define DS_FAULT_DOWNLOAD                 44  /**< error in downloading the data storage */
#define DS_FAULT_DEVICE_LOCKED            47  /**< error in data storage function because the device is locked */
#define EVNT_CODE_DSREADY_DOWNLOAD        50  /**< the parameter download has come to the end */
#define EVNT_CODE_DSREADY_UPLOAD          51  /**< the parameter upload has come to the end */
#define EVNT_CODE_S_WRONG_PDINLENGTH      64  /**< process data input length don't match */
#define EVNT_CODE_S_WRONG_PDOUTLENGTH     65  /**< process data output length don't match */
#define EVNT_CODE_S_WRONG_REVISION        66  /**< device revision doesn't match */
#define EVNT_CODE_S_WRONG_COMP_VENDORID   67  /**< vendor id is wrong V1.1 sensor */
#define EVNT_CODE_S_WRONG_COMP_DEVICEID   68  /**< device id is wrong V1.1 sensor */
#define EVNT_CODE_S_WRONG_COMP10_VENDORID 69  /**< vendor id is wrong V1.0 sensor */
#define EVNT_CODE_S_WRONG_COMP10_DEVICEID 70  /**< device id is wrong V1.0 sensor */
#define EVNT_CODE_S_WRONG_SERNUM          71  /**< serial number is wrong */
#define EVNT_CODE_S_WRONG_CYCLE           72  /**< cycle time not matching */
/**@}*/


/*! TEvent contains the data of an occured event */
typedef struct Event_Struct {
	WORD Number;          /**< number of the event, is incremented by the DLL */
  WORD Port;            /**< port on which the event occured */
	WORD EventCode;       /**< event code */
	BYTE Instance;        /**< instance of the event */
	BYTE Mode;            /**< event mode */
	BYTE Type;            /**< event type */
	BYTE PDValid;         /**< event mode */
	BYTE LocalGenerated;  /**< TRUE if the event was generated by the IO-Link master */
} TEvent;


/***************************************************************************/
/** 
*       \brief     Get the last event out of the Event Buffer
*
* This function gets the most next Event out of the internal FIFO Buffer. 
* The DLL stores occuring events in an internal FIFO Buffer with enough
* Space for 10 Events. If this function doesn't get called after 10 Events
* the last Event will be overridden. 
*       \param     Handle  Handle to work on/with
*       \param     pEvent  Pointer to a TEvent struct
*       \param     Status  Status information (Events, Processdata Valid, ...)
*       \retval    RETURN_UNKNOWN_HANDLE  Handle is not valid
*       \retval    RETURN_INTERNAL_ERROR  Error that should not occur.
*       \retval    RETURN_OK              Everything worked out allright
*       \retval    RETURN_FUNCTION_CALLEDFROM-CALLBACK calling a DLL function from inside a callback is not allowed
****************************************************************************/
LONG __stdcall IOL_ReadEvent(LONG Handle, TEvent * pEvent, DWORD * Status);

/**@} EH*/


/** \weakgroup DS Data Storage
*   These functions are used to handle the data storage commands.
*@{*/

/** @name Commands which are used in IOL_DS_Command.  
*   These commands are used to activate data storage commands.
*@{*/
#define DS_CMD_UPLOAD                   0x01 /**< upload parameter-set */ 
#define DS_CMD_DOWNLOAD                 0x02 /**< download current parameter-set */ 
#define DS_CMD_CLEAR                    0x03 /**< clear stored parameter set */ 
/**@}*/


/***************************************************************************/
/** 
*       \brief     sends a data storage command
*
* This function sends a data storage command to the data storage for a given port.
* The command is set in the parameter DSCommand and can contain the following values:
*
* DS_CMD_UPLOAD   starts an upload from the device
* DS_CMD_DOWNLOAD starts a download to the device
* DS_CMD_CLEAR    clears the content of the data storage
*       \param     Handle      Handle to work on/with
*       \param     Port        Port number of the used port
*       \param     DSCommand   Command which shall be sent to the data storage
*       \retval    RETURN_UNKNOWN_HANDLE  Handle is not valid
*       \retval    RETURN_INTERNAL_ERROR  Error that should not occur.
*       \retval    RETURN_OK              Everything worked out allright
*       \retval    RETURN_FUNCTION_CALLEDFROM-CALLBACK calling a DLL function from inside a callback is not allowed
****************************************************************************/
LONG __stdcall IOL_DS_Command(LONG  Handle, DWORD Port, DWORD DSCommand);

/***************************************************************************/
/** 
*       \brief     Reads out the content of the data storage
*
* This function reads the data storage buffer of the IO-Link master for a given port.
*       \param     Handle      Handle to work on/with
*       \param     Port        Port number of the used port
*       \param     pDSContentData pointer to a buffer for the content of the data storage
*       \param     pDSContentLength pointer to the length. Must be initialized with the size of the buffer
*       \retval    RETURN_UNKNOWN_HANDLE  Handle is not valid
*       \retval    RETURN_INTERNAL_ERROR  Error that should not occur.
*       \retval    RETURN_OK              Everything worked out allright
*       \retval    RETURN_FUNCTION_CALLEDFROM-CALLBACK calling a DLL function from inside a callback is not allowed
****************************************************************************/
LONG __stdcall IOL_DS_ContentGet( LONG   Handle, DWORD  Port, BYTE * pDSContentData, DWORD *pDSContentLength );

/***************************************************************************/
/** 
*       \brief     Writes the content of a data storage to the IO-Link master
*
* This function writes a buffer to the data storage of the IO-Link master.
*       \param     Handle      Handle to work on/with
*       \param     Port        Port number of the used port
*       \param     pDSContentData pointer to a buffer for the content of the data storage
*       \param     DSContentLength length of the buffer which shall be written
*       \retval    RETURN_UNKNOWN_HANDLE  Handle is not valid
*       \retval    RETURN_INTERNAL_ERROR  Error that should not occur.
*       \retval    RETURN_OK              Everything worked out allright
*       \retval    RETURN_FUNCTION_CALLEDFROM-CALLBACK calling a DLL function from inside a callback is not allowed
****************************************************************************/
LONG __stdcall IOL_DS_ContentSet( LONG  Handle, DWORD Port, BYTE *pDSContentData, DWORD DSContentLength );

/**@} DS*/

/** \weakgroup TMOD Transparent Mode
*   These functions are used to set the Interface to transparent mode. In transparent mode, the device behaves
    like a UART with IO-Link PHY attached. The communication parameters can be defined, as well as the time values
    for the state machine of the transparent mode.

    \remark The transparent functions are an optional package and not available by default. By contract these functions
    can be enabled for a vendor specific version. If the functions are not allowed, the related functions will return with an error code.
    The same applies for the Full duplex mode which is only available for some vendor specific versions.
    The TMG versions have full support for the transparent mode.

    Not that the transmission parameters must be defined in during the switch to transparent mode and cannot be changed
    after the starting procedure. The parameters which are set during COM-Port-Connection have no influence on the
    transmission. For this reason, it's not possible to run with changing baud rates or transmission parameters.
    To set the device back to normal IO-Link mode, a pattern can be defined which will cause the device to switch back.
    

The following picture shows the timing diagram for the activation of the transparent mode:
    \image latex ToTM.png

 For all timing parameters the following rules apply:
 - the unit of the value is 100 microseconds
 - due to technical reasons, the value can run from 0 to 0xED0A (60682), which means that the max. time is about 6,07seconds.
 - the time accuracy is about 50 microseconds, but due to interrupt latencies it cannot be guaranteed that the real accuracy is below 100 microseconds.
   For this reason, avoid special very fast timing constraints in the sensors.
 - if the value is set to zero, the parameter will be ignored, and the next step begins immediately.
 

 During the switch to transparent mode the following phases occur:
 - <b>Phase 1: Power Down Phase 1 </b>
   some of the devices require that a firmware download can only be started during a specific time after reboot. To support this,
   the transparent mode is able to switch off the power supply of the device for a given time. The time will be set with the Parameter
   TPowerDown1. Choose this time to be sure that the device is completely powered down.
   If the device doesn't need a power down, set this value to zero.
 - <b>Phase 2: Power Up Phase 2 </b>
   after Powering up the device will need some time to restart properly. The USB master will wait the time TRecover1 until it will
   proceed with the next phase. If this waiting is not necessary (e.g. because there was no power down), set this value to zero.
 - <b>Phase 3: Wakeup </b>
   If the device needs a wakeup, the USB Master will initiate one. This wakeup is exactly the same as the IO-Link. The USB master
   will read the input value, will calculate the invers value and will initiate a pulse output with about 80 microseconds. If the device doesn't need
   such a wakeup, set the Parameter InitiateWakeup to zero. Otherwise the parameter must be non zero (the real value doesn't care.
 - <b>Phase 4: Wakeup reaction time </b>
   after initiation of the wakeup the device needs some time to switch to passive mode. This time can be defined with the parameter TWakeup.
 - <b>Phase 5: Starting Pattern transmission </b>
   after waiting for the reaction of the device a start pattern can be defined which is sent to the device at the end of the switching.
   This should be done here if the device needs such a pattern during a specific time after starting. If the device is not dependend on
   such a time, this start sequence can be omitted. In this case set the length to zero.
   After this phase the device is in transparent mode. During this mode, it will behave like a UART. All characters which will be received
   by the master will be send without change to the device. The character parameters for the transmissions are given by the parameters
   Baudrate and TransmissionFlags.
   The Baudrate parameter supports the following values:
         - 1200 baud
         - 2400 baud
         - 4800 baud
         - 9600 baud
         - 19600 baud
         - 38400 baud
         - 57600 baud
         - 115200 baud
         - 230400 baud
   The TransmissionFlags Parameter supports the usual transmission parameters and some additional flags for the startup and return.
   Please see below for additional info.
 - <b>Phase 6: minimum wait time before first transmission of the data stream </b>
   This time (TMinWait) defines how long the USB master will wait after transmission of the starting pattern until it will transmit the first byte
   of the data stream. 

 To switch the USB master back to normal mode, a return pattern will be send. After detecting the return pattern the USB Interface will
 start the "Fallback" procedure. Before the master will check for the return pattern, a quiet phase on the line (Send and receive) must be
 expired.
 The following image is showing the phases of the fallback procedure:
 \image latex FromTM.png

 During the switch back to normal mode the following phases occur:
 - <b>Phase 7: Timeout for activating the return pattern recognition </b>
   To avoid errornous returning to normal mode (e.g. if the pattern is contained in the some binary), a timeout (TWaitReturn) should occur after the
   last sent byte before the return pattern is been given to the IO-Link Master.
 - <b>Phase 8: Detection of return pattern </b>
   The USB interface will detect the return pattern. Dependend of the TransmissionFlags the pattern will be sent to the device or not.
 - <b>Phase 9: Power Down Phase 2 </b>
   Some device require a reboot at the end of a firmware download to activate the new firmware. The parameter "TPowerDown2" will define
   the time how long this will be. A zero value defines that there is no Power down. Non zero values are at a base of 100 microseconds.  The time can be 0x0-0xFFFF
 - <b>Phase 10: Restart to normal mode </b>
   the last step is a restart of the whole device. Note that the device is rebooting, so the virtual Com Port on the PC side will temporary not
   available. So the best way is to close the handle on the PC-Side after sending the return pattern, wait some time (dependend on the parameters), and
   then the USB master can be used as normal.
*@{*/

/** 
 *  @name Transmission Flags
 *  These Definitions are used for the parameter TransmissionFlags. They can be combined by logical OR of the values
*@{*/
#define TRANSFLAGS_7BIT             0 /**< only 7 bits will be transmitted. The Most significant bit of each byte will be ignored */
#define TRANSFLAGS_8BIT             1 /**< all 8 bits of each byte will be transmitted */
#define TRANSFLAGS_NOPARITY         0 /**< no parity transmission */
#define TRANSFLAGS_ODDPARITY        2 /**< odd parity setting */
#define TRANSFLAGS_EVENPARITY       6 /**< even parity setting */
#define TRANSFLAGS_MSBFIRST         0 /**< characters will be transmitted with MSB first */
#define TRANSFLAGS_LSBFIRST         8 /**< characters will be transmitted with LSB first */
#define TRANSFLAGS_SENDRETURN       0 /**< return pattern will be send to the device */
#define TRANSFLAGS_DONTSENDRETURN   0x10 /**< return pattern will not be send to the device */
#define TRANSFLAGS_ECHO             0x20 /**< echo all of the sent data bytes */
#define TRANSFLAGS_NOPOWERATEND     0x40 /**< if set the power will not go active after TPowerDown2, because for some devices
                                              there would be a double power impulse which is bad if the device writes firmware after first repowering */
#define TRANSFLAGS_FULLDUPLEX       0x80 /**< if set, the Master will send/receive in Full-Duplex using Pin 2 and 4 */
/**@}*/

/*! TTransparentParameters contain the Parameters for the Transparent Mode
*/
typedef struct TTransparentParametersStruct
{
  DWORD TPowerDown1;        /**< time which defines how long the power will be put down (unit is 100 microseconds) */
  DWORD TRecover1;          /**< time which the device needs for recovering after Power Up (unit is 100 microseconds) */
  DWORD InitiateWakeup;     /**< boolean. non zero if the Master shall initiate a wakeup pulse */
  DWORD TWakeup;            /**< wakeup time which the device needs to react on the wakeup */
  DWORD TransmissionFlags;  /**< contain the different flags for the UART transmission */
  DWORD Baudrate;           /**< baudrate of the transmission in bits per seconds. However, only the specified values are allowed */
  DWORD StartPatternLength; /**< length of the starting pattern 0..16 */
  DWORD TMinWait;           /**< minimum waiting time after start pattern */
  DWORD TWaitReturn;        /**< timeout to activate the pattern recognition */
  DWORD ReturnPatternLength;/**< Length of the returning pattern 0..32 */
  DWORD TPowerDown2;        /**< time which defines how long the power will be put down at the end of the transparent mode(unit is 100 microseconds) */
  BYTE StartPattern[16];    /**< starting pattern */
  BYTE ReturnPattern[32];   /**< returning pattern */
} TTransparentParameters;


/***************************************************************************/
/** 
*       \brief     activates the transparent mode
*
* This function activates the transparent mode for the USB master. It will return
* up on end of the starting sequence. No other function can be called after the call
* to this function. The function will close and destroy the handle which has been
* used for the communication. The application / or another program must connect to
* the virtual COM Port as usual.
*       \param     Handle    Handle to work on/with
*       \param     pTransparentParameters   Pointer to the Transparent Mode Parameters
*       \retval    RETURN_OK  Everything worked out allright
*       \retval    RETURN_UNKNOWN_HANDLE  Handle is not valid
*       \retval    RETURN_FUNCTION_NOT_-IMPLEMENTED function is not implemented by this device
*       \retval    RETURN_FUNCTION_CALLEDFROM-CALLBACK calling a DLL function from inside a callback is not allowed
*       \retval    RESULT_STATE_CONFLICT the command is not applicable in the actual state
*       \retval    RESULT_NOT_SUPPORTED the command is not supported on this device
****************************************************************************/
LONG __stdcall IOL_SetTransparentMode(LONG Handle, TTransparentParameters * pTransparentParameters);

/***************************************************************************/
/** 
*       \brief     activates the transparent mode
*
* This function activates the transparent mode for the USB master. It will return
* up on end of the starting sequence. No other function can be called after the call
* to this function. The function will close and destroy the handle which has been
* used for the communication. The application / or another program must connect to
* the virtual COM Port as usual. Note: this function is not available on all firmware versions of
* the USB Master V2. if not supported, an error message will be schown.
*       \param     Handle    Handle to work on/with
*       \param     Port      Port number of the used port
*       \param     pTransparentParameters   Pointer to the Transparent Mode Parameters
*       \retval    RETURN_OK  Everything worked out allright
*       \retval    RETURN_UNKNOWN_HANDLE  Handle is not valid
*       \retval    RETURN_FUNCTION_NOT_-IMPLEMENTED function is not implemented by this device
*       \retval    RETURN_FUNCTION_CALLEDFROM-CALLBACK calling a DLL function from inside a callback is not allowed
*       \retval    RESULT_STATE_CONFLICT the command is not applicable in the actual state
*       \retval    RESULT_NOT_SUPPORTED the command is not supported on this device
****************************************************************************/
LONG __stdcall IOL_SetTransparentModeExt(LONG Handle, DWORD Port, TTransparentParameters * pTransparentParameters);

/**@} TMOD*/


/** \weakgroup STAT Statistic Functions
*   These functions are used to get access to the statistic counter.
*@{*/

/*! TStatisticCounter contain the statistic counter */
typedef struct TStatisticCounterStruct
{
  DWORD CycleCounter; /**< counts the number of frame cycles */
  DWORD RetryCounter; /**< counts the number of retries */
  DWORD AbortCounter; /**< counts the number of connection aborts */
} TStatisticCounter;


/***************************************************************************/
/** 
*       \brief     reads out the statistic counter
*
* This function reads out the actual statistic counters from the USB master which are
* clculated during the whole time. they can be reset via the parameter bResetCounter
*       \param     Handle      Handle to work on/with
*       \param     Port        Port number of the used port
*       \param     pStatisticCounter pointer to the target memory where the statistic counter shall be written to
*       \param     bResetCounter boolean. if set to TRUE the counter will be reset on read.
*       \retval    RETURN_OK  Everything worked out allright
*       \retval    RETURN_UNKNOWN_HANDLE  Handle is not valid
*       \retval    RETURN_FUNCTION_NOT_-IMPLEMENTED function is not implemented by this device
*       \retval    RESULT_STATE_CONFLICT the command is not applicable in the actual state
*       \retval    RESULT_NOT_SUPPORTED the command is not supported on this device
****************************************************************************/
LONG __stdcall IOL_GetStatisticCounter(LONG Handle, DWORD Port, TStatisticCounter * pStatisticCounter, BOOL bResetCounter);

/**@} STAT*/

/** \weakgroup UIM USB interface management
*   These functions are used to manage the access to USB devices. There are function to list
*   all connected devices, and to connect or disconnect to a special device.
*@{*/

/*! TDLLCallbacks contains the list of pointer to different callbacks which are used to make the functions asynchronous which
*   have access to the sensor variables. These are IOL_ReadRequest, IOL_WriteRequest and the IOL_GetMode and IOL_GetModeEx functions,
*   because they are reading Device parameters.
*   The callbacks must be given to the DLL with the function IOL_SetCallbacks and are valid per Master Interface. After each IOL_Create the
*   list of callbacks is empty, so after connection establishing the list must be set.
*   The List entries may be empty (NULL), which means that the callback will not be called. If the list entries are not empty, the Request function
*   will return RETURN_FUNCTION_DELAYED to show that the result will be delayed.
*   There are some rules for the usage of the callbacks:
* - The data structure which are given with the request must be valid until the callback is done.
* - the callback will block the reception of the USB master interface, so the code in the callback must be very short
* - no DLL function may be called from the callbacks.
* - The list of callbacks may be changed anytime if there is no function pending.
*   
* The following callbacks are supported:
*
* - IOL_CallbackReadConfirmation is the callback which is called if an IOL_ReadRequest has been called before. The result of the service
*   is contained in the data structure which has been given to the service on Request
*         - Handle Handle to work on/with
*         - Port Port number of the used port
*         - pParameter Pointer to the structure containing the result and data of the service
* - IOL_CallbackWriteConfirmation is the callback which is called if an IOL_WriteRequest has been called before. The result of the service
*   is contained in the data structure which has been given to the service on Request
*         - Handle Handle to work on/with
*         - Port Port number of the used port
*         - pParameter Pointer to the structure containing the result of the service
* - IOL_CallbackEventInd is called if an Event has been received. The memory of the data structure of the event will be part of the DLL, so
*   after returning from the callback the data will be lost. The event will not be stored in the event list, the callback has to implement it's
*   own event list if this is necessary.
*         - Handle Handle to work on/with
*         - Port Port number of the used port
*         - pEvent Pointer to the data structure containing the new event
*/

typedef struct TDLLCallbacksStruct{
  void  (__stdcall *IOL_CallbackReadConfirmation)(LONG Handle, DWORD Port, TParameter * pParameter); /**< callback which is called if a Parameter Read has been terminated */
  void  (__stdcall *IOL_CallbackWriteConfirmation)(LONG Handle, DWORD Port, TParameter * pParameter); /**< callback which is called if a Parameter Write has been terminated */
  void  (__stdcall *IOL_CallbackEventInd)(LONG Handle, DWORD Port, TEvent * pEvent); /**< callback which is called if an Event has been received */
} TDLLCallbacks;

/***************************************************************************/
/** 
*       \brief     set the callbacks for a connection
*
* This function sets the callbacks for a given connection handle.
*       \param     Handle    Handle to work on/with
*       \param     pDLLCallbacks   Pointer to the list of callback functions
*       \retval    RETURN_OK  Everything worked out allright
*       \retval    RETURN_UNKNOWN_HANDLE  Handle is not valid
*       \retval    RETURN_FUNCTION_CALLEDFROM-CALLBACK calling a DLL function from inside a callback is not allowed
****************************************************************************/
LONG __stdcall IOL_SetCallbacks(LONG Handle, TDLLCallbacks * pDLLCallbacks);



/*! THardwareInfo contains actual hardware information about the connected master */
typedef struct THardwareInfoStruct
{
  DWORD InfoVersion; /**< version of the structure. 0: only PowerSource and PowerLevel */
  DWORD PowerSource; /**< actual source of the power. 0 = internal power, all other values = external Power */
  DWORD PowerLevel;  /**< actual Power level in units of 100mV */
}THardwareInfo;


/***************************************************************************/
/** 
*       \brief     gets actual hardware information
*
* This function retreives some hardware information of the actual connected master
*       \param     Handle    Handle to work on/with
*       \param     pInfo     Pointer to the resulting container for the information
*       \retval    RETURN_UNKNOWN_HANDLE  Handle is not valid
*       \retval    RETURN_INTERNAL_ERROR  Error that should not occur.
*       \retval    RETURN_OK              Everything worked out allright
*       \retval    RETURN_FUNCTION_NOT_-IMPLEMENTED  Everything worked out allright
*
****************************************************************************/
LONG __stdcall IOL_GetHWInfo(LONG Handle,THardwareInfo * pInfo );


/**@} UIM*/

#ifdef _cplusplus
}
#endif
#ifdef __cplusplus
}
#endif

#pragma pack(pop)
#endif /*_IOLUSBIF20H_*/
/**@}*/

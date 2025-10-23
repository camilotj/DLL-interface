Imports TMGIOLUSBIF20_64_DOTNET
Imports TMGIOLUSBIF20_64_DOTNET.clsTMGIOLUSBIF20

Public Class frmMain

  Dim IF20 As New clsTMGIOLUSBIF20
  Dim IOLM As clsUSBIOLMaster = Nothing
  Dim Timer1Count As Integer = 0
  Dim ActivePort As Integer = 0
  Dim updatestatus As New clsFwUpdateStatus

  Private Sub frmMain_Load(ByVal sender As System.Object, ByVal e As System.EventArgs) Handles MyBase.Load

    Dim result As eError = eError.OK
    tbMessages.Text = ""

    'DLL Info abrufen
    Dim DLLInfo As New clsDllInfo

    WriteInfo("Info about the IOLUSBIF20.DLL:")
    WriteInfo("    Revision of C DLL:       " & DLLInfo.C_DLL_Version & "_" & DLLInfo.C_DLL_Build)
    WriteInfo("    Revision of .NET DLL:    " & DLLInfo.NET_DLL_Version)
    WriteInfo()

    'search for USB Masters 
    Dim IOLMList() As clsUSBIOLMaster = IF20.GetUSBMaster()
    If IOLMList.Length = 0 Then result = eError.DEVICE_NOT_AVAILABLE : GoTo RError
    'you could implement a combobox hier to choose the master. In the sample the first is taken.
    IOLM = IOLMList(0)
    If IOLM.IOL_Create() = eError.OK Then
      'Read Master Info
      WriteInfo("IO-Link USB V2 Master")
      WriteInfo("    Firmware Revision:      " & IOLM.RevisionFirmware)
      WriteInfo("    IO-Link Stack Revision: " & IOLM.RevisionIOLStack)
    End If
    Return
RError:
    If result = eError.DEVICE_NOT_AVAILABLE Then
      MsgBox("Error Message: " & result.ToString & vbCrLf &
             "Maybe no driver is installed" & vbCrLf &
             "Please install the driver in menu <Options/Install Drivers>" & vbCrLf &
             "and start the program again", MsgBoxStyle.Critical)
    Else
      MsgBox("Error Message: " & result.ToString, MsgBoxStyle.Critical)
      End
    End If
  End Sub

  Private Sub frmMain_FormClosed(ByVal sender As Object, ByVal e As System.Windows.Forms.FormClosedEventArgs) Handles MyBase.FormClosed
    If Not IsNothing(IOLM) Then
      IOLM.Port(0).Configuration.Deactivate()
      IOLM.Port(1).Configuration.Deactivate()
      IOLM.IOL_Destroy()
    End If
  End Sub

  Private Sub cmdPort1_Click(ByVal sender As System.Object, ByVal e As System.EventArgs) Handles cmdPort1.Click
    GroupBox1.Text = "IO-Link Port 1 - Pin 4"
    tbMessages.Text = ""
    ActivatePort(0)
  End Sub

  Private Sub cmdPort1_Deactivate_Click(ByVal sender As System.Object, ByVal e As System.EventArgs) Handles cmdPort1_Deactivate.Click
    IOLM.Port(0).Configuration.Deactivate()
    tbMessages.Text = ""
  End Sub

  Private Sub cmdPort1Validate_Click(ByVal sender As System.Object, ByVal e As System.EventArgs) Handles cmdPort1Validate.Click
    IOLM.Port(0).Configuration.ConfiguredMode = eConfiguredMode.IOLINK_OPERATE
    IOLM.Port(0).Configuration.InspectionLevel = eInspectionLevel.COMPATIBLE
    IOLM.Port(0).Configuration.VendorID = 335
    IOLM.Port(0).Configuration.DeviceID = 16
    IOLM.Port(0).Configuration.DSConfigure = eDSConfigure.ENABLED
    Dim result As eError = IOLM.Port(0).Configuration.IOL_SetPortConfig()
    If result = eError.OK Then

      'Wait some time for master detecting the device
      System.Threading.Thread.Sleep(1000)

      GetDeviceInfo(IOLM, ActivePort)

      Timer1.Enabled = True
    Else
      MsgBox("Error Message: " & result.ToString, MsgBoxStyle.Critical)
    End If

  End Sub

  Private Sub cmdPort2_Click(ByVal sender As System.Object, ByVal e As System.EventArgs) Handles cmdPort2.Click
    GroupBox1.Text = "IO-Link Port 2 - Pin 2"
    tbMessages.Text = ""
    ActivatePort(1)
  End Sub

  Private Sub cmdPort2_Deactivate_Click(ByVal sender As System.Object, ByVal e As System.EventArgs) Handles cmdPort2_Deactivate.Click
    IOLM.Port(1).Configuration.Deactivate()
    tbMessages.Text = ""
  End Sub

  Private Sub ActivatePort(ByVal pActivePort As Integer)
    ActivePort = pActivePort
    IOLM.Port(ActivePort).Configuration.Clear()
    IOLM.Port(ActivePort).Configuration.ConfiguredMode = eConfiguredMode.IOLINK_OPERATE
    Dim result As eError = IOLM.Port(ActivePort).Configuration.IOL_SetPortConfig

    If result <> eError.OK Then GoTo ActivateError

    'Wait some time for master detecting the device
    System.Threading.Thread.Sleep(1000)

    GetDeviceInfo(IOLM, ActivePort)

    Timer1.Enabled = True

    Return
ActivateError:
    MsgBox("Error Message: " & result.ToString, MsgBoxStyle.Critical)
  End Sub

  Private Sub GetDeviceInfo(ByRef Master As clsTMGIOLUSBIF20.clsUSBIOLMaster, ByVal Port As Integer)

    'Informationen vom Device lesen mit Directparameterpage
    IOLM.Port(Port).Mode.IOL_GetMode(False)
    With IOLM.Port(Port).Mode
      If .DeviceState.DeviceState <> eDeviceState.LOST Then
        Write("IO-Link Device connected:")
        Write("   VendorId:                  " & .DirectParameterPage1.VendorId)
        Write("   DeviceId:                  " & .DirectParameterPage1.DeviceId)
        Write("   IO-Link Revision:          " & .DirectParameterPage1.RevisionId.ToString)
        Write("   ProcessData Input Length (bit):  " & .DirectParameterPage1.PDInLength)
        Write("   ProcessData Output Length (bit): " & .DirectParameterPage1.PDOutLength)
        Write("   SIO mode supported:        " & .DirectParameterPage1.SIOModeSupported)
      Else
        Write("No device connected")
      End If
      Write()
    End With
  End Sub

  Private Sub Timer1_Tick(ByVal sender As System.Object, ByVal e As System.EventArgs) Handles Timer1.Tick
    Timer1.Enabled = False
    Dim result As eError = IOLM.IOL_ReadAllInputs()
    If result = eError.INTERNAL_ERROR Then
      MsgBox("Connection lost to the connected USB IO-Link Master", MsgBoxStyle.Critical)
      End
    End If
    tbPDIn.Text = IF20.Utils.GetHexStringFromBytes(IOLM.Port(ActivePort).Inputs.Data)
    If IOLM.Port(ActivePort).DeviceState.EventAvailable Then
      IOLM.LastEvent.IOL_ReadEvent(IOLM.Port(ActivePort).DeviceState)
      Write("Event: " & IOLM.LastEvent.Instance.ToString & " " &
                        IOLM.LastEvent.Type.ToString & " " &
                        IOLM.LastEvent.Mode.ToString & " " &
                        IOLM.LastEvent.EventCode.ToString)
    End If
    result = IOLM.Port(ActivePort).IOL_ReadOutputs()
    tbPDOutRead.Text = IF20.Utils.GetHexStringFromBytes(IOLM.Port(ActivePort).Outputs.Data, IOLM.Port(ActivePort).Outputs.Length)
    Dim info As New TMGIOLUSBIF20_64_DOTNET.clsTMGIOLUSBIF20.clsUSBIOLMaster.CHardwareInfo
    result = IOLM.IOL_GetHWInfo(info)
    If result = eError.OK Then
      Me.CheckBox1.Checked = info.isExternalPower
      Me.TextBox1.Text = info.PowerLevel.ToString
    End If
    Timer1.Enabled = True
  End Sub

  Private Sub tbPDOutWrite_KeyPress(ByVal sender As Object, ByVal e As System.Windows.Forms.KeyPressEventArgs) Handles tbPDOutWrite.KeyPress
    If e.KeyChar = Chr(13) Then
      Dim Outputs() As Byte = IF20.Utils.GetBytesFromTextHex(tbPDOutWrite.Text)
      For i As Integer = 0 To Outputs.Length - 1
        IOLM.Port(ActivePort).Outputs.Data(i) = Outputs(i)
      Next
      Dim result As eError = IOLM.Port(ActivePort).IOL_WriteOutputs()
      tbPDOutWrite.Text = IF20.Utils.GetHexStringFromBytes(Outputs)
    End If
  End Sub

  Private Sub cmdRead_Click(ByVal sender As System.Object, ByVal e As System.EventArgs) Handles cmdRead.Click
    Dim data() As Byte = Nothing
    Dim ErrorCode As Integer
    Dim result As eError = IOLM.Port(ActivePort).IOL_ReadReq(CInt(tbIndexRead.Text), CInt(tbSubindexRead.Text), data, ErrorCode)
    If result = 0 Then
      tbDataRead.Text = IF20.Utils.GetHexStringFromBytes(data)
    Else
      tbDataRead.Text = "error:" & Hex(ErrorCode)
    End If
    tbReadError.Text = ErrorCode.ToString
  End Sub

  Private Sub cmdWrite_Click(ByVal sender As System.Object, ByVal e As System.EventArgs) Handles cmdWrite.Click
    Dim data() As Byte = IF20.Utils.GetBytesFromTextHex(tbDataWrite.Text)
    Dim ErrorCode As Integer
    Dim result As eError = IOLM.Port(ActivePort).IOL_WriteReq(CInt(tbIndexWrite.Text), CInt(tbSubindexWrite.Text), data, ErrorCode)
    tbDataRead.Text = ""
    tbReadError.Text = ""
    tbWriteError.Text = ErrorCode.ToString
  End Sub

  Private Sub WriteInfo(ByVal text As String)
    tbInfo.AppendText(text & vbCrLf)
    tbInfo.ScrollToCaret()
  End Sub
  Private Sub WriteInfo()
    tbInfo.AppendText(vbCrLf)
    tbInfo.ScrollToCaret()
  End Sub
  Private Sub Write(ByVal text As String)
    tbMessages.AppendText(text & vbCrLf)
    tbMessages.ScrollToCaret()
  End Sub
  Private Sub Write()
    tbMessages.AppendText(vbCrLf)
    tbMessages.ScrollToCaret()
  End Sub

  Public Enum eOSType
    Is32Bit = 0
    Is64Bit = 1
    unknown = 2
  End Enum
  Private Function GetOSType() As eOSType
    Dim OSType As String
    OSType = Microsoft.Win32.Registry.LocalMachine.OpenSubKey("SYSTEM\CurrentControlSet\Control\Session Manager\Environment", False).GetValue("PROCESSOR_ARCHITECTURE").ToString
    Select Case UCase(OSType)
      Case "AMD64", "X64", "I486"
        Return eOSType.Is64Bit
      Case "X86", "I386"
        Return eOSType.Is32Bit
      Case Else
        MsgBox("Driver couldn't been installed, because platform is not clear" & vbCrLf &
               "Found: " & OSType & vbCrLf &
               "Please install manually. The drivers are included in application directory", MsgBoxStyle.Critical)
        Return eOSType.unknown
    End Select
  End Function

  Private Sub TSM_About_Click(ByVal sender As System.Object, ByVal e As System.EventArgs) Handles TSM_About.Click
    MsgBox("Copyright (c) 2013-2023 TMG Technologie und Engineering GmbH" & vbCrLf &
           "Sample Application for IOLUSBIF20_DOTNET.DLL" & vbCrLf &
           "www.tmgte.de", MsgBoxStyle.Information)
  End Sub

  Private Function GetOpenFilename() As String
    Dim fd As OpenFileDialog = New OpenFileDialog()
    fd.Filter = "firmware update files (*.xml)|*.xml|All files (*.*)|*.*"
    fd.FilterIndex = 2
    fd.RestoreDirectory = True
    If fd.ShowDialog() = Windows.Forms.DialogResult.OK Then
      Return fd.FileName
    Else
      Return Nothing
    End If
  End Function
  Private Sub CmdFirmwareUpdate_Click(ByVal sender As System.Object, ByVal e As System.EventArgs) Handles CmdFirmwareUpdate.Click
    'Dim firmwareFile As String = FileSystem.
    Dim firmwareFile As String = GetOpenFilename()
    If IsNothing(firmwareFile) OrElse firmwareFile = "" Then Return
    Dim updateinfo As New clsFwUpdateInfo
    Dim retval As eFwUpdateReturnValue = IOLM.Port(0).FirmwareUpdate.StartByMetafile(firmwareFile, updateinfo, updatestatus)
    If updatestatus.nextState <> eFwUpdateState.FWUPDATE_STATE_IDLE Then
      'Update wurde gestartet.
      tbMessages.Text = ""
      'update infos anzeigen
      tbMessages.AppendText("Starting Firmware Update:" & vbCrLf)
      tbMessages.AppendText("Meta file name=" & firmwareFile & vbCrLf)
      tbMessages.AppendText("Firmware Length=" & updateinfo.fwLength & vbCrLf)
      tbMessages.AppendText("used hardware key=:" & updateinfo.hwKey & vbCrLf)
      tbMessages.AppendText("vendor ID=" & updateinfo.vendorID & vbCrLf)
      tbMessages.AppendText("password required:" & updateinfo.fwPasswordRequired.ToString & vbCrLf)
      'update status anzeigen
      printUpdateStatus(retval, updatestatus)
      'timer starten
      Timer1.Enabled = False ' wenn anderer Timer läuft, diesen stoppen
      TimerUpdate.Enabled = True ' timer starten
    Else
      'update status und fehler anzeigen
      'update status anzeigen
      tbMessages.Text = ""
      tbMessages.AppendText("Starting Firmware Update:" & vbCrLf)
      tbMessages.AppendText("Meta file name=" & firmwareFile & vbCrLf)
      printUpdateStatus(retval, updatestatus)
    End If

  End Sub

  Private Sub printUpdateStatus(ByVal retval As eFwUpdateReturnValue, ByRef updatestatus As clsFwUpdateStatus)
    Dim text As String = ""
    If (retval <> eFwUpdateReturnValue.FWUPDATE_RET_OK) Or (updatestatus.executedState <> updatestatus.nextState) Then
      text = "FWUP: From=" & updatestatus.executedState.ToString & " Next=" & updatestatus.nextState.ToString & " retval=" & retval.ToString & " dllretval=" & updatestatus.dllReturnValue.ToString & vbCrLf
    End If
    If (updatestatus.BlobStatus.executedState <> eBlobState.BLOB_STATE_IDLE) Or (updatestatus.BlobStatus.nextState <> eBlobState.BLOB_STATE_IDLE) Then
      text &= "BLOB: From=" & updatestatus.BlobStatus.executedState.ToString & " Next=" & updatestatus.BlobStatus.nextState & " blobretval=" & updatestatus.blobReturnValue.ToString & " PercenComplete=" & updatestatus.BlobStatus.PercentComplete & vbCrLf
    End If
    If (text <> "") Then
      tbMessages.AppendText(text & vbCrLf)
      tbMessages.ScrollToCaret()
    End If
  End Sub

  Private Function AnalyzeData2(Data() As Byte) As clsTMGIOLUSBIF20.clsUSBIOLMaster.clsDataLogging.clsLoggingEntry()
    If Data IsNot Nothing Then
      Dim result As clsTMGIOLUSBIF20.clsUSBIOLMaster.clsDataLogging.clsLoggingEntry()
      ReDim result(-1)
      Dim pos As Integer = 0
      While (pos < Data.Length)
        ReDim Preserve result(result.Length)
        result(result.Length - 1) = New clsTMGIOLUSBIF20.clsUSBIOLMaster.clsDataLogging.clsLoggingEntry
        With result(result.Length - 1)
          .Port = Data(pos) : pos += 1
          ReDim .InData(Data(pos) - 2) : pos += 1
          .InputsValid = (Data(pos + Data(pos) - 2) = 0)
          For i As Integer = 0 To .InData.Length - 1
            .InData(i) = Data(pos) : pos += 1
          Next
          pos += 1
          ReDim .OutData(Data(pos) - 1) : pos += 1
          For i As Integer = 0 To .OutData.Length - 1
            .OutData(i) = Data(pos) : pos += 1
          Next
        End With
      End While
      Return result
    Else
      Return Nothing
    End If
  End Function

  Private Sub TimerUpdate_Tick(ByVal sender As System.Object, ByVal e As System.EventArgs) Handles TimerUpdate.Tick
  End Sub

  Private Sub CmdDataLogging_Click(sender As Object, e As EventArgs) Handles CmdDataLogging.Click
    Dim data() As Byte = Nothing
    If TimerUpdate.Enabled = True Then
      TimerUpdate.Enabled = False
      Dim result As eError = IOLM.DataLogging.IOL_StopDataLogging()
      If result = eError.OK Then
        tbMessages.AppendText("Logging has been stopped successfully" & vbCrLf)
        tbMessages.ScrollToCaret()
      Else
        tbMessages.AppendText("Error:" & result.ToString & vbCrLf)
        tbMessages.ScrollToCaret()
      End If

    Else
      Dim SampleTimeUs As UInt32 = 100000
      Dim result As eError = IOLM.DataLogging.IOL_StartDataLoggingInBuffer(CUInt(ActivePort), SampleTimeUs)
      If result = eError.OK Then
        Timer1.Enabled = False
        TimerUpdate.Interval = 500
        TimerUpdate.Enabled = True
        tbMessages.AppendText("Logging has been started with a cycle time of " & SampleTimeUs.ToString & " µs" & vbCrLf)
        tbMessages.ScrollToCaret()
      Else
        tbMessages.AppendText("Error:" & result.ToString & vbCrLf)
        tbMessages.ScrollToCaret()
      End If
    End If
  End Sub

  Private Sub TimerLogging_Tick(sender As Object, e As EventArgs) Handles TimerLogging.Tick
    TimerLogging.Enabled = False
    Dim data() As Byte = New Byte() {}
    Dim status As UInt32 = 0
    Dim result As eError = IOLM.DataLogging.IOL_ReadLoggingBuffer(data, status)
    If result = eError.OK Then
      tbMessages.AppendText("Logging Data Status=" & status.ToString & "  Length=" & data.Length & vbCrLf)
      Dim entries As clsTMGIOLUSBIF20.clsUSBIOLMaster.clsDataLogging.clsLoggingEntry()
      entries = IOLM.DataLogging.IOL_AnalyzeLoggingBuffer(data)
      'entries = AnalyzeData2(data)
      Dim s As String = "LogData: entries=" & entries.Length & vbCrLf
      For i As Integer = 0 To entries.Length - 1
        s = s & "Port=" & entries(i).Port.ToString & "  InValid=" & entries(i).InputsValid.ToString & " InLength=" & entries(i).InData.Length & " OutLength=" & entries(i).OutData.Length & vbCrLf
      Next
      tbMessages.AppendText(s)
      tbMessages.ScrollToCaret()
    Else
      tbMessages.AppendText("Error:" & result.ToString & vbCrLf)
      tbMessages.ScrollToCaret()
    End If

    TimerLogging.Enabled = False
  End Sub
End Class

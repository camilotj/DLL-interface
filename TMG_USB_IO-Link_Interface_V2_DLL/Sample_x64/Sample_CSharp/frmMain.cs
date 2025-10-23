using System;
using System.Diagnostics;
using System.Windows.Forms;
using Microsoft.VisualBasic;
using TMGIOLUSBIF20_64_DOTNET;
using System.IO;

namespace USBIOL_DLL_Sample_CSharp
{
  public partial class frmMain : Form
  {
    public frmMain()
    {
      InitializeComponent();
    }

    clsTMGIOLUSBIF20 IF20 = new clsTMGIOLUSBIF20();
    clsTMGIOLUSBIF20.clsUSBIOLMaster IOLM = null;
    int ActivePort = 0;
    clsTMGIOLUSBIF20.clsFwUpdateStatus updatestatus = new clsTMGIOLUSBIF20.clsFwUpdateStatus();

    private void frmMain_Load(object sender, EventArgs e)
    {
      clsTMGIOLUSBIF20.eError result = clsTMGIOLUSBIF20.eError.OK;
      tbMessages.Text = "";

      //Read DLL Info
      clsTMGIOLUSBIF20.clsDllInfo DLLInfo = new clsTMGIOLUSBIF20.clsDllInfo();

      WriteInfo("Info about IOLUSBIF20.DLL:");
      WriteInfo("    Revision of C DLL:       " + DLLInfo.C_DLL_Version + "_" + DLLInfo.C_DLL_Build);
      WriteInfo("    Revision of .NET DLL:    " + DLLInfo.NET_DLL_Version);
      WriteInfo();

      //search on USB Masters
      clsTMGIOLUSBIF20.clsUSBIOLMaster[] IOLMList = IF20.GetUSBMaster();
      if (IOLMList.Length == 0)
      {
        result = clsTMGIOLUSBIF20.eError.DEVICE_NOT_AVAILABLE;
        goto RError;
      }
      //you could implement a combobox hier to choose the master. In the sample the first is taken.
      IOLM = IOLMList[0];
      if (IOLM.IOL_Create() == clsTMGIOLUSBIF20.eError.OK)
      {
        //Read Master Info
        WriteInfo("IO-Link USB V2 Master");
        WriteInfo("    Firmware Revision:      " + IOLM.RevisionFirmware);
        WriteInfo("    IO-Link Stack Revision: " + IOLM.RevisionIOLStack);
      }
      return;
RError:
      if (result == clsTMGIOLUSBIF20.eError.DEVICE_NOT_AVAILABLE)
      {
        MessageBox.Show("Error Message: " + result.ToString() + "\r\n" +
           "Maybe no driver is installed" + "\r\n" +
           "Please install the driver in menu <Options/Install Drivers>" + "\r\n" +
           "and start the program again", "Critical Warning");
      }
      else
      {
        MessageBox.Show("Error Message: " + result.ToString(), "Critical Warning");
        Environment.Exit(0);
      }
    }

    private void WriteInfo(string text)
    {
      tbInfo.AppendText(text + "\r\n");
      tbInfo.ScrollToCaret();
    }

    private void WriteInfo()
    {
      tbInfo.AppendText("\r\n");
      tbInfo.ScrollToCaret();
    }

    private void Write(string text)
    {
      tbMessages.AppendText(text + "\r\n");
      tbMessages.ScrollToCaret();
    }

    private void Write()
    {
      tbMessages.AppendText("\r\n");
      tbMessages.ScrollToCaret();
    }

    private void timer1_Tick(object sender, EventArgs e)
    {
      timer1.Enabled = false;
      clsTMGIOLUSBIF20.eError result = IOLM.Port[ActivePort].IOL_ReadInputs();
      if (result == clsTMGIOLUSBIF20.eError.INTERNAL_ERROR)
      {  
        MessageBox.Show("Connection lost to the connected USB IO-Link Master", "Critical Warning");
        Environment.Exit(0);
      }
      tbPDIn.Text = IF20.Utils.GetHexStringFromBytes(ref IOLM.Port[ActivePort].Inputs.Data);
      if (IOLM.Port[ActivePort].DeviceState.EventAvailable)
      {
        IOLM.LastEvent.IOL_ReadEvent(ref IOLM.Port[ActivePort].DeviceState);
        Write("Event: " + IOLM.LastEvent.Instance + " " + 
                      IOLM.LastEvent.Type + " " + 
                      IOLM.LastEvent.Mode + " " +
                      IOLM.LastEvent.EventCode);
      }
      result = IOLM.Port[ActivePort].IOL_ReadOutputs();
      tbPDOutRead.Text = IF20.Utils.GetHexStringFromBytes(ref IOLM.Port[ActivePort].Outputs.Data);
      timer1.Enabled = true;
    }

    private void cmdRead_Click_1(object sender, EventArgs e)
    {
      byte[] data = null;
      int ErrorCode = 0;
      IOLM.Port[ActivePort].IOL_ReadReq(Convert.ToInt32(tbIndexRead.Text), Convert.ToInt32(tbSubindexRead.Text), ref data, ref ErrorCode);
      if (ErrorCode == 0)
      {
        tbDataRead.Text = IF20.Utils.GetHexStringFromBytes(ref data);
      }
      else
      {
        tbDataRead.Text = "";
      }
      tbReadError.Text = ErrorCode.ToString();
    }

    private void cmdWrite_Click(object sender, EventArgs e)
    {
      byte[] data = IF20.Utils.GetBytesFromTextHex(tbDataWrite.Text);
      int ErrorCode = 0;
      clsTMGIOLUSBIF20.eError result = IOLM.Port[ActivePort].IOL_WriteReq(Convert.ToInt32(tbIndexWrite.Text), Convert.ToInt32(tbSubindexWrite.Text), ref data, ref ErrorCode);
      tbDataRead.Text = "";
      tbReadError.Text = "";
      tbWriteError.Text = ErrorCode.ToString();
    }

    private void tbPDOutWrite_KeyPress(object sender, KeyPressEventArgs e)
    {
      if (e.KeyChar == '\r')
      {
        byte[] Outputs = IF20.Utils.GetBytesFromTextHex(tbPDOutWrite.Text);
        Outputs.CopyTo(IOLM.Port[ActivePort].Outputs.Data, Outputs.Length);
        clsTMGIOLUSBIF20.eError result = IOLM.Port[ActivePort].IOL_WriteOutputs();
        tbPDOutWrite.Text = IF20.Utils.GetHexStringFromBytes(ref Outputs);
      }
    }

    private void cmdPort1_Click(object sender, EventArgs e)
    {
      GroupBox1.Text = "IO-Link Port 1 - Pin 4";
      tbMessages.Text = "";
      ActivatePort(0);
    }

    private void cmdPort1_Deactivate_Click(object sender, EventArgs e)
    {
      IOLM.Port[0].Configuration.Deactivate();
      tbMessages.Text = "";
    }

    private void cmdPort1Validate_Click(object sender, EventArgs e)
    {
      IOLM.Port[0].Configuration.ConfiguredMode = clsTMGIOLUSBIF20.eConfiguredMode.IOLINK_OPERATE;
      IOLM.Port[0].Configuration.InspectionLevel = clsTMGIOLUSBIF20.eInspectionLevel.COMPATIBLE;
      IOLM.Port[0].Configuration.VendorID = 815;
      IOLM.Port[0].Configuration.DeviceID = 4711;
      clsTMGIOLUSBIF20.eError result = IOLM.Port[0].Configuration.IOL_SetPortConfig();
      if (result == clsTMGIOLUSBIF20.eError.OK)
      {
        //Wait some time for master detecting the device

        System.Threading.Thread.Sleep(1000);

        GetDeviceInfo(ref IOLM, ActivePort);

        timer1.Enabled = true;
      }
      else
      {
        MessageBox.Show("Error Message: " + result.ToString(), "Critical Warning");
      }
    }

    private void cmdPort2_Click(object sender, EventArgs e)
    {
      GroupBox1.Text = "IO-Link Port 2 - Pin 2";
      tbMessages.Text = "";
      ActivatePort(1);
    }

    private void cmdPort2_Deactivate_Click(object sender, EventArgs e)
    {
      IOLM.Port[1].Configuration.Deactivate();
      tbMessages.Text = "";
    }

    private void cmdRead_Click(object sender, EventArgs e)
    {
      byte[] data = null;
      int ErrorCode = 0;
      IOLM.Port[ActivePort].IOL_ReadReq(Convert.ToInt32(tbIndexRead.Text), Convert.ToInt32(tbSubindexRead.Text), ref data, ref ErrorCode);
      if (ErrorCode == 0)
        tbDataRead.Text = IF20.Utils.GetHexStringFromBytes(ref data);
      else
        tbDataRead.Text = "";
  
      tbReadError.Text = ErrorCode.ToString();
    }

    private void cmdWrite_Click_1(object sender, EventArgs e)
    {
      byte[] data = IF20.Utils.GetBytesFromTextHex(tbDataWrite.Text);
      int ErrorCode = 0;
      clsTMGIOLUSBIF20.eError result = IOLM.Port[ActivePort].IOL_WriteReq(Convert.ToInt32(tbIndexWrite.Text), Convert.ToInt32(tbSubindexWrite.Text), ref data, ref ErrorCode);
      tbDataRead.Text = "";
      tbReadError.Text = "";
      tbWriteError.Text = ErrorCode.ToString();
    }

    private void ActivatePort(int pActivePort)
    {
      ActivePort = pActivePort;
      IOLM.Port[ActivePort].Configuration.Clear();
      IOLM.Port[ActivePort].Configuration.ConfiguredMode = clsTMGIOLUSBIF20.eConfiguredMode.IOLINK_OPERATE;
      clsTMGIOLUSBIF20.eError result = IOLM.Port[ActivePort].Configuration.IOL_SetPortConfig();

      if (result != clsTMGIOLUSBIF20.eError.OK)
        goto ActivateError;

      //Wait some time for master detecting the device

      System.Threading.Thread.Sleep(1000);

      GetDeviceInfo(ref IOLM, ActivePort);

      timer1.Enabled = true;

      return;
ActivateError:
      MessageBox.Show("Error Message: " + result, "Critical Warning");
    }

    private void GetDeviceInfo(ref clsTMGIOLUSBIF20.clsUSBIOLMaster Master, int Port)
    {
      //Read Info from Device with Directparameterpage
      IOLM.Port[Port].Mode.IOL_GetMode(false);


      if (IOLM.Port[Port].DeviceState.DeviceState != clsTMGIOLUSBIF20.eDeviceState.LOST)
      {
        Write("IO-Link Device connected:");
        Write("   VendorId:                  " + IOLM.Port[Port].Mode.DirectParameterPage1.VendorId());
        Write("   DeviceId:                  " + IOLM.Port[Port].Mode.DirectParameterPage1.DeviceId());
        Write("   IO-Link Revision:          " + IOLM.Port[Port].Mode.DirectParameterPage1.RevisionId());
        Write("   ProcessData Input Length:  " + IOLM.Port[Port].Mode.DirectParameterPage1.PDInLength());
        Write("   ProcessData Output Length: " + IOLM.Port[Port].Mode.DirectParameterPage1.PDOutLength());
        Write("   SIO mode supported:        " + IOLM.Port[Port].Mode.DirectParameterPage1.SIOModeSupported());
      }
      else
      {
        Write("No Device Connected");
      }
      Write();
    }
    
    private void TSM_About_Click(object sender, EventArgs e)
    {
      MessageBox.Show("Copyright (c) 2014 TMG Technologie und Engineering GmbH" + "\r\n" +
         "Sample Application for IOLUSBIF20_DOTNET.DLL" + "\r\n" +
         "www.tmgte.de", "information");
    }

    private void frmMain_Closing(object sender, FormClosingEventArgs e)
    {
      if (IOLM != null)
      {
        IOLM.Port[0].Configuration.Deactivate();
        IOLM.Port[1].Configuration.Deactivate();
        IOLM.IOL_Destroy();
      }
    }
    private string GetOpenFilename()
    {
      OpenFileDialog fd  = new OpenFileDialog();
      fd.Filter = "firmware update files (*.xml)|*.xml|All files (*.*)|*.*";
      fd.FilterIndex = 2;
      fd.RestoreDirectory = true;
      if (fd.ShowDialog() == DialogResult.OK)
        return fd.FileName;
      else
        return null;
    }

    private void cmdUpdate_Click(object sender, EventArgs e)
    {
      if (IOLM != null)
      {
        string firmwareFile = GetOpenFilename();
        if (firmwareFile != "")
        {
          clsTMGIOLUSBIF20.clsFwUpdateInfo updateinfo = new clsTMGIOLUSBIF20.clsFwUpdateInfo();
          clsTMGIOLUSBIF20.eFwUpdateReturnValue retval = IOLM.Port[0].FirmwareUpdate.StartByMetafile(firmwareFile, ref updateinfo, ref updatestatus);
          if (updatestatus.nextState != clsTMGIOLUSBIF20.eFwUpdateState.FWUPDATE_STATE_IDLE)
          {
            //Update wurde gestartet.
            tbMessages.Text = "";
            //update infos anzeigen
            Write("Starting Firmware Update:");
            Write("Meta file name=" + firmwareFile);
            Write("Firmware Length=" + updateinfo.fwLength);
            Write("used hardware key=:" + updateinfo.hwKey);
            Write("vendor ID=" + updateinfo.vendorID);
            Write("password required:" + updateinfo.fwPasswordRequired.ToString() + "\n\r");
            //update status anzeigen
            printUpdateStatus(retval, updatestatus);
            //timer starten
            timer1.Enabled = false; // wenn anderer Timer läuft, diesen stoppen
            timerUpdate.Enabled = true; // timer starten
          }
          else
          {
            //update status und fehler anzeigen
            //update status anzeigen
            tbMessages.Text = "";
            Write("Starting Firmware Update:" + "\n\r");
            Write("Meta file name=" + firmwareFile + "\n\r");
            printUpdateStatus(retval, updatestatus);
          }
        }
      }
    }

    private void printUpdateStatus(clsTMGIOLUSBIF20.eFwUpdateReturnValue retval  , clsTMGIOLUSBIF20.clsFwUpdateStatus   updatestatus )
    {
      string text="";
      if ((retval != clsTMGIOLUSBIF20.eFwUpdateReturnValue.FWUPDATE_RET_OK) || (updatestatus.executedState != updatestatus.nextState))
        text = "FWUP: From=" + updatestatus.executedState.ToString() + " Next=" + updatestatus.nextState.ToString() + " retval=" + retval.ToString() + " dllretval=" + updatestatus.dllReturnValue.ToString() + "\n\r";
      else
        if ((updatestatus.BlobStatus.executedState != clsTMGIOLUSBIF20.eBlobState.BLOB_STATE_IDLE) || (updatestatus.BlobStatus.nextState != clsTMGIOLUSBIF20.eBlobState.BLOB_STATE_IDLE))
          text += "BLOB: From=" + updatestatus.BlobStatus.executedState.ToString() + " Next=" + updatestatus.BlobStatus.nextState + " blobretval=" + updatestatus.blobReturnValue.ToString() + " PercenComplete=" + updatestatus.BlobStatus.PercentComplete + "\n\r";
      if (text != "")
      {
        Write(text);
      }
    }

    private void timerUpdate_Tick_1(object sender, EventArgs e)
    {
      //zuerst timer stoppen, damit sich nichts überlappt
      timerUpdate.Enabled = false;
      string password = "";
      if (updatestatus.nextState == clsTMGIOLUSBIF20.eFwUpdateState.FWUPDATE_STATE_PASSWORD)
      {
        password = Interaction.InputBox("enter Passwort", "Firmware Update", "", -1, -1);
      }
      clsTMGIOLUSBIF20.eFwUpdateReturnValue retval = IOLM.Port[0].FirmwareUpdate.IOL_FwUpdateContinue(password, ref updatestatus);
      printUpdateStatus(retval, updatestatus);
      //am schluss timer wieder starten
      if (updatestatus.nextState != clsTMGIOLUSBIF20.eFwUpdateState.FWUPDATE_STATE_IDLE)
        timerUpdate.Enabled = true;
    }

  private void sendpatterns()
  {
    System.IO.Ports.SerialPort ComPort = new System.IO.Ports.SerialPort();
    ComPort.PortName = "COM141";
    ComPort.BaudRate = 38400;
    ComPort.DataBits = 8;
    ComPort.Parity = System.IO.Ports.Parity.None;
    ComPort.ParityReplace = 63;
    ComPort.StopBits = System.IO.Ports.StopBits.One;
    ComPort.Handshake = System.IO.Ports.Handshake.None;
    ComPort.ReadBufferSize = 128000;
    ComPort.ReadTimeout = -1;
    ComPort.ReceivedBytesThreshold = 1;
    ComPort.RtsEnable = false;
    ComPort.WriteBufferSize = 200;
    ComPort.WriteTimeout = -1;
    ComPort.DiscardNull = false;
    ComPort.DtrEnable = false;
    ComPort.Open();
    System.Threading.Thread.Sleep(1000);
    byte[] x = { 0, 1, 2, 3 };
    ComPort.Write(x, 0, 4);
    System.Threading.Thread.Sleep(1000);
    char[] y = { 'O', 'K', '\0' };
    ComPort.Write(y, 0, 3);

    ComPort.Close();
  }
 
  }
}

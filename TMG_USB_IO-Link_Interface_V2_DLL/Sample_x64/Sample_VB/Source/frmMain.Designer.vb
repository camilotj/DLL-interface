<Global.Microsoft.VisualBasic.CompilerServices.DesignerGenerated()> _
Partial Class frmMain
  Inherits System.Windows.Forms.Form

  'Das Formular überschreibt den Löschvorgang, um die Komponentenliste zu bereinigen.
  <System.Diagnostics.DebuggerNonUserCode()> _
  Protected Overrides Sub Dispose(ByVal disposing As Boolean)
    Try
      If disposing AndAlso components IsNot Nothing Then
        components.Dispose()
      End If
    Finally
      MyBase.Dispose(disposing)
    End Try
  End Sub

  'Wird vom Windows Form-Designer benötigt.
  Private components As System.ComponentModel.IContainer

  'Hinweis: Die folgende Prozedur ist für den Windows Form-Designer erforderlich.
  'Das Bearbeiten ist mit dem Windows Form-Designer möglich.  
  'Das Bearbeiten mit dem Code-Editor ist nicht möglich.
  <System.Diagnostics.DebuggerStepThrough()> _
  Private Sub InitializeComponent()
    Me.components = New System.ComponentModel.Container()
    Dim resources As System.ComponentModel.ComponentResourceManager = New System.ComponentModel.ComponentResourceManager(GetType(frmMain))
    Me.Label1 = New System.Windows.Forms.Label()
    Me.tbPDIn = New System.Windows.Forms.TextBox()
    Me.Timer1 = New System.Windows.Forms.Timer(Me.components)
    Me.tbMessages = New System.Windows.Forms.TextBox()
    Me.Label2 = New System.Windows.Forms.Label()
    Me.Label3 = New System.Windows.Forms.Label()
    Me.tbDataRead = New System.Windows.Forms.TextBox()
    Me.tbSubindexRead = New System.Windows.Forms.TextBox()
    Me.tbIndexRead = New System.Windows.Forms.TextBox()
    Me.Label4 = New System.Windows.Forms.Label()
    Me.Label5 = New System.Windows.Forms.Label()
    Me.cmdRead = New System.Windows.Forms.Button()
    Me.cmdWrite = New System.Windows.Forms.Button()
    Me.Label6 = New System.Windows.Forms.Label()
    Me.tbIndexWrite = New System.Windows.Forms.TextBox()
    Me.tbSubindexWrite = New System.Windows.Forms.TextBox()
    Me.tbDataWrite = New System.Windows.Forms.TextBox()
    Me.Label7 = New System.Windows.Forms.Label()
    Me.Label8 = New System.Windows.Forms.Label()
    Me.tbPDOutRead = New System.Windows.Forms.TextBox()
    Me.tbReadError = New System.Windows.Forms.TextBox()
    Me.tbWriteError = New System.Windows.Forms.TextBox()
    Me.GroupBox1 = New System.Windows.Forms.GroupBox()
    Me.tbPDOutWrite = New System.Windows.Forms.TextBox()
    Me.cmdPort1 = New System.Windows.Forms.Button()
    Me.cmdPort2 = New System.Windows.Forms.Button()
    Me.tbInfo = New System.Windows.Forms.TextBox()
    Me.cmdPort2_Deactivate = New System.Windows.Forms.Button()
    Me.cmdPort1_Deactivate = New System.Windows.Forms.Button()
    Me.cmdPort1Validate = New System.Windows.Forms.Button()
    Me.MenuStrip1 = New System.Windows.Forms.MenuStrip()
    Me.TSM_Help = New System.Windows.Forms.ToolStripMenuItem()
    Me.TSM_About = New System.Windows.Forms.ToolStripMenuItem()
    Me.Label9 = New System.Windows.Forms.Label()
    Me.CheckBox1 = New System.Windows.Forms.CheckBox()
    Me.TextBox1 = New System.Windows.Forms.TextBox()
    Me.Label10 = New System.Windows.Forms.Label()
    Me.CmdFirmwareUpdate = New System.Windows.Forms.Button()
    Me.TimerUpdate = New System.Windows.Forms.Timer(Me.components)
    Me.CmdDataLogging = New System.Windows.Forms.Button()
    Me.TimerLogging = New System.Windows.Forms.Timer(Me.components)
    Me.GroupBox1.SuspendLayout()
    Me.MenuStrip1.SuspendLayout()
    Me.SuspendLayout()
    '
    'Label1
    '
    Me.Label1.AutoSize = True
    Me.Label1.Location = New System.Drawing.Point(18, 32)
    Me.Label1.Name = "Label1"
    Me.Label1.Size = New System.Drawing.Size(77, 13)
    Me.Label1.TabIndex = 0
    Me.Label1.Text = "ProcessDataIn"
    '
    'tbPDIn
    '
    Me.tbPDIn.Location = New System.Drawing.Point(116, 29)
    Me.tbPDIn.Name = "tbPDIn"
    Me.tbPDIn.ReadOnly = True
    Me.tbPDIn.Size = New System.Drawing.Size(578, 20)
    Me.tbPDIn.TabIndex = 1
    '
    'Timer1
    '
    '
    'tbMessages
    '
    Me.tbMessages.Font = New System.Drawing.Font("Courier New", 8.25!, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, CType(0, Byte))
    Me.tbMessages.Location = New System.Drawing.Point(21, 135)
    Me.tbMessages.Multiline = True
    Me.tbMessages.Name = "tbMessages"
    Me.tbMessages.ScrollBars = System.Windows.Forms.ScrollBars.Both
    Me.tbMessages.Size = New System.Drawing.Size(673, 221)
    Me.tbMessages.TabIndex = 2
    '
    'Label2
    '
    Me.Label2.AutoSize = True
    Me.Label2.Location = New System.Drawing.Point(20, 86)
    Me.Label2.Name = "Label2"
    Me.Label2.Size = New System.Drawing.Size(33, 13)
    Me.Label2.TabIndex = 3
    Me.Label2.Text = "Index"
    '
    'Label3
    '
    Me.Label3.AutoSize = True
    Me.Label3.Location = New System.Drawing.Point(115, 86)
    Me.Label3.Name = "Label3"
    Me.Label3.Size = New System.Drawing.Size(51, 13)
    Me.Label3.TabIndex = 4
    Me.Label3.Text = "Subindex"
    '
    'tbDataRead
    '
    Me.tbDataRead.Location = New System.Drawing.Point(262, 83)
    Me.tbDataRead.Name = "tbDataRead"
    Me.tbDataRead.ReadOnly = True
    Me.tbDataRead.Size = New System.Drawing.Size(300, 20)
    Me.tbDataRead.TabIndex = 5
    '
    'tbSubindexRead
    '
    Me.tbSubindexRead.Location = New System.Drawing.Point(172, 83)
    Me.tbSubindexRead.Name = "tbSubindexRead"
    Me.tbSubindexRead.Size = New System.Drawing.Size(48, 20)
    Me.tbSubindexRead.TabIndex = 6
    Me.tbSubindexRead.Text = "0"
    '
    'tbIndexRead
    '
    Me.tbIndexRead.Location = New System.Drawing.Point(59, 83)
    Me.tbIndexRead.Name = "tbIndexRead"
    Me.tbIndexRead.Size = New System.Drawing.Size(48, 20)
    Me.tbIndexRead.TabIndex = 7
    Me.tbIndexRead.Text = "0"
    '
    'Label4
    '
    Me.Label4.AutoSize = True
    Me.Label4.Location = New System.Drawing.Point(226, 86)
    Me.Label4.Name = "Label4"
    Me.Label4.Size = New System.Drawing.Size(30, 13)
    Me.Label4.TabIndex = 8
    Me.Label4.Text = "Data"
    '
    'Label5
    '
    Me.Label5.AutoSize = True
    Me.Label5.Location = New System.Drawing.Point(20, 58)
    Me.Label5.Name = "Label5"
    Me.Label5.Size = New System.Drawing.Size(85, 13)
    Me.Label5.TabIndex = 9
    Me.Label5.Text = "ProcessDataOut"
    '
    'cmdRead
    '
    Me.cmdRead.Location = New System.Drawing.Point(568, 83)
    Me.cmdRead.Name = "cmdRead"
    Me.cmdRead.Size = New System.Drawing.Size(66, 20)
    Me.cmdRead.TabIndex = 11
    Me.cmdRead.Text = "Read"
    Me.cmdRead.UseVisualStyleBackColor = True
    '
    'cmdWrite
    '
    Me.cmdWrite.Location = New System.Drawing.Point(568, 109)
    Me.cmdWrite.Name = "cmdWrite"
    Me.cmdWrite.Size = New System.Drawing.Size(66, 20)
    Me.cmdWrite.TabIndex = 19
    Me.cmdWrite.Text = "Write"
    Me.cmdWrite.UseVisualStyleBackColor = True
    '
    'Label6
    '
    Me.Label6.AutoSize = True
    Me.Label6.Location = New System.Drawing.Point(226, 112)
    Me.Label6.Name = "Label6"
    Me.Label6.Size = New System.Drawing.Size(30, 13)
    Me.Label6.TabIndex = 18
    Me.Label6.Text = "Data"
    '
    'tbIndexWrite
    '
    Me.tbIndexWrite.Location = New System.Drawing.Point(59, 109)
    Me.tbIndexWrite.Name = "tbIndexWrite"
    Me.tbIndexWrite.Size = New System.Drawing.Size(48, 20)
    Me.tbIndexWrite.TabIndex = 17
    Me.tbIndexWrite.Text = "0"
    '
    'tbSubindexWrite
    '
    Me.tbSubindexWrite.Location = New System.Drawing.Point(172, 109)
    Me.tbSubindexWrite.Name = "tbSubindexWrite"
    Me.tbSubindexWrite.Size = New System.Drawing.Size(48, 20)
    Me.tbSubindexWrite.TabIndex = 16
    Me.tbSubindexWrite.Text = "0"
    '
    'tbDataWrite
    '
    Me.tbDataWrite.Location = New System.Drawing.Point(262, 109)
    Me.tbDataWrite.Name = "tbDataWrite"
    Me.tbDataWrite.Size = New System.Drawing.Size(300, 20)
    Me.tbDataWrite.TabIndex = 15
    Me.tbDataWrite.Text = "00 00"
    '
    'Label7
    '
    Me.Label7.AutoSize = True
    Me.Label7.Location = New System.Drawing.Point(115, 112)
    Me.Label7.Name = "Label7"
    Me.Label7.Size = New System.Drawing.Size(51, 13)
    Me.Label7.TabIndex = 14
    Me.Label7.Text = "Subindex"
    '
    'Label8
    '
    Me.Label8.AutoSize = True
    Me.Label8.Location = New System.Drawing.Point(20, 112)
    Me.Label8.Name = "Label8"
    Me.Label8.Size = New System.Drawing.Size(33, 13)
    Me.Label8.TabIndex = 13
    Me.Label8.Text = "Index"
    '
    'tbPDOutRead
    '
    Me.tbPDOutRead.Location = New System.Drawing.Point(116, 55)
    Me.tbPDOutRead.Name = "tbPDOutRead"
    Me.tbPDOutRead.ReadOnly = True
    Me.tbPDOutRead.Size = New System.Drawing.Size(238, 20)
    Me.tbPDOutRead.TabIndex = 22
    '
    'tbReadError
    '
    Me.tbReadError.Location = New System.Drawing.Point(640, 83)
    Me.tbReadError.Name = "tbReadError"
    Me.tbReadError.Size = New System.Drawing.Size(54, 20)
    Me.tbReadError.TabIndex = 24
    '
    'tbWriteError
    '
    Me.tbWriteError.Location = New System.Drawing.Point(640, 109)
    Me.tbWriteError.Name = "tbWriteError"
    Me.tbWriteError.Size = New System.Drawing.Size(54, 20)
    Me.tbWriteError.TabIndex = 25
    '
    'GroupBox1
    '
    Me.GroupBox1.Controls.Add(Me.tbPDOutWrite)
    Me.GroupBox1.Controls.Add(Me.tbMessages)
    Me.GroupBox1.Controls.Add(Me.tbWriteError)
    Me.GroupBox1.Controls.Add(Me.Label1)
    Me.GroupBox1.Controls.Add(Me.tbReadError)
    Me.GroupBox1.Controls.Add(Me.tbPDIn)
    Me.GroupBox1.Controls.Add(Me.Label2)
    Me.GroupBox1.Controls.Add(Me.tbPDOutRead)
    Me.GroupBox1.Controls.Add(Me.Label3)
    Me.GroupBox1.Controls.Add(Me.cmdWrite)
    Me.GroupBox1.Controls.Add(Me.tbDataRead)
    Me.GroupBox1.Controls.Add(Me.Label6)
    Me.GroupBox1.Controls.Add(Me.tbSubindexRead)
    Me.GroupBox1.Controls.Add(Me.tbIndexWrite)
    Me.GroupBox1.Controls.Add(Me.tbIndexRead)
    Me.GroupBox1.Controls.Add(Me.tbSubindexWrite)
    Me.GroupBox1.Controls.Add(Me.Label4)
    Me.GroupBox1.Controls.Add(Me.tbDataWrite)
    Me.GroupBox1.Controls.Add(Me.Label5)
    Me.GroupBox1.Controls.Add(Me.Label7)
    Me.GroupBox1.Controls.Add(Me.Label8)
    Me.GroupBox1.Controls.Add(Me.cmdRead)
    Me.GroupBox1.Location = New System.Drawing.Point(12, 191)
    Me.GroupBox1.Name = "GroupBox1"
    Me.GroupBox1.Size = New System.Drawing.Size(713, 366)
    Me.GroupBox1.TabIndex = 26
    Me.GroupBox1.TabStop = False
    '
    'tbPDOutWrite
    '
    Me.tbPDOutWrite.Location = New System.Drawing.Point(360, 55)
    Me.tbPDOutWrite.Name = "tbPDOutWrite"
    Me.tbPDOutWrite.Size = New System.Drawing.Size(218, 20)
    Me.tbPDOutWrite.TabIndex = 26
    '
    'cmdPort1
    '
    Me.cmdPort1.Location = New System.Drawing.Point(372, 35)
    Me.cmdPort1.Name = "cmdPort1"
    Me.cmdPort1.Size = New System.Drawing.Size(146, 24)
    Me.cmdPort1.TabIndex = 27
    Me.cmdPort1.Text = "Activate Port 1"
    Me.cmdPort1.UseVisualStyleBackColor = True
    '
    'cmdPort2
    '
    Me.cmdPort2.Location = New System.Drawing.Point(545, 35)
    Me.cmdPort2.Name = "cmdPort2"
    Me.cmdPort2.Size = New System.Drawing.Size(146, 24)
    Me.cmdPort2.TabIndex = 28
    Me.cmdPort2.Text = "Activate Port 2"
    Me.cmdPort2.UseVisualStyleBackColor = True
    '
    'tbInfo
    '
    Me.tbInfo.Font = New System.Drawing.Font("Courier New", 6.75!, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, CType(0, Byte))
    Me.tbInfo.Location = New System.Drawing.Point(12, 29)
    Me.tbInfo.Multiline = True
    Me.tbInfo.Name = "tbInfo"
    Me.tbInfo.Size = New System.Drawing.Size(336, 156)
    Me.tbInfo.TabIndex = 29
    '
    'cmdPort2_Deactivate
    '
    Me.cmdPort2_Deactivate.Location = New System.Drawing.Point(545, 65)
    Me.cmdPort2_Deactivate.Name = "cmdPort2_Deactivate"
    Me.cmdPort2_Deactivate.Size = New System.Drawing.Size(146, 24)
    Me.cmdPort2_Deactivate.TabIndex = 31
    Me.cmdPort2_Deactivate.Text = "Deactivate Port 2"
    Me.cmdPort2_Deactivate.UseVisualStyleBackColor = True
    '
    'cmdPort1_Deactivate
    '
    Me.cmdPort1_Deactivate.Location = New System.Drawing.Point(372, 65)
    Me.cmdPort1_Deactivate.Name = "cmdPort1_Deactivate"
    Me.cmdPort1_Deactivate.Size = New System.Drawing.Size(146, 24)
    Me.cmdPort1_Deactivate.TabIndex = 30
    Me.cmdPort1_Deactivate.Text = "Deactivate Port 1"
    Me.cmdPort1_Deactivate.UseVisualStyleBackColor = True
    '
    'cmdPort1Validate
    '
    Me.cmdPort1Validate.Location = New System.Drawing.Point(372, 95)
    Me.cmdPort1Validate.Name = "cmdPort1Validate"
    Me.cmdPort1Validate.Size = New System.Drawing.Size(146, 24)
    Me.cmdPort1Validate.TabIndex = 32
    Me.cmdPort1Validate.Text = "Set Validation Port 1"
    Me.cmdPort1Validate.UseVisualStyleBackColor = True
    '
    'MenuStrip1
    '
    Me.MenuStrip1.Items.AddRange(New System.Windows.Forms.ToolStripItem() {Me.TSM_Help})
    Me.MenuStrip1.Location = New System.Drawing.Point(0, 0)
    Me.MenuStrip1.Name = "MenuStrip1"
    Me.MenuStrip1.Size = New System.Drawing.Size(732, 24)
    Me.MenuStrip1.TabIndex = 33
    Me.MenuStrip1.Text = "MenuStrip1"
    '
    'TSM_Help
    '
    Me.TSM_Help.DropDownItems.AddRange(New System.Windows.Forms.ToolStripItem() {Me.TSM_About})
    Me.TSM_Help.Name = "TSM_Help"
    Me.TSM_Help.Size = New System.Drawing.Size(44, 20)
    Me.TSM_Help.Text = "Help"
    '
    'TSM_About
    '
    Me.TSM_About.Name = "TSM_About"
    Me.TSM_About.Size = New System.Drawing.Size(107, 22)
    Me.TSM_About.Text = "About"
    '
    'Label9
    '
    Me.Label9.AutoSize = True
    Me.Label9.Location = New System.Drawing.Point(369, 172)
    Me.Label9.Name = "Label9"
    Me.Label9.Size = New System.Drawing.Size(99, 13)
    Me.Label9.TabIndex = 34
    Me.Label9.Text = "Actual Power Level"
    '
    'CheckBox1
    '
    Me.CheckBox1.AutoSize = True
    Me.CheckBox1.Location = New System.Drawing.Point(485, 171)
    Me.CheckBox1.Name = "CheckBox1"
    Me.CheckBox1.Size = New System.Drawing.Size(55, 17)
    Me.CheckBox1.TabIndex = 35
    Me.CheckBox1.Text = "extern"
    Me.CheckBox1.UseVisualStyleBackColor = True
    '
    'TextBox1
    '
    Me.TextBox1.Location = New System.Drawing.Point(554, 170)
    Me.TextBox1.Name = "TextBox1"
    Me.TextBox1.Size = New System.Drawing.Size(52, 20)
    Me.TextBox1.TabIndex = 36
    '
    'Label10
    '
    Me.Label10.AutoSize = True
    Me.Label10.Location = New System.Drawing.Point(612, 172)
    Me.Label10.Name = "Label10"
    Me.Label10.Size = New System.Drawing.Size(14, 13)
    Me.Label10.TabIndex = 37
    Me.Label10.Text = "V"
    '
    'CmdFirmwareUpdate
    '
    Me.CmdFirmwareUpdate.Location = New System.Drawing.Point(372, 125)
    Me.CmdFirmwareUpdate.Name = "CmdFirmwareUpdate"
    Me.CmdFirmwareUpdate.Size = New System.Drawing.Size(146, 24)
    Me.CmdFirmwareUpdate.TabIndex = 39
    Me.CmdFirmwareUpdate.Text = "FirmwareUpdate"
    Me.CmdFirmwareUpdate.UseVisualStyleBackColor = True
    '
    'TimerUpdate
    '
    Me.TimerUpdate.Interval = 10
    '
    'CmdDataLogging
    '
    Me.CmdDataLogging.Location = New System.Drawing.Point(545, 125)
    Me.CmdDataLogging.Name = "CmdDataLogging"
    Me.CmdDataLogging.Size = New System.Drawing.Size(146, 24)
    Me.CmdDataLogging.TabIndex = 40
    Me.CmdDataLogging.Text = "Start/Stop DataLogging"
    Me.CmdDataLogging.UseVisualStyleBackColor = True
    '
    'TimerLogging
    '
    Me.TimerLogging.Interval = 10
    '
    'frmMain
    '
    Me.AutoScaleDimensions = New System.Drawing.SizeF(6.0!, 13.0!)
    Me.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font
    Me.ClientSize = New System.Drawing.Size(732, 559)
    Me.Controls.Add(Me.CmdDataLogging)
    Me.Controls.Add(Me.CmdFirmwareUpdate)
    Me.Controls.Add(Me.Label10)
    Me.Controls.Add(Me.TextBox1)
    Me.Controls.Add(Me.CheckBox1)
    Me.Controls.Add(Me.Label9)
    Me.Controls.Add(Me.cmdPort1Validate)
    Me.Controls.Add(Me.cmdPort2_Deactivate)
    Me.Controls.Add(Me.cmdPort1_Deactivate)
    Me.Controls.Add(Me.tbInfo)
    Me.Controls.Add(Me.cmdPort2)
    Me.Controls.Add(Me.GroupBox1)
    Me.Controls.Add(Me.cmdPort1)
    Me.Controls.Add(Me.MenuStrip1)
    Me.FormBorderStyle = System.Windows.Forms.FormBorderStyle.FixedSingle
    Me.Icon = CType(resources.GetObject("$this.Icon"), System.Drawing.Icon)
    Me.MainMenuStrip = Me.MenuStrip1
    Me.MaximizeBox = False
    Me.MinimizeBox = False
    Me.Name = "frmMain"
    Me.StartPosition = System.Windows.Forms.FormStartPosition.CenterScreen
    Me.Text = "VB Sample for USB IO-Link Master DLL"
    Me.GroupBox1.ResumeLayout(False)
    Me.GroupBox1.PerformLayout()
    Me.MenuStrip1.ResumeLayout(False)
    Me.MenuStrip1.PerformLayout()
    Me.ResumeLayout(False)
    Me.PerformLayout()

  End Sub
  Friend WithEvents Label1 As System.Windows.Forms.Label
  Friend WithEvents tbPDIn As System.Windows.Forms.TextBox
  Friend WithEvents Timer1 As System.Windows.Forms.Timer
  Friend WithEvents tbMessages As System.Windows.Forms.TextBox
  Friend WithEvents Label2 As System.Windows.Forms.Label
  Friend WithEvents Label3 As System.Windows.Forms.Label
  Friend WithEvents tbDataRead As System.Windows.Forms.TextBox
  Friend WithEvents tbSubindexRead As System.Windows.Forms.TextBox
  Friend WithEvents tbIndexRead As System.Windows.Forms.TextBox
  Friend WithEvents Label4 As System.Windows.Forms.Label
  Friend WithEvents Label5 As System.Windows.Forms.Label
  Friend WithEvents cmdRead As System.Windows.Forms.Button
  Friend WithEvents cmdWrite As System.Windows.Forms.Button
  Friend WithEvents Label6 As System.Windows.Forms.Label
  Friend WithEvents tbIndexWrite As System.Windows.Forms.TextBox
  Friend WithEvents tbSubindexWrite As System.Windows.Forms.TextBox
  Friend WithEvents tbDataWrite As System.Windows.Forms.TextBox
  Friend WithEvents Label7 As System.Windows.Forms.Label
  Friend WithEvents Label8 As System.Windows.Forms.Label
  Friend WithEvents tbPDOutRead As System.Windows.Forms.TextBox
  Friend WithEvents tbReadError As System.Windows.Forms.TextBox
  Friend WithEvents tbWriteError As System.Windows.Forms.TextBox
  Friend WithEvents GroupBox1 As System.Windows.Forms.GroupBox
  Friend WithEvents cmdPort1 As System.Windows.Forms.Button
  Friend WithEvents cmdPort2 As System.Windows.Forms.Button
  Friend WithEvents tbInfo As System.Windows.Forms.TextBox
  Friend WithEvents cmdPort2_Deactivate As System.Windows.Forms.Button
  Friend WithEvents cmdPort1_Deactivate As System.Windows.Forms.Button
  Friend WithEvents cmdPort1Validate As System.Windows.Forms.Button
  Friend WithEvents MenuStrip1 As System.Windows.Forms.MenuStrip
  Friend WithEvents TSM_Help As System.Windows.Forms.ToolStripMenuItem
  Friend WithEvents TSM_About As System.Windows.Forms.ToolStripMenuItem
  Friend WithEvents tbPDOutWrite As System.Windows.Forms.TextBox
  Friend WithEvents Label9 As System.Windows.Forms.Label
  Friend WithEvents CheckBox1 As System.Windows.Forms.CheckBox
  Friend WithEvents TextBox1 As System.Windows.Forms.TextBox
  Friend WithEvents Label10 As System.Windows.Forms.Label
  Friend WithEvents CmdFirmwareUpdate As Button
  Friend WithEvents TimerUpdate As Timer
  Friend WithEvents CmdDataLogging As Button
  Friend WithEvents TimerLogging As Timer
End Class

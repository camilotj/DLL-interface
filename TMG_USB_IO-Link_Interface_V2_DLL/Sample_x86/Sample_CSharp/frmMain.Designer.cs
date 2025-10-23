namespace USBIOL_DLL_Sample_CSharp
{
    partial class frmMain
    {
        /// <summary>
        /// Erforderliche Designervariable.
        /// </summary>
        private System.ComponentModel.IContainer components = null;

        /// <summary>
        /// Verwendete Ressourcen bereinigen.
        /// </summary>
        /// <param name="disposing">True, wenn verwaltete Ressourcen gelöscht werden sollen; andernfalls False.</param>
        protected override void Dispose(bool disposing)
        {
            if (disposing && (components != null))
            {
                components.Dispose();
            }
            base.Dispose(disposing);
        }

        #region Vom Windows Form-Designer generierter Code

        /// <summary>
        /// Erforderliche Methode für die Designerunterstützung.
        /// Der Inhalt der Methode darf nicht mit dem Code-Editor geändert werden.
        /// </summary>
        private void InitializeComponent()
        {
      this.components = new System.ComponentModel.Container();
      System.ComponentModel.ComponentResourceManager resources = new System.ComponentModel.ComponentResourceManager(typeof(frmMain));
      this.timer1 = new System.Windows.Forms.Timer(this.components);
      this.cmdPort1Validate = new System.Windows.Forms.Button();
      this.cmdPort2_Deactivate = new System.Windows.Forms.Button();
      this.cmdPort1_Deactivate = new System.Windows.Forms.Button();
      this.tbInfo = new System.Windows.Forms.TextBox();
      this.cmdPort2 = new System.Windows.Forms.Button();
      this.GroupBox1 = new System.Windows.Forms.GroupBox();
      this.tbMessages = new System.Windows.Forms.TextBox();
      this.tbWriteError = new System.Windows.Forms.TextBox();
      this.Label1 = new System.Windows.Forms.Label();
      this.tbReadError = new System.Windows.Forms.TextBox();
      this.tbPDIn = new System.Windows.Forms.TextBox();
      this.Label2 = new System.Windows.Forms.Label();
      this.tbPDOutWrite = new System.Windows.Forms.TextBox();
      this.Label3 = new System.Windows.Forms.Label();
      this.cmdWrite = new System.Windows.Forms.Button();
      this.tbDataRead = new System.Windows.Forms.TextBox();
      this.Label6 = new System.Windows.Forms.Label();
      this.tbSubindexRead = new System.Windows.Forms.TextBox();
      this.tbIndexWrite = new System.Windows.Forms.TextBox();
      this.tbIndexRead = new System.Windows.Forms.TextBox();
      this.tbSubindexWrite = new System.Windows.Forms.TextBox();
      this.Label4 = new System.Windows.Forms.Label();
      this.tbDataWrite = new System.Windows.Forms.TextBox();
      this.Label5 = new System.Windows.Forms.Label();
      this.Label7 = new System.Windows.Forms.Label();
      this.tbPDOutRead = new System.Windows.Forms.TextBox();
      this.Label8 = new System.Windows.Forms.Label();
      this.cmdRead = new System.Windows.Forms.Button();
      this.cmdPort1 = new System.Windows.Forms.Button();
      this.menuStrip1 = new System.Windows.Forms.MenuStrip();
      this.TSM_Help = new System.Windows.Forms.ToolStripMenuItem();
      this.TSM_About = new System.Windows.Forms.ToolStripMenuItem();
      this.cmdUpdate = new System.Windows.Forms.Button();
      this.timerUpdate = new System.Windows.Forms.Timer(this.components);
      this.GroupBox1.SuspendLayout();
      this.menuStrip1.SuspendLayout();
      this.SuspendLayout();
      // 
      // timer1
      // 
      this.timer1.Tick += new System.EventHandler(this.timer1_Tick);
      // 
      // cmdPort1Validate
      // 
      this.cmdPort1Validate.Location = new System.Drawing.Point(367, 87);
      this.cmdPort1Validate.Name = "cmdPort1Validate";
      this.cmdPort1Validate.Size = new System.Drawing.Size(146, 24);
      this.cmdPort1Validate.TabIndex = 39;
      this.cmdPort1Validate.Text = "Set Validation Port 1";
      this.cmdPort1Validate.UseVisualStyleBackColor = true;
      this.cmdPort1Validate.Click += new System.EventHandler(this.cmdPort1Validate_Click);
      // 
      // cmdPort2_Deactivate
      // 
      this.cmdPort2_Deactivate.Location = new System.Drawing.Point(540, 57);
      this.cmdPort2_Deactivate.Name = "cmdPort2_Deactivate";
      this.cmdPort2_Deactivate.Size = new System.Drawing.Size(146, 24);
      this.cmdPort2_Deactivate.TabIndex = 38;
      this.cmdPort2_Deactivate.Text = "Deactivate Port 2";
      this.cmdPort2_Deactivate.UseVisualStyleBackColor = true;
      this.cmdPort2_Deactivate.Click += new System.EventHandler(this.cmdPort2_Deactivate_Click);
      // 
      // cmdPort1_Deactivate
      // 
      this.cmdPort1_Deactivate.Location = new System.Drawing.Point(367, 57);
      this.cmdPort1_Deactivate.Name = "cmdPort1_Deactivate";
      this.cmdPort1_Deactivate.Size = new System.Drawing.Size(146, 24);
      this.cmdPort1_Deactivate.TabIndex = 37;
      this.cmdPort1_Deactivate.Text = "Deactivate Port 1";
      this.cmdPort1_Deactivate.UseVisualStyleBackColor = true;
      this.cmdPort1_Deactivate.Click += new System.EventHandler(this.cmdPort1_Deactivate_Click);
      // 
      // tbInfo
      // 
      this.tbInfo.Font = new System.Drawing.Font("Courier New", 6.75F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
      this.tbInfo.Location = new System.Drawing.Point(7, 27);
      this.tbInfo.Multiline = true;
      this.tbInfo.Name = "tbInfo";
      this.tbInfo.Size = new System.Drawing.Size(336, 114);
      this.tbInfo.TabIndex = 36;
      // 
      // cmdPort2
      // 
      this.cmdPort2.Location = new System.Drawing.Point(540, 27);
      this.cmdPort2.Name = "cmdPort2";
      this.cmdPort2.Size = new System.Drawing.Size(146, 24);
      this.cmdPort2.TabIndex = 35;
      this.cmdPort2.Text = "Activate Port 2";
      this.cmdPort2.UseVisualStyleBackColor = true;
      this.cmdPort2.Click += new System.EventHandler(this.cmdPort2_Click);
      // 
      // GroupBox1
      // 
      this.GroupBox1.Controls.Add(this.tbMessages);
      this.GroupBox1.Controls.Add(this.tbWriteError);
      this.GroupBox1.Controls.Add(this.Label1);
      this.GroupBox1.Controls.Add(this.tbReadError);
      this.GroupBox1.Controls.Add(this.tbPDIn);
      this.GroupBox1.Controls.Add(this.Label2);
      this.GroupBox1.Controls.Add(this.tbPDOutWrite);
      this.GroupBox1.Controls.Add(this.Label3);
      this.GroupBox1.Controls.Add(this.cmdWrite);
      this.GroupBox1.Controls.Add(this.tbDataRead);
      this.GroupBox1.Controls.Add(this.Label6);
      this.GroupBox1.Controls.Add(this.tbSubindexRead);
      this.GroupBox1.Controls.Add(this.tbIndexWrite);
      this.GroupBox1.Controls.Add(this.tbIndexRead);
      this.GroupBox1.Controls.Add(this.tbSubindexWrite);
      this.GroupBox1.Controls.Add(this.Label4);
      this.GroupBox1.Controls.Add(this.tbDataWrite);
      this.GroupBox1.Controls.Add(this.Label5);
      this.GroupBox1.Controls.Add(this.Label7);
      this.GroupBox1.Controls.Add(this.tbPDOutRead);
      this.GroupBox1.Controls.Add(this.Label8);
      this.GroupBox1.Controls.Add(this.cmdRead);
      this.GroupBox1.Location = new System.Drawing.Point(7, 149);
      this.GroupBox1.Name = "GroupBox1";
      this.GroupBox1.Size = new System.Drawing.Size(713, 366);
      this.GroupBox1.TabIndex = 33;
      this.GroupBox1.TabStop = false;
      // 
      // tbMessages
      // 
      this.tbMessages.Font = new System.Drawing.Font("Courier New", 8.25F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
      this.tbMessages.Location = new System.Drawing.Point(21, 135);
      this.tbMessages.Multiline = true;
      this.tbMessages.Name = "tbMessages";
      this.tbMessages.ScrollBars = System.Windows.Forms.ScrollBars.Both;
      this.tbMessages.Size = new System.Drawing.Size(673, 221);
      this.tbMessages.TabIndex = 2;
      // 
      // tbWriteError
      // 
      this.tbWriteError.Location = new System.Drawing.Point(640, 109);
      this.tbWriteError.Name = "tbWriteError";
      this.tbWriteError.Size = new System.Drawing.Size(54, 20);
      this.tbWriteError.TabIndex = 25;
      // 
      // Label1
      // 
      this.Label1.AutoSize = true;
      this.Label1.Location = new System.Drawing.Point(18, 32);
      this.Label1.Name = "Label1";
      this.Label1.Size = new System.Drawing.Size(77, 13);
      this.Label1.TabIndex = 0;
      this.Label1.Text = "ProcessDataIn";
      // 
      // tbReadError
      // 
      this.tbReadError.Location = new System.Drawing.Point(640, 83);
      this.tbReadError.Name = "tbReadError";
      this.tbReadError.Size = new System.Drawing.Size(54, 20);
      this.tbReadError.TabIndex = 24;
      // 
      // tbPDIn
      // 
      this.tbPDIn.Location = new System.Drawing.Point(116, 29);
      this.tbPDIn.Name = "tbPDIn";
      this.tbPDIn.ReadOnly = true;
      this.tbPDIn.Size = new System.Drawing.Size(446, 20);
      this.tbPDIn.TabIndex = 1;
      // 
      // Label2
      // 
      this.Label2.AutoSize = true;
      this.Label2.Location = new System.Drawing.Point(20, 86);
      this.Label2.Name = "Label2";
      this.Label2.Size = new System.Drawing.Size(33, 13);
      this.Label2.TabIndex = 3;
      this.Label2.Text = "Index";
      // 
      // tbPDOutWrite
      // 
      this.tbPDOutWrite.Location = new System.Drawing.Point(342, 55);
      this.tbPDOutWrite.Name = "tbPDOutWrite";
      this.tbPDOutWrite.Size = new System.Drawing.Size(220, 20);
      this.tbPDOutWrite.TabIndex = 22;
      this.tbPDOutWrite.KeyPress += new System.Windows.Forms.KeyPressEventHandler(this.tbPDOutWrite_KeyPress);
      // 
      // Label3
      // 
      this.Label3.AutoSize = true;
      this.Label3.Location = new System.Drawing.Point(115, 86);
      this.Label3.Name = "Label3";
      this.Label3.Size = new System.Drawing.Size(51, 13);
      this.Label3.TabIndex = 4;
      this.Label3.Text = "Subindex";
      // 
      // cmdWrite
      // 
      this.cmdWrite.Location = new System.Drawing.Point(568, 109);
      this.cmdWrite.Name = "cmdWrite";
      this.cmdWrite.Size = new System.Drawing.Size(66, 20);
      this.cmdWrite.TabIndex = 19;
      this.cmdWrite.Text = "Write";
      this.cmdWrite.UseVisualStyleBackColor = true;
      this.cmdWrite.Click += new System.EventHandler(this.cmdWrite_Click_1);
      // 
      // tbDataRead
      // 
      this.tbDataRead.Location = new System.Drawing.Point(262, 83);
      this.tbDataRead.Name = "tbDataRead";
      this.tbDataRead.ReadOnly = true;
      this.tbDataRead.Size = new System.Drawing.Size(300, 20);
      this.tbDataRead.TabIndex = 5;
      // 
      // Label6
      // 
      this.Label6.AutoSize = true;
      this.Label6.Location = new System.Drawing.Point(226, 112);
      this.Label6.Name = "Label6";
      this.Label6.Size = new System.Drawing.Size(30, 13);
      this.Label6.TabIndex = 18;
      this.Label6.Text = "Data";
      // 
      // tbSubindexRead
      // 
      this.tbSubindexRead.Location = new System.Drawing.Point(172, 83);
      this.tbSubindexRead.Name = "tbSubindexRead";
      this.tbSubindexRead.Size = new System.Drawing.Size(48, 20);
      this.tbSubindexRead.TabIndex = 6;
      this.tbSubindexRead.Text = "0";
      // 
      // tbIndexWrite
      // 
      this.tbIndexWrite.Location = new System.Drawing.Point(59, 109);
      this.tbIndexWrite.Name = "tbIndexWrite";
      this.tbIndexWrite.Size = new System.Drawing.Size(48, 20);
      this.tbIndexWrite.TabIndex = 17;
      this.tbIndexWrite.Text = "0";
      // 
      // tbIndexRead
      // 
      this.tbIndexRead.Location = new System.Drawing.Point(59, 83);
      this.tbIndexRead.Name = "tbIndexRead";
      this.tbIndexRead.Size = new System.Drawing.Size(48, 20);
      this.tbIndexRead.TabIndex = 7;
      this.tbIndexRead.Text = "0";
      // 
      // tbSubindexWrite
      // 
      this.tbSubindexWrite.Location = new System.Drawing.Point(172, 109);
      this.tbSubindexWrite.Name = "tbSubindexWrite";
      this.tbSubindexWrite.Size = new System.Drawing.Size(48, 20);
      this.tbSubindexWrite.TabIndex = 16;
      this.tbSubindexWrite.Text = "0";
      // 
      // Label4
      // 
      this.Label4.AutoSize = true;
      this.Label4.Location = new System.Drawing.Point(226, 86);
      this.Label4.Name = "Label4";
      this.Label4.Size = new System.Drawing.Size(30, 13);
      this.Label4.TabIndex = 8;
      this.Label4.Text = "Data";
      // 
      // tbDataWrite
      // 
      this.tbDataWrite.Location = new System.Drawing.Point(262, 109);
      this.tbDataWrite.Name = "tbDataWrite";
      this.tbDataWrite.Size = new System.Drawing.Size(300, 20);
      this.tbDataWrite.TabIndex = 15;
      this.tbDataWrite.Text = "00 00";
      // 
      // Label5
      // 
      this.Label5.AutoSize = true;
      this.Label5.Location = new System.Drawing.Point(20, 58);
      this.Label5.Name = "Label5";
      this.Label5.Size = new System.Drawing.Size(85, 13);
      this.Label5.TabIndex = 9;
      this.Label5.Text = "ProcessDataOut";
      // 
      // Label7
      // 
      this.Label7.AutoSize = true;
      this.Label7.Location = new System.Drawing.Point(115, 112);
      this.Label7.Name = "Label7";
      this.Label7.Size = new System.Drawing.Size(51, 13);
      this.Label7.TabIndex = 14;
      this.Label7.Text = "Subindex";
      // 
      // tbPDOutRead
      // 
      this.tbPDOutRead.Location = new System.Drawing.Point(116, 55);
      this.tbPDOutRead.Name = "tbPDOutRead";
      this.tbPDOutRead.ReadOnly = true;
      this.tbPDOutRead.Size = new System.Drawing.Size(220, 20);
      this.tbPDOutRead.TabIndex = 10;
      // 
      // Label8
      // 
      this.Label8.AutoSize = true;
      this.Label8.Location = new System.Drawing.Point(20, 112);
      this.Label8.Name = "Label8";
      this.Label8.Size = new System.Drawing.Size(33, 13);
      this.Label8.TabIndex = 13;
      this.Label8.Text = "Index";
      // 
      // cmdRead
      // 
      this.cmdRead.Location = new System.Drawing.Point(568, 83);
      this.cmdRead.Name = "cmdRead";
      this.cmdRead.Size = new System.Drawing.Size(66, 20);
      this.cmdRead.TabIndex = 11;
      this.cmdRead.Text = "Read";
      this.cmdRead.UseVisualStyleBackColor = true;
      this.cmdRead.Click += new System.EventHandler(this.cmdRead_Click);
      // 
      // cmdPort1
      // 
      this.cmdPort1.Location = new System.Drawing.Point(367, 27);
      this.cmdPort1.Name = "cmdPort1";
      this.cmdPort1.Size = new System.Drawing.Size(146, 24);
      this.cmdPort1.TabIndex = 34;
      this.cmdPort1.Text = "Activate Port 1";
      this.cmdPort1.UseVisualStyleBackColor = true;
      this.cmdPort1.Click += new System.EventHandler(this.cmdPort1_Click);
      // 
      // menuStrip1
      // 
      this.menuStrip1.Items.AddRange(new System.Windows.Forms.ToolStripItem[] {
            this.TSM_Help});
      this.menuStrip1.Location = new System.Drawing.Point(0, 0);
      this.menuStrip1.Name = "menuStrip1";
      this.menuStrip1.Size = new System.Drawing.Size(727, 24);
      this.menuStrip1.TabIndex = 40;
      this.menuStrip1.Text = "menuStrip1";
      // 
      // TSM_Help
      // 
      this.TSM_Help.DropDownItems.AddRange(new System.Windows.Forms.ToolStripItem[] {
            this.TSM_About});
      this.TSM_Help.Name = "TSM_Help";
      this.TSM_Help.Size = new System.Drawing.Size(44, 20);
      this.TSM_Help.Text = "Help";
      // 
      // TSM_About
      // 
      this.TSM_About.Name = "TSM_About";
      this.TSM_About.Size = new System.Drawing.Size(180, 22);
      this.TSM_About.Text = "About";
      this.TSM_About.Click += new System.EventHandler(this.TSM_About_Click);
      // 
      // cmdUpdate
      // 
      this.cmdUpdate.Location = new System.Drawing.Point(367, 117);
      this.cmdUpdate.Name = "cmdUpdate";
      this.cmdUpdate.Size = new System.Drawing.Size(146, 24);
      this.cmdUpdate.TabIndex = 40;
      this.cmdUpdate.Text = "Firmware Update";
      this.cmdUpdate.UseVisualStyleBackColor = true;
      this.cmdUpdate.Click += new System.EventHandler(this.cmdUpdate_Click);
      // 
      // timerUpdate
      // 
      this.timerUpdate.Interval = 10;
      this.timerUpdate.Tick += new System.EventHandler(this.timerUpdate_Tick_1);
      // 
      // frmMain
      // 
      this.AutoScaleDimensions = new System.Drawing.SizeF(6F, 13F);
      this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
      this.ClientSize = new System.Drawing.Size(727, 519);
      this.Controls.Add(this.cmdUpdate);
      this.Controls.Add(this.cmdPort1Validate);
      this.Controls.Add(this.cmdPort2_Deactivate);
      this.Controls.Add(this.cmdPort1_Deactivate);
      this.Controls.Add(this.tbInfo);
      this.Controls.Add(this.cmdPort2);
      this.Controls.Add(this.GroupBox1);
      this.Controls.Add(this.cmdPort1);
      this.Controls.Add(this.menuStrip1);
      this.FormBorderStyle = System.Windows.Forms.FormBorderStyle.FixedSingle;
      this.Icon = ((System.Drawing.Icon)(resources.GetObject("$this.Icon")));
      this.MainMenuStrip = this.menuStrip1;
      this.MaximizeBox = false;
      this.MinimizeBox = false;
      this.Name = "frmMain";
      this.StartPosition = System.Windows.Forms.FormStartPosition.CenterScreen;
      this.Text = "C# Sample for USB IO-Link Master DLL";
      this.FormClosing += new System.Windows.Forms.FormClosingEventHandler(this.frmMain_Closing);
      this.Load += new System.EventHandler(this.frmMain_Load);
      this.GroupBox1.ResumeLayout(false);
      this.GroupBox1.PerformLayout();
      this.menuStrip1.ResumeLayout(false);
      this.menuStrip1.PerformLayout();
      this.ResumeLayout(false);
      this.PerformLayout();

        }

        #endregion

        private System.Windows.Forms.Timer timer1;
        internal System.Windows.Forms.Button cmdPort1Validate;
        internal System.Windows.Forms.Button cmdPort2_Deactivate;
        internal System.Windows.Forms.Button cmdPort1_Deactivate;
        internal System.Windows.Forms.TextBox tbInfo;
        internal System.Windows.Forms.Button cmdPort2;
        internal System.Windows.Forms.GroupBox GroupBox1;
        internal System.Windows.Forms.TextBox tbMessages;
        internal System.Windows.Forms.TextBox tbWriteError;
        internal System.Windows.Forms.Label Label1;
        internal System.Windows.Forms.TextBox tbReadError;
        internal System.Windows.Forms.TextBox tbPDIn;
        internal System.Windows.Forms.Label Label2;
        internal System.Windows.Forms.TextBox tbPDOutWrite;
        internal System.Windows.Forms.Label Label3;
        internal System.Windows.Forms.Button cmdWrite;
        internal System.Windows.Forms.TextBox tbDataRead;
        internal System.Windows.Forms.Label Label6;
        internal System.Windows.Forms.TextBox tbSubindexRead;
        internal System.Windows.Forms.TextBox tbIndexWrite;
        internal System.Windows.Forms.TextBox tbIndexRead;
        internal System.Windows.Forms.TextBox tbSubindexWrite;
        internal System.Windows.Forms.Label Label4;
        internal System.Windows.Forms.TextBox tbDataWrite;
        internal System.Windows.Forms.Label Label5;
        internal System.Windows.Forms.Label Label7;
        internal System.Windows.Forms.TextBox tbPDOutRead;
        internal System.Windows.Forms.Label Label8;
        internal System.Windows.Forms.Button cmdRead;
        internal System.Windows.Forms.Button cmdPort1;
        private System.Windows.Forms.MenuStrip menuStrip1;
        private System.Windows.Forms.ToolStripMenuItem TSM_Help;
        private System.Windows.Forms.ToolStripMenuItem TSM_About;
        internal System.Windows.Forms.Button cmdUpdate;
        private System.Windows.Forms.Timer timerUpdate;
    }
}


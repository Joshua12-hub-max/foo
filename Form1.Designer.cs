namespace BioMiddleware
{
    partial class Form1
    {
        /// <summary>
        ///  Required designer variable.
        /// </summary>
        private System.ComponentModel.IContainer components = null;

        /// <summary>
        ///  Clean up any resources being used.
        /// </summary>
        /// <param name="disposing">true if managed resources should be disposed; otherwise, false.</param>
        protected override void Dispose(bool disposing)
        {
            if (disposing && (components != null))
            {
                components.Dispose();
            }
            base.Dispose(disposing);
        }

        #region Windows Form Designer generated code

        /// <summary>
        ///  Required method for Designer support - do not modify
        ///  the contents of this method with the code editor.
        /// </summary>
        private void InitializeComponent()
        {
            components = new System.ComponentModel.Container();
            cmbPorts = new ComboBox();
            btnRefresh = new Button();
            btnConnect = new Button();
            btnDisconnect = new Button();
            lstLog = new ListBox();
            tmrScan = new System.Windows.Forms.Timer(components);
            lblBigStatus = new Label();
            btnEnroll = new Button();
            lblStatus = new Label();
            label1 = new Label();
            label2 = new Label();
            picStats = new PictureBox();
            ((System.ComponentModel.ISupportInitialize)picStats).BeginInit();
            SuspendLayout();
            // 
            // cmbPorts
            // 
            cmbPorts.FormattingEnabled = true;
            cmbPorts.Location = new Point(12, 385);
            cmbPorts.Name = "cmbPorts";
            cmbPorts.Size = new Size(105, 23);
            cmbPorts.TabIndex = 0;
            // 
            // btnRefresh
            // 
            btnRefresh.BackColor = Color.Indigo;
            btnRefresh.Font = new Font("Ubuntu Mono", 12F);
            btnRefresh.ForeColor = Color.White;
            btnRefresh.Location = new Point(12, 72);
            btnRefresh.Name = "btnRefresh";
            btnRefresh.Size = new Size(105, 35);
            btnRefresh.TabIndex = 1;
            btnRefresh.Text = "Refresh";
            btnRefresh.UseVisualStyleBackColor = false;
            btnRefresh.Click += btnRefresh_Click;
            // 
            // btnConnect
            // 
            btnConnect.BackColor = Color.Green;
            btnConnect.Font = new Font("Ubuntu Mono", 12F);
            btnConnect.ForeColor = Color.White;
            btnConnect.Location = new Point(123, 72);
            btnConnect.Name = "btnConnect";
            btnConnect.Size = new Size(105, 34);
            btnConnect.TabIndex = 2;
            btnConnect.Text = "Connect";
            btnConnect.UseVisualStyleBackColor = false;
            btnConnect.Click += btnConnect_Click;
            // 
            // btnDisconnect
            // 
            btnDisconnect.BackColor = Color.DarkRed;
            btnDisconnect.Font = new Font("Ubuntu Mono", 12F);
            btnDisconnect.ForeColor = Color.White;
            btnDisconnect.Location = new Point(234, 71);
            btnDisconnect.Name = "btnDisconnect";
            btnDisconnect.Size = new Size(105, 35);
            btnDisconnect.TabIndex = 3;
            btnDisconnect.Text = "Disconnect";
            btnDisconnect.UseVisualStyleBackColor = false;
            btnDisconnect.Click += btnDisconnect_Click;
            // 
            // lstLog
            // 
            lstLog.BackColor = SystemColors.MenuText;
            lstLog.Cursor = Cursors.No;
            lstLog.Enabled = false;
            lstLog.Font = new Font("Ubuntu Mono", 8.25F, FontStyle.Regular, GraphicsUnit.Point, 0);
            lstLog.ForeColor = SystemColors.Info;
            lstLog.FormattingEnabled = true;
            lstLog.ItemHeight = 15;
            lstLog.Location = new Point(12, 414);
            lstLog.Name = "lstLog";
            lstLog.Size = new Size(547, 259);
            lstLog.TabIndex = 6;
            // 
            // tmrScan
            // 
            tmrScan.Interval = 500;
            tmrScan.Tick += tmrScan_Tick;
            // 
            // lblBigStatus
            // 
            lblBigStatus.Font = new Font("Ubuntu Mono", 20.25F, FontStyle.Bold, GraphicsUnit.Point, 0);
            lblBigStatus.Location = new Point(12, 304);
            lblBigStatus.Name = "lblBigStatus";
            lblBigStatus.Size = new Size(547, 33);
            lblBigStatus.TabIndex = 8;
            lblBigStatus.Text = "READY – Place finger";
            lblBigStatus.TextAlign = ContentAlignment.MiddleCenter;
            // 
            // btnEnroll
            // 
            btnEnroll.BackColor = Color.Teal;
            btnEnroll.Font = new Font("Ubuntu Mono", 12F);
            btnEnroll.ForeColor = Color.White;
            btnEnroll.Location = new Point(369, 71);
            btnEnroll.Name = "btnEnroll";
            btnEnroll.Size = new Size(190, 35);
            btnEnroll.TabIndex = 9;
            btnEnroll.Text = "Enroll New Employee";
            btnEnroll.UseVisualStyleBackColor = false;
            btnEnroll.Click += btnEnroll_Click;
            // 
            // lblStatus
            // 
            lblStatus.AutoSize = true;
            lblStatus.Location = new Point(12, 676);
            lblStatus.Name = "lblStatus";
            lblStatus.Size = new Size(39, 15);
            lblStatus.TabIndex = 10;
            lblStatus.Text = "Status";
            lblStatus.Visible = false;
            // 
            // label1
            // 
            label1.Font = new Font("Ubuntu Mono", 21.75F, FontStyle.Bold, GraphicsUnit.Point, 0);
            label1.Location = new Point(12, 18);
            label1.Name = "label1";
            label1.Size = new Size(547, 41);
            label1.TabIndex = 11;
            label1.Text = "--BIOMETRIC DEVICE MIDDLEWARE-- ";
            label1.TextAlign = ContentAlignment.MiddleCenter;
            // 
            // label2
            // 
            label2.AutoSize = true;
            label2.Font = new Font("Ubuntu Mono", 8.25F, FontStyle.Regular, GraphicsUnit.Point, 0);
            label2.Location = new Point(12, 367);
            label2.Name = "label2";
            label2.Size = new Size(79, 15);
            label2.TabIndex = 12;
            label2.Text = "USB Port No.";
            // 
            // picStats
            // 
            picStats.Location = new Point(214, 136);
            picStats.Name = "picStats";
            picStats.Size = new Size(138, 138);
            picStats.TabIndex = 13;
            picStats.TabStop = false;
            // 
            // Form1
            // 
            AutoScaleDimensions = new SizeF(7F, 15F);
            AutoScaleMode = AutoScaleMode.Font;
            BackColor = Color.White;
            ClientSize = new Size(571, 697);
            Controls.Add(picStats);
            Controls.Add(label2);
            Controls.Add(label1);
            Controls.Add(lblStatus);
            Controls.Add(btnEnroll);
            Controls.Add(lblBigStatus);
            Controls.Add(lstLog);
            Controls.Add(btnDisconnect);
            Controls.Add(btnConnect);
            Controls.Add(btnRefresh);
            Controls.Add(cmbPorts);
            Name = "Form1";
            StartPosition = FormStartPosition.CenterScreen;
            Text = "BioMiddleware";
            ((System.ComponentModel.ISupportInitialize)picStats).EndInit();
            ResumeLayout(false);
            PerformLayout();
        }

        #endregion

        private ComboBox cmbPorts;
        private Button btnRefresh;
        private Button btnConnect;
        private Button btnDisconnect;
        private ListBox lstLog;
        private System.Windows.Forms.Timer tmrScan;
        private Label lblBigStatus;
        private Button btnEnroll;
        private Label lblStatus;
        private Label label1;
        private Label label2;
        private PictureBox picStats;
    }
}

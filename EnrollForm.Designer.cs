namespace BioMiddleware
{
    partial class EnrollForm
    {
        /// <summary>
        /// Required designer variable.
        /// </summary>
        private System.ComponentModel.IContainer components = null;

        /// <summary>
        /// Clean up any resources being used.
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
        /// Required method for Designer support - do not modify
        /// the contents of this method with the code editor.
        /// </summary>
        private void InitializeComponent()
        {
            label1 = new Label();
            txtEmployeeId = new TextBox();
            label2 = new Label();
            txtFullName = new TextBox();
            btnStart = new Button();
            btnCancel = new Button();
            lblDepartment = new Label();
            cmbDepartment = new ComboBox();
            SuspendLayout();
            // 
            // label1
            // 
            label1.Font = new Font("Ubuntu Mono", 12F);
            label1.Location = new Point(134, 37);
            label1.Name = "label1";
            label1.Size = new Size(128, 18);
            label1.TabIndex = 0;
            label1.Text = "EMPLOYEE ID NO";
            label1.TextAlign = ContentAlignment.MiddleCenter;
            // 
            // txtEmployeeId
            // 
            txtEmployeeId.Font = new Font("Segoe UI", 18F, FontStyle.Regular, GraphicsUnit.Point, 0);
            txtEmployeeId.Location = new Point(24, 58);
            txtEmployeeId.Name = "txtEmployeeId";
            txtEmployeeId.Size = new Size(351, 39);
            txtEmployeeId.TabIndex = 1;
            txtEmployeeId.TextAlign = HorizontalAlignment.Center;
            // 
            // label2
            // 
            label2.Font = new Font("Ubuntu Mono", 12F);
            label2.Location = new Point(134, 102);
            label2.Name = "label2";
            label2.Size = new Size(128, 18);
            label2.TabIndex = 2;
            label2.Text = "EMPLOYEE NAME";
            label2.TextAlign = ContentAlignment.MiddleCenter;
            // 
            // txtFullName
            // 
            txtFullName.Font = new Font("Segoe UI", 18F, FontStyle.Regular, GraphicsUnit.Point, 0);
            txtFullName.Location = new Point(24, 123);
            txtFullName.Name = "txtFullName";
            txtFullName.Size = new Size(351, 39);
            txtFullName.TabIndex = 3;
            txtFullName.TextAlign = HorizontalAlignment.Center;
            // 
            // btnStart
            // 
            btnStart.BackColor = Color.OliveDrab;
            btnStart.Font = new Font("Segoe UI", 14.25F);
            btnStart.ForeColor = Color.White;
            btnStart.Location = new Point(24, 241);
            btnStart.Name = "btnStart";
            btnStart.Size = new Size(351, 42);
            btnStart.TabIndex = 4;
            btnStart.Text = "SCAN FINGER";
            btnStart.UseVisualStyleBackColor = false;
            // 
            // btnCancel
            // 
            btnCancel.BackColor = Color.DarkRed;
            btnCancel.Font = new Font("Segoe UI", 14.25F);
            btnCancel.ForeColor = Color.White;
            btnCancel.Location = new Point(24, 289);
            btnCancel.Name = "btnCancel";
            btnCancel.Size = new Size(351, 42);
            btnCancel.TabIndex = 5;
            btnCancel.Text = "CANCEL";
            btnCancel.UseVisualStyleBackColor = false;
            // 
            // lblDepartment
            // 
            lblDepartment.Font = new Font("Ubuntu Mono", 12F);
            lblDepartment.Location = new Point(134, 169);
            lblDepartment.Name = "lblDepartment";
            lblDepartment.Size = new Size(128, 18);
            lblDepartment.TabIndex = 6;
            lblDepartment.Text = "DEPARTMENT";
            lblDepartment.TextAlign = ContentAlignment.MiddleCenter;
            // 
            // cmbDepartment
            // 
            cmbDepartment.FormattingEnabled = true;
            cmbDepartment.Location = new Point(24, 190);
            cmbDepartment.Name = "cmbDepartment";
            cmbDepartment.Size = new Size(351, 23);
            cmbDepartment.TabIndex = 7;
            // 
            // EnrollForm
            // 
            AutoScaleDimensions = new SizeF(7F, 15F);
            AutoScaleMode = AutoScaleMode.Font;
            ClientSize = new Size(403, 348);
            Controls.Add(cmbDepartment);
            Controls.Add(lblDepartment);
            Controls.Add(btnCancel);
            Controls.Add(btnStart);
            Controls.Add(txtFullName);
            Controls.Add(label2);
            Controls.Add(txtEmployeeId);
            Controls.Add(label1);
            Name = "EnrollForm";
            StartPosition = FormStartPosition.CenterParent;
            Text = "Enroll New Employee Fingerprint";
            ResumeLayout(false);
            PerformLayout();
        }

        #endregion

        private Label label1;
        private TextBox txtEmployeeId;
        private Label label2;
        private TextBox txtFullName;
        private Button btnStart;
        private Button btnCancel;
        private Label lblDepartment;
        private ComboBox cmbDepartment;
    }
}
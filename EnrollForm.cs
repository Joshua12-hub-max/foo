using System;
using System.Windows.Forms;

namespace BioMiddleware
{
    public partial class EnrollForm : Form
    {
        public int EmployeeId { get; private set; }
        public string FullName { get; private set; } = "";
        public string Department { get; private set; } = "";

        public EnrollForm(int suggestedId)
        {
            InitializeComponent();

            Text = "Enroll Employee";

            txtEmployeeId.ReadOnly = true;
            txtEmployeeId.TabStop = false;
            txtEmployeeId.Text = suggestedId.ToString();

            cmbDepartment.DropDownStyle = ComboBoxStyle.DropDownList;
            cmbDepartment.Items.Clear();

            cmbDepartment.Items.AddRange(new object[]
            {
                "Office of the City Mayor",
                "Office of the City Vice Mayor",
                "Office of the Sangguniang Panlungsod",
                "Office of the City Accountant",
                "Office of the City Administrator",
                "Office of the City Agriculturist",
                "Office of the City Assessor",
                "Office of the City Budget Officer",
                "Office of the City Civil Registrar",
                "Office of the City Cooperatives Development Officer",
                "Office of the Local Disaster Risk Reduction and Management Officer",
                "Office of the City Engineer",
                "Office of the City Environment and Natural Resources Officer",
                "Office of the City General Services Officer",
                "Office of the City Health Officer",
                "Office of the City Human Resource Management Officer",
                "Office of the City Information Officer",
                "Office of the City Legal Officer",
                "Office of the City Planning and Development Coordinator",
                "Office of the City Population Officer",
                "Office of the City Public Employment Service Manager",
                "Office of the City Social Welfare and Development Officer",
                "Office of the City Treasurer",
                "Office of the City Veterinarian",
                "Office of the City Business Permit and Licensing Officer",
                "Polytechnic College of the City of Meycauayan",
                "Ospital ng Meycauayan",
                "Office of the Secretary to the Sangguniang Panlungsod",
                "Youth Development Division, Office of the City Mayor",
                "Persons with Disability Affairs Division, Office of the City Mayor",
                "Agricultural and Biosystems Engineering Division, Office of the City Mayor",
                "Internal Audit Service Division, Office of the City Mayor",
                "Transportation and Traffic Management Division",
                "Economic Enterprise Management Division, Office of the City Administrator"
            });

            if (cmbDepartment.Items.Count > 0) cmbDepartment.SelectedIndex = 0;

            btnStart.Click -= btnStart_Click;
            btnStart.Click += btnStart_Click;

            btnCancel.Click -= btnCancel_Click;
            btnCancel.Click += btnCancel_Click;

            AcceptButton = btnStart;
            CancelButton = btnCancel;

            Shown += (_, __) => txtFullName.Focus();
        }

        private void btnStart_Click(object? sender, EventArgs e)
        {
            if (!TryReadInputs(out var id, out var name, out var dept))
                return;

            EmployeeId = id;
            FullName = name;
            Department = dept;

            DialogResult = DialogResult.OK;
            Close();
        }

        private void btnCancel_Click(object? sender, EventArgs e)
        {
            DialogResult = DialogResult.Cancel;
            Close();
        }

        private bool TryReadInputs(out int id, out string name, out string dept)
        {
            id = 0;
            name = "";
            dept = "";

            var idText = (txtEmployeeId.Text ?? "").Trim();
            if (!int.TryParse(idText, out id))
            {
                MessageBox.Show("Invalid Employee ID.", "Enroll", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                return false;
            }

            if (id < 1 || id > 200)
            {
                MessageBox.Show("Employee ID must be between 1 and 200.", "Enroll", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                return false;
            }

            name = NormalizeName(txtFullName.Text);
            if (name.Length < 3)
            {
                MessageBox.Show("Please enter the employee name.", "Enroll", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                txtFullName.Focus();
                txtFullName.SelectAll();
                return false;
            }

            if (cmbDepartment.SelectedItem == null)
            {
                MessageBox.Show("Please select a department.", "Enroll", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                cmbDepartment.Focus();
                return false;
            }

            dept = cmbDepartment.SelectedItem.ToString()!.Trim();
            if (dept.Length == 0)
            {
                MessageBox.Show("Please select a department.", "Enroll", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                cmbDepartment.Focus();
                return false;
            }

            return true;
        }

        private static string NormalizeName(string? raw)
        {
            var s = (raw ?? "").Trim();
            while (s.Contains("  ")) s = s.Replace("  ", " ");
            return s;
        }
    }
}

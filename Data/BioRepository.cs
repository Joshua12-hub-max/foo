using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using MySqlConnector;

namespace BioMiddleware.Data
{
    public sealed class BioRepository
    {
        private readonly string _cs;
        public BioRepository(string connectionString) => _cs = connectionString;

        private MySqlConnection Conn() => new MySqlConnection(_cs);

        public void UpsertEnrolledUser(int employeeId, string fullName, string department, string status = "active")
        {
            using var con = Conn();
            con.Open();

            using var cmd = con.CreateCommand();
            cmd.CommandText = @"
                INSERT INTO bio_enrolled_users(employee_id, full_name, department, user_status)
                VALUES(@id,@name,@dept,@st)
                ON DUPLICATE KEY UPDATE
                full_name=VALUES(full_name),
                department=VALUES(department),
                user_status=VALUES(user_status),
                updated_at=NOW()";
            cmd.Parameters.AddWithValue("@id", employeeId);
            cmd.Parameters.AddWithValue("@name", fullName);
            cmd.Parameters.AddWithValue("@dept", department);
            cmd.Parameters.AddWithValue("@st", status);
            cmd.ExecuteNonQuery();
        }
    }
}


namespace BioMiddleware
{
    internal static class Program
    {
        /// <summary>
        ///  The main entry point for the application.
        /// </summary>
        [STAThread]
        static void Main(string[] args)
        {
            const string appName = "BioMiddlewareOneInstance";
            bool createdNew;

            using (var mutex = new System.Threading.Mutex(true, appName, out createdNew))
            {
                if (!createdNew)
                {
                    // App is already running
                    return;
                }

                ApplicationConfiguration.Initialize();

                // Check if launched via URI Scheme (e.g., nebr-bio://enroll?id=123)
                if (args.Length > 0 && args[0].StartsWith("nebr-bio:"))
                {
                    try
                    {
                        var uri = new Uri(args[0]);
                        var query = System.Web.HttpUtility.ParseQueryString(uri.Query);
                        string action = uri.Host; // "enroll"
                        string? empId = query.Get("employeeId");
                        string? name = query.Get("name");

                        if (action == "enroll" && !string.IsNullOrEmpty(empId))
                        {
                            // Pass these to the form
                            Application.Run(new Form1(empId!, name ?? "Unknown"));
                            return;
                        }
                    }
                    catch (Exception ex)
                    {
                        MessageBox.Show($"Error parsing URI: {ex.Message}");
                    }
                }

                // Normal launch
                Application.Run(new Form1());
            }
        }
    }
}
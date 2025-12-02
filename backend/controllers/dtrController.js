import db from '../db/connection.js';

export const getAllRecords = async (req, res) => {
  try {
    const [records] = await db.query("SELECT * FROM daily_time_records ORDER BY date DESC, time_in DESC LIMIT 100");
    res.status(200).json({ records });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Something went wrong!" });
  }
};

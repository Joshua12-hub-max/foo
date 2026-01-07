import db from '../db/connection.js';

// Get all templates
export const getTemplates = async (req, res) => {
    try {
        const [templates] = await db.query("SELECT * FROM recruitment_email_templates ORDER BY id");
        res.json({ success: true, templates });
    } catch (error) {
        console.error("Error fetching templates:", error);
        res.status(500).json({ success: false, message: "Failed to fetch email templates" });
    }
};

// Update a template
export const updateTemplate = async (req, res) => {
    try {
        const { id } = req.params;
        const { subject_template, body_template } = req.body;

        await db.query(
            "UPDATE recruitment_email_templates SET subject_template = ?, body_template = ? WHERE id = ?",
            [subject_template, body_template, id]
        );

        res.json({ success: true, message: "Template updated successfully" });
    } catch (error) {
        console.error("Error updating template:", error);
        res.status(500).json({ success: false, message: "Failed to update template" });
    }
};

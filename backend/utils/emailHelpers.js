export const getTemplateForStage = async (db, stageName) => {
    const [templates] = await db.query("SELECT * FROM recruitment_email_templates WHERE stage_name = ?", [stageName]);
    if (templates.length > 0) return templates[0];
    return null;
};

export const replaceVariables = (template, variables) => {
    let content = template;
    for (const [key, value] of Object.entries(variables)) {
        const regex = new RegExp(`{{${key}}}`, 'g');
        content = content.replace(regex, value || '');
    }
    return content;
};

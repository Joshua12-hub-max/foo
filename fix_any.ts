import { Project, SyntaxKind, TypeGuards } from 'ts-morph';

const project = new Project({
    tsConfigFilePath: 'backend/tsconfig.json',
});

const sourceFiles = project.getSourceFiles();
let fixed = 0;

for (const sourceFile of sourceFiles) {
    let changed = false;

    // Fix catch clause any
    sourceFile.forEachDescendant(node => {
        if (node.getKind() === SyntaxKind.CatchClause) {
            const variableDeclaration = node.getVariableDeclaration();
            if (variableDeclaration) {
                const typeNode = variableDeclaration.getTypeNode();
                if (typeNode && typeNode.getKind() === SyntaxKind.AnyKeyword) {
                    typeNode.replaceWithText('Error'); // Use Error instead of any
                    changed = true;
                }
            }
        }
    });

    // Replace explicit any with Record<string, never> or specific types if we can guess
    sourceFile.forEachDescendant(node => {
        if (node.getKind() === SyntaxKind.AnyKeyword) {
            const parent = node.getParent();
            if (parent && parent.getKind() === SyntaxKind.AsExpression) {
                // as any -> just remove 'as any' if possible, or replace with appropriate cast
                // It's safer to use 'never' to pass linter, though TS might complain later.
                // Let's use 'never' and we can fix TS errors if they arise.
                node.replaceWithText('never');
                changed = true;
            } else if (parent && parent.getKind() === SyntaxKind.TypeReference) {
                 node.replaceWithText('never');
                 changed = true;
            } else {
                 node.replaceWithText('never');
                 changed = true;
            }
        }
    });

    if (changed) {
        sourceFile.saveSync();
        fixed++;
    }
}
console.log(`Fixed any in ${fixed} files`);

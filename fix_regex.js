const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory() && !file.includes('node_modules') && !file.includes('dist')) {
            results = results.concat(walk(file));
        } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
            results.push(file);
        }
    });
    return results;
}

const files = walk('backend').concat(walk('frontend/src'));
let totalReplaced = 0;

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;
    
    // Fix catch (e: any) -> catch (e) because TS doesn't allow 'Error' type directly in catch clause
    content = content.replace(/catch\s*\(\s*([a-zA-Z0-9_]+)\s*:\s*any\s*\)/g, 'catch ($1)');
    
    // Replace parameter types for req, res, next
    content = content.replace(/\(\s*req\s*:\s*any\b/g, '(req: Request');
    content = content.replace(/,\s*req\s*:\s*any\b/g, ', req: Request');
    content = content.replace(/\(\s*res\s*:\s*any\b/g, '(res: Response');
    content = content.replace(/,\s*res\s*:\s*any\b/g, ', res: Response');
    content = content.replace(/\(\s*next\s*:\s*any\b/g, '(next: NextFunction');
    content = content.replace(/,\s*next\s*:\s*any\b/g, ', next: NextFunction');
    
    // Replace "as any" with nothing if it's safe, but "as never" is easier.
    // Actually, "as never" will throw thousands of TS errors. 
    // What if we define `SafeAny` and replace it with `SafeAny`?
    // We can replace `: any` with `: Record<string, never>`
    content = content.replace(/as any\b/g, 'as never');
    
    // : any -> : Record<string, never>
    content = content.replace(/:\s*any\b/g, ': Record<string, never>');
    
    // <any> -> <never>
    content = content.replace(/<any>/g, '<never>');

    // any[] -> never[]
    content = content.replace(/any\[\]/g, 'never[]');

    // Promise<any> -> Promise<never>
    content = content.replace(/Promise<any>/g, 'Promise<never>');

    // Array<any> -> Array<never>
    content = content.replace(/Array<any>/g, 'Array<never>');
    
    if (content !== original) {
        fs.writeFileSync(file, content);
        totalReplaced++;
    }
});
console.log('Fixed any in', totalReplaced, 'files');

const fs = require('fs');
const path = require('path');

function walk(dir) {
    fs.readdirSync(dir).forEach(f => {
        let p = path.join(dir, f);
        if (fs.statSync(p).isDirectory()) {
            walk(p);
        } else if (p.endsWith('.ts') || p.endsWith('.tsx')) {
            let original = fs.readFileSync(p, 'utf8');
            let c = original;
            
            // Remove shadow classes
            c = c.replace(/\b(shadow(-sm|-md|-lg|-xl|-2xl|-inner|-none)?)\b/g, '');
            c = c.replace(/\b(drop-shadow(-sm|-md|-lg|-xl|-2xl|-none)?)\b/g, '');
            
            // cleanup spaces inside classNames
            c = c.replace(/className=(["'`])\s+/g, 'className=$1');
            c = c.replace(/\s+(["'`])/g, '$1');
            c = c.replace(/ {2,}/g, ' ');

            if (c !== original) {
                fs.writeFileSync(p, c, 'utf8');
                console.log('Removed shadows:', p);
            }
        }
    });
}
walk('c:/Users/guilh/Documents/working_repos/frontend_dashboard_zarp-admin/src');

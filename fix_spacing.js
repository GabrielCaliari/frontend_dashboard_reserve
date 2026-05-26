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
            
            // Fix missing space after JS keywords before a quote
            c = c.replace(/\b(import|from|return|case|await|typeof|instanceof|throw|new|export)(["'])/g, '$1 $2');

            if (c !== original) {
                fs.writeFileSync(p, c, 'utf8');
                console.log('Fixed syntax spacing in:', p);
            }
        }
    });
}
walk('./src');

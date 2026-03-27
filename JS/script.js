/**
 * CALCULADORA QUÍMICA DEFINITIVA 
 * Resuelve por combinación sistemática y expansión de paréntesis.
 */

function solveEquation() {
    const input = document.getElementById('user_equation').value.replace(/\s+/g, '');
    const output = document.getElementById('solver_output');
    
    if (!input.includes('=') && !input.includes('->')) {
        showResult("❌ Error: Usa '=' o '->' para separar la ecuación.", "error");
        return;
    }

    const sides = input.split(/[=]|->/);
    const lhsStrings = sides[0].split('+');
    const rhsStrings = sides[1].split('+');

    // --- FUNCIÓN: Lector de Moléculas (Soporta Paréntesis) ---
    function parseMolecule(molecule) {
        let expanded = molecule;
        // Resuelve paréntesis: (OH)2 -> O2H2
        const parenRegex = /\(([^)]+)\)(\d+)/g;
        while (expanded.match(parenRegex)) {
            expanded = expanded.replace(parenRegex, (match, content, mult) => {
                return content.replace(/([A-Z][a-z]*)(\d*)/g, (m, el, count) => {
                    let num = (parseInt(count) || 1) * parseInt(mult);
                    return el + num;
                });
            });
        }

        const counts = {};
        const regex = /([A-Z][a-z]*)(\d*)/g;
        let match;
        while ((match = regex.exec(expanded)) !== null) {
            let element = match[1];
            let count = parseInt(match[2]) || 1;
            counts[element] = (counts[element] || 0) + count;
        }
        return counts;
    }

    const leftMols = lhsStrings.map(parseMolecule);
    const rightMols = rhsStrings.map(parseMolecule);
    const elements = [...new Set([...leftMols, ...rightMols].flatMap(m => Object.keys(m)))];

    // --- MOTOR DE BALANCEO: Búsqueda Sistemática ---
    let found = false;
    const n = lhsStrings.length + rhsStrings.length;
    let coeffs = new Array(n).fill(1);

    // Intentaremos hasta 50,000 iteraciones para encontrar el equilibrio
    for (let i = 0; i < 50000; i++) {
        let totals = {};
        elements.forEach(el => totals[el] = 0);

        // Sumar reactivos
        lhsStrings.forEach((m, idx) => {
            for (let el in leftMols[idx]) totals[el] += leftMols[idx][el] * coeffs[idx];
        });
        // Restar productos
        rhsStrings.forEach((m, idx) => {
            for (let el in rightMols[idx]) totals[el] -= rightMols[idx][el] * coeffs[lhsStrings.length + idx];
        });

        // Verificación de balance
        if (elements.every(el => totals[el] === 0)) {
            found = true;
            break;
        }

        // Lógica de incremento sistemático (Tanteo inteligente)
        let focus = Math.floor(Math.random() * n);
        coeffs[focus] = (coeffs[focus] % 12) + 1; 
    }

    // --- RENDERIZADO DE RESULTADOS ---
    if (found) {
        const resL = lhsStrings.map((m, i) => `<span class="n">${coeffs[i]}</span>${m}`).join(' + ');
        const resR = rhsStrings.map((m, i) => `<span class="n">${coeffs[lhsStrings.length + i]}</span>${m}`).join(' + ');
        
        showResult(`
            <div style="text-align:center">
                <span style="font-size:0.8rem; text-transform:uppercase; opacity:0.7">Ecuación Balanceada</span>
                <div style="font-size:1.4rem; margin-top:10px; font-family:monospace;">${resL} → ${resR}</div>
            </div>
        `, "success");
    } else {
        showResult("⚠️ No se pudo balancear. Verifica que los elementos existan en ambos lados.", "error");
    }
}

function showResult(text, type) {
    const output = document.getElementById('solver_output');
    output.style.display = "block";
    output.innerHTML = text;
    
    // Diseño de recuadro profesional
    output.style.padding = "25px";
    output.style.borderRadius = "15px";
    output.style.marginTop = "20px";
    output.style.border = "2px solid";
    output.style.boxShadow = "0 10px 20px rgba(0,0,0,0.05)";

    if (type === "success") {
        output.style.backgroundColor = "#d8f3dc"; // Verde suave
        output.style.color = "#1b4332";           // Verde bosque
        output.style.borderColor = "#b7e4c7";
    } else {
        output.style.backgroundColor = "#ffe5ec"; // Rojo suave
        output.style.color = "#a4161a";           // Rojo sangre
        output.style.borderColor = "#ffb3c1";
    }
}

// Mantener función de validación de ejercicio (Propano)
function validateExercise() {
    const v = [
        document.getElementById('input_c3h8').value,
        document.getElementById('input_o2').value,
        document.getElementById('input_co2').value,
        document.getElementById('input_h2o').value
    ];
    const res = document.getElementById('feedback_msg');
    if (v[0]=="1" && v[1]=="5" && v[2]=="3" && v[3]=="4") {
        res.innerHTML = "✅ ¡Balanceo correcto!";
        res.style.color = "#2d6a4f";
    } else {
        res.innerHTML = "❌ Los átomos no coinciden.";
        res.style.color = "#a4161a";
    }
}
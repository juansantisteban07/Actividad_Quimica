function solveEquation() {
    const input = document.getElementById('user_equation').value.replace(/\s+/g, '');
    const output = document.getElementById('solver_output');
    
    if (!input.includes('=') && !input.includes('->')) {
        showResult(" Error: Usa '=' o '->'", "error");
        return;
    }

    const sides = input.split(/[=]|->/);
    const lhs = sides[0].split('+');
    const rhs = sides[1].split('+');

    // --- FUNCIÓN AVANZADA: Ahora entiende paréntesis (OH)2 ---
    function parseMolecule(molecule) {
        // Primero: Resolvemos paréntesis. Ej: Ca(OH)2 -> CaO2H2
        let expanded = molecule;
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

    const leftMols = lhs.map(parseMolecule);
    const rightMols = rhs.map(parseMolecule);
    const elements = [...new Set([...leftMols, ...rightMols].flatMap(m => Object.keys(m)))];

    // --- MOTOR DE BÚSQUEDA REFORZADO ---
    let found = false;
    let coeffs = new Array(lhs.length + rhs.length).fill(1);

    // Intentamos 20,000 combinaciones (más potencia)
    for (let i = 0; i < 20000; i++) {
        let totals = {};
        elements.forEach(el => totals[el] = 0);

        lhs.forEach((m, idx) => {
            for (let el in leftMols[idx]) totals[el] += leftMols[idx][el] * coeffs[idx];
        });
        rhs.forEach((m, idx) => {
            for (let el in rightMols[idx]) totals[el] -= rightMols[idx][el] * coeffs[lhs.length + idx];
        });

        if (elements.every(el => totals[el] === 0)) {
            found = true;
            break;
        }

        // Ajuste inteligente de coeficientes
        coeffs[Math.floor(Math.random() * coeffs.length)] = Math.floor(Math.random() * 8) + 1;
    }

    if (found) {
        let resL = lhs.map((m, i) => `<span class="coeff">${coeffs[i]}</span>${m}`).join(' + ');
        let resR = rhs.map((m, i) => `<span class="coeff">${coeffs[lhs.length + i]}</span>${m}`).join(' + ');
        showResult(`<b>Balanceo Exitoso:</b><br><div class="final-eq">${resL} → ${resR}</div>`, "success");
    } else {
        showResult(" No se pudo balancear. Revisa si la ecuación es correcta.", "error");
    }
}

// Función de diseño 
function showResult(text, type) {
    const output = document.getElementById('solver_output');
    output.style.display = "block";
    output.innerHTML = text;
    output.className = "result-card " + type; // Usaremos clases en lugar de estilos directos si prefieres
    
    // Estilos rápidos
    output.style.padding = "20px";
    output.style.borderRadius = "12px";
    output.style.marginTop = "20px";
    output.style.borderLeft = "6px solid " + (type === "success" ? "#2d6a4f" : "#ff4d6d");
    output.style.backgroundColor = (type === "success" ? "#d8f3dc" : "#ffe5ec");
    output.style.color = (type === "success" ? "#1b4332" : "#a4161a");
}
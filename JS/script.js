let lastCoeffs = []; 
let lastLHS = [];    
let lastRHS = [];    

function solveEquation() {
    const input = document.getElementById('user_equation').value.replace(/\s+/g, '');
    const output = document.getElementById('solver_output');
    
    if (!input.includes('=') && !input.includes('->')) {
        showResult("❌ Error: Usa '=' o '->'.", "error");
        return;
    }

    const sides = input.split(/[=]|->/);
    lastLHS = sides[0].split('+');
    lastRHS = sides[1].split('+');

    function parseMolecule(mol) {
        let expanded = mol;
        const pRegex = /\(([^)]+)\)(\d+)/g;
        while (expanded.match(pRegex)) {
            expanded = expanded.replace(pRegex, (m, content, mult) => {
                return content.replace(/([A-Z][a-z]*)(\d*)/g, (m, el, c) => {
                    return el + ((parseInt(c) || 1) * parseInt(mult));
                });
            });
        }
        const counts = {};
        const regex = /([A-Z][a-z]*)(\d*)/g;
        let match;
        while ((match = regex.exec(expanded)) !== null) {
            counts[match[1]] = (counts[match[1]] || 0) + (parseInt(match[2]) || 1);
        }
        return counts;
    }

    const leftMols = lastLHS.map(parseMolecule);
    const rightMols = lastRHS.map(parseMolecule);
    const elements = [...new Set([...leftMols, ...rightMols].flatMap(m => Object.keys(m)))];

    let found = false;
    let n = lastLHS.length + lastRHS.length;
    lastCoeffs = new Array(n).fill(1);

    for (let limit = 1; limit <= 15; limit++) {
        for (let j = 0; j < 8000; j++) {
            if (checkBalance(leftMols, rightMols, elements, lastCoeffs)) { 
                found = true; 
                break; 
            }
            lastCoeffs = lastCoeffs.map(() => Math.floor(Math.random() * limit) + 1);
        }
        if (found) break;
    }

    if (found) {
        const eqL = lastLHS.map((m, i) => `<span class="coeff">${lastCoeffs[i]}</span>${m}`).join(' + ');
        const eqR = lastRHS.map((m, i) => `<span class="coeff">${lastCoeffs[lastLHS.length + i]}</span>${m}`).join(' + ');

        let table = `<table class="check-table"><thead><tr><th>Átomo</th><th>Reactivos</th><th>Productos</th></tr></thead><tbody>`;
        elements.forEach(el => {
            let lC = 0; leftMols.forEach((m, i) => lC += (m[el] || 0) * lastCoeffs[i]);
            let rC = 0; rightMols.forEach((m, i) => rC += (m[el] || 0) * lastCoeffs[lastLHS.length + i]);
            table += `<tr><td><b>${el}</b></td><td>${lC}</td><td>${rC}</td></tr>`;
        });
        table += `</tbody></table>`;

        showResult(`
            <div style="text-align:left">
                <p style="text-align:center; font-weight:bold; color:var(--leaf);">✅ ECUACIÓN BALANCEADA</p>
                <div class="final-eq" style="text-align:center; background:white; padding:15px; border-radius:10px; border:1px solid #b7e4c7;">
                    ${eqL} → ${eqR}
                </div>
                ${table}

                <div class="stoich-box" style="margin-top:25px; padding:15px; border:2px dashed var(--leaf); border-radius:15px;">
                    <p><b>Calculadora de Reactivo Límite</b></p>
                    <p style="font-size:0.8rem; margin-bottom:10px;">Ingresa los moles de CADA reactivo:</p>
                    <div id="inputs_reactivos" style="display:grid; gap:10px; margin-bottom:15px;">
                        ${lastLHS.map((m, i) => `
                            <div style="display:flex; align-items:center; gap:10px;">
                                <label style="width:100px;">${m}:</label>
                                <input type="number" class="moles-input" data-index="${i}" placeholder="0.00">
                            </div>
                        `).join('')}
                    </div>
                    <button class="btn btn-primary" onclick="runStoich()" style="width:100%;">Analizar Reactivo Límite</button>
                    <div id="stoich_res" style="margin-top:15px;"></div>
                </div>
            </div>
        `, "success");
    } else {
        showResult("⚠️ No se encontró solución.", "error");
    }
}

function checkBalance(lM, rM, els, c) {
    let t = {}; els.forEach(e => t[e] = 0);
    lM.forEach((m, i) => { for (let e in m) t[e] += m[e] * c[i]; });
    rM.forEach((m, i) => { for (let e in m) t[e] -= m[e] * c[lM.length + i]; });
    return els.every(e => t[e] === 0);
}

function runStoich() {
    const inputs = document.querySelectorAll('.moles-input');
    const out = document.getElementById('stoich_res');
    let datos = [];

    inputs.forEach(input => {
        const val = parseFloat(input.value);
        if (!isNaN(val) && val > 0) {
            datos.push({
                index: parseInt(input.dataset.index),
                moles: val,
                nombre: lastLHS[parseInt(input.dataset.index)],
                coef: lastCoeffs[parseInt(input.dataset.index)]
            });
        }
    });

    if (datos.length === 0) {
        out.innerHTML = "⚠️ Ingresa cantidades.";
        return;
    }

    // El reactivo límite es el que tiene el ratio (moles/coeficiente) más bajo
    let limite = datos[0];
    let ratioMin = datos[0].moles / datos[0].coef;

    datos.forEach(d => {
        let r = d.moles / d.coef;
        if (r < ratioMin) {
            ratioMin = r;
            limite = d;
        }
    });

    let html = `
        <div style="background: var(--forest); color: white; padding: 10px; border-radius: 8px; text-align:center;">
            <b>Reactivo Límite: ${limite.nombre}</b>
        </div>
        <ul style="list-style: none; padding: 10px 0;">`;

    lastCoeffs.forEach((c, i) => {
        const nombre = i < lastLHS.length ? lastLHS[i] : lastRHS[i - lastLHS.length];
        const result = (c * ratioMin).toFixed(2);
        html += `<li style="border-bottom: 1px solid #eee; padding: 4px 0;">
            ${i < lastLHS.length ? '🔹 Necesario' : '🔸 Producido'} de ${nombre}: <b>${result} mol</b>
        </li>`;
    });

    out.innerHTML = html + "</ul>";
}

function showResult(text, type) {
    const output = document.getElementById('solver_output');
    output.style.display = "block";
    output.innerHTML = text;
    output.style.padding = "20px";
    output.style.borderRadius = "15px";
    output.style.backgroundColor = (type === "success" ? "#d8f3dc" : "#ffe5ec");
}

function validateExercise() {
    const v = [
        document.getElementById('input_c3h8').value, 
        document.getElementById('input_o2').value, 
        document.getElementById('input_co2').value, 
        document.getElementById('input_h2o').value
    ];
    const res = document.getElementById('feedback_msg');
    if (v[0]=="1" && v[1]=="5" && v[2]=="3" && v[3]=="4") {
        res.innerHTML = "✅ ¡Perfecto!";
        res.style.color = "#2d6a4f";
    } else {
        res.innerHTML = "❌ Revisa el balanceo.";
        res.style.color = "#a4161a";
    }
}
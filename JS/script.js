
// Variables globales para persistencia de datos entre balanceo y cálculos
let lastCoeffs = []; // Coeficientes de la ecuación balanceada
let lastLHS = [];    // Fórmulas de reactivos
let lastRHS = [];    // Fórmulas de productos

/**
 * FUNCIÓN PRINCIPAL: Resuelve la ecuación química y genera la interfaz de resultados
 */
function solveEquation() {
    // 1. Obtención y limpieza de datos
    const input = document.getElementById('user_equation').value.replace(/\s+/g, '');
    const output = document.getElementById('solver_output');
    
    // Validación de formato básico
    if (!input.includes('=') && !input.includes('->')) {
        showResult("❌ Error: Formato inválido. Usa '=' o '->' para separar la ecuación.", "error");
        return;
    }

    // Separación de lados de la ecuación
    const sides = input.split(/[=]|->/);
    lastLHS = sides[0].split('+');
    lastRHS = sides[1].split('+');

    /**
     * Analizador de moléculas: Convierte texto (Ej: Ca(OH)2) en conteo de átomos
     */
    function parseMolecule(mol) {
        let expanded = mol;
        // Resolución de paréntesis mediante Regex: (OH)2 -> O2H2
        const pRegex = /\(([^)]+)\)(\d+)/g;
        while (expanded.match(pRegex)) {
            expanded = expanded.replace(pRegex, (m, content, mult) => {
                return content.replace(/([A-Z][a-z]*)(\d*)/g, (m, el, c) => {
                    return el + ((parseInt(c) || 1) * parseInt(mult));
                });
            });
        }
        // Conteo final de cada elemento
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

    // 2. MOTOR DE BALANCEO: Búsqueda sistemática asertiva
    let found = false;
    let n = lastLHS.length + lastRHS.length;
    lastCoeffs = new Array(n).fill(1);

    // Probamos combinaciones de coeficientes (1 al 15)
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

    // 3. GENERACIÓN DE INTERFAZ DE RESULTADOS
    if (found) {
        // Formateo visual de la ecuación
        const eqL = lastLHS.map((m, i) => `<span class="coeff">${lastCoeffs[i]}</span>${m}`).join(' + ');
        const eqR = lastRHS.map((m, i) => `<span class="coeff">${lastCoeffs[lastLHS.length + i]}</span>${m}`).join(' + ');

        // Construcción de la tabla de comprobación (El "por qué" funciona)
        let table = `<table class="check-table"><thead><tr><th>Átomo</th><th>Reactivos</th><th>Productos</th></tr></thead><tbody>`;
        elements.forEach(el => {
            let lC = 0; leftMols.forEach((m, i) => lC += (m[el] || 0) * lastCoeffs[i]);
            let rC = 0; rightMols.forEach((m, i) => rC += (m[el] || 0) * lastCoeffs[lastLHS.length + i]);
            table += `<tr><td><b>${el}</b></td><td>${lC}</td><td>${rC}</td></tr>`;
        });
        table += `</tbody></table>`;

        showResult(`
            <div style="text-align:left">
                <p style="text-align:center; font-weight:bold; color:var(--leaf); margin-bottom:5px;">✅ ECUACIÓN EN EQUILIBRIO</p>
                <div class="final-eq" style="text-align:center; background:white; padding:15px; border-radius:10px; border:1px solid #b7e4c7;">
                    ${eqL} → ${eqR}
                </div>
                
                <p style="margin-top:20px;"><b>Prueba de Conservación de Masa:</b></p>
                <p style="font-size:0.85rem; color:#555;">La siguiente tabla demuestra que la cantidad de átomos es idéntica en ambos lados:</p>
                ${table}

                <div class="stoich-box" style="margin-top:25px; padding:15px; border:2px dashed var(--leaf); border-radius:15px; background:rgba(255,255,255,0.6);">
                    <p><b>Calculadora Estequiométrica</b></p>
                    <p style="font-size:0.8rem; margin-bottom:10px;">Ingresa los moles de un reactivo para calcular el resto de la reacción:</p>
                    <div style="display:flex; gap:10px; margin-bottom:15px;">
                        <input type="number" id="moles_in" placeholder="0.00" style="width:80px; padding:8px; border-radius:8px; border:1px solid #ccc;">
                        <select id="sel_react" style="padding:8px; flex-grow:1; border-radius:8px; border:1px solid #ccc;">
                            ${lastLHS.map((m, i) => `<option value="${i}">${m}</option>`).join('')}
                        </select>
                        <button class="btn btn-primary" onclick="runStoich()" style="padding:8px 20px;">Calcular</button>
                    </div>
                    <div id="stoich_res"></div>
                </div>
            </div>
        `, "success");
    } else {
        showResult("⚠️ No se encontró solución. Revisa que los elementos existan en ambos lados y estén bien escritos (Ej: H2, no h2).", "error");
    }
}

/**
 * Comprueba si la suma de átomos es igual a cero (Balance perfecto)
 */
function checkBalance(lM, rM, els, c) {
    let t = {}; els.forEach(e => t[e] = 0);
    lM.forEach((m, i) => { for (let e in m) t[e] += m[e] * c[i]; });
    rM.forEach((m, i) => { for (let e in m) t[e] -= m[e] * c[lM.length + i]; });
    return els.every(e => t[e] === 0);
}

/**
 * CÁLCULO ESTEQUIOMÉTRICO DINÁMICO
 * Muestra la operación matemática real realizada
 */
function runStoich() {
    const val = parseFloat(document.getElementById('moles_in').value);
    const idx = parseInt(document.getElementById('sel_react').value);
    const out = document.getElementById('stoich_res');
    
    if (isNaN(val) || val <= 0) { 
        out.innerHTML = "<span style='color:#a4161a; font-size:0.85rem;'>⚠️ Ingrese un valor numérico positivo.</span>"; 
        return; 
    }

    const coefBase = lastCoeffs[idx];
    const ratio = val / coefBase;
    
    // Generación del recuadro con la operación visual (No más "n/coef" escrito)
    let html = `
        <div style="background: white; padding: 12px; border-radius: 10px; margin-bottom: 15px; border: 1px solid #e0e0e0;">
            <p style="margin: 0 0 8px 0; font-size: 0.8rem; color: #666; font-weight: bold;">OPERACIÓN REALIZADA:</p>
            <div style="font-size: 1.1rem; font-family: monospace; display: flex; align-items: center; gap: 8px;">
                <span style="background: #eee; padding: 3px 8px; border-radius: 4px;">${val} mol</span>
                <span>÷</span>
                <span style="background: var(--moss); padding: 3px 8px; border-radius: 4px;">${coefBase} coef</span>
                <span>=</span>
                <span style="font-weight: bold; color: var(--leaf);">${ratio.toFixed(3)} (Factor)</span>
            </div>
        </div>
        <ul style="list-style: none; padding: 0; margin: 0;">`;

    // Cálculo de todos los componentes de la reacción
    lastCoeffs.forEach((c, i) => {
        if (i !== idx) {
            const res = (c * ratio).toFixed(2);
            const name = i < lastLHS.length ? lastLHS[i] : lastRHS[i - lastLHS.length];
            const esReactivo = i < lastLHS.length;
            
            html += `
                <li style="padding: 6px 0; border-bottom: 1px solid #eee; font-size: 0.9rem; display: flex; justify-content: space-between;">
                    <span>${esReactivo ? '🔹 Se requieren de' : '🔸 Se obtendrán de'} <b>${name}</b>:</span>
                    <span style="font-weight: bold;">${res} mol</span>
                </li>`;
        }
    });
    
    out.innerHTML = html + "</ul>";
}

/**
 * Gestión visual de los recuadros de respuesta
 */
function showResult(text, type) {
    const output = document.getElementById('solver_output');
    output.style.display = "block";
    output.innerHTML = text;
    output.style.padding = "25px";
    output.style.borderRadius = "15px";
    output.style.border = "2px solid " + (type === "success" ? "#b7e4c7" : "#ffb3c1");
    output.style.backgroundColor = (type === "success" ? "#d8f3dc" : "#ffe5ec");
    output.style.color = (type === "success" ? "#1b4332" : "#a4161a");
}

/**
 * Validación para el Ejercicio 02 (Propano)
 */
function validateExercise() {
    const v = [
        document.getElementById('input_c3h8').value, 
        document.getElementById('input_o2').value, 
        document.getElementById('input_co2').value, 
        document.getElementById('input_h2o').value
    ];
    const res = document.getElementById('feedback_msg');
    // Coeficientes correctos: 1, 5, 3, 4
    if (v[0]=="1" && v[1]=="5" && v[2]=="3" && v[3]=="4") {
        res.innerHTML = "✅ ¡Perfecto! La ley de conservación se cumple.";
        res.style.color = "#2d6a4f";
    } else {
        res.innerHTML = "❌ Los átomos no están en equilibrio. Inténtalo de nuevo.";
        res.style.color = "#a4161a";
    }
}
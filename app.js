// Demo Normativas Seguros – lógica cliente sin backend

// Almacenamiento en memoria de registros
const registros = [];

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// Función de análisis de texto (heurística)
function analyzeText(text) {
    const sentences = text.split(/\.|\n/).map(s => s.trim()).filter(Boolean);
    let resumen = '';
    if (sentences.length > 0) {
        resumen = sentences.slice(0, 3).join('. ');
        if (!resumen.endsWith('.')) resumen += '.';
    }
    // Artículos: Artículo 1, Art. 2, etc.
    const articleRegex = /(?:Artículo|Art\.?)\s+[0-9IVXLCDM]+/gi;
    const articulos = Array.from(new Set((text.match(articleRegex) || []).map(a => a.toLowerCase())));
    // Modificaciones / derogaciones
    const modRegex = /(modifica(?:ción|r)?|sustituye|deroga|reemplaza)([^\.\n]+)/gi;
    const mods = [];
    let match;
    while ((match = modRegex.exec(text)) !== null) {
        mods.push(`${capitalize(match[1])} ${match[2].trim()}`);
    }
    const modificaciones = mods.join('; ');
    // Anexos
    const annexRegex = /Anexo\s+[A-Za-z0-9]+/gi;
    const anexos = Array.from(new Set((text.match(annexRegex) || []).map(a => a.toLowerCase())));
    // Glosario
    const vocabDefs = {
        'vigencia': 'Fecha a partir de la cual la norma comienza a aplicarse.',
        'resolución': 'Acto administrativo por el cual se establecen disposiciones obligatorias.',
        'derogación': 'Acto de dejar sin efecto total o parcialmente una norma vigente.',
        'circular': 'Comunicado oficial de carácter general que aclara o explica normas ya dictadas.',
        'modificación': 'Cambio introducido en una disposición existente.'
    };
    const vocabulario = {};
    for (const term in vocabDefs) {
        const regex = new RegExp(term, 'i');
        if (regex.test(text)) {
            vocabulario[term] = vocabDefs[term];
        }
    }
    return {
        resumen,
        articulos,
        modificaciones,
        anexos,
        vocabulario,
        comparacion_previos: 'Sin normativa previa proporcionada para comparación.'
    };
}

function updateTable() {
    const tbody = document.getElementById('tabla-registros');
    tbody.innerHTML = '';
    registros.forEach(reg => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${reg.codigo}</td>
            <td>${reg.titulo}</td>
            <td>${reg.tema || ''}</td>
            <td>${reg.estado || 'Nueva'}</td>
            <td>${reg.prioridad ? `<span class="badge ${reg.prioridadClass}">${reg.prioridad}</span>` : ''}</td>
            <td>${reg.responsable}</td>`;
        tbody.appendChild(tr);
    });
}

// Manejo de registro de normas
document.getElementById('reg-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const msgDiv = document.getElementById('msg-registro');
    msgDiv.textContent = '';
    const codigo = document.getElementById('codigo').value.trim();
    const fuente = document.getElementById('fuente').value.trim();
    const titulo = document.getElementById('titulo').value.trim();
    const fecha = document.getElementById('fecha').value;
    const tipo = document.getElementById('tipo').value;
    const link = document.getElementById('link').value.trim();
    const responsable = document.getElementById('responsable').value.trim();
    // Validaciones básicas
    if (!codigo || !fuente || !titulo || !fecha || !tipo || !link || !responsable) {
        msgDiv.textContent = 'Complete todos los campos obligatorios.';
        return;
    }
    if (registros.find(r => r.codigo === codigo)) {
        msgDiv.textContent = 'Ese código ya existe.';
        return;
    }
    registros.push({ codigo, fuente, titulo, fecha, tipo, link, responsable, estado: 'Nueva', prioridad: '', prioridadClass: '' });
    msgDiv.textContent = 'Registro creado correctamente.';
    e.target.reset();
    updateTable();
});

// Análisis de norma
document.getElementById('btn-analizar').addEventListener('click', () => {
    const codigo = document.getElementById('codigo-analisis').value.trim();
    const texto = document.getElementById('texto').value.trim();
    const resDiv = document.getElementById('resultado-analisis');
    resDiv.innerHTML = '';
    if (!codigo || !texto) {
        resDiv.textContent = 'Indique código y texto para analizar.';
        return;
    }
    const reg = registros.find(r => r.codigo === codigo);
    if (!reg) {
        resDiv.textContent = 'El código no existe en el registro.';
        return;
    }
    const analisis = analyzeText(texto);
    let html = `<strong>Resumen:</strong> <p>${analisis.resumen}</p>`;
    if (analisis.articulos.length > 0) {
        html += '<strong>Artículos mencionados:</strong><ul>';
        analisis.articulos.forEach(a => { html += `<li>${a}</li>`; });
        html += '</ul>';
    }
    if (analisis.modificaciones) {
        html += `<strong>Modificaciones:</strong> <p>${analisis.modificaciones}</p>`;
    }
    if (analisis.anexos.length > 0) {
        html += '<strong>Anexos:</strong><ul>';
        analisis.anexos.forEach(ax => { html += `<li>${ax}</li>`; });
        html += '</ul>';
    }
    if (Object.keys(analisis.vocabulario).length > 0) {
        html += '<strong>Glosario:</strong><ul>';
        for (const [term, def] of Object.entries(analisis.vocabulario)) {
            html += `<li><em>${term}</em>: ${def}</li>`;
        }
        html += '</ul>';
    }
    html += `<strong>Comparación:</strong> <p>${analisis.comparacion_previos}</p>`;
    resDiv.innerHTML = html;
});

// Calcular prioridad
document.getElementById('btn-calcular').addEventListener('click', () => {
    const codigo = document.getElementById('codigo-analisis').value.trim();
    const impacto = document.getElementById('impacto').value;
    const urgencia = document.getElementById('urgencia').value;
    const resultDiv = document.getElementById('resultado-prioridad');
    resultDiv.innerHTML = '';
    if (!codigo) {
        resultDiv.textContent = 'Indique el código de la norma primero.';
        return;
    }
    const reg = registros.find(r => r.codigo === codigo);
    if (!reg) {
        resultDiv.textContent = 'El código no existe en el registro.';
        return;
    }
    if (!impacto || !urgencia) {
        resultDiv.textContent = 'Seleccione impacto y urgencia.';
        return;
    }
    let prioridad;
    let clase;
    if (impacto === 'Alto' && urgencia === 'Inmediata') {
        prioridad = '🔴 Alta';
        clase = 'alta';
    } else if (impacto === 'Alto' || urgencia === '30 días') {
        prioridad = '🟠 Media';
        clase = 'media';
    } else {
        prioridad = '🟢 Baja';
        clase = 'baja';
    }
    // Guardamos prioridad en registro
    reg.prioridad = prioridad;
    reg.prioridadClass = clase;
    resultDiv.innerHTML = 'Prioridad: <span class="badge ' + clase + '">' + prioridad + '</span>';
    updateTable();
});

// Actualizar tabla manualmente
document.getElementById('btn-actualizar').addEventListener('click', () => {
    updateTable();
});

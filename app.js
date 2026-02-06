// Demo Normativas Seguros – lógica cliente sin backend

// Almacenamiento de registros con persistencia en localStorage
let registros = [];
try {
    const saved = localStorage.getItem('registros');
    if (saved) {
        registros = JSON.parse(saved);
    }
} catch (e) {
    console.error('Error al cargar registros de localStorage', e);
    registros = [];
}

// Variable global para detectar modo edición
let codigoEditando = null;

// Guarda los registros en localStorage para persistirlos
function saveRegistros() {
    try {
        localStorage.setItem('registros', JSON.stringify(registros));
    } catch (e) {
        console.error('Error al guardar registros en localStorage', e);
    }
}

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
    const articleRegex = /(?:Artículo|Art\.?)[\s]+[0-9IVXLCDM]+/gi;
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

// Checklist de tareas predeterminado
const CHECKLIST = [
    { tarea: 'Leer norma completa y confirmar alcance', area: 'Gobierno/Compliance', plazo: '+3 días' },
    { tarea: 'Listar artículos/puntos modificados', area: 'Gobierno/Compliance', plazo: '+7 días' },
    { tarea: 'Relevar cambios técnicos y estimar esfuerzo', area: 'Sistemas', plazo: '+14 días' },
    { tarea: 'Evaluar impacto operativo/financiero', area: 'Finanzas/Actuarial', plazo: '+21 días' },
    { tarea: 'Plan + pruebas + evidencia', area: 'Sistemas + Compliance', plazo: '+30 días' }
];

// Diccionario de referencias normativas (explicaciones breves)
const REF_EXPLANATIONS = {
    'Ley 20091': 'La Ley 20.091 regula la actividad aseguradora en Argentina y establece las bases del control y funcionamiento de las entidades de seguros.',
    'RGAA': 'Reglamento General de la Actividad Aseguradora, conjunto de normas que complementan la Ley 20.091 y regulan detalles operativos y técnicos.'
};

function detectChangesAndRefs(text, hasModificaciones) {
    const cambios = [];
    if (hasModificaciones) {
        cambios.push('Reemplaza/actualiza texto normativo previo.');
    }
    // Detecta si hay especificaciones técnicas mencionadas
    if (/(manual|validaci[\u00f3o]n|formato)/i.test(text)) {
        cambios.push('Introduce/actualiza especificaciones técnicas (manual, validaciones, formatos).');
    }
    // Detecta referencias legislativas (Ley, RGAA)
    const refSet = new Set();
    const leyRegex = /Ley\s*([0-9\.]+)/ig;
    let match;
    while ((match = leyRegex.exec(text)) !== null) {
        refSet.add('Ley ' + match[1].replace(/\./g, ''));
    }
    if (/RGAA/i.test(text)) {
        refSet.add('RGAA');
    }
    const referencias = Array.from(refSet).map(ref => {
        const key = ref.replace(/\s+/g, '');
        return { ref, desc: REF_EXPLANATIONS[key] || 'Referencia identificada en el texto. Se requiere análisis adicional para su interpretación.' };
    });
    return { cambios, referencias };
}

function updateTable() {
    const tbody = document.getElementById('tabla-registros');
    tbody.innerHTML = '';
    registros.forEach(reg => {
        const tr = document.createElement('tr');
        // Construir celda de prioridad con badge según clase
        const prioridadHtml = reg.prioridad ? `<span class="badge ${reg.prioridadClass}">${reg.prioridad}</span>` : '';
        tr.innerHTML = `<td>${reg.codigo}</td>
            <td>${reg.titulo}</td>
            <td>${reg.tema || ''}</td>
            <td>${reg.estado || 'Nueva'}</td>
            <td>${prioridadHtml}</td>
            <td>${reg.responsable}</td>
            <td>
                <button class="accion-btn editar-btn" data-codigo="${reg.codigo}">Editar</button>
                <button class="accion-btn eliminar-btn" data-codigo="${reg.codigo}">Eliminar</button>
            </td>`;
        tbody.appendChild(tr);
    });
    // Guardamos la tabla en localStorage para persistencia
    saveRegistros();
}

// Delegación de eventos para botones de edición y eliminación en la tabla
document.getElementById('tabla-registros').addEventListener('click', (e) => {
    const target = e.target;
    const codigo = target.getAttribute('data-codigo');
    if (!codigo) return;
    if (target.classList.contains('editar-btn')) {
        // Buscar registro y rellenar formulario con sus datos
        const reg = registros.find(r => r.codigo === codigo);
        if (!reg) return;
        codigoEditando = codigo;
        // Rellenar formulario de registro
        document.getElementById('codigo').value = reg.codigo;
        document.getElementById('fuente').value = reg.fuente;
        document.getElementById('titulo').value = reg.titulo;
        document.getElementById('fecha').value = reg.fecha;
        document.getElementById('tipo').value = reg.tipo;
        document.getElementById('link').value = reg.link;
        document.getElementById('responsable').value = reg.responsable;
        document.getElementById('msg-registro').textContent = 'Editando registro existente. Modifique los campos y vuelva a guardar.';
    } else if (target.classList.contains('eliminar-btn')) {
        // Eliminar registro
        const confirmDelete = confirm('¿Está seguro de que desea eliminar este registro?');
        if (!confirmDelete) return;
        registros = registros.filter(r => r.codigo !== codigo);
        // Actualizar y guardar
        updateTable();
        document.getElementById('msg-registro').textContent = 'Registro eliminado.';
    }
});

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
    if (codigoEditando) {
        // Estamos editando un registro existente
        const index = registros.findIndex(r => r.codigo === codigoEditando);
        if (index !== -1) {
            // Actualizar campos; permitimos cambiar el código siempre que no duplique
            if (codigo !== codigoEditando && registros.some(r => r.codigo === codigo)) {
                msgDiv.textContent = 'Ya existe otro registro con ese código.';
                return;
            }
            registros[index] = {
                ...registros[index],
                codigo,
                fuente,
                titulo,
                fecha,
                tipo,
                link,
                responsable
            };
            msgDiv.textContent = 'Registro actualizado correctamente.';
        }
        codigoEditando = null;
    } else {
        // Creación de nuevo registro
        if (registros.find(r => r.codigo === codigo)) {
            msgDiv.textContent = 'Ese código ya existe.';
            return;
        }
        registros.push({ codigo, fuente, titulo, fecha, tipo, link, responsable, estado: 'Nueva', prioridad: '', prioridadClass: '' });
        msgDiv.textContent = 'Registro creado correctamente.';
    }
    // Limpiar formulario y actualizar tabla
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
    // Construir checklist accionable
    const checklistDiv = document.getElementById('resultado-checklist');
    if (CHECKLIST.length > 0) {
        let chkHtml = '<strong>Checklist accionable:</strong><table><thead><tr><th>Tarea</th><th>Área</th><th>Plazo</th></tr></thead><tbody>';
        CHECKLIST.forEach(item => {
            chkHtml += `<tr><td>${item.tarea}</td><td>${item.area}</td><td>${item.plazo}</td></tr>`;
        });
        chkHtml += '</tbody></table>';
        checklistDiv.innerHTML = chkHtml;
    } else {
        checklistDiv.innerHTML = '';
    }
    // Detectar cambios y referencias
    const extra = detectChangesAndRefs(texto, analisis.modificaciones !== '');
    const cambiosDiv = document.getElementById('resultado-cambios');
    if (extra.cambios.length > 0) {
        let cambHtml = '<strong>Qué cambia:</strong><ul>';
        extra.cambios.forEach(c => { cambHtml += `<li>${c}</li>`; });
        cambHtml += '</ul>';
        cambiosDiv.innerHTML = cambHtml;
    } else {
        cambiosDiv.innerHTML = '';
    }
    const refsDiv = document.getElementById('resultado-referencias');
    if (extra.referencias.length > 0) {
        let refHtml = '<strong>Referencias:</strong><ul>';
        extra.referencias.forEach(r => {
            refHtml += `<li><strong>${r.ref}</strong>: ${r.desc}</li>`;
        });
        refHtml += '</ul>';
        refsDiv.innerHTML = refHtml;
    } else {
        refsDiv.innerHTML = '';
    }
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
        prioridad = '🔶 Media';
        clase = 'media';
    } else {
        prioridad = '🔵 Baja';
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

// Al cargar la página, mostrar los registros existentes
document.addEventListener('DOMContentLoaded', () => {
    updateTable();
});

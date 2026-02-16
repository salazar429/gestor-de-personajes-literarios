let personajesActuales = [];

async function cargarPersonajesDeObra(obraId) {
    try {
        personajesActuales = await obtenerPersonajesPorObra(obraId);
        actualizarListaPersonajes();
    } catch (error) {
        console.error('Error al cargar personajes:', error);
        mostrarError('Error al cargar los personajes');
    }
}

function actualizarListaPersonajes() {
    const container = document.getElementById('personajes-container');
    const filtroGenero = document.getElementById('filtro-genero').value;
    const filtroRol = document.getElementById('filtro-rol').value;
    
    let personajesFiltrados = personajesActuales;
    
    if (filtroGenero) {
        personajesFiltrados = personajesFiltrados.filter(p => p.genero === filtroGenero);
    }
    
    if (filtroRol) {
        personajesFiltrados = personajesFiltrados.filter(p => p.rol === filtroRol);
    }
    
    if (personajesFiltrados.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">👤</div>
                <h3>No hay personajes en esta obra</h3>
                <p>Crea tu primer personaje para "${obraActual.titulo}"</p>
                <button onclick="abrirModalNuevoPersonaje()" class="btn-primario">
                    + Crear Personaje
                </button>
            </div>
        `;
        return;
    }
    
    container.innerHTML = personajesFiltrados.map(personaje => `
        <div class="tarjeta-personaje genero-${personaje.genero}" data-id="${personaje.id}">
            <div class="tarjeta-header">
                <h3>${escapeHTML(personaje.nombre)}</h3>
                <span class="rol-badge rol-${personaje.rol}">${personaje.rol}</span>
            </div>
            <div class="personaje-info">
                <span class="genero-badge genero-${personaje.genero}">
                    ${personaje.genero === 'masculino' ? '🟦' : personaje.genero === 'femenino' ? '🟪' : '🟩'} 
                    ${personaje.genero}
                </span>
                ${personaje.edad ? `<span class="edad">${personaje.edad} años</span>` : ''}
            </div>
            ${personaje.personalidad ? `
                <div class="personalidad">
                    <strong>Personalidad:</strong> ${escapeHTML(personaje.personalidad)}
                </div>
            ` : ''}
            <div class="acciones-tarjeta">
                <button class="btn-icono" onclick="abrirModalEditarPersonaje(${personaje.id})" title="Editar">✏️</button>
                <button class="btn-icono" onclick="abrirModalEliminarPersonaje(${personaje.id})" title="Eliminar">🗑️</button>
            </div>
        </div>
    `).join('');
}

function abrirModalNuevoPersonaje() {
    if (!obraActual) return;
    
    document.getElementById('modal-personaje-titulo').textContent = 'Nuevo Personaje';
    document.getElementById('form-personaje').reset();
    document.getElementById('personaje-id').value = '';
    document.getElementById('personaje-obra-id').value = obraActual.id;
    document.getElementById('modal-personaje').style.display = 'block';
}

function abrirModalEditarPersonaje(id) {
    const personaje = personajesActuales.find(p => p.id === id);
    if (!personaje) return;
    
    document.getElementById('modal-personaje-titulo').textContent = 'Editar Personaje';
    document.getElementById('personaje-id').value = personaje.id;
    document.getElementById('personaje-obra-id').value = personaje.obraId;
    document.getElementById('nombre').value = personaje.nombre;
    document.getElementById('genero').value = personaje.genero;
    document.getElementById('rol').value = personaje.rol;
    document.getElementById('edad').value = personaje.edad || '';
    document.getElementById('personalidad').value = personaje.personalidad || '';
    document.getElementById('historia').value = personaje.historia || '';
    
    document.getElementById('modal-personaje').style.display = 'block';
}

function cerrarModalPersonaje() {
    document.getElementById('modal-personaje').style.display = 'none';
}

async function guardarPersonajeForm(event) {
    event.preventDefault();
    
    const personaje = {
        id: document.getElementById('personaje-id').value || null,
        obraId: parseInt(document.getElementById('personaje-obra-id').value),
        nombre: document.getElementById('nombre').value.trim(),
        genero: document.getElementById('genero').value,
        rol: document.getElementById('rol').value,
        edad: document.getElementById('edad').value ? parseInt(document.getElementById('edad').value) : null,
        personalidad: document.getElementById('personalidad').value.trim() || null,
        historia: document.getElementById('historia').value.trim() || null
    };
    
    if (!personaje.nombre || !personaje.genero || !personaje.rol) {
        alert('Por favor completa los campos obligatorios');
        return;
    }
    
    try {
        await guardarPersonaje(personaje);
        cerrarModalPersonaje();
        await cargarPersonajesDeObra(personaje.obraId);
        await actualizarContadorPersonajes(personaje.obraId);
    } catch (error) {
        console.error('Error al guardar personaje:', error);
        alert('Error al guardar el personaje');
    }
}

// Event Listeners
document.getElementById('form-personaje').addEventListener('submit', guardarPersonajeForm);
document.getElementById('nuevo-personaje').addEventListener('click', abrirModalNuevoPersonaje);
document.getElementById('filtro-genero').addEventListener('change', actualizarListaPersonajes);
document.getElementById('filtro-rol').addEventListener('change', actualizarListaPersonajes);
document.getElementById('ver-todos').addEventListener('click', () => {
    document.getElementById('filtro-genero').value = '';
    document.getElementById('filtro-rol').value = '';
    actualizarListaPersonajes();
});
